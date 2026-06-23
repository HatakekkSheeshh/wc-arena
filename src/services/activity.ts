import { supabase } from '../lib/supabaseClient';
import type { Database } from '../types/supabase';

export type ActivityEventRow = Database['public']['Tables']['activity_events']['Row'];

const ACTIVITY_EVENT_FIELDS = 'id, type, title, description, created_at, user_id, match_id, prediction_id, badge_id, league_id, href';

export async function listCurrentUserActivity() {
  const { data, error } = await supabase
    .from('activity_events')
    .select(ACTIVITY_EVENT_FIELDS)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data as ActivityEventRow[];
}

export async function listLeagueActivity(leagueId: string) {
  const { data, error } = await supabase
    .from('activity_events')
    .select(ACTIVITY_EVENT_FIELDS)
    .eq('league_id', leagueId)
    .order('created_at', { ascending: false })
    .limit(6);

  if (error) throw error;
  return data as ActivityEventRow[];
}
