import type { Prediction } from '../types/domain';
import { currentUserId } from './mockUsers';

export const mockPredictions: Prediction[] = [
  { id: 'pred-bra-esp', userId: currentUserId, matchId: 'm-bra-esp', homeScore: 2, awayScore: 1, predictedOutcome: 'home', confidence: 82, isRiskPick: false, createdAt: '2026-06-10T10:00:00Z', updatedAt: '2026-06-12T12:15:00Z', lockedAt: '2026-06-12T17:45:00Z', status: 'scored', revision: 2 },
  { id: 'pred-fra-arg', userId: currentUserId, matchId: 'm-fra-arg', homeScore: 2, awayScore: 1, predictedOutcome: 'home', confidence: 61, isRiskPick: false, createdAt: '2026-06-10T11:00:00Z', updatedAt: '2026-06-12T14:30:00Z', lockedAt: '2026-06-12T20:45:00Z', status: 'scored', revision: 1 },
  { id: 'pred-jpn-mex', userId: currentUserId, matchId: 'm-jpn-mex', homeScore: 0, awayScore: 2, predictedOutcome: 'away', confidence: 74, isRiskPick: true, createdAt: '2026-06-11T08:00:00Z', updatedAt: '2026-06-13T09:20:00Z', lockedAt: '2026-06-13T14:45:00Z', status: 'scored', revision: 3 },
  { id: 'pred-ger-mar', userId: currentUserId, matchId: 'm-ger-mar', homeScore: 2, awayScore: 0, predictedOutcome: 'home', confidence: 68, isRiskPick: false, createdAt: '2026-06-13T13:00:00Z', updatedAt: '2026-06-14T08:15:00Z', lockedAt: '2026-06-14T17:45:00Z', status: 'locked', revision: 1 },
  { id: 'pred-usa-kor', userId: currentUserId, matchId: 'm-usa-kor', homeScore: 3, awayScore: 1, predictedOutcome: 'home', confidence: 70, isRiskPick: false, createdAt: '2026-06-14T10:00:00Z', updatedAt: '2026-06-14T10:00:00Z', status: 'submitted', revision: 1 },
];
