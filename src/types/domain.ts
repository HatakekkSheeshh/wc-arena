export type MatchStatus = 'scheduled' | 'open' | 'locked' | 'live' | 'finished' | 'postponed' | 'cancelled';
export type PredictionStatus = 'draft' | 'submitted' | 'locked' | 'scored' | 'void';
export type PredictionDisplayStatus = 'pending' | 'locked' | 'exact' | 'correct' | 'missed';
export type MatchStage = 'group' | 'round16' | 'quarter' | 'semi' | 'final';
export type MatchOutcome = 'home' | 'away' | 'draw';

export type User = {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  countryCode?: string;
  fanClubTeamId?: string;
  role: 'user' | 'admin';
  points: number;
  rank?: number;
  accuracy?: number;
  exactScores: number;
  currentStreak: number;
  bestStreak: number;
  createdAt: string;
};

export type Team = {
  id: string;
  name: string;
  shortName: string;
  countryCode: string;
  fifaRank?: number;
  group?: string;
};

export type Match = {
  id: string;
  stage: MatchStage;
  group?: string;
  matchday?: number;
  homeTeamId: string;
  awayTeamId: string;
  kickoffAt: string;
  lockAt: string;
  stadium: string;
  city: string;
  status: MatchStatus;
  homeScore?: number;
  awayScore?: number;
  resultUpdatedAt?: string;
};

export type Prediction = {
  id: string;
  userId: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
  confidence: number;
  isRiskPick: boolean;
  createdAt: string;
  updatedAt: string;
  lockedAt?: string;
  status: PredictionStatus;
  revision: number;
};

export type MatchResult = {
  homeScore: number;
  awayScore: number;
};

export type ScoreBreakdown = {
  predictionId: string;
  exactScore: number;
  correctOutcome: number;
  streakBonus: number;
  riskMultiplier: number;
  underdogBonus: number;
  total: number;
  scoringVersion: string;
  calculatedAt: string;
};

export type LeaderboardEntry = {
  userId: string;
  rank: number;
  previousRank?: number;
  points: number;
  exactScores: number;
  accuracy: number;
  streak: number;
};

export type Badge = {
  id: string;
  name: string;
  description: string;
  category: 'skill' | 'streak' | 'risk' | 'rank' | 'social' | 'event';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  iconPath?: string;
  unlockedAt?: string;
  progressCurrent?: number;
  progressTarget?: number;
};

export type PrizeTier = {
  id: string;
  label: string;
  amount: number;
  rankStart: number;
  rankEnd: number;
  sponsorFunded: boolean;
};

export type League = {
  id: string;
  name: string;
  slug: string;
  creatorId: string;
  visibility: 'private' | 'public';
  inviteCode: string;
  memberCount: number;
  scoringMode: 'global' | 'custom';
  prizeMode: 'none' | 'symbolic' | 'sponsor' | 'manual';
  createdAt: string;
};

export type ActivityItem = {
  id: string;
  type: 'prediction_locked' | 'score_calculated' | 'badge_unlocked' | 'rank_changed' | 'league_joined';
  title: string;
  description: string;
  createdAt: string;
  userId?: string;
  matchId?: string;
  predictionId?: string;
  badgeId?: string;
  leagueId?: string;
  href?: string;
};

export type RewardStatus = 'pending' | 'approved' | 'paid' | 'ineligible';
export type EligibilityStatus = 'passed' | 'review' | 'blocked';

export type EligibilityCheck = {
  id: string;
  label: string;
  description: string;
  status: EligibilityStatus;
  href?: string;
};

export type RewardItem = {
  id: string;
  userId: string;
  title: string;
  period: string;
  placement: string;
  amount: number;
  currency: string;
  source: 'sponsor' | 'community' | 'manual';
  status: RewardStatus;
  updatedAt: string;
  note: string;
};

export type RewardTrustNote = {
  id: string;
  title: string;
  description: string;
};

export type AdminAuditAction =
  | 'admin_login'
  | 'match_result_imported'
  | 'prediction_revision_recorded'
  | 'score_recalculation_preview'
  | 'suspicious_user_review'
  | 'reward_review_queued';

export type AdminAuditLog = {
  id: string;
  actorId: string;
  action: AdminAuditAction;
  entityType: 'match' | 'prediction' | 'leaderboard' | 'user' | 'reward' | 'system';
  entityId: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  createdAt: string;
};

export type SuspiciousUserSignal = {
  id: string;
  userId: string;
  label: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  status: 'watch' | 'review' | 'cleared';
  createdAt: string;
};

export type AdminChecklistItem = {
  id: string;
  label: string;
  description: string;
  status: 'ready' | 'planned' | 'blocked';
};
