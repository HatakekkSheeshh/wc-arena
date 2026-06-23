import { supabase } from '../lib/supabaseClient';
import type { Database } from '../types/supabase';
import { cached } from './cache';

export type TeamRow = Database['public']['Tables']['teams']['Row'];

const TEAM_FIELDS = 'id, name, short_name, country_code, fifa_rank, group_code';

export async function listTeams() {
  return cached('teams:list', 86_400_000, async () => {
    const { data, error } = await supabase
      .from('teams')
      .select(TEAM_FIELDS)
      .order('name')
      .limit(256);

    if (error) throw error;
    return data;
  });
}

export async function getTeamMap() {
  const teams = await listTeams();
  return new Map(teams.map((team) => [team.id, team]));
}
