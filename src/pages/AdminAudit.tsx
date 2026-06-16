import { Link } from 'react-router-dom';
import { CheckCircle2, FileSearch, ShieldAlert, ShieldCheck, TriangleAlert } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import PageHero from '../components/ui/PageHero';
import Panel from '../components/ui/Panel';
import StatCard from '../components/ui/StatCard';
import { mockAdminAuditLogs, mockAdminChecklist, mockSuspiciousUserSignals } from '../data/mockAdmin';
import type { ThemeControls } from '../App';
import type { AdminAuditLog, AdminChecklistItem } from '../types/domain';

type AdminAuditProps = {
  themeControls: ThemeControls;
};

const severityClass: Record<AdminAuditLog['severity'], string> = {
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

export default function AdminAudit({ themeControls }: AdminAuditProps) {
  const warningCount = mockAdminAuditLogs.filter((log) => log.severity === 'warning' || log.severity === 'critical').length;
  const readyChecks = mockAdminChecklist.filter((item) => item.status === 'ready').length;
  const reviewSignals = mockSuspiciousUserSignals.filter((signal) => signal.status === 'review').length;

  return (
    <AppShell themeControls={themeControls}>
      <div className="relative z-10 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6 bg-page flex-1">
        <PageHero title="Admin Audit Log" description="Read-only audit trail for scoring previews, prediction revisions, reward review, and anti-cheat signals.">
          <Link to="/admin" className="bg-c2 text-inv font-black uppercase py-3 px-4 border-2 border-main shadow-[3px_3px_0_var(--color-shadow)] text-xs">Back to Admin</Link>
        </PageHero>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
          <StatCard label="Audit Events" value={mockAdminAuditLogs.length} subtitle="Read-only log" tone="blue" icon={<FileSearch size={34} strokeWidth={2.5} />} />
          <StatCard label="Warnings" value={warningCount} subtitle="Need review" tone="orange" icon={<TriangleAlert size={34} strokeWidth={2.5} />} />
          <StatCard label="Checklist" value={`${readyChecks}/${mockAdminChecklist.length}`} subtitle="Controls ready" tone="green" icon={<ShieldCheck size={34} strokeWidth={2.5} />} />
          <StatCard label="User Signals" value={reviewSignals} subtitle="Active review" tone="lime" icon={<ShieldAlert size={34} strokeWidth={2.5} />} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-4 lg:gap-6 items-start">
          <Panel title="Audit Events" className="overflow-hidden">
            <div className="bg-card flex flex-col">
              {mockAdminAuditLogs.map((log) => (
                <div key={log.id} className="grid grid-cols-1 md:grid-cols-[150px_1fr_150px_160px] border-b-2 border-line last:border-b-0 font-bold text-sm">
                  <div className="p-3 md:border-r-2 border-main flex items-center">
                    <span className={`border-2 border-main px-3 py-2 text-[10px] font-black uppercase shadow-[2px_2px_0_var(--color-shadow)] ${severityClass[log.severity]}`}>{log.severity}</span>
                  </div>
                  <div className="p-3 md:border-r-2 border-main">
                    <div className="font-black uppercase">{log.action.replaceAll('_', ' ')}</div>
                    <div className="text-xs text-subtle mt-1">{log.description}</div>
                  </div>
                  <div className="p-3 md:border-r-2 border-main uppercase text-xs">
                    {log.entityType}<br />{log.entityId}
                  </div>
                  <div className="p-3 text-xs text-subtle">{formatDate(log.createdAt)}</div>
                </div>
              ))}
            </div>
          </Panel>

          <div className="flex flex-col gap-4 lg:gap-6">
            <Panel title="Anti-Cheat Checklist">
              <div className="p-4 bg-card flex flex-col gap-3">
                {mockAdminChecklist.map((item) => (
                  <div key={item.id} className="border-2 border-main bg-page p-3 shadow-[2px_2px_0_var(--color-shadow)]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-black uppercase text-sm">{item.label}</div>
                        <div className="text-xs font-bold text-subtle mt-1 leading-snug">{item.description}</div>
                      </div>
                      <span className={`border-2 border-main px-2 py-1 text-[10px] font-black uppercase ${checklistClass[item.status]}`}>{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <div className="border-4 border-main bg-c1 p-4 shadow-[4px_4px_0_var(--color-shadow)] font-black uppercase text-xs leading-relaxed flex gap-3">
              <CheckCircle2 className="shrink-0" /> Phase 6 intentionally exposes review and preview surfaces only. No ban, delete, payout, or force-result mutation controls are available.
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
