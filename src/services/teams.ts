import { supabase } from '../lib/supabaseClient';
import type { Database } from '../types/supabase';

export type TeamRow = Database['public']['Tables']['teams']['Row'];

const TEAM_FIELDS = 'id, name, short_name, country_code, fifa_rank, group_code';

export async function listTeams() {
  const { data, error } = await supabase
    .from('teams')
    .select(TEAM_FIELDS)
    .order('name')
    .limit(64);

  if (error) throw error;
  return data;
}

export async function getTeamMap() {
  const teams = await listTeams();
  return new Map(teams.map((team) => [team.id, team]));
}
