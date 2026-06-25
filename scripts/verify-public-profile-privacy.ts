import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const migration = readdirSync('supabase/migrations')
  .filter((file) => file.endsWith('_public_user_prediction_history.sql'))
  .sort()
  .at(-1);

assert.ok(migration, 'A public user prediction history migration must exist.');

const migrationSource = readFileSync(`supabase/migrations/${migration}`, 'utf8');
assert.match(migrationSource, /create or replace function public\.get_public_user_prediction_history/, 'Migration must create the public prediction history RPC.');
assert.match(migrationSource, /security definer/, 'Public prediction history RPC must use a controlled security-definer surface.');
assert.match(migrationSource, /join public\.prediction_scores ps on ps\.prediction_id = p\.id/, 'RPC must require prediction_scores rows.');
assert.match(migrationSource, /m\.status = 'finished'/, 'RPC must only expose finished matches.');
assert.match(migrationSource, /m\.home_score is not null/, 'RPC must require a final home score.');
assert.match(migrationSource, /m\.away_score is not null/, 'RPC must require a final away score.');
assert.match(migrationSource, /ps\.calculated_at is not null/, 'RPC must require calculated scores.');
assert.match(migrationSource, /limit least\(greatest\(row_limit, 1\), 128\)/, 'RPC must clamp row_limit.');
assert.match(migrationSource, /grant execute on function public\.get_public_user_prediction_history\(uuid, integer\) to anon, authenticated/, 'RPC must be executable by public clients.');
assert.doesNotMatch(migrationSource, /profile\.email|\bemail\b/, 'RPC must not expose profile email.');
assert.doesNotMatch(migrationSource, /create policy predictions_.*to anon|create policy prediction_scores_.*to anon/, 'Migration must not add public table-read policies for private prediction tables.');
assert.doesNotMatch(migrationSource, /grant select on public\.(predictions|prediction_scores)/, 'Migration must not grant direct prediction table reads.');

const coreSchema = readFileSync('supabase/migrations/20260618023608_create_core_schema.sql', 'utf8');
assert.match(coreSchema, /create policy predictions_read_own[\s\S]*for select to authenticated[\s\S]*auth\.uid\(\)\) = user_id/, 'Predictions owner-only read policy must remain documented in core schema.');
assert.match(coreSchema, /create policy prediction_scores_read_own[\s\S]*for select to authenticated[\s\S]*p\.user_id = \(select auth\.uid\(\)\)/, 'Prediction scores owner-only read policy must remain documented in core schema.');

assert.ok(existsSync('src/services/publicPredictions.ts'), 'Public prediction history service must exist.');
const publicPredictionService = readFileSync('src/services/publicPredictions.ts', 'utf8');
assert.match(publicPredictionService, /rpc\('get_public_user_prediction_history'/, 'Public prediction history service must call the safe RPC.');
assert.doesNotMatch(publicPredictionService, /\.select\(['"]\*['"]\)/, 'Public prediction history service must not use select("*").');
assert.doesNotMatch(publicPredictionService, /email/, 'Public prediction history service must not reference email.');

const profileService = readFileSync('src/services/profile.ts', 'utf8');
assert.match(profileService, /PUBLIC_PROFILE_FIELDS = 'id, username, display_name, avatar_url, country_code, fan_club_team_id, points, rank, accuracy, exact_scores, current_streak, best_streak, created_at'/, 'Profile service must define public profile fields without email.');
assert.match(profileService, /getPublicProfile/, 'Profile service must expose getPublicProfile.');
assert.doesNotMatch(profileService.match(/PUBLIC_PROFILE_FIELDS[^;]+/)?.[0] ?? '', /email|role/, 'Public profile fields must not include email or role.');

assert.ok(existsSync('src/pages/PublicProfile.tsx'), 'Public profile page must exist.');
const publicProfilePage = readFileSync('src/pages/PublicProfile.tsx', 'utf8');
assert.match(publicProfilePage, /getPublicUserPredictionHistory/, 'Public profile page must load the safe public prediction history.');
assert.match(publicProfilePage, /Only finished matches with calculated score rows are shown here/, 'Public profile page must explain prediction privacy.');
assert.doesNotMatch(publicProfilePage, /\/predictions\/\$\{/, 'Public profile page must not link to private prediction breakdowns.');
assert.doesNotMatch(publicProfilePage, /email/, 'Public profile page must not reference email.');

const app = readFileSync('src/App.tsx', 'utf8');
assert.match(app, /path="\/users\/:userId"/, 'App must expose a public user profile route.');

const leaderboard = readFileSync('src/Leaderboard.tsx', 'utf8');
assert.match(leaderboard, /to=\{getProfilePath/, 'Leaderboard must link users to public profile pages.');

console.log('Public profile privacy verified.');
