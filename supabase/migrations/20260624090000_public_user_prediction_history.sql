create or replace function public.get_public_user_prediction_history(target_user_id uuid, row_limit integer default 64)
returns table (
  profile_id uuid,
  profile_username text,
  profile_display_name text,
  profile_avatar_url text,
  profile_country_code text,
  profile_fan_club_team_id text,
  profile_points integer,
  profile_rank integer,
  profile_accuracy numeric,
  profile_exact_scores integer,
  profile_current_streak integer,
  profile_best_streak integer,
  profile_created_at timestamptz,
  prediction_id uuid,
  prediction_match_id text,
  prediction_type text,
  prediction_home_score integer,
  prediction_away_score integer,
  prediction_predicted_outcome text,
  prediction_confidence integer,
  prediction_is_risk_pick boolean,
  prediction_created_at timestamptz,
  prediction_updated_at timestamptz,
  prediction_locked_at timestamptz,
  prediction_status text,
  prediction_revision integer,
  match_home_team_id text,
  match_away_team_id text,
  match_kickoff_at timestamptz,
  match_lock_at timestamptz,
  match_status text,
  match_stage text,
  match_group_code text,
  match_matchday integer,
  match_stadium text,
  match_city text,
  match_home_score integer,
  match_away_score integer,
  match_result_updated_at timestamptz,
  match_espn_state text,
  match_espn_status text,
  match_espn_status_detail text,
  match_espn_display_clock text,
  score_exact_score integer,
  score_correct_outcome integer,
  score_goal_difference_bonus integer,
  score_team_score_bonus integer,
  score_streak_bonus integer,
  score_risk_multiplier numeric,
  score_underdog_bonus integer,
  score_total integer,
  score_outcome text,
  score_scoring_version text,
  score_calculated_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    profile.id as profile_id,
    profile.username as profile_username,
    profile.display_name as profile_display_name,
    profile.avatar_url as profile_avatar_url,
    profile.country_code as profile_country_code,
    profile.fan_club_team_id as profile_fan_club_team_id,
    profile.points as profile_points,
    profile.rank as profile_rank,
    profile.accuracy as profile_accuracy,
    profile.exact_scores as profile_exact_scores,
    profile.current_streak as profile_current_streak,
    profile.best_streak as profile_best_streak,
    profile.created_at as profile_created_at,
    p.id as prediction_id,
    p.match_id as prediction_match_id,
    p.prediction_type,
    p.home_score as prediction_home_score,
    p.away_score as prediction_away_score,
    p.predicted_outcome as prediction_predicted_outcome,
    p.confidence as prediction_confidence,
    p.is_risk_pick as prediction_is_risk_pick,
    p.created_at as prediction_created_at,
    p.updated_at as prediction_updated_at,
    p.locked_at as prediction_locked_at,
    p.status as prediction_status,
    p.revision as prediction_revision,
    m.home_team_id as match_home_team_id,
    m.away_team_id as match_away_team_id,
    m.kickoff_at as match_kickoff_at,
    m.lock_at as match_lock_at,
    m.status as match_status,
    m.stage as match_stage,
    m.group_code as match_group_code,
    m.matchday as match_matchday,
    m.stadium as match_stadium,
    m.city as match_city,
    m.home_score as match_home_score,
    m.away_score as match_away_score,
    m.result_updated_at as match_result_updated_at,
    m.espn_state as match_espn_state,
    m.espn_status as match_espn_status,
    m.espn_status_detail as match_espn_status_detail,
    m.espn_display_clock as match_espn_display_clock,
    ps.exact_score as score_exact_score,
    ps.correct_outcome as score_correct_outcome,
    ps.goal_difference_bonus as score_goal_difference_bonus,
    ps.team_score_bonus as score_team_score_bonus,
    ps.streak_bonus as score_streak_bonus,
    ps.risk_multiplier as score_risk_multiplier,
    ps.underdog_bonus as score_underdog_bonus,
    ps.total as score_total,
    ps.outcome as score_outcome,
    ps.scoring_version as score_scoring_version,
    ps.calculated_at as score_calculated_at
  from public.profiles profile
  join public.predictions p on p.user_id = profile.id
  join public.matches m on m.id = p.match_id
  join public.prediction_scores ps on ps.prediction_id = p.id
  where profile.id = target_user_id
    and p.user_id = target_user_id
    and m.status = 'finished'
    and m.home_score is not null
    and m.away_score is not null
    and ps.calculated_at is not null
  order by m.kickoff_at desc, p.created_at desc
  limit least(greatest(row_limit, 1), 128);
$$;

revoke all on function public.get_public_user_prediction_history(uuid, integer) from public;
grant execute on function public.get_public_user_prediction_history(uuid, integer) to anon, authenticated;
