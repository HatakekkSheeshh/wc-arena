export type StatisticsTeamRow = {
  id: string;
  name: string;
  short_name: string;
  country_code: string;
};

export type StatisticsMatchRow = {
  id: string;
  home_team_id: string;
  away_team_id: string;
};

type SummaryParticipant = {
  name?: string | null;
  type?: string | null;
  sourcePlayerId?: string | null;
};

type SummaryTeamRef = {
  id?: string | null;
  name?: string | null;
  abbreviation?: string | null;
  side?: string | null;
};

type SummaryKeyEvent = {
  id?: string | null;
  type?: string | null;
  typeText?: string | null;
  clock?: string | null;
  period?: number | null;
  team?: SummaryTeamRef;
  text?: string | null;
  participants?: SummaryParticipant[];
  homeScore?: number | null;
  awayScore?: number | null;
  scoringPlay?: boolean;
};

type SummaryTeam = {
  statistics?: { name?: string | null; label?: string | null; value?: string | null }[];
};

export type EspnSummaryPayload = {
  teams?: Record<string, SummaryTeam | undefined>;
  keyEvents?: SummaryKeyEvent[];
};

export type NormalizedEspnPlayer = {
  id: string;
  source: 'espn';
  source_player_id: string | null;
  display_name: string;
  normalized_name: string;
  team_id: string | null;
  updated_at: string;
};

export type NormalizedMatchEvent = {
  match_id: string;
  event_key: string;
  espn_event_id: string | null;
  event_index: number;
  team_id: string | null;
  side: 'home' | 'away' | null;
  event_type: string | null;
  type_text: string | null;
  clock: string | null;
  period: number | null;
  minute: number | null;
  text: string | null;
  scoring_play: boolean;
  home_score: number | null;
  away_score: number | null;
  source_payload: Record<string, unknown>;
  updated_at: string;
};

export type NormalizedEventParticipant = {
  match_id: string;
  event_key: string;
  role: string;
  sort_order: number;
  player_id: string | null;
  player_name: string;
};

export type NormalizedMatchTeamStat = {
  match_id: string;
  team_id: string;
  side: 'home' | 'away';
  stat_key: string;
  label: string;
  source_name: string | null;
  display_value: string;
  numeric_value: number | null;
  updated_at: string;
};

export type NormalizedStatistics = {
  players: NormalizedEspnPlayer[];
  events: NormalizedMatchEvent[];
  participants: NormalizedEventParticipant[];
  teamStats: NormalizedMatchTeamStat[];
};

export type PlayerTournamentStat = {
  player_id: string;
  player_name: string;
  team_id: string | null;
  goals: number;
  assists: number;
  yellow_cards: number;
  latest_match_id: string | null;
  latest_clock: string | null;
  updated_at: string;
};

export type TeamTournamentStat = {
  team_id: string;
  stat_key: string;
  label: string;
  total_numeric: number;
  matches_sampled: number;
  average_numeric: number | null;
  updated_at: string;
};

const statAliases: Record<string, string> = {
  totalshots: 'shots',
  shots: 'shots',
  shotsontarget: 'shotsOnTarget',
  woncorners: 'corners',
  corners: 'corners',
  saves: 'saves',
  foulscommitted: 'fouls',
  fouls: 'fouls',
  yellowcards: 'yellowCards',
};

const statLabels: Record<string, string> = {
  shots: 'Total Shots',
  shotsOnTarget: 'Shots On Target',
  corners: 'Corners',
  saves: 'Saves',
  fouls: 'Fouls',
  yellowCards: 'Yellow Cards',
};

function normalize(value?: string | null) {
  return (value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function normalizeName(value?: string | null) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function getTeamAliases(team?: StatisticsTeamRow) {
  if (!team) return [];
  const aliases = [team.id, team.name, team.short_name, team.country_code].map(normalize).filter(Boolean);
  if (team.country_code === 'CPV') aliases.push('capeverde');
  return aliases;
}

function getGoalTeamNameFromText(text?: string | null) {
  const match = text?.match(/Goal!\s*[^.]+\.\s*[^()]+\(([^)]+)\)/i);
  return normalize(match?.[1]);
}

function getEventSide(event: SummaryKeyEvent, match: StatisticsMatchRow, teams: Map<string, StatisticsTeamRow>): 'home' | 'away' | null {
  const side = event.team?.side?.toLowerCase();
  if (side === 'home' || side === 'away') return side;

  if (event.team?.id === match.home_team_id || event.team?.abbreviation === match.home_team_id) return 'home';
  if (event.team?.id === match.away_team_id || event.team?.abbreviation === match.away_team_id) return 'away';

  const homeAliases = getTeamAliases(teams.get(match.home_team_id));
  const awayAliases = getTeamAliases(teams.get(match.away_team_id));
  const eventTeamName = normalize(event.team?.name ?? event.team?.abbreviation);
  const goalTeamName = getGoalTeamNameFromText(event.text);

  if (eventTeamName && homeAliases.includes(eventTeamName)) return 'home';
  if (eventTeamName && awayAliases.includes(eventTeamName)) return 'away';
  if (goalTeamName && homeAliases.includes(goalTeamName)) return 'home';
  if (goalTeamName && awayAliases.includes(goalTeamName)) return 'away';
  return null;
}

function getTeamIdForSide(match: StatisticsMatchRow, side: 'home' | 'away' | null) {
  if (side === 'home') return match.home_team_id;
  if (side === 'away') return match.away_team_id;
  return null;
}

function getEventKey(event: SummaryKeyEvent, index: number) {
  return event.id ?? `event-${index}`;
}

function getParticipantRole(participant: SummaryParticipant, index: number) {
  const role = normalize(participant.type);
  if (role.includes('scorer')) return 'scorer';
  if (role.includes('assist')) return 'assist';
  return role || `participant-${index}`;
}

function isGoalEvent(event: SummaryKeyEvent) {
  const text = `${event.type ?? ''} ${event.typeText ?? ''} ${event.text ?? ''}`.toLowerCase();
  return Boolean(event.scoringPlay) || text.includes('goal');
}

function isYellowCardEvent(event: Pick<NormalizedMatchEvent, 'event_type' | 'type_text' | 'text'>) {
  const text = `${event.event_type ?? ''} ${event.type_text ?? ''} ${event.text ?? ''}`.toLowerCase();
  return event.event_type === '94' || text.includes('yellow card');
}

function getPlayerId(participant: SummaryParticipant, teamId: string | null) {
  if (participant.sourcePlayerId) return `espn:${participant.sourcePlayerId}`;
  const normalizedName = normalizeName(participant.name);
  if (!normalizedName) return null;
  return `name:${normalizedName}:team:${teamId ?? 'unknown'}`;
}

function parseMinute(clock?: string | null) {
  const match = clock?.match(/\d+/);
  return match ? Number(match[0]) : null;
}

function parseStatNumber(value?: string | null) {
  if (!value) return null;
  const match = value.match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function getStatKey(stat: { name?: string | null; label?: string | null }) {
  return statAliases[normalize(stat.name)] ?? statAliases[normalize(stat.label)] ?? null;
}

function dedupeByKey<T>(rows: T[], getKey: (row: T) => string) {
  return Array.from(new Map(rows.map((row) => [getKey(row), row])).values());
}

export function buildNormalizedStatistics(match: StatisticsMatchRow, summary: EspnSummaryPayload, teams: Map<string, StatisticsTeamRow>, now = new Date().toISOString()): NormalizedStatistics {
  const players: NormalizedEspnPlayer[] = [];
  const events: NormalizedMatchEvent[] = [];
  const participants: NormalizedEventParticipant[] = [];
  const teamStats: NormalizedMatchTeamStat[] = [];

  (summary.keyEvents ?? []).forEach((event, index) => {
    const side = getEventSide(event, match, teams);
    const teamId = getTeamIdForSide(match, side);
    const eventKey = getEventKey(event, index);

    events.push({
      match_id: match.id,
      event_key: eventKey,
      espn_event_id: event.id ?? null,
      event_index: index,
      team_id: teamId,
      side,
      event_type: event.type ?? null,
      type_text: event.typeText ?? null,
      clock: event.clock ?? null,
      period: event.period ?? null,
      minute: parseMinute(event.clock),
      text: event.text ?? null,
      scoring_play: isGoalEvent(event),
      home_score: event.homeScore ?? null,
      away_score: event.awayScore ?? null,
      source_payload: event as Record<string, unknown>,
      updated_at: now,
    });

    (event.participants ?? []).forEach((participant, participantIndex) => {
      if (!participant.name) return;
      const playerId = getPlayerId(participant, teamId);
      if (playerId) {
        players.push({
          id: playerId,
          source: 'espn',
          source_player_id: participant.sourcePlayerId ?? null,
          display_name: participant.name,
          normalized_name: normalizeName(participant.name),
          team_id: teamId,
          updated_at: now,
        });
      }

      participants.push({
        match_id: match.id,
        event_key: eventKey,
        role: getParticipantRole(participant, participantIndex),
        sort_order: participantIndex,
        player_id: playerId,
        player_name: participant.name,
      });
    });
  });

  (['home', 'away'] as const).forEach((side) => {
    const teamId = getTeamIdForSide(match, side);
    const stats = summary.teams?.[side]?.statistics ?? [];
    if (!teamId) return;

    stats.forEach((stat) => {
      const statKey = getStatKey(stat);
      if (!statKey || !stat.value) return;
      teamStats.push({
        match_id: match.id,
        team_id: teamId,
        side,
        stat_key: statKey,
        label: statLabels[statKey] ?? stat.label ?? statKey,
        source_name: stat.name ?? null,
        display_value: stat.value,
        numeric_value: parseStatNumber(stat.value),
        updated_at: now,
      });
    });
  });

  return {
    players: dedupeByKey(players, (player) => player.id),
    events,
    participants,
    teamStats,
  };
}

export function buildPlayerTournamentStats(events: NormalizedMatchEvent[], participants: NormalizedEventParticipant[], now = new Date().toISOString()): PlayerTournamentStat[] {
  const eventMap = new Map(events.map((event) => [`${event.match_id}|${event.event_key}`, event]));
  const rows = new Map<string, PlayerTournamentStat>();

  participants.forEach((participant) => {
    const event = eventMap.get(`${participant.match_id}|${participant.event_key}`);
    if (!event?.team_id || !participant.player_id) return;
    const isScoringParticipant = event.scoring_play && (participant.role === 'scorer' || participant.role === 'assist' || participant.role === 'participant-0' || participant.role === 'participant-1');
    const isYellowCardParticipant = isYellowCardEvent(event) && (participant.role === 'participant-0' || participant.role === 'scorer');
    if (!isScoringParticipant && !isYellowCardParticipant) return;

    const key = `${normalizeName(participant.player_name)}|${event.team_id}`;
    const current = rows.get(key) ?? {
      player_id: participant.player_id,
      player_name: participant.player_name,
      team_id: event.team_id,
      goals: 0,
      assists: 0,
      yellow_cards: 0,
      latest_match_id: event.match_id,
      latest_clock: event.clock,
      updated_at: now,
    };

    if (participant.player_id.startsWith('espn:')) current.player_id = participant.player_id;
    if (event.scoring_play && (participant.role === 'scorer' || participant.role === 'participant-0')) current.goals += 1;
    if (event.scoring_play && (participant.role === 'assist' || participant.role === 'participant-1')) current.assists += 1;
    if (isYellowCardParticipant) current.yellow_cards += 1;
    current.latest_match_id = event.match_id;
    current.latest_clock = event.clock;
    rows.set(key, current);
  });

  return Array.from(rows.values()).sort((first, second) => second.goals - first.goals || second.assists - first.assists || second.yellow_cards - first.yellow_cards || first.player_name.localeCompare(second.player_name));
}

export function buildTeamTournamentStats(teamStats: NormalizedMatchTeamStat[], now = new Date().toISOString()): TeamTournamentStat[] {
  const rows = new Map<string, TeamTournamentStat>();

  teamStats.forEach((stat) => {
    if (stat.numeric_value === null) return;
    const key = `${stat.team_id}|${stat.stat_key}`;
    const current = rows.get(key) ?? {
      team_id: stat.team_id,
      stat_key: stat.stat_key,
      label: stat.label,
      total_numeric: 0,
      matches_sampled: 0,
      average_numeric: null,
      updated_at: now,
    };

    current.total_numeric += stat.numeric_value;
    current.matches_sampled += 1;
    current.average_numeric = current.matches_sampled ? Number((current.total_numeric / current.matches_sampled).toFixed(2)) : null;
    rows.set(key, current);
  });

  return Array.from(rows.values()).sort((first, second) => second.total_numeric - first.total_numeric || first.label.localeCompare(second.label));
}
