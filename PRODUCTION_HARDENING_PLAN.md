# Production Hardening Plan for Vercel + Supabase + Upstash Free Plans

## Goal

Prepare Predict 2026 for a more production-ready public launch while staying realistic for Vercel Hobby/free, Supabase Free, and Upstash Redis Free limits.

The goal is to reduce unnecessary load, protect service-role backend paths, limit abuse, keep the database small, and improve operational safety without changing the core game logic. Upstash Redis should be used as a small backend protection layer for rate limits, short-lived locks, and selected cache keys, not as the source of truth for game data.

## Current free-plan constraints

### Vercel Hobby/free

- Good fit for a static Vite React SPA served through Vercel CDN.
- Around 100GB monthly bandwidth on Hobby.
- Around 1M Edge requests/month.
- Includes automated DDoS mitigation and basic WAF/Attack Challenge protections.
- Custom firewall/IP blocking rules are limited.
- Hobby is intended for personal/non-commercial use.

### Supabase Free

- 500MB database.
- 5GB egress.
- 50k monthly active auth users.
- Around 500k Edge Function invocations.
- 2 active free projects.
- Inactive free projects may pause.

### Upstash Redis Free

- 10,000 commands per second.
- 10MB max request size.
- 100MB max record size.
- 256MB total data size.
- 50GB monthly bandwidth.
- Good fit for backend rate limits, short-lived anti-abuse counters, small locks, and tiny cached JSON snapshots.
- Not a source of truth for predictions, scores, leagues, profiles, or match data.

## Important architecture note

The app currently uses Supabase directly from the browser via `supabase-js`, which is normal for Supabase apps.

That means Vercel protects the SPA/static assets, but it does not protect direct calls to Supabase REST/RPC/Edge Function URLs. Real protection must come from:

- RLS policies.
- Database constraints.
- Edge Function authorization checks.
- Edge Function rate limits.
- Supabase Auth rate limits.
- Upstash Redis rate limits and short-lived coordination keys for backend functions.
- Small, bounded queries.

Do not proxy the whole Supabase API through Vercel Functions on the free plan. That would add latency, consume Vercel function quotas, and still require the same database protections.

Use Upstash only from trusted backend code such as Supabase Edge Functions or server-only maintenance scripts. Never expose `UPSTASH_REDIS_REST_TOKEN` in the browser/Vite client.

---

## Will this affect game logic or UI/UX?

Most of this plan should not change core game behavior if implemented carefully.

| Area | Affects game logic? | Affects UI/UX? | Notes |
|---|---:|---:|---|
| Replace `select('*')` with explicit fields | No | No | Must include all fields currently rendered. |
| Add `.limit()` to list queries | No | Slight | Very old/long lists may need pagination later. |
| Client caching | No | Slight | Some data can be stale for 30-60 seconds. |
| Upstash Redis backend caching | No | Slight | Only use for short-lived public snapshots; bypass after mutations when needed. |
| Edge Function rate limiting | No | Only on spam | Normal users should not hit limits. |
| Upstash Redis locks for cron/admin jobs | No | No | Prevents duplicate sync/recalculation runs. |
| Admin/cron guards | No | No | Protects privileged backend actions. |
| Retention cleanup | No | Slight | Old activity/audit records may disappear. |
| Security headers | No | No if basic headers only | CSP should be introduced carefully later. |
| Asset optimization | No | Improves UX | Smaller images and faster load. |
| CAPTCHA/email confirmation | No | Yes | Adds signup/login friction, so do this later. |

Recommended rollout: do safe backend/performance work first; leave CAPTCHA/email confirmation until public traffic or spam requires it.

---

## Phase 1: Reduce read payload safely

### Objective

Reduce Supabase egress and browser payloads by avoiding broad `select('*')` calls and bounding public reads.

### Relevant files

- `src/services/matches.ts`
- `src/services/teams.ts`
- `src/services/leaderboard.ts`
- `src/services/activity.ts`
- `src/services/leagues.ts`
- `src/services/leagueEvents.ts`
- `src/services/predictions.ts`
- `src/services/profile.ts`
- `src/services/rewards.ts`
- `src/services/admin.ts`

### 1.1 Split match summary and match detail fields

Current concern: `listMatches()` uses `select('*')`, which can pull heavy fields like `espn_summary` for every match.

Create explicit field constants in `src/services/matches.ts`:

```ts
const MATCH_SUMMARY_FIELDS = `
  id,
  home_team_id,
  away_team_id,
  kickoff_at,
  lock_at,
  status,
  stage,
  group_code,
  matchday,
  stadium,
  city,
  home_score,
  away_score,
  espn_state,
  espn_status,
  espn_status_detail,
  espn_display_clock,
  espn_home_win_pct,
  espn_draw_pct,
  espn_away_win_pct
`;

const MATCH_DETAIL_FIELDS = `
  *,
  espn_summary
`;
```

Prefer making `MATCH_DETAIL_FIELDS` explicit too if practical.

Use summary fields for:

- `/matches`
- `/picks`
- group standings/recent group matches
- lightweight dashboard cards

Use detail fields for:

- `/matches/:matchId`

### 1.2 Add limits to public list queries

Add `.limit(...)` to public or frequently used list queries.

Suggested limits:

| Query | Limit |
|---|---:|
| Global leaderboard | 100 |
| League leaderboard | 100 |
| Activity feed | 50 |
| League activity | 50 |
| Public leagues | 100 |
| Admin audit logs | 100 |
| Rewards/reviews lists | 100 |

### Verification

Run:

```bash
npm run lint
npm run build
```

Manual smoke checks:

1. `/matches` renders fixture list.
2. `/picks` renders matches, teams, ESPN percentages, and save buttons.
3. `/matches/wc2026-069` renders match detail, ESPN signal, community signal, group standings, recent group matches.
4. `/leaderboard` renders top players.
5. `/leagues` and league detail still render.

### Expected UX impact

No visible change if all currently rendered fields are included. Pages should load faster and consume less Supabase egress.

---

## Phase 2: Add Edge Function authorization guards

### Objective

Protect all service-role Edge Functions. Any function using `SUPABASE_SERVICE_ROLE_KEY` must explicitly verify who is calling it.

### Relevant files

- `supabase/functions/_shared/authGuards.ts`
- `supabase/functions/update_match_result/index.ts`
- `supabase/functions/recalculate_scores/index.ts`
- `supabase/functions/sync_espn_results/index.ts`
- `supabase/functions/sync_fifa_rankings/index.ts`
- `supabase/functions/league_event_maintenance/index.ts`
- `supabase/functions/manage_league/index.ts`
- `supabase/functions/submit_prediction/index.ts`
- `supabase/functions/claim_daily_login_reward/index.ts`

### Function classification

#### Public authenticated functions

- `submit_prediction`
- `claim_daily_login_reward`

Requirements:

- Valid Supabase auth user.
- Rate limit in Phase 3.

#### User authenticated mutation function

- `manage_league`

Requirements:

- Valid Supabase auth user.
- Action-specific ownership/member checks.
- Rate limit in Phase 3.

#### Admin-only functions

- `update_match_result`
- `recalculate_scores`

Requirements:

- Valid Supabase auth user.
- `profiles.role = 'admin'`.

#### Cron/secret-only functions

- `sync_espn_results`
- `sync_fifa_rankings`
- `league_event_maintenance`

Requirements:

- Header `x-cron-secret` equals `Deno.env.get('CRON_SECRET')`.

### Shared helper design

Create `supabase/functions/_shared/authGuards.ts` with helpers like:

```ts
export function jsonResponse(body: unknown, status = 200): Response;

export function getBearerToken(req: Request): string | null;

export async function requireUser(
  req: Request,
  supabase: SupabaseClient,
): Promise<{ user: User } | Response>;

export async function requireAdmin(
  req: Request,
  supabase: SupabaseClient,
): Promise<{ user: User } | Response>;

export function requireCronSecret(req: Request): Response | null;
```

Implementation details:

- `requireUser` uses `supabase.auth.getUser(token)`.
- `requireAdmin` fetches `profiles.role` for the user.
- `requireCronSecret` returns `401` when missing/invalid.
- Do not trust client-provided role or metadata.

### Verification

Manual/API checks:

1. Normal signed-in user can call `submit_prediction`.
2. Anonymous request to `submit_prediction` returns `401`.
3. Normal user calling `recalculate_scores` returns `403`.
4. Admin user can call `recalculate_scores`.
5. Cron function without `x-cron-secret` returns `401`.
6. Cron function with correct secret runs.

### Expected UX impact

No impact for normal users. Admin/cron workflows need correct credentials/secrets.

---

## Phase 3: Add Upstash Redis-backed rate limiting

### Objective

Prevent spam or accidental abuse of mutation Edge Functions without consuming Supabase database storage/write budget for short-lived counters.

Upstash Redis is a better fit than Postgres for this app because rate-limit keys are temporary, high-churn, and not part of core game state.

### Environment variables

Store these only in Supabase Edge Function secrets and any server-only deployment environment that calls Redis:

```bash
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

Do not add these to Vite `.env` files with `VITE_` prefixes. The browser must never receive the Redis token.

### Shared helper design

Create `supabase/functions/_shared/rateLimit.ts` with a small REST-based helper rather than adding a Postgres table:

```ts
type RateLimitOptions = {
  key: string;
  action: string;
  windowSeconds: number;
  maxCount: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

export async function checkRateLimit(options: RateLimitOptions): Promise<RateLimitResult>;
```

Implementation approach:

- Build Redis keys as `wc26:rate:${action}:${key}:${windowStart}`.
- Use Upstash Redis REST commands from Edge Functions.
- Use `INCR` for the counter and `EXPIRE` on the first hit.
- Return `allowed = count <= maxCount`.
- If Redis is temporarily unavailable, fail open for normal user actions but log the error; do not block all predictions because of Redis downtime.
- For admin or cron abuse controls, fail closed only when the operation is dangerous and there is already an explicit admin/cron auth guard.

### Suggested limits

| Action | Limit |
|---|---:|
| `submit_prediction` | 60 requests / 5 minutes / user |
| `claim_daily_login_reward` | 10 requests / 5 minutes / user |
| `manage_league` | 30 requests / 5 minutes / user |
| admin mutations | 20 requests / 5 minutes / admin |
| unauthenticated fallback by IP | 30 requests / 5 minutes / IP |

### Suggested Edge Function usage

Apply after authentication when possible, so user id is the primary key:

```ts
const rateLimit = await checkRateLimit({
  key: user.id,
  action: 'submit_prediction',
  windowSeconds: 300,
  maxCount: 60,
});

if (!rateLimit.allowed) {
  return jsonResponse({ error: 'Too many requests. Please wait a minute and try again.' }, 429);
}
```

Use IP-based fallback only before authentication or for anonymous endpoints:

```ts
const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
```

### Optional Postgres fallback

Do not create the Postgres `edge_rate_limits` table in the first pass if Upstash is available. Keep Postgres fallback as an emergency option only if Upstash is removed later.

### Verification

1. Normal submit works.
2. Repeated calls over limit return `429`.
3. After window reset, calls work again.
4. Failed rate-limit check does not mutate game state.
5. Missing Redis env vars in local development do not crash unrelated local flows.
6. Redis keys expire automatically and do not grow beyond the free 256MB data size.

### Expected UX impact

Only users who spam actions should see a wait message.

---

## Phase 4: Add operational retention cleanup

### Objective

Keep the Supabase Free 500MB database from filling with operational logs.

### Candidate tables

- `activity_events`
- `admin_audit_logs`
- possibly `user_trust_signals` if it grows quickly

Rate-limit counters should live in Upstash Redis with TTLs, so they should not consume Supabase database space.

Do not delete core game data:

- `profiles`
- `predictions`
- `prediction_scores`
- `leaderboard_entries`
- `matches`
- `teams`
- league membership/event scoring records unless there is a separate archive design

### Cleanup function

Create a SQL function:

```sql
create or replace function public.cleanup_old_operational_data()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_activity_deleted integer;
  v_audit_deleted integer;
begin
  delete from public.activity_events
  where created_at < now() - interval '90 days';
  get diagnostics v_activity_deleted = row_count;

  delete from public.admin_audit_logs
  where created_at < now() - interval '180 days';
  get diagnostics v_audit_deleted = row_count;

  return jsonb_build_object(
    'activity_deleted', v_activity_deleted,
    'audit_deleted', v_audit_deleted
  );
end;
$$;
```

Call this from `league_event_maintenance` or a dedicated scheduled maintenance function.

### Verification

1. Insert old test rows in a local/staging DB.
2. Run cleanup.
3. Confirm only old operational rows are deleted.
4. Confirm predictions/scores/leaderboards are untouched.

### Expected UX impact

Old activity/audit history disappears after retention windows. Core game history remains.

---

## Phase 5: Add Upstash Redis locks and small backend cache

### Objective

Use the existing Upstash Redis Free plan to reduce duplicate backend work and protect scheduled/admin operations, without moving core game state out of Supabase.

### Good Redis use cases

| Use case | Redis key type | TTL | Notes |
|---|---|---:|---|
| ESPN sync lock | `wc26:lock:sync_espn_results` | 5-10 minutes | Prevents overlapping cron/manual sync runs. |
| FIFA sync lock | `wc26:lock:sync_fifa_rankings` | 30-60 minutes | Prevents duplicate ranking syncs. |
| Recalculate scores lock | `wc26:lock:recalculate_scores` | 5-10 minutes | Avoids concurrent expensive recalculations. |
| Public leaderboard snapshot | `wc26:cache:leaderboard:global` | 30-60 seconds | Optional backend cache for expensive leaderboard reads. |
| Public match summary snapshot | `wc26:cache:matches:summary` | 1-5 minutes | Optional only if Supabase egress becomes a problem. |

### Bad Redis use cases

Do not store these only in Redis:

- predictions
- prediction scores
- leaderboard entries as source of truth
- profiles
- league memberships
- league pool entries
- match results
- audit logs that must survive cache eviction

Redis Free has 256MB data size and is optimized here for temporary protection/caching, not durable game records.

### Shared helper design

Create `supabase/functions/_shared/redis.ts` with server-only helpers:

```ts
export async function redisCommand<T>(command: unknown[]): Promise<T>;
export async function acquireLock(key: string, ttlSeconds: number): Promise<boolean>;
export async function releaseLock(key: string): Promise<void>;
export async function getJson<T>(key: string): Promise<T | null>;
export async function setJson(key: string, value: unknown, ttlSeconds: number): Promise<void>;
```

Implementation notes:

- Use Upstash Redis REST URL/token from Edge Function env vars.
- Use `SET key value NX EX ttl` for lock acquisition.
- Locks should be best-effort; still keep idempotent database updates.
- Cache only data that is safe to be stale for the listed TTL.
- Invalidate or bypass cache after writes when stale data would confuse the current user.

### Verification

1. Trigger two ESPN sync calls close together and confirm one exits early with a lock response.
2. Confirm lock key expires after TTL.
3. Confirm leaderboard cache returns data and refreshes after TTL.
4. Confirm prediction submit and score recalculation still use Supabase as source of truth.

### Expected UX impact

No expected UX change. The app should become more stable under repeated cron/manual actions.

---

## Phase 6: Add client-side cache for low-change data

### Objective

Reduce repeated Supabase reads as users navigate between pages.

### Relevant files

- `src/services/cache.ts` (new)
- `src/services/teams.ts`
- `src/services/matches.ts`
- `src/services/leaderboard.ts`
- `src/services/badges.ts`
- possibly `src/services/leagues.ts`

### Simple cache helper

```ts
type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const memoryCache = new Map<string, CacheEntry<unknown>>();

export async function cached<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<T> {
  const current = memoryCache.get(key) as CacheEntry<T> | undefined;
  if (current && current.expiresAt > Date.now()) return current.value;

  const value = await loader();
  memoryCache.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

export function invalidateCache(prefix?: string) {
  if (!prefix) {
    memoryCache.clear();
    return;
  }

  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) memoryCache.delete(key);
  }
}
```

### Suggested TTLs

| Data | TTL |
|---|---:|
| Teams | 24 hours |
| Match summaries | 5 minutes |
| Match detail | 1 minute |
| Leaderboard | 30-60 seconds |
| Badges catalog | 24 hours |
| Public leagues | 1-5 minutes |

### Cache invalidation

Invalidate or bypass cache after:

- prediction submit
- daily reward claim
- league join/create/update
- admin match result update
- scoring recalculation

### Verification

1. Navigate between pages and confirm repeated reads are reduced.
2. Submit a prediction and confirm the current user's predictions refresh.
3. Leaderboard can remain stale for TTL but refreshes after reload/TTL.

### Expected UX impact

Faster navigation. Some non-critical public data may be stale for a short time.

---

## Phase 7: Add Vercel security headers

### Objective

Add safe baseline browser security headers without risking auth/assets.

### File

- `vercel.json`

### Suggested config

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    }
  ]
}
```

Do not add a strict CSP in the first pass. CSP can break Supabase auth, Google auth, images, and scripts if incomplete.

### Verification

1. SPA routes still work after deployment.
2. Login/register/auth callback still work.
3. Assets load correctly.
4. Browser devtools show the new headers.

### Expected UX impact

No expected UX change.

---

## Phase 8: Optimize large assets

### Objective

Reduce Vercel bandwidth and improve mobile load times.

### Plan

1. Review large PNG assets in build output.
2. Convert large static PNGs to WebP or AVIF when visually acceptable.
3. Lazy-load route-specific images.
4. Avoid importing all badge/achievement images into the initial route if possible.

### Verification

Run:

```bash
npm run build
```

Smoke check routes:

- `/`
- `/badges`
- `/achievements`
- `/profile`
- prediction share modal

### Expected UX impact

Improved load time and lower bandwidth. Visuals should remain equivalent.

---

## Phase 9: Auth hardening

### Objective

Reduce signup/login abuse when public traffic grows.

### Recommended changes

Consider in Supabase dashboard/config:

```toml
[auth]
minimum_password_length = 8

[auth.email]
enable_confirmations = true
max_frequency = "60s"
```

Optional CAPTCHA:

```toml
[auth.captcha]
enabled = true
provider = "turnstile"
```

### Rollout guidance

Do this after the non-UX-impacting phases unless spam appears.

Email confirmation and CAPTCHA increase friction, so test with production domain and all auth providers before enabling widely.

### Verification

1. Email signup works.
2. Email confirmation redirect works.
3. Login works.
4. Password reset works.
5. Google login works.
6. Remember-me/session behavior still works.

### Expected UX impact

Noticeable for new users. Existing signed-in users mostly unaffected.

---

## Phase 10: Monitoring and operations checklist

### Objective

Track free-plan usage manually without adding paid monitoring infrastructure, and keep a repeatable response checklist for deploys, incidents, and rollbacks.

### Daily launch checks

- Open production `/`, `/matches`, `/picks`, `/leaderboard`, `/leagues`, and `/profile` with a normal signed-in account.
- Confirm Vercel deployment status is Ready for the latest expected Git commit.
- Confirm recent Supabase Edge Function errors do not show new auth, CORS, Redis, or scoring failures.
- Confirm scheduled jobs are not repeatedly failing or overlapping.
- Confirm no unexpected spike in Supabase egress, Edge Function invocations, or Upstash Redis command usage.
- Do not print or commit Supabase secrets, Upstash tokens, or sync secrets.

### Weekly Supabase checks

- DB size / 500MB.
- Egress / 5GB.
- Edge Function invocations / 500k.
- Auth MAU / 50k.
- Supabase Edge Function errors for `submit_prediction`, `claim_daily_login_reward`, `manage_league`, `sync_espn_results`, `sync_fifa_rankings`, `recalculate_scores`, and `league_event_maintenance`.
- Slow queries / database advisors.
- Table growth for `activity_events` and `admin_audit_logs` after retention cleanup.
- RLS and policy advisor warnings after schema changes.

Recommended command checks:

```bash
supabase functions list
supabase db lint --linked --schema public --fail-on error
```

### Weekly Vercel checks

- Vercel deployment status for the latest `master` deployment.
- Bandwidth / 100GB.
- Edge requests / 1M.
- Build/deploy errors.
- Largest build assets from the latest `npm run build` output.
- Route health for SPA fallback on `/matches`, `/matches/wc2026-063`, `/picks`, `/leagues`, and `/points-guide`.
- Browser devtools response headers include the configured security headers.

### Weekly Upstash checks

- Upstash Redis command usage is comfortably below the free quota.
- Upstash Redis bandwidth is comfortably below the free quota.
- Data size remains small because rate-limit keys and lock keys have TTLs.
- No long-lived `wc26:lock:*` keys remain after cron/admin jobs complete.
- No `UPSTASH_REDIS_REST_TOKEN` appears in frontend code, Vite env vars, logs, or committed files.

### Cron and Edge Function health checks

- `sync_espn_results` updates recently completed/live matches and does not overlap under lock.
- `sync_fifa_rankings` runs on schedule and does not overwrite manual team identity fields.
- `league_event_maintenance` settles eligible events and calls retention cleanup.
- `recalculate_scores` only runs manually/admin-triggered and exits cleanly when another run already holds the lock.
- Cron functions reject requests without `x-cron-secret`.
- Admin functions reject non-admin users.

### Manual recovery commands

Use these local verification commands before and after production-risk changes:

```bash
npx tsx scripts/verify-query-hardening.ts
npx tsx scripts/verify-edge-auth-guards.ts
npx tsx scripts/verify-upstash-rate-limits.ts
npx tsx scripts/verify-redis-locks.ts
npx tsx scripts/verify-client-cache.ts
npx tsx scripts/verify-vercel-security-headers.ts
npx tsx scripts/verify-asset-size-budget.ts
npx tsx scripts/verify-auth-hardening.ts
npm run lint
npm run build
```

Use Supabase CLI inspection commands when backend behavior looks wrong:

```bash
supabase functions list
supabase db lint --linked --schema public --fail-on error
```

### Incident response checklist

1. Identify the affected surface: Vercel static app, Supabase Data API/RLS, Supabase Edge Function, scheduled cron, Upstash Redis, or external ESPN/FIFA source.
2. Check the latest deployment or migration that touched that surface.
3. Read the exact browser console, Vercel deploy log, Supabase Edge Function log, or Supabase database error before changing code.
4. If predictions/scoring are affected, pause non-critical deploys and avoid manual data edits until the root cause is clear.
5. If a Redis outage affects user mutations, remember rate limits are designed to fail open for normal user actions where safe; verify game state still lives in Supabase.
6. If a cron sync fails, run it manually only after confirming the lock is not held by another active run.
7. Document the symptom, root cause, command outputs, and recovery action in the PR/commit message or release note.

### Rollback checklist

1. For frontend-only regressions, revert the Git commit and push a new revert commit so Vercel deploys a clean rollback.
2. For Edge Function regressions, redeploy the previous known-good function version from the previous Git commit if a forward fix is not ready.
3. For database migrations, prefer a forward repair migration; do not drop/restore production data unless there is a tested backup/restore plan.
4. For secret mistakes, rotate the exposed secret first, then remove it from logs/files, then redeploy functions that use it.
5. After rollback or repair, rerun the relevant regression script plus `npm run lint` and `npm run build` for frontend changes.

### Optional later admin page

Add an admin-only System Health card showing:

- latest ESPN sync time/status.
- latest FIFA sync time/status.
- latest cleanup time/result.
- recent Edge Function error count.
- leaderboard last refreshed time.
- latest Vercel deployment status if a safe API integration is added later.
- current Supabase/Upstash usage snapshots if a safe server-only aggregation endpoint is added later.

### Expected UX impact

None.

---

## Recommended implementation order

### Sprint 1: Safe performance wins

1. Replace heavy `select('*')` in frontend services.
2. Add `.limit()` to public list queries.
3. Keep UI behavior identical.
4. Verify key routes.

Risk: low.

### Sprint 2: Protect privileged backend paths

1. Add shared auth guard helpers.
2. Lock admin-only functions.
3. Lock cron-only functions with `CRON_SECRET`.
4. Deploy and verify unauthorized/authorized calls.

Risk: medium because Edge Functions must be deployed carefully.

### Sprint 3: Add Upstash backend protection

1. Add Upstash Redis secrets to Supabase Edge Function environment.
2. Add shared Redis/rate-limit helpers.
3. Apply rate limits to user-facing mutation functions.
4. Add locks to cron/admin-heavy functions.
5. Return friendly 429 messages when limits are exceeded.

Risk: medium.

### Sprint 4: Retention cleanup

1. Add cleanup SQL function for operational Supabase tables.
2. Hook into maintenance function.
3. Verify only operational data is deleted.
4. Confirm rate-limit counters stay in Redis with TTL, not Supabase tables.

Risk: low if delete scopes are strict.

### Sprint 5: Client/server cache and asset optimization

1. Add simple client cache helper.
2. Optionally add tiny Redis backend cache for leaderboard/match summary snapshots.
3. Cache teams/matches/badges/leaderboard with short TTLs.
4. Invalidate or bypass after mutations.
5. Convert/lazy-load large images.

Risk: low-medium due to stale data concerns.

### Sprint 6: Auth hardening

1. Increase password length.
2. Decide whether to enable email confirmation.
3. Decide whether to enable CAPTCHA.
4. Test production auth flows thoroughly.

Risk: UX friction.

---

## Final recommendation

For this app on free Vercel + Supabase, the highest-value work is not load balancing. The platform already handles static CDN and managed database hosting.

The real production-hardening priorities are:

1. Reduce payload and egress.
2. Bound every public list query.
3. Protect service-role Edge Functions.
4. Use Upstash Redis for mutation rate limits and short-lived backend locks.
5. Keep operational logs small.
6. Cache low-change data carefully, using client memory cache first and Redis only for tiny backend snapshots.
7. Add safe security headers.
8. Only add CAPTCHA/email confirmation when public abuse risk justifies the UX cost.
