import { supabase } from '../lib/supabaseClient';
import type { Database } from '../types/supabase';

export type RewardReviewRow = Database['public']['Tables']['reward_reviews']['Row'];
export type RewardEligibilityCheckRow = Database['public']['Tables']['reward_eligibility_checks']['Row'];
export type RewardTrustNoteRow = Database['public']['Tables']['reward_trust_notes']['Row'];

const REWARD_REVIEW_FIELDS = 'id, user_id, title, period, placement, amount, currency, source, status, updated_at, note';
const REWARD_ELIGIBILITY_CHECK_FIELDS = 'id, user_id, label, description, status, href, sort_order, created_at, updated_at';
const REWARD_TRUST_NOTE_FIELDS = 'id, title, description, is_public, sort_order, created_at, updated_at';

export async function listCurrentUserRewardReviews() {
  const { data, error } = await supabase
    .from('reward_reviews')
    .select(REWARD_REVIEW_FIELDS)
    .order('updated_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return data as RewardReviewRow[];
}

export async function listCurrentUserRewardEligibilityChecks() {
  const { data, error } = await supabase
    .from('reward_eligibility_checks')
    .select(REWARD_ELIGIBILITY_CHECK_FIELDS)
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true })
    .limit(100);

  if (error) throw error;
  return data as RewardEligibilityCheckRow[];
}

export async function listRewardTrustNotes() {
  const { data, error } = await supabase
    .from('reward_trust_notes')
    .select(REWARD_TRUST_NOTE_FIELDS)
    .eq('is_public', true)
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true })
    .limit(100);

  if (error) throw error;
  return data as RewardTrustNoteRow[];
}
