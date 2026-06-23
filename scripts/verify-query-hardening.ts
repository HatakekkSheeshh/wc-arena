import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const serviceFiles = [
  'src/services/activity.ts',
  'src/services/admin.ts',
  'src/services/badges.ts',
  'src/services/leaderboard.ts',
  'src/services/leagueEvents.ts',
  'src/services/leagues.ts',
  'src/services/matches.ts',
  'src/services/predictions.ts',
  'src/services/profile.ts',
  'src/services/rewards.ts',
  'src/services/teams.ts',
];

for (const file of serviceFiles) {
  const source = readFileSync(file, 'utf8');
  assert.doesNotMatch(source, /\.select\(['"]\*['"]\)/, `${file} must not use select('*').`);
}

const matches = readFileSync('src/services/matches.ts', 'utf8');
assert.match(matches, /MATCH_SUMMARY_FIELDS/, 'Matches service must define summary fields.');
assert.match(matches, /MATCH_DETAIL_FIELDS/, 'Matches service must define detail fields.');
assert.match(matches, /listMatches[\s\S]*\.select\(MATCH_SUMMARY_FIELDS\)[\s\S]*\.limit\(128\)/, 'listMatches must use summary fields and a bounded World Cup limit.');
assert.match(matches, /getMatch[\s\S]*\.select\(MATCH_DETAIL_FIELDS\)/, 'getMatch must use detail fields.');

const leaderboard = readFileSync('src/services/leaderboard.ts', 'utf8');
assert.match(leaderboard, /listGlobalLeaderboard[\s\S]*\.limit\(100\)/, 'Global leaderboard must be limited to 100 rows.');
assert.match(leaderboard, /listLeagueLeaderboard[\s\S]*\.limit\(100\)/, 'League leaderboard must be limited to 100 rows.');

const activity = readFileSync('src/services/activity.ts', 'utf8');
assert.match(activity, /listCurrentUserActivity[\s\S]*\.limit\(50\)/, 'Current user activity must be limited to 50 rows.');

const leagues = readFileSync('src/services/leagues.ts', 'utf8');
assert.match(leagues, /listLeagues[\s\S]*\.limit\(100\)/, 'Public league list must be limited to 100 rows.');

const admin = readFileSync('src/services/admin.ts', 'utf8');
assert.match(admin, /listAdminAuditLogs[\s\S]*\.limit\(100\)/, 'Admin audit logs must be limited to 100 rows.');
assert.match(admin, /listRewardReviewsForAdmin[\s\S]*\.limit\(100\)/, 'Admin reward reviews must be limited to 100 rows.');

const rewards = readFileSync('src/services/rewards.ts', 'utf8');
assert.match(rewards, /listCurrentUserRewardReviews[\s\S]*\.limit\(100\)/, 'Reward review list must be limited to 100 rows.');

console.log('Query hardening verified.');
