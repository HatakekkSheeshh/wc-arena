create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_username text;
  base_username text;
  next_username text;
  suffix integer := 0;
begin
  requested_username := nullif(trim(new.raw_user_meta_data->>'username'), '');
  base_username := coalesce(requested_username, split_part(new.email, '@', 1), 'player');
  next_username := base_username;

  while exists (select 1 from public.profiles where username = next_username) loop
    suffix := suffix + 1;
    next_username := base_username || '-' || suffix::text;
  end loop;

  insert into public.profiles (id, username, email, role)
  values (new.id, next_username, new.email, 'user')
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_auth_user() from public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();
