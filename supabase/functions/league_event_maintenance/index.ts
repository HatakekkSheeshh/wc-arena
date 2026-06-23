import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { jsonResponse as sharedJsonResponse, requireSyncSecret } from '../_shared/authGuards.ts';
import { ensureFutureMatchdayEvents, ensureWeeklyLeagueEvents, lockStartedEvents, settleEndedEvents } from '../_shared/leagueEvents.ts';
import { acquireLock, releaseLock } from '../_shared/redis.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-sync-secret',
};

function jsonResponse(body: unknown, status = 200) {
  return sharedJsonResponse(corsHeaders, body, status);
}

type CleanupResult = {
  activity_deleted: number;
  audit_deleted: number;
};

async function insertAuditLog(supabase: ReturnType<typeof createClient>, action: string, description: string, severity: 'info' | 'warning') {
  await supabase.from('admin_audit_logs').insert({
    action,
    entity_type: 'system',
    entity_id: 'league-event-maintenance',
    description,
    severity,
  });
}

async function cleanupOldOperationalData(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase.rpc('cleanup_old_operational_data');
  if (error) {
    await insertAuditLog(supabase, 'operational_retention_cleanup_failed', error.message, 'warning');
    return { activityDeleted: 0, auditDeleted: 0, error: error.message };
  }

  const cleanupResult = data as CleanupResult | null;
  return {
    activityDeleted: cleanupResult?.activity_deleted ?? 0,
    auditDeleted: cleanupResult?.audit_deleted ?? 0,
  };
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

  let lockAcquired = false;
  try {
    lockAcquired = await acquireLock('wc26:lock:league_event_maintenance', 600);
  } catch (error) {
    await insertAuditLog(supabase, 'league_event_maintenance_lock_unavailable', `League event maintenance lock unavailable: ${error instanceof Error ? error.message : String(error)}. Continuing without lock.`, 'warning');
    lockAcquired = true;
  }

  if (!lockAcquired) {
    await insertAuditLog(supabase, 'league_event_maintenance_already_running', 'Skipped league event maintenance because another run is already active.', 'warning');
    return jsonResponse({ alreadyRunning: true });
  }

  try {
    const weekly = await ensureWeeklyLeagueEvents(supabase);
    const matchday = await ensureFutureMatchdayEvents(supabase);
    const locked = await lockStartedEvents(supabase);
    const settled = await settleEndedEvents(supabase);
    const cleanupResult = await cleanupOldOperationalData(supabase);
    const hasErrors = settled.settlementErrors.length > 0 || Boolean(cleanupResult.error);

    await insertAuditLog(
      supabase,
      hasErrors ? 'league_event_maintenance_completed_with_errors' : 'league_event_maintenance_completed',
      `League event maintenance upserted ${weekly.leagueEvents} weekly events and ${matchday.leagueEvents} matchday events, locked ${locked.lockedEvents} events, settled ${settled.settledEvents} events, deleted ${cleanupResult.activityDeleted} activity events and ${cleanupResult.auditDeleted} audit logs, with ${settled.settlementErrors.length} settlement errors${cleanupResult.error ? ` and cleanup error: ${cleanupResult.error}` : ''}.`,
      hasErrors ? 'warning' : 'info',
    );

    return jsonResponse({
      weeklyEvents: weekly.leagueEvents,
      matchdayEvents: matchday.leagueEvents,
      lockedEvents: locked.lockedEvents,
      settledEvents: settled.settledEvents,
      settlementErrors: settled.settlementErrors,
      cleanupResult,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown league event maintenance error';
    await insertAuditLog(supabase, 'league_event_maintenance_failed', message, 'warning');
    return jsonResponse({ error: message }, 500);
  } finally {
    await releaseLock('wc26:lock:league_event_maintenance').catch((error) => {
      console.warn(`Failed to release league event maintenance lock: ${error instanceof Error ? error.message : String(error)}`);
    });
  }
});
