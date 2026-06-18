# Supabase Backend Design for Predict 2026

## Goal

Migrate Predict 2026 from mock frontend data to a free-friendly real backend using React/Vite, Supabase Auth, Supabase Postgres, Row Level Security, and Supabase Edge Functions. The first implementation slice should be a full core MVP: real auth, profiles, fixtures, predictions, scoring, leaderboards, leagues, badges, and activity, with admin and rewards limited to read-only/manual-review surfaces.

## Scope

This design covers the first backend-backed MVP slice.

Included:

- Supabase project setup for local and hosted environments.
- Supabase Auth integration in the existing React/Vite app.
- Postgres schema for the existing domain model.
- Seed migration from the current mock data shape.
- RLS policies for public reads, user-owned writes, league membership, and admin-only data.
- Edge Functions for sensitive or multi-step operations.
- Frontend data access layer to replace direct mock imports progressively.
- Verification strategy for RLS, scoring, and build correctness.

Excluded from the first slice:

- Automated payout or wallet functionality.
- Paid-entry, deposit, betting, odds, or wagering mechanics.
- Fully automated external football API sync.
- Realtime subscriptions unless a later performance review justifies them.
- Complex anti-cheat enforcement actions such as bans or destructive admin controls.

## Architecture

The frontend remains React/Vite. Supabase becomes the backend platform. The frontend may directly read public-safe tables through the Supabase client, while sensitive writes and multi-step operations go through Edge Functions.

```txt
React/Vite
  ├─ public reads: teams, matches, leaderboard, badge catalog, public leagues
  ├─ authenticated reads/writes: own profile, own predictions, own memberships
  ↓
Supabase Auth
  ↓
Supabase Postgres + RLS
  ↓
Edge Functions
     ├─ submit_prediction
     ├─ join_league
     ├─ update_match_result
     ├─ recalculate_scores
     └─ unlock_badges
```

Static-ish contest data should be read from Postgres with normal Supabase queries. Leaderboards should be stored or materialized after scoring updates, not recalculated on every page view. Edge Functions should be used where the client must not directly control invariants such as prediction locking, private league invite checks, result updates, or scoring.

## Database model

Create these tables in `public`, with RLS enabled on every table exposed through Supabase Data API.

### `profiles`

Represents app users and public profile stats.

Key columns:

- `id uuid primary key references auth.users(id) on delete cascade`
- `username text not null unique`
- `email text`
- `avatar_url text`
- `country_code text`
- `fan_club_team_id text references teams(id)`
- `role text not null default 'user' check (role in ('user', 'admin'))`
- `points integer not null default 0`
- `rank integer`
- `accuracy numeric`
- `exact_scores integer not null default 0`
- `current_streak integer not null default 0`
- `best_streak integer not null default 0`
- `created_at timestamptz not null default now()`

Authorization data must not use user-editable metadata. Admin status may live in `profiles.role`, but normal users must not be able to update `role`.

### `teams`

Team catalog.

Key columns:

- `id text primary key`
- `name text not null`
- `short_name text not null`
- `country_code text not null`
- `fifa_rank integer`
- `group_code text`

### `matches`

Fixture and result source for predictions.

Key columns:

- `id text primary key`
- `stage text not null`
- `group_code text`
- `matchday integer`
- `home_team_id text not null references teams(id)`
- `away_team_id text not null references teams(id)`
- `kickoff_at timestamptz not null`
- `lock_at timestamptz not null`
- `stadium text not null`
- `city text not null`
- `status text not null`
- `home_score integer`
- `away_score integer`
- `result_updated_at timestamptz`

### `predictions`

One current prediction per user and match.

Key columns:

- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null references profiles(id) on delete cascade`
- `match_id text not null references matches(id) on delete cascade`
- `home_score integer not null check (home_score >= 0)`
- `away_score integer not null check (away_score >= 0)`
- `confidence integer not null default 50 check (confidence between 0 and 100)`
- `is_risk_pick boolean not null default false`
- `status text not null default 'submitted'`
- `revision integer not null default 1`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `locked_at timestamptz`
- `unique (user_id, match_id)`

The `submit_prediction` Edge Function owns the lock-time validation and revision increment. Direct client writes may be disallowed initially for simpler enforcement.

### `prediction_scores`

Stores scoring output for each prediction.

Key columns:

- `prediction_id uuid primary key references predictions(id) on delete cascade`
- `exact_score integer not null default 0`
- `correct_outcome integer not null default 0`
- `streak_bonus integer not null default 0`
- `risk_multiplier numeric not null default 1`
- `underdog_bonus integer not null default 0`
- `total integer not null default 0`
- `outcome text not null`
- `scoring_version text not null`
- `calculated_at timestamptz not null default now()`

### `leaderboard_entries`

Stores leaderboard rows after score recalculation.

Key columns:

- `scope text not null check (scope in ('global', 'league'))`
- `league_id text references leagues(id) on delete cascade`
- `user_id uuid not null references profiles(id) on delete cascade`
- `rank integer not null`
- `previous_rank integer`
- `points integer not null default 0`
- `exact_scores integer not null default 0`
- `accuracy numeric not null default 0`
- `streak integer not null default 0`
- `updated_at timestamptz not null default now()`
- `primary key (scope, coalesce(league_id, 'global'), user_id)` implemented with a generated key or separate unique indexes because expressions cannot be primary keys directly.

### `leagues`

Public/private league metadata.

Key columns:

- `id text primary key`
- `name text not null`
- `slug text not null unique`
- `creator_id uuid references profiles(id)`
- `visibility text not null check (visibility in ('private', 'public'))`
- `invite_code text not null unique`
- `member_count integer not null default 0`
- `scoring_mode text not null default 'global'`
- `prize_mode text not null default 'none'`
- `created_at timestamptz not null default now()`

### `league_members`

League membership.

Key columns:

- `league_id text not null references leagues(id) on delete cascade`
- `user_id uuid not null references profiles(id) on delete cascade`
- `role text not null default 'member' check (role in ('owner', 'member'))`
- `joined_at timestamptz not null default now()`
- `primary key (league_id, user_id)`

Private league joins go through `join_league` to validate invite code.

### `badges` and `user_badges`

Badge catalog and per-user progress.

`badges` key columns:

- `id text primary key`
- `name text not null`
- `description text not null`
- `category text not null`
- `rarity text not null`
- `icon_path text`
- `progress_target integer`

`user_badges` key columns:

- `user_id uuid not null references profiles(id) on delete cascade`
- `badge_id text not null references badges(id) on delete cascade`
- `progress_current integer not null default 0`
- `unlocked_at timestamptz`
- `primary key (user_id, badge_id)`

### `activity_events`

User-visible activity feed.

Key columns:

- `id uuid primary key default gen_random_uuid()`
- `type text not null`
- `title text not null`
- `description text not null`
- `user_id uuid references profiles(id) on delete cascade`
- `match_id text references matches(id)`
- `prediction_id uuid references predictions(id)`
- `badge_id text references badges(id)`
- `league_id text references leagues(id)`
- `href text`
- `created_at timestamptz not null default now()`

### `admin_audit_logs`

Admin-facing audit trail.

Key columns:

- `id uuid primary key default gen_random_uuid()`
- `actor_id uuid references profiles(id)`
- `action text not null`
- `entity_type text not null`
- `entity_id text not null`
- `description text not null`
- `severity text not null`
- `created_at timestamptz not null default now()`

### `reward_reviews`

Manual reward review surface. This is not a wallet or payout ledger.

Key columns:

- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null references profiles(id)`
- `title text not null`
- `period text not null`
- `placement text not null`
- `amount integer not null`
- `currency text not null default 'USD'`
- `source text not null check (source in ('sponsor', 'community', 'manual'))`
- `status text not null check (status in ('pending', 'approved', 'paid', 'ineligible'))`
- `updated_at timestamptz not null default now()`
- `note text not null`

## Indexes and performance

Add indexes for common access paths:

- `predictions(user_id)`
- `predictions(match_id)`
- `predictions(user_id, match_id)` unique
- `matches(kickoff_at)`
- `matches(status)`
- `leaderboard_entries(scope, league_id, rank)`
- `league_members(user_id)`
- `activity_events(user_id, created_at desc)`
- `activity_events(league_id, created_at desc)`
- `admin_audit_logs(created_at desc)`
- `reward_reviews(user_id, status)`

Use stored leaderboard rows to avoid expensive rank calculations on every request. Avoid realtime in the first slice to preserve free-tier usage.

## RLS model

Enable RLS on every table in `public`.

Policy model:

- `teams`: `anon` and `authenticated` can read all rows.
- `matches`: `anon` and `authenticated` can read all rows; only admin service logic can update results.
- `profiles`: `anon` and `authenticated` can read public-safe fields; authenticated users can update their own non-role profile fields.
- `predictions`: authenticated users can read their own rows; writes should go through `submit_prediction`. If direct writes are allowed later, policies must include ownership checks and lock-time checks.
- `prediction_scores`: users can read scores for their own predictions; leaderboard views may expose aggregate stats.
- `leaderboard_entries`: public read for global rows and public league rows; private league rows readable by league members.
- `leagues`: public leagues readable by everyone; private league metadata readable by members; creation/join goes through controlled functions.
- `league_members`: users can read memberships involving themselves; public member counts come from `leagues.member_count` or an aggregate maintained server-side.
- `badges`: public read.
- `user_badges`: users can read their own badge progress; public profile badge display can be added later through a restricted view.
- `activity_events`: users can read their own events; public league/global events can be added with explicit visibility later.
- `admin_audit_logs`: admin only.
- `reward_reviews`: users can read their own reward review rows; admin can read/update all through service logic.

Avoid `auth.role()` in policies. Use `TO anon` / `TO authenticated` plus explicit predicates. Update policies must include both `USING` and `WITH CHECK` where updates are allowed.

## Edge Functions

### `submit_prediction`

Responsibilities:

- Require authenticated user.
- Validate match exists.
- Validate `now() < matches.lock_at`.
- Validate non-negative score values.
- Upsert one prediction per `(user_id, match_id)`.
- Increment `revision` on edits.
- Set `updated_at`.
- Insert `prediction_locked` or prediction activity event where appropriate.

### `join_league`

Responsibilities:

- Require authenticated user.
- Allow public league join by id/slug.
- Require invite code for private leagues.
- Insert into `league_members` idempotently.
- Update `leagues.member_count` through safe server logic.
- Insert `league_joined` activity event.

### `update_match_result`

Responsibilities:

- Admin only.
- Validate score values and match status transition.
- Update `matches.home_score`, `matches.away_score`, `matches.status`, and `matches.result_updated_at`.
- Insert `admin_audit_logs` row.
- Optionally invoke or queue `recalculate_scores`.

### `recalculate_scores`

Responsibilities:

- Admin/manual trigger in first slice.
- Find finished matches with predictions.
- Calculate exact score, correct outcome, streak bonus, risk multiplier, underdog bonus, and total.
- Upsert `prediction_scores`.
- Rebuild global and league `leaderboard_entries`.
- Update cached profile stats.
- Insert score-related activity events.
- Invoke badge unlock logic.

### `unlock_badges`

Responsibilities:

- Update `user_badges.progress_current` and `unlocked_at` based on scoring and league activity.
- Insert badge activity events for newly unlocked badges.

This may be implemented as internal shared logic used by `recalculate_scores` before exposing a standalone function.

## Frontend migration

Introduce a data access layer instead of importing Supabase directly throughout page components.

Files to add conceptually:

- `src/lib/supabaseClient.ts`
- `src/lib/auth.ts`
- `src/services/teams.ts`
- `src/services/matches.ts`
- `src/services/predictions.ts`
- `src/services/leaderboard.ts`
- `src/services/leagues.ts`
- `src/services/profile.ts`
- `src/services/badges.ts`
- `src/services/activity.ts`
- `src/services/rewards.ts`
- `src/services/admin.ts`

Migration order:

1. Install Supabase client and environment config.
2. Add auth/session provider.
3. Replace teams and matches mock reads with Supabase queries.
4. Replace profile and predictions with authenticated data.
5. Wire prediction submit/edit to `submit_prediction`.
6. Replace leaderboard and leagues reads.
7. Replace badges and activity reads.
8. Replace rewards/admin reads with protected Supabase-backed surfaces.

Keep mock data as seed input during migration, then remove direct page imports once each area is migrated.

## External football data

For the first slice, use seeded fixtures/results and admin manual result updates. Do not depend on a live football API to ship the backend MVP. A provider can be added later behind an Edge Function or scheduled job, so the frontend and scoring engine remain independent of provider changes.

## Free-tier operating model

For 100+ users:

- Avoid realtime subscriptions initially.
- Avoid polling loops from the frontend.
- Use stored leaderboard rows.
- Run score recalculation only after result updates.
- Keep Edge Functions small and focused.
- Keep external API keys server-side only.
- Use public reads only for data that is intentionally public.

## Verification plan

Schema/RLS verification:

- An anonymous user can read teams, matches, public leaderboard, public leagues, and badge catalog.
- An anonymous user cannot read private user predictions, reward reviews, or admin audit logs.
- User A cannot read or update User B predictions.
- A logged-in user can submit a prediction before lock time.
- A logged-in user cannot submit or edit a prediction after lock time.
- A private league cannot be joined without the correct invite code.
- Non-admin users cannot update match results or run scoring functions.
- Admin users can update match results and trigger recalculation.

Scoring verification:

- Exact score predictions receive exact score points.
- Correct outcome but wrong score receives outcome points.
- Missed outcomes receive no outcome points.
- Streak and risk logic match the current frontend scoring rules.
- Leaderboard ranks update after recalculation.

Frontend verification:

- `npm run lint` passes.
- `npm run build` passes.
- Login/logout works.
- Matches, predictions, leaderboard, leagues, badges, activity, rewards, and admin pages load from Supabase-backed services.
- Existing design system and routes remain intact.

## Open implementation notes

- Use the current Supabase docs before implementation because Supabase frequently changes CLI, Data API exposure, and Auth behavior.
- Check the hosted project's Data API exposure settings. If tables are not automatically exposed, explicitly grant the needed access to `anon` and `authenticated` roles while keeping RLS enabled.
- Use Supabase publishable/anon key in the Vite client only. Never expose service-role or secret keys in browser code.
- Keep reward language as sponsor/community/manual review. Do not add betting, odds, stakes, deposits, or wallet balances.
