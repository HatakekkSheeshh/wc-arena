import { supabase } from '../lib/supabaseClient';
import type { Database } from '../types/supabase';

export type AdminAuditLogRow = Database['public']['Tables']['admin_audit_logs']['Row'];

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
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as AdminAuditLogRow[];
}
