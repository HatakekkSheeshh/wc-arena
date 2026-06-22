alter table public.leagues
  add column if not exists status text not null default 'active',
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references public.profiles(id),
  add column if not exists archive_reason text;

alter table public.leagues
  drop constraint if exists leagues_status_check;

alter table public.leagues
  add constraint leagues_status_check check (status in ('active', 'archived'));

create index if not exists leagues_status_created_idx on public.leagues(status, created_at desc);

create table if not exists public.league_event_matches (
  event_id text not null references public.league_events(id) on delete cascade,
  match_id text not null references public.matches(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, match_id)
);

create index if not exists league_event_matches_match_idx on public.league_event_matches(match_id);

grant select on public.league_event_matches to anon, authenticated;

alter table public.league_event_matches enable row level security;

drop policy if exists league_event_matches_read_visible on public.league_event_matches;
create policy league_event_matches_read_visible on public.league_event_matches for select to anon, authenticated using (
  exists (
    select 1
    from public.league_events le
    where le.id = league_event_matches.event_id
    and (
      private.league_is_public(le.league_id)
      or (
        (select auth.uid()) is not null
        and private.current_user_is_league_member(le.league_id)
      )
    )
  )
);

drop policy if exists leagues_read on public.leagues;
create policy leagues_read on public.leagues for select to anon, authenticated using (
  visibility = 'public'
  or (
    (select auth.uid()) is not null
    and private.current_user_is_league_member(leagues.id)
  )
);
