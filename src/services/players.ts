import { supabase } from '../lib/supabaseClient';
import { cached } from './cache';
import { listTeams, type TeamRow } from './teams';

type PlayerRow = {
  id: string;
  slug: string;
  display_name: string;
  normalized_name: string;
  date_of_birth: string | null;
  primary_position: string | null;
  primary_team_id: string | null;
  club: string | null;
  image_url: string | null;
  source_player_name: string;
};

type SquadPlayerRow = {
  team_id: string;
  squad_number: number | null;
  position: string;
  caps: number | null;
  international_goals: number | null;
  club: string | null;
  captain: boolean;
  coach_name: string | null;
  group_code: string | null;
  player: PlayerRow | PlayerRow[] | null;
};

type SquadSummaryRow = {
  team_id: string;
  coach_name: string | null;
};

export type TournamentSquadPlayer = Omit<SquadPlayerRow, 'player'> & {
  player: PlayerRow;
};

export type TeamSquadSummary = {
  team: TeamRow;
  coachName: string | null;
  playerCount: number;
};

export type TeamSquad = TeamSquadSummary & {
  players: TournamentSquadPlayer[];
};

const SQUAD_SUMMARY_FIELDS = 'team_id, coach_name';
const SQUAD_PLAYER_FIELDS = 'team_id, squad_number, position, caps, international_goals, club, captain, coach_name, group_code, player:players(id, slug, display_name, normalized_name, date_of_birth, primary_position, primary_team_id, club, image_url, source_player_name)';

function normalizePlayer(player: SquadPlayerRow['player']) {
  if (Array.isArray(player)) return player[0] ?? null;
  return player;
}

function sortSquadPlayers(players: TournamentSquadPlayer[]) {
  return [...players].sort((first, second) => {
    if (first.squad_number !== null && second.squad_number !== null) return first.squad_number - second.squad_number;
    if (first.squad_number !== null) return -1;
    if (second.squad_number !== null) return 1;
    return first.player.display_name.localeCompare(second.player.display_name);
  });
}

function sortSquadSummaries(squads: TeamSquadSummary[]) {
  return [...squads].sort((first, second) => (first.team.group_code ?? '').localeCompare(second.team.group_code ?? '') || first.team.name.localeCompare(second.team.name));
}

export async function listTournamentSquadSummaries() {
  return cached('players:tournament-squad-summaries:wc2026', 300_000, async (): Promise<TeamSquadSummary[]> => {
    const [teams, squadResult] = await Promise.all([
      listTeams(),
      (supabase as any)
        .from('tournament_squad_players')
        .select(SQUAD_SUMMARY_FIELDS)
        .eq('tournament_id', 'wc2026')
        .order('team_id', { ascending: true }),
    ]);

    if (squadResult.error) throw squadResult.error;

    const teamsById = new Map(teams.map((team) => [team.id, team]));
    const summariesByTeam = new Map<string, { coachName: string | null; playerCount: number }>();

    for (const row of (squadResult.data ?? []) as SquadSummaryRow[]) {
      const current = summariesByTeam.get(row.team_id) ?? { coachName: null, playerCount: 0 };
      summariesByTeam.set(row.team_id, {
        coachName: current.coachName ?? row.coach_name,
        playerCount: current.playerCount + 1,
      });
    }

    return sortSquadSummaries(Array.from(summariesByTeam.entries()).flatMap(([teamId, summary]) => {
      const team = teamsById.get(teamId);
      return team ? [{ team, ...summary }] : [];
    }));
  });
}

export async function getTournamentTeamSquad(teamId: string) {
  return cached(`players:tournament-team-squad:wc2026:${teamId}`, 300_000, async (): Promise<TeamSquad | null> => {
    const [teams, squadResult] = await Promise.all([
      listTeams(),
      (supabase as any)
        .from('tournament_squad_players')
        .select(SQUAD_PLAYER_FIELDS)
        .eq('tournament_id', 'wc2026')
        .eq('team_id', teamId)
        .order('squad_number', { ascending: true }),
    ]);

    if (squadResult.error) throw squadResult.error;

    const team = teams.find((nextTeam) => nextTeam.id === teamId);
    if (!team) return null;

    const players = ((squadResult.data ?? []) as SquadPlayerRow[]).flatMap((row) => {
      const player = normalizePlayer(row.player);
      return player ? [{ ...row, player }] : [];
    });

    return {
      team,
      coachName: players.find((player) => player.coach_name)?.coach_name ?? null,
      playerCount: players.length,
      players: sortSquadPlayers(players),
    };
  });
}
