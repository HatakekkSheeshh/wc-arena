import { supabase } from '../lib/supabaseClient';
import type { Database } from '../types/supabase';

export type BadgeRow = Database['public']['Tables']['badges']['Row'];
export type UserBadgeRow = Database['public']['Tables']['user_badges']['Row'];
export type UserBadgeWithBadge = UserBadgeRow & {
  badges: BadgeRow | null;
};

export async function listBadgeCatalog() {
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .order('category');

  if (error) throw error;
  return data as BadgeRow[];
}

export async function listCurrentUserBadges() {
  const { data, error } = await supabase
    .from('user_badges')
    .select('*, badges(*)')
    .order('unlocked_at', { ascending: false, nullsFirst: false });

  if (error) throw error;
  return data as UserBadgeWithBadge[];
}
