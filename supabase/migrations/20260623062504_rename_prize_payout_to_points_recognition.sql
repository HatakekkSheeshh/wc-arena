alter table public.league_events
  add column if not exists recognition_pool integer,
  add column if not exists point_split_curve text,
  add column if not exists point_split_config jsonb;

update public.league_events
set
  recognition_pool = coalesce(recognition_pool, prize_pool, 0),
  point_split_curve = coalesce(point_split_curve, payout_curve, 'balanced_top3'),
  point_split_config = coalesce(point_split_config, payout_config, '{"rankShares":[50,30,20]}'::jsonb)
where recognition_pool is null
   or point_split_curve is null
   or point_split_config is null;

alter table public.league_events
  alter column recognition_pool set default 0,
  alter column point_split_curve set default 'balanced_top3',
  alter column point_split_config set default '{"rankShares":[50,30,20]}'::jsonb;

alter table public.league_events
  alter column recognition_pool set not null,
  alter column point_split_curve set not null,
  alter column point_split_config set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'league_events_recognition_pool_check'
      and conrelid = 'public.league_events'::regclass
  ) then
    alter table public.league_events
      add constraint league_events_recognition_pool_check check (recognition_pool >= 0) not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'league_events_point_split_curve_check'
      and conrelid = 'public.league_events'::regclass
  ) then
    alter table public.league_events
      add constraint league_events_point_split_curve_check check (
        point_split_curve in ('balanced_top3', 'winner_take_all', 'flat_top3', 'custom_top3')
      ) not valid;
  end if;
end $$;

alter table public.league_events validate constraint league_events_recognition_pool_check;
alter table public.league_events validate constraint league_events_point_split_curve_check;

alter table public.league_event_leaderboard_entries
  add column if not exists point_split integer,
  add column if not exists point_split_factor numeric;

update public.league_event_leaderboard_entries
set
  point_split = coalesce(point_split, payout, 0),
  point_split_factor = coalesce(point_split_factor, payout_factor, 1)
where point_split is null
   or point_split_factor is null;

alter table public.league_event_leaderboard_entries
  alter column point_split set default 0,
  alter column point_split_factor set default 1;

alter table public.league_event_leaderboard_entries
  alter column point_split set not null,
  alter column point_split_factor set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'league_event_leaderboard_point_split_check'
      and conrelid = 'public.league_event_leaderboard_entries'::regclass
  ) then
    alter table public.league_event_leaderboard_entries
      add constraint league_event_leaderboard_point_split_check check (point_split >= 0) not valid;
  end if;
end $$;

alter table public.league_event_leaderboard_entries validate constraint league_event_leaderboard_point_split_check;

alter table public.point_transactions drop constraint if exists point_transactions_type_check;

alter table public.point_transactions
  add constraint point_transactions_type_check check (type in ('initial', 'stake', 'payout', 'point_split', 'refund'));

drop index if exists public.point_transactions_event_payout_refund_once_idx;

create unique index if not exists point_transactions_event_split_refund_once_idx
on public.point_transactions(user_id, event_id, type)
where type in ('payout', 'point_split', 'refund') and event_id is not null;
