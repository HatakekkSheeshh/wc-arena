import { supabase } from '../lib/supabaseClient';
import type { Database } from '../types/supabase';
import { cached } from './cache';

export type MatchRow = Database['public']['Tables']['matches']['Row'];
export type EffectiveMatchStatus = MatchRow['status'];

const MATCH_SUMMARY_FIELDS = `
  id,
  home_team_id,
  away_team_id,
  kickoff_at,
  lock_at,
  status,
  stage,
  group_code,
  matchday,
  stadium,
  city,
  home_score,
  away_score,
  result_updated_at,
  espn_event_id,
  espn_competition_id,
  espn_state,
  espn_status,
  espn_status_detail,
  espn_display_clock,
  espn_home_win_pct,
  espn_draw_pct,
  espn_away_win_pct,
  espn_prediction_updated_at,
  espn_home_logo,
  espn_away_logo,
  espn_home_record,
  espn_away_record,
  espn_home_color,
  espn_away_color,
  espn_home_winner,
  espn_away_winner,
  espn_attendance,
  espn_play_by_play_available,
  espn_summary_updated_at,
  espn_updated_at
`;

const MATCH_DETAIL_FIELDS = `
  ${MATCH_SUMMARY_FIELDS},
  espn_summary
`;

export function getEffectiveMatchStatus(match: MatchRow, now = new Date()): EffectiveMatchStatus {
  if (['finished', 'live', 'postponed', 'cancelled'].includes(match.status)) return match.status;
  if (new Date(match.lock_at) <= now) return 'locked';
  return match.status;
}

export function isMatchPredictionOpen(match: MatchRow, now = new Date()) {
  return getEffectiveMatchStatus(match, now) === 'open';
}

export async function listMatches() {
  return cached('matches:list', 300_000, async () => {
    const { data, error } = await supabase
      .from('matches')
      .select(MATCH_SUMMARY_FIELDS)
      .like('id', 'wc2026-%')
      .order('kickoff_at', { ascending: true })
      .limit(128);

    if (error) throw error;
    return data;
  });
}

export async function getMatch(matchId: string) {
  return cached(`matches:detail:${matchId}`, 60_000, async () => {
    const query = supabase
      .from('matches')
      .select(MATCH_DETAIL_FIELDS)
      .eq('id', matchId);

    const { data, error } = await query.single();

    if (error) throw error;
    return data;
  });
}
