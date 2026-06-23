import type { League } from '../types/domain';

export const mockLeagues: League[] = [
  { id: 'league-global', name: 'Global Arena', slug: 'global-arena', creatorId: 'user-goalguru', visibility: 'public', inviteCode: 'GLOBAL26', memberCount: 0, scoringMode: 'global', recognitionMode: 'community', createdAt: '2026-04-01T09:00:00Z' },
  { id: 'league-friends', name: 'Friday Football Crew', slug: 'friday-football-crew', creatorId: 'user-you', visibility: 'private', inviteCode: 'FRI26', memberCount: 18, scoringMode: 'global', recognitionMode: 'symbolic', createdAt: '2026-05-20T18:00:00Z' },
];
