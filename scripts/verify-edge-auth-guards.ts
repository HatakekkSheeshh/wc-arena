import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const sharedGuards = readFileSync('supabase/functions/_shared/authGuards.ts', 'utf8');
assert.match(sharedGuards, /requireAuthenticatedUser/, 'Shared auth guards must expose requireAuthenticatedUser.');
assert.match(sharedGuards, /requireAdminUser/, 'Shared auth guards must expose requireAdminUser.');
assert.match(sharedGuards, /requireSyncSecret/, 'Shared auth guards must expose requireSyncSecret.');
assert.match(sharedGuards, /Missing sync secret config/, 'Sync secret guard must fail closed when the env secret is missing.');
assert.match(sharedGuards, /x-sync-secret[\s\S]*x-cron-secret|x-cron-secret[\s\S]*x-sync-secret/, 'Sync secret guard must accept sync or cron secret headers.');

const authenticatedFunctions = [
  'supabase/functions/submit_prediction/index.ts',
  'supabase/functions/claim_daily_login_reward/index.ts',
  'supabase/functions/manage_league/index.ts',
];

for (const file of authenticatedFunctions) {
  const source = readFileSync(file, 'utf8');
  assert.match(source, /requireAuthenticatedUser\(req, corsHeaders\)/, `${file} must require an authenticated Supabase user.`);
}

const adminFunctions = [
  'supabase/functions/update_match_result/index.ts',
  'supabase/functions/recalculate_scores/index.ts',
];

for (const file of adminFunctions) {
  const source = readFileSync(file, 'utf8');
  assert.match(source, /requireAdminUser\(req, corsHeaders\)/, `${file} must require an admin profile.`);
  assert.doesNotMatch(source, /\.select\('role'\)/, `${file} should use the shared admin guard instead of duplicating role checks.`);
}

const syncFunctions = new Map([
  ['supabase/functions/sync_espn_results/index.ts', 'ESPN_SYNC_SECRET'],
  ['supabase/functions/sync_fifa_rankings/index.ts', 'FIFA_RANKING_SYNC_SECRET'],
  ['supabase/functions/league_event_maintenance/index.ts', 'LEAGUE_EVENT_SYNC_SECRET'],
]);

for (const [file, envName] of syncFunctions) {
  const source = readFileSync(file, 'utf8');
  assert.match(source, new RegExp(`requireSyncSecret\\(req, corsHeaders, '${envName}'\\)`), `${file} must require ${envName}.`);
  assert.doesNotMatch(source, new RegExp(`if \\(.*${envName}.*&&`), `${file} must not fail open when ${envName} is missing.`);
}

console.log('Edge auth guards verified.');
