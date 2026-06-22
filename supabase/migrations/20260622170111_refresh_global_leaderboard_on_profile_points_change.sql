create or replace function public.refresh_global_leaderboard_after_profile_points_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_global_leaderboard_entries();
  return null;
end;
$$;

revoke all on function public.refresh_global_leaderboard_after_profile_points_change() from public, anon, authenticated;

drop trigger if exists refresh_global_leaderboard_after_profile_points_change on public.profiles;
create trigger refresh_global_leaderboard_after_profile_points_change
after insert or update of points, exact_scores, accuracy, current_streak on public.profiles
for each statement
execute function public.refresh_global_leaderboard_after_profile_points_change();

select public.refresh_global_leaderboard_entries();
