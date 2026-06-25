import { supabase, supabaseKey, supabaseUrl } from '../lib/supabaseClient';
import type { Database } from '../types/supabase';
import { invalidateCache } from './cache';

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

const PREDICTION_FIELDS = 'id, user_id, match_id, prediction_type, home_score, away_score, predicted_outcome, confidence, is_risk_pick, created_at, updated_at, locked_at, status, revision';
const PREDICTION_MATCH_FIELDS = 'id, home_team_id, away_team_id, kickoff_at, lock_at, status, stage, group_code, matchday, stadium, city, home_score, away_score, result_updated_at, espn_state, espn_status, espn_status_detail, espn_display_clock, espn_home_win_pct, espn_draw_pct, espn_away_win_pct';
const PREDICTION_SCORE_FIELDS = 'prediction_id, exact_score, correct_outcome, goal_difference_bonus, team_score_bonus, streak_bonus, risk_multiplier, underdog_bonus, total, outcome, scoring_version, calculated_at';
const PREDICTION_WITH_MATCH_FIELDS = `${PREDICTION_FIELDS}, matches(${PREDICTION_MATCH_FIELDS}), prediction_scores(${PREDICTION_SCORE_FIELDS})`;

export async function listCurrentUserPredictions() {
  const { data, error } = await supabase
    .from('predictions')
    .select(PREDICTION_WITH_MATCH_FIELDS)
    .order('created_at', { ascending: false })
    .limit(128);

  if (error) throw error;
  return data as PredictionWithMatch[];
}

export async function listCurrentUserPredictionsForMatches(matchIds: string[]) {
  if (matchIds.length === 0) return [];

  const { data, error } = await supabase
    .from('predictions')
    .select(PREDICTION_FIELDS)
    .in('match_id', matchIds)
    .limit(500);

  if (error) throw error;
  return data as PredictionRow[];
}

export async function getPrediction(predictionId: string) {
  const { data, error } = await supabase
    .from('predictions')
    .select(PREDICTION_WITH_MATCH_FIELDS)
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
  invalidateCache('matches:');
  invalidateCache('leaderboard:');
  return body as { prediction: PredictionRow };
}
