import { supabase } from '../lib/supabaseClient';
import type { Database } from '../types/supabase';

export type TeamRow = Database['public']['Tables']['teams']['Row'];

export async function listTeams() {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
}

export async function getTeamMap() {
  const teams = await listTeams();
  return new Map(teams.map((team) => [team.id, team]));
}
