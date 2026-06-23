import { supabase } from '../lib/supabaseClient';
import type { Database } from '../types/supabase';

export type LeagueRow = Database['public']['Tables']['leagues']['Row'];
export type LeagueJoinRequestRow = Database['public']['Tables']['league_join_requests']['Row'] & {
  profiles: Pick<Database['public']['Tables']['profiles']['Row'], 'username' | 'display_name' | 'points'> | null;
};
export type LeagueMemberRow = Database['public']['Tables']['league_members']['Row'] & {
  profiles: Pick<Database['public']['Tables']['profiles']['Row'], 'username' | 'display_name' | 'points'> | null;
  leagues: LeagueRow | null;
};

export type CreateLeagueInput = {
  name: string;
  description: string;
  visibility: 'public' | 'private';
  joinPolicy: 'auto' | 'approval';
};

async function invokeLeagueAction<T>(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke<T>('manage_league', { body });
  if (error) throw error;
  return data as T;
}

export async function listLeagues() {
  const { data, error } = await supabase
    .from('leagues')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

export async function listLeagueMemberCounts(leagueIds: string[]) {
  if (leagueIds.length === 0) return new Map<string, number>();

  const { data, error } = await supabase
    .from('leagues')
    .select('id, member_count')
    .in('id', leagueIds);

  if (error) throw error;

  return new Map(data.map((league) => [league.id, league.member_count]));
}

export async function getLeagueMemberCount(leagueId: string) {
  const { data, error } = await supabase
    .from('leagues')
    .select('member_count')
    .eq('id', leagueId)
    .single();

  if (error) throw error;
  return data.member_count;
}

export async function getLeague(identifier: string) {
  const byId = await supabase
    .from('leagues')
    .select('*')
    .eq('id', identifier)
    .maybeSingle();

  if (byId.error) throw byId.error;
  if (byId.data) return byId.data;

  const { data, error } = await supabase
    .from('leagues')
    .select('*')
    .eq('slug', identifier)
    .single();

  if (error) throw error;
  return data;
}

export async function listCurrentUserLeagueMemberships() {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) return [];

  const { data, error } = await supabase
    .from('league_members')
    .select('*, leagues(*)')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false });

  if (error) throw error;
  return (data as LeagueMemberRow[]).filter((membership) => membership.leagues?.status !== 'archived');
}

export async function listLeagueMembers(leagueId: string) {
  const { data, error } = await supabase
    .from('league_members')
    .select('*, profiles:user_id(username, display_name, points), leagues(*)')
    .eq('league_id', leagueId)
    .order('joined_at', { ascending: true });

  if (error) throw error;
  return data as LeagueMemberRow[];
}

export async function listLeagueJoinRequests(leagueId: string) {
  const { data, error } = await supabase
    .from('league_join_requests')
    .select('*, profiles!league_join_requests_user_id_fkey(username, display_name, points)')
    .eq('league_id', leagueId)
    .eq('status', 'pending')
    .order('requested_at', { ascending: true });

  if (error) throw error;
  return data as LeagueJoinRequestRow[];
}

export function createLeague(input: CreateLeagueInput) {
  return invokeLeagueAction<{ league: LeagueRow }>({ action: 'createLeague', ...input });
}

export function joinLeague(input: { leagueId?: string; inviteCode?: string }) {
  return invokeLeagueAction<{ league: LeagueRow; status: 'joined' | 'pending'; membership?: Database['public']['Tables']['league_members']['Row']; request?: Database['public']['Tables']['league_join_requests']['Row'] }>({ action: 'joinLeague', ...input });
}

export function approveJoinRequest(input: { leagueId: string; requestUserId: string }) {
  return invokeLeagueAction<{ status: 'approved'; request: Database['public']['Tables']['league_join_requests']['Row'] }>({ action: 'approveJoinRequest', ...input });
}

export function rejectJoinRequest(input: { leagueId: string; requestUserId: string }) {
  return invokeLeagueAction<{ status: 'rejected'; request: Database['public']['Tables']['league_join_requests']['Row'] }>({ action: 'rejectJoinRequest', ...input });
}

export function updateLeague(input: { leagueId: string; name: string; description: string }) {
  return invokeLeagueAction<{ league: LeagueRow }>({ action: 'updateLeague', ...input });
}

export function kickLeagueMember(input: { leagueId: string; userId: string }) {
  return invokeLeagueAction<{ status: 'removed' }>({ action: 'kickLeagueMember', ...input });
}

export function archiveLeague(input: { leagueId: string; archiveReason?: string }) {
  return invokeLeagueAction<{ league: LeagueRow; status: 'archived'; cancelledEvents: number; refunds: number }>({ action: 'archiveLeague', ...input });
}

export function deleteArchivedLeague(input: { leagueId: string }) {
  return invokeLeagueAction<{ status: 'deleted'; leagueId: string }>({ action: 'deleteArchivedLeague', ...input });
}
