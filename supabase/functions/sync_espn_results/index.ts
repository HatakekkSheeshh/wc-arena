import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { refreshLeagueLeaderboards } from '../_shared/leagueLeaderboards.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-sync-secret',
};
const ESPN_BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';
const ESPN_SUMMARY_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary';
const ESPN_CORE_BASE_URL = 'https://sports.core.api.espn.com/v2/sports/soccer/leagues/fifa.world';

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

type PredictionOutcome = 'home' | 'draw' | 'away';
type PredictionType = 'exact_score' | 'outcome_only';
type ScoreOutcome = 'exact' | 'correct' | 'missed';
type Score = { home_score: number; away_score: number };
type TeamRow = { id: string; name: string; short_name: string; country_code: string };
type MatchRow = {
  id: string;
  home_team_id: string;
  away_team_id: string;
  kickoff_at: string;
  lock_at: string;
  status: 'scheduled' | 'open' | 'locked' | 'live' | 'finished' | 'postponed' | 'cancelled';
  home_score: number | null;
  away_score: number | null;
  espn_home_win_pct: number | null;
  espn_draw_pct: number | null;
  espn_away_win_pct: number | null;
  espn_summary_updated_at: string | null;
};
type JsonRecord = Record<string, unknown>;
type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
type MatchUpdate = Partial<{
  status: MatchRow['status'];
  home_score: number | null;
  away_score: number | null;
  result_updated_at: string;
  espn_event_id: string;
  espn_competition_id: string | null;
  espn_status: string | null;
  espn_status_detail: string | null;
  espn_display_clock: string | null;
  espn_state: string | null;
  espn_play_by_play_available: boolean | null;
  espn_attendance: number | null;
  espn_home_winner: boolean | null;
  espn_away_winner: boolean | null;
  espn_home_logo: string | null;
  espn_away_logo: string | null;
  espn_home_color: string | null;
  espn_away_color: string | null;
  espn_home_record: string | null;
  espn_away_record: string | null;
  espn_home_win_pct: number | null;
  espn_draw_pct: number | null;
  espn_away_win_pct: number | null;
  espn_prediction_updated_at: string;
  espn_summary: Json | null;
  espn_summary_updated_at: string;
  espn_updated_at: string;
}>;
type EspnScoreboard = { events?: EspnEvent[] };
type EspnEvent = {
  id: string;
  date: string;
  status?: { displayClock?: string; type?: { name?: string; state?: string; completed?: boolean; detail?: string; shortDetail?: string } };
  competitions?: EspnCompetition[];
};
type EspnCompetition = { id?: string; attendance?: number; playByPlayAvailable?: boolean; competitors?: EspnCompetitor[] };
type EspnPredictionSignal = { home: number; draw: number; away: number };

type EspnCompetitor = {
  homeAway?: 'home' | 'away';
  score?: string;
  winner?: boolean;
  records?: { summary?: string; displayValue?: string }[];
  team?: { displayName?: string; name?: string; shortDisplayName?: string; abbreviation?: string; logo?: string; logos?: { href?: string }[]; color?: string; alternateColor?: string };
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
type PredictionRow = {
  id: string;
  user_id: string;
  prediction_type: PredictionType | null;
  home_score: number | null;
  away_score: number | null;
  predicted_outcome: PredictionOutcome | null;
  is_risk_pick: boolean;
  matches: Score & { kickoff_at: string };
};
type CalculatedScore = {
  prediction_id: string;
  user_id: string;
  match_kickoff_at: string;
  outcome: ScoreOutcome;
  exact_score: number;
  correct_outcome: number;
  goal_difference_bonus: number;
  team_score_bonus: number;
  streak_bonus: number;
  risk_multiplier: number;
  underdog_bonus: number;
  total: number;
  scoring_version: string;
  calculated_at: string;
};

type UserAggregate = {
  userId: string;
  predictionPoints: number;
  rewardPoints: number;
  points: number;
  exactScores: number;
  accuracy: number;
  currentStreak: number;
  bestStreak: number;
  rank: number;
};

type DailyRewardRow = {
  user_id: string;
  points_awarded: number;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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

function getTeamLogo(competitor?: EspnCompetitor) {
  return competitor?.team?.logo ?? competitor?.team?.logos?.find((logo) => logo.href)?.href ?? null;
}

function getTeamRecord(competitor?: EspnCompetitor) {
  return competitor?.records?.find((record) => record.summary || record.displayValue)?.summary ?? competitor?.records?.find((record) => record.displayValue)?.displayValue ?? null;
}

function mapEspnStatus(candidate: EspnCandidate): MatchRow['status'] | undefined {
  const status = normalize(candidate.status);
  const state = normalize(candidate.state);
  if (candidate.completed || state === 'post') return 'finished';
  if (state === 'in') return 'live';
  if (status.includes('postponed')) return 'postponed';
  if (status.includes('cancel')) return 'cancelled';
  return undefined;
}

function formatEspnDate(date: Date) {
  return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, '0')}${String(date.getUTCDate()).padStart(2, '0')}`;
}

function clampDayWindow(value: unknown, fallback: number, min: number, max: number) {
  return typeof value === 'number' && Number.isInteger(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

function getDateWindow(body?: { dates?: unknown; daysBack?: unknown; daysForward?: unknown }, base = new Date()) {
  if (Array.isArray(body?.dates)) {
    const dates = body.dates.filter((date): date is string => typeof date === 'string' && /^\d{8}$/.test(date));
    if (dates.length) return [...new Set(dates)].slice(0, 14);
  }

  const daysBack = clampDayWindow(body?.daysBack, 1, 0, 7);
  const daysForward = clampDayWindow(body?.daysForward, 7, 0, 14);
  const dates: string[] = [];

  for (let offset = -daysBack; offset <= daysForward; offset += 1) {
    const next = new Date(base);
    next.setUTCDate(next.getUTCDate() + offset);
    dates.push(formatEspnDate(next));
  }

  return dates;
}

async function fetchScoreboard(date: string) {
  const response = await fetch(`${ESPN_BASE_URL}?dates=${date}`);
  if (!response.ok) throw new Error(`ESPN scoreboard request failed: ${response.status} ${response.statusText}`);
  return response.json() as Promise<EspnScoreboard>;
}

async function fetchCompetitionOdds(eventId: string, competitionId: string) {
  const response = await fetch(`${ESPN_CORE_BASE_URL}/events/${eventId}/competitions/${competitionId}/odds`);
  if (!response.ok) throw new Error(`ESPN odds request failed for ${eventId}: ${response.status} ${response.statusText}`);
  return response.json() as Promise<{ items?: unknown[] }>;
}

async function fetchSummary(eventId: string) {
  const response = await fetch(`${ESPN_SUMMARY_URL}?event=${eventId}`);
  if (!response.ok) throw new Error(`ESPN summary request failed for ${eventId}: ${response.status} ${response.statusText}`);
  return response.json() as Promise<unknown>;
}

function buildCandidates(scoreboards: EspnScoreboard[]) {
  return scoreboards.flatMap((scoreboard) => (scoreboard.events ?? []).flatMap((event): EspnCandidate[] => {
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
        predictionSignal: null,
        homeKeys: teamKeysFromValues([home?.team?.abbreviation, home?.team?.displayName, home?.team?.name, home?.team?.shortDisplayName]),
        awayKeys: teamKeysFromValues([away?.team?.abbreviation, away?.team?.displayName, away?.team?.name, away?.team?.shortDisplayName]),
        homeLabel: home?.team?.displayName ?? home?.team?.abbreviation ?? 'Unknown home',
        awayLabel: away?.team?.displayName ?? away?.team?.abbreviation ?? 'Unknown away',
      };
    });
  }));
}

function scoreCandidate(match: MatchRow, candidate: EspnCandidate, teamMap: Map<string, TeamRow>) {
  const kickoffDeltaMinutes = Math.abs(new Date(match.kickoff_at).getTime() - new Date(candidate.kickoffAt).getTime()) / 60000;
  const sameDay = match.kickoff_at.slice(0, 10) === candidate.kickoffAt.slice(0, 10);
  const homeMatches = keysOverlap(matchTeamKeys(match, teamMap, 'home'), candidate.homeKeys);
  const awayMatches = keysOverlap(matchTeamKeys(match, teamMap, 'away'), candidate.awayKeys);
  const swappedHomeMatches = keysOverlap(matchTeamKeys(match, teamMap, 'home'), candidate.awayKeys);
  const swappedAwayMatches = keysOverlap(matchTeamKeys(match, teamMap, 'away'), candidate.homeKeys);
  let confidence = 0;

  if (sameDay) confidence += 20;
  if (kickoffDeltaMinutes <= 5) confidence += 30;
  else if (kickoffDeltaMinutes <= 90) confidence += 15;
  if (homeMatches) confidence += 25;
  if (awayMatches) confidence += 25;
  if (!homeMatches && !awayMatches && swappedHomeMatches && swappedAwayMatches) confidence += 30;

  return confidence;
}

async function enrichCandidatesWithOdds(candidates: EspnCandidate[]) {
  await Promise.all(candidates.map(async (candidate) => {
    if (!candidate.competitionId) return;

    try {
      const odds = await fetchCompetitionOdds(candidate.eventId, candidate.competitionId);
      for (const source of odds.items ?? []) {
        const signal = signalFromSource(source);
        if (!signal) continue;
        candidate.predictionSignal = signal;
        return;
      }
    } catch (_error) {
      return;
    }
  }));
}

function buildUpdatePlans(matches: MatchRow[], candidates: EspnCandidate[], teamMap: Map<string, TeamRow>) {
  const usedEventIds = new Set<string>();
  const now = new Date().toISOString();
  const plans: { match: MatchRow; candidate: EspnCandidate; update: MatchUpdate; willFinish: boolean }[] = [];

  for (const match of matches) {
    const best = candidates
      .filter((candidate) => !usedEventIds.has(candidate.eventId))
      .map((candidate) => ({ candidate, confidence: scoreCandidate(match, candidate, teamMap) }))
      .sort((a, b) => b.confidence - a.confidence)[0];

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
      espn_updated_at: now,
    };

    if (best.candidate.predictionSignal) {
      update.espn_home_win_pct = best.candidate.predictionSignal.home;
      update.espn_draw_pct = best.candidate.predictionSignal.draw;
      update.espn_away_win_pct = best.candidate.predictionSignal.away;
      update.espn_prediction_updated_at = now;
    }

    const hasCandidateScore = best.candidate.homeScore !== null && best.candidate.awayScore !== null;
    const scoreChanged = hasCandidateScore && (match.home_score !== best.candidate.homeScore || match.away_score !== best.candidate.awayScore);
    const statusChanged = Boolean(nextStatus && match.status !== nextStatus);
    const signalChanged = Boolean(best.candidate.predictionSignal)
      && (match.espn_home_win_pct !== best.candidate.predictionSignal?.home
        || match.espn_draw_pct !== best.candidate.predictionSignal?.draw
        || match.espn_away_win_pct !== best.candidate.predictionSignal?.away);
    const needsSummaryRefresh = !match.espn_summary_updated_at || nextStatus === 'live' || nextStatus === 'finished';
    const shouldUpdate = nextStatus === 'live' || statusChanged || scoreChanged || signalChanged || needsSummaryRefresh;

    if (!shouldUpdate) continue;
    if (nextStatus) update.status = nextStatus;
    if ((nextStatus === 'live' || nextStatus === 'finished') && hasCandidateScore) {
      update.home_score = best.candidate.homeScore;
      update.away_score = best.candidate.awayScore;
      update.result_updated_at = now;
    }

    plans.push({ match, candidate: best.candidate, update, willFinish: nextStatus === 'finished' && (match.status !== 'finished' || scoreChanged) });
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

async function enrichPlansWithSummaries(plans: { candidate: EspnCandidate; update: MatchUpdate }[]) {
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

function getOutcome(score: Score): PredictionOutcome {
  if (score.home_score > score.away_score) return 'home';
  if (score.home_score < score.away_score) return 'away';
  return 'draw';
}

function getPredictionOutcome(prediction: PredictionRow): ScoreOutcome {
  const actualOutcome = getOutcome(prediction.matches);
  const predictedOutcome = prediction.predicted_outcome;
  const predictionType = prediction.prediction_type ?? 'exact_score';
  const hasExactScores = typeof prediction.home_score === 'number' && typeof prediction.away_score === 'number';
  const exact = predictionType === 'exact_score'
    && hasExactScores
    && prediction.home_score === prediction.matches.home_score
    && prediction.away_score === prediction.matches.away_score;

  if (exact) return 'exact';
  return predictedOutcome === actualOutcome ? 'correct' : 'missed';
}

function calculateScore(prediction: PredictionRow): CalculatedScore {
  const outcome = getPredictionOutcome(prediction);
  const predictionType = prediction.prediction_type ?? 'exact_score';
  const actualOutcome = getOutcome(prediction.matches);
  const hasExactScores = typeof prediction.home_score === 'number' && typeof prediction.away_score === 'number';
  const exactScore = outcome === 'exact' ? 5 : 0;
  const correctOutcome = outcome === 'correct' ? 2 : 0;
  const canScoreBonuses = predictionType === 'exact_score' && hasExactScores && outcome === 'correct';
  const predictedGoalDifference = hasExactScores ? prediction.home_score - prediction.away_score : null;
  const actualGoalDifference = prediction.matches.home_score - prediction.matches.away_score;
  const goalDifferenceBonus = canScoreBonuses && actualOutcome !== 'draw' && predictedGoalDifference === actualGoalDifference ? 1 : 0;
  const teamScoreBonus = canScoreBonuses && (prediction.home_score === prediction.matches.home_score || prediction.away_score === prediction.matches.away_score) ? 1 : 0;
  const riskMultiplier = prediction.is_risk_pick ? 1 : 1;
  const baseTotal = exactScore + correctOutcome + goalDifferenceBonus + teamScoreBonus;

  return {
    prediction_id: prediction.id,
    user_id: prediction.user_id,
    match_kickoff_at: prediction.matches.kickoff_at,
    outcome,
    exact_score: exactScore,
    correct_outcome: correctOutcome,
    goal_difference_bonus: goalDifferenceBonus,
    team_score_bonus: teamScoreBonus,
    streak_bonus: 0,
    risk_multiplier: riskMultiplier,
    underdog_bonus: 0,
    total: baseTotal * riskMultiplier,
    scoring_version: 'smart-2026-06-19',
    calculated_at: new Date().toISOString(),
  };
}

function getCurrentStreak(scores: CalculatedScore[]) {
  let streak = 0;
  for (const score of [...scores].sort((a, b) => a.match_kickoff_at.localeCompare(b.match_kickoff_at)).reverse()) {
    if (score.outcome === 'missed') break;
    streak += 1;
  }
  return streak;
}

function getBestStreak(scores: CalculatedScore[]) {
  let current = 0;
  let best = 0;
  for (const score of [...scores].sort((a, b) => a.match_kickoff_at.localeCompare(b.match_kickoff_at))) {
    if (score.outcome === 'missed') {
      current = 0;
      continue;
    }
    current += 1;
    best = Math.max(best, current);
  }
  return best;
}

function buildAggregates(scores: CalculatedScore[], rewardPointsByUser: Map<string, number>): UserAggregate[] {
  const scoresByUser = new Map<string, CalculatedScore[]>();
  for (const score of scores) {
    scoresByUser.set(score.user_id, [...(scoresByUser.get(score.user_id) ?? []), score]);
  }

  const userIds = new Set([...scoresByUser.keys(), ...rewardPointsByUser.keys()]);
  return [...userIds]
    .map((userId) => {
      const userScores = scoresByUser.get(userId) ?? [];
      const predictionPoints = userScores.reduce((sum, score) => sum + score.total, 0);
      const rewardPoints = rewardPointsByUser.get(userId) ?? 0;
      const exactScores = userScores.filter((score) => score.outcome === 'exact').length;
      const correctScores = userScores.filter((score) => score.outcome !== 'missed').length;
      const accuracy = userScores.length ? Math.round((correctScores / userScores.length) * 100) : 0;

      return {
        userId,
        predictionPoints,
        rewardPoints,
        points: predictionPoints + rewardPoints,
        exactScores,
        accuracy,
        currentStreak: getCurrentStreak(userScores),
        bestStreak: getBestStreak(userScores),
        rank: 0,
      };
    })
    .sort((a, b) => b.points - a.points || b.exactScores - a.exactScores || b.accuracy - a.accuracy)
    .map((aggregate, index) => ({ ...aggregate, rank: index + 1 }));
}

async function recalculateScores(supabase: ReturnType<typeof createClient>) {
  const { data: predictions, error: predictionsError } = await supabase
    .from('predictions')
    .select('id, user_id, prediction_type, home_score, away_score, predicted_outcome, is_risk_pick, matches!inner(home_score, away_score, kickoff_at)')
    .eq('matches.status', 'finished');

  if (predictionsError) throw predictionsError;

  const calculatedScores = ((predictions ?? []) as PredictionRow[]).map(calculateScore);
  for (const score of calculatedScores) {
    const { user_id: _userId, match_kickoff_at: _matchKickoffAt, ...scoreValues } = score;
    const { error } = await supabase.from('prediction_scores').upsert(scoreValues);
    if (error) throw error;
  }

  const { data: dailyRewards, error: dailyRewardsError } = await supabase
    .from('daily_login_rewards')
    .select('user_id, points_awarded');

  if (dailyRewardsError) throw dailyRewardsError;

  const rewardPointsByUser = new Map<string, number>();
  for (const reward of (dailyRewards ?? []) as DailyRewardRow[]) {
    rewardPointsByUser.set(reward.user_id, (rewardPointsByUser.get(reward.user_id) ?? 0) + reward.points_awarded);
  }

  const aggregates = buildAggregates(calculatedScores, rewardPointsByUser);
  const { data: previousEntries, error: previousError } = await supabase
    .from('leaderboard_entries')
    .select('user_id, rank')
    .eq('scope', 'global')
    .is('league_id', null);

  if (previousError) throw previousError;

  const previousRanks = new Map((previousEntries ?? []).map((entry: { user_id: string; rank: number }) => [entry.user_id, entry.rank]));
  const { error: deleteError } = await supabase
    .from('leaderboard_entries')
    .delete()
    .eq('scope', 'global')
    .is('league_id', null);

  if (deleteError) throw deleteError;

  if (aggregates.length) {
    const { error: insertError } = await supabase.from('leaderboard_entries').insert(aggregates.map((aggregate) => ({
      scope: 'global',
      league_id: null,
      user_id: aggregate.userId,
      rank: aggregate.rank,
      previous_rank: previousRanks.get(aggregate.userId) ?? null,
      points: aggregate.points,
      exact_scores: aggregate.exactScores,
      accuracy: aggregate.accuracy,
      streak: aggregate.currentStreak,
      updated_at: new Date().toISOString(),
    })));

    if (insertError) throw insertError;
  }

  for (const aggregate of aggregates) {
    const { error } = await supabase.from('profiles').update({
      points: aggregate.points,
      rank: aggregate.rank,
      accuracy: aggregate.accuracy,
      exact_scores: aggregate.exactScores,
      current_streak: aggregate.currentStreak,
      best_streak: aggregate.bestStreak,
    }).eq('id', aggregate.userId);

    if (error) throw error;
  }

  const leagueRefresh = await refreshLeagueLeaderboards(supabase);
  return { predictionScores: calculatedScores.length, leaderboardEntries: aggregates.length, ...leagueRefresh };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const body = await req.json().catch(() => ({})) as { dates?: unknown; daysBack?: unknown; daysForward?: unknown };
  const syncSecret = Deno.env.get('ESPN_SYNC_SECRET');
  if (syncSecret && req.headers.get('x-sync-secret') !== syncSecret) {
    return jsonResponse({ error: 'Forbidden' }, 403);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) return jsonResponse({ error: 'Missing Supabase server config' }, 500);

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });

  try {
    const dates = getDateWindow(body);
    const scoreboards = await Promise.all(dates.map(fetchScoreboard));
    const candidates = buildCandidates(scoreboards);
    await enrichCandidatesWithOdds(candidates);
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('id, home_team_id, away_team_id, kickoff_at, lock_at, status, home_score, away_score, espn_home_win_pct, espn_draw_pct, espn_away_win_pct, espn_summary_updated_at')
      .like('id', 'wc2026-%')
      .order('kickoff_at', { ascending: true });
    const { data: teams, error: teamsError } = await supabase.from('teams').select('id, name, short_name, country_code');

    if (matchesError) throw matchesError;
    if (teamsError) throw teamsError;

    const teamMap = new Map((teams ?? []).map((team: TeamRow) => [team.id, team]));
    const plans = buildUpdatePlans((matches ?? []) as MatchRow[], candidates, teamMap);
    await enrichPlansWithSummaries(plans);
    const matchedEventIds = new Set(plans.map((plan) => plan.candidate.eventId));
    const unmatchedCandidates = candidates.filter((candidate) => !matchedEventIds.has(candidate.eventId));
    let updatedMatches = 0;
    let finishedMatches = 0;
    let signalUpdates = 0;

    for (const plan of plans) {
      const { error } = await supabase.from('matches').update(plan.update).eq('id', plan.match.id);
      if (error) throw error;
      updatedMatches += 1;
      if (plan.candidate.predictionSignal) signalUpdates += 1;
      if (plan.willFinish) finishedMatches += 1;
    }

    const scoring = finishedMatches > 0 ? await recalculateScores(supabase) : { predictionScores: 0, leaderboardEntries: 0 };
    const diagnostic = {
      dates,
      espnEvents: candidates.length,
      espnEventsWithSignal: candidates.filter((candidate) => candidate.predictionSignal).length,
      matchedEvents: plans.length,
      unmatchedEvents: unmatchedCandidates.map((candidate) => ({
        eventId: candidate.eventId,
        kickoffAt: candidate.kickoffAt,
        home: candidate.homeLabel,
        away: candidate.awayLabel,
        hasSignal: Boolean(candidate.predictionSignal),
      })).slice(0, 20),
    };

    if (updatedMatches > 0) {
      await supabase.from('admin_audit_logs').insert({
        action: 'espn_result_sync_completed',
        entity_type: 'system',
        entity_id: 'espn-result-sync',
        description: `Synced ${updatedMatches} ESPN match updates, ${signalUpdates} signal updates, finished ${finishedMatches} matches, recalculated ${scoring.predictionScores} prediction scores and ${scoring.leagueLeaderboardEntries} league leaderboard entries.`,
        severity: 'info',
      });
    }

    return jsonResponse({ updatedMatches, signalUpdates, finishedMatches, ...scoring, diagnostic });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await supabase.from('admin_audit_logs').insert({
      action: 'espn_result_sync_failed',
      entity_type: 'system',
      entity_id: 'espn-result-sync',
      description: message,
      severity: 'warning',
    });
    return jsonResponse({ error: message }, 500);
  }
});
