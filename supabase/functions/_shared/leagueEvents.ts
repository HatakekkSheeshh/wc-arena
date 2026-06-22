import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

type ScoreOutcome = 'exact' | 'correct' | 'missed';
export type PayoutCurve = 'balanced_top3' | 'winner_take_all' | 'flat_top3' | 'custom_top3';

type PayoutConfig = {
  rankShares?: number[];
};

type LeagueEvent = {
  id: string;
  league_id: string;
  event_type: 'weekly' | 'matchday' | 'custom';
  starts_at: string;
  ends_at: string;
  matchday: number | null;
  status: 'open' | 'locked' | 'settled' | 'cancelled';
  prize_pool: number;
  payout_curve: PayoutCurve;
  payout_config: PayoutConfig;
};

type EventEntry = {
  event_id: string;
  user_id: string;
  stake: number;
};

type LeagueMember = {
  user_id: string;
  joined_at: string;
};

type PredictionScoreRow = {
  outcome: ScoreOutcome;
  total: number;
  predictions: {
    user_id: string;
    matches: { id: string; kickoff_at: string; matchday: number | null } | null;
  } | null;
};

type EventLeaderboardEntry = {
  event_id: string;
  user_id: string;
  rank: number;
  previous_rank: number | null;
  points: number;
  exact_scores: number;
  accuracy: number;
  stake: number;
  payout: number;
  payout_factor: number;
  updated_at: string;
};

type MatchdayWindow = {
  matchday: number;
  startsAt: string;
  endsAt: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function formatDateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function getCurrentUtcWeekWindow() {
  const now = new Date();
  const day = now.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const startsAt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + mondayOffset));
  const endsAt = new Date(startsAt);
  endsAt.setUTCDate(endsAt.getUTCDate() + 7);
  return { startsAt, endsAt };
}

function getRankShares(curve: PayoutCurve, config: PayoutConfig) {
  if (curve === 'balanced_top3') return [50, 30, 20];
  if (curve !== 'custom_top3') return [];

  const shares = config.rankShares;
  const validShares = Array.isArray(shares)
    && shares.length === 3
    && shares.every((share) => Number.isInteger(share) && share >= 0)
    && shares.reduce((sum, share) => sum + share, 0) === 100
    && shares[0] > 0;

  if (!validShares) throw new Error('Invalid custom payout shares.');
  return shares;
}

export function calculatePayouts(entries: Array<{ user_id: string; rank: number; stake: number }>, prizePool: number, payoutCurve: PayoutCurve = 'balanced_top3', payoutConfig: PayoutConfig = { rankShares: [50, 30, 20] }) {
  if (prizePool <= 0) return [];

  if (payoutCurve === 'winner_take_all') {
    const winner = entries.find((entry) => entry.rank === 1);
    return winner ? [{ user_id: winner.user_id, payout: prizePool, factor: 1 }] : [];
  }

  if (payoutCurve === 'flat_top3') {
    const winners = entries.filter((entry) => entry.rank <= 3).sort((a, b) => a.rank - b.rank);
    if (winners.length === 0) return [];
    const basePayout = Math.floor(prizePool / winners.length);
    let remainder = prizePool - basePayout * winners.length;
    return winners.map((entry) => {
      const payout = basePayout + (remainder > 0 ? remainder : 0);
      remainder = 0;
      return { user_id: entry.user_id, payout, factor: 1 };
    });
  }

  const shares = getRankShares(payoutCurve, payoutConfig);
  const winners = entries.filter((entry) => entry.rank >= 1 && entry.rank <= shares.length).sort((a, b) => a.rank - b.rank);
  const averageStake = entries.length ? prizePool / entries.length : 0;
  const raw = winners.map((entry) => {
    const factor = averageStake > 0 ? clamp(Math.sqrt(entry.stake / averageStake), 0.5, 1.5) : 1;
    return { user_id: entry.user_id, factor, rawPayout: prizePool * ((shares[entry.rank - 1] ?? 0) / 100) * factor };
  });
  const rawTotal = raw.reduce((sum, item) => sum + item.rawPayout, 0);
  let assigned = 0;

  return raw.map((item, index) => {
    const isLast = index === raw.length - 1;
    const payout = rawTotal > 0 ? (isLast ? prizePool - assigned : Math.round((item.rawPayout / rawTotal) * prizePool)) : 0;
    assigned += payout;
    return { user_id: item.user_id, payout, factor: Number(item.factor.toFixed(4)) };
  });
}

function scoreBelongsToEvent(score: PredictionScoreRow, event: LeagueEvent, joinedAt: string, selectedMatchIds: Set<string>) {
  const match = score.predictions?.matches;
  if (!match?.kickoff_at) return false;
  if (match.kickoff_at < joinedAt) return false;
  if (match.kickoff_at < event.starts_at || match.kickoff_at >= event.ends_at) return false;
  if (selectedMatchIds.size > 0) return selectedMatchIds.has(match.id);
  return event.event_type !== 'matchday' || match.matchday === event.matchday;
}

async function getSelectedMatchIdsByEvent(supabase: SupabaseClient, eventIds: string[]) {
  if (eventIds.length === 0) return new Map<string, Set<string>>();

  const { data, error } = await supabase
    .from('league_event_matches')
    .select('event_id, match_id')
    .in('event_id', eventIds);

  if (error) throw error;
  const byEvent = new Map<string, Set<string>>();
  for (const row of data ?? []) {
    const current = byEvent.get(row.event_id) ?? new Set<string>();
    current.add(row.match_id);
    byEvent.set(row.event_id, current);
  }
  return byEvent;
}

async function getLeagueIds(supabase: SupabaseClient, leagueIds?: string[]) {
  if (leagueIds?.length) return leagueIds;
  const { data, error } = await supabase.from('leagues').select('id').eq('status', 'active');
  if (error) throw error;
  return (data ?? []).map((league: { id: string }) => league.id);
}

async function updateDisplayedPoints(supabase: SupabaseClient, userId: string, points: number) {
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

export async function ensureWeeklyLeagueEvents(supabase: SupabaseClient, leagueIds?: string[]) {
  const targetLeagueIds = await getLeagueIds(supabase, leagueIds);
  const { startsAt, endsAt } = getCurrentUtcWeekWindow();
  const weekKey = formatDateKey(startsAt);
  const events = targetLeagueIds.map((leagueId) => ({
    id: `event-${leagueId}-weekly-${weekKey}`,
    league_id: leagueId,
    event_type: 'weekly',
    name: `Weekly ${weekKey}`,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    status: 'open',
    min_stake: 1,
    max_stake: 100,
    payout_curve: 'balanced_top3',
    payout_config: { rankShares: [50, 30, 20] },
  }));

  if (events.length === 0) return { leagueEvents: 0 };
  const { data: existingEvents, error: existingError } = await supabase
    .from('league_events')
    .select('id')
    .in('id', events.map((event) => event.id));

  if (existingError) throw existingError;
  const existingIds = new Set((existingEvents ?? []).map((event: { id: string }) => event.id));
  const missingEvents = events.filter((event) => !existingIds.has(event.id));
  if (missingEvents.length === 0) return { leagueEvents: 0 };

  const { error } = await supabase.from('league_events').insert(missingEvents);
  if (error) throw error;
  return { leagueEvents: missingEvents.length };
}

function getMatchdayWindows(matches: Array<{ matchday: number | null; kickoff_at: string | null }>) {
  const byMatchday = new Map<number, string[]>();
  for (const match of matches) {
    if (match.matchday === null || !match.kickoff_at) continue;
    byMatchday.set(match.matchday, [...(byMatchday.get(match.matchday) ?? []), match.kickoff_at]);
  }

  return [...byMatchday.entries()].map(([matchday, kickoffs]) => {
    const sortedKickoffs = [...kickoffs].sort();
    const endsAt = new Date(sortedKickoffs[sortedKickoffs.length - 1]);
    endsAt.setUTCDate(endsAt.getUTCDate() + 1);
    return { matchday, startsAt: sortedKickoffs[0], endsAt: endsAt.toISOString() } as MatchdayWindow;
  });
}

export async function ensureFutureMatchdayEvents(supabase: SupabaseClient, leagueIds?: string[]) {
  const targetLeagueIds = await getLeagueIds(supabase, leagueIds);
  const { data: matches, error: matchesError } = await supabase
    .from('matches')
    .select('matchday, kickoff_at')
    .not('matchday', 'is', null);

  if (matchesError) throw matchesError;
  const now = new Date().toISOString();
  const windows = getMatchdayWindows((matches ?? []) as Array<{ matchday: number | null; kickoff_at: string | null }>).filter((window) => window.endsAt > now);
  const events = targetLeagueIds.flatMap((leagueId) => windows.map((window) => ({
    id: `event-${leagueId}-matchday-${window.matchday}`,
    league_id: leagueId,
    event_type: 'matchday',
    name: `Matchday ${window.matchday}`,
    starts_at: window.startsAt,
    ends_at: window.endsAt,
    matchday: window.matchday,
    status: 'open',
    min_stake: 1,
    max_stake: 100,
    payout_curve: 'balanced_top3',
    payout_config: { rankShares: [50, 30, 20] },
  })));

  if (events.length === 0) return { leagueEvents: 0 };
  const { data: existingEvents, error: existingError } = await supabase
    .from('league_events')
    .select('id')
    .in('id', events.map((event) => event.id));

  if (existingError) throw existingError;
  const existingIds = new Set((existingEvents ?? []).map((event: { id: string }) => event.id));
  const missingEvents = events.filter((event) => !existingIds.has(event.id));
  if (missingEvents.length === 0) return { leagueEvents: 0 };

  const { error } = await supabase.from('league_events').insert(missingEvents);
  if (error) throw error;
  return { leagueEvents: missingEvents.length };
}

export async function lockStartedEvents(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('league_events')
    .update({ status: 'locked', updated_at: new Date().toISOString() })
    .eq('status', 'open')
    .lte('starts_at', new Date().toISOString())
    .select('id');

  if (error) throw error;
  return { lockedEvents: data?.length ?? 0 };
}

export async function settleEndedEvents(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('league_events')
    .select('id')
    .in('status', ['open', 'locked'])
    .lte('ends_at', new Date().toISOString());

  if (error) throw error;
  const errors: Array<{ eventId: string; error: string }> = [];
  let settledEvents = 0;

  for (const event of data ?? []) {
    try {
      await settleLeagueEvent(supabase, event.id);
      settledEvents += 1;
    } catch (settleError) {
      errors.push({ eventId: event.id, error: settleError instanceof Error ? settleError.message : String(settleError) });
    }
  }

  return { settledEvents, settlementErrors: errors };
}

async function buildEventEntries(supabase: SupabaseClient, event: LeagueEvent, previousRanks: Map<string, number>, selectedMatchIds: Set<string>) {
  const { data: entries, error: entriesError } = await supabase
    .from('league_event_entries')
    .select('event_id, user_id, stake')
    .eq('event_id', event.id)
    .order('entered_at', { ascending: true });

  if (entriesError) throw entriesError;
  const eventEntries = (entries ?? []) as EventEntry[];
  if (eventEntries.length === 0) return [];

  const userIds = eventEntries.map((entry) => entry.user_id);
  const { data: members, error: membersError } = await supabase
    .from('league_members')
    .select('user_id, joined_at')
    .eq('league_id', event.league_id)
    .in('user_id', userIds);

  if (membersError) throw membersError;
  const joinedAtByUser = new Map(((members ?? []) as LeagueMember[]).map((member) => [member.user_id, member.joined_at]));

  const { data: scores, error: scoresError } = await supabase
    .from('prediction_scores')
    .select('outcome, total, predictions!inner(user_id, matches!inner(id, kickoff_at, matchday))')
    .in('predictions.user_id', userIds);

  if (scoresError) throw scoresError;
  const allScores = (scores ?? []) as PredictionScoreRow[];
  const now = new Date().toISOString();

  return eventEntries
    .filter((entry) => joinedAtByUser.has(entry.user_id))
    .map((entry) => {
      const joinedAt = joinedAtByUser.get(entry.user_id) ?? event.starts_at;
      const eligibleScores = allScores.filter((score) => score.predictions?.user_id === entry.user_id && scoreBelongsToEvent(score, event, joinedAt, selectedMatchIds));
      const points = eligibleScores.reduce((sum, score) => sum + score.total, 0);
      const exactScores = eligibleScores.filter((score) => score.outcome === 'exact').length;
      const correctScores = eligibleScores.filter((score) => score.outcome !== 'missed').length;
      const accuracy = eligibleScores.length ? Math.round((correctScores / eligibleScores.length) * 100) : 0;

      return {
        event_id: event.id,
        user_id: entry.user_id,
        rank: 0,
        previous_rank: previousRanks.get(entry.user_id) ?? null,
        points,
        exact_scores: exactScores,
        accuracy,
        stake: entry.stake,
        payout: 0,
        payout_factor: 1,
        updated_at: now,
        entered_order: eventEntries.findIndex((candidate) => candidate.user_id === entry.user_id),
      };
    })
    .sort((a, b) => b.points - a.points || b.exact_scores - a.exact_scores || b.accuracy - a.accuracy || b.stake - a.stake || a.entered_order - b.entered_order)
    .map(({ entered_order: _enteredOrder, ...entry }, index) => ({ ...entry, rank: index + 1 })) as EventLeaderboardEntry[];
}

export async function refreshLeagueEventLeaderboards(supabase: SupabaseClient, eventIds?: string[]) {
  const eventQuery = supabase.from('league_events').select('*').order('starts_at', { ascending: false });
  const { data: events, error: eventsError } = eventIds?.length ? await eventQuery.in('id', eventIds) : await eventQuery;
  if (eventsError) throw eventsError;

  const leagueEvents = (events ?? []) as LeagueEvent[];
  const selectedMatchIdsByEvent = await getSelectedMatchIdsByEvent(supabase, leagueEvents.map((event) => event.id));

  let writtenEntries = 0;
  for (const event of leagueEvents) {
    const { data: previousEntries, error: previousError } = await supabase
      .from('league_event_leaderboard_entries')
      .select('user_id, rank')
      .eq('event_id', event.id);

    if (previousError) throw previousError;
    const previousRanks = new Map((previousEntries ?? []).map((entry: { user_id: string; rank: number }) => [entry.user_id, entry.rank]));

    const rows = await buildEventEntries(supabase, event, previousRanks, selectedMatchIdsByEvent.get(event.id) ?? new Set<string>());
    const { error: deleteError } = await supabase.from('league_event_leaderboard_entries').delete().eq('event_id', event.id);
    if (deleteError) throw deleteError;
    if (rows.length === 0) continue;

    const { error: insertError } = await supabase.from('league_event_leaderboard_entries').insert(rows);
    if (insertError) throw insertError;
    writtenEntries += rows.length;
  }

  return { leagueEventLeaderboardEntries: writtenEntries };
}

export async function settleLeagueEvent(supabase: SupabaseClient, eventId: string) {
  const { data: event, error: eventError } = await supabase.from('league_events').select('*').eq('id', eventId).single();
  if (eventError) throw eventError;

  const leagueEvent = event as LeagueEvent;
  if (leagueEvent.status === 'settled') throw new Error('This event is already settled.');
  if (leagueEvent.status === 'cancelled') throw new Error('This event is cancelled.');

  const refreshed = await refreshLeagueEventLeaderboards(supabase, [eventId]);
  const { data: rows, error: rowsError } = await supabase
    .from('league_event_leaderboard_entries')
    .select('user_id, rank, stake')
    .eq('event_id', eventId)
    .order('rank', { ascending: true });

  if (rowsError) throw rowsError;
  const payouts = calculatePayouts((rows ?? []) as Array<{ user_id: string; rank: number; stake: number }>, leagueEvent.prize_pool, leagueEvent.payout_curve, leagueEvent.payout_config);

  for (const payout of payouts) {
    if (payout.payout <= 0) continue;

    const { data: existingTransaction, error: existingTransactionError } = await supabase
      .from('point_transactions')
      .select('id')
      .eq('user_id', payout.user_id)
      .eq('event_id', eventId)
      .eq('type', 'payout')
      .maybeSingle();

    if (existingTransactionError) throw existingTransactionError;
    if (existingTransaction) continue;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', payout.user_id)
      .single();

    if (profileError) throw profileError;
    const pointsAfterPayout = Math.max(0, profile.points ?? 0) + payout.payout;
    await updateDisplayedPoints(supabase, payout.user_id, pointsAfterPayout);

    const { error: transactionError } = await supabase.from('point_transactions').insert({
      user_id: payout.user_id,
      league_id: leagueEvent.league_id,
      event_id: eventId,
      type: 'payout',
      amount: payout.payout,
      balance_after: pointsAfterPayout,
      description: 'League event payout',
    });
    if (transactionError) throw transactionError;

    const { error: payoutError } = await supabase
      .from('league_event_leaderboard_entries')
      .update({ payout: payout.payout, payout_factor: payout.factor, updated_at: new Date().toISOString() })
      .eq('event_id', eventId)
      .eq('user_id', payout.user_id);

    if (payoutError) throw payoutError;
  }

  const { error: settleError } = await supabase
    .from('league_events')
    .update({ status: 'settled', settled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', eventId);

  if (settleError) throw settleError;
  return { ...refreshed, payouts: payouts.length };
}

export async function cancelLeagueEvent(supabase: SupabaseClient, eventId: string, cancelledBy: string) {
  const { data: event, error: eventError } = await supabase.from('league_events').select('*').eq('id', eventId).single();
  if (eventError) throw eventError;

  const leagueEvent = event as LeagueEvent;
  if (leagueEvent.status === 'settled') throw new Error('Settled events cannot be cancelled.');
  if (leagueEvent.status === 'cancelled') throw new Error('This event is already cancelled.');

  const { data: entries, error: entriesError } = await supabase
    .from('league_event_entries')
    .select('user_id, stake')
    .eq('event_id', eventId);

  if (entriesError) throw entriesError;
  let refunds = 0;

  for (const entry of (entries ?? []) as Array<{ user_id: string; stake: number }>) {
    const { data: existingTransaction, error: existingTransactionError } = await supabase
      .from('point_transactions')
      .select('id')
      .eq('user_id', entry.user_id)
      .eq('event_id', eventId)
      .eq('type', 'refund')
      .maybeSingle();

    if (existingTransactionError) throw existingTransactionError;
    if (existingTransaction) continue;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', entry.user_id)
      .single();

    if (profileError) throw profileError;
    const pointsAfterRefund = Math.max(0, profile.points ?? 0) + entry.stake;
    await updateDisplayedPoints(supabase, entry.user_id, pointsAfterRefund);

    const { error: transactionError } = await supabase.from('point_transactions').insert({
      user_id: entry.user_id,
      league_id: leagueEvent.league_id,
      event_id: eventId,
      type: 'refund',
      amount: entry.stake,
      balance_after: pointsAfterRefund,
      description: 'League event refund',
    });
    if (transactionError) throw transactionError;
    refunds += 1;
  }

  const { error: cancelError } = await supabase
    .from('league_events')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_by: cancelledBy,
      prize_pool: 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', eventId);

  if (cancelError) throw cancelError;
  const refreshed = await refreshLeagueEventLeaderboards(supabase, [eventId]);
  return { ...refreshed, refunds };
}
