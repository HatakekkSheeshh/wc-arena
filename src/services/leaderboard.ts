import { supabase } from '../lib/supabaseClient';
import type { Database } from '../types/supabase';

export type LeaderboardEntryRow = Database['public']['Tables']['leaderboard_entries']['Row'];
export type LeaderboardProfile = Pick<Database['public']['Tables']['profiles']['Row'], 'username' | 'avatar_url' | 'country_code'>;
export type LeaderboardEntryWithProfile = LeaderboardEntryRow & {
  profiles: LeaderboardProfile | null;
};

export async function listGlobalLeaderboard() {
  const { data, error } = await supabase
    .from('leaderboard_entries')
    .select('*, profiles:user_id(username, avatar_url, country_code)')
    .eq('scope', 'global')
    .order('rank', { ascending: true });

  if (error) throw error;
  return data as LeaderboardEntryWithProfile[];
}

export async function listLeagueLeaderboard(leagueId: string) {
  const { data, error } = await supabase
    .from('leaderboard_entries')
    .select('*, profiles:user_id(username, avatar_url, country_code)')
    .eq('scope', 'league')
    .eq('league_id', leagueId)
    .order('rank', { ascending: true });

  if (error) throw error;
  return data as LeaderboardEntryWithProfile[];
}
