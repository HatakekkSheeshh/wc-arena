import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

const activityMeta: Record<ActivityItem['type'], { labelKey: string; icon: typeof Bell; tone: string }> = {
  prediction_locked: { labelKey: 'appPages.activity.types.predictionLocked', icon: Lock, tone: 'bg-c1 text-main' },
  score_calculated: { labelKey: 'appPages.activity.types.scoreCalculated', icon: Calculator, tone: 'bg-c3 text-main' },
  badge_unlocked: { labelKey: 'appPages.activity.types.badgeUnlocked', icon: Award, tone: 'bg-c2 text-inv' },
  rank_changed: { labelKey: 'appPages.activity.types.rankChanged', icon: TrendingUp, tone: 'bg-c4 text-inv' },
  league_joined: { labelKey: 'appPages.activity.types.leagueJoined', icon: Users, tone: 'bg-card text-main' },
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

export default function Activity({ themeControls }: ActivityProps) {
  const { t } = useTranslation();
  const sortedActivity = [...mockActivity].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const badgeCount = mockActivity.filter((item) => item.type === 'badge_unlocked').length;
  const scoringCount = mockActivity.filter((item) => item.type === 'score_calculated').length;
  const leagueCount = mockActivity.filter((item) => item.type === 'league_joined').length;

  return (
    <AppShell themeControls={themeControls}>
      <div className="relative z-10 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6 bg-page flex-1">
        <PageHero title={t('appPages.activity.title')} description={t('appPages.activity.description')} />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
          <StatCard label={t('appPages.activity.events')} value={mockActivity.length} subtitle={t('appPages.activity.mockFeed')} tone="blue" icon={<Bell size={34} strokeWidth={2.5} />} />
          <StatCard label={t('appPages.activity.scores')} value={scoringCount} subtitle={t('appPages.activity.calculated')} tone="lime" icon={<Calculator size={34} strokeWidth={2.5} />} />
          <StatCard label={t('appPages.activity.badges')} value={badgeCount} subtitle={t('appPages.activity.unlocked')} tone="green" icon={<Award size={34} strokeWidth={2.5} />} />
          <StatCard label={t('appPages.activity.leagues')} value={leagueCount} subtitle={t('appPages.activity.membership')} tone="orange" icon={<Users size={34} strokeWidth={2.5} />} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4 lg:gap-6 items-start">
          <Panel title={t('appPages.activity.notificationFeed')} className="overflow-hidden">
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
                      <div className="font-black uppercase text-[10px] text-subtle">{t(meta.labelKey)}</div>
                      <div className="font-bold text-sm mt-1">{formatDateTime(item.createdAt)}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </Panel>

          <div className="flex flex-col gap-4">
            <Panel title={t('appPages.activity.quickFilters')}>
              <div className="p-4 bg-card flex flex-col gap-2">
                {Object.entries(activityMeta).map(([type, meta]) => {
                  const Icon = meta.icon;
                  const count = mockActivity.filter((item) => item.type === type).length;
                  return (
                    <div key={type} className="border-2 border-main p-3 bg-page flex items-center justify-between font-bold text-sm">
                      <span className="flex items-center gap-2"><Icon size={16} /> {t(meta.labelKey)}</span>
                      <span className="font-black">{count}</span>
                    </div>
                  );
                })}
              </div>
            </Panel>

            <div className="border-4 border-main bg-c1 p-4 shadow-[4px_4px_0_var(--color-shadow)] font-black uppercase text-xs leading-relaxed">
              {t('appPages.activity.infoNote')}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
