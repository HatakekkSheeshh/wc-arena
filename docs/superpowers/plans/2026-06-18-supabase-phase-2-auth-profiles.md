# Supabase Phase 2 Auth and Profiles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect the React/Vite app to Supabase Auth, provide session/profile state, and migrate login/register/profile identity to real Supabase-backed data.

**Architecture:** The app gets a single Supabase browser client and an AuthProvider. Login/Register call Supabase Auth. Profile reads and updates `profiles` under RLS.

**Tech Stack:** React 19, Vite, TypeScript, `@supabase/supabase-js`, Supabase Auth, Supabase Postgres RLS.

---

## Files

- Modify: `package.json`
- Create: `.env.example`
- Create: `src/lib/supabaseClient.ts`
- Create: `src/lib/auth.tsx`
- Create: `src/services/profile.ts`
- Modify: `src/main.tsx`
- Modify: `src/Login.tsx`
- Modify: `src/Register.tsx`
- Modify: `src/pages/Profile.tsx`
- Reference: `src/types/supabase.ts`

## Task 1: Install Supabase client and environment config

- [ ] **Step 1: Install Supabase client**

Run:

```bash
npm install @supabase/supabase-js
```

Expected: dependency and lockfile update.

- [ ] **Step 2: Add `.env.example`**

Create `.env.example`:

```bash
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=replace-with-local-anon-or-publishable-key
```

Do not add service role keys to Vite env files.

- [ ] **Step 3: Add local `.env` manually**

Create `.env` locally with values from `supabase start`. Do not commit `.env`.

## Task 2: Add Supabase browser client

- [ ] **Step 1: Create `src/lib/supabaseClient.ts`**

```ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);
```

- [ ] **Step 2: Typecheck**

Run:

```bash
npm run lint
```

Expected: TypeScript exits 0.

## Task 3: Add auth provider

- [ ] **Step 1: Create `src/lib/auth.tsx`**

```tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user: session?.user ?? null,
    loading,
    signOut: async () => {
      await supabase.auth.signOut();
    },
  }), [loading, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
```

- [ ] **Step 2: Wrap app in provider**

Modify `src/main.tsx`:

```tsx
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './lib/auth.tsx';
import './i18n';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);
```

- [ ] **Step 3: Typecheck**

Run:

```bash
npm run lint
```

Expected: TypeScript exits 0.

## Task 4: Add profile service

- [ ] **Step 1: Create `src/services/profile.ts`**

```ts
import { supabase } from '../lib/supabaseClient';
import type { Database } from '../types/supabase';

export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type ProfileUpdate = Pick<ProfileRow, 'username' | 'country_code' | 'fan_club_team_id' | 'avatar_url'>;

export async function getCurrentProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateCurrentProfile(userId: string, values: ProfileUpdate) {
  const { data, error } = await supabase
    .from('profiles')
    .update(values)
    .eq('id', userId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}
```

## Task 5: Wire login/register to Supabase Auth

- [ ] **Step 1: Inspect current `src/Login.tsx` and `src/Register.tsx`**

Read both files and preserve existing visual layout.

- [ ] **Step 2: Replace mock submit in Login**

In `src/Login.tsx`, on submit call:

```ts
const { error } = await supabase.auth.signInWithPassword({ email, password });
if (error) setFormError(error.message);
else navigate('/matches');
```

Keep the existing page styling intact.

- [ ] **Step 3: Replace mock submit in Register**

In `src/Register.tsx`, on submit call:

```ts
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: { username },
  },
});
if (error) setFormError(error.message);
else if (data.user) navigate('/onboarding');
```

Then create a `profiles` row either through a trigger in Phase 1 or by inserting after sign-up with the authenticated user session if email confirmation is disabled locally.

## Task 6: Migrate profile identity read

- [ ] **Step 1: Update `Profile.tsx` to use auth user**

Use `useAuth()` and `getCurrentProfile(user.id)` for the identity/right-rail profile fields. Keep mock predictions, badges, and leagues until later phases.

- [ ] **Step 2: Add loading and signed-out states**

If `loading`, render the page title card and a main card with `Loading profile...`. If no user, render a signed-out card linking to `/login`.

## Task 7: Verify auth flow

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

- [ ] **Step 3: Browser verification using existing dev server**

Do not start another dev server if one is already running. Visit:

```txt
/login
/register
/profile
```

Expected:

- Login works with seeded local user credentials.
- Profile page shows Supabase profile identity.
- Sign-out clears session.
