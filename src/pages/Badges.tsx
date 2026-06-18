import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Award, Lock, Medal, ShieldCheck, Sparkles } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import { listCurrentUserBadges, type UserBadgeWithBadge } from '../services/badges';
import { getErrorMessage } from '../services/serviceTypes';
import type { ThemeControls } from '../App';

type BadgesProps = {
  themeControls: ThemeControls;
};

type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

const rarityClasses: Record<BadgeRarity, string> = {
  common: 'bg-card',
  rare: 'bg-c1',
  epic: 'bg-c2 text-inv',
  legendary: 'bg-c4 text-inv',
};

const rarityCountsInitial: Record<BadgeRarity, number> = { common: 0, rare: 0, epic: 0, legendary: 0 };

function formatDate(value?: string | null) {
  if (!value) return 'In progress';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(value));
}

function getBadgeRarity(value?: string): BadgeRarity {
  if (value === 'rare' || value === 'epic' || value === 'legendary') return value;
  return 'common';
}

export default function Badges({ themeControls }: BadgesProps) {
  const { t } = useTranslation();
  const [badges, setBadges] = useState<UserBadgeWithBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    listCurrentUserBadges()
      .then((nextBadges) => {
        if (!active) return;
        setBadges(nextBadges);
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
  }, []);

  const unlocked = badges.filter((badge) => badge.unlocked_at);
  const inProgress = badges.filter((badge) => !badge.unlocked_at);
  const categories = Array.from(new Set(badges.map((badge) => badge.badges?.category).filter(Boolean)));
  const rarityCounts = badges.reduce<Record<BadgeRarity, number>>((counts, badge) => {
    counts[getBadgeRarity(badge.badges?.rarity)] += 1;
    return counts;
  }, { ...rarityCountsInitial });
  const totalProgress = badges.reduce((sum, badge) => {
    const target = badge.badges?.progress_target;
    if (!target) return sum;
    return sum + badge.progress_current / target;
  }, 0);
  const completion = badges.length ? Math.round((totalProgress / badges.length) * 100) : 0;

  return (
    <AppShell themeControls={themeControls}>
      <div className="relative z-10 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6 min-h-0">
        <div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col w-full xl:w-1/2 shadow-[8px_8px_0_0_var(--color-shadow)]">
          <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-1 text-main">
            {t('appPages.badges.title')}
          </h1>
        </div>

        <div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col gap-4 lg:gap-6 shadow-[8px_8px_0_0_var(--color-shadow)] rounded-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 border-b-4 border-main">
            <div className="flex items-center gap-4 border-b-4 sm:border-r-4 xl:border-b-0 border-main p-4 lg:p-5 bg-c1 text-main">
              <div className="shrink-0"><ShieldCheck size={36} strokeWidth={2.5} /></div>
              <div className="flex flex-col justify-center">
                <div className="text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">{t('appPages.activity.unlocked')}</div>
                <div className="text-2xl sm:text-3xl font-black leading-none">{unlocked.length}</div>
                <div className="text-[10px] font-bold uppercase mt-1">{t('appPages.badges.earnedBadges')}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 border-b-4 xl:border-b-0 xl:border-r-4 border-main p-4 lg:p-5 bg-c2 text-inv">
              <div className="shrink-0"><Sparkles size={36} strokeWidth={2.5} /></div>
              <div className="flex flex-col justify-center">
                <div className="text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">{t('appPages.common.inProgress')}</div>
                <div className="text-2xl sm:text-3xl font-black leading-none">{inProgress.length}</div>
                <div className="text-[10px] font-bold uppercase mt-1">{t('appPages.badges.activeGoals')}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 border-b-4 sm:border-b-0 sm:border-r-4 border-main p-4 lg:p-5 bg-c3 text-main">
              <div className="shrink-0"><Medal size={36} strokeWidth={2.5} /></div>
              <div className="flex flex-col justify-center">
                <div className="text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">{t('appPages.badges.completion')}</div>
                <div className="text-2xl sm:text-3xl font-black leading-none">{completion}%</div>
                <div className="text-[10px] font-bold uppercase mt-1">Supabase collection</div>
              </div>
            </div>
            <div className="flex items-center gap-4 border-main p-4 lg:p-5 bg-c4 text-main">
              <div className="shrink-0"><Award size={36} strokeWidth={2.5} /></div>
              <div className="flex flex-col justify-center">
                <div className="text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">{t('appPages.badges.categories')}</div>
                <div className="text-2xl sm:text-3xl font-black leading-none">{categories.length}</div>
                <div className="text-[10px] font-bold uppercase mt-1">{t('appPages.badges.skillAreas')}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row flex-1">
            <div className="flex-1 border-r-0 xl:border-r-4 border-main flex flex-col bg-card min-w-0">
              <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm border-b-4 border-main">
                {t('appPages.badges.achievementCollection')}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 bg-card">
                {loading && <div className="p-6 font-black uppercase text-sm">Loading badges...</div>}
                {error && <div className="p-6 font-black uppercase text-sm bg-c5 text-main border-b-4 border-main">{error}</div>}
                {!loading && !error && badges.length === 0 && <div className="p-6 font-black uppercase text-sm">No badge progress yet.</div>}
                {!loading && !error && badges.map((userBadge, index) => {
                  const badge = userBadge.badges;
                  if (!badge) return null;
                  const rarity = getBadgeRarity(badge.rarity);
                  const progress = badge.progress_target ? Math.round((userBadge.progress_current / badge.progress_target) * 100) : 0;
                  const isRightColumn = index % 2 === 1;
                  const isLastOddItem = badges.length % 2 === 1 && index === badges.length - 1;
                  return (
                    <article key={badge.id} className={`flex flex-col border-b-4 border-main ${!isRightColumn ? 'lg:border-r-4' : ''} ${isLastOddItem ? 'lg:col-span-2' : ''}`}>
                      <div className={`p-4 border-b-4 border-main ${rarityClasses[rarity]}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-black uppercase text-xl tracking-tight">{badge.name}</div>
                            <div className="font-black uppercase text-[10px] mt-1 opacity-80">{badge.category} • {badge.rarity}</div>
                          </div>
                          <div className="w-12 h-12 border-2 border-main bg-card text-main flex items-center justify-center shrink-0">
                            {userBadge.unlocked_at ? <Award size={26} fill="currentColor" /> : <Lock size={24} />}
                          </div>
                        </div>
                      </div>

                      <div className="p-4 flex flex-col gap-4 flex-1">
                        <p className="font-bold text-sm text-subtle leading-snug">{badge.description}</p>
                        <div>
                          <div className="flex justify-between font-black uppercase text-[10px] mb-2">
                            <span>{t('appPages.common.progress')}</span>
                            <span>{userBadge.progress_current}/{badge.progress_target ?? 0}</span>
                          </div>
                          <div className="h-5 border-2 border-main bg-muted">
                            <div className="h-full bg-c3" style={{ width: `${Math.min(progress, 100)}%` }} />
                          </div>
                        </div>
                        <div className="mt-auto border-2 border-main bg-muted p-3 font-black uppercase text-xs flex justify-between gap-3">
                          <span>{t('appPages.common.status')}</span>
                          <span className="text-right">{userBadge.unlocked_at ? `${t('appPages.common.unlocked')} ${formatDate(userBadge.unlocked_at)}` : t('appPages.common.inProgress')}</span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            <div className="w-full xl:w-[360px] bg-card flex flex-col">
              <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm border-b-4 border-main">
                {t('appPages.badges.categories')}
              </div>
              <div className="bg-card flex flex-col border-b-4 border-main">
                {categories.map((category) => (
                  <div key={category} className="flex items-center justify-between p-4 border-b-2 border-line last:border-b-0 font-bold text-sm uppercase">
                    <span>{category}</span>
                    <span className="font-black">{badges.filter((badge) => badge.badges?.category === category).length}</span>
                  </div>
                ))}
              </div>

              <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm border-b-4 border-main">
                Rarity Mix
              </div>
              <div className="p-4 bg-card flex flex-col gap-3 text-sm font-bold border-b-4 border-main">
                {Object.entries(rarityCounts).map(([rarity, count]) => (
                  <div key={rarity} className="flex justify-between border-b-2 border-line pb-2 last:border-b-0 last:pb-0 uppercase">
                    <span>{rarity}</span>
                    <span className="font-black">{count}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col flex-1 bg-c1 text-main">
                <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm border-b-4 border-main">
                  {t('appPages.badges.completion')}
                </div>
                <div className="p-4 font-black uppercase flex flex-col gap-3 flex-1 justify-center">
                  <div className="text-5xl tracking-tighter">{completion}%</div>
                  <div className="text-xs leading-relaxed opacity-80">{unlocked.length} of {badges.length} badges unlocked in your Supabase collection.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
