import { Award, Lock, Medal, ShieldCheck, Sparkles } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import PageHero from '../components/ui/PageHero';
import Panel from '../components/ui/Panel';
import StatCard from '../components/ui/StatCard';
import { mockBadges } from '../data/mockBadges';
import type { ThemeControls } from '../App';
import type { Badge } from '../types/domain';

type BadgesProps = {
  themeControls: ThemeControls;
};

const rarityClasses: Record<Badge['rarity'], string> = {
  common: 'bg-card',
  rare: 'bg-c1',
  epic: 'bg-c2 text-inv',
  legendary: 'bg-c4 text-inv',
};

function formatDate(value?: string) {
  if (!value) return 'In progress';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(value));
}

export default function Badges({ themeControls }: BadgesProps) {
  const unlocked = mockBadges.filter((badge) => badge.unlockedAt);
  const inProgress = mockBadges.filter((badge) => !badge.unlockedAt);
  const totalProgress = mockBadges.reduce((sum, badge) => {
    if (!badge.progressCurrent || !badge.progressTarget) return sum;
    return sum + badge.progressCurrent / badge.progressTarget;
  }, 0);
  const completion = Math.round((totalProgress / mockBadges.length) * 100);

  return (
    <AppShell themeControls={themeControls}>
      <div className="relative z-10 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6 bg-page flex-1">
        <PageHero title="Badges" description="Track skill achievements, streak milestones, risk-pick progress, and rank-based recognition." />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
          <StatCard label="Unlocked" value={unlocked.length} subtitle="Earned badges" tone="blue" icon={<ShieldCheck size={34} strokeWidth={2.5} />} />
          <StatCard label="In Progress" value={inProgress.length} subtitle="Active goals" tone="lime" icon={<Sparkles size={34} strokeWidth={2.5} />} />
          <StatCard label="Completion" value={`${completion}%`} subtitle="Mock collection" tone="green" icon={<Medal size={34} strokeWidth={2.5} />} />
          <StatCard label="Categories" value={new Set(mockBadges.map((badge) => badge.category)).size} subtitle="Skill areas" tone="orange" icon={<Award size={34} strokeWidth={2.5} />} />
        </div>

        <Panel title="Achievement Collection">
          <div className="p-4 bg-card grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {mockBadges.map((badge) => {
              const progress = badge.progressCurrent && badge.progressTarget ? Math.round((badge.progressCurrent / badge.progressTarget) * 100) : 0;
              return (
                <article key={badge.id} className="border-4 border-main bg-page shadow-[4px_4px_0_var(--color-shadow)] flex flex-col">
                  <div className={`p-4 border-b-4 border-main ${rarityClasses[badge.rarity]}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-black uppercase text-xl tracking-tight">{badge.name}</div>
                        <div className="font-black uppercase text-[10px] mt-1 opacity-80">{badge.category} • {badge.rarity}</div>
                      </div>
                      <div className="w-12 h-12 border-2 border-main bg-card text-main flex items-center justify-center shadow-[2px_2px_0_var(--color-shadow)]">
                        {badge.unlockedAt ? <Award size={26} fill="currentColor" /> : <Lock size={24} />}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 flex flex-col gap-4 flex-1">
                    <p className="font-bold text-sm text-subtle leading-snug">{badge.description}</p>
                    <div>
                      <div className="flex justify-between font-black uppercase text-[10px] mb-2">
                        <span>Progress</span>
                        <span>{badge.progressCurrent ?? 0}/{badge.progressTarget ?? 0}</span>
                      </div>
                      <div className="h-5 border-2 border-main bg-card shadow-[2px_2px_0_var(--color-shadow)]">
                        <div className="h-full bg-c3" style={{ width: `${Math.min(progress, 100)}%` }} />
                      </div>
                    </div>
                    <div className="mt-auto border-2 border-main bg-muted p-3 font-black uppercase text-xs flex justify-between">
                      <span>Status</span>
                      <span>{badge.unlockedAt ? `Unlocked ${formatDate(badge.unlockedAt)}` : 'In Progress'}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
