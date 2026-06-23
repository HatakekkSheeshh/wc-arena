import { supabase } from '../lib/supabaseClient';
import type { Database } from '../types/supabase';

export type LeaderboardEntryRow = Database['public']['Tables']['leaderboard_entries']['Row'];
export type LeaderboardProfile = Pick<Database['public']['Tables']['profiles']['Row'], 'username' | 'display_name' | 'avatar_url' | 'country_code'>;
export type LeaderboardEntryWithProfile = LeaderboardEntryRow & {
  profiles: LeaderboardProfile | null;
};

const LEADERBOARD_ENTRY_FIELDS = 'id, scope, league_id, user_id, rank, previous_rank, points, exact_scores, accuracy, streak, updated_at';
const LEADERBOARD_WITH_PROFILE_FIELDS = `${LEADERBOARD_ENTRY_FIELDS}, profiles:user_id(username, display_name, avatar_url, country_code)`;

export async function listGlobalLeaderboard() {
  const { data, error } = await supabase
    .from('leaderboard_entries')
    .select(LEADERBOARD_WITH_PROFILE_FIELDS)
    .eq('scope', 'global')
    .order('rank', { ascending: true })
    .limit(100);

  if (error) throw error;
  return data as LeaderboardEntryWithProfile[];
}

export async function listLeagueLeaderboard(leagueId: string) {
  const { data, error } = await supabase
    .from('leaderboard_entries')
    .select(LEADERBOARD_WITH_PROFILE_FIELDS)
    .eq('scope', 'league')
    .eq('league_id', leagueId)
    .order('rank', { ascending: true })
    .limit(100);

  if (error) throw error;
  return data as LeaderboardEntryWithProfile[];
}
