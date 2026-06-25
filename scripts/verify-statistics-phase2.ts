import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const migration = readdirSync('supabase/migrations')
  .filter((file) => file.endsWith('_normalize_espn_statistics.sql'))
  .sort()
  .at(-1);

assert.ok(migration, 'A normalize_espn_statistics migration must exist.');

const migrationSource = readFileSync(`supabase/migrations/${migration}`, 'utf8');
const normalizedTables = [
  'espn_players',
  'espn_match_events',
  'espn_match_event_participants',
  'espn_match_team_stats',
  'espn_player_tournament_stats',
  'espn_team_tournament_stats',
];

for (const table of normalizedTables) {
  assert.match(migrationSource, new RegExp(`create table if not exists public\\.${table}`), `Migration must create public.${table}.`);
  assert.match(migrationSource, new RegExp(`alter table public\\.${table} enable row level security`), `Migration must enable RLS on public.${table}.`);
  assert.match(migrationSource, new RegExp(`grant select on public\\.${table} to anon, authenticated`), `Migration must grant select on public.${table} to anon and authenticated.`);
  assert.match(migrationSource, new RegExp(`create policy ${table}_public_read[\\s\\S]*on public\\.${table}[\\s\\S]*for select[\\s\\S]*to anon, authenticated[\\s\\S]*using \\(true\\)`), `Migration must add a public read policy for public.${table}.`);
  assert.doesNotMatch(migrationSource, new RegExp(`grant (insert|update|delete|all)[\\s\\S]*on public\\.${table}[\\s\\S]*to anon`, 'i'), `Migration must not grant anon writes on public.${table}.`);
  assert.doesNotMatch(migrationSource, new RegExp(`grant (insert|update|delete|all)[\\s\\S]*on public\\.${table}[\\s\\S]*to authenticated`, 'i'), `Migration must not grant authenticated writes on public.${table}.`);
}

assert.match(migrationSource, /add column if not exists espn_stats_normalized_at timestamptz/, 'Migration must add matches.espn_stats_normalized_at.');
assert.match(migrationSource, /espn_player_tournament_stats_rank_idx/, 'Migration must add a top-scorer ranking index.');
assert.match(migrationSource, /espn_team_tournament_stats_rank_idx/, 'Migration must add a team stat ranking index.');

const yellowCardsMigration = readdirSync('supabase/migrations')
  .filter((file) => file.endsWith('_add_yellow_cards_to_player_stats.sql'))
  .sort()
  .at(-1);

assert.ok(yellowCardsMigration, 'A yellow-card player stats migration must exist.');
const yellowCardsMigrationSource = readFileSync(`supabase/migrations/${yellowCardsMigration}`, 'utf8');
assert.match(yellowCardsMigrationSource, /add column if not exists yellow_cards integer not null default 0/, 'Yellow-card migration must add espn_player_tournament_stats.yellow_cards.');
assert.match(yellowCardsMigrationSource, /espn_player_tournament_stats_yellow_cards_idx/, 'Yellow-card migration must add a yellow-card ranking index.');

assert.ok(existsSync('supabase/functions/_shared/espnStatistics.ts'), 'Shared ESPN statistics normalizer must exist.');
const normalizer = readFileSync('supabase/functions/_shared/espnStatistics.ts', 'utf8');
assert.match(normalizer, /buildNormalizedStatistics/, 'Shared normalizer must export buildNormalizedStatistics.');
assert.match(normalizer, /buildPlayerTournamentStats/, 'Shared normalizer must export buildPlayerTournamentStats.');
assert.match(normalizer, /buildTeamTournamentStats/, 'Shared normalizer must export buildTeamTournamentStats.');
assert.match(normalizer, /sourcePlayerId/, 'Shared normalizer must preserve ESPN player source ids when available.');

const syncFunction = readFileSync('supabase/functions/sync_espn_results/index.ts', 'utf8');
assert.match(syncFunction, /from '..\/_shared\/espnStatistics\.ts'/, 'ESPN sync must import the shared statistics normalizer.');
assert.match(syncFunction, /espn_match_events/, 'ESPN sync must write normalized event rows.');
assert.match(syncFunction, /espn_match_event_participants/, 'ESPN sync must write normalized event participants.');
assert.match(syncFunction, /espn_match_team_stats/, 'ESPN sync must write normalized team stats.');
assert.match(syncFunction, /espn_player_tournament_stats/, 'ESPN sync must rebuild player tournament aggregates.');
assert.match(syncFunction, /espn_team_tournament_stats/, 'ESPN sync must rebuild team tournament aggregates.');
assert.match(syncFunction, /espn_stats_normalized_at/, 'ESPN sync must mark normalized matches.');
assert.match(syncFunction, /sourcePlayerId/, 'ESPN sync sanitization must preserve source player ids.');
assert.match(syncFunction, /espn_summary/, 'ESPN sync must retain raw ESPN summary fallback data.');

const espnScript = readFileSync('scripts/sync-espn-worldcup.ts', 'utf8');
assert.match(espnScript, /normalize-existing/, 'Local ESPN script must support --normalize-existing backfill mode.');
assert.match(espnScript, /espn_match_events/, 'Local ESPN script must write normalized event rows.');
assert.doesNotMatch(espnScript, /\.select\(['"]\*['"]\)/, 'Local ESPN script must not use select("*").');

assert.ok(existsSync('src/services/statistics.ts'), 'Frontend statistics service must exist.');
const statisticsService = readFileSync('src/services/statistics.ts', 'utf8');
assert.doesNotMatch(statisticsService, /\.select\(['"]\*['"]\)/, 'Statistics service must not use select("*").');
assert.match(statisticsService, /TOP_SCORER_FIELDS/, 'Statistics service must define explicit top scorer fields.');
assert.match(statisticsService, /yellow_cards/, 'Statistics service must read yellow-card aggregates explicitly.');
assert.match(statisticsService, /listTopScorers\(limit = 10\)[\s\S]*\.limit\(limit\)/, 'Statistics service must bound top scorer reads to a top-10 default.');
assert.match(statisticsService, /listTopAssists\(limit = 10\)[\s\S]*\.limit\(limit\)/, 'Statistics service must expose bounded top assists reads with a top-10 default.');
assert.match(statisticsService, /listTopGoalContributions\(limit = 10\)/, 'Statistics service must expose goals plus assists reads with a top-10 default.');
assert.match(statisticsService, /listTopYellowCards\(limit = 10\)[\s\S]*\.order\('yellow_cards'/, 'Statistics service must expose bounded top yellow-card reads with a top-10 default.');
assert.match(statisticsService, /GOAL_CONTRIBUTION_FETCH_LIMIT/, 'Statistics service must bound the goals plus assists source read.');
assert.match(statisticsService, /getStatisticsCoverage/, 'Statistics service must expose normalized coverage.');

const statisticsPage = readFileSync('src/pages/Statistics.tsx', 'utf8');
assert.match(statisticsPage, /from '..\/services\/statistics'/, 'Statistics page must import the normalized statistics service.');
assert.match(statisticsPage, /listTopScorers/, 'Statistics page must load normalized top scorers.');
assert.match(statisticsPage, /listTopAssists/, 'Statistics page must load normalized top assists.');
assert.match(statisticsPage, /listTopGoalContributions/, 'Statistics page must load normalized goals plus assists.');
assert.match(statisticsPage, /listTopYellowCards/, 'Statistics page must load normalized yellow-card leaders.');
assert.match(statisticsPage, /yellowCards/, 'Statistics page must render yellow-card player metrics.');
assert.match(statisticsPage, /max-h-\[320px\][\s\S]*overflow-y-auto[\s\S]*\[&::-webkit-scrollbar\]:w-1\.5/, 'Statistics player leader tables must show five rows by default with a small scrollbar.');
assert.doesNotMatch(statisticsPage, /listTeamTournamentStats|teamStats|TeamTournamentStatRow/, 'Statistics page must replace team stats with player leader tables.');
assert.match(statisticsPage, /buildPlayerLeaders\(completedMatches, teamMap\)/, 'Statistics page must keep JSON player leader fallback.');
assert.doesNotMatch(statisticsPage, /buildTeamStats\(completedMatches, teamMap\)/, 'Statistics page must not use the JSON team-stat fallback on the player leader layout.');

console.log('Statistics Phase 2 verified.');
