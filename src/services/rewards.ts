import { supabase } from '../lib/supabaseClient';
import type { Database } from '../types/supabase';

export type RewardReviewRow = Database['public']['Tables']['reward_reviews']['Row'];

export async function listCurrentUserRewardReviews() {
  const { data, error } = await supabase
    .from('reward_reviews')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data as RewardReviewRow[];
}
