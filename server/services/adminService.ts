import { calculateGlobalLeaderboard } from './leaderboardService';
import type { PredictDb } from '../types';

function getRewards(db: PredictDb) {
  return db.rewards ?? [];
}

function getAuditLogs(db: PredictDb) {
  return db.adminAuditLogs ?? [];
}

function getSuspiciousSignals(db: PredictDb) {
  return db.suspiciousUserSignals ?? [];
}

export function getAdminSummary(db: PredictDb) {
  const finishedMatches = db.matches.filter((match) => match.status === 'finished').length;
  const lockedMatches = db.matches.filter((match) => match.status === 'locked' || match.status === 'live').length;
  const pendingRewards = getRewards(db).filter((reward) => reward.status === 'pending').length;
  const suspiciousSignals = getSuspiciousSignals(db);
  const auditLogs = [...getAuditLogs(db)].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return {
    metrics: {
      users: db.users.length,
      matches: db.matches.length,
      predictions: db.predictions.length,
      finishedMatches,
      lockedMatches,
      pendingRewards,
      suspiciousSignals: suspiciousSignals.length,
      auditEvents: auditLogs.length,
    },
    suspiciousSignals,
    recentAuditLogs: auditLogs.slice(0, 5),
    leaderboardPreview: calculateGlobalLeaderboard(db).slice(0, 10),
  };
}

export function getAdminAudit(db: PredictDb) {
  return [...getAuditLogs(db)].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getAdminSuspiciousUsers(db: PredictDb) {
  return getSuspiciousSignals(db).map((signal) => ({
    ...signal,
    user: db.users.find((user) => user.id === signal.userId),
  }));
}

export function getLeaderboardRecalculationPreview(db: PredictDb) {
  return {
    previewOnly: true,
    generatedAt: new Date().toISOString(),
    currentStoredEntries: db.leaderboardEntries,
    recalculatedEntries: calculateGlobalLeaderboard(db),
  };
}
