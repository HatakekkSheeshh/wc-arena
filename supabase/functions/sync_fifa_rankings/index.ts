import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { jsonResponse as sharedJsonResponse, requireSyncSecret } from '../_shared/authGuards.ts';
import { acquireLock, releaseLock } from '../_shared/redis.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-sync-secret',
};
const FIFA_RANKINGS_URL = 'https://en.wikipedia.org/w/index.php?title=Module:SportsRankings/data/FIFA_World_Rankings&action=raw';

const fallbackAliases: Record<string, string[]> = {
  ENG: ['england'],
  IRN: ['ir-iran', 'iran'],
  KOR: ['korea-republic', 'south-korea'],
  NED: ['netherlands', 'holland'],
  NZL: ['aotearoa-new-zealand', 'new-zealand'],
  TUR: ['turkiye', 'turkey'],
  USA: ['usa', 'united-states', 'united-states-of-america'],
};

type TeamRow = {
  id: string;
  name: string;
  short_name: string;
  country_code: string;
  fifa_rank: number | null;
};

type RankingRow = {
  name: string;
  rank: number;
};

type RankingMap = {
  byCode: Map<string, RankingRow>;
  byName: Map<string, RankingRow>;
};

type TeamUpdate = {
  id: string;
  fifa_rank: number;
};

function jsonResponse(body: unknown, status = 200) {
  return sharedJsonResponse(corsHeaders, body, status);
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

function parseRankings(source: string) {
  const rankings = new Map<string, RankingRow>();
  const rowPattern = /\{\s*"([^"]+)"\s*,\s*(\d+)\s*,\s*[-\d]+\s*,\s*[\d.]+\s*\}/g;

  for (const match of source.matchAll(rowPattern)) {
    const name = match[1].trim();
    const rank = Number(match[2]);
    if (name && Number.isInteger(rank)) {
      rankings.set(normalize(name), { name, rank });
    }
  }

  return rankings;
}

function parseAliasRows(source: string) {
  const aliases = new Map<string, string>();
  const aliasStart = source.indexOf('data.alias');
  if (aliasStart === -1) return aliases;

  const aliasSource = source.slice(aliasStart);
  const aliasPattern = /\{\s*"([A-Z0-9]{2,4})"\s*,\s*"([^"]+)"\s*\}/g;

  for (const match of aliasSource.matchAll(aliasPattern)) {
    aliases.set(match[1].toUpperCase(), match[2].trim());
  }

  return aliases;
}

function buildRankingMap(source: string): RankingMap {
  const byName = parseRankings(source);
  const aliases = parseAliasRows(source);
  const byCode = new Map<string, RankingRow>();

  aliases.forEach((name, code) => {
    const ranking = byName.get(normalize(name));
    if (ranking) byCode.set(code, ranking);
  });

  Object.entries(fallbackAliases).forEach(([code, names]) => {
    for (const name of names) {
      const ranking = byName.get(normalize(name));
      if (ranking) {
        byCode.set(code, ranking);
        break;
      }
    }
  });

  return { byCode, byName };
}

function isPlaceholderTeam(team: TeamRow) {
  return /^(?:[12][A-L]|3[A-L](?:\/[A-L])+|[WL]\d+)$/.test(team.short_name);
}

function findRanking(team: TeamRow, rankings: RankingMap) {
  const codeRanking = rankings.byCode.get(team.short_name.toUpperCase());
  if (codeRanking) return codeRanking;

  const teamKeys = [team.name, team.short_name, team.id]
    .map(normalize)
    .filter(Boolean);

  for (const key of teamKeys) {
    const ranking = rankings.byName.get(key);
    if (ranking) return ranking;
  }

  for (const alias of fallbackAliases[team.short_name.toUpperCase()] ?? []) {
    const ranking = rankings.byName.get(alias);
    if (ranking) return ranking;
  }

  return null;
}

async function insertAuditLog(supabase: ReturnType<typeof createClient>, action: string, description: string, severity: 'info' | 'warning') {
  await supabase.from('admin_audit_logs').insert({
    action,
    entity_type: 'system',
    entity_id: 'fifa-ranking-sync',
    description,
    severity,
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const secretError = requireSyncSecret(req, corsHeaders, 'FIFA_RANKING_SYNC_SECRET');
  if (secretError) return secretError;

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'Missing Supabase server config' }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });

  let lockAcquired = false;
  try {
    lockAcquired = await acquireLock('wc26:lock:sync_fifa_rankings', 3600);
  } catch (error) {
    await insertAuditLog(supabase, 'fifa_ranking_sync_lock_unavailable', `FIFA ranking sync lock unavailable: ${error instanceof Error ? error.message : String(error)}. Continuing without lock.`, 'warning');
    lockAcquired = true;
  }

  if (!lockAcquired) {
    await insertAuditLog(supabase, 'sync_fifa_rankings_already_running', 'Skipped FIFA ranking sync because another run is already active.', 'warning');
    return jsonResponse({ alreadyRunning: true });
  }

  try {
    const rankingResponse = await fetch(FIFA_RANKINGS_URL, {
      headers: { 'User-Agent': 'Predict2026RankingSync/1.0' },
    });

    if (!rankingResponse.ok) {
      throw new Error(`Wikipedia ranking fetch failed with status ${rankingResponse.status}`);
    }

    const rankingSource = await rankingResponse.text();
    const rankings = buildRankingMap(rankingSource);
    if (rankings.byName.size < 100) {
      throw new Error(`Parsed only ${rankings.byName.size} FIFA ranking rows`);
    }

    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, name, short_name, country_code, fifa_rank');

    if (teamsError) throw teamsError;

    const updates: TeamUpdate[] = [];
    const unmatchedTeams: string[] = [];

    for (const team of (teams ?? []) as TeamRow[]) {
      const ranking = findRanking(team, rankings);
      if (!ranking) {
        if (!isPlaceholderTeam(team)) unmatchedTeams.push(team.short_name || team.name || team.id);
      } else if (team.fifa_rank !== ranking.rank) {
        updates.push({ id: team.id, fifa_rank: ranking.rank });
      }
    }

    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('teams')
        .update({ fifa_rank: update.fifa_rank })
        .eq('id', update.id);

      if (updateError) throw updateError;
    }

    await insertAuditLog(
      supabase,
      'fifa_ranking_sync_completed',
      `Synced ${updates.length} FIFA ranking updates from ${rankings.byName.size} parsed ranking rows. ${unmatchedTeams.length} teams were unmatched${unmatchedTeams.length ? `: ${unmatchedTeams.join(', ')}` : ''}.`,
      unmatchedTeams.length ? 'warning' : 'info',
    );

    return jsonResponse({
      parsedRankings: rankings.byName.size,
      updatedTeams: updates.length,
      unmatchedTeams,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown FIFA ranking sync error';
    await insertAuditLog(supabase, 'fifa_ranking_sync_failed', message, 'warning');
    return jsonResponse({ error: message }, 500);
  } finally {
    await releaseLock('wc26:lock:sync_fifa_rankings').catch((error) => {
      console.warn(`Failed to release FIFA ranking sync lock: ${error instanceof Error ? error.message : String(error)}`);
    });
  }
});
