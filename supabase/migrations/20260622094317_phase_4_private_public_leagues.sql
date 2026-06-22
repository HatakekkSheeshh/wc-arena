alter table public.leagues
  add column if not exists description text not null default '',
  add column if not exists join_policy text not null default 'auto' check (join_policy in ('auto', 'approval')),
  add column if not exists updated_at timestamptz not null default now();

update public.leagues
set prize_mode = 'none'
where prize_mode is null;

create table if not exists public.league_join_requests (
  league_id text not null references public.leagues(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  requested_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id),
  primary key (league_id, user_id)
);

create index if not exists league_join_requests_league_status_requested_idx
  on public.league_join_requests(league_id, status, requested_at desc);

create index if not exists league_join_requests_user_status_requested_idx
  on public.league_join_requests(user_id, status, requested_at desc);

alter table public.league_join_requests enable row level security;

create or replace function public.refresh_league_member_count(target_league_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.leagues
  set member_count = (
    select count(*)::integer
    from public.league_members
    where league_id = target_league_id
  ),
  updated_at = now()
  where id = target_league_id;
end;
$$;

create or replace function public.refresh_league_member_count_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_league_member_count(coalesce(new.league_id, old.league_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists league_members_refresh_member_count on public.league_members;
create trigger league_members_refresh_member_count
after insert or delete on public.league_members
for each row execute function public.refresh_league_member_count_trigger();

update public.leagues l
set member_count = counts.member_count,
    updated_at = now()
from (
  select l2.id, count(lm.user_id)::integer as member_count
  from public.leagues l2
  left join public.league_members lm on lm.league_id = l2.id
  group by l2.id
) counts
where l.id = counts.id;

revoke all on function public.refresh_league_member_count(text) from public, anon, authenticated;
revoke all on function public.refresh_league_member_count_trigger() from public, anon, authenticated;
grant execute on function public.refresh_league_member_count(text) to service_role;
grant execute on function public.refresh_league_member_count_trigger() to service_role;

create or replace function public.league_is_public(target_league_id text)
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

create or replace function public.current_user_is_league_member(target_league_id text)
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

create or replace function public.current_user_is_league_owner(target_league_id text)
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

revoke all on function public.league_is_public(text) from public;
revoke all on function public.current_user_is_league_member(text) from public;
revoke all on function public.current_user_is_league_owner(text) from public;
grant execute on function public.league_is_public(text) to anon, authenticated;
grant execute on function public.current_user_is_league_member(text) to authenticated;
grant execute on function public.current_user_is_league_owner(text) to authenticated;

drop policy if exists leagues_read on public.leagues;
drop policy if exists public_leagues_read on public.leagues;
drop policy if exists private_leagues_member_read on public.leagues;
create policy leagues_read on public.leagues for select to anon, authenticated using (
  visibility = 'public'
  or (
    (select auth.uid()) is not null
    and public.current_user_is_league_member(leagues.id)
  )
);

drop policy if exists league_members_read_own on public.league_members;
drop policy if exists league_members_read_visible on public.league_members;
create policy league_members_read_visible on public.league_members for select to anon, authenticated using (
  public.league_is_public(league_members.league_id)
  or (
    (select auth.uid()) is not null
    and public.current_user_is_league_member(league_members.league_id)
  )
);

drop policy if exists leaderboard_entries_read on public.leaderboard_entries;
drop policy if exists global_leaderboard_public_read on public.leaderboard_entries;
drop policy if exists league_leaderboard_member_read on public.leaderboard_entries;
create policy leaderboard_entries_read on public.leaderboard_entries for select to anon, authenticated using (
  scope = 'global'
  or public.league_is_public(leaderboard_entries.league_id)
  or (
    (select auth.uid()) is not null
    and public.current_user_is_league_member(leaderboard_entries.league_id)
  )
);

drop policy if exists league_join_requests_read_visible on public.league_join_requests;
create policy league_join_requests_read_visible on public.league_join_requests for select to authenticated using (
  user_id = (select auth.uid())
  or public.current_user_is_league_owner(league_join_requests.league_id)
);
