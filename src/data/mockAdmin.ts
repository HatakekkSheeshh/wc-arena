import type { AdminAuditLog, AdminChecklistItem, SuspiciousUserSignal } from '../types/domain';

export const mockAdminAuditLogs: AdminAuditLog[] = [
  {
    id: 'audit-score-recalc-preview',
    actorId: 'user-you',
    action: 'score_recalculation_preview',
    entityType: 'leaderboard',
    entityId: 'global',
    description: 'Generated a leaderboard recalculation preview without changing stored standings.',
    severity: 'info',
    createdAt: '2026-06-15T22:20:00Z',
  },
  {
    id: 'audit-prediction-revision',
    actorId: 'system',
    action: 'prediction_revision_recorded',
    entityType: 'prediction',
    entityId: 'pred-usa-kor',
    description: 'Prediction revision count increased before lock time.',
    severity: 'info',
    createdAt: '2026-06-15T20:10:00Z',
  },
  {
    id: 'audit-reward-review',
    actorId: 'user-you',
    action: 'reward_review_queued',
    entityType: 'reward',
    entityId: 'reward-week-1-you',
    description: 'Community recognition track queued for fair-play review.',
    severity: 'warning',
    createdAt: '2026-06-15T19:45:00Z',
  },
  {
    id: 'audit-match-result-import',
    actorId: 'system',
    action: 'match_result_imported',
    entityType: 'match',
    entityId: 'm-jpn-mex',
    description: 'Finished match result imported and made available for scoring.',
    severity: 'info',
    createdAt: '2026-06-13T17:04:00Z',
  },
  {
    id: 'audit-suspicious-review',
    actorId: 'system',
    action: 'suspicious_user_review',
    entityType: 'user',
    entityId: 'user-netbuster',
    description: 'Similar pick timing pattern flagged for admin review.',
    severity: 'warning',
    createdAt: '2026-06-13T16:15:00Z',
  },
];

export const mockSuspiciousUserSignals: SuspiciousUserSignal[] = [
  {
    id: 'signal-netbuster-timing',
    userId: 'user-netbuster',
    label: 'Clustered submission timing',
    description: 'Several picks were submitted within the same short time window as another high-rank account.',
    severity: 'medium',
    status: 'review',
    createdAt: '2026-06-13T16:12:00Z',
  },
  {
    id: 'signal-pitchwizard-domain',
    userId: 'user-pitchwizard',
    label: 'Shared email domain pattern',
    description: 'Email metadata should be reviewed before this player appears in a public recognition tier.',
    severity: 'low',
    status: 'watch',
    createdAt: '2026-06-12T21:30:00Z',
  },
  {
    id: 'signal-you-clean',
    userId: 'user-you',
    label: 'Fair-play review pending',
    description: 'No integrity block is present, but recognition eligibility still needs manual confirmation.',
    severity: 'low',
    status: 'watch',
    createdAt: '2026-06-15T22:00:00Z',
  },
];

export const mockAdminChecklist: AdminChecklistItem[] = [
  {
    id: 'admin-server-time',
    label: 'Server-time locking',
    description: 'Prediction API rejects edits after lock time using server time.',
    status: 'ready',
  },
  {
    id: 'admin-revision-history',
    label: 'Prediction revisions',
    description: 'Prediction updates increment revision counters before lock.',
    status: 'ready',
  },
  {
    id: 'admin-scoring-version',
    label: 'Versioned scoring',
    description: 'Scoring breakdowns include the MVP scoring version.',
    status: 'ready',
  },
  {
    id: 'admin-public-rules',
    label: 'Public rules',
    description: 'Rules and reward eligibility are visible before review.',
    status: 'ready',
  },
  {
    id: 'admin-rate-limits',
    label: 'Rate limiting',
    description: 'Login/register/pick rate limits are not implemented in the local MVP yet.',
    status: 'planned',
  },
  {
    id: 'admin-admin-actions',
    label: 'Admin mutation audit',
    description: 'Read-only audit visibility exists; destructive admin actions are intentionally not exposed.',
    status: 'planned',
  },
];
