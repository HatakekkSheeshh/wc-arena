import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const migration = readdirSync('supabase/migrations')
  .filter((file) => file.endsWith('_add_player_database_seed_schema.sql'))
  .sort()
  .at(-1);

assert.ok(migration, 'A player database seed schema migration must exist.');

const migrationSource = readFileSync(`supabase/migrations/${migration}`, 'utf8');

for (const table of ['players', 'tournament_squad_players', 'player_provider_aliases']) {
  assert.match(migrationSource, new RegExp(`create table public\\.${table}`), `Migration must create public.${table}.`);
  assert.match(migrationSource, new RegExp(`alter table public\\.${table} enable row level security`), `Migration must enable RLS on public.${table}.`);
  assert.match(migrationSource, new RegExp(`grant select on public\\.${table} to anon, authenticated`), `Migration must grant public read on public.${table}.`);
  assert.doesNotMatch(migrationSource, new RegExp(`grant (insert|update|delete|all) on public\\.${table} to anon`, 'i'), `Migration must not grant anon writes on public.${table}.`);
  assert.doesNotMatch(migrationSource, new RegExp(`grant (insert|update|delete|all) on public\\.${table} to authenticated`, 'i'), `Migration must not grant authenticated writes on public.${table}.`);
}

assert.match(migrationSource, /date_of_birth date/, 'Players must store date_of_birth for durable identity.');
assert.match(migrationSource, /image_url text/, 'Players must store CDN image URLs from the enriched squad seed.');
assert.match(migrationSource, /source_payload jsonb/, 'Seed tables must preserve source payloads for later refresh/debugging.');
assert.match(migrationSource, /source_scraped_at timestamptz/, 'Squad rows must preserve source scrape timestamp.');
assert.match(migrationSource, /provider text not null check \(provider in \('wikipedia_squads', 'espn', 'fifa', 'manual'\)\)/, 'Aliases must support Wikipedia, ESPN, FIFA, and manual providers.');
assert.match(migrationSource, /provider_player_id text/, 'Aliases must support provider player IDs for later enrichment.');
assert.match(migrationSource, /alias_key text not null unique/, 'Aliases must have a deterministic upsert key.');
assert.match(migrationSource, /normalized_alias text not null/, 'Aliases must store normalized names for provider matching.');
assert.match(migrationSource, /references public\.teams\(id\)/, 'Player schema must reference existing teams instead of duplicating teams.');

assert.ok(existsSync('scripts/seed-wc2026-players.ts'), 'WC2026 player seed script must exist.');
const seedScript = readFileSync('scripts/seed-wc2026-players.ts', 'utf8');

assert.match(seedScript, /wc2026_squads_with_guardian_images\.json/, 'Seed script must read the enriched squad file with Guardian image URLs.');
assert.match(seedScript, /function stablePlayerSlug[\s\S]*date_of_birth/, 'Seed script must use date_of_birth for stable player identity.');
assert.doesNotMatch(seedScript.match(/function stablePlayerSlug[\s\S]*?\n}/)?.[0] ?? '', /\.age\b/, 'Seed identity must not rely on age.');
assert.match(seedScript, /from\('teams'\)[\s\S]*\.select\(TEAM_FIELDS\)/, 'Seed script must map squads to existing teams from Supabase.');
assert.doesNotMatch(seedScript, /from\('teams'\)\.(insert|upsert)/, 'Seed script must not create duplicate teams.');
assert.match(seedScript, /provider: 'wikipedia_squads'/, 'Seed script must create Wikipedia squad aliases.');
assert.match(seedScript, /image_url/, 'Seed script must persist enriched player CDN image URLs.');
assert.match(seedScript, /player\.image_url \?\? player\.image\?\.url/, 'Seed script must fall back from image_url to the nested image URL.');
assert.match(seedScript, /source_payload: toPayload\(squadPlayer\)/, 'Seed script must preserve image source metadata in the player source payload.');
assert.match(seedScript, /alias_key/, 'Seed script must create deterministic alias keys.');
assert.match(seedScript, /SUPABASE_SERVICE_ROLE_KEY[\s\S]*--apply/, 'Seed script must reserve service role usage for --apply.');
assert.doesNotMatch(seedScript, /console\.log\([^\n]*process\.env/, 'Seed script must not log secret environment values.');
assert.doesNotMatch(seedScript, /score|points|goals\s*\+|assists\s*\+/, 'Seed script must not implement scoring from raw squad names.');

const packageJson = readFileSync('package.json', 'utf8');
assert.match(packageJson, /"data:seed:players": "tsx scripts\/seed-wc2026-players\.ts"/, 'package.json must expose a dry-run player seed script.');

console.log('Player database seed verified.');
