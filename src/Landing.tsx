import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Users, Clock, ArrowRight, User, Target, CheckCircle, TrendingUp, Pencil, Lock } from 'lucide-react';
import LegacySettingsMenu from './components/LegacySettingsMenu';
import { listGlobalLeaderboard, type LeaderboardEntryWithProfile } from './services/leaderboard';
import { getEffectiveMatchStatus, listMatches, type MatchRow } from './services/matches';
import { getTeamMap, type TeamRow } from './services/teams';
import { getErrorMessage } from './services/serviceTypes';
import { getPublicDisplayName } from './utils/displayName';
import { getTeamFlag } from './utils/teamFlags';

export function PitchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <path d="M12 5v14" />
      <circle cx="12" cy="12" r="3" />
      <path d="M2 9v6" />
      <path d="M22 9v6" />
      <rect x="2" y="9" width="3" height="6" />
      <rect x="19" y="9" width="3" height="6" />
    </svg>
  );
}

export const RainbowGraphic = ({ alt }: { alt: string }) => (
  <div className="absolute top-0 right-0 w-full md:w-[55%] lg:w-[60%] xl:w-[65%] h-full pointer-events-none z-0 overflow-hidden hidden md:block">
    <div className="wc-rainbow-fade absolute inset-0 bg-gradient-to-r from-card via-transparent to-transparent w-full z-10 hidden md:block"></div>
    <img src="https://s6.imgcdn.dev/Ybh5S0.webp" alt={alt} className="wc-rainbow-img w-full h-full object-cover object-left lg:object-center relative z-0" />
  </div>
);

type LandingProps = {
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(value)).toUpperCase();
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function formatDuration(target: string, now: Date) {
  const seconds = Math.max(0, Math.floor((new Date(target).getTime() - now.getTime()) / 1000));
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}D ${hours}H`;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function TeamFlag({ team }: { team?: TeamRow }) {
  const FlagIcon = getTeamFlag(team?.country_code, team?.short_name);
  return FlagIcon ? <FlagIcon className="w-full h-full object-cover" /> : <span className="font-black text-[10px]">{team?.short_name ?? '?'}</span>;
}

function getUpcomingMatches(matches: MatchRow[], now: Date) {
  const upcoming = matches.filter((match) => !['finished', 'postponed', 'cancelled'].includes(getEffectiveMatchStatus(match, now)));
  return (upcoming.length ? upcoming : matches).slice(0, 3);
}

export default function Landing({ onNavigate, isVintage, setIsVintage, isDark, setIsDark, isRounded, setIsRounded, hasShadow, setHasShadow, hasFrame, setHasFrame }: LandingProps) {
  const { t } = useTranslation();
  const themeControls = { isVintage, setIsVintage, isDark, setIsDark, isRounded, setIsRounded, hasShadow, setHasShadow, hasFrame, setHasFrame };
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [teams, setTeams] = useState<Map<string, TeamRow>>(new Map());
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntryWithProfile[]>([]);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [now, setNow] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([listMatches(), getTeamMap(), listGlobalLeaderboard()])
      .then(([nextMatches, nextTeams, nextLeaderboard]) => {
        if (!active) return;
        setMatches(nextMatches);
        setTeams(nextTeams);
        setLeaderboard(nextLeaderboard.slice(0, 5));
        setTotalPlayers(nextLeaderboard.length);
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

  const visibleMatches = useMemo(() => getUpcomingMatches(matches, now), [matches, now]);
  const nextDeadline = useMemo(() => {
    return matches.find((match) => new Date(match.lock_at) > now && ['open', 'scheduled'].includes(getEffectiveMatchStatus(match, now)));
  }, [matches, now]);
  const stats = [
    { label: t('landing.stats.pointsGame'), value: t('ui.free'), bgColor: 'bg-c1', textColor: 'text-accent-on', icon: <Trophy size={36} strokeWidth={2.5}/> },
    { label: t('landing.stats.players'), value: totalPlayers ? totalPlayers.toLocaleString() : '—', bgColor: 'bg-c2', textColor: 'text-accent-inv', icon: <Users size={36} strokeWidth={2.5}/> },
    { label: t('landing.stats.matches'), value: matches.length ? matches.length.toLocaleString() : '—', bgColor: 'bg-c3', textColor: 'text-accent-on', icon: <PitchIcon className="w-9 h-9" /> },
    { label: t('landing.stats.deadline'), value: nextDeadline ? formatDuration(nextDeadline.lock_at, now) : '—', bgColor: 'bg-c5', textColor: 'text-accent-inv', icon: <Clock size={36} strokeWidth={2.5}/> },
  ];

  return (
    <div className="min-h-screen bg-page p-3 sm:p-4 lg:p-6 flex items-center justify-center font-sans">
      <div className="w-full max-w-[1600px] bg-card border-4 border-main rounded-lg shadow-[8px_8px_0px_var(--color-shadow)] sm:shadow-[16px_16px_0px_var(--color-shadow)] overflow-hidden flex flex-col mx-auto transition-all">

        <div className="w-full h-8 border-b-4 border-main bg-main flex items-center px-4 gap-2">
          <div className="w-3 h-3 rounded-full bg-c5"></div>
          <div className="w-3 h-3 rounded-full bg-c1"></div>
          <div className="w-3 h-3 rounded-full bg-c3"></div>
        </div>

        <nav className="flex items-center justify-between border-b-4 border-main px-6 py-4 bg-card z-20 relative">
          <div className="text-2xl md:text-3xl font-black uppercase tracking-tighter cursor-pointer" onClick={() => onNavigate('landing')}>{t('common.product')}</div>
          <div className="hidden lg:flex space-x-10 font-bold uppercase text-sm tracking-wide">
            <button className="hover:text-c2 transition-colors pb-1 text-main" onClick={() => onNavigate('matches')}>{t('nav.public.matches')}</button>
            <button className="hover:text-c2 transition-colors pb-1 text-main" onClick={() => onNavigate('leaderboard')}>{t('nav.public.leaderboard')}</button>
            <button className="hover:text-c2 transition-colors pb-1 text-main" onClick={() => onNavigate('rules')}>{t('nav.public.rules')}</button>
            <button className="hover:text-c2 transition-colors pb-1 text-main" onClick={() => onNavigate('points-guide')}>{t('nav.public.pointsGuide')}</button>
          </div>
          <div className="flex items-center gap-3">
            <LegacySettingsMenu {...themeControls} />
            <button onClick={() => onNavigate('register')} className="bg-c2 hover:opacity-80 transition-opacity text-inv font-black py-2 px-4 md:px-6 border-2 border-main flex items-center gap-2 transition-transform transform active:scale-95 shadow-[4px_4px_0_0_var(--color-shadow)] uppercase text-xs md:text-sm">
              {t('landing.joinNow')} <ArrowRight size={18} strokeWidth={3} />
            </button>
          </div>
        </nav>

        <div className="relative border-b-4 border-main bg-card overflow-hidden min-h-[350px] flex items-center">
          <RainbowGraphic alt={t('ui.backgroundGraphic')} />

          <div className="relative z-10 w-full md:w-[60%] lg:w-[50%] xl:w-[45%] p-8 lg:p-10 lg:pr-10 xl:p-12">
            <h1 className="text-4xl sm:text-5xl lg:text-5xl xl:text-6xl font-black uppercase leading-[0.95] tracking-tighter mb-3 lg:mb-4 text-main drop-shadow-sm md:drop-shadow-none">
              {t('landing.heroLine1')}<br/>
              {t('landing.heroLine2')}<br/>
              {t('landing.heroLine3')}
            </h1>
            <p className="font-semibold text-sm sm:text-base lg:text-lg max-w-lg lg:max-w-xl mb-6 lg:mb-8 leading-snug text-subtle drop-shadow-sm md:drop-shadow-none">
              {t('landing.heroBody')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={() => onNavigate('register')} className="bg-c2 hover:opacity-80 transition-opacity text-inv font-black px-8 py-3 lg:py-4 uppercase flex items-center justify-center gap-3 border-[3px] border-main shadow-[4px_4px_0px_var(--color-shadow)] focus:translate-y-[2px] focus:translate-x-[2px] focus:shadow-none transition-all">
                {t('landing.makePredictions')} <ArrowRight size={20} className="mt-0.5" strokeWidth={3} />
              </button>
              <button onClick={() => onNavigate('leaderboard')} className="bg-card hover:bg-muted text-main font-black px-8 py-3 lg:py-4 uppercase flex items-center justify-center border-[3px] border-main shadow-[4px_4px_0px_var(--color-shadow)] focus:translate-y-[2px] focus:translate-x-[2px] focus:shadow-none transition-all">
                {t('landing.viewLeaderboard')}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 border-b-4 border-main">
          {stats.map((stat, i) => (
            <div key={i} className={`flex items-center gap-4 ${i !== 3 ? 'lg:border-r-4' : ''} border-main ${i === 0 || i === 1 ? 'border-b-4 lg:border-b-0' : ''} ${i % 2 === 0 ? 'border-r-4' : ''} lg:border-b-0 p-4 lg:p-5 ${stat.bgColor} ${stat.textColor}`}>
              <div className="shrink-0">{stat.icon}</div>
              <div className="flex flex-col justify-center">
                <div className="text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">{stat.label}</div>
                <div className="text-2xl sm:text-3xl lg:text-[2rem] font-black leading-none">{loading ? '…' : stat.value}</div>
              </div>
            </div>
          ))}
        </div>

        {error && <div className="p-4 bg-c5 text-main border-b-4 border-main font-black uppercase text-sm">{error}</div>}

        <div className="flex flex-col lg:flex-row flex-1">
          <div className="flex-1 border-r-0 lg:border-r-4 border-main flex flex-col">
            <div className="bg-main text-inv font-black px-4 py-2 uppercase tracking-wide text-sm border-b-4 border-main flex items-center">
              {t('landing.upcomingMatches')}
            </div>

            <div className="flex flex-col bg-card">
              {loading && <div className="p-6 font-black uppercase text-sm border-b-4 border-main">{t('ui.loadingMatches')}</div>}
              {!loading && !error && visibleMatches.length === 0 && <div className="p-6 font-black uppercase text-sm border-b-4 border-main">{t('ui.noMatches')}</div>}
              {!loading && visibleMatches.map((match) => {
                const homeTeam = teams.get(match.home_team_id);
                const awayTeam = teams.get(match.away_team_id);
                return (
                  <div key={match.id} className="flex flex-col sm:flex-row border-b-4 border-main group">
                    <div className="w-full sm:w-20 md:w-24 border-b-4 sm:border-b-0 sm:border-r-4 border-main flex flex-row sm:flex-col items-center sm:justify-center p-2 sm:p-3 bg-c1 text-main gap-2 sm:gap-0">
                      <div className="font-bold text-xs lg:text-sm uppercase whitespace-nowrap">{formatDate(match.kickoff_at)}</div>
                      <div className="font-black text-xl lg:text-2xl leading-none">{formatTime(match.kickoff_at)}</div>
                      <div className="font-bold text-[10px] lg:text-xs uppercase opacity-80 sm:mt-1">{t('ui.utc')}</div>
                    </div>

                    <div className="flex-1 flex items-center justify-between p-3 lg:p-4">
                      <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 w-[30%] justify-start">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 border-2 border-main rounded-full overflow-hidden text-lg lg:text-2xl flex items-center justify-center bg-elevated flex-shrink-0">
                          <TeamFlag team={homeTeam} />
                        </div>
                        <span className="font-black text-sm sm:text-base lg:text-xl uppercase tracking-wide truncate">{homeTeam?.name ?? match.home_team_id}</span>
                      </div>

                      <div className="flex flex-col items-center justify-center flex-1 px-2 border-x-4 border-main border-opacity-10 sm:border-transparent">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <input type="text" maxLength={1} placeholder="-" className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-10 border-[3px] border-main flex items-center justify-center font-black text-lg text-center bg-card shadow-[2px_2px_0_0_var(--color-shadow)] focus:shadow-none focus:translate-y-[2px] transition-all outline-none" />
                          <div className="font-black text-xl lg:text-2xl">-</div>
                          <input type="text" maxLength={1} placeholder="-" className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-10 border-[3px] border-main flex items-center justify-center font-black text-lg text-center bg-card shadow-[2px_2px_0_0_var(--color-shadow)] focus:shadow-none focus:translate-y-[2px] transition-all outline-none" />
                        </div>
                        <div className="text-[9px] sm:text-[10px] font-bold mt-1 tracking-wider uppercase border border-main bg-muted px-1.5 py-0.5 rounded-sm">{t('landing.kickoffIn', { time: formatDuration(match.kickoff_at, now) })}</div>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 w-[30%] justify-end">
                        <span className="font-black text-sm sm:text-base lg:text-xl uppercase tracking-wide truncate text-right">{awayTeam?.name ?? match.away_team_id}</span>
                        <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 border-2 border-main rounded-full overflow-hidden text-lg lg:text-2xl flex items-center justify-center bg-elevated flex-shrink-0">
                          <TeamFlag team={awayTeam} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div onClick={() => onNavigate('picks')} className="bg-c2 hover:opacity-80 transition-opacity transition-colors text-inv font-black text-lg sm:text-xl py-4 flex items-center justify-center gap-3 border-b-4 border-main cursor-pointer shadow-[0_-4px_0_0_inset_rgba(0,0,0,0.2)]">
              {t('landing.savePicks')} <ArrowRight size={22} strokeWidth={3} className="mt-0.5" />
            </div>

            <div className="flex flex-col sm:flex-row bg-card h-auto sm:h-[100px] flex-shrink-0">
              <div className="flex items-stretch border-b-4 sm:border-b-0 sm:border-r-4 border-main flex-1 min-h-[80px]">
                <div className="w-12 lg:w-16 flex items-center justify-center border-r-4 border-main font-black text-3xl lg:text-[2.5rem]">1</div>
                <div className="w-12 lg:w-16 flex items-center justify-center border-r-4 border-main bg-c1">
                  <Pencil size={24} strokeWidth={2.5} className="text-accent-on" />
                </div>
                <div className="p-2 sm:p-3 lg:p-4 flex flex-col justify-center">
                  <div className="font-black uppercase text-xs lg:text-sm mb-0.5">{t('landing.steps.predict')}</div>
                  <div className="font-medium text-[10px] lg:text-xs text-subtle leading-tight">{t('landing.steps.predictBody')}</div>
                </div>
              </div>

              <div className="flex items-stretch border-b-4 sm:border-b-0 sm:border-r-4 border-main flex-1 min-h-[80px]">
                <div className="w-12 lg:w-16 flex items-center justify-center border-r-4 border-main font-black text-3xl lg:text-[2.5rem]">2</div>
                <div className="w-12 lg:w-16 flex items-center justify-center border-r-4 border-main bg-c2">
                  <Lock size={24} strokeWidth={2.5} className="text-accent-inv" />
                </div>
                <div className="p-2 sm:p-3 lg:p-4 flex flex-col justify-center">
                  <div className="font-black uppercase text-xs lg:text-sm mb-0.5 truncate">{t('landing.steps.lock')}</div>
                  <div className="font-medium text-[10px] lg:text-xs text-subtle leading-tight">{t('landing.steps.lockBody')}</div>
                </div>
              </div>

              <div className="flex items-stretch flex-1 min-h-[80px]">
                <div className="w-12 lg:w-16 flex items-center justify-center border-r-4 border-main font-black text-3xl lg:text-[2.5rem]">3</div>
                <div className="w-12 lg:w-16 flex items-center justify-center border-r-4 border-main bg-c4">
                  <Trophy size={24} strokeWidth={2.5} className="text-accent-on" />
                </div>
                <div className="p-2 sm:p-3 lg:p-4 flex flex-col justify-center">
                  <div className="font-black uppercase text-xs lg:text-sm mb-0.5">{t('landing.steps.rewards')}</div>
                  <div className="font-medium text-[10px] lg:text-xs text-subtle leading-tight">{t('landing.steps.rewardsBody')}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-[380px] bg-card flex flex-col border-t-4 border-main lg:border-t-0">
            <div className="bg-main text-inv font-black px-4 py-2 uppercase tracking-wide text-sm border-b-4 border-main flex items-center">
              {t('landing.topLeaderboard')}
            </div>

            <div className="flex flex-col bg-card border-b-4 border-main">
              {loading && <div className="p-4 font-black uppercase text-sm">{t('ui.loadingLeaderboard')}</div>}
              {!loading && leaderboard.length === 0 && <div className="p-4 font-black uppercase text-sm">{t('ui.noLeaderboardEntries')}</div>}
              {!loading && leaderboard.map((item, index) => (
                <div key={item.user_id} className="flex border-b-4 border-main last:border-b-0 items-stretch hover:bg-elevated transition-colors">
                  <div className={`w-10 sm:w-12 border-r-4 border-main flex items-center justify-center font-black text-lg sm:text-xl ${index === 0 ? 'bg-c1 text-accent-on' : index === 1 ? 'bg-c2 text-accent-inv' : index === 2 ? 'bg-c3 text-accent-on' : index === 3 ? 'bg-c4 text-accent-on' : 'bg-c5 text-accent-inv'}`}>
                    {item.rank}
                  </div>
                  <div className="p-3 border-r-4 border-main flex items-center justify-center bg-elevated">
                    <User size={18} strokeWidth={3} className="text-main" />
                  </div>
                  <div className="flex-1 p-3 font-bold flex items-center text-sm md:text-base">
                    {getPublicDisplayName(item.profiles, item.user_id)}
                  </div>
                  <div className="p-3 font-black text-sm md:text-base flex items-center justify-end text-main">
                    {item.points.toLocaleString()} {t('ui.pointsShort')}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-main text-inv font-black px-4 py-2 uppercase tracking-wide text-sm border-b-4 border-main">
              {t('landing.scoringTitle')}
            </div>

            <div className="p-4 flex flex-col gap-3 font-bold text-sm bg-card flex-1">
              <div className="flex items-center gap-3">
                <div className="bg-c1 p-1 border-2 border-main flex items-center justify-center">
                  <Target size={20} strokeWidth={3} className="text-accent-on"/>
                </div>
                <span>{t('landing.exactScore')}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-c2 text-inv p-1 border-2 border-main flex items-center justify-center">
                  <CheckCircle size={20} strokeWidth={3} className="text-accent-inv"/>
                </div>
                <span>{t('landing.correctOutcome')}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-c4 text-inv p-1 border-2 border-main flex items-center justify-center">
                  <TrendingUp size={20} strokeWidth={3} className="text-accent-inv"/>
                </div>
                <span>{t('landing.streakBonus')}</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
