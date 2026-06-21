import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BarChart2, ListChecks, Star } from 'lucide-react';
import PredictionShareButton from '../components/PredictionShareButton';
import AppShell from '../components/layout/AppShell';
import StatusPill from '../components/ui/StatusPill';
import StreakBadge from '../components/ui/StreakBadge';
import { calculateAccuracy, calculatePredictionScore, calculateStreak, getPredictionOutcome } from '../lib/scoring';
import { useAuth } from '../lib/auth';
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
  if (!match || typeof match.home_score !== 'number' || typeof match.away_score !== 'number') return undefined;
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
  const { user } = useAuth();
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
    const storedScore = source.prediction_scores;

    return [{
      prediction,
      source,
      result,
      status: getDisplayStatus(prediction, result),
      exactScorePoints: storedScore?.exact_score ?? score?.exactScore ?? 0,
      outcomePoints: storedScore?.correct_outcome ?? score?.correctOutcome ?? 0,
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

  return (
    <AppShell themeControls={themeControls}>
      <div className="relative z-10 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6 min-h-0">
        <div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col w-full xl:w-1/2 shadow-[8px_8px_0_0_var(--color-shadow)]">
          <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-1 text-main">
            {t('appPages.predictions.title')}
          </h1>
        </div>

        <div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col gap-4 lg:gap-6 shadow-[8px_8px_0_0_var(--color-shadow)] rounded-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 border-b-4 border-main">
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

              <div className="flex flex-col bg-card">
                {loading && <div className="p-6 font-black uppercase text-sm">{t('ui.loadingPredictions')}</div>}
                {error && <div className="p-6 font-black uppercase text-sm bg-c5 text-main border-b-4 border-main">{error}</div>}
                {!loading && !error && rows.length === 0 && <div className="p-6 font-black uppercase text-sm">{t('ui.noPredictions')}</div>}
                {!loading && !error && rows.map(({ prediction, source, result, status, points }) => {
                  const match = source.matches!;
                  const homeTeam = teams.get(match.home_team_id);
                  const awayTeam = teams.get(match.away_team_id);

                  return (
                    <div key={prediction.id} className="grid grid-cols-1 lg:grid-cols-[140px_1.4fr_140px_140px_120px_90px_150px] border-b-4 border-main last:border-b-0 font-bold text-sm hover:bg-muted transition-colors">
                      <div className="p-3 lg:border-r-2 border-main text-subtle uppercase text-xs font-black">{formatDate(match.kickoff_at)}</div>
                      <div className="p-3 lg:border-r-2 border-main">
                        <Link to={`/matches/${match.id}`} className="font-black uppercase text-main hover:text-c2 hover:underline">{homeTeam?.name ?? match.home_team_id} vs {awayTeam?.name ?? match.away_team_id}</Link>
                        <div className="text-xs text-subtle uppercase mt-1">{match.stadium} • {match.city}</div>
                      </div>
                      <div className="p-3 lg:border-r-2 border-main text-left lg:text-center font-black">
                        <span className="lg:hidden text-[10px] uppercase text-subtle mr-2">{t('nav.items.picks')}</span>
                        {formatPredictionPick(prediction, getTeamShortName(teams, match.home_team_id, t('appPages.common.unknownTeam')), getTeamShortName(teams, match.away_team_id, t('appPages.common.unknownTeam')))}
                      </div>
                      <div className="p-3 lg:border-r-2 border-main text-left lg:text-center font-black">
                        <span className="lg:hidden text-[10px] uppercase text-subtle mr-2">{t('appPages.common.actual')}</span>
                        {result ? `${result.homeScore} - ${result.awayScore}` : '—'}
                      </div>
                      <div className="p-3 lg:border-r-2 border-main flex lg:justify-center"><StatusPill status={status} /></div>
                      <div className="p-3 lg:border-r-2 border-main text-left lg:text-center font-black text-lg">{points}</div>
                      <div className="p-3 flex flex-col gap-2 lg:justify-center">
                        <PredictionShareButton
                          prediction={prediction}
                          match={{
                            id: match.id,
                            kickoffAt: match.kickoff_at,
                            stage: match.stage,
                            groupCode: match.group_code,
                            matchday: match.matchday,
                            stadium: match.stadium,
                            city: match.city,
                          }}
                          homeTeam={{ name: homeTeam?.name ?? match.home_team_id, shortName: homeTeam?.short_name ?? match.home_team_id, fifaRank: homeTeam?.fifa_rank }}
                          awayTeam={{ name: awayTeam?.name ?? match.away_team_id, shortName: awayTeam?.short_name ?? match.away_team_id, fifaRank: awayTeam?.fifa_rank }}
                          playerName={user?.email}
                          points={points}
                        />
                        <Link to={`/predictions/${prediction.id}`} className="bg-card hover:bg-muted text-main font-black text-[10px] px-3 py-2 border-2 border-main uppercase shadow-[2px_2px_0_var(--color-shadow)] text-center">
                          {t('appPages.predictions.viewBreakdown')}
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="w-full xl:w-[360px] bg-card flex flex-col">
              <div className="flex flex-col border-b-4 border-main">
                <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm border-b-4 border-main">
                  {t('appPages.predictions.pointsBreakdown')}
                </div>
                <div className="p-4 bg-card flex flex-col gap-3 text-sm font-bold">
                  <div className="flex justify-between border-b-2 border-line pb-2"><span>{t('appPages.predictions.exactScorePoints')}</span><span className="font-black">{exactScorePoints}</span></div>
                  <div className="flex justify-between border-b-2 border-line pb-2"><span>{t('appPages.predictions.outcomePoints')}</span><span className="font-black">{outcomePoints}</span></div>
                  <div className="flex justify-between border-b-2 border-line pb-2"><span>{t('appPages.predictions.goalDifferenceBonus')}</span><span className="font-black">{rows.reduce((sum, row) => sum + (row.source.prediction_scores?.goal_difference_bonus ?? 0), 0)}</span></div>
                  <div className="flex justify-between border-b-2 border-line pb-2"><span>{t('appPages.predictions.teamScoreBonus')}</span><span className="font-black">{rows.reduce((sum, row) => sum + (row.source.prediction_scores?.team_score_bonus ?? 0), 0)}</span></div>
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
