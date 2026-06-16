import { Router } from 'express';
import { readDb } from '../db/jsonDb';

export const prizePoolRouter = Router();

prizePoolRouter.get('/prize-pool', (_req, res) => {
  const db = readDb();
  res.json({ summary: db.prizePoolSummary, tiers: db.prizeTiers });
});
