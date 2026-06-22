import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BarChart2, ListChecks, Star } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import StatusPill from '../components/ui/StatusPill';
import StreakBadge from '../components/ui/StreakBadge';
import { calculateAccuracy, calculatePredictionScore, calculateStreak, getPredictionOutcome } from '../lib/scoring';
import { listCurrentUserPredictions, type PredictionWithMatch } from '../services/predictions';
import { getErrorMessage } from '../services/serviceTypes';
import { getTeamMap, type TeamRow } from '../services/teams';
import { formatPredictionPick } from '../utils/predictionDisplay';
import type { ThemeControls } from '../App';
import type { MatchResult, Prediction, PredictionDisplayStatus, PredictionType } from '../types/domain';

type MyPredictionsProps = {
  themeControls: ThemeControls;
};

type PredictionRow = {
  prediction: Prediction;
  source: PredictionWithMatch;
  result?: MatchResult;
  status: PredictionDisplayStatus;
  exactScorePoints: number;
  outcomePoints: number;
  goalDifferencePoints: number;
  teamScorePoints: number;
  points: number;
};

function toPrediction(row: PredictionWithMatch): Prediction {
  const predictedOutcome = row.predicted_outcome as Prediction['predictedOutcome'];

  return {
    id: row.id,
    userId: row.user_id,
    matchId: row.match_id,
    predictionType: row.prediction_type as PredictionType,
    homeScore: row.home_score,
    awayScore: row.away_score,
    predictedOutcome,
    confidence: row.confidence,
    isRiskPick: row.is_risk_pick,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lockedAt: row.locked_at ?? undefined,
    status: row.status as Prediction['status'],
    revision: row.revision,
  };
}

function getMatchResult(row: PredictionWithMatch): MatchResult | undefined {
  const match = row.matches;
  if (!match || match.status !== 'finished' || typeof match.home_score !== 'number' || typeof match.away_score !== 'number') return undefined;
  return { homeScore: match.home_score, awayScore: match.away_score };
}

function getDisplayStatus(prediction: Prediction, result?: MatchResult): PredictionDisplayStatus {
  if (!result) return prediction.status === 'locked' ? 'locked' : 'pending';
  return getPredictionOutcome(prediction, result);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function getTeamShortName(teams: Map<string, TeamRow>, teamId: string, fallback: string) {
  return teams.get(teamId)?.short_name ?? fallback;
}

export default function MyPredictions({ themeControls }: MyPredictionsProps) {
  const { t } = useTranslation();
  const [predictions, setPredictions] = useState<PredictionWithMatch[]>([]);
  const [teams, setTeams] = useState<Map<string, TeamRow>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([listCurrentUserPredictions(), getTeamMap()])
      .then(([nextPredictions, nextTeams]) => {
        if (!active) return;
        setPredictions(nextPredictions);
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

  const rows: PredictionRow[] = useMemo(() => predictions.flatMap((source) => {
    if (!source.matches) return [];
    const prediction = toPrediction(source);
    const result = getMatchResult(source);
    const score = result ? calculatePredictionScore(prediction, result, { riskMultiplier: prediction.isRiskPick ? 1 : 1 }) : undefined;
    const storedScore = source.matches.status === 'finished' ? source.prediction_scores : null;

    return [{
      prediction,
      source,
      result,
      status: getDisplayStatus(prediction, result),
      exactScorePoints: storedScore?.exact_score ?? score?.exactScore ?? 0,
      outcomePoints: storedScore?.correct_outcome ?? score?.correctOutcome ?? 0,
      goalDifferencePoints: storedScore?.goal_difference_bonus ?? score?.goalDifferenceBonus ?? 0,
      teamScorePoints: storedScore?.team_score_bonus ?? score?.teamScoreBonus ?? 0,
      points: storedScore?.total ?? score?.total ?? 0,
    }];
  }), [predictions]);

  const scoredItems = rows.map((row) => ({ prediction: row.prediction, result: row.result }));
  const exactScores = rows.filter((row) => row.status === 'exact').length;
  const accuracy = calculateAccuracy(scoredItems);
  const currentStreak = calculateStreak(scoredItems);
  const exactScorePoints = rows.reduce((sum, row) => sum + row.exactScorePoints, 0);
  const outcomePoints = rows.reduce((sum, row) => sum + row.outcomePoints, 0);
  const totalPoints = rows.reduce((sum, row) => sum + row.points, 0);
  const goalDifferencePoints = rows.reduce((sum, row) => sum + row.goalDifferencePoints, 0);
  const teamScorePoints = rows.reduce((sum, row) => sum + row.teamScorePoints, 0);

  return (
    <AppShell themeControls={themeControls}>
      <div className="relative z-10 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6 min-h-0">
        <div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col w-full xl:w-1/2 shadow-[8px_8px_0_0_var(--color-shadow)]">
          <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-1 text-main">
            {t('appPages.predictions.title')}
          </h1>
        </div>

        <div className="bg-card border-4 border-main p-3 lg:p-6 flex flex-col gap-3 lg:gap-6 shadow-[8px_8px_0_0_var(--color-shadow)] rounded-sm">
          <div className="hidden lg:grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 border-b-4 border-main">
            <div className="flex items-center gap-4 border-b-4 sm:border-r-4 xl:border-b-0 border-main p-4 lg:p-5 bg-c2 text-inv">
              <div className="shrink-0"><ListChecks size={36} strokeWidth={2.5} /></div>
              <div className="flex flex-col justify-center">
                <div className="text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">{t('appPages.predictions.totalPicks')}</div>
                <div className="text-2xl sm:text-3xl font-black leading-none">{rows.length}</div>
                <div className="text-[10px] font-bold uppercase mt-1">{t('appPages.predictions.submittedSoFar')}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 border-b-4 xl:border-b-0 xl:border-r-4 border-main p-4 lg:p-5 bg-c1 text-main">
              <div className="shrink-0"><Star size={36} strokeWidth={2.5} fill="currentColor" /></div>
              <div className="flex flex-col justify-center">
                <div className="text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">{t('appPages.predictions.exactScores')}</div>
                <div className="text-2xl sm:text-3xl font-black leading-none">{exactScores}</div>
                <div className="text-[10px] font-bold uppercase mt-1">{t('appPages.predictions.perfectCalls')}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 border-b-4 sm:border-b-0 sm:border-r-4 border-main p-4 lg:p-5 bg-c3 text-main">
              <div className="shrink-0"><BarChart2 size={36} strokeWidth={2.5} /></div>
              <div className="flex flex-col justify-center">
                <div className="text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">{t('appPages.predictions.accuracy')}</div>
                <div className="text-2xl sm:text-3xl font-black leading-none">{accuracy}%</div>
                <div className="text-[10px] font-bold uppercase mt-1">{t('appPages.predictions.exactOrOutcome')}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 border-main p-4 lg:p-5 bg-c4 text-main">
              <div className="shrink-0"><StreakBadge streak={currentStreak} size="lg" showValue={false} /></div>
              <div className="flex flex-col justify-center">
                <div className="text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">{t('appPages.predictions.currentStreak')}</div>
                <div className="text-2xl sm:text-3xl font-black leading-none"><StreakBadge streak={currentStreak} size="sm" /></div>
                <div className="text-[10px] font-bold uppercase mt-1">{t('appPages.predictions.correctResults')}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 lg:hidden">
            <div className="bg-main text-inv border-2 border-main p-3 shadow-[3px_3px_0_var(--color-shadow)]">
              <div className="text-[10px] uppercase font-black tracking-widest opacity-80">{t('appPages.predictions.totalEarned')}</div>
              <div className="text-3xl font-black leading-none mt-1">{totalPoints}</div>
              <div className="text-[10px] uppercase font-bold mt-1">{t('common.pointsShort')}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-c2 text-inv border-2 border-main p-2">
                <div className="text-[9px] uppercase font-black opacity-80">{t('appPages.predictions.totalPicks')}</div>
                <div className="text-xl font-black">{rows.length}</div>
              </div>
              <div className="bg-c1 text-main border-2 border-main p-2">
                <div className="text-[9px] uppercase font-black opacity-80">{t('appPages.predictions.exactScores')}</div>
                <div className="text-xl font-black">{exactScores}</div>
              </div>
              <div className="bg-c3 text-main border-2 border-main p-2">
                <div className="text-[9px] uppercase font-black opacity-80">{t('appPages.predictions.accuracy')}</div>
                <div className="text-xl font-black">{accuracy}%</div>
              </div>
              <div className="bg-c4 text-main border-2 border-main p-2">
                <div className="text-[9px] uppercase font-black opacity-80">{t('appPages.predictions.currentStreak')}</div>
                <div className="text-xl font-black"><StreakBadge streak={currentStreak} size="sm" /></div>
              </div>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row flex-1">
            <div className="flex-1 border-r-0 xl:border-r-4 border-main flex flex-col bg-card min-w-0">
              <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm border-b-4 border-main">
                {t('appPages.predictions.predictionHistory')}
              </div>
              <div className="hidden lg:grid grid-cols-[140px_1.4fr_140px_140px_120px_90px_150px] bg-card border-b-4 border-main font-black uppercase text-[10px] tracking-widest text-subtle">
                <div className="p-3 border-r-2 border-main">{t('appPages.common.kickoff')}</div>
                <div className="p-3 border-r-2 border-main">{t('appPages.common.match')}</div>
                <div className="p-3 border-r-2 border-main text-center">{t('appPages.common.yourPick')}</div>
                <div className="p-3 border-r-2 border-main text-center">{t('appPages.common.actual')}</div>
                <div className="p-3 border-r-2 border-main text-center">{t('appPages.common.status')}</div>
                <div className="p-3 border-r-2 border-main text-center">{t('appPages.common.points')}</div>
                <div className="p-3 text-center">{t('appPages.common.action')}</div>
              </div>

              <div className="flex flex-col bg-card gap-3 lg:gap-0 p-3 lg:p-0">
                {loading && <div className="p-6 font-black uppercase text-sm">{t('ui.loadingPredictions')}</div>}
                {error && <div className="p-6 font-black uppercase text-sm bg-c5 text-main border-4 lg:border-x-0 lg:border-t-0 border-main">{error}</div>}
                {!loading && !error && rows.length === 0 && <div className="p-6 font-black uppercase text-sm">{t('ui.noPredictions')}</div>}
                {!loading && !error && rows.map(({ prediction, source, result, status, points }) => {
                  const match = source.matches!;
                  const homeTeam = teams.get(match.home_team_id);
                  const awayTeam = teams.get(match.away_team_id);
                  const homeShortName = getTeamShortName(teams, match.home_team_id, t('appPages.common.unknownTeam'));
                  const awayShortName = getTeamShortName(teams, match.away_team_id, t('appPages.common.unknownTeam'));
                  const pickText = formatPredictionPick(prediction, homeShortName, awayShortName);

                  return (
                    <div key={prediction.id} className="border-4 lg:border-0 lg:border-b-4 border-main last:border-b-4 lg:last:border-b-0 font-bold text-sm hover:bg-muted transition-colors bg-card shadow-[4px_4px_0_var(--color-shadow)] lg:shadow-none">
                      <div className="lg:hidden flex flex-col">
                        <div className="flex items-start justify-between gap-3 bg-main text-inv p-3 border-b-4 border-main">
                          <div className="min-w-0">
                            <div className="text-[10px] uppercase font-black tracking-widest opacity-80">{formatDate(match.kickoff_at)}</div>
                            <Link to={`/matches/${match.id}`} className="block font-black uppercase text-lg leading-tight mt-1 hover:underline">
                              {homeShortName} vs {awayShortName}
                            </Link>
                          </div>
                          <StatusPill status={status} />
                        </div>

                        <div className="grid grid-cols-[1fr_auto_1fr] border-b-4 border-main">
                          <div className="p-3 bg-c1 text-main min-w-0">
                            <div className="text-[9px] uppercase font-black tracking-widest opacity-70">{homeTeam?.name ?? match.home_team_id}</div>
                            <div className="text-2xl font-black uppercase truncate">{homeShortName}</div>
                          </div>
                          <div className="px-3 py-2 bg-card border-x-4 border-main flex flex-col items-center justify-center min-w-[70px]">
                            <div className="text-[9px] uppercase font-black text-subtle">{t('appPages.common.actual')}</div>
                            <div className="text-xl font-black">{result ? `${result.homeScore}-${result.awayScore}` : '—'}</div>
                          </div>
                          <div className="p-3 bg-c2 text-inv text-right min-w-0">
                            <div className="text-[9px] uppercase font-black tracking-widest opacity-70">{awayTeam?.name ?? match.away_team_id}</div>
                            <div className="text-2xl font-black uppercase truncate">{awayShortName}</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-[1fr_auto] border-b-4 border-main">
                          <div className="p-3">
                            <div className="text-[10px] uppercase font-black tracking-widest text-subtle">{t('appPages.common.yourPick')}</div>
                            <div className="font-black uppercase text-lg leading-tight mt-1">{pickText}</div>
                            <div className="text-[10px] uppercase font-bold text-subtle mt-1">{match.stadium} • {match.city}</div>
                          </div>
                          <div className="p-3 bg-c3 text-main border-l-4 border-main flex flex-col items-center justify-center min-w-[82px]">
                            <div className="text-[9px] uppercase font-black tracking-widest opacity-70">{t('appPages.common.points')}</div>
                            <div className="text-3xl font-black leading-none">{points}</div>
                          </div>
                        </div>

                        <Link to={`/predictions/${prediction.id}`} className="bg-c4 hover:bg-c3 text-main font-black text-xs px-4 py-3 uppercase flex items-center justify-center border-main">
                          {t('appPages.predictions.viewBreakdown')}
                        </Link>
                      </div>

                      <div className="hidden lg:grid lg:grid-cols-[140px_1.4fr_140px_140px_120px_90px_150px]">
                        <div className="p-3 lg:border-r-2 border-main text-subtle uppercase text-xs font-black">{formatDate(match.kickoff_at)}</div>
                        <div className="p-3 lg:border-r-2 border-main">
                          <Link to={`/matches/${match.id}`} className="font-black uppercase text-main hover:text-c2 hover:underline">{homeTeam?.name ?? match.home_team_id} vs {awayTeam?.name ?? match.away_team_id}</Link>
                          <div className="text-xs text-subtle uppercase mt-1">{match.stadium} • {match.city}</div>
                        </div>
                        <div className="p-3 lg:border-r-2 border-main text-center font-black">{pickText}</div>
                        <div className="p-3 lg:border-r-2 border-main text-center font-black">{result ? `${result.homeScore} - ${result.awayScore}` : '—'}</div>
                        <div className="p-3 lg:border-r-2 border-main flex justify-center"><StatusPill status={status} /></div>
                        <div className="p-3 lg:border-r-2 border-main text-center font-black text-lg">{points}</div>
                        <div className="p-3 flex justify-center">
                          <Link to={`/predictions/${prediction.id}`} className="bg-card hover:bg-muted text-main font-black text-[10px] px-3 py-2 border-2 border-main uppercase shadow-[2px_2px_0_var(--color-shadow)] text-center">
                            {t('appPages.predictions.viewBreakdown')}
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="w-full xl:w-[360px] bg-card flex flex-col">
              <div className="hidden lg:flex flex-col border-b-4 border-main">
                <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm border-b-4 border-main">
                  {t('appPages.predictions.pointsBreakdown')}
                </div>
                <div className="p-4 bg-card flex flex-col gap-3 text-sm font-bold">
                  <div className="flex justify-between border-b-2 border-line pb-2"><span>{t('appPages.predictions.exactScorePoints')}</span><span className="font-black">{exactScorePoints}</span></div>
                  <div className="flex justify-between border-b-2 border-line pb-2"><span>{t('appPages.predictions.outcomePoints')}</span><span className="font-black">{outcomePoints}</span></div>
                  <div className="flex justify-between border-b-2 border-line pb-2"><span>{t('appPages.predictions.goalDifferenceBonus')}</span><span className="font-black">{goalDifferencePoints}</span></div>
                  <div className="flex justify-between border-b-2 border-line pb-2"><span>{t('appPages.predictions.teamScoreBonus')}</span><span className="font-black">{teamScorePoints}</span></div>
                  <div className="flex justify-between text-lg uppercase"><span>{t('appPages.predictions.totalEarned')}</span><span className="font-black">{totalPoints} {t('common.pointsShort')}</span></div>
                </div>
              </div>

              <div className="flex flex-col flex-1 bg-c1 text-main">
                <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm border-b-4 border-main">
                  {t('appPages.predictions.nextDeadline')}
                </div>
                <div className="p-4 font-black uppercase">
                  {t('appPages.predictions.nextDeadlineBody')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
