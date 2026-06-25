alter table public.matches
  add column if not exists espn_stats_normalized_at timestamptz;

create table if not exists public.espn_players (
  id text primary key,
  source text not null default 'espn',
  source_player_id text,
  display_name text not null,
  normalized_name text not null,
  team_id text references public.teams(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.espn_match_events (
  match_id text not null references public.matches(id) on delete cascade,
  event_key text not null,
  espn_event_id text,
  event_index integer not null,
  team_id text references public.teams(id),
  side text check (side in ('home', 'away')),
  event_type text,
  type_text text,
  clock text,
  period integer,
  minute integer,
  text text,
  scoring_play boolean not null default false,
  home_score integer,
  away_score integer,
  source_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (match_id, event_key)
);

create table if not exists public.espn_match_event_participants (
  match_id text not null,
  event_key text not null,
  role text not null,
  sort_order integer not null default 0,
  player_id text references public.espn_players(id),
  player_name text not null,
  primary key (match_id, event_key, role, sort_order),
  foreign key (match_id, event_key) references public.espn_match_events(match_id, event_key) on delete cascade
);

create table if not exists public.espn_match_team_stats (
  match_id text not null references public.matches(id) on delete cascade,
  team_id text not null references public.teams(id),
  side text not null check (side in ('home', 'away')),
  stat_key text not null,
  label text not null,
  source_name text,
  display_value text not null,
  numeric_value numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (match_id, team_id, stat_key)
);

create table if not exists public.espn_player_tournament_stats (
  player_id text not null references public.espn_players(id),
  player_name text not null,
  team_id text references public.teams(id),
  goals integer not null default 0,
  assists integer not null default 0,
  latest_match_id text references public.matches(id),
  latest_clock text,
  updated_at timestamptz not null default now(),
  primary key (player_id, team_id)
);

create table if not exists public.espn_team_tournament_stats (
  team_id text not null references public.teams(id),
  stat_key text not null,
  label text not null,
  total_numeric numeric not null default 0,
  matches_sampled integer not null default 0,
  average_numeric numeric,
  updated_at timestamptz not null default now(),
  primary key (team_id, stat_key)
);

create index if not exists espn_match_events_match_idx on public.espn_match_events(match_id);
create index if not exists espn_match_events_scoring_idx on public.espn_match_events(scoring_play, team_id);
create index if not exists espn_match_event_participants_player_idx on public.espn_match_event_participants(player_id);
create index if not exists espn_match_team_stats_stat_idx on public.espn_match_team_stats(stat_key, team_id);
create index if not exists espn_player_tournament_stats_rank_idx on public.espn_player_tournament_stats(goals desc, assists desc, player_name);
create index if not exists espn_team_tournament_stats_rank_idx on public.espn_team_tournament_stats(stat_key, total_numeric desc);

alter table public.espn_players enable row level security;
alter table public.espn_match_events enable row level security;
alter table public.espn_match_event_participants enable row level security;
alter table public.espn_match_team_stats enable row level security;
alter table public.espn_player_tournament_stats enable row level security;
alter table public.espn_team_tournament_stats enable row level security;

grant select on public.espn_players to anon, authenticated;
grant select on public.espn_match_events to anon, authenticated;
grant select on public.espn_match_event_participants to anon, authenticated;
grant select on public.espn_match_team_stats to anon, authenticated;
grant select on public.espn_player_tournament_stats to anon, authenticated;
grant select on public.espn_team_tournament_stats to anon, authenticated;

drop policy if exists espn_players_public_read on public.espn_players;
create policy espn_players_public_read
  on public.espn_players
  for select
  to anon, authenticated
  using (true);

drop policy if exists espn_match_events_public_read on public.espn_match_events;
create policy espn_match_events_public_read
  on public.espn_match_events
  for select
  to anon, authenticated
  using (true);

drop policy if exists espn_match_event_participants_public_read on public.espn_match_event_participants;
create policy espn_match_event_participants_public_read
  on public.espn_match_event_participants
  for select
  to anon, authenticated
  using (true);

drop policy if exists espn_match_team_stats_public_read on public.espn_match_team_stats;
create policy espn_match_team_stats_public_read
  on public.espn_match_team_stats
  for select
  to anon, authenticated
  using (true);

drop policy if exists espn_player_tournament_stats_public_read on public.espn_player_tournament_stats;
create policy espn_player_tournament_stats_public_read
  on public.espn_player_tournament_stats
  for select
  to anon, authenticated
  using (true);

drop policy if exists espn_team_tournament_stats_public_read on public.espn_team_tournament_stats;
create policy espn_team_tournament_stats_public_read
  on public.espn_team_tournament_stats
  for select
  to anon, authenticated
  using (true);
