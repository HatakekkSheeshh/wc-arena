import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BarChart3, Goal, ListOrdered, Shield, Trophy, Users } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import { buildGroupStandings } from '../lib/groupStandings';
import { listMatchesWithSummaries, type MatchRow } from '../services/matches';
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

type TopScorerRow = {
  name: string;
  teamId: string | null;
  teamName: string;
  goals: number;
  assists: number;
  latestMinute: string;
};

type TeamStatRow = {
  teamId: string;
  teamName: string;
  statKey: string;
  label: string;
  total: number;
  matches: number;
};

const teamStatDefinitions = [
  { key: 'shots', label: 'Total Shots', aliases: ['totalshots', 'shots'] },
  { key: 'shotsOnTarget', label: 'Shots On Target', aliases: ['shotsontarget'] },
  { key: 'corners', label: 'Corners', aliases: ['woncorners', 'corners'] },
  { key: 'saves', label: 'Saves', aliases: ['saves'] },
  { key: 'fouls', label: 'Fouls', aliases: ['foulscommitted', 'fouls'] },
  { key: 'yellowCards', label: 'Yellow Cards', aliases: ['yellowcards'] },
];

function getSummary(match: MatchRow): EspnSummaryPayload {
  return (match.espn_summary ?? {}) as EspnSummaryPayload;
}

function normalizeStatName(value?: string | null) {
  return (value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function parseStatNumber(value?: string | null) {
  if (!value) return null;
  const match = value.match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function getStatValue(summary: EspnSummaryPayload, side: 'home' | 'away', aliases: string[]) {
  const stats = summary.teams?.[side]?.statistics ?? [];
  const normalizedAliases = aliases.map(normalizeStatName);
  return stats.find((stat) => {
    const keys = [stat.name, stat.label].map(normalizeStatName);
    return keys.some((key) => normalizedAliases.includes(key));
  })?.value ?? null;
}

function getParticipantName(event: EspnSummaryKeyEvent, type: string) {
  const normalizedType = type.toLowerCase();
  return event.participants?.find((participant) => participant.type?.toLowerCase().includes(normalizedType))?.name ?? null;
}

function isGoalEvent(event: EspnSummaryKeyEvent) {
  const text = `${event.type ?? ''} ${event.typeText ?? ''} ${event.text ?? ''}`.toLowerCase();
  return event.scoringPlay || text.includes('goal');
}

function getEventTeamId(event: EspnSummaryKeyEvent, match: MatchRow) {
  const side = event.team?.side?.toLowerCase();
  if (side === 'home') return match.home_team_id;
  if (side === 'away') return match.away_team_id;
  const eventId = event.team?.id;
  if (eventId === match.home_team_id || event.team?.abbreviation === match.home_team_id) return match.home_team_id;
  if (eventId === match.away_team_id || event.team?.abbreviation === match.away_team_id) return match.away_team_id;
  return null;
}

function buildTopScorers(matches: MatchRow[], teams: Map<string, TeamRow>): TopScorerRow[] {
  const rows = new Map<string, TopScorerRow>();

  matches.forEach((match) => {
    const summary = getSummary(match);
    (summary.keyEvents ?? []).forEach((event) => {
      if (!isGoalEvent(event)) return;
      const scorer = getParticipantName(event, 'scorer') ?? event.participants?.[0]?.name;
      if (!scorer) return;
      const teamId = getEventTeamId(event, match);
      const teamName = teamId ? teams.get(teamId)?.short_name ?? teams.get(teamId)?.name ?? teamId : event.team?.abbreviation ?? event.team?.name ?? '—';
      const key = `${scorer}|${teamId ?? teamName}`;
      const current = rows.get(key) ?? { name: scorer, teamId, teamName, goals: 0, assists: 0, latestMinute: '—' };
      const assist = getParticipantName(event, 'assist') ?? event.participants?.[1]?.name ?? event.text?.match(/Assisted by ([^.]+)\./i)?.[1] ?? null;
      current.goals += 1;
      current.assists += assist && assist !== scorer ? 1 : 0;
      current.latestMinute = event.clock ?? current.latestMinute;
      rows.set(key, current);
    });
  });

  return Array.from(rows.values())
    .sort((first, second) => second.goals - first.goals || second.assists - first.assists || first.name.localeCompare(second.name))
    .slice(0, 10);
}

function buildTeamStats(matches: MatchRow[], teams: Map<string, TeamRow>): TeamStatRow[] {
  const rows = new Map<string, TeamStatRow>();

  matches.forEach((match) => {
    const summary = getSummary(match);
    (['home', 'away'] as const).forEach((side) => {
      const teamId = side === 'home' ? match.home_team_id : match.away_team_id;
      const team = teams.get(teamId);
      teamStatDefinitions.forEach((definition) => {
        const value = parseStatNumber(getStatValue(summary, side, definition.aliases));
        if (value === null) return;
        const key = `${teamId}|${definition.key}`;
        const current = rows.get(key) ?? {
          teamId,
          teamName: team?.short_name ?? team?.name ?? teamId,
          statKey: definition.key,
          label: definition.label,
          total: 0,
          matches: 0,
        };
        current.total += value;
        current.matches += 1;
        rows.set(key, current);
      });
    });
  });

  return Array.from(rows.values())
    .sort((first, second) => second.total - first.total || first.teamName.localeCompare(second.teamName))
    .slice(0, 12);
}

function TeamFlag({ team }: { team?: TeamRow }) {
  const Flag = getTeamFlag(team?.country_code, team?.short_name);
  if (!Flag) return <span className="font-black text-[10px]">{team?.short_name?.slice(0, 2) ?? '—'}</span>;
  return <Flag className="w-full h-full object-cover" title={team?.name} />;
}

export default function Statistics({ themeControls }: StatisticsProps) {
  const { t } = useTranslation();
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [teamMap, setTeamMap] = useState<Map<string, TeamRow>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([listMatchesWithSummaries(), listTeams(), getTeamMap()])
      .then(([nextMatches, nextTeams, nextTeamMap]) => {
        if (!active) return;
        setMatches(nextMatches);
        setTeams(nextTeams);
        setTeamMap(nextTeamMap);
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
  const topScorers = useMemo(() => buildTopScorers(completedMatches, teamMap), [completedMatches, teamMap]);
  const teamStats = useMemo(() => buildTeamStats(completedMatches, teamMap), [completedMatches, teamMap]);
  const summaryMatches = matches.filter((match) => match.espn_summary_updated_at).length;

  return (
    <AppShell themeControls={themeControls}>
      <div className="relative z-10 flex flex-col p-3 sm:p-4 lg:p-6 gap-3 lg:gap-6 min-h-0">
        <div className="bg-card border-4 border-main p-3 sm:p-4 lg:p-6 flex flex-col w-full xl:w-1/2 shadow-[6px_6px_0_0_var(--color-shadow)] lg:shadow-[8px_8px_0_0_var(--color-shadow)]">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-1 text-main leading-none">
            {t('appPages.statistics.title')}
          </h1>
          <p className="font-bold text-xs sm:text-sm text-subtle uppercase leading-snug max-w-2xl">
            {t('appPages.statistics.description')}
          </p>
        </div>

        <div className="bg-card border-4 border-main p-3 sm:p-4 lg:p-6 flex flex-col gap-3 lg:gap-6 shadow-[6px_6px_0_0_var(--color-shadow)] lg:shadow-[8px_8px_0_0_var(--color-shadow)] rounded-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 border-b-4 border-main">
            <div className="flex items-center gap-3 sm:gap-4 sm:border-r-4 border-b-4 sm:border-b-0 border-main p-3 sm:p-4 lg:p-5 bg-c1 text-main min-w-0">
              <ListOrdered size={30} className="shrink-0" strokeWidth={2.5} />
              <div className="min-w-0">
                <div className="text-[10px] sm:text-xs uppercase font-black tracking-widest leading-none mb-1 truncate">{t('appPages.statistics.groupsTracked')}</div>
                <div className="text-2xl sm:text-3xl font-black leading-none">{groups.length}</div>
                <div className="text-[9px] sm:text-[10px] font-bold uppercase mt-1 truncate">{t('ui.groupStandings')}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 sm:border-r-4 border-b-4 sm:border-b-0 border-main p-3 sm:p-4 lg:p-5 bg-c2 text-inv min-w-0">
              <Goal size={30} className="shrink-0" strokeWidth={2.5} />
              <div className="min-w-0">
                <div className="text-[10px] sm:text-xs uppercase font-black tracking-widest leading-none mb-1 truncate">{t('appPages.statistics.topScorers')}</div>
                <div className="text-2xl sm:text-3xl font-black leading-none">{topScorers.length}</div>
                <div className="text-[9px] sm:text-[10px] font-bold uppercase mt-1 truncate">{t('appPages.statistics.fromKeyEvents')}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 border-main p-3 sm:p-4 lg:p-5 bg-c3 text-main min-w-0">
              <BarChart3 size={30} className="shrink-0" strokeWidth={2.5} />
              <div className="min-w-0">
                <div className="text-[10px] sm:text-xs uppercase font-black tracking-widest leading-none mb-1 truncate">{t('appPages.statistics.espnSummaries')}</div>
                <div className="text-2xl sm:text-3xl font-black leading-none">{summaryMatches}</div>
                <div className="text-[9px] sm:text-[10px] font-bold uppercase mt-1 truncate">{t('ui.matchStats')}</div>
              </div>
            </div>
          </div>

          {loading && <div className="p-6 bg-card font-black uppercase text-sm border-b-4 border-main">{t('ui.loading')}</div>}
          {error && <div className="p-6 bg-c5 text-main font-black uppercase text-sm border-b-4 border-main">{error}</div>}

          {!loading && !error && (
            <div className="flex flex-col xl:flex-row flex-1">
              <div className="flex-1 border-r-0 xl:border-r-4 border-main flex flex-col bg-muted min-w-0">
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

              <div className="w-full xl:w-[420px] bg-card flex flex-col">
                <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm border-b-4 border-main flex items-center gap-2">
                  <Trophy size={18} strokeWidth={2.5} /> {t('appPages.statistics.topScorers')}
                </div>
                <div className="border-b-4 border-main">
                  {topScorers.map((row, index) => {
                    const team = row.teamId ? teamMap.get(row.teamId) : undefined;
                    return (
                      <div key={`${row.name}-${row.teamName}`} className="grid grid-cols-[38px_1fr_auto] items-center gap-3 p-3 border-b-2 border-line last:border-b-0 bg-card min-w-0">
                        <div className="font-black text-lg text-c2">#{index + 1}</div>
                        <div className="min-w-0">
                          <div className="font-black uppercase text-sm truncate">{row.name}</div>
                          <div className="font-bold uppercase text-[10px] text-subtle flex items-center gap-1.5 min-w-0">
                            <span className="w-5 h-4 border border-main rounded-sm overflow-hidden bg-muted shrink-0 flex items-center justify-center"><TeamFlag team={team} /></span>
                            <span className="truncate">{row.teamName}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-lg leading-none">{row.goals}</div>
                          <div className="font-black uppercase text-[9px] text-subtle">{t('appPages.statistics.goals')}</div>
                        </div>
                      </div>
                    );
                  })}
                  {topScorers.length === 0 && <div className="p-4 font-black uppercase text-xs text-subtle">{t('appPages.statistics.noTopScorers')}</div>}
                </div>

                <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm border-b-4 border-main flex items-center gap-2">
                  <Shield size={18} strokeWidth={2.5} /> {t('appPages.statistics.teamStats')}
                </div>
                <div className="flex flex-col flex-1">
                  {teamStats.map((row) => {
                    const team = teamMap.get(row.teamId);
                    return (
                      <div key={`${row.teamId}-${row.statKey}`} className="grid grid-cols-[1fr_auto] gap-3 p-3 border-b-2 border-line bg-card min-w-0">
                        <div className="min-w-0">
                          <div className="font-black uppercase text-sm flex items-center gap-2 min-w-0">
                            <span className="w-6 h-4 border border-main rounded-sm overflow-hidden bg-muted shrink-0 flex items-center justify-center"><TeamFlag team={team} /></span>
                            <span className="truncate">{row.teamName}</span>
                          </div>
                          <div className="font-bold uppercase text-[10px] text-subtle truncate">{row.label} · {t('appPages.statistics.matchesSampled', { count: row.matches })}</div>
                        </div>
                        <div className="font-black text-lg">{row.total}</div>
                      </div>
                    );
                  })}
                  {teamStats.length === 0 && <div className="p-4 font-black uppercase text-xs text-subtle">{t('appPages.statistics.noTeamStats')}</div>}
                </div>
              </div>
            </div>
          )}

          <div className="border-t-4 border-main bg-c1 text-main p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="font-black uppercase text-xs sm:text-sm flex items-center gap-2"><Users size={18} strokeWidth={2.5} /> {t('appPages.statistics.phaseOneNote')}</div>
            <Link to="/matches" className="border-2 border-main bg-card px-3 py-2 font-black uppercase text-xs shadow-[3px_3px_0_var(--color-shadow)] hover:bg-muted text-center">
              {t('ui.backToMatches')}
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
