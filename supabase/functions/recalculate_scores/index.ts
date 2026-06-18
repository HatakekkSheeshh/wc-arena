import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Score = {
  home_score: number;
  away_score: number;
};

type MatchScore = Score & {
  status: string;
  kickoff_at: string;
};

type PredictionRow = {
  id: string;
  user_id: string;
  home_score: number;
  away_score: number;
  predicted_outcome: 'home' | 'draw' | 'away' | null;
  is_risk_pick: boolean;
  matches: MatchScore;
};

type CalculatedScore = {
  prediction_id: string;
  user_id: string;
  match_kickoff_at: string;
  outcome: 'exact' | 'correct' | 'missed';
  exact_score: number;
  correct_outcome: number;
  streak_bonus: number;
  risk_multiplier: number;
  underdog_bonus: number;
  total: number;
  scoring_version: string;
  calculated_at: string;
};

type UserAggregate = {
  userId: string;
  points: number;
  exactScores: number;
  accuracy: number;
  currentStreak: number;
  bestStreak: number;
  rank: number;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function getOutcome(score: Score) {
  if (score.home_score > score.away_score) return 'home';
  if (score.home_score < score.away_score) return 'away';
  return 'draw';
}

function getPredictionOutcome(prediction: PredictionRow): 'exact' | 'correct' | 'missed' {
  const exact = prediction.home_score === prediction.matches.home_score && prediction.away_score === prediction.matches.away_score;
  if (exact) return 'exact';
  return (prediction.predicted_outcome ?? getOutcome(prediction)) === getOutcome(prediction.matches) ? 'correct' : 'missed';
}

function calculateScore(prediction: PredictionRow): CalculatedScore {
  const outcome = getPredictionOutcome(prediction);
  const exactScore = outcome === 'exact' ? 3 : 0;
  const correctOutcome = outcome === 'correct' ? 1 : 0;
  const riskMultiplier = prediction.is_risk_pick ? 1 : 1;
  const calculatedAt = new Date().toISOString();

  return {
    prediction_id: prediction.id,
    user_id: prediction.user_id,
    match_kickoff_at: prediction.matches.kickoff_at,
    outcome,
    exact_score: exactScore,
    correct_outcome: correctOutcome,
    streak_bonus: 0,
    risk_multiplier: riskMultiplier,
    underdog_bonus: 0,
    total: (exactScore + correctOutcome) * riskMultiplier,
    scoring_version: 'mvp-2026-06-15',
    calculated_at: calculatedAt,
  };
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

function buildAggregates(scores: CalculatedScore[]): UserAggregate[] {
  const scoresByUser = new Map<string, CalculatedScore[]>();
  for (const score of scores) {
    scoresByUser.set(score.user_id, [...(scoresByUser.get(score.user_id) ?? []), score]);
  }

  const aggregates = [...scoresByUser.entries()].map(([userId, userScores]) => {
    const points = userScores.reduce((sum, score) => sum + score.total, 0);
    const exactScores = userScores.filter((score) => score.outcome === 'exact').length;
    const correctScores = userScores.filter((score) => score.outcome !== 'missed').length;
    const accuracy = userScores.length ? Math.round((correctScores / userScores.length) * 100) : 0;

    return {
      userId,
      points,
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

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return jsonResponse({ error: 'Missing authorization header' }, 401);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'Missing Supabase server config' }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const token = authHeader.replace('Bearer ', '');
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .single();

  if (profileError || profile?.role !== 'admin') {
    return jsonResponse({ error: 'Forbidden' }, 403);
  }

  const { data: predictions, error: predictionsError } = await supabase
    .from('predictions')
    .select('id, user_id, home_score, away_score, predicted_outcome, is_risk_pick, matches!inner(home_score, away_score, status, kickoff_at)')
    .eq('matches.status', 'finished');

  if (predictionsError) {
    return jsonResponse({ error: predictionsError.message }, 500);
  }

  const calculatedScores = ((predictions ?? []) as PredictionRow[]).map(calculateScore);
  for (const score of calculatedScores) {
    const { user_id: _userId, match_kickoff_at: _matchKickoffAt, ...scoreValues } = score;
    const { error: scoreError } = await supabase.from('prediction_scores').upsert(scoreValues);
    if (scoreError) {
      return jsonResponse({ error: scoreError.message }, 500);
    }
  }

  const aggregates = buildAggregates(calculatedScores);
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

  await supabase.from('admin_audit_logs').insert({
    actor_id: userData.user.id,
    action: 'score_recalculation_completed',
    entity_type: 'leaderboard',
    entity_id: 'global',
    description: `Recalculated ${calculatedScores.length} prediction scores and ${aggregates.length} leaderboard entries.`,
    severity: 'info',
  });

  return jsonResponse({ predictionScores: calculatedScores.length, leaderboardEntries: aggregates.length });
});
