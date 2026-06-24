import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Medal, Star, Trophy, User, Users } from 'lucide-react';
import AppShell from './components/layout/AppShell';
import PointsCoin from './components/ui/PointsCoin';
import RankBadge from './components/ui/RankBadge';
import StreakBadge from './components/ui/StreakBadge';
import { useAuth } from './lib/auth';
import { listGlobalLeaderboard, type LeaderboardEntryWithProfile } from './services/leaderboard';
import { getCurrentProfile, type ProfileRow } from './services/profile';
import { getErrorMessage } from './services/serviceTypes';
import { getPublicDisplayName, getPublicInitials } from './utils/displayName';

type LeaderboardProps = {
  onNavigate: (page: string) => void;
  isVintage: boolean;
  setIsVintage: (v: boolean) => void;
  isDark: boolean;
  setIsDark: (v: boolean) => void;
  isRounded: boolean;
  setIsRounded: (v: boolean) => void;
  hasShadow: boolean;
  setHasShadow: (v: boolean) => void;
  hasFrame: boolean;
  setHasFrame: (v: boolean) => void;
};

type PodiumItem = LeaderboardEntryWithProfile & {
  color: string;
  textColor: string;
};

type CurrentLeaderboardEntry = LeaderboardEntryWithProfile | (Omit<LeaderboardEntryWithProfile, 'rank'> & { rank: number | null });
type TranslationFn = ReturnType<typeof useTranslation>['t'];

function formatPoints(value?: number) {
  return (value ?? 0).toLocaleString();
}

function getDisplayName(entry?: LeaderboardEntryWithProfile) {
  return getPublicDisplayName(entry?.profiles, entry?.user_id ?? '—');
}

function getInitials(entry?: LeaderboardEntryWithProfile) {
  return getPublicInitials(entry?.profiles, entry?.user_id ?? '—');
}

function getProfilePath(entry: Pick<LeaderboardEntryWithProfile, 'user_id'>) {
  return `/users/${entry.user_id}`;
}

function getRankChange(entry: LeaderboardEntryWithProfile) {
  return entry.previous_rank ? entry.previous_rank - entry.rank : 0;
}

function Avatar({ entry, size = 'w-8 h-8' }: { entry?: LeaderboardEntryWithProfile; size?: string }) {
  if (entry?.profiles?.avatar_url) {
    return (
      <div className={`${size} rounded-full border-2 border-main overflow-hidden bg-elevated mr-3 flex-shrink-0`}>
        <img src={entry.profiles.avatar_url} alt={getDisplayName(entry)} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div className={`${size} rounded-full border-2 border-main bg-elevated mr-3 flex items-center justify-center flex-shrink-0 font-black text-xs uppercase`}>
      {entry ? getInitials(entry) : <User size={18} />}
    </div>
  );
}

function PodiumCard({ item, heightClass, primary, t }: { item?: PodiumItem; heightClass: string; primary?: boolean; t: TranslationFn }) {
  const rank = item?.rank ?? (primary ? 1 : 0);
  const className = `w-full ${primary ? 'sm:w-[40%] xl:w-[38%] pt-12 pb-6 px-4 z-20 shadow-[0px_-2px_0_0_var(--color-shadow)] transform sm:-translate-y-4' : 'sm:w-1/3 pt-10 pb-4 px-3 z-10'} border-4 border-main border-b-0 rounded-t-lg flex flex-col items-center relative ${item?.color ?? 'bg-card'} ${item?.textColor ?? 'text-main'} ${heightClass} ${item ? 'hover:brightness-105 transition' : ''}`;
  const content = (
    <>
      <div className={`${primary ? 'absolute -top-7 w-14 h-14 text-3xl bg-c1' : 'absolute -top-6 w-12 h-12 text-xl bg-card'} rounded-full border-4 border-main flex items-center justify-center font-black text-main shadow-[2px_2px_0_0_var(--color-shadow)]`}>
        {rank || '—'}
      </div>
      <div className={`${primary ? 'w-20 h-20 md:w-24 md:h-24' : 'w-16 h-16 md:w-20 md:h-20'} rounded-full border-4 border-main overflow-hidden bg-elevated mb-3 flex-shrink-0 shadow-[2px_2px_0_0_var(--color-shadow)] flex items-center justify-center font-black text-main text-xl`}>
        {item?.profiles?.avatar_url ? <img src={item.profiles.avatar_url} alt={getDisplayName(item)} className="w-full h-full object-cover" /> : getInitials(item)}
      </div>
      <RankBadge points={item?.points ?? 0} size={primary ? 'lg' : 'md'} showPoints className="mb-3 bg-card text-main border-2 border-main px-2 py-1 shadow-[2px_2px_0_0_var(--color-shadow)]" />
      <div className={`${primary ? 'font-bold text-base md:text-xl' : 'font-bold text-sm md:text-lg'} leading-tight truncate w-full text-center`}>{getDisplayName(item)}</div>
      <div className={`${primary ? 'font-black text-3xl md:text-4xl text-main' : 'font-black text-2xl md:text-3xl'} mb-4 flex items-center justify-center gap-2`}><PointsCoin size={primary ? 'lg' : 'md'} />{formatPoints(item?.points)} <span className="text-sm md:text-lg">{t('ui.pointsShort')}</span></div>
      <div className="bg-card text-main border-2 border-main rounded-sm px-2 py-1 flex items-center gap-1 text-[9px] md:text-[10px] font-black uppercase text-center justify-center shadow-[2px_2px_0_0_var(--color-shadow)]">
        <Star size={12} fill="currentColor" /> {t('ui.exactScores')}: {item?.exact_scores ?? 0}
      </div>
    </>
  );

  return item ? <Link to={getProfilePath(item)} className={className}>{content}</Link> : <div className={className}>{content}</div>;
}

export default function Leaderboard({ isVintage, setIsVintage, isDark, setIsDark, isRounded, setIsRounded, hasShadow, setHasShadow, hasFrame, setHasFrame }: LeaderboardProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const themeControls = { isVintage, setIsVintage, isDark, setIsDark, isRounded, setIsRounded, hasShadow, setHasShadow, hasFrame, setHasFrame };
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntryWithProfile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setCurrentProfile(null);

    Promise.all([
      listGlobalLeaderboard(),
      user ? getCurrentProfile(user.id) : Promise.resolve(null),
    ])
      .then(([nextLeaderboard, nextProfile]) => {
        if (!active) return;
        setLeaderboard(nextLeaderboard);
        setCurrentProfile(nextProfile);
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
  }, [user]);

  const topRank = leaderboard.find((entry) => entry.rank === 1);
  const secondRank = leaderboard.find((entry) => entry.rank === 2);
  const thirdRank = leaderboard.find((entry) => entry.rank === 3);
  const podium = useMemo(() => [
    secondRank ? { ...secondRank, color: 'bg-c2', textColor: 'text-accent-inv' } : undefined,
    topRank ? { ...topRank, color: 'bg-c1', textColor: 'text-accent-on' } : undefined,
    thirdRank ? { ...thirdRank, color: 'bg-c4', textColor: 'text-accent-on' } : undefined,
  ], [secondRank, thirdRank, topRank]);
  const leaderboardRest = leaderboard.filter((entry) => entry.rank > 3);
  const totalPlayers = leaderboard.length;
  const leaderboardCurrentEntry = user ? leaderboard.find((entry) => entry.user_id === user.id) : undefined;
  const currentProfileEntry = currentProfile ? {
    id: `profile-${currentProfile.id}`,
    scope: 'global',
    league_id: null,
    user_id: currentProfile.id,
    rank: null,
    previous_rank: null,
    points: currentProfile.points,
    exact_scores: currentProfile.exact_scores,
    accuracy: currentProfile.accuracy ?? 0,
    streak: currentProfile.current_streak,
    updated_at: currentProfile.created_at,
    profiles: currentProfile,
  } satisfies CurrentLeaderboardEntry : undefined;
  const currentEntry: CurrentLeaderboardEntry | undefined = leaderboardCurrentEntry ?? currentProfileEntry;
  const currentRank = currentEntry?.rank ?? '—';
  const currentRankLabel = currentEntry?.rank ? t('ui.outOfPlayers', { count: totalPlayers.toLocaleString() }) : t('ui.notRankedYet');
  const totalPoints = leaderboard.reduce((sum, entry) => sum + entry.points, 0);

  return (
    <AppShell themeControls={themeControls}>
      <div className="relative z-10 flex flex-col p-3 sm:p-4 lg:p-6 gap-3 lg:gap-6 min-h-0">
        <div className="bg-card border-4 border-main p-3 sm:p-4 lg:p-6 flex flex-col w-full xl:w-1/2 shadow-[6px_6px_0_0_var(--color-shadow)] lg:shadow-[8px_8px_0_0_var(--color-shadow)]">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-1 text-main leading-none">
            {t('nav.public.leaderboard')}
          </h1>
        </div>

        <div className="bg-card border-4 border-main p-3 sm:p-4 lg:p-6 flex flex-col gap-3 lg:gap-6 shadow-[6px_6px_0_0_var(--color-shadow)] lg:shadow-[8px_8px_0_0_var(--color-shadow)] rounded-sm">
          <div className="grid grid-cols-2 xl:grid-cols-4 border-b-4 border-main">
            <div className="flex items-center gap-2 sm:gap-4 border-b-4 border-r-4 xl:border-b-0 border-main p-2.5 sm:p-4 lg:p-5 bg-c1 text-main min-w-0">
              <div className="shrink-0"><Trophy size={24} className="sm:w-9 sm:h-9" strokeWidth={2.5}/></div>
              <div className="flex flex-col justify-center min-w-0">
                <div className="text-[9px] sm:text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">{t('ui.topScore')}</div>
                <div className="text-lg sm:text-3xl font-black leading-none flex items-center gap-1 sm:gap-2"><PointsCoin size="sm" />{formatPoints(topRank?.points)}</div>
                <div className="text-[9px] sm:text-[10px] font-bold uppercase mt-1 truncate">{getDisplayName(topRank)}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 border-b-4 xl:border-b-0 xl:border-r-4 border-main p-2.5 sm:p-4 lg:p-5 bg-c2 text-inv min-w-0">
              <div className="shrink-0"><Users size={24} className="sm:w-9 sm:h-9" strokeWidth={2.5}/></div>
              <div className="flex flex-col justify-center min-w-0">
                <div className="text-[9px] sm:text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">{t('ui.totalPlayers')}</div>
                <div className="text-lg sm:text-3xl font-black leading-none">{totalPlayers.toLocaleString()}</div>
                <div className="text-[9px] sm:text-[10px] font-bold uppercase mt-1">{t('ui.joined')}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 border-r-4 xl:border-r-4 border-main p-2.5 sm:p-4 lg:p-5 bg-c3 text-main min-w-0">
              <div className="shrink-0"><RankBadge points={currentEntry?.points ?? 0} size="sm" showLabel={false} /></div>
              <div className="flex flex-col justify-center min-w-0">
                <div className="text-[9px] sm:text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">{t('ui.yourRank')}</div>
                <div className="text-lg sm:text-3xl font-black leading-none">{currentRank}</div>
                <div className="text-[9px] sm:text-[10px] font-bold uppercase mt-1 opacity-80 truncate">{currentRankLabel}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 border-main p-2.5 sm:p-4 lg:p-5 bg-c4 text-main min-w-0">
              <div className="shrink-0"><PointsCoin size="md" /></div>
              <div className="flex flex-col justify-center min-w-0">
                <div className="text-[9px] sm:text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">{t('ui.yourPoints')}</div>
                <div className="text-lg sm:text-3xl font-black leading-none flex items-center gap-1 sm:gap-2">{formatPoints(currentEntry?.points)} <span className="text-[9px] sm:text-xs">{t('ui.pointsShort')}</span></div>
                <div className="text-[9px] sm:text-[10px] font-bold uppercase mt-1">{t('ui.totalPoints')}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row flex-1 items-stretch">
            <div className="order-2 xl:order-1 flex-1 border-r-0 xl:border-r-4 border-main flex flex-col bg-card min-w-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 font-black text-[10px] sm:text-xs md:text-sm uppercase tracking-wide border-b-4 border-main">
                <div className="flex bg-card border-b-4 sm:border-b-0 sm:border-r-4 border-main overflow-x-auto">
                  <button className="bg-c2 text-accent-inv px-4 sm:px-2 py-2 md:py-3 border-r-4 border-main flex-1 min-w-[92px] text-center">{t('ui.global')}</button>
                  <button className="text-main hover:bg-elevated px-4 sm:px-2 py-2 md:py-3 border-r-4 border-main flex-1 min-w-[92px] text-center">{t('ui.friends')}</button>
                  <button className="text-main hover:bg-elevated px-4 sm:px-2 py-2 md:py-3 flex-1 min-w-[92px] text-center">{t('ui.weekly')}</button>
                </div>
                <div className="flex bg-card overflow-x-auto">
                  <button className="bg-c2 text-accent-inv px-4 sm:px-1 py-2 md:py-3 border-r-4 border-main flex-1 min-w-[112px] text-center">{t('ui.groupStage')}</button>
                  <button className="text-main hover:bg-elevated px-4 sm:px-1 py-2 md:py-3 border-r-4 border-main flex-1 min-w-[96px] text-center">{t('ui.knockout')}</button>
                  <button className="text-main hover:bg-elevated px-4 sm:px-1 py-2 md:py-3 flex-1 min-w-[92px] text-center">{t('ui.overall')}</button>
                </div>
              </div>

              <div className="bg-card flex flex-col">
                {loading && <div className="p-6 font-black uppercase text-sm">{t('ui.loadingLeaderboard')}</div>}
                {error && <div className="p-6 font-black uppercase text-sm bg-c5 text-main border-b-4 border-main">{error}</div>}
                {!loading && !error && leaderboard.length === 0 && <div className="p-6 font-black uppercase text-sm">{t('ui.noLeaderboardPublished')}</div>}
                {!loading && !error && leaderboard.length > 0 && (
                  <>
                    <div className="sm:hidden p-3 border-b-4 border-main bg-muted flex flex-col gap-2">
                      {[topRank, secondRank, thirdRank].filter(Boolean).map((item) => {
                        const entry = item as LeaderboardEntryWithProfile;
                        return (
                          <Link key={entry.user_id} to={getProfilePath(entry)} className="bg-card border-2 border-main p-2.5 shadow-[2px_2px_0_var(--color-shadow)] flex items-center gap-3 rounded-sm hover:bg-muted transition-colors">
                            <div className="w-8 h-8 border-2 border-main bg-c1 flex items-center justify-center font-black shrink-0 rounded-sm">{entry.rank}</div>
                            <Avatar entry={entry} size="w-9 h-9" />
                            <div className="min-w-0 flex-1">
                              <div className="font-black text-sm uppercase truncate">{getDisplayName(entry)}</div>
                              <div className="text-[9px] font-black uppercase text-subtle">{t('ui.exact')} {entry.exact_scores} · {entry.accuracy}%</div>
                            </div>
                            <div className="font-black text-base flex items-center gap-1 shrink-0"><PointsCoin size="sm" />{formatPoints(entry.points)}</div>
                          </Link>
                        );
                      })}
                    </div>

                    <div className="hidden sm:flex flex-col sm:flex-row items-end p-4 md:p-6 lg:p-8 pb-0 gap-4 md:gap-0 justify-center">
                      <PodiumCard item={podium[0]} heightClass="sm:-mr-2 sm:shadow-[2px_0px_0_0_var(--color-shadow)]" t={t} />
                      <PodiumCard item={podium[1]} heightClass="" primary t={t} />
                      <PodiumCard item={podium[2]} heightClass="sm:-ml-2 sm:shadow-[-2px_0px_0_0_var(--color-shadow)]" t={t} />
                    </div>

                    <div className="sm:border-t-4 border-main">
                      <div className="hidden sm:flex items-center border-b-4 border-main p-3 font-black text-xs uppercase bg-card text-main tracking-wide">
                        <div className="w-16 text-center">{t('ui.rank')}</div>
                        <div className="w-12"></div>
                        <div className="flex-1">{t('ui.player')}</div>
                        <div className="w-28 text-center">{t('ui.rankTier')}</div>
                        <div className="w-24 text-center">{t('ui.pointsShort')}</div>
                        <div className="w-32 text-center text-[10px] lg:text-xs">{t('ui.exactScores')}</div>
                        <div className="w-32 text-center">{t('ui.accuracy')}</div>
                        <div className="w-20 text-center">{t('ui.streak')}</div>
                        <div className="w-20 text-center">{t('ui.change')}</div>
                      </div>

                      <div className="flex flex-col">
                        {leaderboardRest.map((item) => {
                          const change = getRankChange(item);
                          return (
                            <div key={item.user_id} className="flex flex-col sm:flex-row sm:items-center p-2.5 sm:p-3 lg:p-3 border-b-2 border-line hover:bg-muted transition-colors bg-card sm:bg-transparent">
                              <Link to={getProfilePath(item)} className="flex items-center flex-1 sm:w-auto mb-2 sm:mb-0 min-w-0 hover:text-c2 transition-colors">
                                <div className="w-8 sm:w-16 font-black text-base sm:text-lg text-center shrink-0">{item.rank}</div>
                                <Avatar entry={item} />
                                <div className="flex-1 font-bold text-sm lg:text-base leading-tight truncate">{getDisplayName(item)}</div>
                                <div className="sm:hidden"><RankBadge points={item.points} size="sm" showLabel={false} /></div>
                              <div className="font-black text-base sm:hidden flex items-center gap-1"><PointsCoin size="sm" />{formatPoints(item.points)}</div>
                              </Link>

                              <div className="grid grid-cols-4 sm:flex items-start sm:items-center justify-between sm:justify-start w-full sm:w-auto text-xs sm:text-sm pl-8 sm:pl-0 font-bold gap-2 sm:gap-0">
                                <div className="hidden sm:flex w-28 justify-center"><RankBadge points={item.points} size="sm" showLabel={false} /></div>
                                <div className="hidden sm:flex w-24 justify-center items-center gap-1 text-sm"><PointsCoin size="sm" />{formatPoints(item.points)}</div>
                                <div className="w-auto sm:w-32 text-center text-subtle sm:text-main flex flex-col sm:flex-row items-center sm:justify-center">
                                  <span className="sm:hidden text-[9px] uppercase font-black tracking-widest text-faint mb-0.5">{t('ui.exact')}</span>
                                  {item.exact_scores}
                                </div>
                                <div className="w-auto sm:w-32 text-center flex flex-col sm:flex-row sm:items-center sm:justify-center gap-1 sm:gap-2">
                                  <span className="sm:hidden text-[9px] uppercase font-black tracking-widest text-faint mb-0.5">{t('ui.accuracy')}</span>
                                  <div className="flex items-center justify-center gap-2">
                                    <span className="w-8 text-right font-medium">{item.accuracy}%</span>
                                    <div className="hidden sm:block w-12 h-2 bg-muted rounded-full border border-main overflow-hidden">
                                      <div className="bg-c3 h-full rounded-full" style={{ width: `${item.accuracy}%` }} />
                                    </div>
                                  </div>
                                </div>
                                <div className="w-auto sm:w-20 text-center flex flex-col sm:flex-row items-center sm:justify-center gap-0.5 font-medium">
                                  <span className="sm:hidden text-[9px] uppercase font-black tracking-widest text-faint mb-0.5">{t('ui.streak')}</span>
                                  <StreakBadge streak={item.streak} size="sm" />
                                </div>
                                <div className="w-auto sm:w-20 text-center flex flex-col sm:flex-row items-center sm:justify-center">
                                  <span className="sm:hidden text-[9px] uppercase font-black tracking-widest text-faint mb-0.5">{t('ui.change')}</span>
                                  {change > 0 ? <span className="text-c3 drop-shadow-[1px_1px_0_var(--color-main)]">▲ {change}</span> : change < 0 ? <span className="text-c5 drop-shadow-[1px_1px_0_var(--color-main)]">▼ {Math.abs(change)}</span> : <span className="text-subtle font-bold">—</span>}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {currentEntry && (
                          <div className="flex flex-col sm:flex-row sm:items-center p-2.5 sm:p-3 lg:p-3 bg-c1 border-y-4 border-main hover:opacity-90">
                            <Link to={getProfilePath(currentEntry)} className="flex items-center flex-1 sm:w-auto mb-2 sm:mb-0 text-main min-w-0 hover:text-c2 transition-colors">
                              <div className="w-8 sm:w-16 font-black text-lg text-center shrink-0">{currentRank}</div>
                              <Avatar entry={currentEntry} />
                              <div className="flex-1 font-black text-sm lg:text-base leading-tight truncate">{getDisplayName(currentEntry)}</div>
                              <div className="sm:hidden"><RankBadge points={currentEntry.points} size="sm" showLabel={false} /></div>
                              <div className="font-black text-base sm:hidden flex items-center gap-1"><PointsCoin size="sm" />{formatPoints(currentEntry.points)}</div>
                            </Link>

                            <div className="grid grid-cols-4 sm:flex items-start sm:items-center justify-between sm:justify-start w-full sm:w-auto text-xs sm:text-sm pl-8 sm:pl-0 font-black text-main gap-2 sm:gap-0">
                              <div className="hidden sm:flex w-28 justify-center"><RankBadge points={currentEntry.points} size="sm" showLabel={false} /></div>
                              <div className="hidden sm:flex w-24 justify-center items-center gap-1"><PointsCoin size="sm" />{formatPoints(currentEntry.points)}</div>
                              <div className="w-auto sm:w-32 text-center flex flex-col sm:flex-row items-center sm:justify-center"><span className="sm:hidden text-[9px] uppercase tracking-widest opacity-70 mb-0.5">{t('ui.exact')}</span>{currentEntry.exact_scores}</div>
                              <div className="w-auto sm:w-32 text-center flex flex-col sm:flex-row sm:items-center sm:justify-center gap-1 sm:gap-2"><span className="sm:hidden text-[9px] uppercase tracking-widest opacity-70 mb-0.5">{t('ui.accuracy')}</span><span>{currentEntry.accuracy}%</span></div>
                              <div className="w-auto sm:w-20 text-center flex flex-col sm:flex-row items-center sm:justify-center gap-0.5"><span className="sm:hidden text-[9px] uppercase tracking-widest opacity-70 mb-0.5">{t('ui.streak')}</span><StreakBadge streak={currentEntry.streak} size="sm" /></div>
                              <div className="w-auto sm:w-20 text-center flex flex-col sm:flex-row items-center sm:justify-center font-black"><span className="sm:hidden text-[9px] uppercase tracking-widest opacity-70 mb-0.5">{t('ui.change')}</span><span className="text-c3 font-black bg-main text-[#E4FF00] px-1 shadow-[2px_2px_0_0_var(--color-card)] border border-card">{t('ui.live')}</span></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="order-1 xl:order-2 w-full xl:w-[350px] bg-card flex flex-col flex-shrink-0 self-stretch border-b-4 xl:border-b-0 border-main">
              <div className="bg-card flex flex-col border-b-4 border-main">
                <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-xs flex justify-between items-center border-b-4 border-main min-h-[48px]">
                  <span>{t('ui.yourStats')}</span>
                  <span className="text-faint font-bold hover:text-inv cursor-pointer lowercase hover:underline">{t('ui.viewFullStats')}</span>
                </div>
                <div className="p-4 flex flex-col gap-3 font-bold text-sm">
                  <div className="flex justify-between items-center pb-2 border-b-2 border-line border-dashed text-subtle">
                    <span className="flex items-center gap-2 text-main"><Trophy size={16} /> {t('ui.rank')}</span>
                    <span className="text-main font-black">{currentRank}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b-2 border-line border-dashed text-subtle">
                    <span className="flex items-center gap-2 text-main"><Star size={16} /> {t('ui.tier')}</span>
                    <RankBadge points={currentEntry?.points ?? 0} size="sm" />
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b-2 border-line border-dashed text-subtle">
                    <span className="flex items-center gap-2 text-main"><PointsCoin size="sm" /> {t('ui.pointsShort')}</span>
                    <span className="text-main font-black flex items-center gap-1"><PointsCoin size="sm" />{formatPoints(currentEntry?.points)}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b-2 border-line border-dashed text-subtle">
                    <span className="flex items-center gap-2 text-main"><Medal size={16} /> {t('ui.exactScores')}</span>
                    <span className="text-main font-black">{currentEntry?.exact_scores ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b-2 border-line text-subtle">
                    <span className="flex items-center gap-2 text-main"><PointsCoin size="sm" /> {t('ui.totalPoints')}</span>
                    <span className="text-main font-black flex items-center gap-1"><PointsCoin size="sm" />{formatPoints(totalPoints)}</span>
                  </div>
                  <div className="pt-2 flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs uppercase font-black tracking-widest text-main">
                      <span>{t('ui.accuracy')}</span>
                      <span>{currentEntry?.accuracy ?? 0}%</span>
                    </div>
                    <div className="w-full h-3 bg-muted border-2 border-main rounded-sm overflow-hidden">
                      <div className="h-full bg-c3 rounded-sm" style={{ width: `${currentEntry?.accuracy ?? 0}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="hidden xl:flex bg-card flex-col flex-1">
                <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-xs border-b-4 border-main min-h-[48px] flex items-center">
                  {t('ui.topRewardReview')}
                </div>
                <div className="p-4 flex flex-col text-sm font-bold text-main">
                  <div className="flex justify-between items-center pb-2 border-b border-line mb-2">
                    <span className="flex items-center gap-2"><div className="w-5 text-center text-base">1</div> {t('ui.firstPlace')}</span>
                    <span className="text-c3 font-black">{t('ui.manualReview')}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-line mb-2">
                    <span className="flex items-center gap-2"><div className="w-5 text-center text-base">2</div> {t('ui.secondPlace')}</span>
                    <span className="text-c2 font-black">{t('ui.communityOnly')}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-line mb-2">
                    <span className="flex items-center gap-2"><div className="w-5 text-center text-base">3</div> {t('ui.thirdPlaceLabel')}</span>
                    <span className="text-c4 font-black">{t('ui.symbolic')}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t-2 border-main font-black uppercase">
                    <span>{t('ui.entries')}</span>
                    <span className="text-lg">{t('ui.free')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
