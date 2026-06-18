# Supabase Phase 6 Badges, Activity, Admin, and Rewards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace remaining mock reads for badges, activity, rewards, and admin/audit pages with Supabase-backed read-only/manual-review data.

**Architecture:** Badge and activity pages read user-owned rows through RLS. Rewards are user-visible manual review rows, not wallet or payout automation. Admin pages are protected by admin role checks and remain non-destructive.

**Tech Stack:** React 19, Vite, TypeScript, Supabase JS, Supabase RLS.

---

## Files

- Create: `src/services/badges.ts`
- Create: `src/services/activity.ts`
- Create: `src/services/rewards.ts`
- Modify: `src/pages/Badges.tsx`
- Modify: `src/pages/Activity.tsx`
- Modify: `src/pages/Rewards.tsx`
- Modify: `src/pages/AdminDashboard.tsx`
- Modify: `src/pages/AdminAudit.tsx`
- Modify: `src/components/layout/AppShell.tsx`

## Task 1: Add badges service

- [ ] **Step 1: Create `src/services/badges.ts`**

```ts
import { supabase } from '../lib/supabaseClient';

export async function listBadgeCatalog() {
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .order('category');

  if (error) throw error;
  return data;
}

export async function listCurrentUserBadges() {
  const { data, error } = await supabase
    .from('user_badges')
    .select('*, badges(*)')
    .order('unlocked_at', { ascending: false, nullsFirst: false });

  if (error) throw error;
  return data;
}
```

- [ ] **Step 2: Update `Badges.tsx`**

Replace `mockBadges` with `listCurrentUserBadges()`. Keep the attached-card layout. Use joined `badges` fields for name, description, category, rarity, and progress target.

## Task 2: Add activity service

- [ ] **Step 1: Create `src/services/activity.ts`**

```ts
import { supabase } from '../lib/supabaseClient';

export async function listCurrentUserActivity() {
  const { data, error } = await supabase
    .from('activity_events')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
```

- [ ] **Step 2: Update `Activity.tsx`**

Replace `mockActivity` with `listCurrentUserActivity()`. Preserve existing filter counts, icon mapping, links, and attached-card layout.

## Task 3: Add rewards service

- [ ] **Step 1: Create `src/services/rewards.ts`**

```ts
import { supabase } from '../lib/supabaseClient';

export async function listCurrentUserRewardReviews() {
  const { data, error } = await supabase
    .from('reward_reviews')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data;
}
```

- [ ] **Step 2: Update `Rewards.tsx`**

Replace `mockRewards` with `listCurrentUserRewardReviews()`. Keep static trust notes in code for now or migrate them to a local constant in the page. Do not add wallet, deposit, betting, odds, or payout automation.

## Task 4: Protect admin reads

- [ ] **Step 1: Add profile role helper**

In `src/services/profile.ts`, add:

```ts
export async function getCurrentUserRole(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data.role;
}
```

- [ ] **Step 2: Update admin pages signed-out state**

In `AdminDashboard.tsx` and `AdminAudit.tsx`, use `useAuth()` and `getCurrentUserRole(user.id)`. If no user, render the same title card with a link to `/login`. If role is not `admin`, render `Admin access required` inside the main card.

- [ ] **Step 3: Update admin pages data reads**

Use `listAdminAuditLogs()` from `src/services/admin.ts`. For suspicious signals/checklist, keep local static arrays if no table exists yet, or add tables in a follow-up migration. Do not expose destructive admin actions.

## Task 5: Update AppShell profile/account state

- [ ] **Step 1: Use auth state in `AppShell.tsx`**

Import `useAuth()` and show:

```tsx
const { user, signOut } = useAuth();
```

If `user` exists, keep profile link and add a sign-out action in settings or account dropdown. If no user exists, link to `/login`.

- [ ] **Step 2: Preserve visual design**

Do not change the header nav/dropdown design beyond account state text/actions.

## Task 6: Verify remaining Supabase reads

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

Use the existing frontend dev server. Visit as signed-in seeded user:

```txt
/badges
/activity
/rewards
/admin
/admin/audit
```

Expected:

- Badges show catalog/progress from Supabase.
- Activity shows user activity from Supabase.
- Rewards show manual review rows only.
- Admin pages show data only for admin profile.
- Non-admin profile sees access-required message for admin routes.
