import { Router } from 'express';
import { readDb, updateDb } from '../db/jsonDb';
import { addActivity } from '../services/activityService';
import type { CreateLeaguePayload } from '../types';

export const leaguesRouter = Router();
const currentUserId = 'user-you';

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

leaguesRouter.get('/leagues/me', (_req, res) => {
  res.json(readDb().leagues);
});

leaguesRouter.get('/leagues/:id', (req, res) => {
  const db = readDb();
  const league = db.leagues.find((item) => item.id === req.params.id);
  if (!league) return res.status(404).json({ error: { code: 'not_found', message: 'League not found.' } });
  return res.json({ league, members: db.users, activity: db.activity.filter((item) => item.leagueId === league.id) });
});

leaguesRouter.post('/leagues', (req, res) => {
  const payload = req.body as CreateLeaguePayload;
  if (!payload.name || payload.name.trim().length < 3) {
    return res.status(400).json({ error: { code: 'validation_error', message: 'League name must be at least 3 characters.' } });
  }

  const league = updateDb((db) => {
    const now = new Date().toISOString();
    const slug = slugify(payload.name);
    const created = {
      id: `league-${slug}-${Date.now()}`,
      name: payload.name.trim(),
      slug,
      creatorId: currentUserId,
      visibility: payload.visibility ?? 'private',
      inviteCode: slug.slice(0, 8).toUpperCase() || 'LEAGUE26',
      memberCount: 1,
      scoringMode: payload.scoringMode ?? 'global',
      recognitionMode: payload.recognitionMode ?? payload.prizeMode ?? 'none',
      createdAt: now,
    };
    db.leagues.push(created);
    addActivity(db, {
      type: 'league_joined',
      title: `Created ${created.name}`,
      description: 'A new skill-based prediction league is ready for invites.',
      userId: currentUserId,
      leagueId: created.id,
      href: `/leagues/${created.id}`,
      createdAt: now,
    });
    return created;
  });

  return res.status(201).json(league);
});

leaguesRouter.post('/leagues/join', (req, res) => {
  const inviteCode = String(req.body?.inviteCode ?? '').trim().toUpperCase();
  const league = updateDb((db) => {
    const existing = db.leagues.find((item) => item.inviteCode.toUpperCase() === inviteCode);
    if (!existing) return undefined;
    existing.memberCount += 1;
    addActivity(db, {
      type: 'league_joined',
      title: `Joined ${existing.name}`,
      description: 'You joined a prediction league with global scoring rules.',
      userId: currentUserId,
      leagueId: existing.id,
      href: `/leagues/${existing.id}`,
    });
    return existing;
  });

  if (!league) return res.status(404).json({ error: { code: 'not_found', message: 'Invite code not found.' } });
  return res.json(league);
});
