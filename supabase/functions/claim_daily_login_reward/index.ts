import { jsonResponse as sharedJsonResponse, requireAuthenticatedUser } from '../_shared/authGuards.ts';
import { checkRateLimit } from '../_shared/rateLimit.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type ClaimDailyLoginRewardRow = {
  claimed: boolean;
  already_claimed: boolean;
  points_awarded: number;
  reward_date: string;
  week_start_date: string;
  weekday: number;
  total_points: number;
};

function jsonResponse(body: unknown, status = 200) {
  return sharedJsonResponse(corsHeaders, body, status);
}

function getProfileUsername(user: { id: string; email?: string; user_metadata?: Record<string, unknown> }) {
  const metadataUsername = user.user_metadata?.username;
  const requestedUsername = typeof metadataUsername === 'string' ? metadataUsername.trim() : '';
  const baseUsername = requestedUsername || user.email?.split('@')[0]?.trim() || 'player';
  return `${baseUsername}-${user.id.slice(0, 8)}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const auth = await requireAuthenticatedUser(req, corsHeaders);
  if (auth instanceof Response) return auth;
  const { supabase, user } = auth;

  const rateLimit = await checkRateLimit({
    key: user.id,
    action: 'claim_daily_login_reward',
    windowSeconds: 300,
    maxCount: 20,
  });
  if (!rateLimit.allowed) {
    return jsonResponse({ error: 'Too many requests. Please wait a minute and try again.', resetAt: rateLimit.resetAt }, 429);
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      username: getProfileUsername(user),
      email: user.email,
      role: 'user',
    }, { onConflict: 'id', ignoreDuplicates: true });

  if (profileError) {
    return jsonResponse({ error: profileError.message }, 500);
  }

  const { data, error } = await supabase.rpc('claim_daily_login_reward', {
    target_user_id: user.id,
  });

  if (error) {
    return jsonResponse({ error: error.message }, 500);
  }

  const reward = Array.isArray(data) ? data[0] as ClaimDailyLoginRewardRow | undefined : undefined;
  if (!reward) {
    return jsonResponse({ error: 'Daily check-in response was empty' }, 500);
  }

  return jsonResponse({
    claimed: reward.claimed,
    alreadyClaimed: reward.already_claimed,
    pointsAwarded: reward.points_awarded,
    rewardDate: reward.reward_date,
    weekStartDate: reward.week_start_date,
    weekday: reward.weekday,
    totalPoints: reward.total_points,
  });
});
