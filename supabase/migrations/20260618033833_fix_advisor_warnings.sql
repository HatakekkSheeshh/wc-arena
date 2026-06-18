drop policy if exists public_leagues_read on public.leagues;
drop policy if exists private_leagues_member_read on public.leagues;
create policy leagues_read on public.leagues for select to anon, authenticated using (
  visibility = 'public'
  or (
    (select auth.uid()) is not null
    and exists (
      select 1 from public.league_members lm
      where lm.league_id = leagues.id
      and lm.user_id = (select auth.uid())
    )
  )
);

drop policy if exists global_leaderboard_public_read on public.leaderboard_entries;
drop policy if exists league_leaderboard_member_read on public.leaderboard_entries;
create policy leaderboard_entries_read on public.leaderboard_entries for select to anon, authenticated using (
  scope = 'global'
  or (
    (select auth.uid()) is not null
    and exists (
      select 1 from public.league_members lm
      where lm.league_id = leaderboard_entries.league_id
      and lm.user_id = (select auth.uid())
    )
  )
);

drop policy if exists reward_reviews_read_own on public.reward_reviews;
drop policy if exists reward_reviews_admin_read on public.reward_reviews;
create policy reward_reviews_read on public.reward_reviews for select to authenticated using (
  (select auth.uid()) = user_id
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
    and p.role = 'admin'
  )
);

revoke execute on function public.rls_auto_enable() from public;
revoke execute on function public.rls_auto_enable() from anon;
revoke execute on function public.rls_auto_enable() from authenticated;
