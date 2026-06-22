import { supabase } from '../lib/supabaseClient';
import type { Database } from '../types/supabase';

export type PayoutCurve = 'balanced_top3' | 'winner_take_all' | 'flat_top3' | 'custom_top3';
export type LeagueEventRow = Database['public']['Tables']['league_events']['Row'];
export type LeagueEventLeaderboardEntryRow = Database['public']['Tables']['league_event_leaderboard_entries']['Row'];
export type LeagueEventProfile = Pick<Database['public']['Tables']['profiles']['Row'], 'username' | 'display_name' | 'avatar_url' | 'country_code'>;
export type LeagueEventLeaderboardEntryWithProfile = LeagueEventLeaderboardEntryRow & {
  profiles: LeagueEventProfile | null;
};
export type CreateLeagueEventInput = {
  leagueId: string;
  name: string;
  startsAt: string;
  endsAt: string;
  minStake: number;
  maxStake: number;
  payoutCurve: PayoutCurve;
  rankShares?: number[];
};

async function invokeLeagueAction<T>(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke<T>('manage_league', { body });
  if (error) throw error;
  return data as T;
}

export async function listLeagueEvents(leagueId: string) {
  const { data, error } = await supabase
    .from('league_events')
    .select('*')
    .eq('league_id', leagueId)
    .order('starts_at', { ascending: false });

  if (error) throw error;
  return data as LeagueEventRow[];
}

export async function listLeagueEventLeaderboard(eventId: string) {
  const { data, error } = await supabase
    .from('league_event_leaderboard_entries')
    .select('*, profiles:user_id(username, display_name, avatar_url, country_code)')
    .eq('event_id', eventId)
    .order('rank', { ascending: true });

  if (error) throw error;
  return data as LeagueEventLeaderboardEntryWithProfile[];
}

export function createLeagueEvent(input: CreateLeagueEventInput) {
  return invokeLeagueAction<{ status: 'created'; event: LeagueEventRow }>({ action: 'createLeagueEvent', eventType: 'custom', ...input });
}

export function enterLeagueEvent(input: { eventId: string; stake: number }) {
  return invokeLeagueAction<{ status: 'entered'; points: number }>({ action: 'enterLeagueEvent', ...input });
}

export function settleLeagueEvent(input: { eventId: string }) {
  return invokeLeagueAction<{ status: 'settled'; leagueEventLeaderboardEntries: number; payouts: number }>({ action: 'settleLeagueEvent', ...input });
}

export function cancelLeagueEvent(input: { eventId: string }) {
  return invokeLeagueAction<{ status: 'cancelled'; leagueEventLeaderboardEntries: number; refunds: number }>({ action: 'cancelLeagueEvent', ...input });
}
