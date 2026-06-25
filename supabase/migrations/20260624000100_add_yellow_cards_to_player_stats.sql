alter table public.espn_player_tournament_stats
  add column if not exists yellow_cards integer not null default 0;

create index if not exists espn_player_tournament_stats_yellow_cards_idx
  on public.espn_player_tournament_stats (yellow_cards desc, player_name);
