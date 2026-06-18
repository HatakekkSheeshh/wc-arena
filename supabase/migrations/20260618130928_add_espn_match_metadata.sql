alter table public.matches
  add column if not exists espn_event_id text,
  add column if not exists espn_competition_id text,
  add column if not exists espn_status text,
  add column if not exists espn_status_detail text,
  add column if not exists espn_updated_at timestamptz;

create unique index if not exists matches_espn_event_id_unique
  on public.matches(espn_event_id)
  where espn_event_id is not null;
