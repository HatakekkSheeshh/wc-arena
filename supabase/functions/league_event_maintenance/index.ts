import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { jsonResponse as sharedJsonResponse, requireSyncSecret } from '../_shared/authGuards.ts';
import { ensureFutureMatchdayEvents, ensureWeeklyLeagueEvents, lockStartedEvents, settleEndedEvents } from '../_shared/leagueEvents.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-sync-secret',
};

function jsonResponse(body: unknown, status = 200) {
  return sharedJsonResponse(corsHeaders, body, status);
}

async function insertAuditLog(supabase: ReturnType<typeof createClient>, action: string, description: string, severity: 'info' | 'warning') {
  await supabase.from('admin_audit_logs').insert({
    action,
    entity_type: 'system',
    entity_id: 'league-event-maintenance',
    description,
    severity,
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const secretError = requireSyncSecret(req, corsHeaders, 'LEAGUE_EVENT_SYNC_SECRET');
  if (secretError) return secretError;

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'Missing Supabase server config' }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });

  try {
    const weekly = await ensureWeeklyLeagueEvents(supabase);
    const matchday = await ensureFutureMatchdayEvents(supabase);
    const locked = await lockStartedEvents(supabase);
    const settled = await settleEndedEvents(supabase);
    const hasErrors = settled.settlementErrors.length > 0;

    await insertAuditLog(
      supabase,
      hasErrors ? 'league_event_maintenance_completed_with_errors' : 'league_event_maintenance_completed',
      `League event maintenance upserted ${weekly.leagueEvents} weekly events and ${matchday.leagueEvents} matchday events, locked ${locked.lockedEvents} events, settled ${settled.settledEvents} events, with ${settled.settlementErrors.length} settlement errors.`,
      hasErrors ? 'warning' : 'info',
    );

    return jsonResponse({
      weeklyEvents: weekly.leagueEvents,
      matchdayEvents: matchday.leagueEvents,
      lockedEvents: locked.lockedEvents,
      settledEvents: settled.settledEvents,
      settlementErrors: settled.settlementErrors,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown league event maintenance error';
    await insertAuditLog(supabase, 'league_event_maintenance_failed', message, 'warning');
    return jsonResponse({ error: message }, 500);
  }
});
