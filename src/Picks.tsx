import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Users, ChevronDown, Calendar, Star, CheckCircle, Pencil, Lock, Target, TrendingUp, BarChart2, ArrowRight, User } from 'lucide-react';
import { PitchIcon } from './Landing';
import AppShell from './components/layout/AppShell';
import { listGlobalLeaderboard, type LeaderboardEntryWithProfile } from './services/leaderboard';
import { getEffectiveMatchStatus, isMatchPredictionOpen, listMatches, type MatchRow } from './services/matches';
import { listCurrentUserPredictions, submitPrediction, type PredictionWithMatch } from './services/predictions';
import { getErrorMessage } from './services/serviceTypes';
import { getTeamMap, type TeamRow } from './services/teams';
import { getPublicDisplayName } from './utils/displayName';
import { getTeamFlag } from './utils/teamFlags';

type PicksProps = {
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

type PredictionOutcome = 'home' | 'draw' | 'away';
type PredictionType = 'exact_score' | 'outcome_only';
type DraftPick = { predictionType: PredictionType; homeScore: string; awayScore: string; predictedOutcome: PredictionOutcome | '' };
type DraftScores = Record<string, DraftPick>;
type SubmitState = Record<string, { loading?: boolean; error?: string; success?: string }>;
type StatusFilter = 'all' | 'open' | 'locked' | 'submitted';
type TranslationFn = ReturnType<typeof useTranslation>['t'];

const MATCHES_PER_PAGE = 8;

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function formatDateRange(matches: MatchRow[], t: TranslationFn) {
  if (!matches.length) return t('ui.noMatchesLabel');
  return `${formatDate(matches[0].kickoff_at)} - ${formatDate(matches[matches.length - 1].kickoff_at)}`;
}

function getStatusFilterLabel(status: StatusFilter, t: TranslationFn) {
  if (status === 'submitted') return t('ui.submitted');
  if (status === 'open') return t('ui.open');
  if (status === 'locked') return t('ui.locked');
  return t('matches.all');
}

function isMatchEditable(match: MatchRow) {
  return isMatchPredictionOpen(match);
}

function getOutcomeFromScores(homeScore: string, awayScore: string): PredictionOutcome | '' {
  if (homeScore === '' || awayScore === '') return '';
  const home = Number(homeScore);
  const away = Number(awayScore);
  if (!Number.isInteger(home) || !Number.isInteger(away)) return '';
  if (home > away) return 'home';
  if (home < away) return 'away';
  return 'draw';
}

function TeamFlag({ team, className = 'w-full h-full object-cover' }: { team?: TeamRow; className?: string }) {
  const FlagIcon = getTeamFlag(team?.country_code, team?.short_name);
  return FlagIcon ? <FlagIcon className={className} /> : <span className="font-black text-[10px]">{team?.short_name ?? '?'}</span>;
}

function getEspnFavorite(match: MatchRow): PredictionOutcome | '' {
  const signals = [
    { outcome: 'home' as const, value: match.espn_home_win_pct },
    { outcome: 'draw' as const, value: match.espn_draw_pct },
    { outcome: 'away' as const, value: match.espn_away_win_pct },
  ].filter((signal): signal is { outcome: PredictionOutcome; value: number } => typeof signal.value === 'number');

  if (signals.length === 0) return '';
  return signals.sort((first, second) => second.value - first.value)[0].outcome;
}

function formatMobileTeamSignal(team?: TeamRow, espnPct?: number | null, isFavorite = false) {
  const fifaRank = team?.fifa_rank ? `FIFA #${team.fifa_rank}` : 'FIFA #—';
  const espnSignal = typeof espnPct === 'number' ? `ESPN ${isFavorite ? 'FAV ' : ''}${Math.round(espnPct)}%` : 'ESPN —';
  return `${fifaRank} • ${espnSignal}`;
}

function getPredictionMap(predictions: PredictionWithMatch[]) {
  return new Map(predictions.map((prediction) => [prediction.match_id, prediction]));
}

export default function Picks({ onNavigate, isVintage, setIsVintage, isDark, setIsDark, isRounded, setIsRounded, hasShadow, setHasShadow, hasFrame, setHasFrame }: PicksProps) {
  const { t } = useTranslation();
  const themeControls = { isVintage, setIsVintage, isDark, setIsDark, isRounded, setIsRounded, hasShadow, setHasShadow, hasFrame, setHasFrame };
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [teams, setTeams] = useState<Map<string, TeamRow>>(new Map());
  const [predictions, setPredictions] = useState<PredictionWithMatch[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntryWithProfile[]>([]);
  const [draftScores, setDraftScores] = useState<DraftScores>({});
  const [submitState, setSubmitState] = useState<SubmitState>({});
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('open');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const predictionMap = useMemo(() => getPredictionMap(predictions), [predictions]);
  const groupMatches = useMemo(() => matches.filter((match) => match.stage === 'group'), [matches]);
  const filteredMatches = useMemo(() => groupMatches.filter((match) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'submitted') return predictionMap.has(match.id);
    return getEffectiveMatchStatus(match) === statusFilter;
  }), [groupMatches, predictionMap, statusFilter]);
  const pageCount = Math.max(1, Math.ceil(filteredMatches.length / MATCHES_PER_PAGE));
  const currentPage = Math.min(page, pageCount);
  const visibleMatches = filteredMatches.slice((currentPage - 1) * MATCHES_PER_PAGE, currentPage * MATCHES_PER_PAGE);
  const openMatches = matches.filter(isMatchEditable).length;
  const submittedCount = predictions.length;
  const nextDeadline = matches.find(isMatchEditable);
  const nextHomeTeam = nextDeadline ? teams.get(nextDeadline.home_team_id) : undefined;
  const nextAwayTeam = nextDeadline ? teams.get(nextDeadline.away_team_id) : undefined;

  useEffect(() => {
    setPage((current) => Math.min(current, pageCount));
  }, [pageCount]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([listMatches(), getTeamMap(), listCurrentUserPredictions(), listGlobalLeaderboard()])
      .then(([nextMatches, nextTeams, nextPredictions, nextLeaderboard]) => {
        if (!active) return;
        setMatches(nextMatches);
        setTeams(nextTeams);
        setPredictions(nextPredictions);
        setLeaderboard(nextLeaderboard.slice(0, 5));
        setDraftScores(Object.fromEntries(nextPredictions.map((prediction) => [prediction.match_id, {
          predictionType: prediction.prediction_type as PredictionType,
          homeScore: typeof prediction.home_score === 'number' ? String(prediction.home_score) : '',
          awayScore: typeof prediction.away_score === 'number' ? String(prediction.away_score) : '',
          predictedOutcome: prediction.predicted_outcome as PredictionOutcome,
        }])));
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

  function updateDraft(matchId: string, key: 'homeScore' | 'awayScore', value: string) {
    if (!/^\d*$/.test(value)) return;

    setDraftScores((current) => {
      const next = {
        predictionType: current[matchId]?.predictionType ?? 'exact_score',
        homeScore: current[matchId]?.homeScore ?? '',
        awayScore: current[matchId]?.awayScore ?? '',
        predictedOutcome: current[matchId]?.predictedOutcome ?? '',
        [key]: value,
      };

      return {
        ...current,
        [matchId]: {
          ...next,
          predictedOutcome: next.predictionType === 'exact_score' ? getOutcomeFromScores(next.homeScore, next.awayScore) : next.predictedOutcome,
        },
      };
    });
  }

  function updatePredictionType(matchId: string, predictionType: PredictionType) {
    setDraftScores((current) => {
      const homeScore = current[matchId]?.homeScore ?? '';
      const awayScore = current[matchId]?.awayScore ?? '';
      return {
        ...current,
        [matchId]: {
          predictionType,
          homeScore,
          awayScore,
          predictedOutcome: predictionType === 'exact_score' ? getOutcomeFromScores(homeScore, awayScore) : current[matchId]?.predictedOutcome ?? '',
        },
      };
    });
  }

  function updateOutcome(matchId: string, predictedOutcome: PredictionOutcome) {
    setDraftScores((current) => ({
      ...current,
      [matchId]: {
        predictionType: current[matchId]?.predictionType ?? 'outcome_only',
        homeScore: current[matchId]?.homeScore ?? '',
        awayScore: current[matchId]?.awayScore ?? '',
        predictedOutcome,
      },
    }));
  }


  async function saveMatchPrediction(match: MatchRow) {
    const draft = draftScores[match.id];
    const predictionType = draft?.predictionType ?? 'exact_score';
    let homeScore: number | null = null;
    let awayScore: number | null = null;
    let predictedOutcome = draft?.predictedOutcome ?? '';

    if (predictionType === 'exact_score') {
      homeScore = Number(draft?.homeScore);
      awayScore = Number(draft?.awayScore);

      if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore) || homeScore < 0 || awayScore < 0) {
        setSubmitState((current) => ({ ...current, [match.id]: { error: t('ui.enterWholeScores') } }));
        return;
      }

      predictedOutcome = getOutcomeFromScores(draft?.homeScore ?? '', draft?.awayScore ?? '');
      if (!predictedOutcome || draft?.predictedOutcome !== predictedOutcome) {
        setSubmitState((current) => ({ ...current, [match.id]: { error: t('ui.pickResultMatchesScore') } }));
        return;
      }
    }

    if (!predictedOutcome) {
      setSubmitState((current) => ({ ...current, [match.id]: { error: t('ui.pickOutcome') } }));
      return;
    }

    setSubmitState((current) => ({ ...current, [match.id]: { loading: true } }));

    try {
      await submitPrediction({ matchId: match.id, predictionType, homeScore, awayScore, predictedOutcome, isRiskPick: true });
      const nextPredictions = await listCurrentUserPredictions();
      setPredictions(nextPredictions);
      setSubmitState((current) => ({ ...current, [match.id]: { success: t('ui.saved') } }));
    } catch (submitError) {
      setSubmitState((current) => ({ ...current, [match.id]: { error: getErrorMessage(submitError) } }));
    }
  }

  async function saveAllEditablePredictions() {
    const editableMatches = groupMatches.filter(isMatchEditable);
    for (const match of editableMatches) {
      const draft = draftScores[match.id];
      if ((draft?.predictionType === 'outcome_only' && draft.predictedOutcome) || (draft?.homeScore !== undefined && draft.awayScore !== undefined && draft.homeScore !== '' && draft.awayScore !== '')) {
        await saveMatchPrediction(match);
      }
    }
  }

  const slipItems = [
    { label: t('ui.submittedPicks'), calculation: t('ui.savedCount', { count: submittedCount }), value: t('ui.picksCount', { count: submittedCount }), icon: <Star size={16} /> },
    { label: t('ui.openMatches'), calculation: t('ui.editableCount', { count: openMatches }), value: `${openMatches}`, icon: <CheckCircle size={16} className="text-c2" /> },
    { label: t('ui.maxExactPoints'), calculation: t('ui.timesPoints', { count: submittedCount, points: 5 }), value: `${submittedCount * 5} ${t('ui.pointsShort')}`, icon: <TrendingUp size={16} className="text-c4" /> },
  ];

  return (
    <AppShell themeControls={themeControls}>
      <div className="relative z-10 flex flex-col p-3 sm:p-4 lg:p-6 gap-3 lg:gap-6 min-h-0">
        <div className="bg-card border-4 border-main p-3 sm:p-4 lg:p-6 flex flex-col w-full xl:w-1/2 shadow-[6px_6px_0_0_var(--color-shadow)] lg:shadow-[8px_8px_0_0_var(--color-shadow)]">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-1 text-main leading-none">
            {t('nav.items.myPicks')}
          </h1>
        </div>

        <div className="bg-card border-4 border-main p-3 sm:p-4 lg:p-6 flex flex-col gap-3 lg:gap-6 shadow-[6px_6px_0_0_var(--color-shadow)] lg:shadow-[8px_8px_0_0_var(--color-shadow)] rounded-sm">
          <div className="grid grid-cols-3 border-b-4 border-main">
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-4 border-r-4 border-main p-2 sm:p-4 lg:p-5 bg-c1 text-main min-w-0 text-center sm:text-left">
              <div className="shrink-0"><Trophy size={22} className="sm:w-9 sm:h-9" strokeWidth={2.5}/></div>
              <div className="flex flex-col justify-center min-w-0">
                <div className="text-[8px] sm:text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90 truncate">{t('nav.public.pointsGuide')}</div>
                <div className="text-base sm:text-3xl font-black leading-none">{t('ui.manual')}</div>
                <div className="text-[8px] sm:text-[10px] font-bold uppercase mt-1 truncate">{t('ui.communityReview')}</div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-4 border-r-4 border-main p-2 sm:p-4 lg:p-5 bg-c2 text-accent-inv min-w-0 text-center sm:text-left">
              <div className="shrink-0"><Users size={22} className="sm:w-9 sm:h-9" strokeWidth={2.5}/></div>
              <div className="flex flex-col justify-center min-w-0">
                <div className="text-[8px] sm:text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90 truncate">{t('ui.picksMade')}</div>
                <div className="text-base sm:text-3xl font-black leading-none">{submittedCount}</div>
                <div className="text-[8px] sm:text-[10px] font-bold uppercase mt-1 text-c1 truncate">{t('ui.saved')}</div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-4 border-main p-2 sm:p-4 lg:p-5 bg-c3 text-main min-w-0 text-center sm:text-left">
              <div className="shrink-0"><PitchIcon className="w-6 h-6 sm:w-9 sm:h-9" /></div>
              <div className="flex flex-col justify-center min-w-0">
                <div className="text-[8px] sm:text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90 truncate">{t('ui.openMatches')}</div>
                <div className="text-base sm:text-3xl font-black leading-none">{openMatches}</div>
                <div className="text-[8px] sm:text-[10px] font-bold uppercase mt-1 truncate">{t('ui.makePicks')}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row flex-1">
            <div className="order-1 xl:order-1 flex-1 border-r-0 xl:border-r-4 border-main flex flex-col bg-muted min-w-0">
              <div className="flex overflow-x-auto border-b-4 border-main font-black text-[10px] sm:text-sm md:text-base uppercase">
                <button className="bg-c2 text-accent-inv px-4 md:px-6 py-2.5 md:py-3 border-r-4 border-main min-w-[118px] md:min-w-[max-content] md:flex-none">{t('ui.groupStage')}</button>
                <button className="bg-card text-main hover:bg-elevated px-4 md:px-6 py-2.5 md:py-3 border-r-4 border-main min-w-[112px] md:min-w-[max-content] md:flex-none">{t('ui.roundOf16')}</button>
                <button className="bg-card text-main hover:bg-elevated px-4 md:px-6 py-2.5 md:py-3 border-r-4 border-main min-w-[132px] md:min-w-[max-content] md:flex-none">{t('ui.quarterFinals')}</button>
                <button className="bg-card text-main hover:bg-elevated px-4 md:px-6 py-2.5 md:py-3 border-r-4 border-main min-w-[112px] md:min-w-[max-content] md:flex-none">{t('ui.semiFinals')}</button>
                <button className="bg-card text-main hover:bg-elevated px-4 md:px-6 py-2.5 md:py-3 min-w-[88px] md:flex-1">{t('ui.final')}</button>
              </div>

              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between p-2.5 sm:p-3 border-b-4 border-main bg-card gap-2 md:gap-3">
                <div className="grid grid-cols-[auto_minmax(0,1fr)] md:flex items-center gap-2 md:gap-3 w-full md:w-auto min-w-0">
                  <button className="flex items-center justify-between border-2 border-main px-2.5 sm:px-3 py-1.5 font-bold text-xs sm:text-sm min-w-[120px] sm:min-w-[140px] uppercase">
                    {t('ui.allMatchdays')} <ChevronDown size={16} />
                  </button>
                  <div className="flex items-center gap-2 font-bold text-xs sm:text-sm uppercase px-2 py-1 min-w-0 justify-end md:justify-start">
                    <Calendar size={15} className="shrink-0" />
                    <span className="truncate">{formatDateRange(filteredMatches, t)}</span>
                  </div>
                </div>

                <div className="flex border-2 border-main font-bold text-[10px] sm:text-xs uppercase self-stretch md:self-auto overflow-x-auto">
                  {(['open', 'locked', 'submitted', 'all'] as StatusFilter[]).map((status) => (
                    <button key={status} type="button" onClick={() => { setStatusFilter(status); setPage(1); }} className={`${statusFilter === status ? 'bg-c2 text-accent-inv' : 'bg-card hover:bg-elevated text-main'} px-3 sm:px-4 py-1.5 border-r-2 border-main last:border-r-0 flex-1 min-w-[74px] sm:min-w-0 sm:flex-none`}>
                      {getStatusFilterLabel(status, t)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col">
                {loading && <div className="p-6 bg-card font-black uppercase text-sm border-b-4 border-main">{t('ui.loadingPicks')}</div>}
                {error && <div className="p-6 bg-c5 text-main font-black uppercase text-sm border-b-4 border-main">{error}</div>}
                {!loading && !error && filteredMatches.length === 0 && <div className="p-6 bg-card font-black uppercase text-sm border-b-4 border-main">{t('ui.noPicksForFilter')}</div>}
                {!loading && !error && visibleMatches.map((match, index) => {
                  const homeTeam = teams.get(match.home_team_id);
                  const awayTeam = teams.get(match.away_team_id);
                  const prediction = predictionMap.get(match.id);
                  const draft = draftScores[match.id] ?? {
                    predictionType: (prediction?.prediction_type as PredictionType | undefined) ?? 'exact_score',
                    homeScore: typeof prediction?.home_score === 'number' ? String(prediction.home_score) : '',
                    awayScore: typeof prediction?.away_score === 'number' ? String(prediction.away_score) : '',
                    predictedOutcome: (prediction?.predicted_outcome as PredictionOutcome | undefined) ?? '',
                  };
                  const editable = isMatchEditable(match);
                  const state = submitState[match.id];
                  const espnFavorite = getEspnFavorite(match);

                  return (
                    <div key={match.id} className="flex flex-col sm:flex-row border-b-4 border-main bg-card relative overflow-hidden">
                      {index === 0 && (
                        <div className="absolute top-0 left-0 sm:left-24 bg-c1 border-r-4 border-b-4 sm:border-x-4 border-main px-2.5 sm:px-3 py-1 font-black text-[9px] sm:text-[10px] uppercase flex items-center gap-1 z-10 shadow-[2px_2px_0_0_var(--color-shadow)]">
                          <Star size={12} fill="currentColor" /> {t('ui.featuredMatch')}
                        </div>
                      )}

                      <div className="w-full sm:w-32 border-b-4 sm:border-b-0 sm:border-r-4 border-main flex sm:flex-col items-center sm:items-start justify-between sm:justify-start pt-7 sm:pt-4 p-2 sm:p-3 bg-card">
                        <div>
                          <div className="font-bold text-[10px] sm:text-xs uppercase whitespace-nowrap mb-0.5">{formatDate(match.kickoff_at)}</div>
                          <div className="font-black text-xl sm:text-2xl leading-none">{formatTime(match.kickoff_at)}</div>
                          <div className="font-bold text-[9px] sm:text-[10px] uppercase opacity-80">{t('ui.local')}</div>
                        </div>
                        <div className="flex sm:hidden flex-col gap-0.5 text-faint text-right max-w-[52%]">
                          <span className="text-[9px] uppercase font-bold leading-tight truncate">{match.stadium}</span>
                          <span className="text-[8px] uppercase font-bold opacity-80 leading-tight truncate">{match.city}</span>
                        </div>
                        <div className="mt-auto flex-col gap-0.5 text-faint hidden md:flex">
                          <span className="text-[9px] uppercase font-bold leading-tight">{match.stadium}</span>
                          <span className="text-[8px] uppercase font-bold opacity-80 leading-tight">{match.city}</span>
                        </div>
                      </div>

                      <div className={`flex-1 flex flex-col md:flex-row items-center p-3 lg:p-6 ${index === 0 ? 'sm:pt-8 lg:pt-8' : ''}`}>
                        <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-between w-full relative gap-3 sm:gap-0">
                          <div className="flex items-center gap-2 lg:gap-4 w-full sm:w-[35%] lg:w-[30%] justify-start min-w-0">
                            <div className="w-9 h-9 lg:w-10 lg:h-10 border-2 border-main rounded-full overflow-hidden text-lg lg:text-xl flex items-center justify-center bg-elevated flex-shrink-0">
                              <TeamFlag team={homeTeam} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-black text-sm lg:text-lg uppercase tracking-wide truncate">{homeTeam?.name ?? match.home_team_id}</div>
                              <div className="sm:hidden mt-0.5 font-black text-[9px] uppercase tracking-wide text-subtle truncate">
                                {formatMobileTeamSignal(homeTeam, match.espn_home_win_pct, espnFavorite === 'home')}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-center justify-center relative px-0 sm:px-2 gap-2 order-3 sm:order-none pb-4 sm:pb-0">
                            <div className="grid grid-cols-2 border-2 border-main text-[8px] sm:text-[8px] font-black uppercase overflow-hidden w-full max-w-[220px] sm:w-[180px]">
                              {[
                                { value: 'exact_score' as const, label: t('ui.exact') },
                                { value: 'outcome_only' as const, label: t('ui.outcome') },
                              ].map((option) => (
                                <button key={option.value} type="button" disabled={!editable || state?.loading} onClick={() => updatePredictionType(match.id, option.value)} className={`${draft.predictionType === option.value ? 'bg-c2 text-accent-inv' : 'bg-card hover:bg-elevated'} border-r-2 last:border-r-0 border-main py-1 disabled:bg-muted disabled:text-subtle`}>
                                  {option.label}
                                </button>
                              ))}
                            </div>
                            {draft.predictionType === 'exact_score' && (
                              <div className="flex items-center gap-2">
                                <input type="text" inputMode="numeric" pattern="[0-9]*" disabled={!editable || state?.loading} value={draft.homeScore} onChange={(event) => updateDraft(match.id, 'homeScore', event.target.value)} className="w-12 h-12 sm:w-10 sm:h-10 lg:w-12 lg:h-12 border-[3px] border-main flex items-center justify-center font-black text-2xl sm:text-xl text-center bg-card shadow-[2px_2px_0_0_var(--color-shadow)] focus:shadow-none transition-all outline-none disabled:bg-muted" />
                                <div className="font-black text-xl">-</div>
                                <input type="text" inputMode="numeric" pattern="[0-9]*" disabled={!editable || state?.loading} value={draft.awayScore} onChange={(event) => updateDraft(match.id, 'awayScore', event.target.value)} className="w-12 h-12 sm:w-10 sm:h-10 lg:w-12 lg:h-12 border-[3px] border-main flex items-center justify-center font-black text-2xl sm:text-xl text-center bg-card shadow-[2px_2px_0_0_var(--color-shadow)] focus:shadow-none transition-all outline-none disabled:bg-muted" />
                              </div>
                            )}
                            <div className="grid grid-cols-3 border-2 border-main text-[8px] font-black uppercase overflow-hidden w-full max-w-[220px] sm:w-[180px]">
                              {[
                                { value: 'home' as const, label: homeTeam?.short_name ?? t('ui.home') },
                                { value: 'draw' as const, label: t('ui.draw') },
                                { value: 'away' as const, label: awayTeam?.short_name ?? t('ui.away') },
                              ].map((option) => (
                                <button
                                  key={option.value}
                                  type="button"
                                  disabled={!editable || state?.loading || draft.predictionType === 'exact_score'}
                                  onClick={() => updateOutcome(match.id, option.value)}
                                  className={`${draft.predictedOutcome === option.value ? 'bg-c3 text-main' : 'bg-card hover:bg-elevated disabled:bg-muted disabled:text-subtle'} border-r-2 last:border-r-0 border-main py-1`}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                            <div className="text-center text-[8px] md:text-[9px] font-black text-subtle uppercase tracking-wider">
                              {t('ui.automaticRiskMultiplier')}
                            </div>
                            <div className="absolute -bottom-1 sm:-bottom-5 w-full max-w-[220px] sm:w-[180px] text-center text-[8px] md:text-[9px] font-bold text-faint uppercase tracking-wider">
                              {state?.error ?? state?.success ?? (draft.predictionType === 'exact_score' ? t('ui.exactScorePoints', { points: 5 }) : t('ui.outcomePoints', { points: 2 }))}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 lg:gap-4 w-full sm:w-[35%] lg:w-[30%] justify-end min-w-0">
                            <div className="min-w-0 flex-1 text-right">
                              <div className="font-black text-sm lg:text-lg uppercase tracking-wide truncate">{awayTeam?.name ?? match.away_team_id}</div>
                              <div className="sm:hidden mt-0.5 font-black text-[9px] uppercase tracking-wide text-subtle truncate">
                                {formatMobileTeamSignal(awayTeam, match.espn_away_win_pct, espnFavorite === 'away')}
                              </div>
                            </div>
                            <div className="w-9 h-9 lg:w-10 lg:h-10 border-2 border-main rounded-full overflow-hidden text-lg lg:text-xl flex items-center justify-center bg-elevated flex-shrink-0">
                              <TeamFlag team={awayTeam} />
                            </div>
                          </div>
                        </div>

                        <div className="w-full md:w-auto mt-3 md:mt-0 md:ml-6 grid grid-cols-[auto_1fr] md:flex items-center gap-2 md:gap-3 justify-end">
                          <div className="border border-main bg-card rounded-full px-2 py-1 text-[10px] lg:text-xs font-bold whitespace-nowrap shadow-[1px_1px_0_0_var(--color-shadow)] text-center">
                            {t('ui.plusPoints', { points: 3 })}
                          </div>
                          <button disabled={!editable || state?.loading} onClick={() => saveMatchPrediction(match)} className={`${prediction ? 'bg-c3' : editable ? 'bg-c2 text-accent-inv' : 'bg-muted text-main'} font-black text-[10px] lg:text-xs uppercase tracking-wide px-3 lg:px-4 py-2 lg:py-2 border-2 border-main shadow-[2px_2px_0_0_var(--color-shadow)] flex items-center gap-1.5 min-w-[110px] justify-center disabled:opacity-60`}>
                            {prediction && <CheckCircle size={14} className="text-main" strokeWidth={3} />}
                            {state?.loading ? t('ui.saving') : prediction ? t('ui.submitted') : editable ? t('ui.submit') : t('ui.locked')}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {!loading && !error && filteredMatches.length > MATCHES_PER_PAGE && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-card border-b-4 border-main font-black uppercase text-xs">
                    <span>
                      {t('ui.showingRange', { start: (currentPage - 1) * MATCHES_PER_PAGE + 1, end: Math.min(currentPage * MATCHES_PER_PAGE, filteredMatches.length), total: filteredMatches.length })}
                    </span>
                    <div className="flex items-center border-2 border-main overflow-hidden">
                      <button type="button" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="px-4 py-2 border-r-2 border-main bg-card disabled:bg-muted disabled:text-subtle hover:bg-elevated">
                        {t('ui.previous')}
                      </button>
                      <span className="px-4 py-2 bg-page border-r-2 border-main">{t('ui.pageCount', { current: currentPage, total: pageCount })}</span>
                      <button type="button" disabled={currentPage === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))} className="px-4 py-2 bg-card disabled:bg-muted disabled:text-subtle hover:bg-elevated">
                        {t('ui.next')}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button type="button" onClick={saveAllEditablePredictions} className="bg-c2 text-accent-inv p-4 md:p-8 flex items-center justify-between border-b-4 border-main cursor-pointer group transition-colors hover:opacity-80 transition-opacity text-left gap-3">
                <div className="flex flex-col min-w-0">
                  <h2 className="text-2xl md:text-5xl font-black uppercase tracking-tighter mb-1 leading-none">{t('ui.saveMyPicks')}</h2>
                  <p className="text-[11px] md:text-sm font-semibold opacity-90 leading-snug">{t('ui.savePicksBody')}</p>
                </div>
                <ArrowRight size={34} strokeWidth={3} className="md:w-12 md:h-12 transform group-hover:translate-x-2 transition-transform shrink-0" />
              </button>
            </div>

            <div className="order-2 xl:order-2 w-full xl:w-[420px] bg-card flex flex-col border-t-4 xl:border-t-0 border-main">
              <div className="flex flex-col">
                <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm flex justify-between items-center border-b-4 border-main">
                  <span>{t('ui.mySlip')}</span>
                  <span className="text-c1 font-bold text-xs"><span className="text-accent-inv">{submittedCount}/64</span> {t('ui.picksMade')}</span>
                </div>
                <div className="bg-muted p-4 flex flex-col gap-3 border-b-4 border-main text-sm">
                  {slipItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between border-b border-line pb-2 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2 font-bold text-subtle">
                        <div className="w-6 h-6 bg-card border border-line flex items-center justify-center shrink-0">{item.icon}</div>
                        {item.label}
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <span className="text-xs text-faint font-medium">{item.calculation}</span>
                        <span className="font-black w-14">{item.value}</span>
                      </div>
                    </div>
                  ))}
                  <div className="mt-2 pt-3 border-t-2 border-main flex items-center justify-between font-black uppercase">
                    <span className="text-subtle text-sm">{t('ui.totalPotentialPoints')}</span>
                    <span className="text-xl">{submittedCount * 5} {t('ui.pointsShort')}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col border-b-4 border-main">
                <div className="bg-main text-inv font-black px-4 py-2 uppercase tracking-wide text-[11px] flex justify-between items-center">
                  <span>{t('ui.yourPredictions')} ({submittedCount})</span>
                  <button className="text-faint font-bold hover:text-inv cursor-pointer" onClick={() => onNavigate('my-predictions')}>{t('ui.viewAll')}</button>
                </div>
                <div className="flex flex-col bg-card p-2 gap-1.5">
                  {predictions.slice(0, 5).map((prediction) => {
                    const match = prediction.matches;
                    if (!match) return null;
                    const homeTeam = teams.get(match.home_team_id);
                    const awayTeam = teams.get(match.away_team_id);
                    return (
                      <div key={prediction.id} className="flex items-center justify-between text-xs font-bold border border-line p-2">
                        <div className="flex items-center gap-1.5 sm:gap-2 w-[40%]">
                          <span className="mr-1 flex items-center"><TeamFlag team={homeTeam} className="w-5 h-auto rounded-[2px] border border-main/10" /></span>
                          <span>{homeTeam?.short_name ?? 'TBD'}</span>
                          <span className="text-faint font-normal ml-0.5 mr-0.5 text-[10px]">{t('ui.vs')}</span>
                          <span>{awayTeam?.short_name ?? 'TBD'}</span>
                          <span className="ml-1 flex items-center"><TeamFlag team={awayTeam} className="w-5 h-auto rounded-[2px] border border-main/10" /></span>
                        </div>
                        <div className="font-black px-2">{prediction.prediction_type === 'exact_score' && typeof prediction.home_score === 'number' && typeof prediction.away_score === 'number' ? `${prediction.home_score} - ${prediction.away_score}` : prediction.predicted_outcome.toUpperCase()}</div>
                        <div className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-sm border border-main font-black bg-c3 text-accent-on">{prediction.status}</div>
                      </div>
                    );
                  })}
                  {predictions.length === 0 && <div className="p-2 font-black uppercase text-xs text-subtle">{t('ui.noSavedPicks')}</div>}
                </div>
              </div>

              <div className="hidden xl:flex flex-col border-b-4 border-main">
                <div className="bg-main text-inv font-black px-4 py-2 uppercase tracking-wide text-[11px] flex justify-between items-center">
                  <span>{t('ui.topPlayersThisWeek')}</span>
                  <span className="text-faint font-bold hover:text-inv cursor-pointer" onClick={() => onNavigate('leaderboard')}>{t('ui.viewAll')}</span>
                </div>
                <div className="flex flex-col bg-card">
                  {leaderboard.map((item) => (
                    <div key={item.user_id} className="flex border-b border-line last:border-b-0 items-stretch hover:bg-elevated transition-colors text-sm">
                      <div className="w-8 sm:w-10 border-r border-line flex items-center justify-center font-black bg-c1 text-accent-on">{item.rank}</div>
                      <div className="p-2 border-r border-line flex items-center justify-center bg-elevated"><User size={14} strokeWidth={3} className="text-main" /></div>
                      <div className="flex-1 p-2 font-bold flex items-center">{getPublicDisplayName(item.profiles, item.user_id)}</div>
                      <div className="p-2 font-black flex items-center justify-end text-main">{item.points.toLocaleString()} {t('ui.pointsShort')}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-row flex-1">
                <div className="flex-1 flex flex-col border-r-4 border-main">
                  <div className="bg-main text-inv font-black px-3 py-2 uppercase tracking-wide text-[11px]">{t('ui.scoring')} {t('nav.public.rules')}</div>
                  <div className="p-3 flex flex-col gap-2 font-bold text-xs bg-card text-subtle">
                    <div className="flex items-center gap-2"><div className="bg-c1 p-1 border border-main flex items-center justify-center"><Target size={14} strokeWidth={2.5} className="text-accent-on"/></div><span>{t('ui.exactScoreFive')}</span></div>
                    <div className="flex items-center gap-2"><div className="bg-c2 p-1 border border-main flex items-center justify-center"><CheckCircle size={14} strokeWidth={2.5} className="text-accent-inv"/></div><span>{t('ui.correctOutcomeTwo')}</span></div>
                    <div className="flex items-center gap-2"><div className="bg-c4 p-1 border border-main flex items-center justify-center"><TrendingUp size={14} strokeWidth={2.5} className="text-accent-inv"/></div><span>{t('ui.streakBonusFive')}</span></div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col bg-muted">
                  <div className="bg-main text-inv font-black px-3 py-2 uppercase tracking-wide text-[11px]">{t('appPages.predictions.nextDeadline')}</div>
                  <div className="p-4 flex flex-col justify-center items-center h-full gap-1 pt-2">
                    <div className="text-3xl font-black text-c5 tracking-tighter">{nextDeadline ? formatTime(nextDeadline.lock_at) : '—'}</div>
                    <div className="text-center font-bold text-xs leading-tight">{nextDeadline ? `${formatDate(nextDeadline.lock_at)}\n${nextHomeTeam?.short_name ?? 'TBD'} ${t('ui.vs')} ${nextAwayTeam?.short_name ?? 'TBD'}` : t('ui.noOpenMatch')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row bg-card border-t-4 border-main flex-shrink-0">
            <div className="flex items-stretch border-b-4 md:border-b-0 md:border-r-4 border-main flex-1"><div className="w-12 flex items-center justify-center border-r-4 border-main font-black text-3xl">1</div><div className="w-12 flex items-center justify-center border-r-4 border-main bg-c1"><Pencil size={20} className="text-accent-on" /></div><div className="p-2 sm:p-3 flex flex-col justify-center"><div className="font-black uppercase text-xs mb-0.5">{t('ui.pickScores')}</div><div className="font-medium text-[10px] text-subtle leading-tight">{t('ui.pickScoresBody')}</div></div></div>
            <div className="flex items-stretch border-b-4 md:border-b-0 md:border-r-4 border-main flex-1"><div className="w-12 flex items-center justify-center border-r-4 border-main font-black text-3xl text-accent-inv bg-c2">2</div><div className="w-12 flex items-center justify-center border-r-4 border-main bg-c2"><Lock size={20} className="text-accent-inv" /></div><div className="p-2 sm:p-3 flex flex-col justify-center"><div className="font-black uppercase text-xs mb-0.5">{t('ui.saveBeforeKickoff')}</div><div className="font-medium text-[10px] text-subtle leading-tight">{t('ui.saveBeforeKickoffBody')}</div></div></div>
            <div className="flex items-stretch border-b-4 md:border-b-0 md:border-r-4 border-main flex-1"><div className="w-12 flex items-center justify-center border-r-4 border-main font-black text-3xl">3</div><div className="w-12 flex items-center justify-center border-r-4 border-main bg-c3"><BarChart2 size={20} className="text-accent-on" /></div><div className="p-2 sm:p-3 flex flex-col justify-center"><div className="font-black uppercase text-xs mb-0.5">{t('ui.climbLeaderboard')}</div><div className="font-medium text-[10px] text-subtle leading-tight">{t('ui.climbLeaderboardBody')}</div></div></div>
            <div className="flex items-stretch flex-1"><div className="w-12 flex items-center justify-center border-r-4 border-main font-black text-3xl bg-c4">4</div><div className="w-12 flex items-center justify-center border-r-4 border-main bg-c4"><Trophy size={20} className="text-accent-on" /></div><div className="p-2 sm:p-3 flex flex-col justify-center"><div className="font-black uppercase text-xs mb-0.5">{t('ui.manualReview')}</div><div className="font-medium text-[10px] text-subtle leading-tight">{t('ui.manualReviewBody')}</div></div></div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
