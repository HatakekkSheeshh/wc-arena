import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

type JsonRecord = Record<string, unknown>;

type SquadFile = {
  metadata: {
    source_name?: string;
    scraped_at_utc?: string;
  };
  teams: SquadTeam[];
};

type SquadTeam = {
  group?: string;
  team: string;
  coach?: string;
  players: SquadPlayer[];
};

type SquadPlayer = {
  no?: number | null;
  pos: string;
  player: string;
  date_of_birth?: string | null;
  age?: number | null;
  caps?: number | null;
  goals?: number | null;
  club?: string | null;
  captain?: boolean;
  image_url?: string | null;
  image?: {
    url?: string | null;
    source?: string | null;
    source_page?: string | null;
    source_player?: string | null;
    source_team?: string | null;
    match_method?: string | null;
    license_note?: string | null;
    source_team_spreadsheet?: string | null;
    row_index?: number | null;
  } | null;
};

type TeamRow = {
  id: string;
  name: string;
  short_name: string;
  country_code: string;
  group_code: string | null;
};

type PlayerRow = {
  id: string;
  slug: string;
  display_name: string;
  normalized_name: string;
  date_of_birth: string | null;
  primary_position: string;
  primary_team_id: string;
  club: string | null;
  image_url: string | null;
  source: 'wikipedia_squads';
  source_player_name: string;
  source_payload: JsonRecord;
  updated_at: string;
};

type SquadRow = {
  tournament_id: 'wc2026';
  team_id: string;
  player_id: string;
  squad_number: number | null;
  position: string;
  caps: number | null;
  international_goals: number | null;
  club: string | null;
  captain: boolean;
  coach_name: string | null;
  group_code: string | null;
  source: 'wikipedia_squads';
  source_scraped_at: string | null;
  source_payload: JsonRecord;
  updated_at: string;
};

type AliasRow = {
  player_id: string;
  provider: 'wikipedia_squads';
  provider_player_id: string | null;
  alias_key: string;
  alias: string;
  normalized_alias: string;
  team_id: string;
  confidence: number;
  source: 'seed';
  updated_at: string;
};

type SeedRows = {
  players: PlayerRow[];
  squads: SquadRow[];
  aliases: AliasRow[];
  matchedTeams: string[];
  unmatchedTeams: string[];
  duplicatePlayerSlugs: string[];
  duplicateAliasKeys: string[];
  playersWithImages: number;
};

const args = process.argv.slice(2);
const shouldApply = args.includes('--apply');
const sqlOutputPath = getArgValue('--sql-out');
const SQUAD_PATH = path.resolve(process.cwd(), 'wc2026_squads_with_guardian_images.json');
const TEAM_FIELDS = 'id, name, short_name, country_code, group_code';
const SELECT_PAGE_SIZE = 1000;

const teamAliases: Record<string, string[]> = {
  BIH: ['bosnia-herzegovina', 'bosnia-and-herzegovina', 'bosnia-and-herzegovina'],
  CIV: ['cote-divoire', 'cote-d-ivoire', 'ivory-coast'],
  COD: ['congo-dr', 'dr-congo', 'drc'],
  CPV: ['cabo-verde', 'cape-verde'],
  CZE: ['czechia', 'czech-republic'],
  ENG: ['england'],
  IRN: ['ir-iran', 'iran'],
  KOR: ['korea-republic', 'south-korea'],
  NED: ['netherlands', 'holland'],
  RSA: ['south-africa'],
  SCO: ['scotland'],
  SUI: ['switzerland'],
  TUR: ['turkiye', 'turkey'],
  USA: ['usa', 'united-states', 'united-states-of-america'],
};

function getArgValue(name: string) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalize(value?: string | null) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeCompact(value?: string | null) {
  return normalize(value).replace(/-/g, '');
}

function assertSquadFile(value: unknown): asserts value is SquadFile {
  if (!isRecord(value) || !isRecord(value.metadata) || !Array.isArray(value.teams)) {
    throw new Error('wc2026_squads_with_guardian_images.json must contain metadata and teams[].');
  }

  value.teams.forEach((team, index) => {
    if (!isRecord(team) || typeof team.team !== 'string' || !Array.isArray(team.players)) {
      throw new Error(`Invalid team entry at teams[${index}].`);
    }
  });
}

async function readSquads() {
  const source = await readFile(SQUAD_PATH, 'utf8');
  const parsed = JSON.parse(source) as unknown;
  assertSquadFile(parsed);
  return parsed;
}

function getSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (shouldApply && !serviceRoleKey) throw new Error('Set SUPABASE_SERVICE_ROLE_KEY before running with --apply.');
  if (!supabaseUrl || (!serviceRoleKey && !publishableKey)) return null;

  return createClient(supabaseUrl, shouldApply ? serviceRoleKey! : publishableKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function loadTeamsFromSupabase() {
  const supabase = getSupabase();
  if (!supabase) return null;

  const rows: TeamRow[] = [];
  for (let from = 0; ; from += SELECT_PAGE_SIZE) {
    const { data, error } = await supabase
      .from('teams')
      .select(TEAM_FIELDS)
      .order('name')
      .range(from, from + SELECT_PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...((data ?? []) as TeamRow[]));
    if (!data || data.length < SELECT_PAGE_SIZE) return rows;
  }
}

async function loadTeamsFromSeedSql() {
  const source = await readFile(path.resolve(process.cwd(), 'supabase/seed.sql'), 'utf8');
  const insertMatch = source.match(/insert into public\.teams[\s\S]*?values\s*([\s\S]*?)\s*on conflict \(id\) do nothing;/i);
  if (!insertMatch) return [];

  return Array.from(insertMatch[1].matchAll(/\('([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*(?:null|\d+),\s*'([^']+)'\)/g)).map((match) => ({
    id: match[1],
    name: match[2],
    short_name: match[3],
    country_code: match[4],
    group_code: match[5],
  }));
}

async function loadTeams() {
  const supabaseTeams = await loadTeamsFromSupabase();
  if (supabaseTeams) return { teams: supabaseTeams, source: 'supabase' };

  const seedTeams = await loadTeamsFromSeedSql();
  return { teams: seedTeams, source: 'supabase/seed.sql fallback' };
}

function teamKeys(team: TeamRow) {
  const keys = new Set([team.id, team.name, team.short_name, team.country_code].flatMap((value) => [normalize(value), normalizeCompact(value)]).filter(Boolean));
  for (const alias of teamAliases[(team.short_name ?? team.country_code).toUpperCase()] ?? []) {
    keys.add(normalize(alias));
    keys.add(normalizeCompact(alias));
  }
  return keys;
}

function buildTeamLookup(teams: TeamRow[]) {
  const lookup = new Map<string, TeamRow>();
  for (const team of teams) {
    for (const key of teamKeys(team)) lookup.set(key, team);
  }
  return lookup;
}

function findTeam(teamName: string, lookup: Map<string, TeamRow>) {
  return lookup.get(normalize(teamName)) ?? lookup.get(normalizeCompact(teamName)) ?? null;
}

function stablePlayerSlug(player: SquadPlayer, teamId: string) {
  const nameSlug = normalize(player.player);
  if (player.date_of_birth) return `${nameSlug}-${player.date_of_birth}`;
  return `${nameSlug}-${teamId}`;
}

function stablePlayerId(player: SquadPlayer, teamId: string) {
  return `player:${stablePlayerSlug(player, teamId)}`;
}

function getPlayerImageUrl(player: SquadPlayer) {
  return player.image_url ?? player.image?.url ?? null;
}

function toPayload(value: unknown) {
  return isRecord(value) ? value : { value };
}

function addDuplicate<T>(seen: Set<string>, duplicates: Set<string>, key: string) {
  if (seen.has(key)) duplicates.add(key);
  seen.add(key);
}

function buildRows(squads: SquadFile, teams: TeamRow[]): SeedRows {
  const teamLookup = buildTeamLookup(teams);
  const playerMap = new Map<string, PlayerRow>();
  const squadsRows: SquadRow[] = [];
  const aliases: AliasRow[] = [];
  const matchedTeams: string[] = [];
  const unmatchedTeams: string[] = [];
  const playerSlugs = new Set<string>();
  const duplicatePlayerSlugs = new Set<string>();
  const aliasKeys = new Set<string>();
  const duplicateAliasKeys = new Set<string>();
  let playersWithImages = 0;
  const now = new Date().toISOString();
  const sourceScrapedAt = squads.metadata.scraped_at_utc ?? null;

  for (const squadTeam of squads.teams) {
    const team = findTeam(squadTeam.team, teamLookup);
    if (!team) {
      unmatchedTeams.push(squadTeam.team);
      continue;
    }

    matchedTeams.push(`${squadTeam.team} => ${team.id}`);

    for (const squadPlayer of squadTeam.players) {
      const slug = stablePlayerSlug(squadPlayer, team.id);
      const playerId = stablePlayerId(squadPlayer, team.id);
      const normalizedName = normalize(squadPlayer.player);
      const aliasKey = `wikipedia_squads||${normalizedName}|${team.id}`;
      const imageUrl = getPlayerImageUrl(squadPlayer);
      if (imageUrl) playersWithImages += 1;

      addDuplicate(playerSlugs, duplicatePlayerSlugs, slug);
      addDuplicate(aliasKeys, duplicateAliasKeys, aliasKey);

      playerMap.set(playerId, {
        id: playerId,
        slug,
        display_name: squadPlayer.player,
        normalized_name: normalizedName,
        date_of_birth: squadPlayer.date_of_birth ?? null,
        primary_position: squadPlayer.pos,
        primary_team_id: team.id,
        club: squadPlayer.club ?? null,
        image_url: imageUrl,
        source: 'wikipedia_squads',
        source_player_name: squadPlayer.player,
        source_payload: toPayload(squadPlayer),
        updated_at: now,
      });

      squadsRows.push({
        tournament_id: 'wc2026',
        team_id: team.id,
        player_id: playerId,
        squad_number: squadPlayer.no ?? null,
        position: squadPlayer.pos,
        caps: squadPlayer.caps ?? null,
        international_goals: squadPlayer.goals ?? null,
        club: squadPlayer.club ?? null,
        captain: Boolean(squadPlayer.captain),
        coach_name: squadTeam.coach ?? null,
        group_code: squadTeam.group ?? team.group_code,
        source: 'wikipedia_squads',
        source_scraped_at: sourceScrapedAt,
        source_payload: toPayload(squadPlayer),
        updated_at: now,
      });

      aliases.push({
        player_id: playerId,
        provider: 'wikipedia_squads',
        provider_player_id: null,
        alias_key: aliasKey,
        alias: squadPlayer.player,
        normalized_alias: normalizedName,
        team_id: team.id,
        confidence: 100,
        source: 'seed',
        updated_at: now,
      });
    }
  }

  return {
    players: Array.from(playerMap.values()),
    squads: squadsRows,
    aliases,
    matchedTeams,
    unmatchedTeams,
    duplicatePlayerSlugs: Array.from(duplicatePlayerSlugs),
    duplicateAliasKeys: Array.from(duplicateAliasKeys),
    playersWithImages,
  };
}

function sqlValue(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
  return `'${String(value).replace(/'/g, "''")}'`;
}

function buildInsertSql(tableName: string, rows: JsonRecord[], conflictTarget: string, updateColumns: string[]) {
  if (!rows.length) return [];
  const columns = Object.keys(rows[0]);
  const values = rows.map((row) => `  (${columns.map((column) => sqlValue(row[column])).join(', ')})`).join(',\n');
  const updates = updateColumns.map((column) => `${column} = excluded.${column}`).join(', ');
  return [
    `insert into public.${tableName} (${columns.join(', ')})`,
    'values',
    values,
    `on conflict ${conflictTarget} do update set ${updates};`,
  ].join('\n');
}

function buildSql(rows: SeedRows) {
  return [
    'begin;',
    buildInsertSql('players', rows.players as unknown as JsonRecord[], '(id)', ['slug', 'display_name', 'normalized_name', 'date_of_birth', 'primary_position', 'primary_team_id', 'club', 'image_url', 'source', 'source_player_name', 'source_payload', 'updated_at']),
    buildInsertSql('tournament_squad_players', rows.squads as unknown as JsonRecord[], '(tournament_id, team_id, player_id)', ['squad_number', 'position', 'caps', 'international_goals', 'club', 'captain', 'coach_name', 'group_code', 'source', 'source_scraped_at', 'source_payload', 'updated_at']),
    buildInsertSql('player_provider_aliases', rows.aliases as unknown as JsonRecord[], '(alias_key)', ['player_id', 'provider', 'provider_player_id', 'alias', 'normalized_alias', 'team_id', 'confidence', 'source', 'updated_at']),
    'commit;',
    '',
  ].filter(Boolean).join('\n\n');
}

async function applyRows(rows: SeedRows) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running with --apply.');

  const { error: playersError } = await supabase.from('players').upsert(rows.players, { onConflict: 'id' });
  if (playersError) throw playersError;

  const { error: squadsError } = await supabase.from('tournament_squad_players').upsert(rows.squads, { onConflict: 'tournament_id,team_id,player_id' });
  if (squadsError) throw squadsError;

  const { error: aliasesError } = await supabase.from('player_provider_aliases').upsert(rows.aliases, { onConflict: 'alias_key' });
  if (aliasesError) throw aliasesError;
}

function printSummary(rows: SeedRows, teamsSource: string, totalJsonTeams: number) {
  console.log(`Teams source: ${teamsSource}`);
  console.log(`Squad teams in JSON: ${totalJsonTeams}`);
  console.log(`Matched teams: ${rows.matchedTeams.length}`);
  console.log(`Unmatched teams: ${rows.unmatchedTeams.length}`);
  console.log(`Players parsed: ${rows.players.length}`);
  console.log(`Squad rows parsed: ${rows.squads.length}`);
  console.log(`Provider aliases parsed: ${rows.aliases.length}`);
  console.log(`Players with images: ${rows.playersWithImages}`);
  console.log(`Duplicate player slugs: ${rows.duplicatePlayerSlugs.length}`);
  console.log(`Duplicate alias keys: ${rows.duplicateAliasKeys.length}`);

  if (rows.unmatchedTeams.length) console.log(`Unmatched team names: ${rows.unmatchedTeams.join(', ')}`);
  if (rows.duplicatePlayerSlugs.length) console.log(`Duplicate player slugs: ${rows.duplicatePlayerSlugs.join(', ')}`);
  if (rows.duplicateAliasKeys.length) console.log(`Duplicate alias keys: ${rows.duplicateAliasKeys.join(', ')}`);
}

async function main() {
  const [squads, teamResult] = await Promise.all([readSquads(), loadTeams()]);
  const rows = buildRows(squads, teamResult.teams);

  printSummary(rows, teamResult.source, squads.teams.length);

  if (sqlOutputPath) {
    await writeFile(path.resolve(process.cwd(), sqlOutputPath), buildSql(rows));
    console.log(`SQL seed file written to ${sqlOutputPath}`);
  }

  if (!shouldApply) {
    console.log('Dry run only. Re-run with --apply and SUPABASE_SERVICE_ROLE_KEY to seed player database.');
    return;
  }

  if (rows.unmatchedTeams.length) {
    throw new Error(`Refusing to apply with unmatched teams: ${rows.unmatchedTeams.join(', ')}`);
  }

  await applyRows(rows);
  console.log(`Applied ${rows.players.length} players, ${rows.squads.length} squad rows, and ${rows.aliases.length} provider aliases.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
