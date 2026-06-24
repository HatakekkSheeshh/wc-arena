import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BarChart2, ListChecks, Star, Trophy } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import PointsCoin from '../components/ui/PointsCoin';
import RankBadge from '../components/ui/RankBadge';
import StatusPill from '../components/ui/StatusPill';
import StreakBadge from '../components/ui/StreakBadge';
import { getPublicUserPredictionHistory, type PublicPredictionHistory, type PublicPredictionHistoryRow } from '../services/publicPredictions';
import { getPublicProfile, type PublicProfileRow } from '../services/profile';
import { getErrorMessage } from '../services/serviceTypes';
import { getTeamMap, type TeamRow } from '../services/teams';
import { getPublicDisplayName, getPublicInitials } from '../utils/displayName';
import { formatPredictionPick } from '../utils/predictionDisplay';
import type { ThemeControls } from '../App';
import type { MatchOutcome, Prediction, PredictionDisplayStatus, PredictionType } from '../types/domain';

type PublicProfileProps = {
  themeControls: ThemeControls;
};

type PublicProfileHeader = PublicProfileRow | NonNullable<PublicPredictionHistory['profile']>;

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(value));
}

function formatPoints(value?: number | null) {
  return (value ?? 0).toLocaleString();
}

function getTeamShortName(teams: Map<string, TeamRow>, teamId: string) {
  return teams.get(teamId)?.short_name ?? teamId.toUpperCase();
}

function getStatusFromScore(row: PublicPredictionHistoryRow): PredictionDisplayStatus {
  if (row.score_outcome === 'exact' || row.score_outcome === 'correct' || row.score_outcome === 'missed') return row.score_outcome;
  return 'missed';
}

function toPrediction(row: PublicPredictionHistoryRow): Prediction {
  return {
    id: row.prediction_id,
    userId: row.profile_id,
    matchId: row.prediction_match_id,
    predictionType: row.prediction_type as PredictionType,
    homeScore: row.prediction_home_score,
    awayScore: row.prediction_away_score,
    predictedOutcome: row.prediction_predicted_outcome as MatchOutcome,
    confidence: row.prediction_confidence,
    isRiskPick: row.prediction_is_risk_pick,
    createdAt: row.prediction_created_at,
    updatedAt: row.prediction_updated_at,
    lockedAt: row.prediction_locked_at ?? undefined,
    status: row.prediction_status as Prediction['status'],
    revision: row.prediction_revision,
  };
}

export default function PublicProfile({ themeControls }: PublicProfileProps) {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<PublicProfileHeader | null>(null);
  const [history, setHistory] = useState<PublicPredictionHistoryRow[]>([]);
  const [teams, setTeams] = useState<Map<string, TeamRow>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setHistory([]);
      setError('Profile not found.');
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([getPublicProfile(userId), getPublicUserPredictionHistory(userId), getTeamMap()])
      .then(([nextProfile, nextHistory, nextTeams]) => {
        if (!active) return;
        setProfile(nextProfile ?? nextHistory.profile);
        setHistory(nextHistory.predictions);
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
  }, [userId]);

  const totals = useMemo(() => ({
    picks: history.length,
    points: history.reduce((sum, row) => sum + row.score_total, 0),
    exact: history.filter((row) => row.score_outcome === 'exact').length,
    accuracy: history.length ? Math.round((history.filter((row) => row.score_outcome === 'exact' || row.score_outcome === 'correct').length / history.length) * 100) : profile?.accuracy ?? 0,
    goalDifference: history.reduce((sum, row) => sum + row.score_goal_difference_bonus, 0),
    teamScore: history.reduce((sum, row) => sum + row.score_team_score_bonus, 0),
    outcome: history.reduce((sum, row) => sum + row.score_correct_outcome, 0),
    exactPoints: history.reduce((sum, row) => sum + row.score_exact_score, 0),
  }), [history, profile?.accuracy]);

  if (loading) {
    return (
      <AppShell themeControls={themeControls}>
        <div className="relative z-10 flex flex-col p-3 sm:p-4 lg:p-6 gap-3 lg:gap-6 min-h-0">
          <div className="bg-card border-4 border-main p-3 sm:p-4 lg:p-6 shadow-[6px_6px_0_0_var(--color-shadow)] lg:shadow-[8px_8px_0_0_var(--color-shadow)] font-black uppercase text-sm">
            Loading public profile...
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !profile) {
    return (
      <AppShell themeControls={themeControls}>
        <div className="relative z-10 flex flex-col p-3 sm:p-4 lg:p-6 gap-3 lg:gap-6 min-h-0">
          <div className="bg-card border-4 border-main p-3 sm:p-4 lg:p-6 flex flex-col gap-3 shadow-[6px_6px_0_0_var(--color-shadow)] lg:shadow-[8px_8px_0_0_var(--color-shadow)] font-black uppercase text-sm">
            <span>{error ?? 'Profile not found.'}</span>
            <Link to="/leaderboard" className="text-c2 underline">Back to leaderboard</Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const displayName = getPublicDisplayName(profile, profile.id);
  const initials = getPublicInitials(profile, profile.id);
  const favoriteTeam = profile.fan_club_team_id ? teams.get(profile.fan_club_team_id) : undefined;

  return (
    <AppShell themeControls={themeControls}>
      <div className="relative z-10 flex flex-col p-3 sm:p-4 lg:p-6 gap-3 lg:gap-6 min-h-0">
        <div className="bg-card border-4 border-main p-3 sm:p-4 lg:p-6 flex flex-col gap-4 shadow-[6px_6px_0_0_var(--color-shadow)] lg:shadow-[8px_8px_0_0_var(--color-shadow)]">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-main bg-elevated overflow-hidden flex items-center justify-center font-black text-2xl shrink-0 shadow-[4px_4px_0_var(--color-shadow)]">
              {profile.avatar_url ? <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" /> : initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] sm:text-xs uppercase font-black tracking-widest text-subtle">Public profile</div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tighter text-main leading-none truncate">{displayName}</h1>
              <div className="mt-2 flex flex-wrap gap-2 text-[10px] sm:text-xs font-black uppercase">
                <span className="border-2 border-main bg-c1 text-main px-2 py-1">Rank #{profile.rank ?? '—'}</span>
                <span className="border-2 border-main bg-c2 text-inv px-2 py-1 flex items-center gap-1"><PointsCoin size="sm" />{formatPoints(profile.points)} pts</span>
                {favoriteTeam && <span className="border-2 border-main bg-card text-main px-2 py-1">Fan club: {favoriteTeam.short_name}</span>}
              </div>
            </div>
            <Link to="/leaderboard" className="bg-card hover:bg-muted text-main font-black text-[10px] sm:text-xs px-3 py-2 border-2 border-main uppercase shadow-[2px_2px_0_var(--color-shadow)] text-center">
              Leaderboard
            </Link>
          </div>
        </div>

        <div className="bg-card border-4 border-main flex flex-col gap-0 shadow-[6px_6px_0_0_var(--color-shadow)] lg:shadow-[8px_8px_0_0_var(--color-shadow)] rounded-sm overflow-hidden">
          <div className="grid grid-cols-2 xl:grid-cols-4 border-b-4 border-main">
            <div className="flex items-center gap-2 sm:gap-4 border-b-4 border-r-4 xl:border-b-0 border-main p-2.5 sm:p-4 lg:p-5 bg-c1 text-main min-w-0">
              <ListChecks size={24} className="sm:w-9 sm:h-9 shrink-0" strokeWidth={2.5} />
              <div className="min-w-0"><div className="text-[9px] sm:text-xs uppercase font-black tracking-widest opacity-90 truncate">Scored picks</div><div className="text-lg sm:text-3xl font-black leading-none">{totals.picks}</div></div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 border-b-4 xl:border-b-0 xl:border-r-4 border-main p-2.5 sm:p-4 lg:p-5 bg-c2 text-inv min-w-0">
              <Trophy size={24} className="sm:w-9 sm:h-9 shrink-0" strokeWidth={2.5} />
              <div className="min-w-0"><div className="text-[9px] sm:text-xs uppercase font-black tracking-widest opacity-90 truncate">Public points</div><div className="text-lg sm:text-3xl font-black leading-none flex items-center gap-1"><PointsCoin size="sm" />{formatPoints(totals.points)}</div></div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 border-r-4 xl:border-r-4 border-main p-2.5 sm:p-4 lg:p-5 bg-c3 text-main min-w-0">
              <BarChart2 size={24} className="sm:w-9 sm:h-9 shrink-0" strokeWidth={2.5} />
              <div className="min-w-0"><div className="text-[9px] sm:text-xs uppercase font-black tracking-widest opacity-90 truncate">Accuracy</div><div className="text-lg sm:text-3xl font-black leading-none">{totals.accuracy}%</div></div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 border-main p-2.5 sm:p-4 lg:p-5 bg-c4 text-main min-w-0">
              <Star size={24} className="sm:w-9 sm:h-9 shrink-0" strokeWidth={2.5} fill="currentColor" />
              <div className="min-w-0"><div className="text-[9px] sm:text-xs uppercase font-black tracking-widest opacity-90 truncate">Exact scores</div><div className="text-lg sm:text-3xl font-black leading-none">{totals.exact || profile.exact_scores}</div></div>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row flex-1">
            <div className="flex-1 border-r-0 xl:border-r-4 border-main flex flex-col bg-card min-w-0">
              <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm border-b-4 border-main">
                Finished prediction history
              </div>
              <div className="hidden lg:grid grid-cols-[140px_1.4fr_140px_140px_120px_90px] bg-card border-b-4 border-main font-black uppercase text-[10px] tracking-widest text-subtle">
                <div className="p-3 border-r-2 border-main">Kickoff</div>
                <div className="p-3 border-r-2 border-main">Match</div>
                <div className="p-3 border-r-2 border-main text-center">Pick</div>
                <div className="p-3 border-r-2 border-main text-center">Actual</div>
                <div className="p-3 border-r-2 border-main text-center">Status</div>
                <div className="p-3 text-center">Points</div>
              </div>

              <div className="flex flex-col bg-card gap-3 lg:gap-0 p-3 lg:p-0">
                {history.length === 0 && (
                  <div className="p-6 font-black uppercase text-sm">No finished scored predictions are public yet.</div>
                )}
                {history.map((row) => {
                  const prediction = toPrediction(row);
                  const homeTeam = teams.get(row.match_home_team_id);
                  const awayTeam = teams.get(row.match_away_team_id);
                  const homeShortName = getTeamShortName(teams, row.match_home_team_id);
                  const awayShortName = getTeamShortName(teams, row.match_away_team_id);
                  const pickText = formatPredictionPick(prediction, homeShortName, awayShortName);
                  const status = getStatusFromScore(row);

                  return (
                    <div key={row.prediction_id} className="border-4 lg:border-0 lg:border-b-4 border-main last:border-b-4 lg:last:border-b-0 font-bold text-sm hover:bg-muted transition-colors bg-card shadow-[4px_4px_0_var(--color-shadow)] lg:shadow-none">
                      <div className="lg:hidden flex flex-col">
                        <div className="flex items-start justify-between gap-3 bg-main text-inv p-3 border-b-4 border-main">
                          <div className="min-w-0">
                            <div className="text-[10px] uppercase font-black tracking-widest opacity-80">{formatDate(row.match_kickoff_at)}</div>
                            <Link to={`/matches/${row.prediction_match_id}`} className="block font-black uppercase text-lg leading-tight mt-1 hover:underline">
                              {homeShortName} vs {awayShortName}
                            </Link>
                          </div>
                          <StatusPill status={status} />
                        </div>

                        <div className="grid grid-cols-[1fr_auto_1fr] border-b-4 border-main">
                          <div className="p-3 bg-c1 text-main min-w-0">
                            <div className="text-[9px] uppercase font-black tracking-widest opacity-70 truncate">{homeTeam?.name ?? row.match_home_team_id}</div>
                            <div className="text-2xl font-black uppercase truncate">{homeShortName}</div>
                          </div>
                          <div className="px-3 py-2 bg-card border-x-4 border-main flex flex-col items-center justify-center min-w-[70px]">
                            <div className="text-[9px] uppercase font-black text-subtle">Actual</div>
                            <div className="text-xl font-black">{row.match_home_score}-{row.match_away_score}</div>
                          </div>
                          <div className="p-3 bg-c2 text-inv text-right min-w-0">
                            <div className="text-[9px] uppercase font-black tracking-widest opacity-70 truncate">{awayTeam?.name ?? row.match_away_team_id}</div>
                            <div className="text-2xl font-black uppercase truncate">{awayShortName}</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-[1fr_auto] border-b-4 border-main">
                          <div className="p-3">
                            <div className="text-[10px] uppercase font-black tracking-widest text-subtle">Pick</div>
                            <div className="font-black uppercase text-lg leading-tight mt-1">{pickText}</div>
                            <div className="text-[10px] uppercase font-bold text-subtle mt-1">{row.match_stadium} • {row.match_city}</div>
                          </div>
                          <div className="p-3 bg-c3 text-main border-l-4 border-main flex flex-col items-center justify-center min-w-[82px]">
                            <div className="text-[9px] uppercase font-black tracking-widest opacity-70">Points</div>
                            <div className="text-3xl font-black leading-none">{row.score_total}</div>
                          </div>
                        </div>
                      </div>

                      <div className="hidden lg:grid lg:grid-cols-[140px_1.4fr_140px_140px_120px_90px]">
                        <div className="p-3 lg:border-r-2 border-main text-subtle uppercase text-xs font-black">{formatDate(row.match_kickoff_at)}</div>
                        <div className="p-3 lg:border-r-2 border-main">
                          <Link to={`/matches/${row.prediction_match_id}`} className="font-black uppercase text-main hover:text-c2 hover:underline">{homeTeam?.name ?? row.match_home_team_id} vs {awayTeam?.name ?? row.match_away_team_id}</Link>
                          <div className="text-xs text-subtle uppercase mt-1">{row.match_stadium} • {row.match_city}</div>
                        </div>
                        <div className="p-3 lg:border-r-2 border-main text-center font-black">{pickText}</div>
                        <div className="p-3 lg:border-r-2 border-main text-center font-black">{row.match_home_score} - {row.match_away_score}</div>
                        <div className="p-3 lg:border-r-2 border-main flex justify-center"><StatusPill status={status} /></div>
                        <div className="p-3 text-center font-black text-lg">{row.score_total}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="w-full xl:w-[360px] bg-card flex flex-col">
              <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm border-b-4 border-main">
                Points breakdown
              </div>
              <div className="p-4 bg-card flex flex-col gap-3 text-sm font-bold">
                <div className="flex justify-between border-b-2 border-line pb-2"><span>Exact score points</span><span className="font-black">{totals.exactPoints}</span></div>
                <div className="flex justify-between border-b-2 border-line pb-2"><span>Outcome points</span><span className="font-black">{totals.outcome}</span></div>
                <div className="flex justify-between border-b-2 border-line pb-2"><span>Goal difference bonus</span><span className="font-black">{totals.goalDifference}</span></div>
                <div className="flex justify-between border-b-2 border-line pb-2"><span>Team score bonus</span><span className="font-black">{totals.teamScore}</span></div>
                <div className="flex justify-between text-lg uppercase"><span>Total public points</span><span className="font-black">{totals.points} pts</span></div>
              </div>
              <div className="bg-c1 text-main border-t-4 border-main p-4 font-black uppercase text-xs leading-relaxed">
                Only finished matches with calculated score rows are shown here. Future and live predictions stay private.
              </div>
              <div className="bg-card border-t-4 border-main p-4 flex flex-col gap-3 font-bold text-sm">
                <div className="flex justify-between items-center pb-2 border-b-2 border-line"><span>Global rank</span><span className="font-black">#{profile.rank ?? '—'}</span></div>
                <div className="flex justify-between items-center pb-2 border-b-2 border-line"><span>Tier</span><RankBadge points={profile.points} size="sm" /></div>
                <div className="flex justify-between items-center"><span>Best streak</span><span className="font-black"><StreakBadge streak={profile.best_streak} size="sm" /></span></div>
                <div className="text-[10px] uppercase text-subtle font-black pt-2">Joined {formatShortDate(profile.created_at)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
