import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { refreshLeagueLeaderboards } from '../_shared/leagueLeaderboards.ts';
import { cancelLeagueEvent, ensureFutureMatchdayEvents, ensureWeeklyLeagueEvents, refreshLeagueEventLeaderboards, settleLeagueEvent, type PayoutCurve } from '../_shared/leagueEvents.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type LeagueVisibility = 'public' | 'private';
type JoinPolicy = 'auto' | 'approval';
type LeagueRow = {
  id: string;
  name: string;
  slug: string;
  creator_id: string | null;
  visibility: LeagueVisibility;
  invite_code: string;
  join_policy: JoinPolicy;
  description: string;
};

type Body = {
  action?: string;
  leagueId?: string;
  inviteCode?: string;
  requestUserId?: string;
  userId?: string;
  eventId?: string;
  stake?: number;
  name?: string;
  description?: string;
  visibility?: LeagueVisibility;
  joinPolicy?: JoinPolicy;
  eventType?: 'custom';
  startsAt?: string;
  endsAt?: string;
  matchday?: number;
  minStake?: number;
  maxStake?: number;
  payoutCurve?: PayoutCurve;
  rankShares?: number[];
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function normalizeSlug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

function normalizeInvite(value?: string) {
  return value?.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') ?? '';
}

function assertName(value: unknown) {
  if (typeof value !== 'string') throw new Error('League name is required.');
  const name = value.trim();
  if (name.length < 3 || name.length > 64) throw new Error('League name must be 3-64 characters.');
  return name;
}

function assertEventName(value: unknown) {
  if (typeof value !== 'string') throw new Error('Event name is required.');
  const name = value.trim();
  if (name.length < 3 || name.length > 64) throw new Error('Event name must be 3-64 characters.');
  return name;
}

function assertDescription(value: unknown) {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') throw new Error('Description must be text.');
  return value.trim().slice(0, 180);
}

function assertVisibility(value: unknown): LeagueVisibility {
  if (value === 'public' || value === 'private') return value;
  throw new Error('Invalid league visibility.');
}

function assertJoinPolicy(value: unknown): JoinPolicy {
  if (value === 'auto' || value === 'approval') return value;
  throw new Error('Invalid join policy.');
}

function assertDateRange(startsAtValue: unknown, endsAtValue: unknown) {
  if (typeof startsAtValue !== 'string' || typeof endsAtValue !== 'string') throw new Error('Event dates are required.');
  const startsAt = new Date(startsAtValue);
  const endsAt = new Date(endsAtValue);
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) throw new Error('Event dates are invalid.');
  if (endsAt <= startsAt) throw new Error('Event end must be after start.');
  return { startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() };
}

function assertStakeBounds(minStakeValue: unknown, maxStakeValue: unknown) {
  const minStake = minStakeValue === undefined ? 1 : minStakeValue;
  const maxStake = maxStakeValue === undefined ? 100 : maxStakeValue;
  if (!Number.isInteger(minStake) || !Number.isInteger(maxStake)) throw new Error('Stake limits must be whole numbers.');
  if ((minStake as number) < 1) throw new Error('Minimum stake must be at least 1 point.');
  if ((maxStake as number) < (minStake as number)) throw new Error('Maximum stake must be greater than minimum stake.');
  if ((maxStake as number) > 10000) throw new Error('Maximum stake is too high.');
  return { minStake: minStake as number, maxStake: maxStake as number };
}

function assertPayoutCurve(value: unknown): PayoutCurve {
  if (value === undefined || value === null) return 'balanced_top3';
  if (value === 'balanced_top3' || value === 'winner_take_all' || value === 'flat_top3' || value === 'custom_top3') return value;
  throw new Error('Invalid payout curve.');
}

function assertRankShares(payoutCurve: PayoutCurve, value: unknown) {
  if (payoutCurve !== 'custom_top3') return { rankShares: [50, 30, 20] };
  const validShares = Array.isArray(value)
    && value.length === 3
    && value.every((share) => Number.isInteger(share) && share >= 0)
    && value.reduce((sum, share) => sum + share, 0) === 100
    && value[0] > 0;
  if (!validShares) throw new Error('Top 3 shares must be whole numbers totaling 100.');
  return { rankShares: value as number[] };
}

function makeInviteCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
}

async function ensureUniqueSlug(supabase: ReturnType<typeof createClient>, name: string, currentLeagueId?: string) {
  const base = normalizeSlug(name) || 'league';
  for (let index = 0; index < 20; index += 1) {
    const slug = index === 0 ? base : `${base}-${index + 1}`;
    const { data, error } = await supabase.from('leagues').select('id').eq('slug', slug).maybeSingle();
    if (error) throw error;
    if (!data || data.id === currentLeagueId) return slug;
  }
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

async function ensureUniqueInviteCode(supabase: ReturnType<typeof createClient>) {
  for (let index = 0; index < 20; index += 1) {
    const inviteCode = makeInviteCode();
    const { data, error } = await supabase.from('leagues').select('id').eq('invite_code', inviteCode).maybeSingle();
    if (error) throw error;
    if (!data) return inviteCode;
  }
  throw new Error('Could not generate invite code.');
}

async function getLeagueByIdOrInvite(supabase: ReturnType<typeof createClient>, body: Body) {
  if (body.leagueId) {
    const { data, error } = await supabase.from('leagues').select('*').eq('id', body.leagueId).single();
    if (error) throw error;
    return data as LeagueRow;
  }

  const inviteCode = normalizeInvite(body.inviteCode);
  if (!inviteCode) throw new Error('Invite code is required.');

  const { data, error } = await supabase.from('leagues').select('*').eq('invite_code', inviteCode).single();
  if (error) throw error;
  return data as LeagueRow;
}

async function requireOwner(supabase: ReturnType<typeof createClient>, leagueId: string, userId: string) {
  const { data, error } = await supabase
    .from('league_members')
    .select('role')
    .eq('league_id', leagueId)
    .eq('user_id', userId)
    .single();

  if (error || data?.role !== 'owner') throw new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function requireMember(supabase: ReturnType<typeof createClient>, leagueId: string, userId: string) {
  const { data, error } = await supabase
    .from('league_members')
    .select('user_id')
    .eq('league_id', leagueId)
    .eq('user_id', userId)
    .single();

  if (error || !data) throw new Response(JSON.stringify({ error: 'Join this league before entering the pool.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function createDefaultLeagueEvents(supabase: ReturnType<typeof createClient>, leagueId: string) {
  await ensureWeeklyLeagueEvents(supabase, [leagueId]);
  await ensureFutureMatchdayEvents(supabase, [leagueId]);
}

function assertStake(value: unknown, minStake: number, maxStake: number) {
  if (!Number.isInteger(value)) throw new Error('Stake must be a whole number.');
  const stake = value as number;
  if (stake < minStake || stake > maxStake) throw new Error(`Stake must be between ${minStake} and ${maxStake} points.`);
  return stake;
}

async function getUserPoints(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data: profile, error } = await supabase.from('profiles').select('points').eq('id', userId).single();
  if (error) throw error;
  return Math.max(0, profile.points ?? 0);
}

async function updateDisplayedPoints(supabase: ReturnType<typeof createClient>, userId: string, points: number) {
  const { error: profileError } = await supabase.from('profiles').update({ points }).eq('id', userId);
  if (profileError) throw profileError;

  const { error: leaderboardError } = await supabase
    .from('leaderboard_entries')
    .update({ points, updated_at: new Date().toISOString() })
    .eq('scope', 'global')
    .is('league_id', null)
    .eq('user_id', userId);
  if (leaderboardError) throw leaderboardError;
}

async function createLeague(supabase: ReturnType<typeof createClient>, userId: string, body: Body) {
  const name = assertName(body.name);
  const description = assertDescription(body.description);
  const visibility = assertVisibility(body.visibility);
  const joinPolicy = assertJoinPolicy(body.joinPolicy);
  const id = `league-${crypto.randomUUID()}`;
  const slug = await ensureUniqueSlug(supabase, name);
  const inviteCode = await ensureUniqueInviteCode(supabase);

  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .insert({
      id,
      name,
      slug,
      description,
      creator_id: userId,
      visibility,
      invite_code: inviteCode,
      join_policy: joinPolicy,
      member_count: 0,
      scoring_mode: 'global',
      prize_mode: 'none',
    })
    .select('*')
    .single();

  if (leagueError) throw leagueError;

  const { error: memberError } = await supabase.from('league_members').insert({ league_id: id, user_id: userId, role: 'owner' });
  if (memberError) throw memberError;

  await supabase.from('activity_events').insert({
    type: 'league_joined',
    title: `Created ${name}`,
    description: 'You created a league and became the owner.',
    user_id: userId,
    league_id: id,
    href: `/leagues/${slug}`,
  });
  await createDefaultLeagueEvents(supabase, id);
  await refreshLeagueLeaderboards(supabase, [id]);

  return { league };
}

async function joinLeague(supabase: ReturnType<typeof createClient>, userId: string, body: Body) {
  const league = await getLeagueByIdOrInvite(supabase, body);
  const inviteCode = normalizeInvite(body.inviteCode);

  if (league.visibility === 'private' && inviteCode !== league.invite_code) {
    throw new Response(JSON.stringify({ error: 'Invalid invite code.' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const { data: existing, error: existingError } = await supabase
    .from('league_members')
    .select('*')
    .eq('league_id', league.id)
    .eq('user_id', userId)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return { league, membership: existing, status: 'joined' };

  if (league.join_policy === 'approval') {
    const { data: request, error } = await supabase
      .from('league_join_requests')
      .upsert({ league_id: league.id, user_id: userId, status: 'pending', requested_at: new Date().toISOString(), resolved_at: null, resolved_by: null }, { onConflict: 'league_id,user_id' })
      .select('*')
      .single();
    if (error) throw error;
    return { league, request, status: 'pending' };
  }

  const { data: membership, error: memberError } = await supabase
    .from('league_members')
    .insert({ league_id: league.id, user_id: userId, role: 'member' })
    .select('*')
    .single();

  if (memberError) throw memberError;

  await supabase.from('activity_events').insert({
    type: 'league_joined',
    title: `Joined ${league.name}`,
    description: 'You joined a league. League points count from this join time.',
    user_id: userId,
    league_id: league.id,
    href: `/leagues/${league.slug}`,
  });
  await refreshLeagueLeaderboards(supabase, [league.id]);

  return { league, membership, status: 'joined' };
}

async function approveJoinRequest(supabase: ReturnType<typeof createClient>, userId: string, body: Body) {
  if (!body.leagueId || !body.requestUserId) throw new Error('League and request user are required.');
  await requireOwner(supabase, body.leagueId, userId);

  const now = new Date().toISOString();
  const { data: request, error: requestError } = await supabase
    .from('league_join_requests')
    .update({ status: 'approved', resolved_at: now, resolved_by: userId })
    .eq('league_id', body.leagueId)
    .eq('user_id', body.requestUserId)
    .eq('status', 'pending')
    .select('*')
    .single();

  if (requestError) throw requestError;

  const { error: memberError } = await supabase.from('league_members').upsert({ league_id: body.leagueId, user_id: body.requestUserId, role: 'member', joined_at: now }, { onConflict: 'league_id,user_id' });
  if (memberError) throw memberError;

  const { data: league } = await supabase.from('leagues').select('name, slug').eq('id', body.leagueId).single();
  await supabase.from('activity_events').insert({
    type: 'league_joined',
    title: `Joined ${league?.name ?? 'league'}`,
    description: 'Your league request was approved. League points count from this join time.',
    user_id: body.requestUserId,
    league_id: body.leagueId,
    href: `/leagues/${league?.slug ?? body.leagueId}`,
  });
  await refreshLeagueLeaderboards(supabase, [body.leagueId]);

  return { request, status: 'approved' };
}

async function rejectJoinRequest(supabase: ReturnType<typeof createClient>, userId: string, body: Body) {
  if (!body.leagueId || !body.requestUserId) throw new Error('League and request user are required.');
  await requireOwner(supabase, body.leagueId, userId);

  const { data: request, error } = await supabase
    .from('league_join_requests')
    .update({ status: 'rejected', resolved_at: new Date().toISOString(), resolved_by: userId })
    .eq('league_id', body.leagueId)
    .eq('user_id', body.requestUserId)
    .eq('status', 'pending')
    .select('*')
    .single();

  if (error) throw error;
  return { request, status: 'rejected' };
}

async function updateLeague(supabase: ReturnType<typeof createClient>, userId: string, body: Body) {
  if (!body.leagueId) throw new Error('League is required.');
  await requireOwner(supabase, body.leagueId, userId);

  const name = assertName(body.name);
  const description = assertDescription(body.description);
  const slug = await ensureUniqueSlug(supabase, name, body.leagueId);
  const { data: league, error } = await supabase
    .from('leagues')
    .update({ name, description, slug, updated_at: new Date().toISOString() })
    .eq('id', body.leagueId)
    .select('*')
    .single();

  if (error) throw error;
  return { league };
}

async function kickLeagueMember(supabase: ReturnType<typeof createClient>, userId: string, body: Body) {
  if (!body.leagueId || !body.userId) throw new Error('League and user are required.');
  if (body.userId === userId) throw new Error('Owner cannot kick themselves.');
  await requireOwner(supabase, body.leagueId, userId);

  const { error } = await supabase
    .from('league_members')
    .delete()
    .eq('league_id', body.leagueId)
    .eq('user_id', body.userId)
    .eq('role', 'member');

  if (error) throw error;
  await refreshLeagueLeaderboards(supabase, [body.leagueId]);
  return { status: 'removed' };
}

async function createLeagueEvent(supabase: ReturnType<typeof createClient>, userId: string, body: Body) {
  if (!body.leagueId) throw new Error('League is required.');
  await requireOwner(supabase, body.leagueId, userId);

  const name = assertEventName(body.name);
  const { startsAt, endsAt } = assertDateRange(body.startsAt, body.endsAt);
  const { minStake, maxStake } = assertStakeBounds(body.minStake, body.maxStake);
  const payoutCurve = assertPayoutCurve(body.payoutCurve);
  const payoutConfig = assertRankShares(payoutCurve, body.rankShares);
  const eventType = body.eventType ?? 'custom';
  if (eventType !== 'custom') throw new Error('Only custom events can be created here.');

  const { data: event, error } = await supabase
    .from('league_events')
    .insert({
      id: `event-${body.leagueId}-custom-${crypto.randomUUID()}`,
      league_id: body.leagueId,
      event_type: eventType,
      name,
      starts_at: startsAt,
      ends_at: endsAt,
      matchday: Number.isInteger(body.matchday) ? body.matchday : null,
      status: 'open',
      min_stake: minStake,
      max_stake: maxStake,
      payout_curve: payoutCurve,
      payout_config: payoutConfig,
      metadata: { createdBy: userId },
    })
    .select('*')
    .single();

  if (error) throw error;
  return { event, status: 'created' };
}

async function enterLeagueEvent(supabase: ReturnType<typeof createClient>, userId: string, body: Body) {
  if (!body.eventId) throw new Error('Event is required.');
  const { data: event, error: eventError } = await supabase.from('league_events').select('*').eq('id', body.eventId).single();
  if (eventError) throw eventError;
  const now = new Date().toISOString();
  if (event.status !== 'open' || event.starts_at <= now || event.ends_at <= now) throw new Error('This event is not open for entries.');

  await requireMember(supabase, event.league_id, userId);
  const stake = assertStake(body.stake, event.min_stake, event.max_stake);

  const { data: existingEntry, error: existingError } = await supabase
    .from('league_event_entries')
    .select('event_id')
    .eq('event_id', event.id)
    .eq('user_id', userId)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existingEntry) throw new Error('You already entered this event.');

  const currentPoints = await getUserPoints(supabase, userId);
  if (currentPoints < stake) throw new Error('Not enough points.');

  const pointsAfterStake = currentPoints - stake;
  const { data: entry, error: entryError } = await supabase
    .from('league_event_entries')
    .insert({ event_id: event.id, user_id: userId, stake })
    .select('*')
    .single();

  if (entryError) throw entryError;

  const { error: transactionError } = await supabase.from('point_transactions').insert({
    user_id: userId,
    league_id: event.league_id,
    event_id: event.id,
    type: 'stake',
    amount: -stake,
    balance_after: pointsAfterStake,
    description: `Entered ${event.name}`,
  });
  if (transactionError) throw transactionError;
  await updateDisplayedPoints(supabase, userId, pointsAfterStake);

  const { error: poolError } = await supabase
    .from('league_events')
    .update({ prize_pool: event.prize_pool + stake, updated_at: new Date().toISOString() })
    .eq('id', event.id);

  if (poolError) throw poolError;
  await refreshLeagueEventLeaderboards(supabase, [event.id]);
  return { entry, points: pointsAfterStake, status: 'entered' };
}

async function settleEvent(supabase: ReturnType<typeof createClient>, userId: string, body: Body) {
  if (!body.eventId) throw new Error('Event is required.');
  const { data: event, error: eventError } = await supabase.from('league_events').select('id, league_id, status').eq('id', body.eventId).single();
  if (eventError) throw eventError;
  await requireOwner(supabase, event.league_id, userId);
  if (event.status === 'settled') throw new Error('This event is already settled.');
  if (event.status === 'cancelled') throw new Error('This event is cancelled.');

  const result = await settleLeagueEvent(supabase, event.id);
  return { status: 'settled', ...result };
}

async function cancelEvent(supabase: ReturnType<typeof createClient>, userId: string, body: Body) {
  if (!body.eventId) throw new Error('Event is required.');
  const { data: event, error: eventError } = await supabase.from('league_events').select('id, league_id, status').eq('id', body.eventId).single();
  if (eventError) throw eventError;
  await requireOwner(supabase, event.league_id, userId);
  const result = await cancelLeagueEvent(supabase, event.id, userId);
  return { status: 'cancelled', ...result };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return jsonResponse({ error: 'Missing authorization header' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) return jsonResponse({ error: 'Missing Supabase server config' }, 500);

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const token = authHeader.replace('Bearer ', '');
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) return jsonResponse({ error: 'Unauthorized' }, 401);

  try {
    const body = await req.json() as Body;
    if (body.action === 'createLeague') return jsonResponse(await createLeague(supabase, userData.user.id, body));
    if (body.action === 'joinLeague') return jsonResponse(await joinLeague(supabase, userData.user.id, body));
    if (body.action === 'approveJoinRequest') return jsonResponse(await approveJoinRequest(supabase, userData.user.id, body));
    if (body.action === 'rejectJoinRequest') return jsonResponse(await rejectJoinRequest(supabase, userData.user.id, body));
    if (body.action === 'updateLeague') return jsonResponse(await updateLeague(supabase, userData.user.id, body));
    if (body.action === 'kickLeagueMember') return jsonResponse(await kickLeagueMember(supabase, userData.user.id, body));
    if (body.action === 'createLeagueEvent') return jsonResponse(await createLeagueEvent(supabase, userData.user.id, body));
    if (body.action === 'enterLeagueEvent') return jsonResponse(await enterLeagueEvent(supabase, userData.user.id, body));
    if (body.action === 'settleLeagueEvent') return jsonResponse(await settleEvent(supabase, userData.user.id, body));
    if (body.action === 'cancelLeagueEvent') return jsonResponse(await cancelEvent(supabase, userData.user.id, body));
    return jsonResponse({ error: 'Unknown action.' }, 400);
  } catch (error) {
    if (error instanceof Response) return error;
    const message = error instanceof Error ? error.message : String(error);
    return jsonResponse({ error: message }, 400);
  }
});
