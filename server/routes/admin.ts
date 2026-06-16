import { Router } from 'express';
import { mockAdminAuditLogs, mockSuspiciousUserSignals } from '../../src/data/mockAdmin';
import { readDb } from '../db/jsonDb';
import { getAdminAudit, getAdminSummary, getAdminSuspiciousUsers, getLeaderboardRecalculationPreview } from '../services/adminService';

export const adminRouter = Router();

function withAdminDefaults(db: ReturnType<typeof readDb>) {
  return {
    ...db,
    adminAuditLogs: db.adminAuditLogs ?? mockAdminAuditLogs,
    suspiciousUserSignals: db.suspiciousUserSignals ?? mockSuspiciousUserSignals,
  };
}

adminRouter.get('/admin/summary', (_req, res) => {
  res.json(getAdminSummary(withAdminDefaults(readDb())));
});

adminRouter.get('/admin/audit', (_req, res) => {
  res.json(getAdminAudit(withAdminDefaults(readDb())));
});

adminRouter.get('/admin/suspicious-users', (_req, res) => {
  res.json(getAdminSuspiciousUsers(withAdminDefaults(readDb())));
});

adminRouter.post('/admin/leaderboard/recalculate-preview', (_req, res) => {
  res.json(getLeaderboardRecalculationPreview(withAdminDefaults(readDb())));
});
