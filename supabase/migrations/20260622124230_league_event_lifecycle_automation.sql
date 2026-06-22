alter table public.league_events
  drop constraint if exists league_events_event_type_check,
  drop constraint if exists league_events_status_check;

alter table public.league_events
  add column if not exists payout_curve text not null default 'balanced_top3',
  add column if not exists payout_config jsonb not null default '{"rankShares":[50,30,20]}'::jsonb,
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_by uuid references public.profiles(id) on delete set null,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.league_events
  add constraint league_events_event_type_check check (event_type in ('weekly', 'matchday', 'custom')),
  add constraint league_events_status_check check (status in ('open', 'locked', 'settled', 'cancelled')),
  add constraint league_events_payout_curve_check check (payout_curve in ('balanced_top3', 'winner_take_all', 'flat_top3', 'custom_top3'));

create index if not exists league_events_lifecycle_idx
  on public.league_events(status, starts_at, ends_at);

create unique index if not exists league_events_weekly_once_idx
  on public.league_events(league_id, starts_at)
  where event_type = 'weekly';

create unique index if not exists league_events_matchday_once_idx
  on public.league_events(league_id, matchday)
  where event_type = 'matchday';

create unique index if not exists point_transactions_event_payout_refund_once_idx
  on public.point_transactions(user_id, event_id, type)
  where type in ('payout', 'refund') and event_id is not null;
