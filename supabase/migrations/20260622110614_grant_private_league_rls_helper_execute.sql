grant usage on schema private to anon, authenticated;
grant execute on function private.league_is_public(text) to anon, authenticated;
grant execute on function private.current_user_is_league_member(text) to anon, authenticated;
grant execute on function private.current_user_is_league_owner(text) to authenticated;
