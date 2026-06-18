import { supabase } from '../lib/supabaseClient';
import type { Database } from '../types/supabase';

export type LeagueRow = Database['public']['Tables']['leagues']['Row'];

export async function listLeagues() {
  const { data, error } = await supabase
    .from('leagues')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getLeague(leagueId: string) {
  const { data, error } = await supabase
    .from('leagues')
    .select('*')
    .eq('id', leagueId)
    .single();

  if (error) throw error;
  return data;
}
