# Supabase Phase 3 Public Data Reads Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace public mock-data reads for teams, matches, leagues, league details, and leaderboard with Supabase-backed services.

**Architecture:** Pages call small service modules rather than importing `supabase` directly. This keeps the UI components focused and makes later caching/error handling easier.

**Tech Stack:** React 19, Vite, TypeScript, Supabase JS, Supabase Postgres RLS.

---

## Files

- Create: `src/services/teams.ts`
- Create: `src/services/matches.ts`
- Create: `src/services/leagues.ts`
- Create: `src/services/leaderboard.ts`
- Create: `src/services/serviceTypes.ts`
- Modify: `src/Fixtures.tsx`
- Modify: `src/pages/MatchDetail.tsx`
- Modify: `src/pages/Leagues.tsx`
- Modify: `src/pages/LeagueDetail.tsx`
- Modify: `src/Leaderboard.tsx`

## Task 1: Add service type helpers

- [ ] **Step 1: Create `src/services/serviceTypes.ts`**

```ts
export type AsyncState<T> = {
  data: T;
  loading: boolean;
  error: string | null;
};

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong';
}
```

## Task 2: Add public data services

- [ ] **Step 1: Create `src/services/teams.ts`**

```ts
import { supabase } from '../lib/supabaseClient';

export async function listTeams() {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
}

export async function getTeamMap() {
  const teams = await listTeams();
  return new Map(teams.map((team) => [team.id, team]));
}
```

- [ ] **Step 2: Create `src/services/matches.ts`**

```ts
import { supabase } from '../lib/supabaseClient';

export async function listMatches() {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .order('kickoff_at', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getMatch(matchId: string) {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .single();

  if (error) throw error;
  return data;
}
```

- [ ] **Step 3: Create `src/services/leagues.ts`**

```ts
import { supabase } from '../lib/supabaseClient';

export async function listLeagues() {
  const { data, error } = await supabase
    .from('leagues')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getLeague(leagueId: string) {
  const { data, error } = await supabase
    .from('leagues')
    .select('*')
    .eq('id', leagueId)
    .single();

  if (error) throw error;
  return data;
}
```

- [ ] **Step 4: Create `src/services/leaderboard.ts`**

```ts
import { supabase } from '../lib/supabaseClient';

export async function listGlobalLeaderboard() {
  const { data, error } = await supabase
    .from('leaderboard_entries')
    .select('*, profiles:user_id(username, avatar_url, country_code)')
    .eq('scope', 'global')
    .order('rank', { ascending: true });

  if (error) throw error;
  return data;
}

export async function listLeagueLeaderboard(leagueId: string) {
  const { data, error } = await supabase
    .from('leaderboard_entries')
    .select('*, profiles:user_id(username, avatar_url, country_code)')
    .eq('scope', 'league')
    .eq('league_id', leagueId)
    .order('rank', { ascending: true });

  if (error) throw error;
  return data;
}
```

## Task 3: Migrate `/matches` and match detail reads

- [ ] **Step 1: Update `Fixtures.tsx` imports**

Remove direct imports from `src/data/mockMatches.ts` and `src/data/mockTeams.ts`. Add `useEffect`, `useState`, `listMatches`, and `getTeamMap`.

- [ ] **Step 2: Add loading state**

Use this state pattern:

```ts
const [matches, setMatches] = useState<Awaited<ReturnType<typeof listMatches>>>([]);
const [teamMap, setTeamMap] = useState<Awaited<ReturnType<typeof getTeamMap>>>(new Map());
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

Fetch in `useEffect`:

```ts
useEffect(() => {
  let active = true;
  Promise.all([listMatches(), getTeamMap()])
    .then(([nextMatches, nextTeamMap]) => {
      if (!active) return;
      setMatches(nextMatches);
      setTeamMap(nextTeamMap);
    })
    .catch((err) => {
      if (!active) return;
      setError(getErrorMessage(err));
    })
    .finally(() => {
      if (active) setLoading(false);
    });
  return () => {
    active = false;
  };
}, []);
```

- [ ] **Step 3: Preserve attached-card layout**

Only replace data variables and field names:

```txt
group -> group_code
homeTeamId -> home_team_id
awayTeamId -> away_team_id
kickoffAt -> kickoff_at
lockAt -> lock_at
homeScore -> home_score
awayScore -> away_score
```

- [ ] **Step 4: Update `MatchDetail.tsx` similarly**

Fetch one match through `getMatch(matchId)` and teams through `getTeamMap()`. Preserve route behavior and layout.

## Task 4: Migrate leagues and league detail reads

- [ ] **Step 1: Update `Leagues.tsx`**

Replace `mockLeagues` with `listLeagues()`. Keep the current attached-card layout.

- [ ] **Step 2: Update `LeagueDetail.tsx`**

Replace `mockLeagues.find` with `getLeague(leagueId)`. Replace `mockLeaderboard` with `listLeagueLeaderboard(league.id)` for league rows. Keep `mockActivity` and `mockUsers` until Phase 6.

## Task 5: Migrate global leaderboard reads

- [ ] **Step 1: Update `Leaderboard.tsx`**

Replace `mockLeaderboard` + `getUserById` usage with `listGlobalLeaderboard()`. Use joined `profiles` fields for username/avatar/country.

- [ ] **Step 2: Add loading and error states**

Render the same title/main card shell with `Loading leaderboard...` or error text inside the attached content area.

## Task 6: Verify public reads

- [ ] **Step 1: Run lint**

```bash
npm run lint
```

Expected: TypeScript exits 0.

- [ ] **Step 2: Run build**

```bash
npm run build
```

Expected: Vite exits 0. Existing chunk warning is acceptable.

- [ ] **Step 3: Browser verification**

Use the existing frontend dev server. Visit:

```txt
/matches
/matches/m-bra-esp
/leaderboard
/leagues
/leagues/league-global
/leagues/league-friends
```

Expected: pages load from Supabase data and preserve the attached-card design system.
