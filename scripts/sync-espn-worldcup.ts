import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import type { Database, Json } from '../src/types/supabase';

type MatchRow = Database['public']['Tables']['matches']['Row'];
type MatchUpdate = Database['public']['Tables']['matches']['Update'];
type TeamRow = Database['public']['Tables']['teams']['Row'];
type JsonRecord = Record<string, unknown>;

type EspnScoreboard = {
  events?: EspnEvent[];
};

type EspnEvent = {
  id: string;
  date: string;
  status?: {
    displayClock?: string;
    type?: {
      name?: string;
      state?: string;
      completed?: boolean;
      detail?: string;
      shortDetail?: string;
    };
  };
  competitions?: EspnCompetition[];
};

type EspnCompetition = {
  id: string;
  attendance?: number;
  playByPlayAvailable?: boolean;
  competitors?: EspnCompetitor[];
  odds?: unknown[];
  pickcenter?: unknown;
};

type EspnCompetitor = {
  homeAway?: 'home' | 'away';
  score?: string;
  winner?: boolean;
  records?: { summary?: string; displayValue?: string }[];
  team?: {
    id?: string;
    displayName?: string;
    name?: string;
    shortDisplayName?: string;
    abbreviation?: string;
    logo?: string;
    logos?: { href?: string }[];
    color?: string;
    alternateColor?: string;
  };
};

type EspnPredictionSignal = {
  home: number;
  draw: number;
  away: number;
};

type EspnCandidate = {
  eventId: string;
  competitionId: string | null;
  kickoffAt: string;
  status: string | null;
  statusDetail: string | null;
  displayClock: string | null;
  state: string | null;
  completed: boolean;
  playByPlayAvailable: boolean | null;
  attendance: number | null;
  homeScore: number | null;
  awayScore: number | null;
  homeWinner: boolean | null;
  awayWinner: boolean | null;
  homeLogo: string | null;
  awayLogo: string | null;
  homeColor: string | null;
  awayColor: string | null;
  homeRecord: string | null;
  awayRecord: string | null;
  predictionSignal: EspnPredictionSignal | null;
  homeKeys: Set<string>;
  awayKeys: Set<string>;
  homeLabel: string;
  awayLabel: string;
};

type MatchUpdatePlan = {
  match: MatchRow;
  candidate: EspnCandidate;
  confidence: number;
  reasons: string[];
  update: MatchUpdate;
};

const ESPN_BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';
const ESPN_SUMMARY_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary';
const ESPN_CORE_BASE_URL = 'https://sports.core.api.espn.com/v2/sports/soccer/leagues/fifa.world';
const args = process.argv.slice(2);
const shouldApply = args.includes('--apply');
const dateArg = getArgValue('--date');
const sqlOutputPath = getArgValue('--sql-out');

const fifaAliases: Record<string, string[]> = {
  BIH: ['bosnia-herzegovina', 'bosnia-and-herzegovina'],
  CIV: ['cote-divoire', 'cote-d-ivoire', 'ivory-coast'],
  COD: ['congo-dr', 'dr-congo', 'drc'],
  CPV: ['cabo-verde', 'cape-verde'],
  CZE: ['czechia', 'czech-republic'],
  ENG: ['england'],
  IRN: ['ir-iran', 'iran'],
  KOR: ['korea-republic', 'south-korea'],
  NED: ['netherlands', 'holland'],
  RSA: ['south-africa'],
  SCO: ['scotland'],
  SUI: ['switzerland'],
  TUR: ['turkiye', 'turkey'],
  USA: ['usa', 'united-states', 'united-states-of-america'],
};

const neutralTextBlocklist = [
  'bet',
  'betting',
  'odds',
  'sportsbook',
  'wager',
  'moneyline',
  'money line',
  'spread',
  'over/under',
  'over under',
  'pickcenter',
  'disclaimer',
];

function getArgValue(name: string) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function normalize(value?: string | null) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function teamKeysFromValues(values: (string | null | undefined)[]) {
  return new Set(values.map(normalize).filter(Boolean));
}

function matchTeamKeys(match: MatchRow, teamMap: Map<string, TeamRow>, side: 'home' | 'away') {
  const teamId = side === 'home' ? match.home_team_id : match.away_team_id;
  const team = teamMap.get(teamId);
  const baseKeys = teamKeysFromValues([teamId, team?.short_name, team?.name, team?.country_code]);

  for (const alias of fifaAliases[(team?.short_name ?? team?.country_code ?? '').toUpperCase()] ?? []) {
    baseKeys.add(alias);
  }

  return baseKeys;
}

function keysOverlap(left: Set<string>, right: Set<string>) {
  for (const value of left) {
    if (right.has(value)) return true;
  }
  return false;
}

function parseScore(value?: string) {
  if (value === undefined || value === '') return null;
  const score = Number(value);
  return Number.isFinite(score) ? score : null;
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function textValue(value: unknown) {
  if (typeof value === 'string') return value.trim() || null;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
}

function neutralText(value: unknown) {
  const text = textValue(value);
  if (!text) return null;
  const normalized = text.toLowerCase();
  return neutralTextBlocklist.some((term) => normalized.includes(term)) ? null : text;
}

function numberValue(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^0-9+.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function getPath(source: unknown, pathParts: string[]) {
  let current = source;
  for (const part of pathParts) {
    if (!isRecord(current)) return undefined;
    current = current[part];
  }
  return current;
}

function getFirstNumber(source: unknown, paths: string[][]) {
  for (const pathParts of paths) {
    const value = numberValue(getPath(source, pathParts));
    if (value !== null) return value;
  }
  return null;
}

function americanToProbability(value: number) {
  if (value === 0) return null;
  if (value > 0) return 100 / (value + 100);
  const absolute = Math.abs(value);
  return absolute / (absolute + 100);
}

function valuesToSignal(homeValue: number, drawValue: number, awayValue: number): EspnPredictionSignal | null {
  const values = [homeValue, drawValue, awayValue];
  let probabilities: number[];

  if (values.every((value) => value > 0 && value <= 1)) {
    probabilities = values;
  } else if (values.every((value) => value > 0 && value <= 100) && values.reduce((sum, value) => sum + value, 0) <= 105) {
    probabilities = values.map((value) => value / 100);
  } else {
    const converted = values.map(americanToProbability);
    if (converted.some((value) => value === null)) return null;
    probabilities = converted as number[];
  }

  const total = probabilities.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return null;

  const home = Math.round((probabilities[0] / total) * 100);
  const draw = Math.round((probabilities[1] / total) * 100);
  const away = Math.max(0, 100 - home - draw);

  return { home, draw, away };
}

function signalFromSource(source: unknown) {
  const homeValue = getFirstNumber(source, [
    ['homeTeamChance'],
    ['homeWinPercentage'],
    ['homeWinPercent'],
    ['homeTeamOdds', 'moneyLine'],
    ['homeTeamOdds', 'moneyline'],
    ['homeTeamOdds', 'current', 'moneyLine'],
    ['homeTeamOdds', 'current', 'moneyline'],
  ]);
  const drawValue = getFirstNumber(source, [
    ['drawChance'],
    ['drawPercentage'],
    ['drawPercent'],
    ['drawOdds', 'moneyLine'],
    ['drawOdds', 'moneyline'],
    ['drawOdds', 'current', 'moneyLine'],
    ['drawOdds', 'current', 'moneyline'],
  ]);
  const awayValue = getFirstNumber(source, [
    ['awayTeamChance'],
    ['awayWinPercentage'],
    ['awayWinPercent'],
    ['awayTeamOdds', 'moneyLine'],
    ['awayTeamOdds', 'moneyline'],
    ['awayTeamOdds', 'current', 'moneyLine'],
    ['awayTeamOdds', 'current', 'moneyline'],
  ]);

  if (homeValue === null || drawValue === null || awayValue === null) return null;
  return valuesToSignal(homeValue, drawValue, awayValue);
}

function buildPredictionSignal(competition: EspnCompetition) {
  const sources = [...toArray(competition.odds), competition.pickcenter];

  for (const source of sources) {
    const signal = signalFromSource(source);
    if (signal) return signal;
  }

  return null;
}

function getTeamLogo(competitor?: EspnCompetitor) {
  return competitor?.team?.logo ?? competitor?.team?.logos?.find((logo) => logo.href)?.href ?? null;
}

function getTeamRecord(competitor?: EspnCompetitor) {
  return competitor?.records?.find((record) => record.summary || record.displayValue)?.summary ?? competitor?.records?.find((record) => record.displayValue)?.displayValue ?? null;
}

function mapEspnStatus(candidate: EspnCandidate): MatchUpdate['status'] | undefined {
  const status = normalize(candidate.status);
  const state = normalize(candidate.state);
  if (candidate.completed || state === 'post') return 'finished';
  if (state === 'in') return 'live';
  if (status.includes('postponed')) return 'postponed';
  if (status.includes('cancel')) return 'cancelled';
  return undefined;
}

function getSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl) throw new Error('Set SUPABASE_URL or VITE_SUPABASE_URL.');
  if (shouldApply && !serviceRoleKey) throw new Error('Set SUPABASE_SERVICE_ROLE_KEY before running with --apply.');

  return createClient<Database>(supabaseUrl, shouldApply ? serviceRoleKey! : publishableKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function fetchScoreboard() {
  const url = dateArg ? `${ESPN_BASE_URL}?dates=${dateArg}` : ESPN_BASE_URL;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`ESPN scoreboard request failed: ${response.status} ${response.statusText}`);
  return response.json() as Promise<EspnScoreboard>;
}

async function fetchSummary(eventId: string) {
  const response = await fetch(`${ESPN_SUMMARY_URL}?event=${eventId}`);
  if (!response.ok) throw new Error(`ESPN summary request failed for ${eventId}: ${response.status} ${response.statusText}`);
  return response.json() as Promise<unknown>;
}

async function fetchCompetitionOdds(eventId: string, competitionId: string) {
  const response = await fetch(`${ESPN_CORE_BASE_URL}/events/${eventId}/competitions/${competitionId}/odds`);
  if (!response.ok) throw new Error(`ESPN odds request failed for ${eventId}: ${response.status} ${response.statusText}`);
  return response.json() as Promise<{ items?: unknown[] }>;
}

function buildCandidates(scoreboard: EspnScoreboard) {
  return (scoreboard.events ?? []).flatMap((event): EspnCandidate[] => {
    return (event.competitions ?? []).map((competition) => {
      const home = competition.competitors?.find((competitor) => competitor.homeAway === 'home');
      const away = competition.competitors?.find((competitor) => competitor.homeAway === 'away');
      const statusType = event.status?.type;

      return {
        eventId: event.id,
        competitionId: competition.id ?? null,
        kickoffAt: event.date,
        status: statusType?.name ?? null,
        statusDetail: statusType?.detail ?? statusType?.shortDetail ?? null,
        displayClock: event.status?.displayClock ?? null,
        state: statusType?.state ?? null,
        completed: Boolean(statusType?.completed),
        playByPlayAvailable: competition.playByPlayAvailable ?? null,
        attendance: competition.attendance ?? null,
        homeScore: parseScore(home?.score),
        awayScore: parseScore(away?.score),
        homeWinner: home?.winner ?? null,
        awayWinner: away?.winner ?? null,
        homeLogo: getTeamLogo(home),
        awayLogo: getTeamLogo(away),
        homeColor: home?.team?.color ?? home?.team?.alternateColor ?? null,
        awayColor: away?.team?.color ?? away?.team?.alternateColor ?? null,
        homeRecord: getTeamRecord(home),
        awayRecord: getTeamRecord(away),
        predictionSignal: buildPredictionSignal(competition),
        homeKeys: teamKeysFromValues([home?.team?.abbreviation, home?.team?.displayName, home?.team?.name, home?.team?.shortDisplayName]),
        awayKeys: teamKeysFromValues([away?.team?.abbreviation, away?.team?.displayName, away?.team?.name, away?.team?.shortDisplayName]),
        homeLabel: home?.team?.displayName ?? home?.team?.abbreviation ?? 'Unknown home',
        awayLabel: away?.team?.displayName ?? away?.team?.abbreviation ?? 'Unknown away',
      };
    });
  });
}

function scoreCandidate(match: MatchRow, candidate: EspnCandidate, teamMap: Map<string, TeamRow>) {
  const kickoffDeltaMinutes = Math.abs(new Date(match.kickoff_at).getTime() - new Date(candidate.kickoffAt).getTime()) / 60000;
  const sameDay = match.kickoff_at.slice(0, 10) === candidate.kickoffAt.slice(0, 10);
  const homeMatches = keysOverlap(matchTeamKeys(match, teamMap, 'home'), candidate.homeKeys);
  const awayMatches = keysOverlap(matchTeamKeys(match, teamMap, 'away'), candidate.awayKeys);
  const swappedHomeMatches = keysOverlap(matchTeamKeys(match, teamMap, 'home'), candidate.awayKeys);
  const swappedAwayMatches = keysOverlap(matchTeamKeys(match, teamMap, 'away'), candidate.homeKeys);
  const reasons: string[] = [];
  let confidence = 0;

  if (sameDay) {
    confidence += 20;
    reasons.push('same day');
  }

  if (kickoffDeltaMinutes <= 5) {
    confidence += 30;
    reasons.push('kickoff within 5m');
  } else if (kickoffDeltaMinutes <= 90) {
    confidence += 15;
    reasons.push('kickoff within 90m');
  }

  if (homeMatches) {
    confidence += 25;
    reasons.push('home team match');
  }

  if (awayMatches) {
    confidence += 25;
    reasons.push('away team match');
  }

  if (!homeMatches && !awayMatches && swappedHomeMatches && swappedAwayMatches) {
    confidence += 30;
    reasons.push('teams match but sides swapped');
  }

  return { confidence, reasons };
}

function buildUpdatePlan(matches: MatchRow[], candidates: EspnCandidate[], teamMap: Map<string, TeamRow>) {
  const plans: MatchUpdatePlan[] = [];
  const usedEventIds = new Set<string>();

  for (const match of matches) {
    const scoredCandidates = candidates
      .filter((candidate) => !usedEventIds.has(candidate.eventId))
      .map((candidate) => ({ candidate, ...scoreCandidate(match, candidate, teamMap) }))
      .sort((a, b) => b.confidence - a.confidence);
    const best = scoredCandidates[0];

    if (!best || best.confidence < 70) continue;

    usedEventIds.add(best.candidate.eventId);
    const nextStatus = mapEspnStatus(best.candidate);
    const update: MatchUpdate = {
      espn_event_id: best.candidate.eventId,
      espn_competition_id: best.candidate.competitionId,
      espn_status: best.candidate.status,
      espn_status_detail: best.candidate.statusDetail,
      espn_display_clock: best.candidate.displayClock,
      espn_state: best.candidate.state,
      espn_play_by_play_available: best.candidate.playByPlayAvailable,
      espn_attendance: best.candidate.attendance,
      espn_home_winner: best.candidate.homeWinner,
      espn_away_winner: best.candidate.awayWinner,
      espn_home_logo: best.candidate.homeLogo,
      espn_away_logo: best.candidate.awayLogo,
      espn_home_color: best.candidate.homeColor,
      espn_away_color: best.candidate.awayColor,
      espn_home_record: best.candidate.homeRecord,
      espn_away_record: best.candidate.awayRecord,
      espn_updated_at: new Date().toISOString(),
    };

    if (best.candidate.predictionSignal) {
      update.espn_home_win_pct = best.candidate.predictionSignal.home;
      update.espn_draw_pct = best.candidate.predictionSignal.draw;
      update.espn_away_win_pct = best.candidate.predictionSignal.away;
      update.espn_prediction_updated_at = new Date().toISOString();
    }

    if (nextStatus) update.status = nextStatus;
    if (nextStatus === 'live' || nextStatus === 'finished') {
      update.home_score = best.candidate.homeScore;
      update.away_score = best.candidate.awayScore;
      update.result_updated_at = new Date().toISOString();
    }

    plans.push({ match, candidate: best.candidate, confidence: best.confidence, reasons: best.reasons, update });
  }

  return plans;
}

function sanitizeStatistics(value: unknown) {
  return toArray(value).flatMap((stat) => {
    if (!isRecord(stat)) return [];
    const name = neutralText(stat.name);
    const label = neutralText(stat.displayName ?? stat.label ?? stat.shortDisplayName ?? stat.name);
    const statValue = neutralText(stat.displayValue ?? stat.value);
    if (!label || !statValue) return [];
    return [{ name, label, value: statValue }];
  }).slice(0, 28);
}

function sanitizeLeaders(value: unknown, parentLabel?: string | null): JsonRecord[] {
  return toArray(value).flatMap((leader) => {
    if (!isRecord(leader)) return [];
    const groupLabel = neutralText(leader.displayName ?? leader.label ?? leader.name) ?? parentLabel ?? null;
    if (Array.isArray(leader.leaders)) return sanitizeLeaders(leader.leaders, groupLabel);

    const athlete = isRecord(leader.athlete) ? leader.athlete : undefined;
    const name = neutralText(athlete?.displayName ?? leader.displayName ?? leader.name);
    const label = neutralText(leader.label ?? leader.shortDisplayName) ?? groupLabel;
    const leaderValue = neutralText(leader.displayValue ?? leader.value ?? leader.stat);
    if (!name && !label) return [];

    return [{ name, label, value: leaderValue }].filter((entry) => Object.values(entry).some(Boolean));
  }).slice(0, 8);
}

function sanitizeLastFiveGames(value: unknown) {
  return toArray(value).flatMap((game) => {
    if (!isRecord(game)) return [];
    const opponent = isRecord(game.opponent) ? neutralText(game.opponent.displayName ?? game.opponent.abbreviation) : neutralText(game.opponent);
    const result = neutralText(game.gameResult ?? game.result ?? game.displayResult);
    const score = neutralText(game.score ?? game.displayScore);
    const date = neutralText(game.gameDate ?? game.date);
    const entry = { opponent, result, score, date };
    return Object.values(entry).some(Boolean) ? [entry] : [];
  }).slice(0, 5);
}

function sanitizeNews(value: unknown) {
  return toArray(value).flatMap((article) => {
    if (!isRecord(article)) return [];
    const headline = neutralText(article.headline);
    const description = neutralText(article.description);
    const link = isRecord(article.links) && isRecord(article.links.web) ? neutralText(article.links.web.href) : neutralText(article.link ?? article.href);
    const published = neutralText(article.published ?? article.lastModified);

    if (!headline || !link) return [];
    return [{ headline, description, link, published, label: 'ESPN' }];
  }).slice(0, 5);
}

function sanitizeParticipants(value: unknown) {
  return toArray(value).flatMap((participant) => {
    if (!isRecord(participant)) return [];
    const athlete = isRecord(participant.athlete) ? participant.athlete : undefined;
    const type = isRecord(participant.type) ? neutralText(participant.type.displayName ?? participant.type.name) : neutralText(participant.type);
    const name = neutralText(athlete?.displayName ?? participant.displayName ?? participant.name);
    const entry = { name, type };
    return Object.values(entry).some(Boolean) ? [entry] : [];
  }).slice(0, 6);
}

function sanitizeTeamRef(value: unknown) {
  if (!isRecord(value)) return {};
  return {
    id: neutralText(value.id),
    name: neutralText(value.displayName ?? value.name),
    abbreviation: neutralText(value.abbreviation ?? value.shortDisplayName),
    side: neutralText(value.homeAway),
  };
}

function sanitizeKeyEvents(value: unknown) {
  return toArray(value).flatMap((event) => {
    if (!isRecord(event)) return [];
    const type = isRecord(event.type) ? neutralText(event.type.id ?? event.type.name) : neutralText(event.type);
    const typeText = isRecord(event.type) ? neutralText(event.type.text ?? event.type.displayName ?? event.type.name) : neutralText(event.typeText ?? event.displayType);
    const team = sanitizeTeamRef(event.team);
    const entry = {
      id: neutralText(event.id),
      type,
      typeText,
      clock: neutralText(isRecord(event.clock) ? event.clock.displayValue : event.displayClock ?? event.clock),
      period: numberValue(isRecord(event.period) ? event.period.number : event.period),
      team,
      text: neutralText(event.text ?? event.displayText ?? event.shortText),
      participants: sanitizeParticipants(event.participants),
      homeScore: numberValue(event.homeScore),
      awayScore: numberValue(event.awayScore),
      scoringPlay: Boolean(event.scoringPlay),
    };
    return Object.values(entry).some((nextValue) => Array.isArray(nextValue) ? nextValue.length > 0 : Boolean(nextValue)) ? [entry] : [];
  }).slice(0, 60);
}

function sanitizeCommentary(value: unknown) {
  return toArray(value).flatMap((event) => {
    if (!isRecord(event)) return [];
    const text = neutralText(event.text ?? event.displayText ?? event.shortText);
    if (!text) return [];
    const typeText = isRecord(event.type) ? neutralText(event.type.text ?? event.type.displayName ?? event.type.name) : neutralText(event.type);
    return [{
      id: neutralText(event.id),
      typeText,
      clock: neutralText(isRecord(event.clock) ? event.clock.displayValue : event.displayClock ?? event.clock),
      period: numberValue(isRecord(event.period) ? event.period.number : event.period),
      text,
    }];
  }).slice(0, 80);
}

function sanitizeOfficials(value: unknown) {
  return toArray(value).flatMap((official) => {
    if (!isRecord(official)) return [];
    const type = isRecord(official.type) ? official.type : undefined;
    const entry = {
      name: neutralText(official.displayName ?? official.fullName ?? official.name),
      role: neutralText(type?.displayName ?? type?.name ?? official.role),
    };
    return Object.values(entry).some(Boolean) ? [entry] : [];
  }).slice(0, 8);
}

function sanitizeBoxscoreTeams(value: unknown) {
  const teams = toArray(value);
  const entries: [string, JsonRecord][] = [];

  teams.forEach((teamEntry, index) => {
    if (!isRecord(teamEntry)) return;
    const side = textValue(teamEntry.homeAway) ?? (index === 0 ? 'home' : 'away');
    const team = isRecord(teamEntry.team) ? teamEntry.team : undefined;
    const payload = {
      id: neutralText(team?.id),
      name: neutralText(team?.displayName ?? teamEntry.displayName),
      abbreviation: neutralText(team?.abbreviation ?? team?.shortDisplayName),
      statistics: sanitizeStatistics(teamEntry.statistics),
      leaders: sanitizeLeaders(teamEntry.leaders),
      lastFiveGames: sanitizeLastFiveGames(team?.lastFiveGames ?? teamEntry.lastFiveGames),
    };

    if (!Object.values(payload).some((entry) => Array.isArray(entry) ? entry.length > 0 : Boolean(entry))) return;
    entries.push([side === 'away' ? 'away' : 'home', payload]);
  });

  return Object.fromEntries(entries);
}

function sanitizeSummary(summary: unknown): Json | null {
  if (!isRecord(summary)) return null;

  const gameInfo = isRecord(summary.gameInfo) ? summary.gameInfo : undefined;
  const venueSource = isRecord(gameInfo?.venue) ? gameInfo.venue : undefined;
  const address = isRecord(venueSource?.address) ? venueSource.address : undefined;
  const venue = {
    name: neutralText(venueSource?.fullName ?? venueSource?.name),
    city: neutralText(address?.city),
    country: neutralText(address?.country),
  };
  const broadcasts = toArray(summary.broadcasts).flatMap((broadcast) => {
    if (!isRecord(broadcast)) return [];
    const names = toArray(broadcast.names).map(neutralText).filter(Boolean);
    const name = neutralText(broadcast.name ?? broadcast.shortName);
    return [...names, name].filter(Boolean) as string[];
  }).slice(0, 8);
  const boxscore = isRecord(summary.boxscore) ? summary.boxscore : undefined;
  const teams = sanitizeBoxscoreTeams(boxscore?.teams);
  const leaders = sanitizeLeaders(summary.leaders ?? boxscore?.leaders);
  const news = isRecord(summary.news) ? sanitizeNews(summary.news.articles) : [];
  const keyEvents = sanitizeKeyEvents(summary.keyEvents);
  const commentary = sanitizeCommentary(summary.commentary);
  const officials = sanitizeOfficials(gameInfo?.officials);
  const attendance = numberValue(gameInfo?.attendance ?? summary.attendance);

  const payload: JsonRecord = {};
  if (Object.values(venue).some(Boolean)) payload.venue = venue;
  if (attendance !== null) payload.attendance = attendance;
  if (officials.length) payload.officials = officials;
  if (broadcasts.length) payload.broadcasts = [...new Set(broadcasts)];
  if (Object.keys(teams).length) payload.teams = teams;
  if (leaders.length) payload.leaders = leaders;
  if (keyEvents.length) payload.keyEvents = keyEvents;
  if (commentary.length) payload.commentary = commentary;
  if (news.length) payload.news = news;

  return Object.keys(payload).length ? payload as Json : null;
}

async function enrichPlansWithOdds(plans: MatchUpdatePlan[]) {
  await Promise.all(plans.map(async (plan) => {
    if (plan.candidate.predictionSignal || !plan.candidate.competitionId) return;

    try {
      const odds = await fetchCompetitionOdds(plan.candidate.eventId, plan.candidate.competitionId);
      for (const source of odds.items ?? []) {
        const signal = signalFromSource(source);
        if (!signal) continue;

        plan.candidate.predictionSignal = signal;
        plan.update.espn_home_win_pct = signal.home;
        plan.update.espn_draw_pct = signal.draw;
        plan.update.espn_away_win_pct = signal.away;
        plan.update.espn_prediction_updated_at = new Date().toISOString();
        return;
      }
    } catch (error) {
      console.warn(`Skipping ESPN odds for ${plan.candidate.eventId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }));
}

async function enrichPlansWithSummaries(plans: MatchUpdatePlan[]) {
  await Promise.all(plans.map(async (plan) => {
    try {
      const summary = await fetchSummary(plan.candidate.eventId);
      const sanitized = sanitizeSummary(summary);
      if (!sanitized) return;
      plan.update.espn_summary = sanitized;
      plan.update.espn_summary_updated_at = new Date().toISOString();
    } catch (error) {
      console.warn(`Skipping ESPN summary for ${plan.candidate.eventId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }));
}

async function loadSupabaseData() {
  const supabase = getSupabase();
  const [matchesResult, teamsResult] = await Promise.all([
    supabase.from('matches').select('*').like('id', 'wc2026-%').order('kickoff_at', { ascending: true }),
    supabase.from('teams').select('*'),
  ]);

  if (matchesResult.error) throw matchesResult.error;
  if (teamsResult.error) throw teamsResult.error;

  return {
    supabase,
    matches: matchesResult.data,
    teamMap: new Map(teamsResult.data.map((team) => [team.id, team])),
  };
}

function sqlValue(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
  return `'${String(value).replace(/'/g, "''")}'`;
}

function buildUpdateSql(plans: MatchUpdatePlan[]) {
  const statements = plans.map((plan) => {
    const updates = Object.entries(plan.update)
      .filter(([, value]) => value !== undefined)
      .map(([column, value]) => `  ${column} = ${sqlValue(value)}`)
      .join(',\n');

    return `update public.matches\nset\n${updates}\nwhere id = ${sqlValue(plan.match.id)};`;
  });

  return ['begin;', ...statements, 'commit;', ''].join('\n\n');
}

async function applyPlans(plans: MatchUpdatePlan[]) {
  const supabase = getSupabase();

  for (const plan of plans) {
    const { error } = await supabase
      .from('matches')
      .update(plan.update)
      .eq('id', plan.match.id);

    if (error) throw error;
  }
}

async function main() {
  const [scoreboard, { matches, teamMap }] = await Promise.all([fetchScoreboard(), loadSupabaseData()]);
  const candidates = buildCandidates(scoreboard);
  const plans = buildUpdatePlan(matches, candidates, teamMap);
  await enrichPlansWithOdds(plans);
  await enrichPlansWithSummaries(plans);
  const unmatchedCandidates = candidates.filter((candidate) => !plans.some((plan) => plan.candidate.eventId === candidate.eventId));

  console.log(`ESPN events found: ${candidates.length}`);
  console.log(`Supabase World Cup matches loaded: ${matches.length}`);
  console.log(`Matched updates: ${plans.length}`);

  for (const plan of plans) {
    console.log(`${plan.match.id}: ${plan.match.home_team_id} vs ${plan.match.away_team_id} <= ESPN ${plan.candidate.eventId} ${plan.candidate.homeLabel} vs ${plan.candidate.awayLabel} (${plan.confidence}; ${plan.reasons.join(', ')})`);
    console.log(`  status=${plan.candidate.status ?? 'unknown'} detail=${plan.candidate.statusDetail ?? 'none'} score=${plan.candidate.homeScore ?? '-'}-${plan.candidate.awayScore ?? '-'} signal=${plan.candidate.predictionSignal ? `${plan.candidate.predictionSignal.home}/${plan.candidate.predictionSignal.draw}/${plan.candidate.predictionSignal.away}` : 'none'}`);
  }

  if (unmatchedCandidates.length) {
    console.log(`Unmatched ESPN events: ${unmatchedCandidates.map((candidate) => `${candidate.eventId}:${candidate.homeLabel} vs ${candidate.awayLabel}`).join('; ')}`);
  }

  if (sqlOutputPath) {
    await writeFile(path.resolve(process.cwd(), sqlOutputPath), buildUpdateSql(plans));
    console.log(`SQL update file written to ${sqlOutputPath}`);
  }

  if (!shouldApply) {
    console.log('Dry run only. Re-run with --apply and SUPABASE_SERVICE_ROLE_KEY to update Supabase matches.');
    return;
  }

  await applyPlans(plans);
  console.log(`Applied ${plans.length} ESPN match updates.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
