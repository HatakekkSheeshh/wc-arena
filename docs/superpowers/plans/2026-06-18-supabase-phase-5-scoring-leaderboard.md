# Supabase Phase 5 Scoring and Leaderboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move scoring and leaderboard updates to Supabase Edge Functions so finished match results produce stored prediction scores and leaderboard entries.

**Architecture:** Admin-triggered Edge Functions update match results and recalculate scoring. The frontend reads stored `prediction_scores` and `leaderboard_entries` rather than recalculating rankings on every page load.

**Tech Stack:** Supabase Edge Functions, Supabase Postgres, TypeScript, React/Vite services.

---

## Files

- Create: `supabase/functions/update_match_result/index.ts`
- Create: `supabase/functions/recalculate_scores/index.ts`
- Create: `src/services/admin.ts`
- Modify: `src/services/leaderboard.ts`
- Modify: `src/pages/MyPredictions.tsx`
- Modify: `src/pages/PredictionBreakdown.tsx`
- Modify: `src/Leaderboard.tsx`
- Modify: `src/pages/AdminDashboard.tsx`

## Task 1: Create `update_match_result` Edge Function

- [ ] **Step 1: Create function scaffold**

```bash
supabase functions new update_match_result
```

Expected: creates `supabase/functions/update_match_result/index.ts`.

- [ ] **Step 2: Implement admin check helper inline**

Use this pattern inside the function after `supabase.auth.getUser()`:

```ts
const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', userData.user.id)
  .single();

if (profileError || profile?.role !== 'admin') {
  return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
}
```

- [ ] **Step 3: Implement result update**

The request body should be:

```ts
type UpdateMatchResultBody = {
  matchId: string;
  homeScore: number;
  awayScore: number;
};
```

Update the match:

```ts
await supabase
  .from('matches')
  .update({
    home_score: body.homeScore,
    away_score: body.awayScore,
    status: 'finished',
    result_updated_at: new Date().toISOString(),
  })
  .eq('id', body.matchId);
```

Insert audit log:

```ts
await supabase.from('admin_audit_logs').insert({
  actor_id: userData.user.id,
  action: 'match_result_imported',
  entity_type: 'match',
  entity_id: body.matchId,
  description: `Updated result to ${body.homeScore}-${body.awayScore}.`,
  severity: 'info',
});
```

## Task 2: Create `recalculate_scores` Edge Function

- [ ] **Step 1: Create function scaffold**

```bash
supabase functions new recalculate_scores
```

Expected: creates `supabase/functions/recalculate_scores/index.ts`.

- [ ] **Step 2: Implement scoring helpers**

Use these pure helpers in the function:

```ts
type Score = { home_score: number; away_score: number };

type PredictionRow = {
  id: string;
  user_id: string;
  home_score: number;
  away_score: number;
  is_risk_pick: boolean;
  matches: Score;
};

function getOutcome(score: Score) {
  if (score.home_score > score.away_score) return 'home';
  if (score.home_score < score.away_score) return 'away';
  return 'draw';
}

function getPredictionOutcome(prediction: PredictionRow) {
  const exact = prediction.home_score === prediction.matches.home_score && prediction.away_score === prediction.matches.away_score;
  if (exact) return 'exact';
  return getOutcome(prediction) === getOutcome(prediction.matches) ? 'correct' : 'missed';
}

function calculateScore(prediction: PredictionRow) {
  const outcome = getPredictionOutcome(prediction);
  const exactScore = outcome === 'exact' ? 3 : 0;
  const correctOutcome = outcome === 'correct' ? 1 : 0;
  const riskMultiplier = prediction.is_risk_pick ? 1 : 1;
  return {
    outcome,
    exact_score: exactScore,
    correct_outcome: correctOutcome,
    streak_bonus: 0,
    risk_multiplier: riskMultiplier,
    underdog_bonus: 0,
    total: (exactScore + correctOutcome) * riskMultiplier,
    scoring_version: 'mvp-2026-06-15',
    calculated_at: new Date().toISOString(),
  };
}
```

- [ ] **Step 3: Fetch finished predictions**

Query:

```ts
const { data: predictions, error } = await supabase
  .from('predictions')
  .select('id, user_id, home_score, away_score, is_risk_pick, matches!inner(home_score, away_score, status)')
  .eq('matches.status', 'finished');
```

Expected: finished-match predictions are returned.

- [ ] **Step 4: Upsert prediction scores**

For each prediction, upsert:

```ts
await supabase.from('prediction_scores').upsert({
  prediction_id: prediction.id,
  ...calculateScore(prediction),
});
```

- [ ] **Step 5: Rebuild global leaderboard**

Aggregate totals by `user_id` from calculated scores. Sort by points desc, exact scores desc, accuracy desc. Upsert `leaderboard_entries` rows with `scope = 'global'`.

- [ ] **Step 6: Update profile cached stats**

For each user aggregate, update:

```ts
await supabase.from('profiles').update({
  points: aggregate.points,
  rank: aggregate.rank,
  accuracy: aggregate.accuracy,
  exact_scores: aggregate.exactScores,
  current_streak: aggregate.streak,
  best_streak: aggregate.streak,
}).eq('id', aggregate.userId);
```

- [ ] **Step 7: Insert audit log**

Insert `score_recalculation_preview` or `score_recalculation_completed` action. If the existing action enum in TypeScript lacks completed, use `score_recalculation_preview` for MVP consistency.

## Task 3: Add admin service wrappers

- [ ] **Step 1: Create `src/services/admin.ts`**

```ts
import { supabase } from '../lib/supabaseClient';

export async function updateMatchResult(input: { matchId: string; homeScore: number; awayScore: number }) {
  const { data, error } = await supabase.functions.invoke('update_match_result', { body: input });
  if (error) throw error;
  return data;
}

export async function recalculateScores() {
  const { data, error } = await supabase.functions.invoke('recalculate_scores', { body: {} });
  if (error) throw error;
  return data;
}

export async function listAdminAuditLogs() {
  const { data, error } = await supabase
    .from('admin_audit_logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
```

## Task 4: Read stored scores in frontend

- [ ] **Step 1: Update predictions service**

Change `listCurrentUserPredictions()` select to include scores:

```ts
.select('*, matches(*), prediction_scores(*)')
```

- [ ] **Step 2: Update `MyPredictions.tsx`**

Use `prediction_scores.total` when present. Fall back to client-side calculation only when `prediction_scores` is missing during migration.

- [ ] **Step 3: Update `PredictionBreakdown.tsx`**

Display stored score breakdown fields from `prediction_scores`.

## Task 5: Verify scoring

- [ ] **Step 1: Run function locally**

```bash
supabase functions serve recalculate_scores
```

Expected: function starts locally.

- [ ] **Step 2: Trigger recalculation as admin user**

Invoke the function with an admin user's JWT.

Expected: `prediction_scores` rows are created and `leaderboard_entries` changes.

- [ ] **Step 3: Verify exact score scoring**

Query:

```sql
select prediction_id, exact_score, correct_outcome, total from public.prediction_scores order by calculated_at desc limit 10;
```

Expected: exact scores have `exact_score = 3`, correct outcomes have `correct_outcome = 1`, misses have `total = 0`.

- [ ] **Step 4: Run lint and build**

```bash
npm run lint
npm run build
```

Expected: both exit 0. Existing chunk warning is acceptable.
