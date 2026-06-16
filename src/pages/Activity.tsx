import { Link } from 'react-router-dom';
import { Award, Bell, Calculator, Lock, TrendingUp, Users } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import PageHero from '../components/ui/PageHero';
import Panel from '../components/ui/Panel';
import StatCard from '../components/ui/StatCard';
import { mockActivity } from '../data/mockActivity';
import type { ThemeControls } from '../App';
import type { ActivityItem } from '../types/domain';

type ActivityProps = {
  themeControls: ThemeControls;
};

const activityMeta: Record<ActivityItem['type'], { label: string; icon: typeof Bell; tone: string }> = {
  prediction_locked: { label: 'Prediction Locked', icon: Lock, tone: 'bg-c1 text-main' },
  score_calculated: { label: 'Score Calculated', icon: Calculator, tone: 'bg-c3 text-main' },
  badge_unlocked: { label: 'Badge Unlocked', icon: Award, tone: 'bg-c2 text-inv' },
  rank_changed: { label: 'Rank Changed', icon: TrendingUp, tone: 'bg-c4 text-inv' },
  league_joined: { label: 'League Joined', icon: Users, tone: 'bg-card text-main' },
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

export default function Activity({ themeControls }: ActivityProps) {
  const sortedActivity = [...mockActivity].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const badgeCount = mockActivity.filter((item) => item.type === 'badge_unlocked').length;
  const scoringCount = mockActivity.filter((item) => item.type === 'score_calculated').length;
  const leagueCount = mockActivity.filter((item) => item.type === 'league_joined').length;

  return (
    <AppShell themeControls={themeControls}>
      <div className="relative z-10 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6 bg-page flex-1">
        <PageHero title="Activity" description="Recent contest events, scoring updates, league movement, and badge notifications." />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
          <StatCard label="Events" value={mockActivity.length} subtitle="Mock feed" tone="blue" icon={<Bell size={34} strokeWidth={2.5} />} />
          <StatCard label="Scores" value={scoringCount} subtitle="Calculated" tone="lime" icon={<Calculator size={34} strokeWidth={2.5} />} />
          <StatCard label="Badges" value={badgeCount} subtitle="Unlocked" tone="green" icon={<Award size={34} strokeWidth={2.5} />} />
          <StatCard label="Leagues" value={leagueCount} subtitle="Membership" tone="orange" icon={<Users size={34} strokeWidth={2.5} />} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4 lg:gap-6 items-start">
          <Panel title="Notification Feed" className="overflow-hidden">
            <div className="bg-card flex flex-col">
              {sortedActivity.map((item) => {
                const meta = activityMeta[item.type];
                const Icon = meta.icon;
                return (
                  <Link key={item.id} to={item.href ?? '#'} className="grid grid-cols-1 md:grid-cols-[80px_1fr_180px] border-b-2 border-line last:border-b-0 hover:bg-muted transition-colors">
                    <div className={`p-4 md:border-r-2 border-main flex items-center justify-center ${meta.tone}`}>
                      <Icon size={28} strokeWidth={2.5} />
                    </div>
                    <div className="p-4 md:border-r-2 border-main">
                      <div className="font-black uppercase text-lg tracking-tight">{item.title}</div>
                      <div className="font-bold text-sm text-subtle mt-1">{item.description}</div>
                    </div>
                    <div className="p-4 flex flex-col justify-center">
                      <div className="font-black uppercase text-[10px] text-subtle">{meta.label}</div>
                      <div className="font-bold text-sm mt-1">{formatDateTime(item.createdAt)}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </Panel>

          <div className="flex flex-col gap-4">
            <Panel title="Quick Filters">
              <div className="p-4 bg-card flex flex-col gap-2">
                {Object.entries(activityMeta).map(([type, meta]) => {
                  const Icon = meta.icon;
                  const count = mockActivity.filter((item) => item.type === type).length;
                  return (
                    <div key={type} className="border-2 border-main p-3 bg-page flex items-center justify-between font-bold text-sm">
                      <span className="flex items-center gap-2"><Icon size={16} /> {meta.label}</span>
                      <span className="font-black">{count}</span>
                    </div>
                  );
                })}
              </div>
            </Panel>

            <div className="border-4 border-main bg-c1 p-4 shadow-[4px_4px_0_var(--color-shadow)] font-black uppercase text-xs leading-relaxed">
              Activity is informational only: it tracks predictions, points, badges, and league standings without wagers or betting mechanics.
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
