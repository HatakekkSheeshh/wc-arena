# ESPN Enrichment and Prediction Signals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add explicit win/draw/loss outcome picks, sanitized ESPN prediction percentages, and ESPN-powered match detail context for Predict 2026.

**Architecture:** Keep OpenFootball as the schedule source of truth and extend the existing ESPN sync as a server-side enrichment pipeline. Store high-value ESPN fields as scalar columns on `public.matches`, store flexible sanitized summary content in `espn_summary jsonb`, and expose community outcome percentages through a read-safe aggregate view/RPC rather than exposing individual user predictions.

**Tech Stack:** React 19, Vite 6, TypeScript, Supabase Postgres, Supabase RLS, Supabase Edge Functions, ESPN site API, `tsx` data sync scripts.

---

## File structure

- Modify `supabase/migrations/*_add_prediction_outcomes_espn_enrichment.sql`
  - Created with `supabase migration new add_prediction_outcomes_espn_enrichment` at implementation time.
  - Adds `predicted_outcome` to predictions.
  - Adds ESPN enrichment columns to matches.
  - Adds safe community aggregate view or RPC.
- Modify `src/types/supabase.ts`
  - Add the new generated/temporary types after migration is pushed or manually update during development.
- Modify `supabase/functions/submit_prediction/index.ts`
  - Accept and validate `predictedOutcome`.
  - Store `predicted_outcome`.
- Modify `supabase/functions/recalculate_scores/index.ts`
  - Read/use `predicted_outcome` for correct outcome scoring while still supporting score-derived fallback.
- Modify `src/types/domain.ts`
  - Add `PredictionOutcome` or reuse existing `MatchOutcome` in prediction types.
- Modify `src/services/predictions.ts`
  - Include `predictedOutcome` in submit input.
  - Add a service to fetch community outcome percentages for one match.
- Modify `scripts/sync-espn-worldcup.ts`
  - Extend scoreboard candidate extraction.
  - Fetch ESPN summary for matched events when requested.
  - Sanitize summary data.
  - Convert odds-like source data into normalized percentages only.
  - Extend SQL output mode.
- Modify `src/pages/MatchDetail.tsx`
  - Add outcome selector next to exact score input.
  - Add Community vs ESPN Signal card.
  - Add live status, venue/broadcast, stats/leaders/form/news sections.
- Modify `src/Picks.tsx`
  - Add outcome selector to pick rows and submit `predictedOutcome`.
- Optional modify `src/pages/MyPredictions.tsx` and `src/pages/PredictionBreakdown.tsx`
  - Show submitted outcome label if straightforward after main UI is complete.

---

### Task 1: Add database support for prediction outcomes and ESPN enrichment

**Files:**
- Create through CLI: `supabase/migrations/<timestamp>_add_prediction_outcomes_espn_enrichment.sql`
- Modify: `src/types/supabase.ts`

- [ ] **Step 1: Create the migration file with Supabase CLI**

Run:

```bash
supabase migration new add_prediction_outcomes_espn_enrichment
```

Expected: CLI prints a new migration path under `supabase/migrations/`.

- [ ] **Step 2: Add the SQL migration**

Write this SQL into the generated migration file, preserving its generated timestamped name:

```sql
alter table public.predictions
  add column if not exists predicted_outcome text;

update public.predictions
set predicted_outcome = case
  when home_score > away_score then 'home'
  when home_score < away_score then 'away'
  else 'draw'
end
where predicted_outcome is null;

alter table public.predictions
  alter column predicted_outcome set not null;

alter table public.predictions
  drop constraint if exists predictions_predicted_outcome_check;

alter table public.predictions
  add constraint predictions_predicted_outcome_check
  check (predicted_outcome in ('home', 'draw', 'away'));

alter table public.matches
  add column if not exists espn_display_clock text,
  add column if not exists espn_state text,
  add column if not exists espn_play_by_play_available boolean,
  add column if not exists espn_attendance integer,
  add column if not exists espn_home_winner boolean,
  add column if not exists espn_away_winner boolean,
  add column if not exists espn_home_logo text,
  add column if not exists espn_away_logo text,
  add column if not exists espn_home_color text,
  add column if not exists espn_away_color text,
  add column if not exists espn_home_record text,
  add column if not exists espn_away_record text,
  add column if not exists espn_home_win_pct integer,
  add column if not exists espn_draw_pct integer,
  add column if not exists espn_away_win_pct integer,
  add column if not exists espn_prediction_updated_at timestamptz,
  add column if not exists espn_summary jsonb,
  add column if not exists espn_summary_updated_at timestamptz;

alter table public.matches
  drop constraint if exists matches_espn_prediction_pct_check;

alter table public.matches
  add constraint matches_espn_prediction_pct_check
  check (
    (espn_home_win_pct is null and espn_draw_pct is null and espn_away_win_pct is null)
    or (
      espn_home_win_pct between 0 and 100
      and espn_draw_pct between 0 and 100
      and espn_away_win_pct between 0 and 100
      and espn_home_win_pct + espn_draw_pct + espn_away_win_pct between 99 and 101
    )
  );

create or replace view public.match_prediction_outcome_summary
with (security_invoker = true) as
select
  match_id,
  count(*)::integer as total_predictions,
  count(*) filter (where predicted_outcome = 'home')::integer as home_predictions,
  count(*) filter (where predicted_outcome = 'draw')::integer as draw_predictions,
  count(*) filter (where predicted_outcome = 'away')::integer as away_predictions
from public.predictions
where status in ('submitted', 'locked', 'scored')
group by match_id;

grant select on public.match_prediction_outcome_summary to anon, authenticated;
```

- [ ] **Step 3: Run TypeScript before type updates to confirm expected failures**

Run:

```bash
npm run lint
```

Expected: it may still pass because TypeScript has not referenced new fields yet. If it fails for unrelated reasons, stop and fix that before continuing.

- [ ] **Step 4: Push migration to linked Supabase project**

Run:

```bash
supabase db push --linked
```

Expected: migration applies. If Docker catalog cache warning appears but the command finishes, verify with Step 5.

- [ ] **Step 5: Verify new DB columns and view**

Run:

```bash
supabase db query --linked "select column_name from information_schema.columns where table_schema = 'public' and table_name in ('matches', 'predictions') and column_name in ('predicted_outcome', 'espn_summary', 'espn_home_win_pct', 'espn_display_clock') order by column_name;"
```

Expected rows include:

```txt
espn_display_clock
espn_home_win_pct
espn_summary
predicted_outcome
```

Run:

```bash
supabase db query --linked "select * from public.match_prediction_outcome_summary limit 5;"
```

Expected: query succeeds. It may return no rows if there are no submitted predictions.

- [ ] **Step 6: Update `src/types/supabase.ts`**

Run:

```bash
npm run supabase:types
```

Expected: `src/types/supabase.ts` includes `predicted_outcome`, ESPN match fields, and `match_prediction_outcome_summary` in `Views`.

---

### Task 2: Update prediction submission and scoring to use explicit outcome

**Files:**
- Modify `supabase/functions/submit_prediction/index.ts`
- Modify `supabase/functions/recalculate_scores/index.ts`
- Modify `src/services/predictions.ts`
- Modify `src/types/domain.ts`

- [ ] **Step 1: Update shared frontend domain type**

In `src/types/domain.ts`, update `Prediction` to include:

```ts
  predictedOutcome: MatchOutcome;
```

Place it after `awayScore`.

- [ ] **Step 2: Update prediction service input**

In `src/services/predictions.ts`, update `SubmitPredictionInput`:

```ts
export type SubmitPredictionInput = {
  matchId: string;
  homeScore: number;
  awayScore: number;
  predictedOutcome: 'home' | 'draw' | 'away';
  confidence?: number;
  isRiskPick?: boolean;
};
```

- [ ] **Step 3: Add community summary service**

In `src/services/predictions.ts`, add:

```ts
export type MatchPredictionOutcomeSummary = Database['public']['Views']['match_prediction_outcome_summary']['Row'];

export async function getMatchPredictionOutcomeSummary(matchId: string) {
  const { data, error } = await supabase
    .from('match_prediction_outcome_summary')
    .select('*')
    .eq('match_id', matchId)
    .maybeSingle();

  if (error) throw error;
  return data as MatchPredictionOutcomeSummary | null;
}
```

- [ ] **Step 4: Update `submit_prediction` request type and helpers**

In `supabase/functions/submit_prediction/index.ts`, add this type field:

```ts
  predictedOutcome: 'home' | 'draw' | 'away';
```

Then add helper functions above `Deno.serve`:

```ts
function getScoreOutcome(homeScore: number, awayScore: number): 'home' | 'draw' | 'away' {
  if (homeScore > awayScore) return 'home';
  if (homeScore < awayScore) return 'away';
  return 'draw';
}

function isPredictionOutcome(value: unknown): value is 'home' | 'draw' | 'away' {
  return value === 'home' || value === 'draw' || value === 'away';
}
```

- [ ] **Step 5: Validate submitted outcome matches score**

Replace the payload validation block in `submit_prediction` with:

```ts
  if (!body.matchId || !Number.isInteger(body.homeScore) || !Number.isInteger(body.awayScore) || body.homeScore < 0 || body.awayScore < 0 || !isPredictionOutcome(body.predictedOutcome)) {
    return jsonResponse({ error: 'Invalid prediction payload' }, 400);
  }

  if (body.predictedOutcome !== getScoreOutcome(body.homeScore, body.awayScore)) {
    return jsonResponse({ error: 'Prediction outcome must match the exact score.' }, 400);
  }
```

- [ ] **Step 6: Store submitted outcome**

In `predictionValues`, add:

```ts
    predicted_outcome: body.predictedOutcome,
```

between `away_score` and `confidence`.

- [ ] **Step 7: Update recalculate scoring types**

In `supabase/functions/recalculate_scores/index.ts`, update `PredictionRow`:

```ts
  predicted_outcome: 'home' | 'draw' | 'away' | null;
```

- [ ] **Step 8: Update recalculate correct outcome logic**

Replace `getPredictionOutcome` with:

```ts
function getPredictionOutcome(prediction: PredictionRow): 'exact' | 'correct' | 'missed' {
  const exact = prediction.home_score === prediction.matches.home_score && prediction.away_score === prediction.matches.away_score;
  if (exact) return 'exact';
  return (prediction.predicted_outcome ?? getOutcome(prediction)) === getOutcome(prediction.matches) ? 'correct' : 'missed';
}
```

- [ ] **Step 9: Select predicted outcome in recalculate query**

Replace the select string in `recalculate_scores` with:

```ts
    .select('id, user_id, home_score, away_score, predicted_outcome, is_risk_pick, matches!inner(home_score, away_score, status, kickoff_at)')
```

- [ ] **Step 10: Run lint**

Run:

```bash
npm run lint
```

Expected: exit code 0.

---

### Task 3: Extend ESPN sync with sanitized enrichment and prediction percentages

**Files:**
- Modify `scripts/sync-espn-worldcup.ts`

- [ ] **Step 1: Add summary and enrichment types**

In `scripts/sync-espn-worldcup.ts`, add these types after `EspnCompetitor`:

```ts
type EspnSummary = {
  boxscore?: {
    teams?: EspnSummaryTeam[];
    form?: EspnFormGroup[];
  };
  gameInfo?: {
    venue?: EspnVenue;
  };
  leaders?: EspnLeaderGroup[];
  broadcasts?: EspnBroadcast[];
  lastFiveGames?: EspnFormGroup[];
  news?: {
    articles?: EspnArticle[];
  };
  odds?: unknown[];
  pickcenter?: unknown[];
};

type EspnSummaryTeam = {
  homeAway?: 'home' | 'away';
  team?: {
    id?: string;
    abbreviation?: string;
    displayName?: string;
    shortDisplayName?: string;
    logo?: string;
    color?: string;
    alternateColor?: string;
  };
  statistics?: { name?: string; label?: string; displayValue?: string }[];
};

type EspnVenue = {
  fullName?: string;
  shortName?: string;
  address?: { city?: string; country?: string };
};

type EspnBroadcast = {
  type?: { shortName?: string; longName?: string };
  media?: { callLetters?: string; name?: string; shortName?: string };
  lang?: string;
  region?: string;
  isNational?: boolean;
};

type EspnLeaderGroup = {
  team?: { id?: string; abbreviation?: string; displayName?: string };
  leaders?: {
    name?: string;
    displayName?: string;
    leaders?: {
      displayValue?: string;
      athlete?: { id?: string; displayName?: string; shortName?: string; jersey?: string; headshot?: string; position?: { abbreviation?: string } };
    }[];
  }[];
};

type EspnFormGroup = {
  team?: { id?: string; abbreviation?: string; displayName?: string };
  events?: {
    id?: string;
    gameDate?: string;
    score?: string;
    gameResult?: string;
    opponent?: { abbreviation?: string; displayName?: string };
    opponentLogo?: string;
    competitionName?: string;
    roundName?: string;
  }[];
};

type EspnArticle = {
  id?: string;
  headline?: string;
  description?: string;
  published?: string;
  lastModified?: string;
  images?: { url?: string; caption?: string }[];
  links?: { web?: { href?: string } };
};
```

- [ ] **Step 2: Extend `EspnCandidate` type**

Add these fields to `EspnCandidate`:

```ts
  displayClock: string | null;
  state: string | null;
  playByPlayAvailable: boolean | null;
  attendance: number | null;
  homeWinner: boolean | null;
  awayWinner: boolean | null;
  homeLogo: string | null;
  awayLogo: string | null;
  homeColor: string | null;
  awayColor: string | null;
  homeRecord: string | null;
  awayRecord: string | null;
```

- [ ] **Step 3: Populate candidate enrichment fields**

In `buildCandidates`, derive records and team visuals before `return`:

```ts
      const homeRecord = home?.records?.find((record) => record.type === 'total')?.summary ?? home?.records?.[0]?.summary ?? null;
      const awayRecord = away?.records?.find((record) => record.type === 'total')?.summary ?? away?.records?.[0]?.summary ?? null;
```

Also extend `EspnCompetitor` with:

```ts
  winner?: boolean;
  records?: { type?: string; summary?: string }[];
```

and extend `team` with:

```ts
    logo?: string;
    color?: string;
    alternateColor?: string;
```

Then include in the returned candidate:

```ts
        displayClock: event.status?.displayClock ?? null,
        state: statusType?.state ?? null,
        playByPlayAvailable: competition.playByPlayAvailable ?? null,
        attendance: typeof competition.attendance === 'number' ? competition.attendance : null,
        homeWinner: home?.winner ?? null,
        awayWinner: away?.winner ?? null,
        homeLogo: home?.team?.logo ?? null,
        awayLogo: away?.team?.logo ?? null,
        homeColor: home?.team?.color ?? null,
        awayColor: away?.team?.color ?? null,
        homeRecord,
        awayRecord,
```

Also extend `EspnCompetition` with:

```ts
  attendance?: number;
  playByPlayAvailable?: boolean;
```

- [ ] **Step 4: Add summary fetch function**

Add below `fetchScoreboard`:

```ts
async function fetchSummary(eventId: string) {
  const response = await fetch(`${ESPN_BASE_URL.replace('/scoreboard', '/summary')}?event=${eventId}`);
  if (!response.ok) throw new Error(`ESPN summary request failed for ${eventId}: ${response.status} ${response.statusText}`);
  return response.json() as Promise<EspnSummary>;
}
```

- [ ] **Step 5: Add percentage conversion helpers**

Add these helpers before `buildUpdatePlan`:

```ts
function normalizePercentages(home: number, draw: number, away: number) {
  const total = home + draw + away;
  if (!Number.isFinite(total) || total <= 0) return null;

  const raw = [home, draw, away].map((value) => (value / total) * 100);
  const rounded = raw.map(Math.floor);
  let remaining = 100 - rounded.reduce((sum, value) => sum + value, 0);
  const order = raw.map((value, index) => ({ index, remainder: value - Math.floor(value) })).sort((a, b) => b.remainder - a.remainder);

  for (const item of order) {
    if (remaining <= 0) break;
    rounded[item.index] += 1;
    remaining -= 1;
  }

  return { home: rounded[0], draw: rounded[1], away: rounded[2] };
}

function americanOddsToProbability(value: number) {
  if (value > 0) return 100 / (value + 100);
  if (value < 0) return Math.abs(value) / (Math.abs(value) + 100);
  return null;
}

function extractPredictionSignal(summary: EspnSummary) {
  const source = [...(summary.odds ?? []), ...(summary.pickcenter ?? [])] as Record<string, unknown>[];

  for (const item of source) {
    const homeOdds = typeof item.homeTeamOdds === 'object' && item.homeTeamOdds ? item.homeTeamOdds as Record<string, unknown> : null;
    const awayOdds = typeof item.awayTeamOdds === 'object' && item.awayTeamOdds ? item.awayTeamOdds as Record<string, unknown> : null;
    const drawOdds = typeof item.drawOdds === 'object' && item.drawOdds ? item.drawOdds as Record<string, unknown> : null;
    const homeMoneyline = typeof homeOdds?.moneyLine === 'number' ? homeOdds.moneyLine : typeof homeOdds?.moneyline === 'number' ? homeOdds.moneyline : null;
    const awayMoneyline = typeof awayOdds?.moneyLine === 'number' ? awayOdds.moneyLine : typeof awayOdds?.moneyline === 'number' ? awayOdds.moneyline : null;
    const drawMoneyline = typeof drawOdds?.moneyLine === 'number' ? drawOdds.moneyLine : typeof drawOdds?.moneyline === 'number' ? drawOdds.moneyline : null;

    if (homeMoneyline === null || awayMoneyline === null || drawMoneyline === null) continue;

    const home = americanOddsToProbability(homeMoneyline);
    const draw = americanOddsToProbability(drawMoneyline);
    const away = americanOddsToProbability(awayMoneyline);

    if (home !== null && draw !== null && away !== null) return normalizePercentages(home, draw, away);
  }

  return null;
}
```

- [ ] **Step 6: Add summary sanitizers**

Add below percentage helpers:

```ts
function compactBroadcasts(summary: EspnSummary) {
  return (summary.broadcasts ?? []).map((broadcast) => ({
    type: broadcast.type?.shortName ?? broadcast.type?.longName ?? null,
    media: broadcast.media?.shortName ?? broadcast.media?.callLetters ?? broadcast.media?.name ?? null,
    lang: broadcast.lang ?? null,
    region: broadcast.region ?? null,
    isNational: broadcast.isNational ?? null,
  })).filter((broadcast) => broadcast.media);
}

function compactArticles(summary: EspnSummary) {
  return (summary.news?.articles ?? []).slice(0, 5).map((article) => ({
    id: article.id ?? null,
    headline: article.headline ?? null,
    description: article.description ?? null,
    published: article.published ?? null,
    lastModified: article.lastModified ?? null,
    imageUrl: article.images?.find((image) => image.url)?.url ?? null,
    imageCaption: article.images?.find((image) => image.caption)?.caption ?? null,
    href: article.links?.web?.href ?? null,
  })).filter((article) => article.headline);
}

function compactSummary(summary: EspnSummary) {
  return {
    venue: summary.gameInfo?.venue ? {
      fullName: summary.gameInfo.venue.fullName ?? summary.gameInfo.venue.shortName ?? null,
      city: summary.gameInfo.venue.address?.city ?? null,
      country: summary.gameInfo.venue.address?.country ?? null,
    } : null,
    broadcasts: compactBroadcasts(summary),
    teamStats: (summary.boxscore?.teams ?? []).map((team) => ({
      homeAway: team.homeAway ?? null,
      team: team.team ? {
        id: team.team.id ?? null,
        abbreviation: team.team.abbreviation ?? null,
        displayName: team.team.displayName ?? team.team.shortDisplayName ?? null,
        logo: team.team.logo ?? null,
        color: team.team.color ?? null,
        alternateColor: team.team.alternateColor ?? null,
      } : null,
      statistics: (team.statistics ?? []).map((stat) => ({ name: stat.name ?? null, label: stat.label ?? null, displayValue: stat.displayValue ?? null })),
    })),
    leaders: (summary.leaders ?? []).map((team) => ({
      team: team.team ?? null,
      categories: (team.leaders ?? []).map((category) => ({
        name: category.name ?? null,
        displayName: category.displayName ?? null,
        leaders: (category.leaders ?? []).slice(0, 3).map((leader) => ({
          displayValue: leader.displayValue ?? null,
          athlete: leader.athlete ? {
            id: leader.athlete.id ?? null,
            displayName: leader.athlete.displayName ?? leader.athlete.shortName ?? null,
            jersey: leader.athlete.jersey ?? null,
            position: leader.athlete.position?.abbreviation ?? null,
            headshot: leader.athlete.headshot ?? null,
          } : null,
        })),
      })),
    })),
    form: (summary.lastFiveGames ?? summary.boxscore?.form ?? []).map((team) => ({
      team: team.team ?? null,
      events: (team.events ?? []).slice(0, 5).map((event) => ({
        id: event.id ?? null,
        gameDate: event.gameDate ?? null,
        score: event.score ?? null,
        gameResult: event.gameResult ?? null,
        opponent: event.opponent ?? null,
        opponentLogo: event.opponentLogo ?? null,
        competitionName: event.competitionName ?? null,
        roundName: event.roundName ?? null,
      })),
    })),
    articles: compactArticles(summary),
  };
}
```

- [ ] **Step 7: Extend update plan creation to accept summaries**

Change `buildUpdatePlan` signature to:

```ts
function buildUpdatePlan(matches: MatchRow[], candidates: EspnCandidate[], teamMap: Map<string, Database['public']['Tables']['teams']['Row']>, summaries: Map<string, EspnSummary>) {
```

Inside the update object, add:

```ts
      espn_display_clock: best.candidate.displayClock,
      espn_state: best.candidate.state,
      espn_play_by_play_available: best.candidate.playByPlayAvailable,
      espn_attendance: best.candidate.attendance,
      espn_home_winner: best.candidate.homeWinner,
      espn_away_winner: best.candidate.awayWinner,
      espn_home_logo: best.candidate.homeLogo,
      espn_away_logo: best.candidate.awayLogo,
      espn_home_color: best.candidate.homeColor,
      espn_away_color: best.candidate.awayColor,
      espn_home_record: best.candidate.homeRecord,
      espn_away_record: best.candidate.awayRecord,
```

After the live/finished score block, add:

```ts
    const summary = summaries.get(best.candidate.eventId);
    if (summary) {
      const signal = extractPredictionSignal(summary);
      if (signal) {
        update.espn_home_win_pct = signal.home;
        update.espn_draw_pct = signal.draw;
        update.espn_away_win_pct = signal.away;
        update.espn_prediction_updated_at = new Date().toISOString();
      }
      update.espn_summary = compactSummary(summary);
      update.espn_summary_updated_at = new Date().toISOString();
    }
```

- [ ] **Step 8: Fetch summaries in `main` after candidates are matched once**

Replace the start of `main` after candidates are built with this flow:

```ts
  const initialPlans = buildUpdatePlan(matches, candidates, teamMap, new Map());
  const summaries = new Map<string, EspnSummary>();

  for (const plan of initialPlans) {
    summaries.set(plan.candidate.eventId, await fetchSummary(plan.candidate.eventId));
  }

  const plans = buildUpdatePlan(matches, candidates, teamMap, summaries);
```

Keep `unmatchedCandidates` based on final `plans`.

- [ ] **Step 9: Ensure SQL JSON values are escaped correctly**

Change `sqlValue` signature to:

```ts
function sqlValue(value: string | number | boolean | null | undefined | Record<string, unknown> | unknown[]) {
```

Add before string handling:

```ts
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
```

- [ ] **Step 10: Run ESPN dry-run SQL output**

Run:

```bash
npm run data:sync:espn -- --sql-out C:/Users/LG/AppData/Local/Temp/espn-enrichment-update.sql
```

Expected: output reports matched updates and writes SQL.

- [ ] **Step 11: Inspect generated SQL for forbidden raw fields**

Run:

```bash
python - <<'PY'
from pathlib import Path
sql = Path('C:/Users/LG/AppData/Local/Temp/espn-enrichment-update.sql').read_text(encoding='utf-8')
for token in ['moneyline', 'moneyLine', 'spread', 'overUnder', 'provider', 'sportsbook', 'disclaimer', 'pickcenter']:
    if token.lower() in sql.lower():
        raise SystemExit(f'Forbidden token found: {token}')
print('sanitized')
PY
```

Expected: prints `sanitized`.

- [ ] **Step 12: Run lint**

Run:

```bash
npm run lint
```

Expected: exit code 0.

---

### Task 4: Add outcome selector to Picks and Match Detail

**Files:**
- Modify `src/Picks.tsx`
- Modify `src/pages/MatchDetail.tsx`

- [ ] **Step 1: Add outcome helpers to `src/Picks.tsx`**

Add below `isMatchEditable`:

```ts
type PredictionOutcome = 'home' | 'draw' | 'away';
type DraftPick = { homeScore: string; awayScore: string; predictedOutcome: PredictionOutcome | '' };
type DraftScores = Record<string, DraftPick>;

function getOutcomeFromScores(homeScore: string, awayScore: string): PredictionOutcome | '' {
  if (homeScore === '' || awayScore === '') return '';
  const home = Number(homeScore);
  const away = Number(awayScore);
  if (!Number.isInteger(home) || !Number.isInteger(away)) return '';
  if (home > away) return 'home';
  if (home < away) return 'away';
  return 'draw';
}
```

Then remove the existing `type DraftScores = Record<string, { homeScore: string; awayScore: string }>;` near the top.

- [ ] **Step 2: Initialize draft outcomes in `Picks.tsx`**

Replace `setDraftScores(Object.fromEntries(...))` with:

```ts
        setDraftScores(Object.fromEntries(nextPredictions.map((prediction) => [prediction.match_id, {
          homeScore: String(prediction.home_score),
          awayScore: String(prediction.away_score),
          predictedOutcome: prediction.predicted_outcome ?? getOutcomeFromScores(String(prediction.home_score), String(prediction.away_score)),
        }])));
```

- [ ] **Step 3: Update score draft function in `Picks.tsx`**

Replace `updateDraft` with:

```ts
  function updateDraft(matchId: string, key: 'homeScore' | 'awayScore', value: string) {
    setDraftScores((current) => {
      const next = {
        homeScore: current[matchId]?.homeScore ?? '',
        awayScore: current[matchId]?.awayScore ?? '',
        predictedOutcome: current[matchId]?.predictedOutcome ?? '',
        [key]: value,
      };
      return {
        ...current,
        [matchId]: {
          ...next,
          predictedOutcome: getOutcomeFromScores(next.homeScore, next.awayScore),
        },
      };
    });
  }

  function updateOutcome(matchId: string, predictedOutcome: PredictionOutcome) {
    setDraftScores((current) => ({
      ...current,
      [matchId]: {
        homeScore: current[matchId]?.homeScore ?? '',
        awayScore: current[matchId]?.awayScore ?? '',
        predictedOutcome,
      },
    }));
  }
```

- [ ] **Step 4: Validate outcome in `saveMatchPrediction`**

After score validation, add:

```ts
    const predictedOutcome = draft?.predictedOutcome || getOutcomeFromScores(draft?.homeScore ?? '', draft?.awayScore ?? '');
    if (!predictedOutcome || predictedOutcome !== getOutcomeFromScores(draft?.homeScore ?? '', draft?.awayScore ?? '')) {
      setSubmitState((current) => ({ ...current, [match.id]: { error: 'Pick a result that matches your score.' } }));
      return;
    }
```

Then change submit call to:

```ts
      await submitPrediction({ matchId: match.id, homeScore, awayScore, predictedOutcome });
```

- [ ] **Step 5: Render outcome selector in `Picks.tsx`**

After the exact score input row, insert:

```tsx
                            <div className="mt-2 grid grid-cols-3 border-2 border-main text-[8px] font-black uppercase overflow-hidden w-[180px]">
                              {[
                                { value: 'home' as const, label: homeTeam?.short_name ?? 'HOME' },
                                { value: 'draw' as const, label: 'DRAW' },
                                { value: 'away' as const, label: awayTeam?.short_name ?? 'AWAY' },
                              ].map((option) => (
                                <button
                                  key={option.value}
                                  type="button"
                                  disabled={!editable || state?.loading}
                                  onClick={() => updateOutcome(match.id, option.value)}
                                  className={`${draft.predictedOutcome === option.value ? 'bg-c3 text-main' : 'bg-card hover:bg-elevated'} border-r-2 last:border-r-0 border-main py-1 disabled:bg-muted disabled:text-subtle`}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
```

- [ ] **Step 6: Add outcome state/helpers to `MatchDetail.tsx`**

Add near the existing score state:

```ts
  const [predictedOutcome, setPredictedOutcome] = useState<'home' | 'draw' | 'away' | ''>('');
```

Add helper near `getStatusTone`:

```ts
function getOutcomeFromScores(homeScore: string, awayScore: string): 'home' | 'draw' | 'away' | '' {
  if (homeScore === '' || awayScore === '') return '';
  const home = Number(homeScore);
  const away = Number(awayScore);
  if (!Number.isInteger(home) || !Number.isInteger(away)) return '';
  if (home > away) return 'home';
  if (home < away) return 'away';
  return 'draw';
}
```

- [ ] **Step 7: Sync outcome in Match Detail effects/inputs**

In the effect that sets `homeScore` and `awayScore`, add:

```ts
    setPredictedOutcome(existingPrediction ? getOutcomeFromScores(String(existingPrediction.homeScore), String(existingPrediction.awayScore)) : '');
```

For each score input `onChange`, update to set score and outcome:

```tsx
onChange={(event) => {
  const next = event.target.value;
  setHomeScore(next);
  setPredictedOutcome(getOutcomeFromScores(next, awayScore));
}}
```

and:

```tsx
onChange={(event) => {
  const next = event.target.value;
  setAwayScore(next);
  setPredictedOutcome(getOutcomeFromScores(homeScore, next));
}}
```

- [ ] **Step 8: Validate and store local mock outcome in Match Detail**

In `handleSubmit`, after score validation add:

```ts
    const nextOutcome = getOutcomeFromScores(homeScore, awayScore);
    if (!nextOutcome || predictedOutcome !== nextOutcome) return;
```

When setting local submitted prediction, add:

```ts
      predictedOutcome: nextOutcome,
```

- [ ] **Step 9: Render outcome selector in Match Detail**

Below the exact score inputs, add:

```tsx
                <div className="grid grid-cols-3 border-[3px] border-main font-black uppercase text-xs overflow-hidden">
                  {[
                    { value: 'home' as const, label: `${homeTeam.short_name} WIN` },
                    { value: 'draw' as const, label: 'DRAW' },
                    { value: 'away' as const, label: `${awayTeam.short_name} WIN` },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      disabled={isLocked}
                      onClick={() => setPredictedOutcome(option.value)}
                      className={`${predictedOutcome === option.value ? 'bg-c3 text-main' : 'bg-card hover:bg-elevated'} border-r-[3px] last:border-r-0 border-main py-3 disabled:bg-muted disabled:text-subtle`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
```

- [ ] **Step 10: Run lint**

Run:

```bash
npm run lint
```

Expected: exit code 0.

---

### Task 5: Add Community vs ESPN Signal and ESPN context to Match Detail

**Files:**
- Modify `src/pages/MatchDetail.tsx`

- [ ] **Step 1: Import aggregate service**

Update imports:

```ts
import { getMatchPredictionOutcomeSummary, type MatchPredictionOutcomeSummary } from '../services/predictions';
```

- [ ] **Step 2: Add ESPN summary types in Match Detail**

Add below props type:

```ts
type EspnSummaryPayload = {
  venue?: { fullName?: string | null; city?: string | null; country?: string | null } | null;
  broadcasts?: { type?: string | null; media?: string | null; lang?: string | null; region?: string | null; isNational?: boolean | null }[];
  teamStats?: { homeAway?: 'home' | 'away' | null; team?: { abbreviation?: string | null; displayName?: string | null; logo?: string | null; color?: string | null } | null; statistics?: { name?: string | null; label?: string | null; displayValue?: string | null }[] }[];
  leaders?: { team?: { abbreviation?: string; displayName?: string } | null; categories?: { name?: string | null; displayName?: string | null; leaders?: { displayValue?: string | null; athlete?: { displayName?: string | null; jersey?: string | null; position?: string | null; headshot?: string | null } | null }[] }[] }[];
  form?: { team?: { abbreviation?: string; displayName?: string } | null; events?: { id?: string | null; gameDate?: string | null; score?: string | null; gameResult?: string | null; opponent?: { abbreviation?: string; displayName?: string } | null; opponentLogo?: string | null; competitionName?: string | null; roundName?: string | null }[] }[];
  articles?: { id?: string | null; headline?: string | null; description?: string | null; published?: string | null; imageUrl?: string | null; href?: string | null }[];
};
```

- [ ] **Step 3: Add summary/community state**

Add state near existing match state:

```ts
  const [communitySummary, setCommunitySummary] = useState<MatchPredictionOutcomeSummary | null>(null);
```

- [ ] **Step 4: Fetch community summary with match**

Change `Promise.all([getMatch(matchId), getTeamMap()])` to:

```ts
    Promise.all([getMatch(matchId), getTeamMap(), getMatchPredictionOutcomeSummary(matchId)])
      .then(([nextMatch, nextTeams, nextCommunitySummary]) => {
        if (!active) return;
        setMatch(nextMatch);
        setTeams(nextTeams);
        setCommunitySummary(nextCommunitySummary);
      })
```

Also set `communitySummary` to `null` in the `!matchId` branch and catch branch.

- [ ] **Step 5: Add display helpers**

Add near `formatDateTime`:

```ts
function getPct(value: number | null | undefined) {
  return typeof value === 'number' ? `${value}%` : '—';
}

function getCommunityPercentages(summary: MatchPredictionOutcomeSummary | null) {
  const total = summary?.total_predictions ?? 0;
  if (!total) return null;
  return {
    home: Math.round(((summary?.home_predictions ?? 0) / total) * 100),
    draw: Math.round(((summary?.draw_predictions ?? 0) / total) * 100),
    away: Math.round(((summary?.away_predictions ?? 0) / total) * 100),
    total,
  };
}

function getLiveLabel(match: MatchRow) {
  if (match.status === 'live') return match.espn_display_clock ? `LIVE ${match.espn_display_clock}` : 'LIVE';
  if (match.status === 'finished') return 'FULL TIME';
  if (match.espn_state === 'in') return match.espn_display_clock ? `LIVE ${match.espn_display_clock}` : 'LIVE';
  return match.espn_status_detail ?? formatDateTime(match.kickoff_at);
}
```

- [ ] **Step 6: Derive summary payload**

After `displayStatus`, add:

```ts
  const espnSummary = match.espn_summary as EspnSummaryPayload | null;
  const communityPct = getCommunityPercentages(communitySummary);
```

- [ ] **Step 7: Add live strip and Community vs ESPN Signal**

Below the stat cards grid and before the main flex row, add:

```tsx
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.4fr] border-b-4 border-main">
            <div className="bg-main text-inv p-4 lg:p-5 border-b-4 xl:border-b-0 xl:border-r-4 border-main">
              <div className="font-black uppercase text-xs tracking-widest opacity-80">Live match signal</div>
              <div className="font-black text-3xl uppercase tracking-tighter mt-1">{getLiveLabel(match)}</div>
              <div className="font-bold text-xs uppercase mt-2 opacity-80">
                {match.espn_play_by_play_available ? 'Play-by-play available' : 'Scoreboard updates'}{typeof match.espn_attendance === 'number' ? ` · Attendance ${match.espn_attendance.toLocaleString()}` : ''}
              </div>
            </div>
            <div className="bg-card p-4 lg:p-5">
              <div className="font-black uppercase text-sm mb-3">Community vs ESPN Signal</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <SignalRow title="Community picks" homeLabel={homeTeam.short_name} awayLabel={awayTeam.short_name} homePct={communityPct?.home} drawPct={communityPct?.draw} awayPct={communityPct?.away} emptyText="No community picks yet" />
                <SignalRow title="ESPN signal" homeLabel={homeTeam.short_name} awayLabel={awayTeam.short_name} homePct={match.espn_home_win_pct} drawPct={match.espn_draw_pct} awayPct={match.espn_away_win_pct} emptyText="No ESPN signal yet" />
              </div>
              <div className="mt-3 text-[10px] font-bold uppercase text-subtle">ESPN signal is derived from external match data and shown for prediction context only.</div>
            </div>
          </div>
```

- [ ] **Step 8: Add `SignalRow` component**

Add above default component:

```tsx
function SignalRow({ title, homeLabel, awayLabel, homePct, drawPct, awayPct, emptyText }: { title: string; homeLabel: string; awayLabel: string; homePct?: number | null; drawPct?: number | null; awayPct?: number | null; emptyText: string }) {
  const hasData = typeof homePct === 'number' && typeof drawPct === 'number' && typeof awayPct === 'number';

  return (
    <div className="border-2 border-main bg-page p-3">
      <div className="font-black uppercase text-xs mb-2">{title}</div>
      {hasData ? (
        <div className="grid grid-cols-3 gap-2 text-center">
          {[{ label: homeLabel, value: homePct }, { label: 'DRAW', value: drawPct }, { label: awayLabel, value: awayPct }].map((item) => (
            <div key={item.label} className="border-2 border-main bg-card p-2">
              <div className="font-black text-lg">{getPct(item.value)}</div>
              <div className="font-bold uppercase text-[9px] text-subtle">{item.label}</div>
            </div>
          ))}
        </div>
      ) : <div className="font-bold uppercase text-xs text-subtle">{emptyText}</div>}
    </div>
  );
}
```

- [ ] **Step 9: Add ESPN context sections**

After the main match/prediction flex row, add:

```tsx
          {espnSummary && (
            <div className="grid grid-cols-1 xl:grid-cols-2 border-t-4 border-main bg-card">
              <div className="border-b-4 xl:border-b-0 xl:border-r-4 border-main p-4 lg:p-5">
                <div className="font-black uppercase text-sm mb-3">Venue & Broadcast</div>
                <div className="font-black text-xl uppercase">{espnSummary.venue?.fullName ?? match.stadium}</div>
                <div className="font-bold uppercase text-xs text-subtle mt-1">{[espnSummary.venue?.city ?? match.city, espnSummary.venue?.country].filter(Boolean).join(', ')}</div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {(espnSummary.broadcasts ?? []).slice(0, 8).map((broadcast, index) => (
                    <span key={`${broadcast.media}-${index}`} className="border-2 border-main bg-page px-2 py-1 font-black uppercase text-[10px]">{broadcast.media}</span>
                  ))}
                  {!espnSummary.broadcasts?.length && <span className="font-bold uppercase text-xs text-subtle">No broadcast data yet</span>}
                </div>
              </div>

              <div className="p-4 lg:p-5">
                <div className="font-black uppercase text-sm mb-3">Team Leaders</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(espnSummary.leaders ?? []).slice(0, 2).map((team, index) => (
                    <div key={`${team.team?.abbreviation}-${index}`} className="border-2 border-main bg-page p-3">
                      <div className="font-black uppercase text-xs mb-2">{team.team?.displayName ?? team.team?.abbreviation ?? `Team ${index + 1}`}</div>
                      {(team.categories ?? []).slice(0, 4).map((category) => (
                        <div key={category.name ?? category.displayName} className="flex justify-between gap-2 border-b border-line py-1 last:border-b-0 text-xs font-bold">
                          <span className="uppercase text-subtle">{category.displayName ?? category.name}</span>
                          <span>{category.leaders?.[0]?.athlete?.displayName ?? '—'} {category.leaders?.[0]?.displayValue ? `(${category.leaders[0].displayValue})` : ''}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
```

- [ ] **Step 10: Add form/news compact section**

After the previous section, add:

```tsx
          {espnSummary && (
            <div className="grid grid-cols-1 xl:grid-cols-2 border-t-4 border-main bg-card">
              <div className="border-b-4 xl:border-b-0 xl:border-r-4 border-main p-4 lg:p-5">
                <div className="font-black uppercase text-sm mb-3">Recent Form</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(espnSummary.form ?? []).slice(0, 2).map((team, index) => (
                    <div key={`${team.team?.abbreviation}-${index}`} className="border-2 border-main bg-page p-3">
                      <div className="font-black uppercase text-xs mb-2">{team.team?.displayName ?? team.team?.abbreviation ?? `Team ${index + 1}`}</div>
                      {(team.events ?? []).slice(0, 5).map((event) => (
                        <div key={event.id} className="flex justify-between gap-2 border-b border-line py-1 last:border-b-0 text-xs font-bold">
                          <span>{event.opponent?.abbreviation ?? event.opponent?.displayName ?? 'OPP'}</span>
                          <span className="uppercase">{event.gameResult ?? '—'} {event.score ?? ''}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 lg:p-5">
                <div className="font-black uppercase text-sm mb-3">ESPN News</div>
                <div className="flex flex-col gap-2">
                  {(espnSummary.articles ?? []).slice(0, 4).map((article) => (
                    <a key={article.id ?? article.href} href={article.href ?? '#'} target="_blank" rel="noreferrer" className="border-2 border-main bg-page p-3 hover:bg-elevated">
                      <div className="font-black uppercase text-xs">{article.headline}</div>
                      {article.description && <div className="font-bold text-xs text-subtle mt-1 line-clamp-2">{article.description}</div>}
                      <div className="font-black uppercase text-[9px] text-subtle mt-2">Source: ESPN</div>
                    </a>
                  ))}
                  {!espnSummary.articles?.length && <div className="font-bold uppercase text-xs text-subtle">No ESPN articles yet</div>}
                </div>
              </div>
            </div>
          )}
```

- [ ] **Step 11: Run lint**

Run:

```bash
npm run lint
```

Expected: exit code 0.

---

### Task 6: Apply ESPN enrichment and verify end-to-end

**Files:**
- Generated SQL file outside repo: `C:/Users/LG/AppData/Local/Temp/espn-enrichment-update.sql`

- [ ] **Step 1: Generate ESPN enrichment SQL**

Run:

```bash
npm run data:sync:espn -- --sql-out C:/Users/LG/AppData/Local/Temp/espn-enrichment-update.sql
```

Expected: matched updates are printed and SQL file is written.

- [ ] **Step 2: Confirm generated SQL is sanitized**

Run:

```bash
python - <<'PY'
from pathlib import Path
sql = Path('C:/Users/LG/AppData/Local/Temp/espn-enrichment-update.sql').read_text(encoding='utf-8')
for token in ['moneyline', 'moneyLine', 'spread', 'overUnder', 'provider', 'sportsbook', 'disclaimer', 'pickcenter']:
    if token.lower() in sql.lower():
        raise SystemExit(f'Forbidden token found: {token}')
print('sanitized')
PY
```

Expected: prints `sanitized`.

- [ ] **Step 3: Apply SQL to Supabase Cloud**

Run:

```bash
supabase db query --linked --file "C:/Users/LG/AppData/Local/Temp/espn-enrichment-update.sql"
```

Expected: command succeeds.

- [ ] **Step 4: Verify enriched rows**

Run:

```bash
supabase db query --linked "select id, espn_home_win_pct, espn_draw_pct, espn_away_win_pct, espn_display_clock, espn_state, espn_summary is not null as has_summary from public.matches where espn_event_id is not null order by id;"
```

Expected: matched rows return. Percentage fields may be null if ESPN does not provide convertible source data for that event yet; `has_summary` should be true for successfully fetched summaries.

- [ ] **Step 5: Run lint**

Run:

```bash
npm run lint
```

Expected: exit code 0.

- [ ] **Step 6: Run production build**

Run:

```bash
npm run build
```

Expected: exit code 0. Existing Vite chunk-size warning is acceptable.

- [ ] **Step 7: Manual UI verification without starting another dev server**

Use the user's already-running frontend on port 3000. Do not run `npm run dev`.

Open these existing routes manually in the browser:

```txt
http://localhost:3000/picks
http://localhost:3000/matches/wc2026-003
```

Verify:
- Picks page shows exact score inputs and home/draw/away result selector.
- Changing scores auto-selects the matching result.
- Selecting a result that conflicts with score does not submit.
- Match detail shows Community vs ESPN Signal.
- Match detail shows live/status strip.
- Match detail shows ESPN venue/broadcast/leader/form/news sections when data exists.
- No UI text says bet, odds, sportsbook, wager, moneyline, spread, over/under, or provider.

---

## Self-review

Spec coverage:
- Explicit outcome prediction: Task 1, Task 2, Task 4.
- Community vs ESPN Signal: Task 1, Task 2, Task 5.
- ESPN scoreboard live fields: Task 1, Task 3, Task 5.
- ESPN summary venue/broadcast/stats/leaders/form/news: Task 1, Task 3, Task 5.
- Sanitized ESPN percentage conversion: Task 3 and Task 6.
- No extra frontend dev server: Task 6 Step 7.

Placeholder scan:
- No TBD/TODO placeholders are intentionally present.
- Every code-changing step includes exact code or command.

Type consistency:
- Prediction outcome values are consistently `'home' | 'draw' | 'away'`.
- Database column is `predicted_outcome`; frontend input is `predictedOutcome`.
- ESPN percentage columns are `espn_home_win_pct`, `espn_draw_pct`, and `espn_away_win_pct`.
