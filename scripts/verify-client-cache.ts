import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const cache = readFileSync('src/services/cache.ts', 'utf8');
assert.match(cache, /type CacheEntry<T>/, 'Cache helper must define typed entries.');
assert.match(cache, /const memoryCache = new Map<string, CacheEntry<unknown>>\(\)/, 'Cache helper must keep an in-memory map.');
assert.match(cache, /export async function cached<T>/, 'Cache helper must expose cached().');
assert.match(cache, /current\.expiresAt > Date\.now\(\)/, 'cached() must return non-expired values.');
assert.match(cache, /loader\(\)/, 'cached() must call the loader on cache miss.');
assert.match(cache, /memoryCache\.set\(key, \{ value, expiresAt: Date\.now\(\) \+ ttlMs \}\)/, 'cached() must store values with TTL.');
assert.match(cache, /export function invalidateCache\(prefix\?: string\)/, 'Cache helper must expose invalidateCache().');
assert.match(cache, /memoryCache\.clear\(\)/, 'invalidateCache() must clear all entries without a prefix.');
assert.match(cache, /key\.startsWith\(prefix\)/, 'invalidateCache() must support prefix invalidation.');

const expectedCachedServices = [
  ['src/services/teams.ts', 'listTeams', "cached('teams:list'", '86_400_000'],
  ['src/services/matches.ts', 'listMatches', "cached('matches:list'", '300_000'],
  ['src/services/matches.ts', 'getMatch', "cached(`matches:detail:${matchId}`", '60_000'],
  ['src/services/badges.ts', 'listBadgeCatalog', "cached('badges:catalog'", '86_400_000'],
  ['src/services/leaderboard.ts', 'listGlobalLeaderboard', "cached('leaderboard:global'", '60_000'],
  ['src/services/leaderboard.ts', 'listLeagueLeaderboard', "cached(`leaderboard:league:${leagueId}`", '60_000'],
  ['src/services/leagues.ts', 'listLeagues', "cached('leagues:list'", '300_000'],
] as const;

for (const [file, functionName, cacheKey, ttl] of expectedCachedServices) {
  const source = readFileSync(file, 'utf8');
  assert.match(source, /from '\.\/cache'/, `${file} must import cache helpers.`);
  assert.match(source, new RegExp(`export async function ${functionName}[\\s\\S]*${escapeRegExp(cacheKey)}`), `${functionName} must use cache key ${cacheKey}.`);
  assert.match(source, new RegExp(`export async function ${functionName}[\\s\\S]*${ttl}`), `${functionName} must use TTL ${ttl}.`);
}

const predictions = readFileSync('src/services/predictions.ts', 'utf8');
assert.match(predictions, /from '\.\/cache'/, 'Prediction service must import cache invalidation.');
assert.match(predictions, /submitPrediction[\s\S]*invalidateCache\('matches:'\)/, 'Submitting a prediction must invalidate match caches.');
assert.match(predictions, /submitPrediction[\s\S]*invalidateCache\('leaderboard:'\)/, 'Submitting a prediction must invalidate leaderboard caches.');

const dailyLoginReward = readFileSync('src/services/dailyLoginReward.ts', 'utf8');
assert.match(dailyLoginReward, /from '\.\/cache'/, 'Daily reward service must import cache invalidation.');
assert.match(dailyLoginReward, /claimDailyLoginReward[\s\S]*invalidateCache\('leaderboard:'\)/, 'Claiming a daily reward must invalidate leaderboard caches.');

const leagues = readFileSync('src/services/leagues.ts', 'utf8');
for (const functionName of ['createLeague', 'joinLeague', 'approveJoinRequest', 'rejectJoinRequest', 'updateLeague', 'kickLeagueMember', 'leaveLeague', 'archiveLeague', 'deleteArchivedLeague']) {
  assert.match(leagues, new RegExp(`${functionName}[\\s\\S]*invalidateCache\\('leagues:'\\)`), `${functionName} must invalidate league list caches.`);
}

const admin = readFileSync('src/services/admin.ts', 'utf8');
assert.match(admin, /updateMatchResult[\s\S]*invalidateCache\('matches:'\)/, 'Admin match result updates must invalidate match caches.');
assert.match(admin, /updateMatchResult[\s\S]*invalidateCache\('leaderboard:'\)/, 'Admin match result updates must invalidate leaderboard caches.');
assert.match(admin, /recalculateScores[\s\S]*invalidateCache\('leaderboard:'\)/, 'Score recalculation must invalidate leaderboard caches.');

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

console.log('Client cache verified.');
