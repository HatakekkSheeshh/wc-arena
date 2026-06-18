import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);
