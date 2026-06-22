import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

type ScoreOutcome = 'exact' | 'correct' | 'missed';

type LeagueEvent = {
  id: string;
  league_id: string;
  event_type: 'weekly' | 'matchday';
  starts_at: string;
  ends_at: string;
  matchday: number | null;
  prize_pool: number;
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
    matches: { kickoff_at: string; matchday: number | null } | null;
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

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function calculatePayouts(entries: Array<{ user_id: string; rank: number; stake: number }>, prizePool: number) {
  const shares = new Map([[1, 0.5], [2, 0.3], [3, 0.2]]);
  const winners = entries.filter((entry) => shares.has(entry.rank));
  const averageStake = entries.length ? prizePool / entries.length : 0;
  const raw = winners.map((entry) => {
    const factor = averageStake > 0 ? clamp(Math.sqrt(entry.stake / averageStake), 0.5, 1.5) : 1;
    return { user_id: entry.user_id, factor, rawPayout: prizePool * (shares.get(entry.rank) ?? 0) * factor };
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

function scoreBelongsToEvent(score: PredictionScoreRow, event: LeagueEvent, joinedAt: string) {
  const match = score.predictions?.matches;
  if (!match?.kickoff_at) return false;
  if (match.kickoff_at < joinedAt) return false;
  if (match.kickoff_at < event.starts_at || match.kickoff_at >= event.ends_at) return false;
  return event.event_type !== 'matchday' || match.matchday === event.matchday;
}

async function buildEventEntries(supabase: SupabaseClient, event: LeagueEvent, previousRanks: Map<string, number>) {
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
    .select('outcome, total, predictions!inner(user_id, matches!inner(kickoff_at, matchday))')
    .in('predictions.user_id', userIds);

  if (scoresError) throw scoresError;
  const allScores = (scores ?? []) as PredictionScoreRow[];
  const now = new Date().toISOString();

  return eventEntries
    .filter((entry) => joinedAtByUser.has(entry.user_id))
    .map((entry) => {
      const joinedAt = joinedAtByUser.get(entry.user_id) ?? event.starts_at;
      const eligibleScores = allScores.filter((score) => score.predictions?.user_id === entry.user_id && scoreBelongsToEvent(score, event, joinedAt));
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

  let writtenEntries = 0;
  for (const event of (events ?? []) as LeagueEvent[]) {
    const { data: previousEntries, error: previousError } = await supabase
      .from('league_event_leaderboard_entries')
      .select('user_id, rank')
      .eq('event_id', event.id);

    if (previousError) throw previousError;
    const previousRanks = new Map((previousEntries ?? []).map((entry: { user_id: string; rank: number }) => [entry.user_id, entry.rank]));

    const rows = await buildEventEntries(supabase, event, previousRanks);
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
  const refreshed = await refreshLeagueEventLeaderboards(supabase, [eventId]);
  const { data: event, error: eventError } = await supabase.from('league_events').select('*').eq('id', eventId).single();
  if (eventError) throw eventError;

  const leagueEvent = event as LeagueEvent;
  const { data: rows, error: rowsError } = await supabase
    .from('league_event_leaderboard_entries')
    .select('user_id, rank, stake')
    .eq('event_id', eventId)
    .order('rank', { ascending: true });

  if (rowsError) throw rowsError;
  const payouts = calculatePayouts((rows ?? []) as Array<{ user_id: string; rank: number; stake: number }>, leagueEvent.prize_pool);

  for (const payout of payouts) {
    if (payout.payout <= 0) continue;
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', payout.user_id)
      .single();

    if (profileError) throw profileError;
    const pointsAfterPayout = Math.max(0, profile.points ?? 0) + payout.payout;
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ points: pointsAfterPayout })
      .eq('id', payout.user_id);

    if (updateError) throw updateError;

    const { error: leaderboardError } = await supabase
      .from('leaderboard_entries')
      .update({ points: pointsAfterPayout, updated_at: new Date().toISOString() })
      .eq('scope', 'global')
      .is('league_id', null)
      .eq('user_id', payout.user_id);

    if (leaderboardError) throw leaderboardError;

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
