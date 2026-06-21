import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrlEnv = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKeyEnv = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
const rememberAuthKey = 'predict2026.rememberAuth';

if (!supabaseUrlEnv || !supabaseKeyEnv) {
  throw new Error('Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
}

function getAuthStorage() {
  if (typeof window === 'undefined') return undefined;
  return window.localStorage.getItem(rememberAuthKey) === 'false' ? window.sessionStorage : window.localStorage;
}

export function setRememberAuth(remember: boolean) {
  if (typeof window === 'undefined') return;

  const currentStorage = getAuthStorage();
  const nextStorage = remember ? window.localStorage : window.sessionStorage;
  const authKey = Object.keys(currentStorage ?? window.localStorage).find((key) => key.startsWith('sb-') && key.endsWith('-auth-token'));
  const authValue = authKey ? currentStorage?.getItem(authKey) : null;

  window.localStorage.setItem(rememberAuthKey, String(remember));
  if (authKey && authValue) {
    nextStorage.setItem(authKey, authValue);
    if (nextStorage !== currentStorage) currentStorage?.removeItem(authKey);
  }
}

export const supabaseUrl = supabaseUrlEnv;
export const supabaseKey = supabaseKeyEnv;
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: {
      getItem: (key) => getAuthStorage()?.getItem(key) ?? null,
      setItem: (key, value) => getAuthStorage()?.setItem(key, value),
      removeItem: (key) => {
        if (typeof window === 'undefined') return;
        window.localStorage.removeItem(key);
        window.sessionStorage.removeItem(key);
      },
    },
  },
});
