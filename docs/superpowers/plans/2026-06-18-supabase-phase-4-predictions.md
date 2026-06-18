# Supabase Phase 4 Predictions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make prediction read/write real using Supabase Auth, Postgres, RLS, and the `submit_prediction` Edge Function.

**Architecture:** The client reads the signed-in user's predictions through RLS. Writes go through an Edge Function so server time and match lock rules cannot be bypassed from the browser.

**Tech Stack:** Supabase Edge Functions, Deno TypeScript, Supabase JS, React/Vite, TypeScript.

---

## Files

- Create: `supabase/functions/submit_prediction/index.ts`
- Create: `src/services/predictions.ts`
- Modify: `src/Picks.tsx`
- Modify: `src/pages/MyPredictions.tsx`
- Modify: `src/pages/PredictionBreakdown.tsx`
- Modify: `src/pages/Profile.tsx`

## Task 1: Create `submit_prediction` Edge Function

- [ ] **Step 1: Create function scaffold**

Run:

```bash
supabase functions new submit_prediction
```

Expected: creates `supabase/functions/submit_prediction/index.ts`.

- [ ] **Step 2: Implement function**

Replace the generated function with:

```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type SubmitPredictionBody = {
  matchId: string;
  homeScore: number;
  awayScore: number;
  confidence?: number;
  isRiskPick?: boolean;
};

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing authorization header' }), { status: 401 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Missing Supabase server config' }), { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const body = await req.json() as SubmitPredictionBody;
  if (!body.matchId || !Number.isInteger(body.homeScore) || !Number.isInteger(body.awayScore) || body.homeScore < 0 || body.awayScore < 0) {
    return new Response(JSON.stringify({ error: 'Invalid prediction payload' }), { status: 400 });
  }

  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('id, lock_at, status')
    .eq('id', body.matchId)
    .single();

  if (matchError || !match) {
    return new Response(JSON.stringify({ error: 'Match not found' }), { status: 404 });
  }

  if (new Date() >= new Date(match.lock_at)) {
    return new Response(JSON.stringify({ error: 'Prediction deadline has passed' }), { status: 409 });
  }

  const { data: existing } = await supabase
    .from('predictions')
    .select('id, revision')
    .eq('user_id', userData.user.id)
    .eq('match_id', body.matchId)
    .maybeSingle();

  const predictionValues = {
    user_id: userData.user.id,
    match_id: body.matchId,
    home_score: body.homeScore,
    away_score: body.awayScore,
    confidence: body.confidence ?? 50,
    is_risk_pick: body.isRiskPick ?? false,
    status: 'submitted',
    revision: existing ? existing.revision + 1 : 1,
    updated_at: new Date().toISOString(),
  };

  const { data: prediction, error: upsertError } = await supabase
    .from('predictions')
    .upsert(predictionValues, { onConflict: 'user_id,match_id' })
    .select('*')
    .single();

  if (upsertError) {
    return new Response(JSON.stringify({ error: upsertError.message }), { status: 500 });
  }

  await supabase.from('activity_events').insert({
    type: 'prediction_locked',
    title: existing ? 'Prediction updated' : 'Prediction submitted',
    description: `Prediction saved for match ${body.matchId}.`,
    user_id: userData.user.id,
    match_id: body.matchId,
    prediction_id: prediction.id,
    href: '/my-predictions',
  });

  return new Response(JSON.stringify({ prediction }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
```

- [ ] **Step 3: Serve function locally**

Run:

```bash
supabase functions serve submit_prediction
```

Expected: function server starts locally. Stop it after manual testing.

## Task 2: Add predictions service

- [ ] **Step 1: Create `src/services/predictions.ts`**

```ts
import { supabase } from '../lib/supabaseClient';

export async function listCurrentUserPredictions() {
  const { data, error } = await supabase
    .from('predictions')
    .select('*, matches(*)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getPrediction(predictionId: string) {
  const { data, error } = await supabase
    .from('predictions')
    .select('*, matches(*)')
    .eq('id', predictionId)
    .single();

  if (error) throw error;
  return data;
}

export async function submitPrediction(input: {
  matchId: string;
  homeScore: number;
  awayScore: number;
  confidence?: number;
  isRiskPick?: boolean;
}) {
  const { data, error } = await supabase.functions.invoke('submit_prediction', {
    body: input,
  });

  if (error) throw error;
  return data;
}
```

## Task 3: Migrate prediction pages

- [ ] **Step 1: Update `MyPredictions.tsx`**

Replace `mockPredictions` with `listCurrentUserPredictions()`. Keep scoring display logic temporarily client-side using fetched `matches` result fields.

- [ ] **Step 2: Update `PredictionBreakdown.tsx`**

Replace mock lookup with `getPrediction(predictionId)`. Preserve route `/predictions/:predictionId`.

- [ ] **Step 3: Update `Picks.tsx` submit flow**

Use `submitPrediction({ matchId, homeScore, awayScore, confidence, isRiskPick })` when the user submits a pick. Show function errors inside the existing brutalist card layout.

- [ ] **Step 4: Update `Profile.tsx` recent predictions**

Replace user prediction mock slice with `listCurrentUserPredictions()`.

## Task 4: Verify prediction rules

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

- [ ] **Step 3: Submit before lock**

With a signed-in seeded user, submit a prediction for an open match.

Expected: `predictions` has one row for `(user_id, match_id)` and revision is `1`.

- [ ] **Step 4: Edit before lock**

Submit the same match again with a different score.

Expected: same row is updated and revision increments.

- [ ] **Step 5: Submit after lock**

Set the match `lock_at` in the local database to a past timestamp, then submit again.

Expected: function returns `409` with `Prediction deadline has passed` and the row is not changed.
