import { supabase } from '../lib/supabaseClient';
import type { Database } from '../types/supabase';
import { cached } from './cache';

export type PlayerTournamentStatRow = Database['public']['Tables']['espn_player_tournament_stats']['Row'];

export type StatisticsCoverage = {
  normalizedMatches: number;
};

export const PLAYER_TOURNAMENT_STAT_FIELDS = 'player_id, player_name, team_id, goals, assists, yellow_cards, latest_match_id, latest_clock, updated_at';
export const TOP_SCORER_FIELDS = PLAYER_TOURNAMENT_STAT_FIELDS;
export const GOAL_CONTRIBUTION_FETCH_LIMIT = 50;

const MATCH_COVERAGE_FIELDS = 'id, espn_stats_normalized_at';

export async function listTopScorers(limit = 10) {
  return cached(`statistics:top-scorers:${limit}`, 300_000, async () => {
    const { data, error } = await supabase
      .from('espn_player_tournament_stats')
      .select(TOP_SCORER_FIELDS)
      .gt('goals', 0)
      .order('goals', { ascending: false })
      .order('assists', { ascending: false })
      .order('player_name', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data;
  });
}

export async function listTopAssists(limit = 10) {
  return cached(`statistics:top-assists:${limit}`, 300_000, async () => {
    const { data, error } = await supabase
      .from('espn_player_tournament_stats')
      .select(PLAYER_TOURNAMENT_STAT_FIELDS)
      .gt('assists', 0)
      .order('assists', { ascending: false })
      .order('goals', { ascending: false })
      .order('player_name', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data;
  });
}

export async function listTopGoalContributions(limit = 10) {
  return cached(`statistics:top-goal-contributions:${limit}`, 300_000, async () => {
    const { data, error } = await supabase
      .from('espn_player_tournament_stats')
      .select(PLAYER_TOURNAMENT_STAT_FIELDS)
      .order('goals', { ascending: false })
      .order('assists', { ascending: false })
      .order('player_name', { ascending: true })
      .limit(GOAL_CONTRIBUTION_FETCH_LIMIT);

    if (error) throw error;
    return [...data]
      .sort((first, second) => (second.goals + second.assists) - (first.goals + first.assists) || second.goals - first.goals || first.player_name.localeCompare(second.player_name))
      .slice(0, limit);
  });
}

export async function listTopYellowCards(limit = 10) {
  return cached(`statistics:top-yellow-cards:${limit}`, 300_000, async () => {
    const { data, error } = await supabase
      .from('espn_player_tournament_stats')
      .select(PLAYER_TOURNAMENT_STAT_FIELDS)
      .gt('yellow_cards', 0)
      .order('yellow_cards', { ascending: false })
      .order('player_name', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data;
  });
}

export async function getStatisticsCoverage(): Promise<StatisticsCoverage> {
  return cached('statistics:coverage', 300_000, async () => {
    const { data, error } = await supabase
      .from('matches')
      .select(MATCH_COVERAGE_FIELDS)
      .like('id', 'wc2026-%')
      .not('espn_stats_normalized_at', 'is', null)
      .limit(128);

    if (error) throw error;
    return { normalizedMatches: data.length };
  });
}
