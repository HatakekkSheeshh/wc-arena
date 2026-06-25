import { jsonResponse as sharedJsonResponse, requireAuthenticatedUser } from '../_shared/authGuards.ts';
import { checkRateLimit } from '../_shared/rateLimit.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type PredictionOutcome = 'home' | 'draw' | 'away';
type PredictionType = 'exact_score' | 'outcome_only';

type SubmitPredictionBody = {
  matchId: string;
  predictionType: PredictionType;
  homeScore?: number | null;
  awayScore?: number | null;
  predictedOutcome: PredictionOutcome;
  confidence?: number;
  isRiskPick?: boolean;
};

function jsonResponse(body: unknown, status = 200) {
  return sharedJsonResponse(corsHeaders, body, status);
}

function getScoreOutcome(homeScore: number, awayScore: number): PredictionOutcome {
  if (homeScore > awayScore) return 'home';
  if (homeScore < awayScore) return 'away';
  return 'draw';
}

function isPredictionOutcome(value: unknown): value is PredictionOutcome {
  return value === 'home' || value === 'draw' || value === 'away';
}

function isPredictionType(value: unknown): value is PredictionType {
  return value === 'exact_score' || value === 'outcome_only';
}

function isValidScore(value: unknown): value is number {
  return Number.isInteger(value) && value >= 0;
}

function getProfileUsername(user: { id: string; email?: string; user_metadata?: Record<string, unknown> }) {
  const metadataUsername = user.user_metadata?.username;
  const requestedUsername = typeof metadataUsername === 'string' ? metadataUsername.trim() : '';
  const baseUsername = requestedUsername || user.email?.split('@')[0]?.trim() || 'player';
  return `${baseUsername}-${user.id.slice(0, 8)}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const auth = await requireAuthenticatedUser(req, corsHeaders);
  if (auth instanceof Response) return auth;
  const { supabase, user } = auth;

  const rateLimit = await checkRateLimit({
    key: user.id,
    action: 'submit_prediction',
    windowSeconds: 300,
    maxCount: 60,
  });
  if (!rateLimit.allowed) {
    return jsonResponse({ error: 'Too many requests. Please wait a minute and try again.', resetAt: rateLimit.resetAt }, 429);
  }

  let body: SubmitPredictionBody;
  try {
    body = await req.json() as SubmitPredictionBody;
  } catch {
    return jsonResponse({ error: 'Invalid JSON payload' }, 400);
  }

  if (!body.matchId || !isPredictionType(body.predictionType) || !isPredictionOutcome(body.predictedOutcome)) {
    return jsonResponse({ error: 'Invalid prediction payload' }, 400);
  }

  let homeScore: number | null = null;
  let awayScore: number | null = null;

  if (body.predictionType === 'exact_score') {
    if (!isValidScore(body.homeScore) || !isValidScore(body.awayScore)) {
      return jsonResponse({ error: 'Exact-score predictions require two non-negative whole numbers.' }, 400);
    }

    if (body.predictedOutcome !== getScoreOutcome(body.homeScore, body.awayScore)) {
      return jsonResponse({ error: 'Prediction outcome must match the exact score.' }, 400);
    }

    homeScore = body.homeScore;
    awayScore = body.awayScore;
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

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      username: getProfileUsername(user),
      email: user.email,
      role: 'user',
    }, { onConflict: 'id', ignoreDuplicates: true });

  if (profileError) {
    return jsonResponse({ error: profileError.message }, 500);
  }

  const { data: existing, error: existingError } = await supabase
    .from('predictions')
    .select('id, revision')
    .eq('user_id', user.id)
    .eq('match_id', body.matchId)
    .maybeSingle();

  if (existingError) {
    return jsonResponse({ error: existingError.message }, 500);
  }

  const predictionValues = {
    user_id: user.id,
    match_id: body.matchId,
    prediction_type: body.predictionType,
    home_score: homeScore,
    away_score: awayScore,
    predicted_outcome: body.predictedOutcome,
    confidence: body.confidence ?? 50,
    is_risk_pick: body.isRiskPick ?? true,
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
    user_id: user.id,
    match_id: body.matchId,
    prediction_id: prediction.id,
    href: '/my-predictions',
  });

  return jsonResponse({ prediction });
});
