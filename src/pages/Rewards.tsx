import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, ClipboardCheck, Gift, ShieldCheck, Star, Trophy, Users } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import PageHero from '../components/ui/PageHero';
import Panel from '../components/ui/Panel';
import StatCard from '../components/ui/StatCard';
import { mockEligibilityChecks, mockRewards, mockRewardTrustNotes } from '../data/mockRewards';
import type { ThemeControls } from '../App';
import type { EligibilityStatus, RewardStatus } from '../types/domain';

type RewardsProps = {
  themeControls: ThemeControls;
};

const statusStyles: Record<RewardStatus, string> = {
  pending: 'bg-c4 text-main',
  approved: 'bg-c3 text-main',
  paid: 'bg-c2 text-inv',
  ineligible: 'bg-muted text-main',
};

const eligibilityStyles: Record<EligibilityStatus, string> = {
  passed: 'bg-c3 text-main',
  review: 'bg-c4 text-main',
  blocked: 'bg-c5 text-inv',
};

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function getEligibilityIcon(status: EligibilityStatus) {
  if (status === 'passed') return <CheckCircle2 size={18} strokeWidth={3} />;
  if (status === 'review') return <AlertTriangle size={18} strokeWidth={3} />;
  return <ShieldCheck size={18} strokeWidth={3} />;
}

export default function Rewards({ themeControls }: RewardsProps) {
  const approvedCount = mockRewards.filter((reward) => reward.status === 'approved' || reward.status === 'paid').length;
  const pendingCount = mockRewards.filter((reward) => reward.status === 'pending').length;
  const potentialAmount = mockRewards.reduce((sum, reward) => sum + reward.amount, 0);
  const passedChecks = mockEligibilityChecks.filter((check) => check.status === 'passed').length;

  return (
    <AppShell themeControls={themeControls}>
      <div className="relative z-10 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6 bg-page flex-1">
        <PageHero title="Rewards" description="Track sponsor-backed reward eligibility, manual payout review, and the public rules that keep the contest skill-based.">
          <Link to="/rules" className="bg-c2 text-inv font-black uppercase py-3 px-4 border-2 border-main shadow-[3px_3px_0_var(--color-shadow)] text-xs">Public Rules</Link>
        </PageHero>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
          <StatCard label="Eligible Checks" value={`${passedChecks}/${mockEligibilityChecks.length}`} subtitle="Manual review ready" tone="green" icon={<ClipboardCheck size={34} strokeWidth={2.5} />} />
          <StatCard label="Reward Tracks" value={mockRewards.length} subtitle="Sponsor/community" tone="blue" icon={<Gift size={34} strokeWidth={2.5} />} />
          <StatCard label="Pending Review" value={pendingCount} subtitle="No instant payout" tone="orange" icon={<ShieldCheck size={34} strokeWidth={2.5} />} />
          <StatCard label="Approved Items" value={approvedCount} subtitle={formatCurrency(potentialAmount, 'USD')} tone="lime" icon={<Trophy size={34} strokeWidth={2.5} />} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-4 lg:gap-6 items-start">
          <div className="flex flex-col gap-4 lg:gap-6">
            <Panel title="Eligibility Checklist">
              <div className="bg-card grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
                {mockEligibilityChecks.map((check) => (
                  <div key={check.id} className="border-2 border-main bg-page p-4 shadow-[2px_2px_0_var(--color-shadow)] flex gap-3">
                    <div className={`w-10 h-10 border-2 border-main flex items-center justify-center shrink-0 shadow-[2px_2px_0_var(--color-shadow)] ${eligibilityStyles[check.status]}`}>
                      {getEligibilityIcon(check.status)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-black uppercase text-sm">{check.label}</div>
                      <div className="font-bold text-xs text-subtle mt-1 leading-snug">{check.description}</div>
                      {check.href && <Link to={check.href} className="inline-flex mt-3 text-[10px] font-black uppercase text-c2 hover:underline">Review details</Link>}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Reward Status" className="overflow-hidden">
              <div className="bg-card flex flex-col">
                {mockRewards.map((reward) => (
                  <div key={reward.id} className="grid grid-cols-1 md:grid-cols-[1fr_150px_130px] border-b-2 border-line last:border-b-0 font-bold text-sm">
                    <div className="p-4 md:border-r-2 border-main">
                      <div className="font-black uppercase">{reward.title}</div>
                      <div className="text-xs text-subtle uppercase mt-1">{reward.period} • {reward.placement}</div>
                      <div className="text-xs font-bold mt-2 leading-snug">{reward.note}</div>
                    </div>
                    <div className="p-4 md:border-r-2 border-main flex md:items-center md:justify-center">
                      <span className={`border-2 border-main px-3 py-2 text-[10px] font-black uppercase shadow-[2px_2px_0_var(--color-shadow)] ${statusStyles[reward.status]}`}>{reward.status}</span>
                    </div>
                    <div className="p-4 flex flex-col md:items-end justify-center">
                      <span className="font-black text-lg">{formatCurrency(reward.amount, reward.currency)}</span>
                      <span className="text-[10px] uppercase text-subtle font-black">{reward.source}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <div className="flex flex-col gap-4 lg:gap-6">
            <Panel title="Payout Safety">
              <div className="p-4 bg-card flex flex-col gap-3 font-bold text-sm">
                <div className="border-2 border-main bg-c1 text-main p-4 shadow-[2px_2px_0_var(--color-shadow)]">
                  <div className="font-black uppercase flex items-center gap-2"><ShieldCheck size={18} /> No wallet balance</div>
                  <p className="text-xs mt-2 leading-snug">This MVP does not store deposits, withdrawals, or cash balances. Potential winners are contacted manually after eligibility review.</p>
                </div>
                <Link to="/prize-pool" className="bg-c2 text-inv border-2 border-main p-3 shadow-[2px_2px_0_var(--color-shadow)] font-black uppercase text-xs flex items-center gap-2"><Trophy size={16} /> View prize pool</Link>
                <Link to="/leaderboard" className="bg-card border-2 border-main p-3 shadow-[2px_2px_0_var(--color-shadow)] font-black uppercase text-xs flex items-center gap-2"><Users size={16} /> Check leaderboard rank</Link>
                <Link to="/my-predictions" className="bg-card border-2 border-main p-3 shadow-[2px_2px_0_var(--color-shadow)] font-black uppercase text-xs flex items-center gap-2"><Star size={16} /> Improve predictions</Link>
              </div>
            </Panel>

            <Panel title="Trust Notes">
              <div className="p-4 bg-card flex flex-col gap-3">
                {mockRewardTrustNotes.map((note) => (
                  <div key={note.id} className="border-2 border-main bg-page p-3 shadow-[2px_2px_0_var(--color-shadow)]">
                    <div className="font-black uppercase text-sm">{note.title}</div>
                    <div className="text-xs font-bold text-subtle mt-1 leading-snug">{note.description}</div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Review Timeline">
              <div className="p-4 bg-card flex flex-col gap-3 text-xs font-bold">
                {mockRewards.map((reward) => (
                  <div key={reward.id} className="flex justify-between gap-3 border-b-2 border-line last:border-b-0 pb-3 last:pb-0">
                    <span className="uppercase">{reward.title}</span>
                    <span className="text-subtle whitespace-nowrap">{formatDate(reward.updatedAt)}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
