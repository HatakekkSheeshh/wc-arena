create table if not exists public.point_wallets (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.league_events (
  id text primary key,
  league_id text not null references public.leagues(id) on delete cascade,
  event_type text not null check (event_type in ('weekly', 'matchday')),
  name text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  matchday integer,
  status text not null default 'open' check (status in ('open', 'locked', 'settled')),
  min_stake integer not null default 1 check (min_stake > 0),
  max_stake integer not null default 100 check (max_stake >= min_stake),
  prize_pool integer not null default 0 check (prize_pool >= 0),
  settled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (event_type <> 'matchday' or matchday is not null)
);

create table if not exists public.league_event_entries (
  event_id text not null references public.league_events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  stake integer not null check (stake > 0),
  entered_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create table if not exists public.point_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  league_id text references public.leagues(id) on delete set null,
  event_id text references public.league_events(id) on delete set null,
  type text not null check (type in ('initial', 'stake', 'payout', 'refund')),
  amount integer not null,
  balance_after integer not null check (balance_after >= 0),
  description text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.league_event_leaderboard_entries (
  event_id text not null references public.league_events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rank integer not null,
  previous_rank integer,
  points integer not null default 0,
  exact_scores integer not null default 0,
  accuracy integer not null default 0,
  stake integer not null default 0,
  payout integer not null default 0,
  payout_factor numeric not null default 1,
  updated_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create index if not exists league_events_league_status_starts_idx on public.league_events(league_id, status, starts_at desc);
create index if not exists league_events_window_idx on public.league_events(starts_at, ends_at);
create index if not exists league_events_matchday_idx on public.league_events(league_id, matchday) where event_type = 'matchday';
create index if not exists league_event_entries_user_idx on public.league_event_entries(user_id, entered_at desc);
create index if not exists league_event_leaderboard_rank_idx on public.league_event_leaderboard_entries(event_id, rank);
create index if not exists point_transactions_user_created_idx on public.point_transactions(user_id, created_at desc);

grant select on public.point_wallets to authenticated;
grant select on public.point_transactions to authenticated;
grant select on public.league_events to anon, authenticated;
grant select on public.league_event_entries to authenticated;
grant select on public.league_event_leaderboard_entries to anon, authenticated;

alter table public.point_wallets enable row level security;
alter table public.point_transactions enable row level security;
alter table public.league_events enable row level security;
alter table public.league_event_entries enable row level security;
alter table public.league_event_leaderboard_entries enable row level security;

drop policy if exists point_wallets_read_own on public.point_wallets;
create policy point_wallets_read_own on public.point_wallets for select to authenticated using (
  user_id = (select auth.uid())
);

drop policy if exists point_transactions_read_own on public.point_transactions;
create policy point_transactions_read_own on public.point_transactions for select to authenticated using (
  user_id = (select auth.uid())
);

drop policy if exists league_events_read_visible on public.league_events;
create policy league_events_read_visible on public.league_events for select to anon, authenticated using (
  private.league_is_public(league_events.league_id)
  or (
    (select auth.uid()) is not null
    and private.current_user_is_league_member(league_events.league_id)
  )
);

drop policy if exists league_event_entries_read_visible on public.league_event_entries;
create policy league_event_entries_read_visible on public.league_event_entries for select to authenticated using (
  user_id = (select auth.uid())
  or exists (
    select 1
    from public.league_events le
    where le.id = league_event_entries.event_id
    and private.current_user_is_league_member(le.league_id)
  )
);

drop policy if exists league_event_leaderboard_read_visible on public.league_event_leaderboard_entries;
create policy league_event_leaderboard_read_visible on public.league_event_leaderboard_entries for select to anon, authenticated using (
  exists (
    select 1
    from public.league_events le
    where le.id = league_event_leaderboard_entries.event_id
    and (
      private.league_is_public(le.league_id)
      or (
        (select auth.uid()) is not null
        and private.current_user_is_league_member(le.league_id)
      )
    )
  )
);

insert into public.league_events (id, league_id, event_type, name, starts_at, ends_at, matchday, min_stake, max_stake)
select
  'event-' || l.id || '-weekly-1',
  l.id,
  'weekly',
  'Weekly #1',
  date_trunc('week', now()),
  date_trunc('week', now()) + interval '7 days',
  null,
  1,
  100
from public.leagues l
where not exists (
  select 1 from public.league_events le where le.league_id = l.id and le.event_type = 'weekly'
);

insert into public.league_events (id, league_id, event_type, name, starts_at, ends_at, matchday, min_stake, max_stake)
select
  'event-' || l.id || '-matchday-' || md.matchday,
  l.id,
  'matchday',
  'Matchday ' || md.matchday,
  md.starts_at,
  md.ends_at,
  md.matchday,
  1,
  100
from public.leagues l
cross join (
  select
    matchday,
    min(kickoff_at) as starts_at,
    max(kickoff_at) + interval '1 day' as ends_at
  from public.matches
  where matchday is not null
  group by matchday
  order by matchday
  limit 1
) md
where not exists (
  select 1 from public.league_events le where le.league_id = l.id and le.event_type = 'matchday'
);
