import { Router } from 'express';
import { readDb } from '../db/jsonDb';

export const prizePoolRouter = Router();

function sendPointsGuide(_req: unknown, res: { json: (body: unknown) => void }) {
  const db = readDb();
  res.json({ summary: db.pointsGuideSummary, tiers: db.recognitionTiers });
}

prizePoolRouter.get('/points-guide', sendPointsGuide);
prizePoolRouter.get('/prize-pool', sendPointsGuide);
