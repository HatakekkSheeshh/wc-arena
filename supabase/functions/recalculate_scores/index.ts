import { jsonResponse as sharedJsonResponse, requireAdminUser } from '../_shared/authGuards.ts';
import { refreshLeagueLeaderboards } from '../_shared/leagueLeaderboards.ts';
import { refreshLeagueEventLeaderboards } from '../_shared/leagueEvents.ts';
import { buildCommunityDistributions, calculatePredictionScores, type CalculatedScore, type PredictionScoringRow, type TeamSignalRow } from '../_shared/scoringRules.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type UserAggregate = {
  userId: string;
  predictionPoints: number;
  rewardPoints: number;
  points: number;
  exactScores: number;
  accuracy: number;
  currentStreak: number;
  bestStreak: number;
  rank: number;
};

type DailyRewardRow = {
  user_id: string;
  points_awarded: number;
};

type PointTransactionRow = {
  user_id: string;
  amount: number;
};

function jsonResponse(body: unknown, status = 200) {
  return sharedJsonResponse(corsHeaders, body, status);
}

function getCurrentStreak(scores: CalculatedScore[]) {
  let streak = 0;
  for (const score of [...scores].sort((a, b) => a.match_kickoff_at.localeCompare(b.match_kickoff_at)).reverse()) {
    if (score.outcome === 'missed') break;
    streak += 1;
  }
  return streak;
}

function getBestStreak(scores: CalculatedScore[]) {
  let current = 0;
  let best = 0;
  for (const score of [...scores].sort((a, b) => a.match_kickoff_at.localeCompare(b.match_kickoff_at))) {
    if (score.outcome === 'missed') {
      current = 0;
      continue;
    }
    current += 1;
    best = Math.max(best, current);
  }
  return best;
}

function buildAggregates(scores: CalculatedScore[], rewardPointsByUser: Map<string, number>, pointAdjustmentsByUser: Map<string, number>): UserAggregate[] {
  const scoresByUser = new Map<string, CalculatedScore[]>();
  for (const score of scores) {
    scoresByUser.set(score.user_id, [...(scoresByUser.get(score.user_id) ?? []), score]);
  }

  const userIds = new Set([...scoresByUser.keys(), ...rewardPointsByUser.keys(), ...pointAdjustmentsByUser.keys()]);
  const aggregates = [...userIds].map((userId) => {
    const userScores = scoresByUser.get(userId) ?? [];
    const predictionPoints = userScores.reduce((sum, score) => sum + score.total, 0);
    const rewardPoints = rewardPointsByUser.get(userId) ?? 0;
    const pointAdjustments = pointAdjustmentsByUser.get(userId) ?? 0;
    const exactScores = userScores.filter((score) => score.outcome === 'exact').length;
    const correctScores = userScores.filter((score) => score.outcome !== 'missed').length;
    const accuracy = userScores.length ? Math.round((correctScores / userScores.length) * 100) : 0;

    return {
      userId,
      predictionPoints,
      rewardPoints,
      points: Math.max(0, predictionPoints + rewardPoints + pointAdjustments),
      exactScores,
      accuracy,
      currentStreak: getCurrentStreak(userScores),
      bestStreak: getBestStreak(userScores),
      rank: 0,
    };
  });

  return aggregates
    .sort((a, b) => b.points - a.points || b.exactScores - a.exactScores || b.accuracy - a.accuracy)
    .map((aggregate, index) => ({ ...aggregate, rank: index + 1 }));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const auth = await requireAdminUser(req, corsHeaders);
  if (auth instanceof Response) return auth;
  const { supabase, user } = auth;

  const { data: predictions, error: predictionsError } = await supabase
    .from('predictions')
    .select('id, user_id, match_id, prediction_type, home_score, away_score, predicted_outcome, is_risk_pick, matches!inner(home_score, away_score, status, kickoff_at, home_team_id, away_team_id, espn_home_win_pct, espn_draw_pct, espn_away_win_pct)')
    .eq('matches.status', 'finished');

  if (predictionsError) {
    return jsonResponse({ error: predictionsError.message }, 500);
  }

  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select('id, fifa_rank');

  if (teamsError) {
    return jsonResponse({ error: teamsError.message }, 500);
  }

  const predictionRows = (predictions ?? []) as PredictionScoringRow[];
  const teamMap = new Map((teams ?? []).map((team: TeamSignalRow) => [team.id, team]));
  const calculatedScores = calculatePredictionScores(predictionRows, { teams: teamMap, community: buildCommunityDistributions(predictionRows) });
  for (const score of calculatedScores) {
    const { user_id: _userId, match_kickoff_at: _matchKickoffAt, ...scoreValues } = score;
    const { error: scoreError } = await supabase.from('prediction_scores').upsert(scoreValues);
    if (scoreError) {
      return jsonResponse({ error: scoreError.message }, 500);
    }
  }

  const { data: dailyRewards, error: dailyRewardsError } = await supabase
    .from('daily_login_rewards')
    .select('user_id, points_awarded');

  if (dailyRewardsError) {
    return jsonResponse({ error: dailyRewardsError.message }, 500);
  }

  const rewardPointsByUser = new Map<string, number>();
  for (const reward of (dailyRewards ?? []) as DailyRewardRow[]) {
    rewardPointsByUser.set(reward.user_id, (rewardPointsByUser.get(reward.user_id) ?? 0) + reward.points_awarded);
  }

  const { data: pointTransactions, error: pointTransactionsError } = await supabase
    .from('point_transactions')
    .select('user_id, amount')
    .in('type', ['stake', 'payout', 'point_split', 'refund']);

  if (pointTransactionsError) {
    return jsonResponse({ error: pointTransactionsError.message }, 500);
  }

  const pointAdjustmentsByUser = new Map<string, number>();
  for (const transaction of (pointTransactions ?? []) as PointTransactionRow[]) {
    pointAdjustmentsByUser.set(transaction.user_id, (pointAdjustmentsByUser.get(transaction.user_id) ?? 0) + transaction.amount);
  }

  const aggregates = buildAggregates(calculatedScores, rewardPointsByUser, pointAdjustmentsByUser);
  const { data: previousEntries, error: previousError } = await supabase
    .from('leaderboard_entries')
    .select('user_id, rank')
    .eq('scope', 'global')
    .is('league_id', null);

  if (previousError) {
    return jsonResponse({ error: previousError.message }, 500);
  }

  const previousRanks = new Map((previousEntries ?? []).map((entry) => [entry.user_id, entry.rank]));
  const { error: deleteError } = await supabase
    .from('leaderboard_entries')
    .delete()
    .eq('scope', 'global')
    .is('league_id', null);

  if (deleteError) {
    return jsonResponse({ error: deleteError.message }, 500);
  }

  if (aggregates.length) {
    const { error: insertError } = await supabase.from('leaderboard_entries').insert(aggregates.map((aggregate) => ({
      scope: 'global',
      league_id: null,
      user_id: aggregate.userId,
      rank: aggregate.rank,
      previous_rank: previousRanks.get(aggregate.userId) ?? null,
      points: aggregate.points,
      exact_scores: aggregate.exactScores,
      accuracy: aggregate.accuracy,
      streak: aggregate.currentStreak,
      updated_at: new Date().toISOString(),
    })));

    if (insertError) {
      return jsonResponse({ error: insertError.message }, 500);
    }
  }

  for (const aggregate of aggregates) {
    const { error: profileUpdateError } = await supabase.from('profiles').update({
      points: aggregate.points,
      rank: aggregate.rank,
      accuracy: aggregate.accuracy,
      exact_scores: aggregate.exactScores,
      current_streak: aggregate.currentStreak,
      best_streak: aggregate.bestStreak,
    }).eq('id', aggregate.userId);

    if (profileUpdateError) {
      return jsonResponse({ error: profileUpdateError.message }, 500);
    }
  }

  const leagueRefresh = await refreshLeagueLeaderboards(supabase);
  const eventRefresh = await refreshLeagueEventLeaderboards(supabase);

  await supabase.from('admin_audit_logs').insert({
    actor_id: user.id,
    action: 'score_recalculation_completed',
    entity_type: 'leaderboard',
    entity_id: 'global',
    description: `Recalculated ${calculatedScores.length} prediction scores, ${aggregates.length} global leaderboard entries, ${leagueRefresh.leagueLeaderboardEntries} league leaderboard entries, and ${eventRefresh.leagueEventLeaderboardEntries} event leaderboard entries.`,
    severity: 'info',
  });

  return jsonResponse({ predictionScores: calculatedScores.length, leaderboardEntries: aggregates.length, ...leagueRefresh, ...eventRefresh });
});
