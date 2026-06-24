import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BarChart3, Goal, Handshake, ListOrdered, ShieldAlert, Trophy, Users } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import { buildGroupStandings } from '../lib/groupStandings';
import { listMatchesWithSummaries, type MatchRow } from '../services/matches';
import { getStatisticsCoverage, listTopAssists, listTopGoalContributions, listTopScorers, listTopYellowCards, type PlayerTournamentStatRow, type StatisticsCoverage } from '../services/statistics';
import { getTeamMap, listTeams, type TeamRow } from '../services/teams';
import { getErrorMessage } from '../services/serviceTypes';
import { getTeamFlag } from '../utils/teamFlags';
import type { ThemeControls } from '../App';

type StatisticsProps = {
  themeControls: ThemeControls;
};

type EspnSummaryParticipant = {
  name?: string | null;
  type?: string | null;
};

type EspnSummaryTeamRef = {
  id?: string | null;
  name?: string | null;
  abbreviation?: string | null;
  side?: string | null;
};

type EspnSummaryKeyEvent = {
  id?: string | null;
  type?: string | null;
  typeText?: string | null;
  clock?: string | null;
  team?: EspnSummaryTeamRef;
  text?: string | null;
  participants?: EspnSummaryParticipant[];
  scoringPlay?: boolean;
};

type EspnSummaryPayload = {
  teams?: Record<string, {
    statistics?: { name?: string | null; label?: string | null; value?: string | null }[];
  }>;
  keyEvents?: EspnSummaryKeyEvent[];
};

type PlayerLeaderRow = {
  name: string;
  teamId: string | null;
  teamName: string;
  goals: number;
  assists: number;
  yellowCards: number;
  total: number;
  latestMinute: string;
};

function getSummary(match: MatchRow): EspnSummaryPayload {
  return (match.espn_summary ?? {}) as EspnSummaryPayload;
}

function getParticipantName(event: EspnSummaryKeyEvent, type: string) {
  const normalizedType = type.toLowerCase();
  return event.participants?.find((participant) => participant.type?.toLowerCase().includes(normalizedType))?.name ?? null;
}

function isGoalEvent(event: EspnSummaryKeyEvent) {
  const text = `${event.type ?? ''} ${event.typeText ?? ''} ${event.text ?? ''}`.toLowerCase();
  return event.scoringPlay || text.includes('goal');
}

function isYellowCardEvent(event: EspnSummaryKeyEvent) {
  const text = `${event.type ?? ''} ${event.typeText ?? ''} ${event.text ?? ''}`.toLowerCase();
  return event.type === '94' || text.includes('yellow card');
}

function normalizeTeamText(value?: string | null) {
  return (value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function getTeamAliases(team?: TeamRow) {
  if (!team) return [];
  const aliases = [team.id, team.name, team.short_name, team.country_code].map(normalizeTeamText).filter(Boolean) as string[];
  if (team.country_code === 'CPV') aliases.push('capeverde');
  return aliases;
}

function getGoalTeamNameFromText(text?: string | null) {
  const match = text?.match(/Goal!\s*[^.]+\.\s*[^()]+\(([^)]+)\)/i);
  return normalizeTeamText(match?.[1]);
}

function getEventTeamId(event: EspnSummaryKeyEvent, match: MatchRow, teams: Map<string, TeamRow>) {
  const side = event.team?.side?.toLowerCase();
  if (side === 'home') return match.home_team_id;
  if (side === 'away') return match.away_team_id;
  const eventId = event.team?.id;
  if (eventId === match.home_team_id || event.team?.abbreviation === match.home_team_id) return match.home_team_id;
  if (eventId === match.away_team_id || event.team?.abbreviation === match.away_team_id) return match.away_team_id;

  const homeAliases = getTeamAliases(teams.get(match.home_team_id));
  const awayAliases = getTeamAliases(teams.get(match.away_team_id));
  const eventTeamName = normalizeTeamText(event.team?.name ?? event.team?.abbreviation);
  const goalTeamName = getGoalTeamNameFromText(event.text);

  if (eventTeamName && homeAliases.includes(eventTeamName)) return match.home_team_id;
  if (eventTeamName && awayAliases.includes(eventTeamName)) return match.away_team_id;
  if (goalTeamName && homeAliases.includes(goalTeamName)) return match.home_team_id;
  if (goalTeamName && awayAliases.includes(goalTeamName)) return match.away_team_id;
  return null;
}

function buildPlayerLeaders(matches: MatchRow[], teams: Map<string, TeamRow>): PlayerLeaderRow[] {
  const rows = new Map<string, PlayerLeaderRow>();

  function getRow(name: string, teamId: string | null, teamName: string) {
    const key = `${name}|${teamId ?? teamName}`;
    const current = rows.get(key) ?? { name, teamId, teamName, goals: 0, assists: 0, yellowCards: 0, total: 0, latestMinute: '—' };
    rows.set(key, current);
    return current;
  }

  matches.forEach((match) => {
    const summary = getSummary(match);
    (summary.keyEvents ?? []).forEach((event) => {
      const teamId = getEventTeamId(event, match, teams);
      const teamName = teamId ? teams.get(teamId)?.short_name ?? teams.get(teamId)?.name ?? teamId : event.team?.abbreviation ?? event.team?.name ?? '—';

      if (isGoalEvent(event)) {
        const scorer = getParticipantName(event, 'scorer') ?? event.participants?.[0]?.name;
        const assist = getParticipantName(event, 'assist') ?? event.participants?.[1]?.name ?? event.text?.match(/Assisted by ([^.]+)\./i)?.[1] ?? null;

        if (scorer) {
          const current = getRow(scorer, teamId, teamName);
          current.goals += 1;
          current.total += 1;
          current.latestMinute = event.clock ?? current.latestMinute;
        }

        if (assist && assist !== scorer) {
          const current = getRow(assist, teamId, teamName);
          current.assists += 1;
          current.total += 1;
          current.latestMinute = event.clock ?? current.latestMinute;
        }
      }

      if (isYellowCardEvent(event)) {
        const player = event.participants?.[0]?.name;
        if (player) {
          const current = getRow(player, teamId, teamName);
          current.yellowCards += 1;
          current.latestMinute = event.clock ?? current.latestMinute;
        }
      }
    });
  });

  return Array.from(rows.values());
}

function sortTopScorers(rows: PlayerLeaderRow[]) {
  return [...rows]
    .sort((first, second) => second.goals - first.goals || second.assists - first.assists || first.name.localeCompare(second.name))
    .slice(0, 10);
}

function sortTopAssists(rows: PlayerLeaderRow[]) {
  return [...rows]
    .sort((first, second) => second.assists - first.assists || second.goals - first.goals || first.name.localeCompare(second.name))
    .slice(0, 10);
}

function sortTopGoalContributions(rows: PlayerLeaderRow[]) {
  return [...rows]
    .sort((first, second) => second.total - first.total || second.goals - first.goals || first.name.localeCompare(second.name))
    .slice(0, 10);
}

function sortTopYellowCards(rows: PlayerLeaderRow[]) {
  return [...rows]
    .sort((first, second) => second.yellowCards - first.yellowCards || first.name.localeCompare(second.name))
    .slice(0, 10);
}

function mapNormalizedPlayerLeaders(rows: PlayerTournamentStatRow[], teams: Map<string, TeamRow>): PlayerLeaderRow[] {
  return rows.map((row) => {
    const team = row.team_id ? teams.get(row.team_id) : undefined;
    return {
      name: row.player_name,
      teamId: row.team_id,
      teamName: team?.short_name ?? team?.name ?? row.team_id ?? '—',
      goals: row.goals,
      assists: row.assists,
      yellowCards: row.yellow_cards,
      total: row.goals + row.assists,
      latestMinute: row.latest_clock ?? '—',
    };
  });
}

function TeamFlag({ team }: { team?: TeamRow }) {
  const Flag = getTeamFlag(team?.country_code, team?.short_name);
  if (!Flag) return <span className="font-black text-[10px]">{team?.short_name?.slice(0, 2) ?? '—'}</span>;
  return <Flag className="w-full h-full object-cover" title={team?.name} />;
}

function PlayerLeaderTable({ title, icon, rows, teamMap, metricLabel, getMetric, emptyLabel }: { title: string; icon: ReactNode; rows: PlayerLeaderRow[]; teamMap: Map<string, TeamRow>; metricLabel: string; getMetric: (row: PlayerLeaderRow) => number; emptyLabel: string }) {
  return (
    <div className="border-b-4 border-main last:border-b-0 bg-card">
      <div className="bg-main text-inv font-black px-3 sm:px-4 py-2.5 sm:py-3 uppercase tracking-wide text-xs sm:text-sm border-b-4 border-main flex items-center gap-2">
        {icon} {title}
      </div>
      <div className="max-h-[318px] sm:max-h-[320px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-main/30 hover:[&::-webkit-scrollbar-thumb]:bg-main/50">
        {rows.map((row, index) => {
          const team = row.teamId ? teamMap.get(row.teamId) : undefined;
          return (
            <div key={`${title}-${row.name}-${row.teamName}`} className="grid grid-cols-[32px_1fr_auto] sm:grid-cols-[38px_1fr_auto] items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 border-b-2 border-line last:border-b-0 bg-card min-w-0">
              <div className="font-black text-base sm:text-lg text-c2">#{index + 1}</div>
              <div className="min-w-0">
                <div className="font-black uppercase text-xs sm:text-sm truncate">{row.name}</div>
                <div className="font-bold uppercase text-[9px] sm:text-[10px] text-subtle flex items-center gap-1.5 min-w-0">
                  <span className="w-5 h-4 border border-main rounded-sm overflow-hidden bg-muted shrink-0 flex items-center justify-center"><TeamFlag team={team} /></span>
                  <span className="truncate">{row.teamName}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-black text-lg leading-none">{getMetric(row)}</div>
                <div className="font-black uppercase text-[9px] text-subtle">{metricLabel}</div>
              </div>
            </div>
          );
        })}
        {rows.length === 0 && <div className="p-4 font-black uppercase text-xs text-subtle">{emptyLabel}</div>}
      </div>
    </div>
  );
}

export default function Statistics({ themeControls }: StatisticsProps) {
  const { t } = useTranslation();
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [teamMap, setTeamMap] = useState<Map<string, TeamRow>>(new Map());
  const [normalizedTopScorers, setNormalizedTopScorers] = useState<PlayerTournamentStatRow[]>([]);
  const [normalizedTopAssists, setNormalizedTopAssists] = useState<PlayerTournamentStatRow[]>([]);
  const [normalizedTopGoalContributions, setNormalizedTopGoalContributions] = useState<PlayerTournamentStatRow[]>([]);
  const [normalizedTopYellowCards, setNormalizedTopYellowCards] = useState<PlayerTournamentStatRow[]>([]);
  const [coverage, setCoverage] = useState<StatisticsCoverage>({ normalizedMatches: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([listMatchesWithSummaries(), listTeams(), getTeamMap(), listTopScorers(), listTopAssists(), listTopGoalContributions(), listTopYellowCards(), getStatisticsCoverage()])
      .then(([nextMatches, nextTeams, nextTeamMap, nextTopScorers, nextTopAssists, nextTopGoalContributions, nextTopYellowCards, nextCoverage]) => {
        if (!active) return;
        setMatches(nextMatches);
        setTeams(nextTeams);
        setTeamMap(nextTeamMap);
        setNormalizedTopScorers(nextTopScorers);
        setNormalizedTopAssists(nextTopAssists);
        setNormalizedTopGoalContributions(nextTopGoalContributions);
        setNormalizedTopYellowCards(nextTopYellowCards);
        setCoverage(nextCoverage);
      })
      .catch((nextError) => {
        if (!active) return;
        setError(getErrorMessage(nextError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const completedMatches = useMemo(() => matches.filter((match) => match.status === 'finished'), [matches]);
  const groups = useMemo(() => [...new Set(teams.map((team) => team.group_code).filter(Boolean) as string[])].sort(), [teams]);
  const groupCards = useMemo(() => groups.map((group) => ({
    group,
    rows: buildGroupStandings(matches, group, teams.filter((team) => team.group_code === group)),
  })), [groups, matches, teams]);
  const fallbackPlayerLeaders = useMemo(() => buildPlayerLeaders(completedMatches, teamMap), [completedMatches, teamMap]);
  const normalizedScorers = useMemo(() => mapNormalizedPlayerLeaders(normalizedTopScorers, teamMap), [normalizedTopScorers, teamMap]);
  const normalizedAssists = useMemo(() => mapNormalizedPlayerLeaders(normalizedTopAssists, teamMap), [normalizedTopAssists, teamMap]);
  const normalizedGoalContributions = useMemo(() => mapNormalizedPlayerLeaders(normalizedTopGoalContributions, teamMap), [normalizedTopGoalContributions, teamMap]);
  const normalizedYellowCards = useMemo(() => mapNormalizedPlayerLeaders(normalizedTopYellowCards, teamMap), [normalizedTopYellowCards, teamMap]);
  const topScorers = normalizedScorers.length ? normalizedScorers : sortTopScorers(fallbackPlayerLeaders);
  const topAssists = normalizedAssists.length ? normalizedAssists : sortTopAssists(fallbackPlayerLeaders);
  const topGoalContributions = normalizedGoalContributions.length ? normalizedGoalContributions : sortTopGoalContributions(fallbackPlayerLeaders);
  const topYellowCards = normalizedYellowCards.length ? normalizedYellowCards : sortTopYellowCards(fallbackPlayerLeaders);
  const topScorerGoals = topScorers[0]?.goals ?? 0;
  const topAssistCount = topAssists[0]?.assists ?? 0;
  const summaryMatches = coverage.normalizedMatches || matches.filter((match) => match.espn_summary_updated_at).length;

  return (
    <AppShell themeControls={themeControls}>
      <div className="relative z-10 flex flex-col p-3 sm:p-4 lg:p-6 gap-3 lg:gap-6 min-h-0">
        <div className="bg-card border-4 border-main p-3 sm:p-4 lg:p-6 flex flex-col w-full xl:w-1/2 shadow-[4px_4px_0_0_var(--color-shadow)] sm:shadow-[6px_6px_0_0_var(--color-shadow)] lg:shadow-[8px_8px_0_0_var(--color-shadow)]">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-1 text-main leading-none">
            {t('appPages.statistics.title')}
          </h1>
          <p className="hidden sm:block font-bold text-xs sm:text-sm text-subtle uppercase leading-snug max-w-2xl">
            {t('appPages.statistics.description')}
          </p>
        </div>

        <div className="bg-card border-4 border-main p-2.5 sm:p-4 lg:p-6 flex flex-col gap-3 lg:gap-6 shadow-[4px_4px_0_0_var(--color-shadow)] sm:shadow-[6px_6px_0_0_var(--color-shadow)] lg:shadow-[8px_8px_0_0_var(--color-shadow)] rounded-sm">
          <div className="grid grid-cols-3 gap-2 lg:gap-0 lg:border-b-4 lg:border-main">
            <div className="flex items-center gap-2 lg:gap-4 border-2 lg:border-0 lg:border-r-4 border-main p-2 sm:p-3 lg:p-5 bg-c1 text-main min-w-0">
              <ListOrdered size={18} className="shrink-0 lg:hidden" strokeWidth={2.5} />
              <ListOrdered size={30} className="shrink-0 hidden lg:block" strokeWidth={2.5} />
              <div className="min-w-0">
                <div className="text-[8px] sm:text-[10px] lg:text-xs uppercase font-black tracking-widest leading-none mb-1 truncate">{t('appPages.statistics.groupsTracked')}</div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-black leading-none">{groups.length}</div>
                <div className="text-[8px] sm:text-[9px] lg:text-[10px] font-bold uppercase mt-0.5 lg:mt-1 truncate">{t('ui.groupStandings')}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 lg:gap-4 border-2 lg:border-0 lg:border-r-4 border-main p-2 sm:p-3 lg:p-5 bg-c2 text-inv min-w-0">
              <Goal size={18} className="shrink-0 lg:hidden" strokeWidth={2.5} />
              <Goal size={30} className="shrink-0 hidden lg:block" strokeWidth={2.5} />
              <div className="min-w-0">
                <div className="text-[8px] sm:text-[10px] lg:text-xs uppercase font-black tracking-widest leading-none mb-1 truncate">{t('appPages.statistics.topScorers')}</div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-black leading-none">{topScorerGoals}</div>
                <div className="text-[8px] sm:text-[9px] lg:text-[10px] font-bold uppercase mt-0.5 lg:mt-1 truncate">{t('appPages.statistics.goals')}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 lg:gap-4 border-2 lg:border-0 border-main p-2 sm:p-3 lg:p-5 bg-c3 text-main min-w-0">
              <Handshake size={18} className="shrink-0 lg:hidden" strokeWidth={2.5} />
              <Handshake size={30} className="shrink-0 hidden lg:block" strokeWidth={2.5} />
              <div className="min-w-0">
                <div className="text-[8px] sm:text-[10px] lg:text-xs uppercase font-black tracking-widest leading-none mb-1 truncate">{t('appPages.statistics.topAssists')}</div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-black leading-none">{topAssistCount}</div>
                <div className="text-[8px] sm:text-[9px] lg:text-[10px] font-bold uppercase mt-0.5 lg:mt-1 truncate">{t('appPages.statistics.assists')}</div>
              </div>
            </div>
          </div>

          {loading && <div className="p-6 bg-card font-black uppercase text-sm border-b-4 border-main">{t('ui.loading')}</div>}
          {error && <div className="p-6 bg-c5 text-main font-black uppercase text-sm border-b-4 border-main">{error}</div>}

          {!loading && !error && (
            <div className="flex flex-col xl:flex-row flex-1 gap-3 xl:gap-0">
              <div className="order-2 xl:order-1 flex-1 border-4 xl:border-0 xl:border-r-4 border-main flex flex-col bg-muted min-w-0 shadow-[3px_3px_0_var(--color-shadow)] xl:shadow-none">
                <div className="bg-main text-inv font-black px-3 sm:px-4 py-2.5 sm:py-3 uppercase tracking-wide text-xs sm:text-sm border-b-4 border-main flex items-center justify-between gap-3">
                  <span>{t('appPages.statistics.groupTables')}</span>
                  <span className="text-[10px] font-bold text-faint">{t('ui.itemsCount', { count: groupCards.length })}</span>
                </div>
                <div className="grid grid-cols-1 2xl:grid-cols-2 bg-card">
                  {groupCards.map(({ group, rows }) => (
                    <div key={group} className="border-b-4 2xl:odd:border-r-4 border-main bg-card min-w-0">
                      <div className="bg-c1 text-main px-3 py-2 border-b-4 border-main font-black uppercase text-sm">{t('ui.groupLabel', { group })}</div>
                      <div className="grid grid-cols-[42px_minmax(0,1fr)_34px_34px_34px_42px_42px] items-center border-b-2 border-main bg-muted px-2 py-2 font-black uppercase text-[9px] text-subtle gap-1">
                        <span>{t('ui.rankShort')}</span>
                        <span>{t('ui.team')}</span>
                        <span className="text-center">{t('ui.playedShort')}</span>
                        <span className="text-center">{t('ui.winsShort')}</span>
                        <span className="text-center">{t('ui.drawsShort')}</span>
                        <span className="text-center">{t('ui.goalDifferenceShort')}</span>
                        <span className="text-right">{t('ui.groupPointsShort')}</span>
                      </div>
                      {rows.map((row, index) => (
                        <div key={row.team.id} className="grid grid-cols-[42px_minmax(0,1fr)_34px_34px_34px_42px_42px] items-center border-b-2 border-line last:border-b-0 px-2 py-2 font-bold text-xs gap-1 min-w-0">
                          <span className="font-black">#{index + 1}</span>
                          <span className="flex items-center gap-2 min-w-0">
                            <span className="w-7 h-5 border-2 border-main rounded-sm overflow-hidden bg-muted shrink-0 flex items-center justify-center"><TeamFlag team={row.team} /></span>
                            <span className="font-black uppercase truncate">{row.team.short_name}</span>
                          </span>
                          <span className="text-center">{row.played}</span>
                          <span className="text-center">{row.wins}</span>
                          <span className="text-center">{row.draws}</span>
                          <span className="text-center">{row.goalDifference}</span>
                          <span className="text-right font-black">{row.points}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                  {groupCards.length === 0 && <div className="p-6 font-black uppercase text-sm bg-card">{t('ui.noGroupStandings')}</div>}
                </div>
              </div>

              <div className="order-1 xl:order-2 w-full xl:w-[420px] bg-card border-4 xl:border-0 border-main flex flex-col shadow-[3px_3px_0_var(--color-shadow)] xl:shadow-none">
                <PlayerLeaderTable
                  title={t('appPages.statistics.topScorers')}
                  icon={<Trophy size={18} strokeWidth={2.5} />}
                  rows={topScorers}
                  teamMap={teamMap}
                  metricLabel={t('appPages.statistics.goals')}
                  getMetric={(row) => row.goals}
                  emptyLabel={t('appPages.statistics.noTopScorers')}
                />
                <PlayerLeaderTable
                  title={t('appPages.statistics.topAssists')}
                  icon={<Handshake size={18} strokeWidth={2.5} />}
                  rows={topAssists}
                  teamMap={teamMap}
                  metricLabel={t('appPages.statistics.assists')}
                  getMetric={(row) => row.assists}
                  emptyLabel={t('appPages.statistics.noTopAssists')}
                />
                <PlayerLeaderTable
                  title={t('appPages.statistics.goalsPlusAssists')}
                  icon={<BarChart3 size={18} strokeWidth={2.5} />}
                  rows={topGoalContributions}
                  teamMap={teamMap}
                  metricLabel={t('appPages.statistics.total')}
                  getMetric={(row) => row.total}
                  emptyLabel={t('appPages.statistics.noGoalContributions')}
                />
                <PlayerLeaderTable
                  title={t('appPages.statistics.yellowCards')}
                  icon={<ShieldAlert size={18} strokeWidth={2.5} />}
                  rows={topYellowCards}
                  teamMap={teamMap}
                  metricLabel={t('appPages.statistics.cards')}
                  getMetric={(row) => row.yellowCards}
                  emptyLabel={t('appPages.statistics.noYellowCards')}
                />
              </div>
            </div>
          )}

          <div className="border-t-4 border-main bg-c1 text-main p-2.5 sm:p-4 flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center sm:justify-between">
            <div className="font-black uppercase text-[10px] sm:text-sm flex items-center gap-2"><Users size={16} className="shrink-0" strokeWidth={2.5} /> {t('appPages.statistics.phaseOneNote')}</div>
            <Link to="/matches" className="border-2 border-main bg-card px-3 py-2 font-black uppercase text-xs shadow-[3px_3px_0_var(--color-shadow)] hover:bg-muted text-center">
              {t('ui.backToMatches')}
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
