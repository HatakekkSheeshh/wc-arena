import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BarChart2, CheckCircle2, ShieldCheck, Target, Trophy } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import StatusPill from '../components/ui/StatusPill';
import { calculatePredictionScore, getPredictionOutcome } from '../lib/scoring';
import { getPrediction, type PredictionWithMatch } from '../services/predictions';
import { getErrorMessage } from '../services/serviceTypes';
import { getTeamMap, type TeamRow } from '../services/teams';
import type { ThemeControls } from '../App';
import type { MatchResult, Prediction, PredictionDisplayStatus } from '../types/domain';

type PredictionBreakdownProps = {
  themeControls: ThemeControls;
};

type BreakdownLineProps = {
  label: string;
  value: string | number;
  description: string;
  tone?: string;
};

function toPrediction(row: PredictionWithMatch): Prediction {
  const predictedOutcome = row.predicted_outcome as Prediction['predictedOutcome'];

  return {
    id: row.id,
    userId: row.user_id,
    matchId: row.match_id,
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

function BreakdownLine({ label, value, description, tone = 'bg-card' }: BreakdownLineProps) {
  return (
    <div className={`grid grid-cols-[1fr_auto] gap-4 border-b-4 border-main last:border-b-0 p-4 ${tone}`}>
      <div>
        <div className="font-black uppercase text-sm">{label}</div>
        <div className="font-bold text-xs text-subtle mt-1">{description}</div>
      </div>
      <div className="font-black text-2xl text-right">{value}</div>
    </div>
  );
}

export default function PredictionBreakdown({ themeControls }: PredictionBreakdownProps) {
  const { predictionId } = useParams();
  const [predictionRow, setPredictionRow] = useState<PredictionWithMatch | null>(null);
  const [teams, setTeams] = useState<Map<string, TeamRow>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!predictionId) {
      setPredictionRow(null);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([getPrediction(predictionId), getTeamMap()])
      .then(([nextPrediction, nextTeams]) => {
        if (!active) return;
        setPredictionRow(nextPrediction);
        setTeams(nextTeams);
      })
      .catch((nextError) => {
        if (!active) return;
        setError(getErrorMessage(nextError));
        setPredictionRow(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [predictionId]);

  if (loading) {
    return (
      <AppShell themeControls={themeControls}>
        <div className="relative z-10 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6 min-h-0">
          <div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col w-full xl:w-1/2 shadow-[8px_8px_0_0_var(--color-shadow)]">
            <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-1 text-main">Loading Prediction</h1>
          </div>
          <div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col gap-4 lg:gap-6 shadow-[8px_8px_0_0_var(--color-shadow)] rounded-sm">
            <div className="p-6 bg-card border-b-4 border-main font-black uppercase text-sm">Loading prediction...</div>
          </div>
        </div>
      </AppShell>
    );
  }

  const match = predictionRow?.matches;
  const homeTeam = match ? teams.get(match.home_team_id) : undefined;
  const awayTeam = match ? teams.get(match.away_team_id) : undefined;

  if (error || !predictionRow || !match || !homeTeam || !awayTeam) {
    return (
      <AppShell themeControls={themeControls}>
        <div className="relative z-10 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6 min-h-0">
          <div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col w-full xl:w-1/2 shadow-[8px_8px_0_0_var(--color-shadow)]">
            <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-1 text-main">Prediction Not Found</h1>
          </div>
          <div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col gap-4 lg:gap-6 shadow-[8px_8px_0_0_var(--color-shadow)] rounded-sm">
            <div className="p-6 bg-card border-b-4 border-main font-black uppercase text-sm">{error ?? 'This scoring breakdown is not available.'}</div>
            <div className="p-4 bg-card">
              <Link to="/my-predictions" className="inline-flex bg-c2 text-inv font-black uppercase py-3 px-4 border-2 border-main items-center gap-2"><ArrowLeft size={16} /> Back to My Predictions</Link>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  const prediction = toPrediction(predictionRow);
  const result = getMatchResult(predictionRow);
  const fallbackScore = result ? calculatePredictionScore(prediction, result, { riskMultiplier: prediction.isRiskPick ? 1 : 1 }) : undefined;
  const storedScore = predictionRow.prediction_scores;
  const score = storedScore ? {
    predictionId: storedScore.prediction_id,
    exactScore: storedScore.exact_score,
    correctOutcome: storedScore.correct_outcome,
    streakBonus: storedScore.streak_bonus,
    riskMultiplier: storedScore.risk_multiplier,
    underdogBonus: storedScore.underdog_bonus,
    total: storedScore.total,
    scoringVersion: storedScore.scoring_version,
    calculatedAt: storedScore.calculated_at,
  } : fallbackScore;
  const status = storedScore?.outcome ? storedScore.outcome as PredictionDisplayStatus : getDisplayStatus(prediction, result);

  return (
    <AppShell themeControls={themeControls}>
      <div className="relative z-10 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6 min-h-0">
        <div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col w-full xl:w-1/2 shadow-[8px_8px_0_0_var(--color-shadow)]">
          <div className="flex items-center gap-3 mb-2">
            <Link to="/my-predictions" className="bg-card hover:bg-muted border-2 border-main p-2 shadow-[3px_3px_0_var(--color-shadow)]"><ArrowLeft size={18} /></Link>
            <StatusPill status={status} />
          </div>
          <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-1 text-main">
            Prediction Breakdown
          </h1>
          <p className="font-bold text-sm text-subtle max-w-xl">Transparent scoring details for your exact-score prediction.</p>
        </div>

        <div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col gap-4 lg:gap-6 shadow-[8px_8px_0_0_var(--color-shadow)] rounded-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 border-b-4 border-main">
            <div className="flex items-center gap-4 border-b-4 sm:border-r-4 xl:border-b-0 border-main p-4 lg:p-5 bg-c1 text-main">
              <Target size={36} strokeWidth={2.5} />
              <div><div className="text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">Your Pick</div><div className="text-2xl sm:text-3xl font-black leading-none">{homeTeam.short_name} {prediction.homeScore}-{prediction.awayScore} {awayTeam.short_name}</div><div className="text-[10px] font-bold uppercase mt-1">Exact score prediction</div></div>
            </div>
            <div className="flex items-center gap-4 border-b-4 xl:border-b-0 xl:border-r-4 border-main p-4 lg:p-5 bg-c2 text-inv">
              <Trophy size={36} strokeWidth={2.5} />
              <div><div className="text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">Actual Result</div><div className="text-2xl sm:text-3xl font-black leading-none">{result ? `${result.homeScore}-${result.awayScore}` : 'Pending'}</div><div className="text-[10px] font-bold uppercase mt-1">{match.status}</div></div>
            </div>
            <div className="flex items-center gap-4 border-b-4 sm:border-b-0 sm:border-r-4 border-main p-4 lg:p-5 bg-c3 text-main">
              <BarChart2 size={36} strokeWidth={2.5} />
              <div><div className="text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">Total Points</div><div className="text-2xl sm:text-3xl font-black leading-none">{score?.total ?? '—'}</div><div className="text-[10px] font-bold uppercase mt-1">Current earned</div></div>
            </div>
            <div className="flex items-center gap-4 border-main p-4 lg:p-5 bg-c4 text-main">
              <ShieldCheck size={36} strokeWidth={2.5} />
              <div><div className="text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">Revision</div><div className="text-2xl sm:text-3xl font-black leading-none">{prediction.revision}</div><div className="text-[10px] font-bold uppercase mt-1">Updated {formatDate(prediction.updatedAt)}</div></div>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row flex-1">
            <div className="flex-1 border-r-0 xl:border-r-4 border-main flex flex-col bg-card min-w-0">
              <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm border-b-4 border-main">
                Scoring Ledger
              </div>
              <div className="bg-card flex flex-col">
                <BreakdownLine label="Exact score" value={score?.exactScore ?? 'Pending'} description="Awarded when both team scores match the final result. Exact score is worth 3 points." tone={score?.exactScore ? 'bg-c3' : 'bg-card'} />
                <BreakdownLine label="Correct outcome" value={score?.correctOutcome ?? 'Pending'} description="Awarded when the win/draw/loss outcome is correct but the exact score is not. Correct outcome is worth 1 point." tone={score?.correctOutcome ? 'bg-c1' : 'bg-card'} />
                <BreakdownLine label="Streak bonus" value={score?.streakBonus ?? 'Placeholder'} description="Reserved for future streak rules. Phase 2 keeps this visible but not fully integrated." />
                <BreakdownLine label="Risk multiplier" value={score ? `${score.riskMultiplier}x` : 'Placeholder'} description="Reserved for future risk-pick scoring. Current data keeps the multiplier neutral." />
                <BreakdownLine label="Underdog bonus" value={score?.underdogBonus ?? 'Placeholder'} description="Reserved for future underdog rules after product validation." />
                <div className="p-5 bg-main text-inv flex items-center justify-between uppercase">
                  <div>
                    <div className="font-black text-xs tracking-widest">Total earned</div>
                    <div className="font-bold text-[10px] opacity-80">{score?.scoringVersion ?? 'Awaiting final result'}</div>
                  </div>
                  <div className="font-black text-4xl">{score?.total ?? 0} PTS</div>
                </div>
              </div>
            </div>

            <div className="w-full xl:w-[420px] bg-card flex flex-col">
              <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm border-b-4 border-main">
                Match Context
              </div>
              <div className="p-4 bg-card flex flex-col gap-3 font-bold text-sm border-b-4 border-main">
                <div className="flex justify-between border-b-2 border-line pb-2"><span>Match</span><span className="font-black text-right">{homeTeam.name} vs {awayTeam.name}</span></div>
                <div className="flex justify-between border-b-2 border-line pb-2"><span>Kickoff</span><span className="font-black text-right">{formatDate(match.kickoff_at)}</span></div>
                <div className="flex justify-between border-b-2 border-line pb-2"><span>Lock time</span><span className="font-black text-right">{formatDate(match.lock_at)}</span></div>
                <div className="flex justify-between border-b-2 border-line pb-2"><span>Status</span><span className="font-black uppercase">{match.status}</span></div>
                <div className="flex justify-between"><span>Risk pick</span><span className="font-black uppercase">{prediction.isRiskPick ? 'Yes' : 'No'}</span></div>
              </div>

              <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm border-b-4 border-main">
                Actions
              </div>
              <div className="p-4 bg-card flex flex-col gap-3 border-b-4 border-main">
                <Link to="/my-predictions" className="bg-card hover:bg-muted text-main font-black uppercase py-3 px-4 border-2 border-main shadow-[3px_3px_0_var(--color-shadow)] flex items-center justify-center gap-2 text-xs"><ArrowLeft size={16} /> My Predictions</Link>
                <Link to={`/matches/${match.id}`} className="bg-c2 text-inv font-black uppercase py-3 px-4 border-2 border-main shadow-[3px_3px_0_var(--color-shadow)] flex items-center justify-center gap-2 text-xs"><CheckCircle2 size={16} /> Match Detail</Link>
              </div>

              <div className="p-4 bg-c1 font-black uppercase text-xs leading-relaxed flex-1">
                This is a skill-based scoring view for a free-to-play prediction contest with points, badges, and standings.
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
