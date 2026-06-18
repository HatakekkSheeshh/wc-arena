import type { ActivityItem, AdminAuditLog, Badge, EligibilityCheck, LeaderboardEntry, League, Match, Prediction, PrizeTier, RewardItem, RewardTrustNote, SuspiciousUserSignal, Team, User } from '../src/types/domain';

export type PrizePoolSummary = {
  totalAmount: number;
  sponsorFundedAmount: number;
  communityBackedAmount: number;
  currency: string;
  eligiblePlayers: number;
};

export type PredictDb = {
  users: User[];
  teams: Team[];
  matches: Match[];
  predictions: Prediction[];
  badges: Badge[];
  leaderboardEntries: LeaderboardEntry[];
  leagues: League[];
  activity: ActivityItem[];
  prizePoolSummary: PrizePoolSummary;
  prizeTiers: PrizeTier[];
  eligibilityChecks: EligibilityCheck[];
  rewards: RewardItem[];
  rewardTrustNotes: RewardTrustNote[];
  adminAuditLogs: AdminAuditLog[];
  suspiciousUserSignals: SuspiciousUserSignal[];
};

export type ApiErrorCode = 'not_found' | 'validation_error' | 'locked' | 'server_error';

export type ApiError = {
  error: {
    code: ApiErrorCode;
    message: string;
  };
};

export type PredictionPayload = {
  matchId: string;
  homeScore: number;
  awayScore: number;
  predictedOutcome: 'home' | 'draw' | 'away';
  confidence?: number;
  isRiskPick?: boolean;
};

export type OnboardingPayload = {
  username?: string;
  countryCode?: string;
  fanClubTeamId?: string;
};

export type CreateLeaguePayload = {
  name: string;
  visibility?: League['visibility'];
  scoringMode?: League['scoringMode'];
  prizeMode?: League['prizeMode'];
};
