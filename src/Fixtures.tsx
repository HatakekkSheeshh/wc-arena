import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  BarChart2,
  Binoculars,
  Calendar,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock,
  Flag,
  MonitorPlay,
  Pencil,
  Settings,
  Star,
  Trophy,
  XCircle,
} from 'lucide-react';
import AppShell from './components/layout/AppShell';
import { getErrorMessage } from './services/serviceTypes';
import { listMatches, type MatchRow } from './services/matches';
import { getTeamMap, type TeamRow } from './services/teams';
import { getTeamFlag } from './utils/teamFlags';

type FixturesProps = {
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

type StageFilter = 'group' | 'round32' | 'round16' | 'quarter' | 'semi' | 'third_place' | 'final';
type StatusFilter = 'all' | 'open' | 'locked' | 'live' | 'finished';

const stageLabels: Record<StageFilter, string> = {
  group: 'GROUP STAGE',
  round32: 'ROUND OF 32',
  round16: 'ROUND OF 16',
  quarter: 'QUARTER-FINALS',
  semi: 'SEMI-FINALS',
  third_place: 'THIRD PLACE',
  final: 'FINAL',
};

const MATCHES_PER_PAGE = 12;

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function formatDateRange(matches: MatchRow[]) {
  if (!matches.length) return 'NO MATCHES';
  return `${formatDate(matches[0].kickoff_at)} - ${formatDate(matches[matches.length - 1].kickoff_at)}`;
}

function getStatusLabel(status: string) {
  if (status === 'finished') return 'COMPLETED';
  return status.toUpperCase();
}

function getStatusClass(status: string) {
  if (status === 'open') return 'bg-c5 text-main';
  if (status === 'locked') return 'bg-muted text-main';
  if (status === 'live') return 'bg-c4 text-inv';
  if (status === 'finished') return 'font-black text-[10px] uppercase text-subtle px-3 py-1';
  return 'bg-c1 text-main';
}

function TeamFlag({ team }: { team?: TeamRow }) {
  const FlagIcon = getTeamFlag(team?.country_code, team?.short_name);

  return (
    <div className="w-8 h-8 lg:w-10 lg:h-10 border-2 border-main rounded-full overflow-hidden flex items-center justify-center bg-elevated shrink-0">
      {FlagIcon ? <FlagIcon className="w-full h-full object-cover" /> : <span className="font-black text-[10px]">{team?.short_name ?? '?'}</span>}
    </div>
  );
}

function MatchScore({ match }: { match: MatchRow }) {
  if (typeof match.home_score === 'number' && typeof match.away_score === 'number') {
    return (
      <div className={`flex items-center gap-2 ${match.status === 'live' ? 'text-c4' : ''}`}>
        <div className={`w-10 h-10 lg:w-12 lg:h-12 border-[3px] ${match.status === 'live' ? 'border-c4' : 'border-main'} flex items-center justify-center font-black text-xl bg-card`}>{match.home_score}</div>
        <div className="font-black text-xl">-</div>
        <div className={`w-10 h-10 lg:w-12 lg:h-12 border-[3px] ${match.status === 'live' ? 'border-c4' : 'border-main'} flex items-center justify-center font-black text-xl bg-card`}>{match.away_score}</div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="w-10 h-10 lg:w-12 lg:h-12 border-[3px] border-main flex items-center justify-center font-black text-xl bg-card">-</div>
      <div className="font-black text-xl">-</div>
      <div className="w-10 h-10 lg:w-12 lg:h-12 border-[3px] border-main flex items-center justify-center font-black text-xl bg-card">-</div>
    </div>
  );
}

function MatchListRow({ match, homeTeam, awayTeam, featured, onNavigate }: { key?: string; match: MatchRow; homeTeam?: TeamRow; awayTeam?: TeamRow; featured: boolean; onNavigate: (page: string) => void }) {
  const isLive = match.status === 'live';
  const isFinished = match.status === 'finished';

  return (
    <div className={`flex border-b-4 border-main relative hover:bg-page transition-colors ${isLive ? 'bg-[#f0f9ff]' : 'bg-card'} ${isFinished ? 'opacity-80' : ''}`}>
      {featured && (
        <div className="absolute top-0 right-auto sm:left-24 bg-c1 border-x-4 border-b-4 border-main text-main text-[10px] px-3 py-1 flex items-center gap-1 font-black uppercase z-10">
          <Star size={12} className="fill-main" /> FEATURED MATCH
        </div>
      )}
      {isLive && (
        <div className="absolute top-2 left-2 flex items-center gap-1 z-10">
          <div className="w-2 h-2 rounded-full bg-c4 animate-pulse" />
        </div>
      )}
      <div className={`w-24 sm:w-32 border-r-4 border-main flex flex-col pt-6 sm:pt-4 p-2 sm:p-3 justify-start shrink-0 ${isLive ? 'bg-[#f0f9ff] text-c4' : 'bg-card text-main'}`}>
        <span className="font-bold text-[10px] sm:text-xs uppercase whitespace-nowrap mb-0.5">{formatDate(match.kickoff_at)}</span>
        <span className="font-black text-xl sm:text-2xl leading-none">{formatTime(match.kickoff_at)}</span>
        <span className="font-bold text-[9px] sm:text-[10px] uppercase opacity-80 mb-4 md:mb-6 text-subtle">LOCAL</span>
        <div className="mt-auto flex-col gap-0.5 text-faint hidden md:flex">
          <span className="text-[9px] uppercase font-bold leading-tight">{match.stadium}</span>
          <span className="text-[8px] uppercase font-bold opacity-80 leading-tight">{match.city}</span>
        </div>
      </div>
      <div className={`flex-1 flex flex-col md:flex-row items-center p-3 lg:p-6 min-w-0 ${featured ? 'pt-8 lg:pt-8' : ''}`}>
        <div className="flex-1 flex items-center justify-between w-full min-w-0">
          <div className="flex-1 flex items-center justify-end gap-2 text-right min-w-0">
            <span className="font-black text-sm lg:text-lg uppercase tracking-wide hidden sm:block truncate">{homeTeam?.name ?? match.home_team_id}</span>
            <span className="font-black text-sm uppercase sm:hidden">{homeTeam?.short_name ?? match.home_team_id}</span>
            <TeamFlag team={homeTeam} />
          </div>
          <div className="mx-3 flex flex-col items-center gap-1 shrink-0">
            <MatchScore match={match} />
            {isLive && <span className="text-[8px] bg-c4 text-inv px-1 h-3 flex items-center leading-none">LIVE</span>}
            {isFinished && <span className="text-[8px] uppercase text-subtle font-black">FT</span>}
          </div>
          <div className="flex-1 flex items-center justify-start gap-2 text-left min-w-0">
            <TeamFlag team={awayTeam} />
            <span className="font-black text-sm lg:text-lg uppercase tracking-wide hidden sm:block truncate">{awayTeam?.name ?? match.away_team_id}</span>
            <span className="font-black text-sm uppercase sm:hidden">{awayTeam?.short_name ?? match.away_team_id}</span>
          </div>
        </div>
        <div className="w-full md:w-auto mt-4 md:mt-0 md:ml-6 flex items-center gap-3 justify-end shrink-0">
          <span className={`${getStatusClass(match.status)} px-3 py-1 border-2 border-main uppercase`}>{getStatusLabel(match.status)}</span>
          <button onClick={() => onNavigate(`matches/${match.id}`)} className={`${match.status === 'open' ? 'bg-c2 text-inv hover:opacity-90' : 'bg-card hover:bg-page text-main'} font-black text-[10px] px-3 py-1.5 border-2 border-main uppercase flex items-center justify-center gap-1 min-w-24 focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px] transition-all`}>
            {match.status === 'open' ? 'PREDICT' : isFinished ? 'RESULTS' : 'DETAILS'} <ChevronRight size={14} className="-mr-1" strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Fixtures({ onNavigate, isVintage, setIsVintage, isDark, setIsDark, isRounded, setIsRounded, hasShadow, setHasShadow, hasFrame, setHasFrame }: FixturesProps) {
  const { t } = useTranslation();
  const themeControls = { isVintage, setIsVintage, isDark, setIsDark, isRounded, setIsRounded, hasShadow, setHasShadow, hasFrame, setHasFrame };
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [teams, setTeams] = useState<Map<string, TeamRow>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState<StageFilter>('group');
  const [matchdayFilter, setMatchdayFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('open');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([listMatches(), getTeamMap()])
      .then(([nextMatches, nextTeams]) => {
        if (!active) return;
        setMatches(nextMatches);
        setTeams(nextTeams);
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

  const filteredMatches = useMemo(() => matches.filter((match) => {
    const stageMatches = match.stage === stageFilter;
    const matchdayMatches = matchdayFilter === 'all' || String(match.matchday) === matchdayFilter;
    const statusMatches = statusFilter === 'all' || match.status === statusFilter;
    return stageMatches && matchdayMatches && statusMatches;
  }), [matches, matchdayFilter, stageFilter, statusFilter]);

  const matchdays = useMemo(() => Array.from(new Set(matches.filter((match) => match.stage === stageFilter && match.matchday).map((match) => match.matchday))).sort((a, b) => Number(a) - Number(b)), [matches, stageFilter]);
  const pageCount = Math.max(1, Math.ceil(filteredMatches.length / MATCHES_PER_PAGE));
  const currentPage = Math.min(page, pageCount);
  const visibleMatches = filteredMatches.slice((currentPage - 1) * MATCHES_PER_PAGE, currentPage * MATCHES_PER_PAGE);
  const totalMatches = matches.length;
  const liveMatches = matches.filter((match) => match.status === 'live').length;
  const upcomingMatches = matches.filter((match) => match.status === 'open' || match.status === 'scheduled').length;
  const completedMatches = matches.filter((match) => match.status === 'finished').length;
  const nextDeadline = matches.find((match) => match.status === 'open' || match.status === 'scheduled');
  const nextHomeTeam = nextDeadline ? teams.get(nextDeadline.home_team_id) : undefined;
  const nextAwayTeam = nextDeadline ? teams.get(nextDeadline.away_team_id) : undefined;
  const firstOpenMatchId = filteredMatches.find((match) => match.status === 'open')?.id;

  return (
    <AppShell themeControls={themeControls}>
      <div className="relative z-10 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6 min-h-0">
        <div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col w-full xl:w-1/2 shadow-[8px_8px_0_0_var(--color-shadow)]">
          <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-1 text-main">
            {t('nav.public.matches')}
          </h1>
        </div>

        <div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col gap-4 lg:gap-6 shadow-[8px_8px_0_0_var(--color-shadow)] rounded-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 border-b-4 border-main">
            <div className="flex items-center gap-4 border-b-4 sm:border-r-4 xl:border-b-0 border-main p-4 lg:p-5 bg-c3 text-main">
              <div className="shrink-0"><MonitorPlay size={36} strokeWidth={2.5} /></div>
              <div className="flex flex-col justify-center">
                <span className="font-black text-xs uppercase text-main opacity-90 tracking-widest mb-1 leading-none">TOTAL {t('nav.public.matches')}</span>
                <span className="font-black text-2xl sm:text-3xl leading-none text-main">{totalMatches}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 border-b-4 xl:border-b-0 xl:border-r-4 border-main p-4 lg:p-5 bg-c2 text-inv">
              <div className="shrink-0 text-inv"><Activity size={36} strokeWidth={2.5} /></div>
              <div className="flex flex-col justify-center">
                <span className="font-black text-xs uppercase opacity-90 tracking-widest mb-1 leading-none">LIVE NOW</span>
                <span className="font-black text-2xl sm:text-3xl leading-none">{liveMatches}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 border-b-4 sm:border-b-0 sm:border-r-4 border-main p-4 lg:p-5 bg-c5 text-main">
              <div className="shrink-0 text-main"><CalendarDays size={36} strokeWidth={2.5} /></div>
              <div className="flex flex-col justify-center text-main">
                <span className="font-black text-xs uppercase opacity-90 tracking-widest mb-1 leading-none">UPCOMING</span>
                <span className="font-black text-2xl sm:text-3xl leading-none">{upcomingMatches}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 border-main p-4 lg:p-5 bg-[#FF6B00] text-main">
              <div className="shrink-0 text-main"><Flag size={36} strokeWidth={2.5} /></div>
              <div className="flex flex-col justify-center text-main">
                <span className="font-black text-xs uppercase opacity-90 tracking-widest mb-1 leading-none">COMPLETED</span>
                <span className="font-black text-2xl sm:text-3xl leading-none">{completedMatches}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row flex-1 items-stretch">
            <div className="flex-1 border-r-0 lg:border-r-4 border-main flex flex-col min-w-0 bg-muted">
              <div className="flex flex-wrap border-b-4 border-main font-black text-sm md:text-base uppercase">
                {(Object.keys(stageLabels) as StageFilter[]).map((stage) => (
                  <button key={stage} onClick={() => { setStageFilter(stage); setMatchdayFilter('all'); setPage(1); }} className={`${stageFilter === stage ? 'bg-c2 text-accent-inv' : 'bg-card text-main hover:bg-elevated'} px-4 md:px-6 py-3 border-r-4 border-b-4 md:border-b-0 border-main flex-1 min-w-[max-content] md:flex-none`}>
                    {stageLabels[stage]}
                  </button>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between p-3 border-b-4 border-main bg-card gap-3 relative z-20">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 w-full">
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                      <select value={matchdayFilter} onChange={(event) => { setMatchdayFilter(event.target.value); setPage(1); }} className="appearance-none w-full md:w-40 border-2 border-main py-2 pl-3 pr-8 font-black uppercase text-xs bg-card outline-none cursor-pointer focus:translate-y-[2px] focus:translate-x-[2px] focus:shadow-none transition-all">
                        <option value="all">ALL MATCHDAYS</option>
                        {matchdays.map((matchday) => <option key={matchday} value={String(matchday)}>MATCHDAY {matchday}</option>)}
                      </select>
                      <ChevronDown size={14} strokeWidth={3} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    <div className="flex items-center gap-2 border-2 border-main py-2 px-3 bg-page font-bold text-xs uppercase flex-1 md:flex-none justify-center">
                      <Calendar size={14} className="text-main" />
                      {formatDateRange(filteredMatches)}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center border-2 border-main font-bold text-xs uppercase self-stretch md:self-auto overflow-hidden w-full md:w-auto">
                    {(['all', 'open', 'locked', 'live', 'finished'] as StatusFilter[]).map((status) => (
                      <button key={status} onClick={() => { setStatusFilter(status); setPage(1); }} className={`${statusFilter === status ? 'bg-c2 text-accent-inv' : 'bg-card hover:bg-elevated text-main'} px-4 py-1.5 flex-1 md:flex-none border-r-2 border-main border-b-2 sm:border-b-0 last:border-r-0`}>
                        {status === 'finished' ? 'COMPLETED' : status.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col bg-card">
                {loading && <div className="p-6 font-black uppercase text-sm">Loading matches...</div>}
                {error && <div className="p-6 font-black uppercase text-sm bg-c5 text-main border-b-4 border-main">{error}</div>}
                {!loading && !error && filteredMatches.length === 0 && <div className="p-6 font-black uppercase text-sm">No matches found for this filter.</div>}
                {!loading && !error && visibleMatches.map((match) => (
                  <MatchListRow
                    key={match.id}
                    match={match}
                    homeTeam={teams.get(match.home_team_id)}
                    awayTeam={teams.get(match.away_team_id)}
                    featured={match.id === firstOpenMatchId}
                    onNavigate={onNavigate}
                  />
                ))}
                {!loading && !error && filteredMatches.length > MATCHES_PER_PAGE && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-card border-b-4 border-main font-black uppercase text-xs">
                    <span>
                      Showing {(currentPage - 1) * MATCHES_PER_PAGE + 1}-{Math.min(currentPage * MATCHES_PER_PAGE, filteredMatches.length)} of {filteredMatches.length}
                    </span>
                    <div className="flex items-center border-2 border-main overflow-hidden">
                      <button type="button" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="px-4 py-2 border-r-2 border-main bg-card disabled:bg-muted disabled:text-subtle hover:bg-elevated">
                        PREV
                      </button>
                      <span className="px-4 py-2 bg-page border-r-2 border-main">PAGE {currentPage}/{pageCount}</span>
                      <button type="button" disabled={currentPage === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))} className="px-4 py-2 bg-card disabled:bg-muted disabled:text-subtle hover:bg-elevated">
                        NEXT
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="w-full lg:w-[420px] bg-card flex flex-col shrink-0 self-stretch relative z-20">
              <div className="flex flex-col border-b-4 border-main bg-page">
                <div className="bg-main text-inv font-black uppercase text-xs py-3 px-4 min-h-[48px] flex items-center border-b-4 border-main">
                  NEXT DEADLINE
                </div>
                <div className="p-4 flex flex-col items-center text-center">
                  <Clock size={24} className="mb-2 text-main" />
                  <span className="font-bold text-[10px] uppercase mb-1">PREDICTIONS LOCK IN</span>
                  <span className="font-black text-4xl xl:text-5xl text-c4 font-mono tracking-tighter w-full mb-1">{nextDeadline ? formatTime(nextDeadline.lock_at) : '—'}</span>
                  <span className="font-black text-xs uppercase">{nextDeadline ? formatDate(nextDeadline.lock_at) : 'No open deadline'}</span>
                  <span className="font-bold text-xs text-subtle mt-0.5 mb-4">{nextDeadline ? `${nextHomeTeam?.name ?? nextDeadline.home_team_id} vs ${nextAwayTeam?.name ?? nextDeadline.away_team_id}` : 'Check back after fixtures open'}</span>
                  <button onClick={() => onNavigate('picks')} className="w-full bg-c2 hover:opacity-90 text-inv font-black text-xs uppercase py-3 border-2 border-main flex items-center justify-center gap-2 transition-transform active:translate-y-[2px] active:translate-x-[2px] active:shadow-none focus:outline-none">
                    GO TO MY PICKS <ChevronRight size={16} strokeWidth={3} />
                  </button>
                </div>
              </div>

              <div className="flex flex-col flex-1 bg-card">
                <div className="bg-main text-inv font-black uppercase text-xs py-3 px-4 min-h-[48px] flex items-center justify-between border-b-4 border-main">
                  <span>YOUR PREDICTIONS</span>
                  <span className="text-[9px] hover:underline cursor-pointer">VIEW ALL</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center justify-between px-3 py-2 border-b-2 border-line">
                    <div className="flex items-center gap-2 font-bold text-sm"><Clock size={16} className="text-subtle" /> <span>{upcomingMatches}</span></div>
                    <span className="bg-c5 text-main font-black text-[9px] px-2 py-0.5 border-2 border-main uppercase">OPEN</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 border-b-2 border-line">
                    <div className="flex items-center gap-2 font-bold text-sm"><Settings size={16} className="text-subtle" /> <span>{matches.filter((match) => match.status === 'locked').length}</span></div>
                    <span className="bg-c1 text-main font-black text-[9px] px-2 py-0.5 border-2 border-main uppercase">LOCKED</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 border-b-2 border-line">
                    <div className="flex items-center gap-2 font-bold text-sm"><CheckCircle2 size={16} className="text-c5" /> <span>{completedMatches}</span></div>
                    <span className="text-c5 font-black text-[9px] px-2 pt-0.5 uppercase">COMPLETED</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2">
                    <div className="flex items-center gap-2 font-bold text-sm"><XCircle size={16} className="text-c4" /> <span>{matches.filter((match) => match.status === 'postponed' || match.status === 'cancelled').length}</span></div>
                    <span className="text-c4 font-black text-[9px] px-2 pt-0.5 uppercase">VOID</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row border-t-4 border-main bg-card overflow-hidden w-full uppercase shrink-0">
            <div className="flex-1 flex border-b-4 lg:border-b-0 lg:border-r-4 border-main min-h-[90px] xl:min-h-[100px]">
              <div className="w-[4.5rem] bg-c3 flex justify-center items-center border-r-4 border-main shrink-0 text-main pb-1"><span className="font-black text-6xl leading-none">1</span></div>
              <div className="w-16 bg-c3 flex justify-center items-center border-r-4 border-main shrink-0 text-main"><Binoculars size={28} strokeWidth={2.5}/></div>
              <div className="flex flex-col justify-center p-3 flex-1 bg-page"><span className="font-black text-[13px] xl:text-sm tracking-wide">BROWSE FIXTURES</span><span className="text-[10px] xl:text-[11px] font-bold leading-[1.2] capitalize text-subtle mt-1 max-w-[170px]">Explore all World Cup 2026 matches and schedule.</span></div>
            </div>
            <div className="flex-1 flex border-b-4 lg:border-b-0 lg:border-r-4 border-main min-h-[90px] xl:min-h-[100px]">
              <div className="w-[4.5rem] bg-c2 flex justify-center items-center border-r-4 border-main shrink-0 text-inv pb-1"><span className="font-black text-6xl leading-none">2</span></div>
              <div className="w-16 bg-c2 flex justify-center items-center border-r-4 border-main shrink-0 text-inv"><Pencil size={28} strokeWidth={2.5}/></div>
              <div className="flex flex-col justify-center p-3 flex-1 bg-page"><span className="font-black text-[13px] xl:text-sm tracking-wide">PICK {t('nav.public.matches')}</span><span className="text-[10px] xl:text-[11px] font-bold leading-[1.2] capitalize text-subtle mt-1 max-w-[170px]">Make your predictions before kickoff.</span></div>
            </div>
            <div className="flex-1 flex border-b-4 lg:border-b-0 lg:border-r-4 border-main min-h-[90px] xl:min-h-[100px]">
              <div className="w-[4.5rem] bg-c5 flex justify-center items-center border-r-4 border-main shrink-0 text-main pb-1"><span className="font-black text-6xl leading-none">3</span></div>
              <div className="w-16 bg-c5 flex justify-center items-center border-r-4 border-main shrink-0 text-main"><BarChart2 size={28} strokeWidth={2.5}/></div>
              <div className="flex flex-col justify-center p-3 flex-1 bg-page"><span className="font-black text-[13px] xl:text-sm tracking-wide">TRACK RESULTS</span><span className="text-[10px] xl:text-[11px] font-bold leading-[1.2] capitalize text-subtle mt-1 max-w-[170px]">Follow live scores and completed matches.</span></div>
            </div>
            <div className="flex-1 flex min-h-[90px] xl:min-h-[100px]">
              <div className="w-[4.5rem] bg-[#FF6B00] flex justify-center items-center border-r-4 border-main shrink-0 text-main pb-1"><span className="font-black text-6xl leading-none">4</span></div>
              <div className="w-16 bg-[#FF6B00] flex justify-center items-center border-r-4 border-main shrink-0 text-main"><Trophy size={28} strokeWidth={2.5}/></div>
              <div className="flex flex-col justify-center p-3 flex-1 bg-page"><span className="font-black text-[13px] xl:text-sm tracking-wide">CLIMB {t('nav.public.leaderboard')}</span><span className="text-[10px] xl:text-[11px] font-bold leading-[1.2] capitalize text-subtle mt-1 max-w-[170px]">Earn points and rank higher each week.</span></div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
