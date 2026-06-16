import { Router } from 'express';
import { readDb } from '../db/jsonDb';

export const badgesRouter = Router();

badgesRouter.get('/badges', (_req, res) => {
  res.json(readDb().badges);
});

badgesRouter.get('/users/:userId/badges', (req, res) => {
  const db = readDb();
  const user = db.users.find((item) => item.id === req.params.userId);
  if (!user) return res.status(404).json({ error: { code: 'not_found', message: 'User not found.' } });
  return res.json(db.badges);
});
