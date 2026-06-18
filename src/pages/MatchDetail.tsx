import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarClock, Lock, MapPin, Save, ShieldCheck, Target, Trophy } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import StatusPill from '../components/ui/StatusPill';
import { mockPredictions } from '../data/mockPredictions';
import { currentUserId } from '../data/mockUsers';
import { calculatePredictionScore, getPredictionOutcome } from '../lib/scoring';
import { getMatch, type MatchRow } from '../services/matches';
import { getMatchPredictionOutcomeSummary, type MatchPredictionOutcomeSummary } from '../services/predictions';
import { getErrorMessage } from '../services/serviceTypes';
import { getTeamMap, type TeamRow } from '../services/teams';
import { getTeamFlag } from '../utils/teamFlags';
import type { ThemeControls } from '../App';
import type { MatchResult, Prediction, PredictionDisplayStatus } from '../types/domain';

type MatchDetailProps = {
  themeControls: ThemeControls;
};

type EspnSummaryPayload = {
  venue?: {
    name?: string | null;
    city?: string | null;
    country?: string | null;
  };
  broadcasts?: string[];
  teams?: Record<string, {
    name?: string | null;
    statistics?: { label?: string | null; value?: string | null }[];
    leaders?: { name?: string | null; label?: string | null; value?: string | null }[];
    lastFiveGames?: { opponent?: string | null; result?: string | null; score?: string | null; date?: string | null }[];
  }>;
  leaders?: { name?: string | null; label?: string | null; value?: string | null }[];
  news?: { headline?: string | null; description?: string | null; link?: string | null; published?: string | null; label?: string | null }[];
};

type SignalRowProps = {
  label: string;
  homeLabel: string;
  awayLabel: string;
  homePct?: number | null;
  drawPct?: number | null;
  awayPct?: number | null;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(value));
}

function getMatchResult(match: MatchRow): MatchResult | undefined {
  if (typeof match.home_score !== 'number' || typeof match.away_score !== 'number') return undefined;
  return { homeScore: match.home_score, awayScore: match.away_score };
}

function getDisplayStatus(prediction?: Prediction, result?: MatchResult): PredictionDisplayStatus {
  if (!prediction) return 'pending';
  if (!result) return prediction.status === 'locked' ? 'locked' : 'pending';
  return getPredictionOutcome(prediction, result);
}

function getStatusTone(status: MatchRow['status']) {
  if (status === 'open') return 'bg-c3 text-main';
  if (status === 'locked') return 'bg-c1 text-main';
  if (status === 'finished') return 'bg-muted text-main';
  if (status === 'live') return 'bg-c4 text-inv';
  return 'bg-card text-main';
}

function getOutcomeFromScores(homeScore: string, awayScore: string): 'home' | 'draw' | 'away' | '' {
  if (homeScore === '' || awayScore === '') return '';
  const home = Number(homeScore);
  const away = Number(awayScore);
  if (!Number.isInteger(home) || !Number.isInteger(away)) return '';
  if (home > away) return 'home';
  if (home < away) return 'away';
  return 'draw';
}

function toPercent(count: number, total: number) {
  return total > 0 ? Math.round((count / total) * 100) : null;
}

function getEspnSummary(match: MatchRow): EspnSummaryPayload {
  return match.espn_summary && typeof match.espn_summary === 'object' && !Array.isArray(match.espn_summary) ? match.espn_summary as EspnSummaryPayload : {};
}

function getLiveLabel(match: MatchRow) {
  if (match.espn_state === 'in') return match.espn_display_clock ? `LIVE ${match.espn_display_clock}` : 'LIVE';
  return match.espn_status_detail ?? match.espn_status ?? match.status;
}

function SignalRow({ label, homeLabel, awayLabel, homePct, drawPct, awayPct }: SignalRowProps) {
  const items = [
    { label: homeLabel, value: homePct },
    { label: 'Draw', value: drawPct },
    { label: awayLabel, value: awayPct },
  ];

  return (
    <div className="border-2 border-main bg-card p-3 flex flex-col gap-2">
      <div className="font-black uppercase text-xs">{label}</div>
      {items.map((item) => (
        <div key={item.label} className="grid grid-cols-[70px_1fr_42px] items-center gap-2 text-[10px] font-black uppercase">
          <span>{item.label}</span>
          <div className="h-3 border-2 border-main bg-muted"><div className="h-full bg-c3" style={{ width: `${item.value ?? 0}%` }} /></div>
          <span className="text-right">{item.value ?? '—'}%</span>
        </div>
      ))}
    </div>
  );
}

function TeamFlag({ team, align = 'items-center' }: { team: TeamRow; align?: string }) {
  const FlagIcon = getTeamFlag(team.country_code, team.short_name);

  return (
    <div className={`flex ${align}`}>
      <div className="w-14 h-14 lg:w-20 lg:h-20 border-4 border-main rounded-full overflow-hidden flex items-center justify-center bg-elevated shadow-[4px_4px_0_var(--color-shadow)]">
        {FlagIcon ? <FlagIcon className="w-full h-full object-cover" /> : <span className="font-black text-sm">{team.short_name}</span>}
      </div>
    </div>
  );
}

export default function MatchDetail({ themeControls }: MatchDetailProps) {
  const { matchId } = useParams();
  const [match, setMatch] = useState<MatchRow | null>(null);
  const [teams, setTeams] = useState<Map<string, TeamRow>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const existingPrediction = match ? mockPredictions.find((prediction) => prediction.userId === currentUserId && prediction.matchId === match.id) : undefined;
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [predictedOutcome, setPredictedOutcome] = useState<'home' | 'draw' | 'away' | ''>('');
  const [submittedPrediction, setSubmittedPrediction] = useState<Prediction | undefined>();
  const [savedAt, setSavedAt] = useState<string | undefined>();
  const [communitySignal, setCommunitySignal] = useState<MatchPredictionOutcomeSummary | null>(null);

  useEffect(() => {
    if (!matchId) {
      setMatch(null);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([getMatch(matchId), getTeamMap(), getMatchPredictionOutcomeSummary(matchId)])
      .then(([nextMatch, nextTeams, nextCommunitySignal]) => {
        if (!active) return;
        setMatch(nextMatch);
        setTeams(nextTeams);
        setCommunitySignal(nextCommunitySignal);
      })
      .catch((nextError) => {
        if (!active) return;
        setError(getErrorMessage(nextError));
        setMatch(null);
        setCommunitySignal(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [matchId]);

  useEffect(() => {
    setHomeScore(existingPrediction?.homeScore.toString() ?? '');
    setAwayScore(existingPrediction?.awayScore.toString() ?? '');
    setPredictedOutcome(existingPrediction ? getOutcomeFromScores(String(existingPrediction.homeScore), String(existingPrediction.awayScore)) : '');
    setSubmittedPrediction(existingPrediction);
    setSavedAt(undefined);
  }, [existingPrediction]);

  const homeTeam = match ? teams.get(match.home_team_id) : undefined;
  const awayTeam = match ? teams.get(match.away_team_id) : undefined;
  const result = match ? getMatchResult(match) : undefined;
  const isLocked = !match || match.status === 'locked' || match.status === 'finished' || match.status === 'live';
  const displayStatus = getDisplayStatus(submittedPrediction, result);
  const espnSummary = match ? getEspnSummary(match) : {};
  const communityTotal = communitySignal?.total_predictions ?? 0;
  const communityHomePct = toPercent(communitySignal?.home_predictions ?? 0, communityTotal);
  const communityDrawPct = toPercent(communitySignal?.draw_predictions ?? 0, communityTotal);
  const communityAwayPct = toPercent(communitySignal?.away_predictions ?? 0, communityTotal);
  const hasEspnSignal = typeof match?.espn_home_win_pct === 'number' && typeof match.espn_draw_pct === 'number' && typeof match.espn_away_win_pct === 'number';

  const scoreBreakdown = useMemo(() => {
    if (!submittedPrediction || !result) return undefined;
    return calculatePredictionScore(submittedPrediction, result, { riskMultiplier: submittedPrediction.isRiskPick ? 1 : 1 });
  }, [submittedPrediction, result]);

  if (loading) {
    return (
      <AppShell themeControls={themeControls}>
        <div className="relative z-10 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6 min-h-0">
          <div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col w-full xl:w-1/2 shadow-[8px_8px_0_0_var(--color-shadow)]">
            <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-1 text-main">Loading Match</h1>
          </div>
          <div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col gap-4 lg:gap-6 shadow-[8px_8px_0_0_var(--color-shadow)] rounded-sm">
            <div className="p-6 bg-card border-b-4 border-main font-black uppercase text-sm">Loading match...</div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !match || !homeTeam || !awayTeam) {
    return (
      <AppShell themeControls={themeControls}>
        <div className="relative z-10 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6 min-h-0">
          <div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col w-full xl:w-1/2 shadow-[8px_8px_0_0_var(--color-shadow)]">
            <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-1 text-main">Match Not Found</h1>
          </div>
          <div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col gap-4 lg:gap-6 shadow-[8px_8px_0_0_var(--color-shadow)] rounded-sm">
            <div className="p-6 bg-card border-b-4 border-main font-black uppercase text-sm">{error ?? 'This match is not available in the current World Cup 2026 schedule.'}</div>
            <div className="p-4 bg-card">
              <Link to="/matches" className="inline-flex bg-c2 text-inv font-black uppercase py-3 px-4 border-2 border-main items-center gap-2"><ArrowLeft size={16} /> Back to Matches</Link>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  const handleSubmit = () => {
    const nextHomeScore = Number(homeScore);
    const nextAwayScore = Number(awayScore);
    if (!Number.isInteger(nextHomeScore) || !Number.isInteger(nextAwayScore) || nextHomeScore < 0 || nextAwayScore < 0) return;

    const nextOutcome = getOutcomeFromScores(homeScore, awayScore);
    if (!nextOutcome || predictedOutcome !== nextOutcome) return;

    setSubmittedPrediction({
      id: existingPrediction?.id ?? `local-${match.id}`,
      userId: currentUserId,
      matchId: match.id,
      homeScore: nextHomeScore,
      awayScore: nextAwayScore,
      predictedOutcome: nextOutcome,
      confidence: existingPrediction?.confidence ?? 70,
      isRiskPick: existingPrediction?.isRiskPick ?? false,
      createdAt: existingPrediction?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lockedAt: existingPrediction?.lockedAt,
      status: existingPrediction?.status ?? 'submitted',
      revision: (existingPrediction?.revision ?? 0) + 1,
    });
    setSavedAt(new Date().toISOString());
  };

  return (
    <AppShell themeControls={themeControls}>
      <div className="relative z-10 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6 min-h-0">
        <div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col w-full xl:w-1/2 shadow-[8px_8px_0_0_var(--color-shadow)]">
          <div className="flex items-center gap-3 mb-2">
            <Link to="/matches" className="bg-card hover:bg-muted border-2 border-main p-2 shadow-[3px_3px_0_var(--color-shadow)]"><ArrowLeft size={18} /></Link>
            <div className={`border-2 border-main px-3 py-1 font-black uppercase text-xs ${getStatusTone(match.status)}`}>{match.status}</div>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-1 text-main">
            {homeTeam.name} vs {awayTeam.name}
          </h1>
          <p className="font-bold text-sm text-subtle max-w-xl">Review match context, lock timing, and your exact-score prediction before kickoff.</p>
        </div>

        <div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col gap-4 lg:gap-6 shadow-[8px_8px_0_0_var(--color-shadow)] rounded-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 border-b-4 border-main">
            <div className="flex items-center gap-4 border-b-4 sm:border-r-4 xl:border-b-0 border-main p-4 lg:p-5 bg-c1 text-main">
              <CalendarClock size={36} strokeWidth={2.5} />
              <div><div className="text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">Kickoff</div><div className="text-xl sm:text-2xl font-black leading-none">{formatDateTime(match.kickoff_at)}</div><div className="text-[10px] font-bold uppercase mt-1">World Cup 2026</div></div>
            </div>
            <div className="flex items-center gap-4 border-b-4 xl:border-b-0 xl:border-r-4 border-main p-4 lg:p-5 bg-c2 text-inv">
              <Lock size={36} strokeWidth={2.5} />
              <div><div className="text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">Prediction Lock</div><div className="text-xl sm:text-2xl font-black leading-none">{formatDateTime(match.lock_at)}</div><div className="text-[10px] font-bold uppercase mt-1">Submit before this</div></div>
            </div>
            <div className="flex items-center gap-4 border-b-4 sm:border-b-0 sm:border-r-4 border-main p-4 lg:p-5 bg-c3 text-main">
              <Trophy size={36} strokeWidth={2.5} />
              <div><div className="text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">Stage</div><div className="text-2xl sm:text-3xl font-black leading-none">Group {match.group_code ?? '-'}</div><div className="text-[10px] font-bold uppercase mt-1">Matchday {match.matchday ?? '-'}</div></div>
            </div>
            <div className="flex items-center gap-4 border-main p-4 lg:p-5 bg-c4 text-main">
              <Target size={36} strokeWidth={2.5} />
              <div><div className="text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">Points</div><div className="text-2xl sm:text-3xl font-black leading-none">{scoreBreakdown?.total ?? '—'}</div><div className="text-[10px] font-bold uppercase mt-1">Current earned</div></div>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row flex-1">
            <div className="flex-1 border-r-0 xl:border-r-4 border-main flex flex-col bg-muted min-w-0">
              <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm border-b-4 border-main">
                Match Card
              </div>
              <div className="bg-card p-5 lg:p-8 border-b-4 border-main flex flex-col gap-6">
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 lg:gap-6">
                  <div className="flex flex-col items-end text-right gap-3">
                    <TeamFlag team={homeTeam} align="items-end" />
                    <div>
                      <div className="font-black text-3xl lg:text-6xl uppercase tracking-tighter">{homeTeam.short_name}</div>
                      <div className="font-bold text-subtle uppercase text-xs lg:text-sm mt-1">{homeTeam.name}</div>
                      <div className="font-bold text-subtle uppercase text-[10px] mt-2">FIFA Rank #{homeTeam.fifa_rank ?? '—'}</div>
                    </div>
                  </div>
                  <div className="border-4 border-main bg-page shadow-[4px_4px_0_var(--color-shadow)] px-4 py-3 lg:px-6 lg:py-4 font-black text-2xl lg:text-5xl">
                    {result ? `${result.homeScore} - ${result.awayScore}` : 'VS'}
                  </div>
                  <div className="flex flex-col items-start gap-3">
                    <TeamFlag team={awayTeam} align="items-start" />
                    <div>
                      <div className="font-black text-3xl lg:text-6xl uppercase tracking-tighter">{awayTeam.short_name}</div>
                      <div className="font-bold text-subtle uppercase text-xs lg:text-sm mt-1">{awayTeam.name}</div>
                      <div className="font-bold text-subtle uppercase text-[10px] mt-2">FIFA Rank #{awayTeam.fifa_rank ?? '—'}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-card p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 font-bold">
                <div className="flex items-center gap-2"><MapPin size={18} /> {match.stadium}</div>
                <div className="uppercase text-subtle">{match.city}</div>
              </div>

              {(match.espn_status_detail || match.espn_display_clock || match.espn_attendance || match.espn_play_by_play_available !== null) && (
                <div className="bg-c4 border-t-4 border-main p-4 grid grid-cols-1 md:grid-cols-4 gap-3 font-black uppercase text-xs">
                  <div><span className="text-subtle block text-[10px]">Live status</span>{getLiveLabel(match)}</div>
                  <div><span className="text-subtle block text-[10px]">Clock</span>{match.espn_display_clock ?? '—'}</div>
                  <div><span className="text-subtle block text-[10px]">Attendance</span>{match.espn_attendance?.toLocaleString() ?? '—'}</div>
                  <div><span className="text-subtle block text-[10px]">Play-by-play</span>{match.espn_play_by_play_available ? 'Available' : 'Not listed'}</div>
                </div>
              )}

              <div className="bg-card border-t-4 border-main p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="border-4 border-main bg-page shadow-[4px_4px_0_var(--color-shadow)]">
                  <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm border-b-4 border-main">Community vs ESPN Signal</div>
                  <div className="p-4 flex flex-col gap-3">
                    <SignalRow label={`Community picks (${communityTotal})`} homeLabel={homeTeam.short_name} awayLabel={awayTeam.short_name} homePct={communityHomePct} drawPct={communityDrawPct} awayPct={communityAwayPct} />
                    <SignalRow label="ESPN Signal" homeLabel={homeTeam.short_name} awayLabel={awayTeam.short_name} homePct={match.espn_home_win_pct} drawPct={match.espn_draw_pct} awayPct={match.espn_away_win_pct} />
                    {!hasEspnSignal && <div className="border-2 border-main bg-muted p-3 font-bold text-xs text-subtle">ESPN prediction percentages are not available for this match yet.</div>}
                  </div>
                </div>

                <div className="border-4 border-main bg-page shadow-[4px_4px_0_var(--color-shadow)]">
                  <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm border-b-4 border-main">ESPN Match Context</div>
                  <div className="p-4 flex flex-col gap-3 font-bold text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="border-2 border-main bg-card p-3"><span className="font-black uppercase text-[10px] text-subtle block">Venue</span>{espnSummary.venue?.name ?? match.stadium}</div>
                      <div className="border-2 border-main bg-card p-3"><span className="font-black uppercase text-[10px] text-subtle block">Location</span>{espnSummary.venue?.city ?? match.city}{espnSummary.venue?.country ? `, ${espnSummary.venue.country}` : ''}</div>
                    </div>
                    <div className="border-2 border-main bg-card p-3"><span className="font-black uppercase text-[10px] text-subtle block mb-1">Broadcasts</span>{espnSummary.broadcasts?.length ? espnSummary.broadcasts.join(' • ') : 'Not listed yet'}</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="border-2 border-main bg-card p-3"><span className="font-black uppercase text-[10px] text-subtle block">{homeTeam.short_name} record</span>{match.espn_home_record ?? 'Not listed'}</div>
                      <div className="border-2 border-main bg-card p-3"><span className="font-black uppercase text-[10px] text-subtle block">{awayTeam.short_name} record</span>{match.espn_away_record ?? 'Not listed'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {(espnSummary.leaders?.length || espnSummary.teams || espnSummary.news?.length) && (
                <div className="bg-card border-t-4 border-main p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="border-4 border-main bg-page shadow-[4px_4px_0_var(--color-shadow)]">
                    <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm border-b-4 border-main">Leaders</div>
                    <div className="p-4 flex flex-col gap-2">
                      {(espnSummary.leaders ?? []).slice(0, 6).map((leader, index) => (
                        <div key={`${leader.name}-${index}`} className="border-2 border-main bg-card p-3 font-bold text-xs">
                          <div className="font-black uppercase">{leader.name ?? leader.label ?? 'Leader'}</div>
                          <div className="text-subtle">{[leader.label, leader.value].filter(Boolean).join(' • ')}</div>
                        </div>
                      ))}
                      {!espnSummary.leaders?.length && <div className="border-2 border-main bg-muted p-3 font-bold text-xs text-subtle">No leaders listed yet.</div>}
                    </div>
                  </div>

                  <div className="border-4 border-main bg-page shadow-[4px_4px_0_var(--color-shadow)]">
                    <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm border-b-4 border-main">Team Notes</div>
                    <div className="p-4 grid grid-cols-1 gap-3">
                      {(['home', 'away'] as const).map((side) => {
                        const teamSummary = espnSummary.teams?.[side];
                        const team = side === 'home' ? homeTeam : awayTeam;
                        return (
                          <div key={side} className="border-2 border-main bg-card p-3 font-bold text-xs">
                            <div className="font-black uppercase mb-2">{team.short_name}</div>
                            {(teamSummary?.statistics ?? []).slice(0, 4).map((stat) => <div key={`${side}-${stat.label}`} className="flex justify-between border-b border-line py-1"><span>{stat.label}</span><span className="font-black">{stat.value}</span></div>)}
                            {(teamSummary?.lastFiveGames ?? []).slice(0, 3).map((game, index) => <div key={`${side}-form-${index}`} className="text-subtle mt-2">{[game.result, game.score, game.opponent].filter(Boolean).join(' • ')}</div>)}
                            {!teamSummary && <div className="text-subtle">No ESPN team notes listed yet.</div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border-4 border-main bg-page shadow-[4px_4px_0_var(--color-shadow)]">
                    <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm border-b-4 border-main">Match News</div>
                    <div className="p-4 flex flex-col gap-2">
                      {(espnSummary.news ?? []).slice(0, 4).map((article, index) => (
                        <a key={`${article.headline}-${index}`} href={article.link ?? '#'} target="_blank" rel="noreferrer" className="border-2 border-main bg-card hover:bg-muted p-3 font-bold text-xs">
                          <div className="font-black uppercase">{article.headline}</div>
                          {article.description && <div className="text-subtle mt-1 leading-snug">{article.description}</div>}
                          <div className="text-[10px] font-black uppercase mt-2 text-c2">Open on ESPN</div>
                        </a>
                      ))}
                      {!espnSummary.news?.length && <div className="border-2 border-main bg-muted p-3 font-bold text-xs text-subtle">No ESPN news listed yet.</div>}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="w-full xl:w-[420px] bg-card flex flex-col">
              <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm border-b-4 border-main">
                Your Exact Score
              </div>
              <div className="p-4 bg-card flex flex-col gap-4 border-b-4 border-main">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-black uppercase text-xs text-subtle">Prediction status</span>
                  <StatusPill status={displayStatus} />
                </div>

                <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-end">
                  <label className="flex flex-col gap-2">
                    <span className="font-black uppercase text-[10px]">{homeTeam.short_name}</span>
                    <input type="number" min="0" value={homeScore} disabled={isLocked} onChange={(event) => {
  const next = event.target.value;
  setHomeScore(next);
  setPredictedOutcome(getOutcomeFromScores(next, awayScore));
}} className="w-full border-[3px] border-main bg-card p-3 text-center font-black text-3xl shadow-[3px_3px_0_var(--color-shadow)] outline-none disabled:bg-muted" />
                  </label>
                  <div className="font-black text-3xl pb-3">-</div>
                  <label className="flex flex-col gap-2">
                    <span className="font-black uppercase text-[10px] text-right">{awayTeam.short_name}</span>
                    <input type="number" min="0" value={awayScore} disabled={isLocked} onChange={(event) => {
  const next = event.target.value;
  setAwayScore(next);
  setPredictedOutcome(getOutcomeFromScores(homeScore, next));
}} className="w-full border-[3px] border-main bg-card p-3 text-center font-black text-3xl shadow-[3px_3px_0_var(--color-shadow)] outline-none disabled:bg-muted" />
                  </label>
                </div>

                <div className="grid grid-cols-3 border-[3px] border-main font-black uppercase text-xs overflow-hidden">
                  {[
                    { value: 'home' as const, label: `${homeTeam.short_name} WIN` },
                    { value: 'draw' as const, label: 'DRAW' },
                    { value: 'away' as const, label: `${awayTeam.short_name} WIN` },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      disabled={isLocked}
                      onClick={() => setPredictedOutcome(option.value)}
                      className={`${predictedOutcome === option.value ? 'bg-c3 text-main' : 'bg-card hover:bg-elevated'} border-r-[3px] last:border-r-0 border-main py-3 disabled:bg-muted disabled:text-subtle`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <button type="button" disabled={isLocked} onClick={handleSubmit} className="bg-c2 disabled:bg-muted disabled:text-subtle text-inv font-black uppercase py-3 px-4 border-2 border-main shadow-[4px_4px_0_var(--color-shadow)] flex items-center justify-center gap-2 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all">
                  <Save size={18} strokeWidth={3} /> Save Mock Prediction
                </button>

                <div className="border-2 border-main bg-page p-3 text-xs font-bold text-subtle leading-relaxed">
                  {isLocked ? 'This match is locked or already finished, so prediction editing is disabled in this frontend mock.' : 'Frontend-only mock save: this updates the page state for your current session without calling a backend.'}
                </div>

                {savedAt && <div className="bg-c3 border-2 border-main p-3 font-black uppercase text-xs flex items-center gap-2"><ShieldCheck size={16} /> Saved locally at {formatDateTime(savedAt)}</div>}
              </div>

              <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm border-b-4 border-main">
                Actions
              </div>
              <div className="p-4 bg-card flex flex-col gap-3">
                <Link to="/my-predictions" className="text-center bg-card hover:bg-muted text-main font-black uppercase py-3 px-4 border-2 border-main shadow-[3px_3px_0_var(--color-shadow)] text-xs">My Predictions</Link>
                {submittedPrediction && (
                  <Link to={`/predictions/${submittedPrediction.id}`} className="text-center bg-c1 text-main font-black uppercase py-3 px-4 border-2 border-main shadow-[3px_3px_0_var(--color-shadow)] text-xs">View Breakdown</Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
