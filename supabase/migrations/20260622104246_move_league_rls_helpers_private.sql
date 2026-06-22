create schema if not exists private;

create or replace function private.league_is_public(target_league_id text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.leagues
    where id = target_league_id
    and visibility = 'public'
  );
$$;

create or replace function private.current_user_is_league_member(target_league_id text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.league_members
    where league_id = target_league_id
    and user_id = (select auth.uid())
  );
$$;

create or replace function private.current_user_is_league_owner(target_league_id text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.league_members
    where league_id = target_league_id
    and user_id = (select auth.uid())
    and role = 'owner'
  );
$$;

revoke all on function private.league_is_public(text) from public, anon, authenticated;
revoke all on function private.current_user_is_league_member(text) from public, anon, authenticated;
revoke all on function private.current_user_is_league_owner(text) from public, anon, authenticated;

drop policy if exists leagues_read on public.leagues;
create policy leagues_read on public.leagues for select to anon, authenticated using (
  visibility = 'public'
  or (
    (select auth.uid()) is not null
    and private.current_user_is_league_member(leagues.id)
  )
);

drop policy if exists league_members_read_visible on public.league_members;
create policy league_members_read_visible on public.league_members for select to anon, authenticated using (
  private.league_is_public(league_members.league_id)
  or (
    (select auth.uid()) is not null
    and private.current_user_is_league_member(league_members.league_id)
  )
);

drop policy if exists leaderboard_entries_read on public.leaderboard_entries;
create policy leaderboard_entries_read on public.leaderboard_entries for select to anon, authenticated using (
  scope = 'global'
  or private.league_is_public(leaderboard_entries.league_id)
  or (
    (select auth.uid()) is not null
    and private.current_user_is_league_member(leaderboard_entries.league_id)
  )
);

drop policy if exists league_join_requests_read_visible on public.league_join_requests;
create policy league_join_requests_read_visible on public.league_join_requests for select to authenticated using (
  user_id = (select auth.uid())
  or private.current_user_is_league_owner(league_join_requests.league_id)
);

drop function if exists public.league_is_public(text);
drop function if exists public.current_user_is_league_member(text);
drop function if exists public.current_user_is_league_owner(text);
