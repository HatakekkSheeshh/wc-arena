import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, FileSearch, ShieldAlert, ShieldCheck, TriangleAlert } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import { mockAdminChecklist, mockSuspiciousUserSignals } from '../data/mockAdmin';
import { useAuth } from '../lib/auth';
import { listAdminAuditLogs, type AdminAuditLogRow } from '../services/admin';
import { getCurrentUserRole } from '../services/profile';
import { getErrorMessage } from '../services/serviceTypes';
import type { ThemeControls } from '../App';
import type { AdminChecklistItem } from '../types/domain';

type AdminAuditProps = {
  themeControls: ThemeControls;
};

const severityClass: Record<string, string> = {
  info: 'bg-c2 text-inv',
  warning: 'bg-c4 text-main',
  critical: 'bg-c5 text-inv',
};

const checklistClass: Record<AdminChecklistItem['status'], string> = {
  ready: 'bg-c3 text-main',
  planned: 'bg-c4 text-main',
  blocked: 'bg-c5 text-inv',
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function getSeverityClass(severity: string) {
  return severityClass[severity] ?? severityClass.info;
}

export default function AdminAudit({ themeControls }: AdminAuditProps) {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setRoleLoading(false);
      return;
    }

    let active = true;
    setRoleLoading(true);
    setError(null);

    getCurrentUserRole(user.id)
      .then((nextRole) => {
        if (!active) return;
        setRole(nextRole);
      })
      .catch((nextError) => {
        if (!active) return;
        setError(getErrorMessage(nextError));
      })
      .finally(() => {
        if (active) setRoleLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    if (role !== 'admin') return;

    let active = true;
    setLoading(true);
    setError(null);

    listAdminAuditLogs()
      .then((nextLogs) => {
        if (!active) return;
        setAuditLogs(nextLogs);
      })
      .catch((nextError) => {
        if (!active) return;
        setError(getErrorMessage(nextError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [role]);

  if (authLoading || roleLoading) {
    return (
      <AppShell themeControls={themeControls}>
        <div className="relative z-10 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6 min-h-0">
          <div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col w-full xl:w-1/2 shadow-[8px_8px_0_0_var(--color-shadow)]">
            <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-1 text-main">Admin Audit Log</h1>
          </div>
          <div className="bg-card border-4 border-main p-4 lg:p-6 shadow-[8px_8px_0_0_var(--color-shadow)] rounded-sm font-black uppercase text-sm">Loading admin access...</div>
        </div>
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell themeControls={themeControls}>
        <div className="relative z-10 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6 min-h-0">
          <div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col w-full xl:w-1/2 shadow-[8px_8px_0_0_var(--color-shadow)]">
            <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-1 text-main">Admin Audit Log</h1>
          </div>
          <div className="bg-card border-4 border-main p-4 lg:p-6 shadow-[8px_8px_0_0_var(--color-shadow)] rounded-sm font-black uppercase text-sm flex flex-col gap-3">
            <span>Sign in to access admin audit logs.</span>
            <Link to="/login" className="text-c2 underline">Go to login</Link>
          </div>
        </div>
      </AppShell>
    );
  }

  if (role !== 'admin') {
    return (
      <AppShell themeControls={themeControls}>
        <div className="relative z-10 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6 min-h-0">
          <div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col w-full xl:w-1/2 shadow-[8px_8px_0_0_var(--color-shadow)]">
            <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-1 text-main">Admin Audit Log</h1>
          </div>
          <div className="bg-card border-4 border-main p-4 lg:p-6 shadow-[8px_8px_0_0_var(--color-shadow)] rounded-sm font-black uppercase text-sm">Admin access required.</div>
        </div>
      </AppShell>
    );
  }

  const warningCount = auditLogs.filter((log) => log.severity === 'warning' || log.severity === 'critical').length;
  const readyChecks = mockAdminChecklist.filter((item) => item.status === 'ready').length;
  const reviewSignals = mockSuspiciousUserSignals.filter((signal) => signal.status === 'review').length;

  return (
    <AppShell themeControls={themeControls}>
      <div className="relative z-10 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6 min-h-0">
        <div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col w-full xl:w-1/2 shadow-[8px_8px_0_0_var(--color-shadow)]">
          <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-1 text-main">
            Admin Audit Log
          </h1>
        </div>

        <div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col gap-4 lg:gap-6 shadow-[8px_8px_0_0_var(--color-shadow)] rounded-sm">
          {error && <div className="bg-c5 border-4 border-main p-4 font-black uppercase text-sm">{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 border-b-4 border-main">
            <div className="flex items-center gap-4 border-b-4 sm:border-r-4 xl:border-b-0 border-main p-4 lg:p-5 bg-c1 text-main">
              <div className="shrink-0"><FileSearch size={36} strokeWidth={2.5} /></div>
              <div className="flex flex-col justify-center">
                <div className="text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">Audit Events</div>
                <div className="text-2xl sm:text-3xl font-black leading-none">{loading ? '—' : auditLogs.length}</div>
                <div className="text-[10px] font-bold uppercase mt-1">Read-only log</div>
              </div>
            </div>
            <div className="flex items-center gap-4 border-b-4 xl:border-b-0 xl:border-r-4 border-main p-4 lg:p-5 bg-c2 text-inv">
              <div className="shrink-0"><TriangleAlert size={36} strokeWidth={2.5} /></div>
              <div className="flex flex-col justify-center">
                <div className="text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">Warnings</div>
                <div className="text-2xl sm:text-3xl font-black leading-none">{warningCount}</div>
                <div className="text-[10px] font-bold uppercase mt-1">Need review</div>
              </div>
            </div>
            <div className="flex items-center gap-4 border-b-4 sm:border-b-0 sm:border-r-4 border-main p-4 lg:p-5 bg-c3 text-main">
              <div className="shrink-0"><ShieldCheck size={36} strokeWidth={2.5} /></div>
              <div className="flex flex-col justify-center">
                <div className="text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">Checklist</div>
                <div className="text-2xl sm:text-3xl font-black leading-none">{readyChecks}/{mockAdminChecklist.length}</div>
                <div className="text-[10px] font-bold uppercase mt-1">Controls ready</div>
              </div>
            </div>
            <div className="flex items-center gap-4 border-main p-4 lg:p-5 bg-c4 text-main">
              <div className="shrink-0"><ShieldAlert size={36} strokeWidth={2.5} /></div>
              <div className="flex flex-col justify-center">
                <div className="text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">User Signals</div>
                <div className="text-2xl sm:text-3xl font-black leading-none">{reviewSignals}</div>
                <div className="text-[10px] font-bold uppercase mt-1">Active review</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row flex-1">
            <div className="flex-1 border-r-0 xl:border-r-4 border-main flex flex-col bg-card min-w-0">
              <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm border-b-4 border-main flex justify-between items-center">
                <span>Audit Events</span>
                <Link to="/admin" className="text-[10px] opacity-80 hover:underline">Back to Admin</Link>
              </div>
              <div className="bg-card flex flex-col">
                {loading && <div className="p-6 font-black uppercase text-sm">Loading audit logs...</div>}
                {!loading && auditLogs.map((log) => (
                  <div key={log.id} className="grid grid-cols-1 md:grid-cols-[150px_1fr_150px_160px] border-b-4 border-main last:border-b-0 font-bold text-sm">
                    <div className="p-3 md:border-r-2 border-main flex items-center">
                      <span className={`border-2 border-main px-3 py-2 text-[10px] font-black uppercase ${getSeverityClass(log.severity)}`}>{log.severity}</span>
                    </div>
                    <div className="p-3 md:border-r-2 border-main">
                      <div className="font-black uppercase">{log.action.replaceAll('_', ' ')}</div>
                      <div className="text-xs text-subtle mt-1">{log.description}</div>
                    </div>
                    <div className="p-3 md:border-r-2 border-main uppercase text-xs">
                      {log.entity_type}<br />{log.entity_id}
                    </div>
                    <div className="p-3 text-xs text-subtle bg-muted">{formatDate(log.created_at)}</div>
                  </div>
                ))}
                {!loading && auditLogs.length === 0 && <div className="p-6 font-black uppercase text-sm">No audit logs yet.</div>}
              </div>
            </div>

            <div className="w-full xl:w-[380px] bg-card flex flex-col">
              <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm border-b-4 border-main">
                Anti-Cheat Checklist
              </div>
              <div className="bg-card flex flex-col border-b-4 border-main">
                {mockAdminChecklist.map((item) => (
                  <div key={item.id} className="p-4 border-b-2 border-line last:border-b-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-black uppercase text-sm">{item.label}</div>
                        <div className="text-xs font-bold text-subtle mt-1 leading-snug">{item.description}</div>
                      </div>
                      <span className={`border-2 border-main px-2 py-1 text-[10px] font-black uppercase shrink-0 ${checklistClass[item.status]}`}>{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col flex-1 bg-c1 text-main">
                <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm border-b-4 border-main">
                  Review Scope
                </div>
                <div className="p-4 font-black uppercase text-xs leading-relaxed flex gap-3 flex-1">
                  <CheckCircle2 className="shrink-0" />
                  <span>Phase 6 intentionally exposes review and preview surfaces only. No ban, delete, payout, or force-result mutation controls are available.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
