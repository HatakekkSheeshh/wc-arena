import { supabase } from '../lib/supabaseClient';
import type { Database } from '../types/supabase';

export type PointSplitCurve = 'balanced_top3' | 'winner_take_all' | 'flat_top3' | 'custom_top3';
export type LeagueEventRow = Database['public']['Tables']['league_events']['Row'];
export type LeagueEventLeaderboardEntryRow = Database['public']['Tables']['league_event_leaderboard_entries']['Row'];
export type LeagueEventProfile = Pick<Database['public']['Tables']['profiles']['Row'], 'username' | 'display_name' | 'avatar_url' | 'country_code'>;
export type LeagueEventLeaderboardEntryWithProfile = LeagueEventLeaderboardEntryRow & {
  profiles: LeagueEventProfile | null;
};
export type LeagueEventMatchRow = Database['public']['Tables']['league_event_matches']['Row'];
export type CreateLeagueEventInput = {
  leagueId: string;
  name: string;
  startsAt: string;
  endsAt: string;
  minStake: number;
  maxStake: number;
  pointSplitCurve: PointSplitCurve;
  rankShares?: number[];
  matchIds?: string[];
};

const LEAGUE_EVENT_FIELDS = 'id, league_id, event_type, name, starts_at, ends_at, min_stake, max_stake, recognition_pool, prize_pool, point_split_curve, payout_curve, point_split_config, payout_config, matchday, status, settled_at, cancelled_at, cancelled_by, metadata, created_at, updated_at';
const LEAGUE_EVENT_LEADERBOARD_FIELDS = 'event_id, user_id, rank, previous_rank, points, exact_scores, accuracy, stake, point_split, point_split_factor, payout, payout_factor, updated_at, profiles:user_id(username, display_name, avatar_url, country_code)';
const LEAGUE_EVENT_MATCH_FIELDS = 'event_id, match_id, created_at';

async function invokeLeagueAction<T>(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke<T>('manage_league', { body });
  if (error) throw error;
  return data as T;
}

function isDisplayableLeagueEvent(event: LeagueEventRow) {
  const hasEnded = new Date(event.ends_at).getTime() <= Date.now();
  const isLegacyWeekly = event.event_type === 'weekly' && (event.id.endsWith('-weekly-1') || event.name === 'Weekly #1');
  const isExpiredGeneratedMatchday = event.event_type === 'matchday' && hasEnded;

  return !isLegacyWeekly && !isExpiredGeneratedMatchday;
}

export async function listLeagueEvents(leagueId: string) {
  const { data, error } = await supabase
    .from('league_events')
    .select(LEAGUE_EVENT_FIELDS)
    .eq('league_id', leagueId)
    .order('starts_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return ((data ?? []) as LeagueEventRow[]).filter(isDisplayableLeagueEvent);
}

export async function listLeagueEventLeaderboard(eventId: string) {
  const { data, error } = await supabase
    .from('league_event_leaderboard_entries')
    .select(LEAGUE_EVENT_LEADERBOARD_FIELDS)
    .eq('event_id', eventId)
    .order('rank', { ascending: true })
    .limit(100);

  if (error) throw error;
  return data as LeagueEventLeaderboardEntryWithProfile[];
}

export async function listLeagueEventMatches(eventIds: string[]) {
  if (eventIds.length === 0) return [];
  const { data, error } = await supabase
    .from('league_event_matches')
    .select(LEAGUE_EVENT_MATCH_FIELDS)
    .in('event_id', eventIds)
    .limit(500);

  if (error) throw error;
  return data as LeagueEventMatchRow[];
}

export function createLeagueEvent(input: CreateLeagueEventInput) {
  return invokeLeagueAction<{ status: 'created'; event: LeagueEventRow }>({ action: 'createLeagueEvent', eventType: 'custom', ...input, payoutCurve: input.pointSplitCurve });
}

export function enterLeagueEvent(input: { eventId: string; stake: number }) {
  return invokeLeagueAction<{ status: 'entered'; points: number }>({ action: 'enterLeagueEvent', ...input });
}

export function settleLeagueEvent(input: { eventId: string }) {
  return invokeLeagueAction<{ status: 'settled'; leagueEventLeaderboardEntries: number; pointSplits: number; payouts: number; points: number }>({ action: 'settleLeagueEvent', ...input });
}

export function cancelLeagueEvent(input: { eventId: string }) {
  return invokeLeagueAction<{ status: 'cancelled'; leagueEventLeaderboardEntries: number; refunds: number }>({ action: 'cancelLeagueEvent', ...input });
}
