export type PredictionOutcome = 'home' | 'draw' | 'away';
export type PredictionType = 'exact_score' | 'outcome_only';
export type ScoreOutcome = 'exact' | 'correct' | 'missed';

export type MatchScoringRow = {
  home_score: number;
  away_score: number;
  kickoff_at: string;
  home_team_id: string;
  away_team_id: string;
  espn_home_win_pct: number | null;
  espn_draw_pct: number | null;
  espn_away_win_pct: number | null;
};

export type PredictionScoringRow = {
  id: string;
  user_id: string;
  match_id: string;
  prediction_type: PredictionType | null;
  home_score: number | null;
  away_score: number | null;
  predicted_outcome: PredictionOutcome | null;
  is_risk_pick: boolean;
  matches: MatchScoringRow;
};

export type TeamSignalRow = {
  id: string;
  fifa_rank: number | null;
};

export type CommunityDistribution = {
  total: number;
  home: number;
  draw: number;
  away: number;
};

export type CalculatedScore = {
  prediction_id: string;
  user_id: string;
  match_kickoff_at: string;
  outcome: ScoreOutcome;
  exact_score: number;
  correct_outcome: number;
  goal_difference_bonus: number;
  team_score_bonus: number;
  streak_bonus: number;
  risk_multiplier: number;
  underdog_bonus: number;
  total: number;
  scoring_version: string;
  calculated_at: string;
};

export const SCORING_VERSION = 'smart-2026-06-23-bonuses';

function getOutcome(score: { home_score: number; away_score: number }): PredictionOutcome {
  if (score.home_score > score.away_score) return 'home';
  if (score.home_score < score.away_score) return 'away';
  return 'draw';
}

function getPredictionOutcome(prediction: PredictionScoringRow): ScoreOutcome {
  const actualOutcome = getOutcome(prediction.matches);
  const predictionType = prediction.prediction_type ?? 'exact_score';
  const hasExactScores = typeof prediction.home_score === 'number' && typeof prediction.away_score === 'number';
  const exact = predictionType === 'exact_score'
    && hasExactScores
    && prediction.home_score === prediction.matches.home_score
    && prediction.away_score === prediction.matches.away_score;

  if (exact) return 'exact';
  return prediction.predicted_outcome === actualOutcome ? 'correct' : 'missed';
}

function getPredictedProbability(prediction: PredictionScoringRow) {
  if (prediction.predicted_outcome === 'home') return prediction.matches.espn_home_win_pct;
  if (prediction.predicted_outcome === 'draw') return prediction.matches.espn_draw_pct;
  if (prediction.predicted_outcome === 'away') return prediction.matches.espn_away_win_pct;
  return null;
}

function getRiskMultiplierFromProbability(probability: number | null) {
  if (typeof probability !== 'number') return null;
  if (probability < 15) return 2;
  if (probability < 30) return 1.5;
  if (probability < 45) return 1.25;
  return 1;
}

function getUnderdogTierFromProbability(probability: number | null) {
  if (typeof probability !== 'number') return null;
  if (probability < 15) return 3;
  if (probability < 25) return 2;
  if (probability < 35) return 1;
  return 0;
}

function getPredictedTeamIds(prediction: PredictionScoringRow) {
  if (prediction.predicted_outcome === 'home') {
    return { predictedTeamId: prediction.matches.home_team_id, opponentTeamId: prediction.matches.away_team_id };
  }
  if (prediction.predicted_outcome === 'away') {
    return { predictedTeamId: prediction.matches.away_team_id, opponentTeamId: prediction.matches.home_team_id };
  }
  return null;
}

function getFifaRankGap(prediction: PredictionScoringRow, teams: Map<string, TeamSignalRow>) {
  const teamIds = getPredictedTeamIds(prediction);
  if (!teamIds) return null;

  const predictedRank = teams.get(teamIds.predictedTeamId)?.fifa_rank;
  const opponentRank = teams.get(teamIds.opponentTeamId)?.fifa_rank;
  if (typeof predictedRank !== 'number' || typeof opponentRank !== 'number') return null;
  return predictedRank - opponentRank;
}

function getFifaUnderdogTier(prediction: PredictionScoringRow, teams: Map<string, TeamSignalRow>) {
  const rankGap = getFifaRankGap(prediction, teams);
  if (typeof rankGap !== 'number' || rankGap < 10) return 0;
  if (rankGap >= 50) return 3;
  if (rankGap >= 25) return 2;
  return 1;
}

function getCommunityTier(prediction: PredictionScoringRow, community?: Map<string, CommunityDistribution>) {
  if (!prediction.predicted_outcome) return 0;
  const distribution = community?.get(prediction.match_id);
  if (!distribution || distribution.total < 10) return 0;

  const outcomeCount = distribution[prediction.predicted_outcome];
  const share = (outcomeCount / distribution.total) * 100;
  if (share < 15) return 3;
  if (share < 25) return 2;
  if (share < 35) return 1;
  return 0;
}

function getFallbackRiskMultiplier(prediction: PredictionScoringRow, teams: Map<string, TeamSignalRow>, community?: Map<string, CommunityDistribution>) {
  if (prediction.predicted_outcome === 'draw') {
    return getCommunityTier(prediction, community) >= 2 ? 1.5 : 1;
  }

  const rankGap = getFifaRankGap(prediction, teams);
  return typeof rankGap === 'number' && rankGap > 0 ? 1.5 : 1;
}

function getRiskMultiplier(prediction: PredictionScoringRow, teams: Map<string, TeamSignalRow>, community?: Map<string, CommunityDistribution>) {
  if (!prediction.is_risk_pick) return 1;
  return getRiskMultiplierFromProbability(getPredictedProbability(prediction)) ?? getFallbackRiskMultiplier(prediction, teams, community);
}

function getUnderdogBonus(prediction: PredictionScoringRow, teams: Map<string, TeamSignalRow>, community?: Map<string, CommunityDistribution>) {
  const espnTier = getUnderdogTierFromProbability(getPredictedProbability(prediction));
  if (espnTier !== null) return espnTier;

  const fifaTier = getFifaUnderdogTier(prediction, teams);
  const communityTier = getCommunityTier(prediction, community);
  return Math.min(3, fifaTier + Math.floor(communityTier / 2));
}

function calculateBaseScore(prediction: PredictionScoringRow, calculatedAt: string): CalculatedScore {
  const outcome = getPredictionOutcome(prediction);
  const predictionType = prediction.prediction_type ?? 'exact_score';
  const actualOutcome = getOutcome(prediction.matches);
  const hasExactScores = typeof prediction.home_score === 'number' && typeof prediction.away_score === 'number';
  const exactScore = outcome === 'exact' ? 5 : 0;
  const correctOutcome = outcome === 'correct' ? 2 : 0;
  const canScoreBonuses = predictionType === 'exact_score' && hasExactScores && outcome === 'correct';
  const predictedGoalDifference = hasExactScores ? prediction.home_score! - prediction.away_score! : null;
  const actualGoalDifference = prediction.matches.home_score - prediction.matches.away_score;
  const goalDifferenceBonus = canScoreBonuses && actualOutcome !== 'draw' && predictedGoalDifference === actualGoalDifference ? 1 : 0;
  const teamScoreBonus = canScoreBonuses && (prediction.home_score === prediction.matches.home_score || prediction.away_score === prediction.matches.away_score) ? 1 : 0;

  return {
    prediction_id: prediction.id,
    user_id: prediction.user_id,
    match_kickoff_at: prediction.matches.kickoff_at,
    outcome,
    exact_score: exactScore,
    correct_outcome: correctOutcome,
    goal_difference_bonus: goalDifferenceBonus,
    team_score_bonus: teamScoreBonus,
    streak_bonus: 0,
    risk_multiplier: 1,
    underdog_bonus: 0,
    total: 0,
    scoring_version: SCORING_VERSION,
    calculated_at: calculatedAt,
  };
}

function finalizeTotal(score: CalculatedScore) {
  if (score.outcome === 'missed') return { ...score, total: 0, streak_bonus: 0, underdog_bonus: 0 };

  const preMultiplierTotal = score.exact_score
    + score.correct_outcome
    + score.goal_difference_bonus
    + score.team_score_bonus
    + score.streak_bonus
    + score.underdog_bonus;

  return { ...score, total: Math.round(preMultiplierTotal * score.risk_multiplier) };
}

export function buildCommunityDistributions(predictions: PredictionScoringRow[]) {
  const distributions = new Map<string, CommunityDistribution>();

  for (const prediction of predictions) {
    if (!prediction.predicted_outcome) continue;
    const current = distributions.get(prediction.match_id) ?? { total: 0, home: 0, draw: 0, away: 0 };
    current.total += 1;
    current[prediction.predicted_outcome] += 1;
    distributions.set(prediction.match_id, current);
  }

  return distributions;
}

export function calculatePredictionScores(
  predictions: PredictionScoringRow[],
  options: { teams?: Map<string, TeamSignalRow>; community?: Map<string, CommunityDistribution>; calculatedAt?: string } = {}
) {
  const teams = options.teams ?? new Map<string, TeamSignalRow>();
  const community = options.community ?? buildCommunityDistributions(predictions);
  const calculatedAt = options.calculatedAt ?? new Date().toISOString();
  const byUser = new Map<string, Array<{ prediction: PredictionScoringRow; score: CalculatedScore }>>();

  for (const prediction of predictions) {
    const baseScore = calculateBaseScore(prediction, calculatedAt);
    const riskMultiplier = getRiskMultiplier(prediction, teams, community);
    const underdogBonus = baseScore.outcome === 'missed' ? 0 : getUnderdogBonus(prediction, teams, community);
    const score = { ...baseScore, risk_multiplier: riskMultiplier, underdog_bonus: underdogBonus };
    byUser.set(prediction.user_id, [...(byUser.get(prediction.user_id) ?? []), { prediction, score }]);
  }

  const scores: CalculatedScore[] = [];
  for (const userItems of byUser.values()) {
    const ordered = [...userItems].sort((first, second) => {
      const kickoffOrder = first.score.match_kickoff_at.localeCompare(second.score.match_kickoff_at);
      return kickoffOrder || first.score.prediction_id.localeCompare(second.score.prediction_id);
    });
    let currentStreak = 0;

    for (const item of ordered) {
      if (item.score.outcome === 'missed') {
        currentStreak = 0;
        scores.push(finalizeTotal(item.score));
        continue;
      }

      const streakBonus = currentStreak >= 1 ? 1 : 0;
      currentStreak += 1;
      scores.push(finalizeTotal({ ...item.score, streak_bonus: streakBonus }));
    }
  }

  const scoreByPredictionId = new Map(scores.map((score) => [score.prediction_id, score]));
  return predictions.map((prediction) => scoreByPredictionId.get(prediction.id)!);
}
