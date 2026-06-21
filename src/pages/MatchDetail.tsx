import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarClock, Lock, MapPin, Save, ShieldCheck, Target, Trophy } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import PredictionShareButton from '../components/PredictionShareButton';
import StatusPill from '../components/ui/StatusPill';
import { buildGroupStandings, getRecentCompletedGroupMatchesForTeams } from '../lib/groupStandings';
import { calculatePredictionScore, getPredictionOutcome } from '../lib/scoring';
import { useAuth } from '../lib/auth';
import { getEffectiveMatchStatus, getMatch, listMatches, type MatchRow } from '../services/matches';
import { getMatchPredictionOutcomeSummary, listCurrentUserPredictions, submitPrediction, type MatchPredictionOutcomeSummary, type PredictionRow } from '../services/predictions';
import { getErrorMessage } from '../services/serviceTypes';
import { getTeamMap, type TeamRow } from '../services/teams';
import { getTeamFlag } from '../utils/teamFlags';
import type { ThemeControls } from '../App';
import type { MatchResult, Prediction, PredictionDisplayStatus, PredictionType } from '../types/domain';

type MatchDetailProps = {
  themeControls: ThemeControls;
};

type EspnSummaryPayload = {
  venue?: {
    name?: string | null;
    city?: string | null;
    country?: string | null;
  };
  broadcasts?: string[];
  teams?: Record<string, {
    name?: string | null;
    statistics?: { label?: string | null; value?: string | null }[];
    leaders?: { name?: string | null; label?: string | null; value?: string | null }[];
    lastFiveGames?: { opponent?: string | null; result?: string | null; score?: string | null; date?: string | null }[];
  }>;
  leaders?: { name?: string | null; label?: string | null; value?: string | null }[];
  news?: { headline?: string | null; description?: string | null; link?: string | null; published?: string | null; label?: string | null }[];
};

type SignalRowProps = {
  label: string;
  homeLabel: string;
  awayLabel: string;
  homePct?: number | null;
  drawPct?: number | null;
  awayPct?: number | null;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(value));
}

function formatMatchDate(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(value));
}

function getMatchResult(match: MatchRow): MatchResult | undefined {
  if (match.status !== 'finished' || typeof match.home_score !== 'number' || typeof match.away_score !== 'number') return undefined;
  return { homeScore: match.home_score, awayScore: match.away_score };
}

function toPrediction(row: PredictionRow): Prediction {
  return {
    id: row.id,
    userId: row.user_id,
    matchId: row.match_id,
    predictionType: row.prediction_type as PredictionType,
    homeScore: row.home_score,
    awayScore: row.away_score,
    predictedOutcome: row.predicted_outcome as Prediction['predictedOutcome'],
    confidence: row.confidence,
    isRiskPick: row.is_risk_pick,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lockedAt: row.locked_at ?? undefined,
    status: row.status as Prediction['status'],
    revision: row.revision,
  };
}

function getDisplayStatus(prediction?: Prediction, result?: MatchResult): PredictionDisplayStatus {
  if (!prediction) return 'pending';
  if (!result) return prediction.status === 'locked' ? 'locked' : 'pending';
  return getPredictionOutcome(prediction, result);
}

function getStatusTone(status: MatchRow['status']) {
  if (status === 'open') return 'bg-c3 text-main';
  if (status === 'locked') return 'bg-c1 text-main';
  if (status === 'finished') return 'bg-muted text-main';
  if (status === 'live') return 'bg-c4 text-inv';
  return 'bg-card text-main';
}

function getOutcomeFromScores(homeScore: string, awayScore: string): 'home' | 'draw' | 'away' | '' {
  if (homeScore === '' || awayScore === '') return '';
  const home = Number(homeScore);
  const away = Number(awayScore);
  if (!Number.isInteger(home) || !Number.isInteger(away)) return '';
  if (home > away) return 'home';
  if (home < away) return 'away';
  return 'draw';
}

function toPercent(count: number, total: number) {
  return total > 0 ? Math.round((count / total) * 100) : null;
}

function getEspnSummary(match: MatchRow): EspnSummaryPayload {
  return match.espn_summary && typeof match.espn_summary === 'object' && !Array.isArray(match.espn_summary) ? match.espn_summary as EspnSummaryPayload : {};
}

function getLiveLabel(match: MatchRow) {
  if (match.espn_state === 'in') return match.espn_display_clock ? `LIVE ${match.espn_display_clock}` : 'LIVE';
  return match.espn_status_detail ?? match.espn_status ?? match.status;
}

function SignalRow({ label, homeLabel, awayLabel, homePct, drawPct, awayPct }: SignalRowProps) {
  const { t } = useTranslation();
  const items = [
    { label: homeLabel, value: homePct },
    { label: t('ui.draw'), value: drawPct },
    { label: awayLabel, value: awayPct },
  ];

  return (
    <div className="p-4 border-b-2 border-line last:border-b-0 bg-card flex flex-col gap-2">
      <div className="font-black uppercase text-xs text-main">{label}</div>
      {items.map((item) => (
        <div key={item.label} className="grid grid-cols-[52px_1fr_38px] sm:grid-cols-[72px_1fr_44px] items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase">
          <span className="truncate">{item.label}</span>
          <div className="h-3 border-2 border-main bg-muted rounded-sm overflow-hidden"><div className="h-full bg-c3 rounded-sm" style={{ width: `${item.value ?? 0}%` }} /></div>
          <span className="text-right">{item.value ?? '—'}%</span>
        </div>
      ))}
    </div>
  );
}

function TeamFlag({ team, align = 'items-center' }: { team: TeamRow; align?: string }) {
  const FlagIcon = getTeamFlag(team.country_code, team.short_name);

  return (
    <div className={`flex ${align}`}>
      <div className="w-11 h-11 sm:w-14 sm:h-14 lg:w-20 lg:h-20 border-[3px] sm:border-4 border-main rounded-full overflow-hidden flex items-center justify-center bg-elevated shadow-[3px_3px_0_var(--color-shadow)] sm:shadow-[4px_4px_0_var(--color-shadow)]">
        {FlagIcon ? <FlagIcon className="w-full h-full object-cover" /> : <span className="font-black text-xs sm:text-sm">{team.short_name}</span>}
      </div>
    </div>
  );
}

function SmallTeamFlag({ team }: { team?: TeamRow }) {
  if (!team) return <span className="w-5 h-5 shrink-0 border-2 border-main bg-muted" />;
  const FlagIcon = getTeamFlag(team.country_code, team.short_name);

  return (
    <span className="w-5 h-5 shrink-0 border-2 border-main rounded-full overflow-hidden bg-elevated inline-flex items-center justify-center">
      {FlagIcon ? <FlagIcon className="w-full h-full object-cover" /> : <span className="font-black text-[7px]">{team.short_name.slice(0, 2)}</span>}
    </span>
  );
}

export default function MatchDetail({ themeControls }: MatchDetailProps) {
  const { t } = useTranslation();
  const { user: authUser } = useAuth();
  const { matchId } = useParams();
  const [match, setMatch] = useState<MatchRow | null>(null);
  const [allMatches, setAllMatches] = useState<MatchRow[]>([]);
  const [teams, setTeams] = useState<Map<string, TeamRow>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [predictionType, setPredictionType] = useState<PredictionType>('exact_score');
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [predictedOutcome, setPredictedOutcome] = useState<'home' | 'draw' | 'away' | ''>('');
  const [submittedPrediction, setSubmittedPrediction] = useState<Prediction | undefined>();
  const [savedAt, setSavedAt] = useState<string | undefined>();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [communitySignal, setCommunitySignal] = useState<MatchPredictionOutcomeSummary | null>(null);

  useEffect(() => {
    if (!matchId) {
      setMatch(null);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([
      getMatch(matchId),
      getTeamMap(),
      listMatches(),
      getMatchPredictionOutcomeSummary(matchId),
      authUser ? listCurrentUserPredictions() : Promise.resolve([]),
    ])
      .then(([nextMatch, nextTeams, nextMatches, nextCommunitySignal, nextPredictions]) => {
        if (!active) return;
        const existingPrediction = nextPredictions.find((prediction) => prediction.match_id === nextMatch.id);
        setMatch(nextMatch);
        setTeams(nextTeams);
        setAllMatches(nextMatches);
        setCommunitySignal(nextCommunitySignal);
        setSubmittedPrediction(existingPrediction ? toPrediction(existingPrediction) : undefined);
        setPredictionType((existingPrediction?.prediction_type as PredictionType | undefined) ?? 'exact_score');
        setHomeScore(typeof existingPrediction?.home_score === 'number' ? String(existingPrediction.home_score) : '');
        setAwayScore(typeof existingPrediction?.away_score === 'number' ? String(existingPrediction.away_score) : '');
        setPredictedOutcome((existingPrediction?.predicted_outcome as Prediction['predictedOutcome'] | undefined) ?? '');
        setSavedAt(undefined);
        setSubmitError(null);
      })
      .catch((nextError) => {
        if (!active) return;
        setError(getErrorMessage(nextError));
        setMatch(null);
        setAllMatches([]);
        setCommunitySignal(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [authUser, matchId]);

  const homeTeam = match ? teams.get(match.home_team_id) : undefined;
  const awayTeam = match ? teams.get(match.away_team_id) : undefined;
  const result = match ? getMatchResult(match) : undefined;
  const effectiveStatus = match ? getEffectiveMatchStatus(match) : undefined;
  const isInputDisabled = !effectiveStatus || ['live', 'finished', 'postponed', 'cancelled'].includes(effectiveStatus);
  const isSaveDisabled = isInputDisabled || effectiveStatus === 'locked';
  const displayStatus = getDisplayStatus(submittedPrediction, result);
  const espnSummary = match ? getEspnSummary(match) : {};
  const communityTotal = communitySignal?.total_predictions ?? 0;
  const communityHomePct = toPercent(communitySignal?.home_predictions ?? 0, communityTotal);
  const communityDrawPct = toPercent(communitySignal?.draw_predictions ?? 0, communityTotal);
  const communityAwayPct = toPercent(communitySignal?.away_predictions ?? 0, communityTotal);
  const hasEspnSignal = typeof match?.espn_home_win_pct === 'number' && typeof match.espn_draw_pct === 'number' && typeof match.espn_away_win_pct === 'number';

  const groupCode = match?.group_code ?? homeTeam?.group_code ?? awayTeam?.group_code;
  const recentGroupMatches = useMemo(() => {
    if (!homeTeam || !awayTeam) return [];
    return getRecentCompletedGroupMatchesForTeams(allMatches, homeTeam.id, awayTeam.id);
  }, [allMatches, awayTeam, homeTeam]);
  const groupTeams = useMemo(() => {
    if (!groupCode) return [];
    const nextTeams: TeamRow[] = [];
    teams.forEach((team) => {
      if (team.group_code === groupCode) nextTeams.push(team);
    });
    return nextTeams;
  }, [groupCode, teams]);
  const groupStandings = useMemo(() => buildGroupStandings(allMatches, groupCode, groupTeams), [allMatches, groupCode, groupTeams]);

  const scoreBreakdown = useMemo(() => {
    if (!submittedPrediction || !result) return undefined;
    return calculatePredictionScore(submittedPrediction, result, { riskMultiplier: submittedPrediction.isRiskPick ? 1 : 1 });
  }, [submittedPrediction, result]);

  if (loading) {
    return (
      <AppShell themeControls={themeControls}>
        <div className="relative z-10 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6 min-h-0">
          <div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col w-full xl:w-1/2 shadow-[8px_8px_0_0_var(--color-shadow)]">
            <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-1 text-main">{t('ui.loadingMatch')}</h1>
          </div>
          <div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col gap-4 lg:gap-6 shadow-[8px_8px_0_0_var(--color-shadow)] rounded-sm">
            <div className="p-6 bg-card border-b-4 border-main font-black uppercase text-sm">{t('ui.loadingMatch')}</div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !match || !homeTeam || !awayTeam) {
    return (
      <AppShell themeControls={themeControls}>
        <div className="relative z-10 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6 min-h-0">
          <div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col w-full xl:w-1/2 shadow-[8px_8px_0_0_var(--color-shadow)]">
            <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-1 text-main">{t('ui.matchNotFound')}</h1>
          </div>
          <div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col gap-4 lg:gap-6 shadow-[8px_8px_0_0_var(--color-shadow)] rounded-sm">
            <div className="p-6 bg-card border-b-4 border-main font-black uppercase text-sm">{error ?? t('ui.matchUnavailable')}</div>
            <div className="p-4 bg-card">
              <Link to="/matches" className="inline-flex bg-c2 text-inv font-black uppercase py-3 px-4 border-2 border-main items-center gap-2"><ArrowLeft size={16} /> {t('ui.backToMatches')}</Link>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  const handleSubmit = async () => {
    if (!authUser) {
      setSubmitError(t('ui.signInPrediction'));
      return;
    }

    let nextHomeScore: number | null = null;
    let nextAwayScore: number | null = null;
    let nextOutcome = predictedOutcome;

    if (predictionType === 'exact_score') {
      nextHomeScore = Number(homeScore);
      nextAwayScore = Number(awayScore);
      if (!Number.isInteger(nextHomeScore) || !Number.isInteger(nextAwayScore) || nextHomeScore < 0 || nextAwayScore < 0) {
        setSubmitError(t('ui.enterWholeScores'));
        return;
      }

      nextOutcome = getOutcomeFromScores(homeScore, awayScore);
      if (!nextOutcome || predictedOutcome !== nextOutcome) {
        setSubmitError(t('ui.pickResultMatchesScore'));
        return;
      }
    }

    if (!nextOutcome) {
      setSubmitError(t('ui.pickOutcome'));
      return;
    }

    setSubmitLoading(true);
    setSubmitError(null);

    try {
      const { prediction } = await submitPrediction({
        matchId: match.id,
        predictionType,
        homeScore: nextHomeScore,
        awayScore: nextAwayScore,
        predictedOutcome: nextOutcome,
      });

      setSubmittedPrediction(toPrediction(prediction));
      setSavedAt(new Date().toISOString());
    } catch (nextError) {
      setSubmitError(getErrorMessage(nextError));
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <AppShell themeControls={themeControls}>
      <div className="relative z-10 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6 min-h-0">
        <div className="bg-card border-4 border-main p-3 sm:p-4 lg:p-6 flex flex-col w-full xl:w-1/2 shadow-[6px_6px_0_0_var(--color-shadow)] lg:shadow-[8px_8px_0_0_var(--color-shadow)]">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <Link to="/matches" className="bg-card hover:bg-muted border-2 border-main p-2 shadow-[3px_3px_0_var(--color-shadow)]"><ArrowLeft size={18} /></Link>
            <div className={`border-2 border-main px-3 py-1 font-black uppercase text-[10px] sm:text-xs ${getStatusTone(effectiveStatus)}`}>{effectiveStatus}</div>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-1 text-main leading-none">
            {homeTeam.short_name} vs {awayTeam.short_name}
          </h1>
          <p className="font-bold text-xs sm:text-sm text-subtle max-w-xl">{t('ui.matchHelper')}</p>
        </div>

        <div className="bg-card border-4 border-main p-3 sm:p-4 lg:p-6 flex flex-col gap-3 sm:gap-4 lg:gap-6 shadow-[6px_6px_0_0_var(--color-shadow)] lg:shadow-[8px_8px_0_0_var(--color-shadow)] rounded-sm">
          <div className="grid grid-cols-2 xl:grid-cols-4 border-b-4 border-main">
            <div className="flex items-center gap-2 sm:gap-4 border-b-4 border-r-4 xl:border-b-0 border-main p-2.5 sm:p-4 lg:p-5 bg-c1 text-main min-w-0">
              <CalendarClock size={24} className="sm:w-9 sm:h-9" strokeWidth={2.5} />
              <div className="min-w-0"><div className="text-[9px] sm:text-xs uppercase font-black tracking-wide sm:tracking-widest leading-none mb-0.5 sm:mb-1 opacity-90">{t('ui.kickoff')}</div><div className="text-sm sm:text-2xl font-black leading-none truncate">{formatDateTime(match.kickoff_at)}</div><div className="text-[9px] sm:text-[10px] font-bold uppercase mt-1">{t('ui.worldCup2026')}</div></div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 border-b-4 xl:border-b-0 xl:border-r-4 border-main p-2.5 sm:p-4 lg:p-5 bg-c2 text-inv min-w-0">
              <Lock size={24} className="sm:w-9 sm:h-9" strokeWidth={2.5} />
              <div className="min-w-0"><div className="text-[9px] sm:text-xs uppercase font-black tracking-wide sm:tracking-widest leading-none mb-0.5 sm:mb-1 opacity-90">{t('ui.lock')}</div><div className="text-sm sm:text-2xl font-black leading-none truncate">{formatDateTime(match.lock_at)}</div><div className="text-[9px] sm:text-[10px] font-bold uppercase mt-1">{t('ui.submitBefore')}</div></div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 border-r-4 border-main p-2.5 sm:p-4 lg:p-5 bg-c3 text-main min-w-0">
              <Trophy size={24} className="sm:w-9 sm:h-9" strokeWidth={2.5} />
              <div className="min-w-0"><div className="text-[9px] sm:text-xs uppercase font-black tracking-wide sm:tracking-widest leading-none mb-0.5 sm:mb-1 opacity-90">{t('ui.stage')}</div><div className="text-xl sm:text-3xl font-black leading-none">{t('ui.groupLabel', { group: match.group_code ?? '-' })}</div><div className="text-[9px] sm:text-[10px] font-bold uppercase mt-1">{t('ui.matchdayLabel', { matchday: match.matchday ?? '-' })}</div></div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 border-main p-2.5 sm:p-4 lg:p-5 bg-c4 text-main min-w-0">
              <Target size={24} className="sm:w-9 sm:h-9" strokeWidth={2.5} />
              <div className="min-w-0"><div className="text-[9px] sm:text-xs uppercase font-black tracking-wide sm:tracking-widest leading-none mb-0.5 sm:mb-1 opacity-90">{t('ui.points')}</div><div className="text-xl sm:text-3xl font-black leading-none">{scoreBreakdown?.total ?? '—'}</div><div className="text-[9px] sm:text-[10px] font-bold uppercase mt-1">{t('ui.earned')}</div></div>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row flex-1">
            <div className="order-2 xl:order-1 flex-1 border-r-0 xl:border-r-4 border-main flex flex-col bg-muted min-w-0">
              <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm border-b-4 border-main">
                {t('ui.matchCard')}
              </div>
              <div className="bg-card p-3 sm:p-5 lg:p-8 border-b-4 border-main flex flex-col gap-4 lg:gap-6">
                <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-3 lg:gap-6">
                  <div className="flex flex-col items-end text-right gap-2 sm:gap-3 min-w-0">
                    <TeamFlag team={homeTeam} align="items-end" />
                    <div className="min-w-0">
                      <div className="font-black text-2xl sm:text-3xl lg:text-6xl uppercase tracking-tighter">{homeTeam.short_name}</div>
                      <div className="font-bold text-subtle uppercase text-[10px] sm:text-xs lg:text-sm mt-1 truncate">{homeTeam.name}</div>
                      <div className="font-bold text-subtle uppercase text-[9px] sm:text-[10px] mt-1 sm:mt-2">FIFA #{homeTeam.fifa_rank ?? '—'}</div>
                    </div>
                  </div>
                  <div className="border-[3px] sm:border-4 border-main bg-page shadow-[3px_3px_0_var(--color-shadow)] sm:shadow-[4px_4px_0_var(--color-shadow)] px-3 py-2 sm:px-4 sm:py-3 lg:px-6 lg:py-4 font-black text-xl sm:text-2xl lg:text-5xl">
                    {result ? `${result.homeScore} - ${result.awayScore}` : 'VS'}
                  </div>
                  <div className="flex flex-col items-start gap-2 sm:gap-3 min-w-0">
                    <TeamFlag team={awayTeam} align="items-start" />
                    <div className="min-w-0">
                      <div className="font-black text-2xl sm:text-3xl lg:text-6xl uppercase tracking-tighter">{awayTeam.short_name}</div>
                      <div className="font-bold text-subtle uppercase text-[10px] sm:text-xs lg:text-sm mt-1 truncate">{awayTeam.name}</div>
                      <div className="font-bold text-subtle uppercase text-[9px] sm:text-[10px] mt-1 sm:mt-2">FIFA #{awayTeam.fifa_rank ?? '—'}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-card p-3 sm:p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2 sm:gap-3 font-bold text-xs sm:text-sm">
                <div className="flex items-center gap-2 min-w-0"><MapPin size={16} className="shrink-0" /> <span className="truncate">{match.stadium}</span></div>
                <div className="uppercase text-subtle">{match.city}</div>
              </div>

              {(match.espn_status_detail || match.espn_display_clock || match.espn_attendance || match.espn_play_by_play_available !== null) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 border-t-4 border-main bg-c4 text-main">
                  <div className="p-4 border-b-4 sm:border-r-4 xl:border-b-0 border-main font-black uppercase text-xs"><span className="block text-[10px] text-subtle mb-1">{t('ui.liveStatus')}</span>{getLiveLabel(match)}</div>
                  <div className="p-4 border-b-4 xl:border-r-4 xl:border-b-0 border-main font-black uppercase text-xs"><span className="block text-[10px] text-subtle mb-1">{t('ui.clock')}</span>{match.espn_display_clock ?? '—'}</div>
                  <div className="p-4 border-b-4 sm:border-b-0 sm:border-r-4 border-main font-black uppercase text-xs"><span className="block text-[10px] text-subtle mb-1">{t('ui.attendance')}</span>{match.espn_attendance?.toLocaleString() ?? '—'}</div>
                  <div className="p-4 font-black uppercase text-xs"><span className="block text-[10px] text-subtle mb-1">{t('ui.playByPlay')}</span>{match.espn_play_by_play_available ? t('ui.available') : t('ui.notListed')}</div>
                </div>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-2 border-t-4 border-main bg-card">
                <div className="xl:border-r-4 border-main">
                  <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm border-b-4 border-main">{t('ui.communitySignal')}</div>
                  <div className="bg-card">
                    <SignalRow label={t('ui.communityPicksCount', { count: communityTotal })} homeLabel={homeTeam.short_name} awayLabel={awayTeam.short_name} homePct={communityHomePct} drawPct={communityDrawPct} awayPct={communityAwayPct} />
                    <SignalRow label={t('ui.espnSignal')} homeLabel={homeTeam.short_name} awayLabel={awayTeam.short_name} homePct={match.espn_home_win_pct} drawPct={match.espn_draw_pct} awayPct={match.espn_away_win_pct} />
                    {!hasEspnSignal && <div className="p-4 bg-muted font-bold text-xs text-subtle border-t-2 border-line">{t('ui.espnUnavailable')}</div>}
                  </div>
                </div>

                <div>
                  <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm border-b-4 border-main">{t('ui.espnContext')}</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 bg-card font-bold text-xs">
                    <div className="p-4 border-b-2 md:border-r-2 border-line"><span className="font-black uppercase text-[10px] text-subtle block mb-1">{t('ui.venue')}</span>{espnSummary.venue?.name ?? match.stadium}</div>
                    <div className="p-4 border-b-2 border-line"><span className="font-black uppercase text-[10px] text-subtle block mb-1">{t('ui.location')}</span>{espnSummary.venue?.city ?? match.city}{espnSummary.venue?.country ? `, ${espnSummary.venue.country}` : ''}</div>
                    <div className="p-4 border-b-2 md:border-r-2 border-line"><span className="font-black uppercase text-[10px] text-subtle block mb-1">{t('ui.teamRecord', { team: homeTeam.short_name })}</span>{match.espn_home_record ?? t('ui.notListed')}</div>
                    <div className="p-4 border-b-2 border-line"><span className="font-black uppercase text-[10px] text-subtle block mb-1">{t('ui.teamRecord', { team: awayTeam.short_name })}</span>{match.espn_away_record ?? t('ui.notListed')}</div>
                    <div className="p-4 md:col-span-2"><span className="font-black uppercase text-[10px] text-subtle block mb-1">{t('ui.broadcasts')}</span>{espnSummary.broadcasts?.length ? espnSummary.broadcasts.join(' • ') : t('ui.notListedYet')}</div>
                  </div>
                </div>
              </div>

              {(recentGroupMatches.length > 0 || groupStandings.length > 0 || espnSummary.news?.length) && (
                <div className="grid grid-cols-1 xl:grid-cols-3 border-t-4 border-main bg-card">
                  <div className="xl:border-r-4 border-main">
                    <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm border-b-4 border-main">{t('ui.recentGroupMatches')}</div>
                    <div className="bg-card">
                      {recentGroupMatches.map((recentMatch) => {
                        const recentHomeTeam = teams.get(recentMatch.home_team_id);
                        const recentAwayTeam = teams.get(recentMatch.away_team_id);
                        const metadata = [
                          recentMatch.group_code ? t('ui.groupLabel', { group: recentMatch.group_code }) : null,
                          recentMatch.matchday ? t('ui.matchdayLabel', { matchday: recentMatch.matchday }) : null,
                        ].filter(Boolean).join(' • ');

                        return (
                          <div key={recentMatch.id} className="p-4 border-b-2 border-line last:border-b-0 font-bold text-xs">
                            <div className="flex items-center justify-between gap-3 font-black uppercase">
                              <span className={`flex items-center gap-1.5 min-w-0 ${recentMatch.home_team_id === homeTeam.id || recentMatch.home_team_id === awayTeam.id ? 'text-c2' : ''}`}>
                                <SmallTeamFlag team={recentHomeTeam} />
                                <span className="truncate">{recentHomeTeam?.short_name ?? recentMatch.home_team_id}</span>
                              </span>
                              <span className="bg-page border-2 border-main px-2 py-1 text-main shrink-0">{recentMatch.home_score} - {recentMatch.away_score}</span>
                              <span className={`flex items-center justify-end gap-1.5 min-w-0 ${recentMatch.away_team_id === homeTeam.id || recentMatch.away_team_id === awayTeam.id ? 'text-c2' : ''}`}>
                                <span className="truncate">{recentAwayTeam?.short_name ?? recentMatch.away_team_id}</span>
                                <SmallTeamFlag team={recentAwayTeam} />
                              </span>
                            </div>
                            <div className="text-subtle mt-2 uppercase text-[10px] flex justify-between gap-3">
                              <span>{formatMatchDate(recentMatch.kickoff_at)}</span>
                              {metadata && <span>{metadata}</span>}
                            </div>
                          </div>
                        );
                      })}
                      {recentGroupMatches.length === 0 && <div className="p-4 bg-muted font-bold text-xs text-subtle">{t('ui.noRecentGroupMatches')}</div>}
                    </div>
                  </div>

                  <div className="xl:border-r-4 border-main">
                    <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm border-b-4 border-main">{t('ui.groupStandings')}</div>
                    <div className="bg-card font-bold text-[10px]">
                      {groupStandings.length > 0 && (
                        <>
                          <div className="grid grid-cols-[32px_minmax(72px,1fr)_28px_28px_28px_28px_38px_38px] bg-muted border-b-2 border-main font-black uppercase text-subtle">
                            <div className="p-2 text-center">{t('ui.rankShort')}</div>
                            <div className="p-2">{t('ui.team')}</div>
                            <div className="p-2 text-center">{t('ui.playedShort')}</div>
                            <div className="p-2 text-center">{t('ui.winsShort')}</div>
                            <div className="p-2 text-center">{t('ui.drawsShort')}</div>
                            <div className="p-2 text-center">{t('ui.lossesShort')}</div>
                            <div className="p-2 text-center">{t('ui.goalDifferenceShort')}</div>
                            <div className="p-2 text-center">{t('ui.groupPointsShort')}</div>
                          </div>
                          {groupStandings.map((standing, index) => {
                            const isMatchTeam = standing.team.id === homeTeam.id || standing.team.id === awayTeam.id;
                            return (
                              <div key={standing.team.id} className={`grid grid-cols-[32px_minmax(72px,1fr)_28px_28px_28px_28px_38px_38px] border-b-2 border-line last:border-b-0 ${isMatchTeam ? 'bg-c1 text-main' : 'bg-card'}`}>
                                <div className="p-2 text-center font-black">#{index + 1}</div>
                                <div className="p-2 font-black uppercase truncate flex items-center gap-1.5 min-w-0"><SmallTeamFlag team={standing.team} /><span className="truncate">{standing.team.short_name}</span></div>
                                <div className="p-2 text-center">{standing.played}</div>
                                <div className="p-2 text-center">{standing.wins}</div>
                                <div className="p-2 text-center">{standing.draws}</div>
                                <div className="p-2 text-center">{standing.losses}</div>
                                <div className="p-2 text-center">{standing.goalDifference > 0 ? `+${standing.goalDifference}` : standing.goalDifference}</div>
                                <div className="p-2 text-center font-black">{standing.points}</div>
                              </div>
                            );
                          })}
                        </>
                      )}
                      {groupStandings.length === 0 && <div className="p-4 bg-muted font-bold text-xs text-subtle">{t('ui.noGroupStandings')}</div>}
                    </div>
                  </div>

                  <div>
                    <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm border-b-4 border-main">{t('ui.matchNews')}</div>
                    <div className="bg-card">
                      {(espnSummary.news ?? []).slice(0, 4).map((article, index) => (
                        <a key={`${article.headline}-${index}`} href={article.link ?? '#'} target="_blank" rel="noreferrer" className="block p-4 border-b-2 border-line last:border-b-0 hover:bg-muted font-bold text-xs">
                          <div className="font-black uppercase">{article.headline}</div>
                          {article.description && <div className="text-subtle mt-1 leading-snug">{article.description}</div>}
                          <div className="text-[10px] font-black uppercase mt-2 text-c2">{t('ui.openOnEspn')}</div>
                        </a>
                      ))}
                      {!espnSummary.news?.length && <div className="p-4 bg-muted font-bold text-xs text-subtle">{t('ui.noEspnNews')}</div>}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="order-1 xl:order-2 w-full xl:w-[420px] bg-card flex flex-col border-b-4 xl:border-b-0 border-main">
              <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm border-b-4 border-main">
                {t('ui.yourPrediction')}
              </div>
              <div className="p-3 sm:p-4 bg-card flex flex-col gap-3 sm:gap-4 border-b-4 border-main">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-black uppercase text-xs text-subtle">{t('ui.predictionStatus')}</span>
                  <StatusPill status={displayStatus} />
                </div>

                <div className="grid grid-cols-2 border-[3px] border-main font-black uppercase text-xs overflow-hidden">
                  {[
                    { value: 'exact_score' as const, label: t('ui.exactScore') },
                    { value: 'outcome_only' as const, label: t('ui.outcomeOnly') },
                  ].map((option) => (
                    <button key={option.value} type="button" disabled={isInputDisabled} onClick={() => setPredictionType(option.value)} className={`${predictionType === option.value ? 'bg-c2 text-inv' : 'bg-card hover:bg-elevated'} border-r-[3px] last:border-r-0 border-main py-2.5 sm:py-3 px-2 disabled:bg-muted disabled:text-subtle`}>
                      {option.label}
                    </button>
                  ))}
                </div>

                {predictionType === 'exact_score' && (
                  <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-end">
                    <label className="flex flex-col gap-2">
                      <span className="font-black uppercase text-[10px]">{homeTeam.short_name}</span>
                      <input type="number" min="0" value={homeScore} disabled={isInputDisabled} onChange={(event) => {
  const next = event.target.value;
  setHomeScore(next);
  setPredictedOutcome(getOutcomeFromScores(next, awayScore));
}} className="w-full border-[3px] border-main bg-card p-2.5 sm:p-3 text-center font-black text-2xl sm:text-3xl shadow-[3px_3px_0_var(--color-shadow)] outline-none disabled:bg-muted" />
                    </label>
                    <div className="font-black text-3xl pb-3">-</div>
                    <label className="flex flex-col gap-2">
                      <span className="font-black uppercase text-[10px] text-right">{awayTeam.short_name}</span>
                      <input type="number" min="0" value={awayScore} disabled={isInputDisabled} onChange={(event) => {
  const next = event.target.value;
  setAwayScore(next);
  setPredictedOutcome(getOutcomeFromScores(homeScore, next));
}} className="w-full border-[3px] border-main bg-card p-2.5 sm:p-3 text-center font-black text-2xl sm:text-3xl shadow-[3px_3px_0_var(--color-shadow)] outline-none disabled:bg-muted" />
                    </label>
                  </div>
                )}

                <div className="grid grid-cols-3 border-[3px] border-main font-black uppercase text-xs overflow-hidden">
                  {[
                    { value: 'home' as const, label: t('ui.teamWin', { team: homeTeam.short_name }) },
                    { value: 'draw' as const, label: t('ui.draw') },
                    { value: 'away' as const, label: t('ui.teamWin', { team: awayTeam.short_name }) },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      disabled={isInputDisabled || predictionType === 'exact_score'}
                      onClick={() => setPredictedOutcome(option.value)}
                      className={`${predictedOutcome === option.value ? 'bg-c3 text-main' : 'bg-card hover:bg-elevated disabled:bg-muted disabled:text-subtle'} border-r-[3px] last:border-r-0 border-main py-2.5 sm:py-3 px-1`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <button type="button" disabled={isSaveDisabled || submitLoading} onClick={handleSubmit} className="bg-c2 disabled:bg-muted disabled:text-subtle text-inv font-black uppercase py-3 px-4 border-2 border-main shadow-[4px_4px_0_var(--color-shadow)] flex items-center justify-center gap-2 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all">
                  <Save size={18} strokeWidth={3} /> {submitLoading ? t('ui.savingEllipsis') : t('ui.savePrediction')}
                </button>

                <div className="border-2 border-main bg-page p-3 text-xs font-bold text-subtle leading-relaxed">
                  {isSaveDisabled ? t('ui.lockedDraftNote') : authUser ? t('ui.predictionPickHelp') : <span>{t('ui.signInPrediction')} <Link to="/login" className="text-c2 underline">{t('ui.goToLogin')}</Link></span>}
                </div>

                {submitError && <div className="bg-c5 border-2 border-main p-3 font-black uppercase text-xs">{submitError}</div>}
                {savedAt && <div className="bg-c3 border-2 border-main p-3 font-black uppercase text-xs flex items-center gap-2"><ShieldCheck size={16} /> {t('ui.savedAt', { date: formatDateTime(savedAt) })}</div>}
              </div>

              <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm border-b-4 border-main">
                {t('ui.actions')}
              </div>
              <div className="p-4 bg-card flex flex-col gap-3">
                <Link to="/my-predictions" className="text-center bg-card hover:bg-muted text-main font-black uppercase py-3 px-4 border-2 border-main shadow-[3px_3px_0_var(--color-shadow)] text-xs">{t('ui.myPredictions')}</Link>
                {submittedPrediction && (
                  <>
                    <PredictionShareButton
                      prediction={submittedPrediction}
                      match={{
                        id: match.id,
                        kickoffAt: match.kickoff_at,
                        stage: match.stage,
                        groupCode: match.group_code,
                        matchday: match.matchday,
                        stadium: match.stadium,
                        city: match.city,
                      }}
                      homeTeam={{ name: homeTeam.name, shortName: homeTeam.short_name, countryCode: homeTeam.country_code, fifaRank: homeTeam.fifa_rank }}
                      awayTeam={{ name: awayTeam.name, shortName: awayTeam.short_name, countryCode: awayTeam.country_code, fifaRank: awayTeam.fifa_rank }}
                      playerName={authUser.email}
                      points={scoreBreakdown?.total}
                      variant="primary"
                    />
                    <Link to={`/predictions/${submittedPrediction.id}`} className="text-center bg-c1 text-main font-black uppercase py-3 px-4 border-2 border-main shadow-[3px_3px_0_var(--color-shadow)] text-xs">{t('ui.viewBreakdown')}</Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
