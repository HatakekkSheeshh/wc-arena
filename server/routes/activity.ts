import { Router } from 'express';
import { readDb, updateDb } from '../db/jsonDb';
import { markActivityRead } from '../services/activityService';

export const activityRouter = Router();

activityRouter.get('/activity', (_req, res) => {
  res.json(readDb().activity);
});

activityRouter.patch('/activity/:id/read', (req, res) => {
  const activity = updateDb((db) => markActivityRead(db, req.params.id));
  if (!activity) return res.status(404).json({ error: { code: 'not_found', message: 'Activity item not found.' } });
  return res.json(activity);
});
