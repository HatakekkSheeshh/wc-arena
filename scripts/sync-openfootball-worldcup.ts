import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import type { Database } from '../src/types/supabase';

type OpenFootballTeam = {
  name: string;
  name_normalised?: string;
  fifa_code: string;
  group: string;
};

type OpenFootballMatch = {
  round: string;
  num?: number;
  date: string;
  time: string;
  team1: string;
  team2: string;
  group?: string;
  ground: string;
  score?: { ft?: [number, number] };
};

type OpenFootballWorldCup = {
  name: string;
  matches: OpenFootballMatch[];
};

type OpenFootballStadium = {
  city: string;
  name: string;
};

type StadiumData = {
  stadiums: OpenFootballStadium[];
};

type TeamInsert = Database['public']['Tables']['teams']['Insert'];
type MatchInsert = Database['public']['Tables']['matches']['Insert'];

const DATA_DIR = path.join(process.cwd(), 'external', 'worldcup.json', '2026');
const LOCK_MINUTES_BEFORE_KICKOFF = 15;

const rawArgs = process.argv.slice(2);
const args = new Set(rawArgs);
const shouldApply = args.has('--apply');
const sqlOutputIndex = rawArgs.indexOf('--sql-out');
const sqlOutputPath = sqlOutputIndex >= 0 ? rawArgs[sqlOutputIndex + 1] : undefined;

async function readJson<T>(fileName: string): Promise<T> {
  const content = await readFile(path.join(DATA_DIR, fileName), 'utf8');
  return JSON.parse(content) as T;
}

function toTeamId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function isPlaceholderTeam(value: string) {
  return /^(?:[123][A-L](?:\/[A-L])*|W\d+|L\d+)$/.test(value);
}

function parseGroupCode(value?: string) {
  return value?.replace(/^Group\s+/i, '') ?? null;
}

function parseMatchday(round: string) {
  const match = round.match(/^Matchday\s+(\d+)$/i);
  return match ? Number(match[1]) : null;
}

function mapStage(round: string): MatchInsert['stage'] {
  if (/^Matchday\s+\d+$/i.test(round)) return 'group';
  if (round === 'Round of 32') return 'round32';
  if (round === 'Round of 16') return 'round16';
  if (round === 'Quarter-final') return 'quarter';
  if (round === 'Semi-final') return 'semi';
  if (round === 'Match for third place') return 'third_place';
  if (round === 'Final') return 'final';
  throw new Error(`Unsupported World Cup round: ${round}`);
}

function parseKickoff(date: string, time: string) {
  const match = time.match(/^(\d{1,2}):(\d{2})\s+UTC([+-]\d{1,2})$/);
  if (!match) throw new Error(`Unsupported kickoff time format: ${date} ${time}`);

  const [, hour, minute, offset] = match;
  const offsetHours = Number(offset);
  const utcTimestamp = Date.UTC(
    Number(date.slice(0, 4)),
    Number(date.slice(5, 7)) - 1,
    Number(date.slice(8, 10)),
    Number(hour) - offsetHours,
    Number(minute),
  );

  return new Date(utcTimestamp);
}

function getStatus(match: OpenFootballMatch, kickoffAt: Date) {
  if (match.score?.ft) return 'finished';
  return kickoffAt.getTime() > Date.now() ? 'open' : 'locked';
}

function buildPlaceholderTeam(label: string): TeamInsert {
  const id = toTeamId(label);
  return {
    id,
    name: label,
    short_name: label,
    country_code: label,
    fifa_rank: null,
    group_code: null,
  };
}

function buildTeamMap(teams: OpenFootballTeam[]) {
  const teamMap = new Map<string, TeamInsert>();
  const nameToId = new Map<string, string>();

  for (const team of teams) {
    const id = team.fifa_code.toLowerCase();
    const row: TeamInsert = {
      id,
      name: team.name_normalised ?? team.name,
      short_name: team.fifa_code,
      country_code: team.fifa_code,
      fifa_rank: null,
      group_code: team.group,
    };

    teamMap.set(id, row);
    nameToId.set(team.name, id);
    nameToId.set(team.name_normalised ?? team.name, id);
  }

  return { teamMap, nameToId };
}

function resolveTeamId(label: string, teamMap: Map<string, TeamInsert>, nameToId: Map<string, string>) {
  const existingId = nameToId.get(label);
  if (existingId) return existingId;

  if (!isPlaceholderTeam(label)) throw new Error(`Unknown team label in fixture data: ${label}`);

  const placeholder = buildPlaceholderTeam(label);
  teamMap.set(placeholder.id, placeholder);
  return placeholder.id;
}

function buildStadiumMap(stadiums: OpenFootballStadium[]) {
  return new Map(stadiums.map((stadium) => [stadium.city, stadium]));
}

function buildMatchRows(worldCup: OpenFootballWorldCup, teamMap: Map<string, TeamInsert>, nameToId: Map<string, string>, stadiumMap: Map<string, OpenFootballStadium>) {
  return worldCup.matches.map((match, index): MatchInsert => {
    const kickoffAt = parseKickoff(match.date, match.time);
    const lockAt = new Date(kickoffAt.getTime() - LOCK_MINUTES_BEFORE_KICKOFF * 60 * 1000);
    const stadium = stadiumMap.get(match.ground);
    const matchNumber = match.num ?? index + 1;

    return {
      id: `wc2026-${String(matchNumber).padStart(3, '0')}`,
      stage: mapStage(match.round),
      group_code: parseGroupCode(match.group),
      matchday: parseMatchday(match.round),
      home_team_id: resolveTeamId(match.team1, teamMap, nameToId),
      away_team_id: resolveTeamId(match.team2, teamMap, nameToId),
      kickoff_at: kickoffAt.toISOString(),
      lock_at: lockAt.toISOString(),
      stadium: stadium?.name ?? match.ground,
      city: stadium?.city ?? match.ground,
      status: getStatus(match, kickoffAt),
      home_score: match.score?.ft?.[0] ?? null,
      away_score: match.score?.ft?.[1] ?? null,
      result_updated_at: match.score?.ft ? new Date().toISOString() : null,
    };
  });
}

function sqlValue(value: unknown) {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
  return `'${String(value).replace(/'/g, "''")}'`;
}

function buildRowsSql<T extends object>(tableName: string, columns: (keyof T)[], rows: T[], conflictTarget: string) {
  const values = rows.map((row) => `  (${columns.map((column) => sqlValue(row[column])).join(', ')})`).join(',\n');
  const updates = columns
    .filter((column) => column !== 'id')
    .map((column) => `${String(column)} = excluded.${String(column)}`)
    .join(', ');

  return `insert into public.${tableName} (${columns.join(', ')})\nvalues\n${values}\non conflict (${conflictTarget}) do update set ${updates};`;
}

function buildSyncSql(teams: TeamInsert[], matches: MatchInsert[]) {
  const teamColumns: (keyof TeamInsert)[] = ['id', 'name', 'short_name', 'country_code', 'fifa_rank', 'group_code'];
  const matchColumns: (keyof MatchInsert)[] = [
    'id',
    'stage',
    'group_code',
    'matchday',
    'home_team_id',
    'away_team_id',
    'kickoff_at',
    'lock_at',
    'stadium',
    'city',
    'status',
    'home_score',
    'away_score',
    'result_updated_at',
  ];

  return [
    'begin;',
    buildRowsSql('teams', teamColumns, teams, 'id'),
    buildRowsSql('matches', matchColumns, matches, 'id'),
    'commit;',
    '',
  ].join('\n\n');
}

async function applyRows(teams: TeamInsert[], matches: MatchInsert[]) {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) throw new Error('Set SUPABASE_URL or VITE_SUPABASE_URL before running with --apply.');
  if (!serviceRoleKey) throw new Error('Set SUPABASE_SERVICE_ROLE_KEY before running with --apply.');

  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: teamError } = await supabase.from('teams').upsert(teams, { onConflict: 'id' });
  if (teamError) throw teamError;

  const { error: matchError } = await supabase.from('matches').upsert(matches, { onConflict: 'id' });
  if (matchError) throw matchError;
}

async function main() {
  const [teamData, worldCup, stadiumData] = await Promise.all([
    readJson<OpenFootballTeam[]>('worldcup.teams.json'),
    readJson<OpenFootballWorldCup>('worldcup.json'),
    readJson<StadiumData>('worldcup.stadiums.json'),
  ]);

  const { teamMap, nameToId } = buildTeamMap(teamData);
  const stadiumMap = buildStadiumMap(stadiumData.stadiums);
  const matches = buildMatchRows(worldCup, teamMap, nameToId, stadiumMap);
  const teams = Array.from(teamMap.values()).sort((a, b) => a.id.localeCompare(b.id));
  const stageCounts = matches.reduce<Record<string, number>>((counts, match) => {
    counts[match.stage] = (counts[match.stage] ?? 0) + 1;
    return counts;
  }, {});
  const placeholderTeams = teams.filter((team) => isPlaceholderTeam(team.short_name));

  console.log(`OpenFootball source: ${worldCup.name}`);
  console.log(`Teams ready: ${teams.length} (${placeholderTeams.length} knockout placeholders)`);
  console.log(`Matches ready: ${matches.length}`);
  console.log(`Stages: ${Object.entries(stageCounts).map(([stage, count]) => `${stage}=${count}`).join(', ')}`);
  console.log(`First kickoff: ${matches[0]?.kickoff_at ?? 'none'}`);
  console.log(`Last kickoff: ${matches.at(-1)?.kickoff_at ?? 'none'}`);

  if (sqlOutputPath) {
    await writeFile(path.resolve(process.cwd(), sqlOutputPath), buildSyncSql(teams, matches));
    console.log(`SQL upsert file written to ${sqlOutputPath}`);
  }

  if (!shouldApply) {
    console.log('Dry run only. Re-run with --apply and SUPABASE_SERVICE_ROLE_KEY to upsert teams and matches.');
    return;
  }

  await applyRows(teams, matches);
  console.log('Supabase teams and matches upserted from OpenFootball World Cup 2026 data.');
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
