import { supabase } from '../lib/supabaseClient';
import type { Database } from '../types/supabase';

export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Partial<Pick<ProfileRow, 'username' | 'country_code' | 'fan_club_team_id' | 'avatar_url'>>;

export async function getCurrentProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

export async function createCurrentProfile(values: ProfileInsert) {
  const { data, error } = await supabase
    .from('profiles')
    .insert(values)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function ensureCurrentProfile(userId: string, email: string | null | undefined, username?: string) {
  const { data: existing, error: lookupError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (lookupError) throw lookupError;
  if (existing) return existing;

  const fallbackUsername = username?.trim() || email?.split('@')[0] || `player-${userId.slice(0, 8)}`;
  return createCurrentProfile({
    id: userId,
    username: fallbackUsername,
    email: email ?? null,
    role: 'user',
  });
}

export async function updateCurrentProfile(userId: string, values: ProfileUpdate) {
  const { data, error } = await supabase
    .from('profiles')
    .update(values)
    .eq('id', userId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function getCurrentUserRole(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data.role;
}
