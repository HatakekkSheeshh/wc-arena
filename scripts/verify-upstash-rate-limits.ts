import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const redisHelper = readFileSync('supabase/functions/_shared/redis.ts', 'utf8');
assert.match(redisHelper, /UPSTASH_REDIS_REST_URL/, 'Redis helper must read UPSTASH_REDIS_REST_URL server-side.');
assert.match(redisHelper, /UPSTASH_REDIS_REST_TOKEN/, 'Redis helper must read UPSTASH_REDIS_REST_TOKEN server-side.');
assert.match(redisHelper, /Authorization: `Bearer \$\{token\}`/, 'Redis helper must authenticate Upstash REST calls with bearer token.');
assert.match(redisHelper, /redisCommand/, 'Redis helper must expose redisCommand.');

const rateLimitHelper = readFileSync('supabase/functions/_shared/rateLimit.ts', 'utf8');
assert.match(rateLimitHelper, /checkRateLimit/, 'Rate limit helper must expose checkRateLimit.');
assert.match(rateLimitHelper, /wc26:rate:\$\{action\}:\$\{key\}:\$\{windowStart\}/, 'Rate limit keys must be namespaced by action, key, and window.');
assert.match(rateLimitHelper, /INCR/, 'Rate limit helper must increment a Redis counter.');
assert.match(rateLimitHelper, /EXPIRE/, 'Rate limit helper must expire Redis counters.');
assert.match(rateLimitHelper, /allowed: true/, 'Rate limit helper must fail open when Redis is unavailable.');

const userMutationFunctions = [
  ['supabase/functions/submit_prediction/index.ts', 'submit_prediction'],
  ['supabase/functions/claim_daily_login_reward/index.ts', 'claim_daily_login_reward'],
  ['supabase/functions/manage_league/index.ts', 'manage_league'],
];

for (const [file, action] of userMutationFunctions) {
  const source = readFileSync(file, 'utf8');
  assert.match(source, /checkRateLimit/, `${file} must call checkRateLimit.`);
  assert.match(source, new RegExp(`action: '${action}'`), `${file} must use the ${action} rate limit action.`);
  assert.match(source, /status: 429|, 429\)/, `${file} must return HTTP 429 when limited.`);
}

const clientSources = [
  'src/lib/supabaseClient.ts',
  'src/services/predictions.ts',
  'src/services/leagues.ts',
  'src/services/profile.ts',
];
for (const file of clientSources) {
  const source = readFileSync(file, 'utf8');
  assert.doesNotMatch(source, /UPSTASH_REDIS_REST_TOKEN|UPSTASH_REDIS_REST_URL/, `${file} must not reference Upstash server secrets.`);
}

console.log('Upstash rate limits verified.');
