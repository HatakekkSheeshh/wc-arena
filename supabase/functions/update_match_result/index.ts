import { jsonResponse as sharedJsonResponse, requireAdminUser } from '../_shared/authGuards.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type UpdateMatchResultBody = {
  matchId: string;
  homeScore: number;
  awayScore: number;
};

function jsonResponse(body: unknown, status = 200) {
  return sharedJsonResponse(corsHeaders, body, status);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const auth = await requireAdminUser(req, corsHeaders);
  if (auth instanceof Response) return auth;
  const { supabase, user } = auth;

  let body: UpdateMatchResultBody;
  try {
    body = await req.json() as UpdateMatchResultBody;
  } catch {
    return jsonResponse({ error: 'Invalid JSON payload' }, 400);
  }

  if (!body.matchId || !Number.isInteger(body.homeScore) || !Number.isInteger(body.awayScore) || body.homeScore < 0 || body.awayScore < 0) {
    return jsonResponse({ error: 'Invalid match result payload' }, 400);
  }

  const { data: match, error: updateError } = await supabase
    .from('matches')
    .update({
      home_score: body.homeScore,
      away_score: body.awayScore,
      status: 'finished',
      result_updated_at: new Date().toISOString(),
    })
    .eq('id', body.matchId)
    .select('*')
    .single();

  if (updateError || !match) {
    return jsonResponse({ error: updateError?.message ?? 'Match not found' }, updateError ? 500 : 404);
  }

  await supabase.from('admin_audit_logs').insert({
    actor_id: user.id,
    action: 'match_result_imported',
    entity_type: 'match',
    entity_id: body.matchId,
    description: `Updated result to ${body.homeScore}-${body.awayScore}.`,
    severity: 'info',
  });

  return jsonResponse({ match });
});
