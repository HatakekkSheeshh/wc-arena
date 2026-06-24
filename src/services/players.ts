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

export type TournamentSquadPlayer = Omit<SquadPlayerRow, 'player'> & {
  player: PlayerRow;
};

export type TeamSquad = {
  team: TeamRow;
  coachName: string | null;
  players: TournamentSquadPlayer[];
};

const SQUAD_PLAYER_FIELDS = 'team_id, squad_number, position, caps, international_goals, club, captain, coach_name, group_code, player:players(id, slug, display_name, normalized_name, date_of_birth, primary_position, primary_team_id, club, image_url, source_player_name)';
const SQUAD_PAGE_SIZE = 500;

async function listTournamentSquadRows() {
  const rows: SquadPlayerRow[] = [];

  for (let from = 0; ; from += SQUAD_PAGE_SIZE) {
    const { data, error } = await (supabase as any)
      .from('tournament_squad_players')
      .select(SQUAD_PLAYER_FIELDS)
      .eq('tournament_id', 'wc2026')
      .order('team_id', { ascending: true })
      .order('squad_number', { ascending: true })
      .range(from, from + SQUAD_PAGE_SIZE - 1);

    if (error) throw error;
    rows.push(...((data ?? []) as SquadPlayerRow[]));
    if (!data || data.length < SQUAD_PAGE_SIZE) return rows;
  }
}

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

export async function listTournamentSquads() {
  return cached('players:tournament-squads:wc2026', 300_000, async (): Promise<TeamSquad[]> => {
    const [teams, squadRows] = await Promise.all([
      listTeams(),
      listTournamentSquadRows(),
    ]);

    const teamsById = new Map(teams.map((team) => [team.id, team]));
    const squadsByTeam = new Map<string, TournamentSquadPlayer[]>();

    for (const row of squadRows) {
      const player = normalizePlayer(row.player);
      if (!player) continue;
      const squadPlayer: TournamentSquadPlayer = { ...row, player };
      const current = squadsByTeam.get(row.team_id) ?? [];
      current.push(squadPlayer);
      squadsByTeam.set(row.team_id, current);
    }

    return Array.from(squadsByTeam.entries())
      .map(([teamId, players]) => {
        const team = teamsById.get(teamId);
        if (!team) return null;
        return {
          team,
          coachName: players.find((player) => player.coach_name)?.coach_name ?? null,
          players: sortSquadPlayers(players),
        };
      })
      .filter((squad): squad is TeamSquad => Boolean(squad))
      .sort((first, second) => (first.team.group_code ?? '').localeCompare(second.team.group_code ?? '') || first.team.name.localeCompare(second.team.name));
  });
}
