import { supabase } from '../lib/supabaseClient';
import type { Database } from '../types/supabase';

export type AdminAuditLogRow = Database['public']['Tables']['admin_audit_logs']['Row'];
export type AdminChecklistItemRow = Database['public']['Tables']['admin_checklist_items']['Row'];
export type UserTrustSignalRow = Database['public']['Tables']['user_trust_signals']['Row'];
export type RewardReviewRow = Database['public']['Tables']['reward_reviews']['Row'];
export type AdminPredictionRow = Database['public']['Tables']['predictions']['Row'] & {
  profiles: Pick<Database['public']['Tables']['profiles']['Row'], 'username' | 'display_name'> | null;
  matches: Database['public']['Tables']['matches']['Row'] | null;
};

const ADMIN_AUDIT_LOG_FIELDS = 'id, actor_id, action, entity_type, entity_id, description, severity, created_at';
const ADMIN_CHECKLIST_ITEM_FIELDS = 'id, label, description, status, sort_order, created_at, updated_at';
const USER_TRUST_SIGNAL_FIELDS = 'id, user_id, label, description, severity, status, created_at, updated_at';
const REWARD_REVIEW_FIELDS = 'id, user_id, title, period, placement, amount, currency, source, status, updated_at, note';
const ADMIN_PREDICTION_FIELDS = `
  id,
  user_id,
  match_id,
  prediction_type,
  home_score,
  away_score,
  predicted_outcome,
  confidence,
  is_risk_pick,
  created_at,
  updated_at,
  locked_at,
  status,
  revision,
  profiles:user_id(username, display_name),
  matches(id, home_team_id, away_team_id, kickoff_at, lock_at, status, stage, group_code, matchday, stadium, city, home_score, away_score, result_updated_at)
`;

export async function updateMatchResult(input: { matchId: string; homeScore: number; awayScore: number }) {
  const { data, error } = await supabase.functions.invoke('update_match_result', { body: input });
  if (error) throw error;
  return data;
}

export async function recalculateScores() {
  const { data, error } = await supabase.functions.invoke('recalculate_scores', { body: {} });
  if (error) throw error;
  return data;
}

export async function listAdminAuditLogs() {
  const { data, error } = await supabase
    .from('admin_audit_logs')
    .select(ADMIN_AUDIT_LOG_FIELDS)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return data as AdminAuditLogRow[];
}

export async function listAdminChecklistItems() {
  const { data, error } = await supabase
    .from('admin_checklist_items')
    .select(ADMIN_CHECKLIST_ITEM_FIELDS)
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true })
    .limit(100);

  if (error) throw error;
  return data as AdminChecklistItemRow[];
}

export async function listUserTrustSignalsForAdmin() {
  const { data, error } = await supabase
    .from('user_trust_signals')
    .select(USER_TRUST_SIGNAL_FIELDS)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return data as UserTrustSignalRow[];
}

export async function listRewardReviewsForAdmin() {
  const { data, error } = await supabase
    .from('reward_reviews')
    .select(REWARD_REVIEW_FIELDS)
    .order('updated_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return data as RewardReviewRow[];
}

export async function listRecentPredictionsForAdmin() {
  const { data, error } = await supabase
    .from('predictions')
    .select(ADMIN_PREDICTION_FIELDS)
    .order('updated_at', { ascending: false })
    .limit(5);

  if (error) throw error;
  return data as AdminPredictionRow[];
}
