import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export type EdgeSupabaseClient = ReturnType<typeof createClient>;
export type EdgeUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

type GuardResult<T> = T | Response;

export function jsonResponse(corsHeaders: Record<string, string>, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function createServiceRoleClient(corsHeaders: Record<string, string>) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse(corsHeaders, { error: 'Missing Supabase server config' }, 500);
  }

  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function requireAuthenticatedUser(req: Request, corsHeaders: Record<string, string>): Promise<GuardResult<{ supabase: EdgeSupabaseClient; user: EdgeUser }>> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return jsonResponse(corsHeaders, { error: 'Missing authorization header' }, 401);
  }

  const supabase = createServiceRoleClient(corsHeaders);
  if (supabase instanceof Response) return supabase;

  const token = authHeader.replace('Bearer ', '');
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) {
    return jsonResponse(corsHeaders, { error: 'Unauthorized' }, 401);
  }

  return { supabase, user: userData.user };
}

export async function requireAdminUser(req: Request, corsHeaders: Record<string, string>): Promise<GuardResult<{ supabase: EdgeSupabaseClient; user: EdgeUser }>> {
  const auth = await requireAuthenticatedUser(req, corsHeaders);
  if (auth instanceof Response) return auth;

  const { data: profile, error: profileError } = await auth.supabase
    .from('profiles')
    .select('role')
    .eq('id', auth.user.id)
    .single();

  if (profileError || profile?.role !== 'admin') {
    return jsonResponse(corsHeaders, { error: 'Forbidden' }, 403);
  }

  return auth;
}

export function requireSyncSecret(req: Request, corsHeaders: Record<string, string>, envName: string) {
  const syncSecret = Deno.env.get(envName);
  if (!syncSecret) {
    return jsonResponse(corsHeaders, { error: 'Missing sync secret config' }, 500);
  }

  const providedSecret = req.headers.get('x-sync-secret') ?? req.headers.get('x-cron-secret');
  if (providedSecret !== syncSecret) {
    return jsonResponse(corsHeaders, { error: 'Forbidden' }, 403);
  }

  return null;
}
