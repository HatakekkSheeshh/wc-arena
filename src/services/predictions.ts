import { supabase, supabaseKey, supabaseUrl } from '../lib/supabaseClient';
import type { Database } from '../types/supabase';

export type PredictionRow = Database['public']['Tables']['predictions']['Row'];
export type PredictionScoreRow = Database['public']['Tables']['prediction_scores']['Row'];
export type PredictionWithMatch = PredictionRow & {
  matches: Database['public']['Tables']['matches']['Row'] | null;
  prediction_scores: PredictionScoreRow | null;
};
export type SubmitPredictionInput = {
  matchId: string;
  predictionType: 'exact_score' | 'outcome_only';
  homeScore?: number | null;
  awayScore?: number | null;
  predictedOutcome: 'home' | 'draw' | 'away';
  confidence?: number;
  isRiskPick?: boolean;
};

export async function listCurrentUserPredictions() {
  const { data, error } = await supabase
    .from('predictions')
    .select('*, matches(*), prediction_scores(*)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as PredictionWithMatch[];
}

export async function listCurrentUserPredictionsForMatches(matchIds: string[]) {
  if (matchIds.length === 0) return [];

  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .in('match_id', matchIds);

  if (error) throw error;
  return data as PredictionRow[];
}

export async function getPrediction(predictionId: string) {
  const { data, error } = await supabase
    .from('predictions')
    .select('*, matches(*), prediction_scores(*)')
    .eq('id', predictionId)
    .single();

  if (error) throw error;
  return data as PredictionWithMatch;
}

export type MatchPredictionOutcomeSummary = Database['public']['Functions']['get_match_prediction_outcome_summary']['Returns'][number];

export async function getMatchPredictionOutcomeSummary(matchId: string) {
  const { data, error } = await supabase.rpc('get_match_prediction_outcome_summary', {
    target_match_id: matchId,
  });

  if (error) throw error;
  return (data[0] ?? null) as MatchPredictionOutcomeSummary | null;
}

export async function submitPrediction(input: SubmitPredictionInput) {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) throw sessionError;
  if (!session) throw new Error('Sign in to save your prediction.');

  const response = await fetch(`${supabaseUrl}/functions/v1/submit_prediction`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseKey,
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(input),
  });
  const body = await response.json().catch(() => null) as { prediction?: PredictionRow; error?: string } | null;

  if (!response.ok) {
    throw new Error(body?.error ?? 'Prediction could not be saved.');
  }

  if (!body?.prediction) throw new Error('Prediction could not be saved.');
  return body as { prediction: PredictionRow };
}
