import { Router } from 'express';
import { readDb, updateDb } from '../db/jsonDb';
import type { OnboardingPayload } from '../types';

export const meRouter = Router();
const currentUserId = 'user-you';

meRouter.get('/me', (_req, res) => {
  const db = readDb();
  res.json(db.users.find((user) => user.id === currentUserId));
});

meRouter.patch('/me/onboarding', (req, res) => {
  const payload = req.body as OnboardingPayload;
  const user = updateDb((db) => {
    const existing = db.users.find((item) => item.id === currentUserId);
    if (!existing) return undefined;
    if (payload.username) existing.username = payload.username;
    if (payload.countryCode) existing.countryCode = payload.countryCode;
    if (payload.fanClubTeamId) existing.fanClubTeamId = payload.fanClubTeamId;
    return existing;
  });

  if (!user) return res.status(404).json({ error: { code: 'not_found', message: 'Current user not found.' } });
  return res.json(user);
});
