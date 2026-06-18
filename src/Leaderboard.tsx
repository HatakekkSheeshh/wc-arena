import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart2, Calendar, Medal, Star, Trophy, User, Users } from 'lucide-react';
import AppShell from './components/layout/AppShell';
import { listGlobalLeaderboard, type LeaderboardEntryWithProfile } from './services/leaderboard';
import { getErrorMessage } from './services/serviceTypes';

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

function formatPoints(value?: number) {
  return (value ?? 0).toLocaleString();
}

function getDisplayName(entry?: LeaderboardEntryWithProfile) {
  return entry?.profiles?.username ?? entry?.user_id ?? '—';
}

function getInitials(entry?: LeaderboardEntryWithProfile) {
  return getDisplayName(entry).slice(0, 2).toUpperCase();
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

function PodiumCard({ item, heightClass, primary }: { item?: PodiumItem; heightClass: string; primary?: boolean }) {
  const rank = item?.rank ?? (primary ? 1 : 0);

  return (
    <div className={`w-full ${primary ? 'sm:w-[40%] xl:w-[38%] pt-12 pb-6 px-4 z-20 shadow-[0px_-2px_0_0_var(--color-shadow)] transform sm:-translate-y-4' : 'sm:w-1/3 pt-10 pb-4 px-3 z-10'} border-4 border-main border-b-0 rounded-t-lg flex flex-col items-center relative ${item?.color ?? 'bg-card'} ${item?.textColor ?? 'text-main'} ${heightClass}`}>
      <div className={`${primary ? 'absolute -top-7 w-14 h-14 text-3xl bg-c1' : 'absolute -top-6 w-12 h-12 text-xl bg-card'} rounded-full border-4 border-main flex items-center justify-center font-black text-main shadow-[2px_2px_0_0_var(--color-shadow)]`}>
        {rank || '—'}
      </div>
      <div className={`${primary ? 'w-20 h-20 md:w-24 md:h-24' : 'w-16 h-16 md:w-20 md:h-20'} rounded-full border-4 border-main overflow-hidden bg-elevated mb-3 flex-shrink-0 shadow-[2px_2px_0_0_var(--color-shadow)] flex items-center justify-center font-black text-main text-xl`}>
        {item?.profiles?.avatar_url ? <img src={item.profiles.avatar_url} alt={getDisplayName(item)} className="w-full h-full object-cover" /> : getInitials(item)}
      </div>
      <div className={`${primary ? 'font-bold text-base md:text-xl' : 'font-bold text-sm md:text-lg'} leading-tight truncate w-full text-center`}>{getDisplayName(item)}</div>
      <div className={`${primary ? 'font-black text-3xl md:text-4xl text-main' : 'font-black text-2xl md:text-3xl'} mb-4`}>{formatPoints(item?.points)} <span className="text-sm md:text-lg">PTS</span></div>
      <div className="bg-card text-main border-2 border-main rounded-sm px-2 py-1 flex items-center gap-1 text-[9px] md:text-[10px] font-black uppercase text-center justify-center shadow-[2px_2px_0_0_var(--color-shadow)]">
        <Star size={12} fill="currentColor" /> EXACT SCORES: {item?.exact_scores ?? 0}
      </div>
    </div>
  );
}

export default function Leaderboard({ isVintage, setIsVintage, isDark, setIsDark, isRounded, setIsRounded, hasShadow, setHasShadow, hasFrame, setHasFrame }: LeaderboardProps) {
  const { t } = useTranslation();
  const themeControls = { isVintage, setIsVintage, isDark, setIsDark, isRounded, setIsRounded, hasShadow, setHasShadow, hasFrame, setHasFrame };
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntryWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    listGlobalLeaderboard()
      .then((nextLeaderboard) => {
        if (!active) return;
        setLeaderboard(nextLeaderboard);
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

  const topRank = leaderboard.find((entry) => entry.rank === 1);
  const secondRank = leaderboard.find((entry) => entry.rank === 2);
  const thirdRank = leaderboard.find((entry) => entry.rank === 3);
  const podium = useMemo(() => [
    secondRank ? { ...secondRank, color: 'bg-c2', textColor: 'text-accent-inv' } : undefined,
    topRank ? { ...topRank, color: 'bg-c1', textColor: 'text-accent-on' } : undefined,
    thirdRank ? { ...thirdRank, color: 'bg-c4', textColor: 'text-accent-on' } : undefined,
  ], [secondRank, thirdRank, topRank]);
  const leaderboardRest = leaderboard.filter((entry) => entry.rank > 3);
  const currentEntry = leaderboard.find((entry) => entry.profiles?.username === 'YourName') ?? leaderboardRest[leaderboardRest.length - 1] ?? leaderboard[0];
  const totalPlayers = leaderboard.length;
  const totalPoints = leaderboard.reduce((sum, entry) => sum + entry.points, 0);

  return (
    <AppShell themeControls={themeControls}>
      <div className="relative z-10 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6 min-h-0">
        <div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col w-full xl:w-1/2 shadow-[8px_8px_0_0_var(--color-shadow)]">
          <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-1 text-main">
            {t('nav.public.leaderboard')}
          </h1>
        </div>

        <div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col gap-4 lg:gap-6 shadow-[8px_8px_0_0_var(--color-shadow)] rounded-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 border-b-4 border-main">
            <div className="flex items-center gap-4 border-b-4 sm:border-r-4 xl:border-b-0 border-main p-4 lg:p-5 bg-c1 text-main">
              <div className="shrink-0"><Trophy size={36} strokeWidth={2.5}/></div>
              <div className="flex flex-col justify-center">
                <div className="text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">Top Score</div>
                <div className="text-2xl sm:text-3xl font-black leading-none">{formatPoints(topRank?.points)}</div>
                <div className="text-[10px] font-bold uppercase mt-1">{getDisplayName(topRank)}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 border-b-4 xl:border-b-0 xl:border-r-4 border-main p-4 lg:p-5 bg-c2 text-inv">
              <div className="shrink-0"><Users size={36} strokeWidth={2.5}/></div>
              <div className="flex flex-col justify-center">
                <div className="text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">TOTAL PLAYERS</div>
                <div className="text-2xl sm:text-3xl font-black leading-none">{totalPlayers.toLocaleString()}</div>
                <div className="text-[10px] font-bold uppercase mt-1">JOINED</div>
              </div>
            </div>
            <div className="flex items-center gap-4 border-b-4 sm:border-b-0 sm:border-r-4 border-main p-4 lg:p-5 bg-c3 text-main">
              <div className="shrink-0"><BarChart2 size={36} strokeWidth={2.5}/></div>
              <div className="flex flex-col justify-center">
                <div className="text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">YOUR RANK</div>
                <div className="text-2xl sm:text-3xl font-black leading-none">{currentEntry?.rank ?? '—'}</div>
                <div className="text-[10px] font-bold uppercase mt-1 opacity-80">OUT OF {totalPlayers.toLocaleString()}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 border-main p-4 lg:p-5 bg-c4 text-main">
              <div className="shrink-0"><Star size={36} fill="currentColor" strokeWidth={2.5}/></div>
              <div className="flex flex-col justify-center">
                <div className="text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">YOUR POINTS</div>
                <div className="text-2xl sm:text-3xl font-black leading-none">{formatPoints(currentEntry?.points)}</div>
                <div className="text-[10px] font-bold uppercase mt-1">TOTAL POINTS</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row flex-1 items-stretch">
            <div className="flex-1 border-r-0 xl:border-r-4 border-main flex flex-col bg-card min-w-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 font-black text-xs md:text-sm uppercase tracking-wide border-b-4 border-main">
                <div className="flex bg-card border-b-4 sm:border-b-0 sm:border-r-4 border-main overflow-hidden">
                  <button className="bg-c2 text-accent-inv px-2 py-2 md:py-3 border-r-4 border-main flex-1 text-center">GLOBAL</button>
                  <button className="text-main hover:bg-elevated px-2 py-2 md:py-3 border-r-4 border-main flex-1 text-center">FRIENDS</button>
                  <button className="text-main hover:bg-elevated px-2 py-2 md:py-3 flex-1 text-center">WEEKLY</button>
                </div>
                <div className="flex bg-card overflow-hidden">
                  <button className="bg-c2 text-accent-inv px-1 py-2 md:py-3 border-r-4 border-main flex-1 text-center">GROUP STAGE</button>
                  <button className="text-main hover:bg-elevated px-1 py-2 md:py-3 border-r-4 border-main flex-1 text-center">KNOCKOUT</button>
                  <button className="text-main hover:bg-elevated px-1 py-2 md:py-3 flex-1 text-center">OVERALL</button>
                </div>
              </div>

              <div className="bg-card flex flex-col">
                {loading && <div className="p-6 font-black uppercase text-sm">Loading leaderboard...</div>}
                {error && <div className="p-6 font-black uppercase text-sm bg-c5 text-main border-b-4 border-main">{error}</div>}
                {!loading && !error && leaderboard.length === 0 && <div className="p-6 font-black uppercase text-sm">No leaderboard entries published yet.</div>}
                {!loading && !error && leaderboard.length > 0 && (
                  <>
                    <div className="flex flex-col sm:flex-row items-end p-4 md:p-6 lg:p-8 pb-0 gap-4 md:gap-0 justify-center">
                      <PodiumCard item={podium[0]} heightClass="sm:-mr-2 sm:shadow-[2px_0px_0_0_var(--color-shadow)]" />
                      <PodiumCard item={podium[1]} heightClass="" primary />
                      <PodiumCard item={podium[2]} heightClass="sm:-ml-2 sm:shadow-[-2px_0px_0_0_var(--color-shadow)]" />
                    </div>

                    <div className="border-t-4 border-main">
                      <div className="hidden sm:flex items-center border-b-4 border-main p-3 font-black text-xs uppercase bg-card text-main tracking-wide">
                        <div className="w-16 text-center">RANK</div>
                        <div className="w-12"></div>
                        <div className="flex-1">PLAYER</div>
                        <div className="w-24 text-center">POINTS</div>
                        <div className="w-32 text-center text-[10px] lg:text-xs">EXACT SCORES</div>
                        <div className="w-32 text-center">ACCURACY</div>
                        <div className="w-20 text-center">STREAK</div>
                        <div className="w-20 text-center">CHANGE</div>
                      </div>

                      <div className="flex flex-col">
                        {leaderboardRest.map((item) => {
                          const change = getRankChange(item);
                          return (
                            <div key={item.user_id} className="flex flex-col sm:flex-row sm:items-center p-3 lg:p-3 border-b-2 border-line hover:bg-muted transition-colors">
                              <div className="flex items-center flex-1 sm:w-auto mb-2 sm:mb-0">
                                <div className="w-10 sm:w-16 font-black text-base sm:text-lg text-center">{item.rank}</div>
                                <Avatar entry={item} />
                                <div className="flex-1 font-bold text-sm lg:text-base leading-tight truncate">{getDisplayName(item)}</div>
                                <div className="font-black text-base sm:hidden">{formatPoints(item.points)}</div>
                              </div>

                              <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto text-xs sm:text-sm pl-10 sm:pl-0 font-bold">
                                <div className="hidden sm:block w-24 text-center text-sm">{formatPoints(item.points)}</div>
                                <div className="w-auto sm:w-32 text-center text-subtle sm:text-main flex flex-col sm:flex-row items-center sm:justify-center">
                                  <span className="sm:hidden text-[9px] uppercase font-black tracking-widest text-faint mb-0.5">EXACT</span>
                                  {item.exact_scores}
                                </div>
                                <div className="w-auto sm:w-32 text-center flex flex-col sm:flex-row sm:items-center sm:justify-center gap-1 sm:gap-2">
                                  <span className="sm:hidden text-[9px] uppercase font-black tracking-widest text-faint mb-0.5">ACCURACY</span>
                                  <div className="flex items-center justify-center gap-2">
                                    <span className="w-8 text-right font-medium">{item.accuracy}%</span>
                                    <div className="hidden sm:block w-12 h-2 bg-muted rounded-full border border-main overflow-hidden">
                                      <div className="bg-c3 h-full" style={{ width: `${item.accuracy}%` }} />
                                    </div>
                                  </div>
                                </div>
                                <div className="w-auto sm:w-20 text-center flex flex-col sm:flex-row items-center sm:justify-center gap-0.5 font-medium">
                                  <span className="sm:hidden text-[9px] uppercase font-black tracking-widest text-faint mb-0.5">STREAK</span>
                                  {item.streak}
                                </div>
                                <div className="w-auto sm:w-20 text-center flex flex-col sm:flex-row items-center sm:justify-center">
                                  <span className="sm:hidden text-[9px] uppercase font-black tracking-widest text-faint mb-0.5">CHANGE</span>
                                  {change > 0 ? <span className="text-c3 drop-shadow-[1px_1px_0_var(--color-main)]">▲ {change}</span> : change < 0 ? <span className="text-c5 drop-shadow-[1px_1px_0_var(--color-main)]">▼ {Math.abs(change)}</span> : <span className="text-subtle font-bold">—</span>}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {currentEntry && (
                          <div className="flex flex-col sm:flex-row sm:items-center p-3 lg:p-3 bg-c1 border-y-4 border-main hover:opacity-90">
                            <div className="flex items-center flex-1 sm:w-auto mb-2 sm:mb-0 text-main">
                              <div className="w-10 sm:w-16 font-black text-lg text-center">{currentEntry.rank}</div>
                              <Avatar entry={currentEntry} />
                              <div className="flex-1 font-black text-sm lg:text-base leading-tight truncate">{getDisplayName(currentEntry)}</div>
                              <div className="font-black text-base sm:hidden">{formatPoints(currentEntry.points)}</div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto text-xs sm:text-sm pl-10 sm:pl-0 font-black text-main">
                              <div className="hidden sm:block w-24 text-center">{formatPoints(currentEntry.points)}</div>
                              <div className="w-auto sm:w-32 text-center flex flex-col sm:flex-row items-center sm:justify-center"><span className="sm:hidden text-[9px] uppercase tracking-widest opacity-70 mb-0.5">EXACT</span>{currentEntry.exact_scores}</div>
                              <div className="w-auto sm:w-32 text-center flex flex-col sm:flex-row sm:items-center sm:justify-center gap-1 sm:gap-2"><span className="sm:hidden text-[9px] uppercase tracking-widest opacity-70 mb-0.5">ACCURACY</span><span>{currentEntry.accuracy}%</span></div>
                              <div className="w-auto sm:w-20 text-center flex flex-col sm:flex-row items-center sm:justify-center gap-0.5"><span className="sm:hidden text-[9px] uppercase tracking-widest opacity-70 mb-0.5">STREAK</span>{currentEntry.streak}</div>
                              <div className="w-auto sm:w-20 text-center flex flex-col sm:flex-row items-center sm:justify-center font-black"><span className="sm:hidden text-[9px] uppercase tracking-widest opacity-70 mb-0.5">CHANGE</span><span className="text-c3 font-black bg-main text-[#E4FF00] px-1 shadow-[2px_2px_0_0_var(--color-card)] border border-card">LIVE</span></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="w-full xl:w-[350px] bg-card flex flex-col flex-shrink-0 self-stretch">
              <div className="bg-card flex flex-col border-b-4 border-main">
                <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-xs flex justify-between items-center border-b-4 border-main min-h-[48px]">
                  <span>YOUR STATS</span>
                  <span className="text-faint font-bold hover:text-inv cursor-pointer lowercase hover:underline">VIEW FULL STATS</span>
                </div>
                <div className="p-4 flex flex-col gap-3 font-bold text-sm">
                  <div className="flex justify-between items-center pb-2 border-b-2 border-line border-dashed text-subtle">
                    <span className="flex items-center gap-2 text-main"><Trophy size={16} /> RANK</span>
                    <span className="text-main font-black">{currentEntry?.rank ?? '—'}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b-2 border-line border-dashed text-subtle">
                    <span className="flex items-center gap-2 text-main"><Star size={16} /> POINTS</span>
                    <span className="text-main font-black">{formatPoints(currentEntry?.points)}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b-2 border-line border-dashed text-subtle">
                    <span className="flex items-center gap-2 text-main"><Medal size={16} /> EXACT SCORES</span>
                    <span className="text-main font-black">{currentEntry?.exact_scores ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b-2 border-line text-subtle">
                    <span className="flex items-center gap-2 text-main"><Calendar size={16} /> TOTAL POINTS</span>
                    <span className="text-main font-black">{formatPoints(totalPoints)}</span>
                  </div>
                  <div className="pt-2 flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs uppercase font-black tracking-widest text-main">
                      <span>ACCURACY</span>
                      <span>{currentEntry?.accuracy ?? 0}%</span>
                    </div>
                    <div className="w-full h-3 bg-muted border-2 border-main overflow-hidden">
                      <div className="h-full bg-c3" style={{ width: `${currentEntry?.accuracy ?? 0}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card flex flex-col flex-1">
                <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-xs border-b-4 border-main min-h-[48px] flex items-center">
                  TOP REWARD REVIEW
                </div>
                <div className="p-4 flex flex-col text-sm font-bold text-main">
                  <div className="flex justify-between items-center pb-2 border-b border-line mb-2">
                    <span className="flex items-center gap-2"><div className="w-5 text-center text-base">1</div> 1ST PLACE</span>
                    <span className="text-c3 font-black">Manual Review</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-line mb-2">
                    <span className="flex items-center gap-2"><div className="w-5 text-center text-base">2</div> 2ND PLACE</span>
                    <span className="text-c2 font-black">Sponsor-backed</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-line mb-2">
                    <span className="flex items-center gap-2"><div className="w-5 text-center text-base">3</div> 3RD PLACE</span>
                    <span className="text-c4 font-black">Symbolic</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t-2 border-main font-black uppercase">
                    <span>Entries</span>
                    <span className="text-lg">Free</span>
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
