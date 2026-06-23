import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const redisHelper = readFileSync('supabase/functions/_shared/redis.ts', 'utf8');
assert.match(redisHelper, /export async function acquireLock\(/, 'Redis helper must expose acquireLock.');
assert.match(redisHelper, /export async function releaseLock\(/, 'Redis helper must expose releaseLock.');
assert.match(redisHelper, /export async function getJson</, 'Redis helper must expose getJson.');
assert.match(redisHelper, /export async function setJson\(/, 'Redis helper must expose setJson.');
assert.match(redisHelper, /\['SET', key, lockValue, 'NX', 'EX', ttlSeconds\]/, 'acquireLock must use SET NX EX for atomic lock acquisition.');
assert.match(redisHelper, /\['GET', key\]/, 'releaseLock must read lock owner before deleting.');
assert.match(redisHelper, /\['DEL', key\]/, 'releaseLock must delete owned locks.');
assert.match(redisHelper, /JSON\.stringify\(value\)/, 'setJson must serialize cache values.');
assert.match(redisHelper, /JSON\.parse/, 'getJson must deserialize cache values.');

const lockTargets = [
  ['supabase/functions/sync_espn_results/index.ts', 'wc26:lock:sync_espn_results', 'sync_espn_results_already_running'],
  ['supabase/functions/sync_fifa_rankings/index.ts', 'wc26:lock:sync_fifa_rankings', 'sync_fifa_rankings_already_running'],
  ['supabase/functions/league_event_maintenance/index.ts', 'wc26:lock:league_event_maintenance', 'league_event_maintenance_already_running'],
  ['supabase/functions/recalculate_scores/index.ts', 'wc26:lock:recalculate_scores', 'score_recalculation_already_running'],
];

for (const [file, lockKey, auditAction] of lockTargets) {
  const source = readFileSync(file, 'utf8');
  assert.match(source, /acquireLock/, `${file} must acquire a Redis lock.`);
  assert.match(source, /releaseLock/, `${file} must release the Redis lock.`);
  assert.match(source, new RegExp(lockKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${file} must use lock key ${lockKey}.`);
  assert.match(source, new RegExp(auditAction), `${file} must audit lock skips with ${auditAction}.`);
  assert.match(source, /finally[\s\S]*releaseLock/, `${file} must release locks in a finally block.`);
  assert.match(source, /alreadyRunning: true/, `${file} must return an alreadyRunning response when locked.`);
}

console.log('Redis locks verified.');
