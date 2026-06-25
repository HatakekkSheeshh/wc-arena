import type { MatchOutcome, MatchResult, Prediction, ScoreBreakdown } from '../types/domain';

export type ScoringOptions = {
  streakBonus?: number;
  riskMultiplier?: number;
  underdogBonus?: number;
  calculatedAt?: string;
};

export function getOutcome(score: MatchResult): MatchOutcome {
  if (score.homeScore > score.awayScore) return 'home';
  if (score.homeScore < score.awayScore) return 'away';
  return 'draw';
}

export function getPredictionOutcome(prediction: Prediction, matchResult: MatchResult): 'exact' | 'correct' | 'missed' {
  const exact = prediction.predictionType === 'exact_score'
    && typeof prediction.homeScore === 'number'
    && typeof prediction.awayScore === 'number'
    && prediction.homeScore === matchResult.homeScore
    && prediction.awayScore === matchResult.awayScore;

  if (exact) return 'exact';
  return prediction.predictedOutcome === getOutcome(matchResult) ? 'correct' : 'missed';
}

export function calculatePredictionScore(prediction: Prediction, matchResult: MatchResult, options: ScoringOptions = {}): ScoreBreakdown {
  const outcome = getPredictionOutcome(prediction, matchResult);
  const actualOutcome = getOutcome(matchResult);
  const hasExactScores = typeof prediction.homeScore === 'number' && typeof prediction.awayScore === 'number';
  const exactScore = outcome === 'exact' ? 5 : 0;
  const correctOutcome = outcome === 'correct' ? 2 : 0;
  const canScoreBonuses = prediction.predictionType === 'exact_score' && hasExactScores && outcome === 'correct';
  const predictedGoalDifference = hasExactScores ? prediction.homeScore! - prediction.awayScore! : null;
  const actualGoalDifference = matchResult.homeScore - matchResult.awayScore;
  const goalDifferenceBonus = canScoreBonuses && actualOutcome !== 'draw' && predictedGoalDifference === actualGoalDifference ? 1 : 0;
  const teamScoreBonus = canScoreBonuses && (prediction.homeScore === matchResult.homeScore || prediction.awayScore === matchResult.awayScore) ? 1 : 0;
  const streakBonus = outcome === 'missed' ? 0 : options.streakBonus ?? 0;
  const riskMultiplier = prediction.isRiskPick ? options.riskMultiplier ?? 1 : 1;
  const underdogBonus = outcome === 'missed' ? 0 : options.underdogBonus ?? 0;
  const preMultiplierTotal = exactScore + correctOutcome + goalDifferenceBonus + teamScoreBonus + streakBonus + underdogBonus;

  return {
    predictionId: prediction.id,
    exactScore,
    correctOutcome,
    goalDifferenceBonus,
    teamScoreBonus,
    streakBonus,
    riskMultiplier,
    underdogBonus,
    total: outcome === 'missed' ? 0 : Math.round(preMultiplierTotal * riskMultiplier),
    scoringVersion: 'smart-2026-06-23-bonuses',
    calculatedAt: options.calculatedAt ?? new Date().toISOString(),
  };
}

export function calculateAccuracy(items: Array<{ prediction: Prediction; result?: MatchResult }>): number {
  const scored = items.filter((item) => item.result);
  if (scored.length === 0) return 0;

  const correct = scored.filter((item) => item.result && getPredictionOutcome(item.prediction, item.result) !== 'missed').length;
  return Math.round((correct / scored.length) * 100);
}

export function calculateStreak(items: Array<{ prediction: Prediction; result?: MatchResult }>): number {
  let streak = 0;

  for (const item of [...items].reverse()) {
    if (!item.result) continue;
    if (getPredictionOutcome(item.prediction, item.result) === 'missed') break;
    streak += 1;
  }

  return streak;
}
