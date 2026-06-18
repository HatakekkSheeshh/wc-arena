import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type SubmitPredictionBody = {
  matchId: string;
  homeScore: number;
  awayScore: number;
  predictedOutcome: 'home' | 'draw' | 'away';
  confidence?: number;
  isRiskPick?: boolean;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function getScoreOutcome(homeScore: number, awayScore: number): 'home' | 'draw' | 'away' {
  if (homeScore > awayScore) return 'home';
  if (homeScore < awayScore) return 'away';
  return 'draw';
}

function isPredictionOutcome(value: unknown): value is 'home' | 'draw' | 'away' {
  return value === 'home' || value === 'draw' || value === 'away';
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

  let body: SubmitPredictionBody;
  try {
    body = await req.json() as SubmitPredictionBody;
  } catch {
    return jsonResponse({ error: 'Invalid JSON payload' }, 400);
  }

  if (!body.matchId || !Number.isInteger(body.homeScore) || !Number.isInteger(body.awayScore) || body.homeScore < 0 || body.awayScore < 0 || !isPredictionOutcome(body.predictedOutcome)) {
    return jsonResponse({ error: 'Invalid prediction payload' }, 400);
  }

  if (body.predictedOutcome !== getScoreOutcome(body.homeScore, body.awayScore)) {
    return jsonResponse({ error: 'Prediction outcome must match the exact score.' }, 400);
  }

  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('id, lock_at, status')
    .eq('id', body.matchId)
    .single();

  if (matchError || !match) {
    return jsonResponse({ error: 'Match not found' }, 404);
  }

  if (new Date() >= new Date(match.lock_at) || ['locked', 'live', 'finished', 'postponed', 'cancelled'].includes(match.status)) {
    return jsonResponse({ error: 'Prediction deadline has passed' }, 409);
  }

  const { data: existing, error: existingError } = await supabase
    .from('predictions')
    .select('id, revision')
    .eq('user_id', userData.user.id)
    .eq('match_id', body.matchId)
    .maybeSingle();

  if (existingError) {
    return jsonResponse({ error: existingError.message }, 500);
  }

  const predictionValues = {
    user_id: userData.user.id,
    match_id: body.matchId,
    home_score: body.homeScore,
    away_score: body.awayScore,
    predicted_outcome: body.predictedOutcome,
    confidence: body.confidence ?? 50,
    is_risk_pick: body.isRiskPick ?? false,
    status: 'submitted',
    revision: existing ? existing.revision + 1 : 1,
    updated_at: new Date().toISOString(),
  };

  const { data: prediction, error: upsertError } = await supabase
    .from('predictions')
    .upsert(predictionValues, { onConflict: 'user_id,match_id' })
    .select('*')
    .single();

  if (upsertError) {
    return jsonResponse({ error: upsertError.message }, 500);
  }

  await supabase.from('activity_events').insert({
    type: 'prediction_locked',
    title: existing ? 'Prediction updated' : 'Prediction submitted',
    description: `Prediction saved for match ${body.matchId}.`,
    user_id: userData.user.id,
    match_id: body.matchId,
    prediction_id: prediction.id,
    href: '/my-predictions',
  });

  return jsonResponse({ prediction });
});
