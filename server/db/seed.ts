import { mockActivity } from '../../src/data/mockActivity';
import { mockAdminAuditLogs, mockSuspiciousUserSignals } from '../../src/data/mockAdmin';
import { mockBadges } from '../../src/data/mockBadges';
import { mockLeaderboard } from '../../src/data/mockLeaderboard';
import { mockLeagues } from '../../src/data/mockLeagues';
import { mockMatches } from '../../src/data/mockMatches';
import { mockPredictions } from '../../src/data/mockPredictions';
import { mockPointsGuideSummary, mockRecognitionTiers } from '../../src/data/mockPointsGuide';
import { mockEligibilityChecks, mockRewards, mockRewardTrustNotes } from '../../src/data/mockRewards';
import { mockTeams } from '../../src/data/mockTeams';
import { mockUsers } from '../../src/data/mockUsers';
import type { PredictDb } from '../types';

export function createSeedDb(): PredictDb {
  return {
    users: structuredClone(mockUsers),
    teams: structuredClone(mockTeams),
    matches: structuredClone(mockMatches),
    predictions: structuredClone(mockPredictions),
    badges: structuredClone(mockBadges),
    leaderboardEntries: structuredClone(mockLeaderboard),
    leagues: structuredClone(mockLeagues),
    activity: structuredClone(mockActivity),
    pointsGuideSummary: structuredClone(mockPointsGuideSummary),
    recognitionTiers: structuredClone(mockRecognitionTiers),
    eligibilityChecks: structuredClone(mockEligibilityChecks),
    rewards: structuredClone(mockRewards),
    rewardTrustNotes: structuredClone(mockRewardTrustNotes),
    adminAuditLogs: structuredClone(mockAdminAuditLogs),
    suspiciousUserSignals: structuredClone(mockSuspiciousUserSignals),
  };
}
