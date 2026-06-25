create table public.players (
  id text primary key,
  slug text not null unique,
  display_name text not null,
  normalized_name text not null,
  date_of_birth date,
  primary_position text,
  primary_team_id text references public.teams(id),
  club text,
  image_url text,
  source text not null default 'wikipedia_squads',
  source_player_name text not null,
  source_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tournament_squad_players (
  tournament_id text not null default 'wc2026',
  team_id text not null references public.teams(id),
  player_id text not null references public.players(id) on delete cascade,
  squad_number integer,
  position text not null,
  caps integer,
  international_goals integer,
  club text,
  captain boolean not null default false,
  coach_name text,
  group_code text,
  source text not null default 'wikipedia_squads',
  source_scraped_at timestamptz,
  source_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tournament_id, team_id, player_id)
);

create table public.player_provider_aliases (
  id uuid primary key default gen_random_uuid(),
  player_id text not null references public.players(id) on delete cascade,
  provider text not null check (provider in ('wikipedia_squads', 'espn', 'fifa', 'manual')),
  provider_player_id text,
  alias_key text not null unique,
  alias text not null,
  normalized_alias text not null,
  team_id text references public.teams(id),
  confidence integer not null default 100 check (confidence between 0 and 100),
  source text not null default 'seed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index players_normalized_name_idx on public.players(normalized_name);
create index players_primary_team_idx on public.players(primary_team_id);
create index tournament_squad_players_team_idx on public.tournament_squad_players(tournament_id, team_id, squad_number);
create index player_provider_aliases_player_idx on public.player_provider_aliases(player_id);
create index player_provider_aliases_lookup_idx on public.player_provider_aliases(provider, normalized_alias, team_id);

alter table public.players enable row level security;
alter table public.tournament_squad_players enable row level security;
alter table public.player_provider_aliases enable row level security;

grant select on public.players to anon, authenticated;
grant select on public.tournament_squad_players to anon, authenticated;
grant select on public.player_provider_aliases to anon, authenticated;

drop policy if exists players_public_read on public.players;
create policy players_public_read
  on public.players
  for select
  to anon, authenticated
  using (true);

drop policy if exists tournament_squad_players_public_read on public.tournament_squad_players;
create policy tournament_squad_players_public_read
  on public.tournament_squad_players
  for select
  to anon, authenticated
  using (true);

drop policy if exists player_provider_aliases_public_read on public.player_provider_aliases;
create policy player_provider_aliases_public_read
  on public.player_provider_aliases
  for select
  to anon, authenticated
  using (true);
