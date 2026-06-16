import { calculateAccuracy, calculatePredictionScore, calculateStreak } from '../../src/lib/scoring';
import type { LeaderboardEntry, MatchResult } from '../../src/types/domain';
import type { PredictDb } from '../types';

function getMatchResult(db: PredictDb, matchId: string): MatchResult | undefined {
  const match = db.matches.find((item) => item.id === matchId);
  if (!match || typeof match.homeScore !== 'number' || typeof match.awayScore !== 'number') return undefined;
  return { homeScore: match.homeScore, awayScore: match.awayScore };
}

export function calculateGlobalLeaderboard(db: PredictDb): LeaderboardEntry[] {
  const entries = db.users.map((user) => {
    const predictions = db.predictions.filter((prediction) => prediction.userId === user.id);
    const scoredItems = predictions.map((prediction) => ({ prediction, result: getMatchResult(db, prediction.matchId) }));
    const points = predictions.reduce((sum, prediction) => {
      const result = getMatchResult(db, prediction.matchId);
      if (!result) return sum;
      return sum + calculatePredictionScore(prediction, result, { riskMultiplier: prediction.isRiskPick ? 1 : 1 }).total;
    }, 0);

    return {
      userId: user.id,
      rank: 0,
      previousRank: user.rank,
      points,
      exactScores: predictions.filter((prediction) => {
        const result = getMatchResult(db, prediction.matchId);
        return result && prediction.homeScore === result.homeScore && prediction.awayScore === result.awayScore;
      }).length,
      accuracy: calculateAccuracy(scoredItems),
      streak: calculateStreak(scoredItems),
    };
  });

  return entries
    .sort((a, b) => b.points - a.points || b.exactScores - a.exactScores || b.accuracy - a.accuracy)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}
