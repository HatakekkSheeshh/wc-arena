import { supabase } from '../lib/supabaseClient';
import { invalidateCache } from './cache';

export type ClaimDailyLoginRewardResponse = {
  claimed: boolean;
  alreadyClaimed: boolean;
  pointsAwarded: number;
  rewardDate: string;
  weekStartDate: string;
  weekday: number;
  totalPoints: number;
};

export type DailyLoginRewardRow = {
  pointsAwarded: number;
  rewardDate: string;
  weekStartDate: string;
  weekday: number;
};

function getTodayUtcDate() {
  return new Date().toISOString().slice(0, 10);
}

export async function claimDailyLoginReward() {
  const { data, error } = await supabase.functions.invoke<ClaimDailyLoginRewardResponse>('claim_daily_login_reward', {
    body: {},
  });

  if (error) throw error;
  if (!data) throw new Error('Daily check-in response was empty.');
  invalidateCache('leaderboard:');
  return data;
}

export async function getTodayDailyLoginReward() {
  const { data, error } = await supabase
    .from('daily_login_rewards')
    .select('points_awarded, reward_date, week_start_date, weekday')
    .eq('reward_date', getTodayUtcDate())
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    pointsAwarded: data.points_awarded,
    rewardDate: data.reward_date,
    weekStartDate: data.week_start_date,
    weekday: data.weekday,
  } satisfies DailyLoginRewardRow;
}
