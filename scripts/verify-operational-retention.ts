import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { strict as assert } from 'node:assert';

const migrationDir = 'supabase/migrations';
const migrationFiles = readdirSync(migrationDir)
  .filter((file) => file.endsWith('.sql'))
  .map((file) => join(migrationDir, file));
const migrations = migrationFiles
  .map((file) => readFileSync(file, 'utf8'))
  .join('\n');

assert.match(migrations, /create or replace function public\.cleanup_old_operational_data\(\)/, 'Must define cleanup_old_operational_data().');
assert.match(migrations, /delete from public\.activity_events\s+where created_at < now\(\) - interval '90 days'/, 'Cleanup must delete only activity events older than 90 days.');
assert.match(migrations, /delete from public\.admin_audit_logs\s+where created_at < now\(\) - interval '180 days'/, 'Cleanup must delete only admin audit logs older than 180 days.');
assert.match(migrations, /return jsonb_build_object\([\s\S]*activity_deleted[\s\S]*audit_deleted/, 'Cleanup must return deleted row counts.');
assert.match(migrations, /revoke all on function public\.cleanup_old_operational_data\(\) from public, anon, authenticated/, 'Cleanup function must not be directly callable by public client roles.');

for (const table of ['profiles', 'predictions', 'prediction_scores', 'leaderboard_entries', 'matches', 'teams', 'league_members', 'league_events', 'league_event_entries', 'league_event_leaderboards']) {
  assert.doesNotMatch(migrations, new RegExp(`delete from public\\.${table}\\b`, 'i'), `Cleanup migration must not delete from core game table ${table}.`);
}

const maintenance = readFileSync('supabase/functions/league_event_maintenance/index.ts', 'utf8');
assert.match(maintenance, /cleanup_old_operational_data/, 'League event maintenance must call cleanup_old_operational_data().');
assert.match(maintenance, /cleanupResult/, 'Maintenance response must include cleanup result.');
assert.match(maintenance, /activityDeleted/, 'Maintenance response must expose deleted activity count.');
assert.match(maintenance, /auditDeleted/, 'Maintenance response must expose deleted audit count.');

console.log('Operational retention cleanup verified.');
