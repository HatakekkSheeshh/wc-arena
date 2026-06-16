import { Router } from 'express';
import { readDb } from '../db/jsonDb';
import { calculateGlobalLeaderboard } from '../services/leaderboardService';

export const leaderboardRouter = Router();

leaderboardRouter.get('/leaderboard/global', (_req, res) => {
  res.json(calculateGlobalLeaderboard(readDb()));
});

leaderboardRouter.get('/leaderboard/leagues/:leagueId', (req, res) => {
  const db = readDb();
  const league = db.leagues.find((item) => item.id === req.params.leagueId);
  if (!league) return res.status(404).json({ error: { code: 'not_found', message: 'League not found.' } });
  return res.json({ league, standings: calculateGlobalLeaderboard(db) });
});
