alter table public.predictions
  add column if not exists predicted_outcome text;

update public.predictions
set predicted_outcome = case
  when home_score > away_score then 'home'
  when home_score < away_score then 'away'
  else 'draw'
end
where predicted_outcome is null;

alter table public.predictions
  alter column predicted_outcome set not null;

alter table public.predictions
  drop constraint if exists predictions_predicted_outcome_check;

alter table public.predictions
  add constraint predictions_predicted_outcome_check
  check (predicted_outcome in ('home', 'draw', 'away'));

alter table public.matches
  add column if not exists espn_display_clock text,
  add column if not exists espn_state text,
  add column if not exists espn_play_by_play_available boolean,
  add column if not exists espn_attendance integer,
  add column if not exists espn_home_winner boolean,
  add column if not exists espn_away_winner boolean,
  add column if not exists espn_home_logo text,
  add column if not exists espn_away_logo text,
  add column if not exists espn_home_color text,
  add column if not exists espn_away_color text,
  add column if not exists espn_home_record text,
  add column if not exists espn_away_record text,
  add column if not exists espn_home_win_pct integer,
  add column if not exists espn_draw_pct integer,
  add column if not exists espn_away_win_pct integer,
  add column if not exists espn_prediction_updated_at timestamptz,
  add column if not exists espn_summary jsonb,
  add column if not exists espn_summary_updated_at timestamptz;

alter table public.matches
  drop constraint if exists matches_espn_prediction_pct_check;

alter table public.matches
  add constraint matches_espn_prediction_pct_check
  check (
    (espn_home_win_pct is null and espn_draw_pct is null and espn_away_win_pct is null)
    or (
      espn_home_win_pct between 0 and 100
      and espn_draw_pct between 0 and 100
      and espn_away_win_pct between 0 and 100
      and espn_home_win_pct + espn_draw_pct + espn_away_win_pct between 99 and 101
    )
  );

create or replace function public.get_match_prediction_outcome_summary(target_match_id text)
returns table (
  match_id text,
  total_predictions integer,
  home_predictions integer,
  draw_predictions integer,
  away_predictions integer
)
language sql
security definer
set search_path = public
as $$
  select
    p.match_id,
    count(*)::integer as total_predictions,
    count(*) filter (where p.predicted_outcome = 'home')::integer as home_predictions,
    count(*) filter (where p.predicted_outcome = 'draw')::integer as draw_predictions,
    count(*) filter (where p.predicted_outcome = 'away')::integer as away_predictions
  from public.predictions p
  where p.match_id = target_match_id
    and p.status in ('submitted', 'locked', 'scored')
  group by p.match_id;
$$;

revoke all on function public.get_match_prediction_outcome_summary(text) from public;
grant execute on function public.get_match_prediction_outcome_summary(text) to anon, authenticated;
