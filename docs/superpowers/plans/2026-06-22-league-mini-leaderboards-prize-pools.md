# League Mini Leaderboards Prize Pools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Weekly and Matchday mini leaderboards inside each league, with flexible user stake contributions and balanced points-pool payouts.

**Architecture:** Add league event tables for Weekly/Matchday scoring windows, wallet/ledger tables for spendable points, and a Supabase Edge Function for authenticated stake entry and settlement. Frontend reads public/member-visible event rows through RLS and uses the Edge Function for user mutations.

**Tech Stack:** Supabase Postgres, RLS, Supabase Edge Functions, React, TypeScript, Vite, react-i18next.

---

## File Structure

- Create `supabase/migrations/<timestamp>_league_event_prize_pools.sql`: tables, indexes, RLS policies, private helper grants, seed/backfill logic.
- Create `supabase/functions/_shared/leagueEvents.ts`: shared event leaderboard refresh and payout settlement helpers.
- Modify `supabase/functions/manage_league/index.ts`: add `enterLeagueEvent` and `settleLeagueEvent` actions.
- Modify `supabase/functions/recalculate_scores/index.ts`: refresh event leaderboards after score recalculation.
- Modify `supabase/functions/sync_espn_results/index.ts`: refresh event leaderboards after ESPN result scoring.
- Modify `src/types/supabase.ts`: add new table types.
- Create `src/services/leagueEvents.ts`: list events, list event standings, list current wallet, enter event.
- Modify `src/pages/LeagueDetail.tsx`: add mini leaderboard/prize pool section above main standings.
- Modify `src/i18n/resources.ts`: add EN/VI labels for wallet, stake, Weekly/Matchday events, payouts, and errors.

## Data Model

New tables:

- `point_wallets(user_id, balance, updated_at)` stores spendable points separate from `profiles.points`.
- `point_transactions(id, user_id, league_id, event_id, type, amount, balance_after, description, created_at)` is the audit ledger.
- `league_events(id, league_id, event_type, name, starts_at, ends_at, status, min_stake, max_stake, prize_pool, settled_at, created_at, updated_at)` stores Weekly and Matchday events.
- `league_event_entries(event_id, user_id, stake, entered_at)` stores player stake entries.
- `league_event_leaderboard_entries(event_id, user_id, rank, previous_rank, points, exact_scores, accuracy, stake, payout, payout_factor, updated_at)` stores event standings and settled payouts.

Wallet rules:

- A wallet is initialized lazily from `profiles.points` the first time a user enters an event, capped at current profile points if the wallet row does not exist.
- Stake entry debits `point_wallets.balance` and writes a `stake` transaction.
- Settlement credits winnings and writes a `payout` transaction.
- `profiles.points` remains the prediction/global-rank display value and is not debited by event stakes.

Event scoring rules:

- Weekly events include prediction scores from matches where `kickoff_at >= starts_at` and `< ends_at`.
- Matchday events include prediction scores from matches with `matches.matchday = event.matchday` through the event date window.
- Only league members who entered the event appear in event standings.
- Existing league membership join time still applies: scores before `league_members.joined_at` do not count.

Payout formula:

```txt
rankShare = { 1: 0.50, 2: 0.30, 3: 0.20 }
averageStake = prizePool / entryCount
contributionFactor = sqrt(userStake / averageStake)
cappedFactor = clamp(contributionFactor, 0.5, 1.5)
rawPayout = prizePool * rankShare * cappedFactor
finalPayout = round(rawPayout * prizePool / sum(rawPayouts))
```

This keeps top rank important while preventing a tiny stake from extracting the same payout as a much larger stake.

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/<timestamp>_league_event_prize_pools.sql`

- [ ] **Step 1: Create migration with Supabase CLI**

Run:

```bash
supabase migration new league_event_prize_pools
```

Expected: creates a timestamped SQL file under `supabase/migrations`.

- [ ] **Step 2: Add tables and constraints**

Add SQL equivalent to:

```sql
create table if not exists public.point_wallets (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.league_events (
  id text primary key,
  league_id text not null references public.leagues(id) on delete cascade,
  event_type text not null check (event_type in ('weekly', 'matchday')),
  name text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'open' check (status in ('open', 'locked', 'settled')),
  min_stake integer not null default 1 check (min_stake > 0),
  max_stake integer not null default 100 check (max_stake >= min_stake),
  prize_pool integer not null default 0 check (prize_pool >= 0),
  settled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table if not exists public.league_event_entries (
  event_id text not null references public.league_events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  stake integer not null check (stake > 0),
  entered_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create table if not exists public.point_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  league_id text references public.leagues(id) on delete set null,
  event_id text references public.league_events(id) on delete set null,
  type text not null check (type in ('initial', 'stake', 'payout', 'refund')),
  amount integer not null,
  balance_after integer not null check (balance_after >= 0),
  description text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.league_event_leaderboard_entries (
  event_id text not null references public.league_events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rank integer not null,
  previous_rank integer,
  points integer not null default 0,
  exact_scores integer not null default 0,
  accuracy integer not null default 0,
  stake integer not null default 0,
  payout integer not null default 0,
  payout_factor numeric not null default 1,
  updated_at timestamptz not null default now(),
  primary key (event_id, user_id)
);
```

- [ ] **Step 3: Add indexes and grants**

Add:

```sql
create index if not exists league_events_league_status_starts_idx on public.league_events(league_id, status, starts_at desc);
create index if not exists league_events_window_idx on public.league_events(starts_at, ends_at);
create index if not exists league_event_entries_user_idx on public.league_event_entries(user_id, entered_at desc);
create index if not exists league_event_leaderboard_rank_idx on public.league_event_leaderboard_entries(event_id, rank);
create index if not exists point_transactions_user_created_idx on public.point_transactions(user_id, created_at desc);

grant select on public.point_wallets to authenticated;
grant select on public.point_transactions to authenticated;
grant select on public.league_events to anon, authenticated;
grant select on public.league_event_entries to authenticated;
grant select on public.league_event_leaderboard_entries to anon, authenticated;
```

- [ ] **Step 4: Add RLS policies**

Use `private.league_is_public()` and `private.current_user_is_league_member()` for event visibility:

```sql
alter table public.point_wallets enable row level security;
alter table public.point_transactions enable row level security;
alter table public.league_events enable row level security;
alter table public.league_event_entries enable row level security;
alter table public.league_event_leaderboard_entries enable row level security;

create policy point_wallets_read_own on public.point_wallets for select to authenticated using (user_id = (select auth.uid()));
create policy point_transactions_read_own on public.point_transactions for select to authenticated using (user_id = (select auth.uid()));

create policy league_events_read_visible on public.league_events for select to anon, authenticated using (
  private.league_is_public(league_events.league_id)
  or ((select auth.uid()) is not null and private.current_user_is_league_member(league_events.league_id))
);

create policy league_event_entries_read_visible on public.league_event_entries for select to authenticated using (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.league_events le
    where le.id = league_event_entries.event_id
    and private.current_user_is_league_member(le.league_id)
  )
);

create policy league_event_leaderboard_read_visible on public.league_event_leaderboard_entries for select to anon, authenticated using (
  exists (
    select 1 from public.league_events le
    where le.id = league_event_leaderboard_entries.event_id
    and (
      private.league_is_public(le.league_id)
      or ((select auth.uid()) is not null and private.current_user_is_league_member(le.league_id))
    )
  )
);
```

No insert/update/delete policies are added; mutations go through Edge Function service-role checks.

## Task 2: Shared Edge Helper

**Files:**
- Create: `supabase/functions/_shared/leagueEvents.ts`

- [ ] **Step 1: Implement event leaderboard refresh**

Create helper exports:

```ts
export async function refreshLeagueEventLeaderboards(supabase: SupabaseClient, eventIds?: string[])
export async function settleLeagueEvent(supabase: SupabaseClient, eventId: string)
```

The refresh function reads event entries, members, prediction scores, and match kickoff/matchday data, then upserts `league_event_leaderboard_entries`.

- [ ] **Step 2: Implement payout math**

Use:

```ts
function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function calculatePayouts(entries: Array<{ user_id: string; rank: number; stake: number }>, prizePool: number) {
  const shares = new Map([[1, 0.5], [2, 0.3], [3, 0.2]]);
  const winners = entries.filter((entry) => shares.has(entry.rank));
  const averageStake = entries.length ? prizePool / entries.length : 0;
  const raw = winners.map((entry) => {
    const factor = averageStake > 0 ? clamp(Math.sqrt(entry.stake / averageStake), 0.5, 1.5) : 1;
    return { user_id: entry.user_id, factor, rawPayout: prizePool * (shares.get(entry.rank) ?? 0) * factor };
  });
  const rawTotal = raw.reduce((sum, item) => sum + item.rawPayout, 0);
  return raw.map((item) => ({ ...item, payout: rawTotal > 0 ? Math.round((item.rawPayout / rawTotal) * prizePool) : 0 }));
}
```

## Task 3: Edge Function Mutations

**Files:**
- Modify: `supabase/functions/manage_league/index.ts`

- [ ] **Step 1: Extend body type**

Add:

```ts
eventId?: string;
stake?: number;
```

- [ ] **Step 2: Add `enterLeagueEvent`**

Rules:

- Authenticated only.
- Event must exist and be `open`.
- User must be a league member.
- Stake must be integer between event min/max.
- If wallet does not exist, initialize from `profiles.points`.
- If balance is insufficient, return error.
- Insert `league_event_entries`; do not allow duplicate entry.
- Debit wallet and write `point_transactions(type='stake')`.
- Refresh event leaderboard and return event/wallet/entry.

- [ ] **Step 3: Add owner-only `settleLeagueEvent`**

Rules:

- Owner-only for the event league.
- Event must not already be settled.
- Refresh event leaderboard.
- Calculate top 3 payout with contribution factor.
- Credit winning wallets and write `point_transactions(type='payout')`.
- Mark event `settled`.

## Task 4: Recalculation Hooks

**Files:**
- Modify: `supabase/functions/recalculate_scores/index.ts`
- Modify: `supabase/functions/sync_espn_results/index.ts`

- [ ] **Step 1: Import helper**

Add:

```ts
import { refreshLeagueEventLeaderboards } from '../_shared/leagueEvents.ts';
```

- [ ] **Step 2: Refresh event leaderboards after scoring**

After existing league leaderboard refresh, call:

```ts
const eventResult = await refreshLeagueEventLeaderboards(supabase);
```

Include count in response/logging if the function already returns totals.

## Task 5: Frontend Types and Services

**Files:**
- Modify: `src/types/supabase.ts`
- Create: `src/services/leagueEvents.ts`

- [ ] **Step 1: Add generated-style table types**

Add types for the five new tables under `Database['public']['Tables']`.

- [ ] **Step 2: Create service functions**

Implement:

```ts
export async function listLeagueEvents(leagueId: string)
export async function listLeagueEventLeaderboard(eventId: string)
export async function getCurrentPointWallet()
export function enterLeagueEvent(input: { eventId: string; stake: number })
export function settleLeagueEvent(input: { eventId: string })
```

## Task 6: League Detail UI

**Files:**
- Modify: `src/pages/LeagueDetail.tsx`

- [ ] **Step 1: Load event data**

Add state for:

```ts
const [events, setEvents] = useState<LeagueEventRow[]>([]);
const [eventStandings, setEventStandings] = useState<Record<string, LeagueEventLeaderboardEntryWithProfile[]>>({});
const [walletBalance, setWalletBalance] = useState<number | null>(null);
const [stakeByEventId, setStakeByEventId] = useState<Record<string, string>>({});
```

- [ ] **Step 2: Render Weekly and Matchday cards above standings**

Each card shows:

- event type badge
- name
- date window
- current pool
- min/max stake
- wallet balance
- stake input
- enter button
- top 3 mini standings with stake and payout preview
- owner settle button when event is locked/open and has entries

- [ ] **Step 3: Handle entry actions**

Call `enterLeagueEvent({ eventId, stake })`, then reload events/standings/wallet.

## Task 7: i18n

**Files:**
- Modify: `src/i18n/resources.ts`

- [ ] **Step 1: Add EN labels**

Add labels:

```ts
miniLeaderboards: 'Mini Leaderboards',
weeklyLeaderboard: 'Weekly Leaderboard',
matchdayLeaderboard: 'Matchday Leaderboard',
stakePoints: 'Stake points',
enterPool: 'Enter pool',
prizePoolPoints: 'Prize pool',
walletBalance: 'Wallet balance',
payoutPreview: 'Payout preview',
settleEvent: 'Settle event',
eventSettled: 'Event settled',
alreadyEntered: 'Already entered',
insufficientWallet: 'Not enough wallet points.',
```

- [ ] **Step 2: Add VI labels**

Add natural Vietnamese equivalents:

```ts
miniLeaderboards: 'BXH mini',
weeklyLeaderboard: 'BXH tuần',
matchdayLeaderboard: 'BXH lượt trận',
stakePoints: 'Điểm góp',
enterPool: 'Góp điểm tham gia',
prizePoolPoints: 'Quỹ điểm thưởng',
walletBalance: 'Số dư ví điểm',
payoutPreview: 'Dự kiến thưởng',
settleEvent: 'Chốt thưởng',
eventSettled: 'Đã chốt thưởng',
alreadyEntered: 'Đã tham gia',
insufficientWallet: 'Không đủ điểm trong ví.',
```

## Task 8: Verification

**Files:**
- Verify all changed files.

- [ ] **Step 1: Run lint**

Run:

```bash
npm run lint
```

Expected: exit 0.

- [ ] **Step 2: Run build**

Run:

```bash
npm run build
```

Expected: exit 0.

- [ ] **Step 3: Bundle Edge Functions**

Run current project function bundle checks with `npx esbuild` if Deno is unavailable.

Expected: no syntax/import errors.

## Out of Scope

- Cash payouts or external payment processing.
- Owner-custom payout curves in UI.
- Refund/cancel event UI.
- Per-league separate prediction submissions.
