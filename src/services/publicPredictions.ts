import { supabase } from '../lib/supabaseClient';
import type { Database } from '../types/supabase';

export type PublicPredictionHistoryRow = Database['public']['Functions']['get_public_user_prediction_history']['Returns'][number];

export type PublicPredictionHistory = {
  profile: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    country_code: string | null;
    fan_club_team_id: string | null;
    points: number;
    rank: number | null;
    accuracy: number | null;
    exact_scores: number;
    current_streak: number;
    best_streak: number;
    created_at: string;
  } | null;
  predictions: PublicPredictionHistoryRow[];
};

export async function getPublicUserPredictionHistory(userId: string, limit = 64): Promise<PublicPredictionHistory> {
  const { data, error } = await supabase.rpc('get_public_user_prediction_history', {
    target_user_id: userId,
    row_limit: limit,
  });

  if (error) throw error;

  const predictions = data ?? [];
  const first = predictions[0];

  return {
    profile: first ? {
      id: first.profile_id,
      username: first.profile_username,
      display_name: first.profile_display_name,
      avatar_url: first.profile_avatar_url,
      country_code: first.profile_country_code,
      fan_club_team_id: first.profile_fan_club_team_id,
      points: first.profile_points,
      rank: first.profile_rank,
      accuracy: first.profile_accuracy,
      exact_scores: first.profile_exact_scores,
      current_streak: first.profile_current_streak,
      best_streak: first.profile_best_streak,
      created_at: first.profile_created_at,
    } : null,
    predictions,
  };
}
