import { supabase } from '../lib/supabaseClient';
import type { Database } from '../types/supabase';

export type PredictionRow = Database['public']['Tables']['predictions']['Row'];
export type PredictionScoreRow = Database['public']['Tables']['prediction_scores']['Row'];
export type PredictionWithMatch = PredictionRow & {
  matches: Database['public']['Tables']['matches']['Row'] | null;
  prediction_scores: PredictionScoreRow | null;
};
export type SubmitPredictionInput = {
  matchId: string;
  homeScore: number;
  awayScore: number;
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
  const { data, error } = await supabase.functions.invoke('submit_prediction', {
    body: input,
  });

  if (error) throw error;
  return data as { prediction: PredictionRow };
}
