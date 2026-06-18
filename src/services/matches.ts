import { supabase } from '../lib/supabaseClient';
import type { Database } from '../types/supabase';

export type MatchRow = Database['public']['Tables']['matches']['Row'];

export async function listMatches() {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .like('id', 'wc2026-%')
    .order('kickoff_at', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getMatch(matchId: string) {
  const query = supabase
    .from('matches')
    .select('*')
    .eq('id', matchId);

  const { data, error } = await query.single();

  if (error) throw error;
  return data;
}
