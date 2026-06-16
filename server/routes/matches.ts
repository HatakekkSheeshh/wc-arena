import { Router } from 'express';
import { readDb } from '../db/jsonDb';

export const matchesRouter = Router();
const currentUserId = 'user-you';

matchesRouter.get('/matches', (_req, res) => {
  const db = readDb();
  res.json([...db.matches].sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime()));
});

matchesRouter.get('/matches/:id', (req, res) => {
  const db = readDb();
  const match = db.matches.find((item) => item.id === req.params.id);
  if (!match) return res.status(404).json({ error: { code: 'not_found', message: 'Match not found.' } });

  return res.json({
    match,
    homeTeam: db.teams.find((team) => team.id === match.homeTeamId),
    awayTeam: db.teams.find((team) => team.id === match.awayTeamId),
    prediction: db.predictions.find((prediction) => prediction.userId === currentUserId && prediction.matchId === match.id),
  });
});
