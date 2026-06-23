import { supabase } from '../lib/supabaseClient';
import type { Database } from '../types/supabase';

export type BadgeRow = Database['public']['Tables']['badges']['Row'];
export type UserBadgeRow = Database['public']['Tables']['user_badges']['Row'];
export type UserBadgeWithBadge = UserBadgeRow & {
  badges: BadgeRow | null;
};

const BADGE_FIELDS = 'id, name, description, category, rarity, icon_path, progress_target';
const USER_BADGE_FIELDS = `badge_id, user_id, unlocked_at, progress_current, badges(${BADGE_FIELDS})`;

export async function listBadgeCatalog() {
  const { data, error } = await supabase
    .from('badges')
    .select(BADGE_FIELDS)
    .order('category')
    .limit(100);

  if (error) throw error;
  return data as BadgeRow[];
}

export async function listCurrentUserBadges() {
  const { data, error } = await supabase
    .from('user_badges')
    .select(USER_BADGE_FIELDS)
    .order('unlocked_at', { ascending: false, nullsFirst: false })
    .limit(100);

  if (error) throw error;
  return data as UserBadgeWithBadge[];
}
