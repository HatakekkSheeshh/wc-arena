import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Users, ChevronDown, Calendar, Star, CheckCircle, Pencil, Lock, Target, TrendingUp, BarChart2, ArrowRight, User } from 'lucide-react';
import { PitchIcon } from './Landing';
import AppShell from './components/layout/AppShell';
import { listGlobalLeaderboard, type LeaderboardEntryWithProfile } from './services/leaderboard';
import { listMatches, type MatchRow } from './services/matches';
import { listCurrentUserPredictions, submitPrediction, type PredictionWithMatch } from './services/predictions';
import { getErrorMessage } from './services/serviceTypes';
import { getTeamMap, type TeamRow } from './services/teams';
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
type DraftPick = { homeScore: string; awayScore: string; predictedOutcome: PredictionOutcome | '' };
type DraftScores = Record<string, DraftPick>;
type SubmitState = Record<string, { loading?: boolean; error?: string; success?: string }>;

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

function isMatchEditable(match: MatchRow) {
  return match.status === 'open' && new Date() < new Date(match.lock_at);
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const predictionMap = useMemo(() => getPredictionMap(predictions), [predictions]);
  const groupMatches = useMemo(() => matches.filter((match) => match.stage === 'group'), [matches]);
  const openMatches = matches.filter(isMatchEditable).length;
  const submittedCount = predictions.length;
  const nextDeadline = matches.find(isMatchEditable);
  const nextHomeTeam = nextDeadline ? teams.get(nextDeadline.home_team_id) : undefined;
  const nextAwayTeam = nextDeadline ? teams.get(nextDeadline.away_team_id) : undefined;

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
          homeScore: String(prediction.home_score),
          awayScore: String(prediction.away_score),
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
    setDraftScores((current) => {
      const next = {
        homeScore: current[matchId]?.homeScore ?? '',
        awayScore: current[matchId]?.awayScore ?? '',
        predictedOutcome: current[matchId]?.predictedOutcome ?? '',
        [key]: value,
      };

      return {
        ...current,
        [matchId]: {
          ...next,
          predictedOutcome: getOutcomeFromScores(next.homeScore, next.awayScore),
        },
      };
    });
  }

  function updateOutcome(matchId: string, predictedOutcome: PredictionOutcome) {
    setDraftScores((current) => ({
      ...current,
      [matchId]: {
        homeScore: current[matchId]?.homeScore ?? '',
        awayScore: current[matchId]?.awayScore ?? '',
        predictedOutcome,
      },
    }));
  }

  async function saveMatchPrediction(match: MatchRow) {
    const draft = draftScores[match.id];
    const homeScore = Number(draft?.homeScore);
    const awayScore = Number(draft?.awayScore);

    if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore) || homeScore < 0 || awayScore < 0) {
      setSubmitState((current) => ({ ...current, [match.id]: { error: 'Enter two non-negative whole numbers.' } }));
      return;
    }

    const predictedOutcome = draft?.predictedOutcome || getOutcomeFromScores(draft?.homeScore ?? '', draft?.awayScore ?? '');
    if (!predictedOutcome || predictedOutcome !== getOutcomeFromScores(draft?.homeScore ?? '', draft?.awayScore ?? '')) {
      setSubmitState((current) => ({ ...current, [match.id]: { error: 'Pick a result that matches your score.' } }));
      return;
    }

    setSubmitState((current) => ({ ...current, [match.id]: { loading: true } }));

    try {
      await submitPrediction({ matchId: match.id, homeScore, awayScore, predictedOutcome });
      const nextPredictions = await listCurrentUserPredictions();
      setPredictions(nextPredictions);
      setSubmitState((current) => ({ ...current, [match.id]: { success: 'Saved' } }));
    } catch (submitError) {
      setSubmitState((current) => ({ ...current, [match.id]: { error: getErrorMessage(submitError) } }));
    }
  }

  async function saveAllEditablePredictions() {
    const editableMatches = groupMatches.filter(isMatchEditable);
    for (const match of editableMatches) {
      const draft = draftScores[match.id];
      if (draft?.homeScore !== undefined && draft.awayScore !== undefined && draft.homeScore !== '' && draft.awayScore !== '') {
        await saveMatchPrediction(match);
      }
    }
  }

  const slipItems = [
    { label: 'Submitted Picks', calculation: `${submittedCount} saved`, value: `${submittedCount} picks`, icon: <Star size={16} /> },
    { label: 'Open Matches', calculation: `${openMatches} editable`, value: `${openMatches}`, icon: <CheckCircle size={16} className="text-c2" /> },
    { label: 'Potential Points', calculation: `${submittedCount} x 3 pts`, value: `${submittedCount * 3} pts`, icon: <TrendingUp size={16} className="text-c4" /> },
  ];

  return (
    <AppShell themeControls={themeControls}>
      <div className="relative z-10 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6 min-h-0">
        <div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col w-full xl:w-1/2 shadow-[8px_8px_0_0_var(--color-shadow)]">
          <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-1 text-main">
            {t('nav.items.myPicks')}
          </h1>
        </div>

        <div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col gap-4 lg:gap-6 shadow-[8px_8px_0_0_var(--color-shadow)] rounded-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 border-b-4 border-main">
            <div className="flex items-center gap-4 sm:border-r-4 border-b-4 sm:border-b-0 border-main p-4 lg:p-5 bg-c1 text-main">
              <div className="shrink-0"><Trophy size={36} strokeWidth={2.5}/></div>
              <div className="flex flex-col justify-center">
                <div className="text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">{t('nav.public.prizePool')}</div>
                <div className="text-2xl sm:text-3xl font-black leading-none">Manual</div>
                <div className="text-[10px] font-bold uppercase mt-1">Sponsor review</div>
              </div>
            </div>
            <div className="flex items-center gap-4 sm:border-r-4 border-b-4 sm:border-b-0 border-main p-4 lg:p-5 bg-c2 text-accent-inv">
              <div className="shrink-0"><Users size={36} strokeWidth={2.5}/></div>
              <div className="flex flex-col justify-center">
                <div className="text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">PICKS MADE</div>
                <div className="text-2xl sm:text-3xl font-black leading-none">{submittedCount}</div>
                <div className="text-[10px] font-bold uppercase mt-1 text-c1">SAVED</div>
              </div>
            </div>
            <div className="flex items-center gap-4 border-main p-4 lg:p-5 bg-c3 text-main">
              <div className="shrink-0"><PitchIcon className="w-9 h-9" /></div>
              <div className="flex flex-col justify-center">
                <div className="text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">{t('nav.public.matches')} OPEN</div>
                <div className="text-2xl sm:text-3xl font-black leading-none">{openMatches}</div>
                <div className="text-[10px] font-bold uppercase mt-1">MAKE YOUR PICKS</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row flex-1">
            <div className="flex-1 border-r-0 xl:border-r-4 border-main flex flex-col bg-muted">
              <div className="flex flex-wrap border-b-4 border-main font-black text-sm md:text-base uppercase">
                <button className="bg-c2 text-accent-inv px-6 py-3 border-r-4 border-main flex-1 min-w-[max-content] md:flex-none">GROUP STAGE</button>
                <button className="bg-card text-main hover:bg-elevated px-4 md:px-6 py-3 border-r-4 border-b-4 md:border-b-0 border-main flex-1 min-w-[max-content] md:flex-none">ROUND OF 16</button>
                <button className="bg-card text-main hover:bg-elevated px-4 md:px-6 py-3 border-r-4 border-b-4 md:border-b-0 border-main flex-1 min-w-[max-content] md:flex-none">QUARTER-FINALS</button>
                <button className="bg-card text-main hover:bg-elevated px-4 md:px-6 py-3 border-r-4 border-b-4 md:border-b-0 border-main flex-1 min-w-[max-content] md:flex-none">SEMI-FINALS</button>
                <button className="bg-card text-main hover:bg-elevated px-4 md:px-6 py-3 md:flex-1">FINAL</button>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between p-3 border-b-4 border-main bg-card gap-3">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button className="flex items-center justify-between border-2 border-main px-3 py-1.5 font-bold text-sm min-w-[140px] uppercase">
                    MATCHDAY ALL <ChevronDown size={16} />
                  </button>
                  <div className="flex items-center gap-2 font-bold text-sm uppercase px-2 py-1">
                    <Calendar size={16} />
                    {formatDateRange(groupMatches)}
                  </div>
                </div>

                <div className="flex border-2 border-main font-bold text-xs uppercase self-stretch sm:self-auto overflow-hidden">
                  <button className="bg-c2 text-accent-inv px-4 py-1.5 border-r-2 border-main">ALL</button>
                  <button className="bg-card hover:bg-elevated px-4 py-1.5 border-r-2 border-main">OPEN</button>
                  <button className="bg-card hover:bg-elevated px-4 py-1.5 border-r-2 border-main">LOCKED</button>
                  <button className="bg-card hover:bg-elevated px-4 py-1.5">SUBMITTED</button>
                </div>
              </div>

              <div className="flex flex-col">
                {loading && <div className="p-6 bg-card font-black uppercase text-sm border-b-4 border-main">Loading picks...</div>}
                {error && <div className="p-6 bg-c5 text-main font-black uppercase text-sm border-b-4 border-main">{error}</div>}
                {!loading && !error && groupMatches.length === 0 && <div className="p-6 bg-card font-black uppercase text-sm border-b-4 border-main">No group matches available.</div>}
                {!loading && !error && groupMatches.map((match, index) => {
                  const homeTeam = teams.get(match.home_team_id);
                  const awayTeam = teams.get(match.away_team_id);
                  const prediction = predictionMap.get(match.id);
                  const draft = draftScores[match.id] ?? {
                    homeScore: prediction ? String(prediction.home_score) : '',
                    awayScore: prediction ? String(prediction.away_score) : '',
                  };
                  const editable = isMatchEditable(match);
                  const state = submitState[match.id];

                  return (
                    <div key={match.id} className="flex border-b-4 border-main bg-card relative">
                      {index === 0 && (
                        <div className="absolute top-0 right-auto sm:left-24 bg-c1 border-x-4 border-b-4 border-main px-3 py-1 font-black text-[10px] uppercase flex items-center gap-1 z-10 shadow-[2px_2px_0_0_var(--color-shadow)]">
                          <Star size={12} fill="currentColor" /> FEATURED MATCH
                        </div>
                      )}

                      <div className="w-24 sm:w-32 border-r-4 border-main flex flex-col pt-6 sm:pt-4 p-2 sm:p-3 bg-card justify-start">
                        <div className="font-bold text-[10px] sm:text-xs uppercase whitespace-nowrap mb-0.5">{formatDate(match.kickoff_at)}</div>
                        <div className="font-black text-xl sm:text-2xl leading-none">{formatTime(match.kickoff_at)}</div>
                        <div className="font-bold text-[9px] sm:text-[10px] uppercase opacity-80 mb-4 md:mb-6">LOCAL</div>
                        <div className="mt-auto flex flex-col gap-0.5 text-faint hidden md:flex">
                          <span className="text-[9px] uppercase font-bold leading-tight">{match.stadium}</span>
                          <span className="text-[8px] uppercase font-bold opacity-80 leading-tight">{match.city}</span>
                        </div>
                      </div>

                      <div className={`flex-1 flex flex-col md:flex-row items-center p-3 lg:p-6 ${index === 0 ? 'pt-8 lg:pt-8' : ''}`}>
                        <div className="flex-1 flex items-center justify-between w-full relative">
                          <div className="flex items-center gap-2 lg:gap-4 w-[35%] lg:w-[30%] justify-start">
                            <div className="w-8 h-8 lg:w-10 lg:h-10 border-2 border-main rounded-full overflow-hidden text-lg lg:text-xl flex items-center justify-center bg-elevated flex-shrink-0">
                              <TeamFlag team={homeTeam} />
                            </div>
                            <span className="font-black text-sm lg:text-lg uppercase tracking-wide truncate">{homeTeam?.name ?? match.home_team_id}</span>
                          </div>

                          <div className="flex flex-col items-center justify-center relative px-2">
                            <div className="flex items-center gap-2">
                              <input type="number" min="0" disabled={!editable || state?.loading} value={draft.homeScore} onChange={(event) => updateDraft(match.id, 'homeScore', event.target.value)} className="w-10 h-10 lg:w-12 lg:h-12 border-[3px] border-main flex items-center justify-center font-black text-xl text-center bg-card shadow-[2px_2px_0_0_var(--color-shadow)] focus:shadow-none transition-all outline-none disabled:bg-muted" />
                              <div className="font-black text-xl">-</div>
                              <input type="number" min="0" disabled={!editable || state?.loading} value={draft.awayScore} onChange={(event) => updateDraft(match.id, 'awayScore', event.target.value)} className="w-10 h-10 lg:w-12 lg:h-12 border-[3px] border-main flex items-center justify-center font-black text-xl text-center bg-card shadow-[2px_2px_0_0_var(--color-shadow)] focus:shadow-none transition-all outline-none disabled:bg-muted" />
                            </div>
                            <div className="mt-2 grid grid-cols-3 border-2 border-main text-[8px] font-black uppercase overflow-hidden w-[180px]">
                              {[
                                { value: 'home' as const, label: homeTeam?.short_name ?? 'HOME' },
                                { value: 'draw' as const, label: 'DRAW' },
                                { value: 'away' as const, label: awayTeam?.short_name ?? 'AWAY' },
                              ].map((option) => (
                                <button
                                  key={option.value}
                                  type="button"
                                  disabled={!editable || state?.loading}
                                  onClick={() => updateOutcome(match.id, option.value)}
                                  className={`${draft.predictedOutcome === option.value ? 'bg-c3 text-main' : 'bg-card hover:bg-elevated'} border-r-2 last:border-r-0 border-main py-1 disabled:bg-muted disabled:text-subtle`}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                            <div className="absolute -bottom-5 w-[160px] text-center text-[8px] md:text-[9px] font-bold text-faint uppercase tracking-wider">
                              {state?.error ?? state?.success ?? 'EXACT SCORE BONUS: 3 PTS'}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 lg:gap-4 w-[35%] lg:w-[30%] justify-end">
                            <span className="font-black text-sm lg:text-lg uppercase tracking-wide truncate">{awayTeam?.name ?? match.away_team_id}</span>
                            <div className="w-8 h-8 lg:w-10 lg:h-10 border-2 border-main rounded-full overflow-hidden text-lg lg:text-xl flex items-center justify-center bg-elevated flex-shrink-0">
                              <TeamFlag team={awayTeam} />
                            </div>
                          </div>
                        </div>

                        <div className="w-full mt-4 flex items-center justify-between md:hidden pb-2 border-b border-line">
                          <div className="flex flex-col gap-0.5 text-faint">
                            <span className="text-[10px] uppercase font-bold leading-tight">{match.stadium}</span>
                            <span className="text-[9px] uppercase font-bold opacity-80 leading-tight">{match.city}</span>
                          </div>
                        </div>

                        <div className="w-full md:w-auto mt-4 md:mt-0 md:ml-6 flex items-center space-x-3 justify-end">
                          <div className="border border-main bg-card rounded-full px-2 py-0.5 text-[10px] lg:text-xs font-bold whitespace-nowrap shadow-[1px_1px_0_0_var(--color-shadow)]">
                            +3 PTS
                          </div>
                          <button disabled={!editable || state?.loading} onClick={() => saveMatchPrediction(match)} className={`${prediction ? 'bg-c3' : editable ? 'bg-c2 text-accent-inv' : 'bg-muted text-main'} font-black text-[10px] lg:text-xs uppercase tracking-wide px-3 lg:px-4 py-1.5 lg:py-2 border-2 border-main shadow-[2px_2px_0_0_var(--color-shadow)] flex items-center gap-1.5 min-w-[110px] justify-center disabled:opacity-60`}>
                            {prediction && <CheckCircle size={14} className="text-main" strokeWidth={3} />}
                            {state?.loading ? 'SAVING' : prediction ? 'SUBMITTED' : editable ? 'SUBMIT' : 'LOCKED'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button type="button" onClick={saveAllEditablePredictions} className="bg-c2 text-accent-inv p-6 md:p-8 flex items-center justify-between border-b-4 border-main cursor-pointer group transition-colors hover:opacity-80 transition-opacity text-left">
                <div className="flex flex-col">
                  <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-1">SAVE MY PICKS</h2>
                  <p className="text-xs md:text-sm font-semibold opacity-90">Submit every filled open match through the Supabase Edge Function before lock time.</p>
                </div>
                <ArrowRight size={48} strokeWidth={3} className="transform group-hover:translate-x-2 transition-transform" />
              </button>
            </div>

            <div className="w-full xl:w-[420px] bg-card flex flex-col">
              <div className="flex flex-col">
                <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm flex justify-between items-center border-b-4 border-main">
                  <span>MY SLIP</span>
                  <span className="text-c1 font-bold text-xs"><span className="text-accent-inv">{submittedCount}/64</span> PICKS MADE</span>
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
                    <span className="text-subtle text-sm">TOTAL POTENTIAL POINTS</span>
                    <span className="text-xl">{submittedCount * 3} PTS</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col border-b-4 border-main">
                <div className="bg-main text-inv font-black px-4 py-2 uppercase tracking-wide text-[11px] flex justify-between items-center">
                  <span>YOUR PICKS ({submittedCount})</span>
                  <button className="text-faint font-bold hover:text-inv cursor-pointer" onClick={() => onNavigate('my-predictions')}>VIEW ALL</button>
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
                          <span className="text-faint font-normal ml-0.5 mr-0.5 text-[10px]">vs</span>
                          <span>{awayTeam?.short_name ?? 'TBD'}</span>
                          <span className="ml-1 flex items-center"><TeamFlag team={awayTeam} className="w-5 h-auto rounded-[2px] border border-main/10" /></span>
                        </div>
                        <div className="font-black px-2">{prediction.home_score} - {prediction.away_score}</div>
                        <div className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-sm border border-main font-black bg-c3 text-accent-on">{prediction.status}</div>
                      </div>
                    );
                  })}
                  {predictions.length === 0 && <div className="p-2 font-black uppercase text-xs text-subtle">No saved picks yet.</div>}
                </div>
              </div>

              <div className="flex flex-col border-b-4 border-main">
                <div className="bg-main text-inv font-black px-4 py-2 uppercase tracking-wide text-[11px] flex justify-between items-center">
                  <span>TOP PLAYERS THIS WEEK</span>
                  <span className="text-faint font-bold hover:text-inv cursor-pointer" onClick={() => onNavigate('leaderboard')}>VIEW {t('nav.public.leaderboard')}</span>
                </div>
                <div className="flex flex-col bg-card">
                  {leaderboard.map((item) => (
                    <div key={item.user_id} className="flex border-b border-line last:border-b-0 items-stretch hover:bg-elevated transition-colors text-sm">
                      <div className="w-8 sm:w-10 border-r border-line flex items-center justify-center font-black bg-c1 text-accent-on">{item.rank}</div>
                      <div className="p-2 border-r border-line flex items-center justify-center bg-elevated"><User size={14} strokeWidth={3} className="text-main" /></div>
                      <div className="flex-1 p-2 font-bold flex items-center">{item.profiles?.username ?? item.user_id}</div>
                      <div className="p-2 font-black flex items-center justify-end text-main">{item.points.toLocaleString()} PTS</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-row flex-1">
                <div className="flex-1 flex flex-col border-r-4 border-main">
                  <div className="bg-main text-inv font-black px-3 py-2 uppercase tracking-wide text-[11px]">SCORING {t('nav.public.rules')}</div>
                  <div className="p-3 flex flex-col gap-2 font-bold text-xs bg-card text-subtle">
                    <div className="flex items-center gap-2"><div className="bg-c1 p-1 border border-main flex items-center justify-center"><Target size={14} strokeWidth={2.5} className="text-accent-on"/></div><span>Exact score = 3 pts</span></div>
                    <div className="flex items-center gap-2"><div className="bg-c2 p-1 border border-main flex items-center justify-center"><CheckCircle size={14} strokeWidth={2.5} className="text-accent-inv"/></div><span>Correct outcome = 1 pt</span></div>
                    <div className="flex items-center gap-2"><div className="bg-c4 p-1 border border-main flex items-center justify-center"><TrendingUp size={14} strokeWidth={2.5} className="text-accent-inv"/></div><span>Streak bonus up to 5 pts</span></div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col bg-muted">
                  <div className="bg-main text-inv font-black px-3 py-2 uppercase tracking-wide text-[11px]">NEXT DEADLINE</div>
                  <div className="p-4 flex flex-col justify-center items-center h-full gap-1 pt-2">
                    <div className="text-3xl font-black text-c5 tracking-tighter">{nextDeadline ? formatTime(nextDeadline.lock_at) : '—'}</div>
                    <div className="text-center font-bold text-xs leading-tight">{nextDeadline ? `${formatDate(nextDeadline.lock_at)}\n${nextHomeTeam?.short_name ?? 'TBD'} vs ${nextAwayTeam?.short_name ?? 'TBD'}` : 'No open match'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row bg-card border-t-4 border-main flex-shrink-0">
            <div className="flex items-stretch border-b-4 md:border-b-0 md:border-r-4 border-main flex-1"><div className="w-12 flex items-center justify-center border-r-4 border-main font-black text-3xl">1</div><div className="w-12 flex items-center justify-center border-r-4 border-main bg-c1"><Pencil size={20} className="text-accent-on" /></div><div className="p-2 sm:p-3 flex flex-col justify-center"><div className="font-black uppercase text-xs mb-0.5">Pick Scores</div><div className="font-medium text-[10px] text-subtle leading-tight">Enter the exact scores<br className="hidden md:block"/>for each match.</div></div></div>
            <div className="flex items-stretch border-b-4 md:border-b-0 md:border-r-4 border-main flex-1"><div className="w-12 flex items-center justify-center border-r-4 border-main font-black text-3xl text-accent-inv bg-c2">2</div><div className="w-12 flex items-center justify-center border-r-4 border-main bg-c2"><Lock size={20} className="text-accent-inv" /></div><div className="p-2 sm:p-3 flex flex-col justify-center"><div className="font-black uppercase text-xs mb-0.5">Save Before Kickoff</div><div className="font-medium text-[10px] text-subtle leading-tight">Submit your picks before<br className="hidden md:block"/>the match starts.</div></div></div>
            <div className="flex items-stretch border-b-4 md:border-b-0 md:border-r-4 border-main flex-1"><div className="w-12 flex items-center justify-center border-r-4 border-main font-black text-3xl">3</div><div className="w-12 flex items-center justify-center border-r-4 border-main bg-c3"><BarChart2 size={20} className="text-accent-on" /></div><div className="p-2 sm:p-3 flex flex-col justify-center"><div className="font-black uppercase text-xs mb-0.5">Climb Leaderboard</div><div className="font-medium text-[10px] text-subtle leading-tight">Earn points and rank<br className="hidden md:block"/>higher each week.</div></div></div>
            <div className="flex items-stretch flex-1"><div className="w-12 flex items-center justify-center border-r-4 border-main font-black text-3xl bg-c4">4</div><div className="w-12 flex items-center justify-center border-r-4 border-main bg-c4"><Trophy size={20} className="text-accent-on" /></div><div className="p-2 sm:p-3 flex flex-col justify-center"><div className="font-black uppercase text-xs mb-0.5">Manual Review</div><div className="font-medium text-[10px] text-subtle leading-tight">Rewards stay sponsor-backed<br className="hidden md:block"/>and manually reviewed.</div></div></div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
