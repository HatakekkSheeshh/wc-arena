import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

type ScoreOutcome = 'exact' | 'correct' | 'missed';

type LeagueMember = {
  league_id: string;
  user_id: string;
  joined_at: string;
};

type PredictionScoreRow = {
  outcome: ScoreOutcome;
  total: number;
  predictions: {
    user_id: string;
    matches: { kickoff_at: string } | null;
  } | null;
};

type LeagueEntry = {
  scope: 'league';
  league_id: string;
  user_id: string;
  rank: number;
  previous_rank: number | null;
  points: number;
  exact_scores: number;
  accuracy: number;
  streak: number;
  updated_at: string;
};

function getCurrentStreak(scores: PredictionScoreRow[]) {
  let streak = 0;
  for (const score of [...scores].sort((a, b) => {
    const left = a.predictions?.matches?.kickoff_at ?? '';
    const right = b.predictions?.matches?.kickoff_at ?? '';
    return right.localeCompare(left);
  })) {
    if (score.outcome === 'missed') break;
    streak += 1;
  }
  return streak;
}

function buildLeagueEntries(leagueId: string, members: LeagueMember[], scores: PredictionScoreRow[], previousRanks: Map<string, number>) {
  const now = new Date().toISOString();

  return members
    .map((member) => {
      const eligibleScores = scores.filter((score) => {
        const prediction = score.predictions;
        const kickoffAt = prediction?.matches?.kickoff_at;
        return prediction?.user_id === member.user_id && kickoffAt && kickoffAt >= member.joined_at;
      });
      const points = eligibleScores.reduce((sum, score) => sum + score.total, 0);
      const exactScores = eligibleScores.filter((score) => score.outcome === 'exact').length;
      const correctScores = eligibleScores.filter((score) => score.outcome !== 'missed').length;
      const accuracy = eligibleScores.length ? Math.round((correctScores / eligibleScores.length) * 100) : 0;

      return {
        scope: 'league' as const,
        league_id: leagueId,
        user_id: member.user_id,
        rank: 0,
        previous_rank: previousRanks.get(member.user_id) ?? null,
        points,
        exact_scores: exactScores,
        accuracy,
        streak: getCurrentStreak(eligibleScores),
        updated_at: now,
        joined_at: member.joined_at,
      };
    })
    .sort((a, b) => b.points - a.points || b.exact_scores - a.exact_scores || b.accuracy - a.accuracy || a.joined_at.localeCompare(b.joined_at))
    .map(({ joined_at: _joinedAt, ...entry }, index) => ({ ...entry, rank: index + 1 }));
}

export async function refreshLeagueLeaderboards(supabase: SupabaseClient, leagueIds?: string[]) {
  const leagueQuery = supabase.from('leagues').select('id').order('created_at', { ascending: true });
  const { data: leagues, error: leaguesError } = leagueIds?.length ? await leagueQuery.in('id', leagueIds) : await leagueQuery;
  if (leaguesError) throw leaguesError;

  const targetLeagueIds = (leagues ?? []).map((league: { id: string }) => league.id);
  if (targetLeagueIds.length === 0) return { leagueLeaderboardEntries: 0 };

  let writtenEntries = 0;

  for (const leagueId of targetLeagueIds) {
    const { data: members, error: membersError } = await supabase
      .from('league_members')
      .select('league_id, user_id, joined_at')
      .eq('league_id', leagueId)
      .order('joined_at', { ascending: true });

    if (membersError) throw membersError;

    const userIds = ((members ?? []) as LeagueMember[]).map((member) => member.user_id);
    const { data: previousEntries, error: previousError } = await supabase
      .from('leaderboard_entries')
      .select('user_id, rank')
      .eq('scope', 'league')
      .eq('league_id', leagueId);

    if (previousError) throw previousError;

    const previousRanks = new Map((previousEntries ?? []).map((entry: { user_id: string; rank: number }) => [entry.user_id, entry.rank]));
    const { error: deleteError } = await supabase
      .from('leaderboard_entries')
      .delete()
      .eq('scope', 'league')
      .eq('league_id', leagueId);

    if (deleteError) throw deleteError;
    if (userIds.length === 0) continue;

    const { data: scores, error: scoresError } = await supabase
      .from('prediction_scores')
      .select('outcome, total, predictions!inner(user_id, matches!inner(kickoff_at))')
      .in('predictions.user_id', userIds);

    if (scoresError) throw scoresError;

    const entries = buildLeagueEntries(leagueId, (members ?? []) as LeagueMember[], (scores ?? []) as PredictionScoreRow[], previousRanks) as LeagueEntry[];
    if (entries.length === 0) continue;

    const { error: insertError } = await supabase.from('leaderboard_entries').insert(entries);
    if (insertError) throw insertError;
    writtenEntries += entries.length;
  }

  return { leagueLeaderboardEntries: writtenEntries };
}
