import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { Activity, ArrowLeft, Check, Copy, UserMinus, X } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import RankBadge from '../components/ui/RankBadge';
import StreakBadge from '../components/ui/StreakBadge';
import { useAuth } from '../lib/auth';
import { listLeagueActivity, type ActivityEventRow } from '../services/activity';
import { listLeagueLeaderboard, type LeaderboardEntryWithProfile } from '../services/leaderboard';
import { approveJoinRequest, getLeague, joinLeague, kickLeagueMember, listLeagueJoinRequests, listLeagueMembers, rejectJoinRequest, updateLeague, type LeagueJoinRequestRow, type LeagueMemberRow, type LeagueRow } from '../services/leagues';
import { cancelLeagueEvent, createLeagueEvent, enterLeagueEvent, listLeagueEventLeaderboard, listLeagueEvents, settleLeagueEvent, type LeagueEventLeaderboardEntryWithProfile, type LeagueEventRow, type PayoutCurve } from '../services/leagueEvents';
import { getErrorMessage } from '../services/serviceTypes';
import { listMatches, type MatchRow } from '../services/matches';
import { getCurrentProfile, type ProfileRow } from '../services/profile';
import { getTeamMap, type TeamRow } from '../services/teams';
import { getPublicDisplayName } from '../utils/displayName';
import { getTeamFlag } from '../utils/teamFlags';
import type { ThemeControls } from '../App';

type LeagueDetailProps = {
  themeControls: ThemeControls;
};

type EventFormState = {
  name: string;
  startsAt: string;
  endsAt: string;
  minStake: string;
  maxStake: string;
  payoutCurve: PayoutCurve;
  rankShares: [string, string, string];
};

const defaultEventForm: EventFormState = {
  name: '',
  startsAt: '',
  endsAt: '',
  minStake: '1',
  maxStake: '100',
  payoutCurve: 'balanced_top3',
  rankShares: ['50', '30', '20'],
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function getEventTypeLabel(event: LeagueEventRow, t: (key: string) => string) {
  if (event.event_type === 'weekly') return t('ui.weeklyLeaderboard');
  if (event.event_type === 'matchday') return t('ui.matchdayLeaderboard');
  return t('ui.createCustomEvent');
}

function getEventStatusLabel(status: string, t: (key: string) => string) {
  if (status === 'settled') return t('ui.eventSettled');
  if (status === 'cancelled') return t('ui.eventCancelled');
  if (status === 'locked') return t('ui.eventLocked');
  return status;
}

function getPayoutCurveLabel(curve: string, t: (key: string) => string) {
  if (curve === 'winner_take_all') return t('ui.winnerTakeAll');
  if (curve === 'flat_top3') return t('ui.flatTop3');
  if (curve === 'custom_top3') return t('ui.customTop3');
  return t('ui.balancedTop3');
}

function isEventEnterable(event: LeagueEventRow) {
  const now = Date.now();
  return event.status === 'open' && new Date(event.starts_at).getTime() > now && new Date(event.ends_at).getTime() > now;
}

function groupEvents(events: LeagueEventRow[]) {
  return {
    weekly: events.filter((event) => event.event_type === 'weekly'),
    matchday: events.filter((event) => event.event_type === 'matchday'),
    custom: events.filter((event) => event.event_type === 'custom'),
  };
}

function CompactTeam({ team, fallback }: { team?: TeamRow; fallback: string }) {
  const FlagIcon = getTeamFlag(team?.country_code, team?.short_name);
  return (
    <span className="inline-flex items-center gap-1.5 min-w-0">
      <span className="w-5 h-5 border-2 border-main rounded-full overflow-hidden bg-elevated flex items-center justify-center shrink-0">
        {FlagIcon ? <FlagIcon className="w-full h-full object-cover" /> : <span className="font-black text-[8px]">{team?.short_name ?? '?'}</span>}
      </span>
      <span className="truncate">{team?.short_name ?? fallback}</span>
    </span>
  );
}

export default function LeagueDetail({ themeControls }: LeagueDetailProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { leagueId } = useParams();
  const [league, setLeague] = useState<LeagueRow | null>(null);
  const [creator, setCreator] = useState<ProfileRow | null>(null);
  const [standings, setStandings] = useState<LeaderboardEntryWithProfile[]>([]);
  const [members, setMembers] = useState<LeagueMemberRow[]>([]);
  const [joinRequests, setJoinRequests] = useState<LeagueJoinRequestRow[]>([]);
  const [leagueActivity, setLeagueActivity] = useState<ActivityEventRow[]>([]);
  const [events, setEvents] = useState<LeagueEventRow[]>([]);
  const [eventStandings, setEventStandings] = useState<Record<string, LeagueEventLeaderboardEntryWithProfile[]>>({});
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [teams, setTeams] = useState<Map<string, TeamRow>>(new Map());
  const [availablePoints, setAvailablePoints] = useState<number | null>(null);
  const [stakeByEventId, setStakeByEventId] = useState<Record<string, string>>({});
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [eventForm, setEventForm] = useState<EventFormState>(defaultEventForm);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingEvent, setSavingEvent] = useState(false);
  const [joining, setJoining] = useState(false);
  const [enteringEventId, setEnteringEventId] = useState<string | null>(null);
  const [settlingEventId, setSettlingEventId] = useState<string | null>(null);
  const [cancellingEventId, setCancellingEventId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentMembership = useMemo(() => members.find((member) => member.user_id === user?.id) ?? null, [members, user?.id]);
  const groupedEvents = useMemo(() => groupEvents(events), [events]);
  const matchesByMatchday = useMemo(() => {
    const nextMatchesByMatchday = new Map<number, MatchRow[]>();
    for (const match of matches) {
      if (match.matchday === null) continue;
      nextMatchesByMatchday.set(match.matchday, [...(nextMatchesByMatchday.get(match.matchday) ?? []), match]);
    }
    return new Map([...nextMatchesByMatchday.entries()].map(([matchday, matchdayMatches]) => [matchday, matchdayMatches.sort((a, b) => a.kickoff_at.localeCompare(b.kickoff_at))]));
  }, [matches]);
  const isOwner = currentMembership?.role === 'owner';
  const isMember = Boolean(currentMembership);
  const inviteLink = league ? `${window.location.origin}/leagues/join/${league.invite_code}` : '';

  function loadLeague() {
    if (!leagueId) {
      setLeague(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setCreator(null);

    getLeague(leagueId)
      .then(async (nextLeague) => {
        const [nextStandings, nextCreator, nextMembers, nextActivity, nextEvents, nextMatches, nextTeams, currentProfile] = await Promise.all([
          listLeagueLeaderboard(nextLeague.id).catch(() => []),
          nextLeague.creator_id ? getCurrentProfile(nextLeague.creator_id).catch(() => null) : Promise.resolve(null),
          listLeagueMembers(nextLeague.id).catch(() => []),
          listLeagueActivity(nextLeague.id).catch(() => []),
          listLeagueEvents(nextLeague.id).catch(() => []),
          listMatches().catch(() => []),
          getTeamMap().catch(() => new Map()),
          user ? getCurrentProfile(user.id).catch(() => null) : Promise.resolve(null),
        ]);
        const nextEventStandings = Object.fromEntries(await Promise.all(nextEvents.map(async (event) => [event.id, await listLeagueEventLeaderboard(event.id).catch(() => [])])));
        setLeague(nextLeague);
        setEditName(nextLeague.name);
        setEditDescription(nextLeague.description);
        setStandings(nextStandings);
        setCreator(nextCreator);
        setMembers(nextMembers);
        setLeagueActivity(nextActivity);
        setEvents(nextEvents);
        setEventStandings(nextEventStandings);
        setMatches(nextMatches);
        setTeams(nextTeams);
        setAvailablePoints(currentProfile?.points ?? null);
      })
      .catch((nextError) => {
        setError(getErrorMessage(nextError));
        setLeague(null);
        setStandings([]);
        setMembers([]);
        setLeagueActivity([]);
        setEvents([]);
        setEventStandings({});
        setMatches([]);
        setTeams(new Map());
        setAvailablePoints(null);
      })
      .finally(() => setLoading(false));
  }

  useEffect(loadLeague, [leagueId]);

  useEffect(() => {
    if (!league?.id || !isOwner) {
      setJoinRequests([]);
      return;
    }

    listLeagueJoinRequests(league.id).then(setJoinRequests).catch(() => setJoinRequests([]));
  }, [isOwner, league?.id]);

  async function handleJoin() {
    if (!user || !league) return;
    setJoining(true);
    setError(null);
    try {
      const result = await joinLeague({ leagueId: league.id });
      if (result.status === 'pending') {
        setError(t('ui.joinRequestPending'));
      } else {
        loadLeague();
      }
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setJoining(false);
    }
  }

  async function handleCopyInvite() {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function handleSaveLeague(event: FormEvent) {
    event.preventDefault();
    if (!league) return;
    setSaving(true);
    setError(null);
    try {
      const { league: nextLeague } = await updateLeague({ leagueId: league.id, name: editName, description: editDescription });
      setLeague(nextLeague);
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateEvent(event: FormEvent) {
    event.preventDefault();
    if (!league) return;
    const rankShares = eventForm.rankShares.map((share) => Number(share));
    if (eventForm.payoutCurve === 'custom_top3' && rankShares.reduce((sum, share) => sum + share, 0) !== 100) {
      setError(t('ui.sharesMustTotal100'));
      return;
    }

    setSavingEvent(true);
    setError(null);
    try {
      await createLeagueEvent({
        leagueId: league.id,
        name: eventForm.name,
        startsAt: new Date(eventForm.startsAt).toISOString(),
        endsAt: new Date(eventForm.endsAt).toISOString(),
        minStake: Number(eventForm.minStake),
        maxStake: Number(eventForm.maxStake),
        payoutCurve: eventForm.payoutCurve,
        rankShares,
      });
      setEventForm(defaultEventForm);
      setShowCreateEvent(false);
      loadLeague();
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setSavingEvent(false);
    }
  }

  async function handleRequestAction(requestUserId: string, action: 'approve' | 'reject') {
    if (!league) return;
    setError(null);
    try {
      if (action === 'approve') await approveJoinRequest({ leagueId: league.id, requestUserId });
      else await rejectJoinRequest({ leagueId: league.id, requestUserId });
      loadLeague();
      setJoinRequests((requests) => requests.filter((request) => request.user_id !== requestUserId));
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    }
  }

  async function handleKickMember(userId: string) {
    if (!league) return;
    setError(null);
    try {
      await kickLeagueMember({ leagueId: league.id, userId });
      loadLeague();
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    }
  }

  async function handleEnterEvent(event: LeagueEventRow) {
    const stake = Number(stakeByEventId[event.id] || event.min_stake);
    setEnteringEventId(event.id);
    setError(null);
    try {
      await enterLeagueEvent({ eventId: event.id, stake });
      loadLeague();
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setEnteringEventId(null);
    }
  }

  async function handleSettleEvent(eventId: string) {
    setSettlingEventId(eventId);
    setError(null);
    try {
      await settleLeagueEvent({ eventId });
      loadLeague();
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setSettlingEventId(null);
    }
  }

  async function handleCancelEvent(eventId: string) {
    setCancellingEventId(eventId);
    setError(null);
    try {
      await cancelLeagueEvent({ eventId });
      loadLeague();
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setCancellingEventId(null);
    }
  }

  function renderEventCard(event: LeagueEventRow) {
    const rows = eventStandings[event.id] ?? [];
    const eventMatches = event.event_type === 'matchday' && event.matchday !== null ? matchesByMatchday.get(event.matchday) ?? [] : [];
    const alreadyEntered = rows.some((row) => row.user_id === user?.id);
    const enterable = isEventEnterable(event);
    const statusClass = event.status === 'cancelled' ? 'bg-c5' : event.status === 'locked' ? 'bg-c4' : event.status === 'settled' ? 'bg-c3' : 'bg-card';

    return (
      <div key={event.id} className={`border-4 border-main ${event.status === 'cancelled' ? 'bg-muted opacity-80' : 'bg-page'} rounded-sm overflow-hidden flex flex-col`}>
        <div className="p-3 border-b-4 border-main bg-card flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-black uppercase text-[10px] text-subtle tracking-wider">{getEventTypeLabel(event, t)}</div>
            <div className="font-black uppercase text-lg truncate">{event.name}</div>
            <div className="font-bold text-[10px] text-subtle uppercase">{formatDate(event.starts_at)} - {formatDate(event.ends_at)}</div>
            <div className="mt-1 inline-flex bg-c1 border-2 border-main px-2 py-0.5 font-black uppercase text-[9px]">{getPayoutCurveLabel(event.payout_curve, t)}</div>
          </div>
          <div className="bg-c3 border-2 border-main px-2 py-1 font-black text-xs whitespace-nowrap">{event.prize_pool} {t('ui.pointsShort')}</div>
        </div>
        <div className="p-3 grid grid-cols-3 border-b-2 border-main text-xs font-bold">
          <div><div className="font-black uppercase text-[9px] text-subtle">{t('ui.prizePoolPoints')}</div>{event.prize_pool}</div>
          <div><div className="font-black uppercase text-[9px] text-subtle">{t('ui.stakePoints')}</div>{event.min_stake}-{event.max_stake}</div>
          <div><div className="font-black uppercase text-[9px] text-subtle">{t('ui.status')}</div><span className={`${statusClass} border-2 border-main px-1 font-black uppercase text-[10px]`}>{getEventStatusLabel(event.status, t)}</span></div>
        </div>
        {eventMatches.length > 0 && (
          <div className="p-3 border-b-2 border-main bg-card flex flex-col gap-2">
            <div className="font-black uppercase text-[10px] text-subtle tracking-wider">{eventMatches.length} {t('ui.matches')}</div>
            <div className="grid grid-cols-1 gap-1.5">
              {eventMatches.map((match) => (
                <Link key={match.id} to={`/matches/${match.id}`} className="grid grid-cols-[64px_1fr] items-center gap-2 border-2 border-line bg-page px-2 py-1.5 text-[10px] font-black uppercase hover:bg-muted rounded-sm">
                  <span className="text-subtle">{formatDate(match.kickoff_at)}</span>
                  <span className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1 min-w-0">
                    <CompactTeam team={teams.get(match.home_team_id)} fallback={match.home_team_id} />
                    <span className="text-subtle">vs</span>
                    <CompactTeam team={teams.get(match.away_team_id)} fallback={match.away_team_id} />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
        {isMember && enterable && (
          <div className="p-3 border-b-2 border-main flex gap-2">
            <input type="number" min={event.min_stake} max={event.max_stake} value={stakeByEventId[event.id] ?? String(event.min_stake)} onChange={(item) => setStakeByEventId((values) => ({ ...values, [event.id]: item.target.value }))} disabled={alreadyEntered} className="bg-card border-2 border-main px-3 py-2 font-black w-24 rounded-sm" />
            <button onClick={() => handleEnterEvent(event)} disabled={alreadyEntered || enteringEventId === event.id} className="bg-c2 text-inv border-2 border-main px-3 py-2 font-black uppercase text-xs flex-1 disabled:opacity-60 rounded-sm">
              {alreadyEntered ? t('ui.alreadyEntered') : enteringEventId === event.id ? t('ui.saving') : t('ui.enterPool')}
            </button>
          </div>
        )}
        {isMember && !enterable && event.status !== 'settled' && event.status !== 'cancelled' && <div className="p-3 border-b-2 border-main font-black uppercase text-xs bg-muted">{t('ui.eventNotOpen')}</div>}
        <div className="flex flex-col bg-card">
          {rows.slice(0, 3).map((row) => (
            <div key={row.user_id} className="grid grid-cols-[44px_1fr_auto] items-center gap-2 p-3 border-b-2 border-line last:border-b-0 text-xs font-bold">
              <div className="font-black text-base">#{row.rank}</div>
              <div className="min-w-0"><div className="font-black uppercase truncate">{getPublicDisplayName(row.profiles, row.user_id)}</div><div className="text-[10px] text-subtle uppercase">{row.stake} {t('ui.pointsShort')} · {row.points} {t('ui.pointsShort')}</div></div>
              <div className="font-black text-right">+{row.payout || 0}</div>
            </div>
          ))}
          {rows.length === 0 && <div className="p-3 font-black uppercase text-xs">{t('ui.noStandings')}</div>}
        </div>
        {isOwner && event.status !== 'settled' && event.status !== 'cancelled' && rows.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 border-t-4 border-main">
            <button onClick={() => handleSettleEvent(event.id)} disabled={settlingEventId === event.id} className="bg-c4 px-3 py-2.5 font-black uppercase text-xs disabled:opacity-60 sm:border-r-4 border-main">
              {settlingEventId === event.id ? t('ui.saving') : t('ui.settleEvent')}
            </button>
            <button onClick={() => handleCancelEvent(event.id)} disabled={cancellingEventId === event.id} className="bg-c5 px-3 py-2.5 font-black uppercase text-xs disabled:opacity-60">
              {cancellingEventId === event.id ? t('ui.saving') : t('ui.cancelAndRefund')}
            </button>
          </div>
        )}
      </div>
    );
  }

  function renderEventSection(title: string, description: string, sectionEvents: LeagueEventRow[]) {
    if (sectionEvents.length === 0) return null;

    return (
      <div className="flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1 border-b-2 border-line pb-2">
          <div>
            <div className="font-black uppercase text-sm text-main">{title}</div>
            <div className="font-bold text-[10px] text-subtle uppercase leading-snug">{description}</div>
          </div>
          <div className="bg-c1 border-2 border-main px-2 py-0.5 font-black uppercase text-[10px] w-fit">{sectionEvents.length}</div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {sectionEvents.map(renderEventCard)}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <AppShell themeControls={themeControls}>
        <div className="relative z-10 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6 min-h-0">
          <div className="bg-card border-4 border-main p-4 lg:p-6 shadow-[8px_8px_0_0_var(--color-shadow)] font-black uppercase">{t('ui.loadingLeague')}</div>
        </div>
      </AppShell>
    );
  }

  if (!league) {
    return (
      <AppShell themeControls={themeControls}>
        <div className="relative z-10 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6 min-h-0">
          <div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col gap-4 shadow-[8px_8px_0_0_var(--color-shadow)] rounded-sm">
            <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter text-main">{t('ui.leagueNotFound')}</h1>
            <div className="p-4 bg-c5 border-2 border-main font-black uppercase text-sm">{error ?? t('ui.leagueUnavailable')}</div>
            <Link to="/leagues" className="inline-flex bg-c2 text-inv font-black uppercase py-3 px-4 border-2 border-main items-center gap-2 w-fit"><ArrowLeft size={16} /> {t('ui.backToLeagues')}</Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell themeControls={themeControls}>
      <div className="relative z-10 flex flex-col p-3 sm:p-4 lg:p-6 gap-3 lg:gap-6 min-h-0">
        <div className="bg-card border-4 border-main p-3 sm:p-4 lg:p-6 flex flex-col gap-3 shadow-[6px_6px_0_0_var(--color-shadow)] lg:shadow-[8px_8px_0_0_var(--color-shadow)] rounded-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Link to="/leagues" className="bg-card hover:bg-muted border-2 border-main p-2 shadow-[3px_3px_0_var(--color-shadow)] shrink-0 rounded-sm"><ArrowLeft size={18} /></Link>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <div className="border-2 border-main bg-c3 px-2.5 py-1 font-black uppercase text-[10px] sm:text-xs">{league.visibility}</div>
                  <div className="border-2 border-main bg-c1 px-2.5 py-1 font-black uppercase text-[10px] sm:text-xs">{league.join_policy}</div>
                  {isOwner && <div className="border-2 border-main bg-c4 px-2.5 py-1 font-black uppercase text-[10px] sm:text-xs">{t('ui.owner')}</div>}
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tighter text-main leading-none truncate">{league.name}</h1>
              </div>
            </div>
          </div>
          <p className="font-bold text-xs sm:text-sm text-subtle leading-snug max-w-3xl">{league.description || t('ui.leagueStandingsBody')}</p>
        </div>

        <div className="bg-card border-4 border-main p-3 sm:p-4 lg:p-6 flex flex-col gap-3 lg:gap-6 shadow-[6px_6px_0_0_var(--color-shadow)] lg:shadow-[8px_8px_0_0_var(--color-shadow)] rounded-sm">
          {error && <div className="bg-c5 border-2 border-main p-3 font-black uppercase text-xs rounded-sm">{error}</div>}

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-3 lg:gap-4">
            <div className="border-4 border-main bg-card p-3 sm:p-4 flex flex-col gap-3 rounded-sm">
              <div className="font-black uppercase text-sm sm:text-base text-main">{isMember ? t('ui.joined') : t('ui.joinLeague')}</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 border-2 border-main text-xs font-bold rounded-sm overflow-hidden">
                <div className="p-2.5 border-r-2 border-b-2 sm:border-b-0 border-main bg-c1"><div className="font-black uppercase text-[9px] text-subtle">{t('ui.members')}</div>{league.member_count.toLocaleString()}</div>
                <div className="p-2.5 border-b-2 sm:border-b-0 sm:border-r-2 border-main bg-c2 text-inv"><div className="font-black uppercase text-[9px] opacity-80">{t('ui.scoring')}</div>{t('ui.postJoinScoring')}</div>
                <div className="p-2.5 border-r-2 border-main bg-c3"><div className="font-black uppercase text-[9px] text-subtle">{t('ui.prizeMode')}</div>{t('ui.noCashPrize')}</div>
                <div className="p-2.5 bg-c4"><div className="font-black uppercase text-[9px] text-subtle">{t('ui.creator')}</div><span className="truncate block">{getPublicDisplayName(creator)}</span></div>
              </div>
              {!user && !isMember && (
                <Link to="/login" className="bg-c2 text-inv border-2 border-main px-4 py-3 font-black uppercase text-center text-sm shadow-[3px_3px_0_var(--color-shadow)] rounded-sm">
                  {t('ui.login')}
                </Link>
              )}
              {!isMember && league.visibility === 'public' && user && (
                <button onClick={handleJoin} disabled={joining} className="bg-c2 hover:bg-main text-inv border-2 border-main px-4 py-3 font-black uppercase text-sm shadow-[3px_3px_0_var(--color-shadow)] disabled:opacity-60 rounded-sm">
                  {joining ? t('ui.joiningLeague') : league.join_policy === 'approval' ? t('ui.requestToJoin') : t('ui.joinLeague')}
                </button>
              )}
              {isMember && !isOwner && <div className="bg-c3 border-2 border-main px-4 py-3 font-black uppercase text-sm text-center rounded-sm">{t('ui.joined')}</div>}
              {isOwner && (
                <button onClick={handleCopyInvite} className="bg-c1 border-2 border-main px-4 py-3 font-black uppercase inline-flex items-center justify-center gap-2 text-sm shadow-[3px_3px_0_var(--color-shadow)] rounded-sm">
                  <Copy size={16} /> {copied ? t('ui.inviteLinkCopied') : t('ui.copyInviteLink')}
                </button>
              )}
              <div className="font-bold text-[10px] sm:text-xs text-subtle uppercase leading-snug">{t('ui.postJoinScoringBody')}</div>
            </div>

            <div className="border-4 border-main bg-card rounded-sm overflow-hidden">
              <div className="bg-main text-inv font-black px-3 py-2.5 uppercase tracking-wide text-xs sm:text-sm border-b-4 border-main">{t('ui.leagueInfo')}</div>
              <div className="p-3 bg-card flex flex-col gap-2 text-xs sm:text-sm font-bold">
                <div className="flex justify-between border-b-2 border-line pb-2"><span>{t('ui.visibility')}</span><span className="font-black uppercase">{league.visibility}</span></div>
                <div className="flex justify-between border-b-2 border-line pb-2"><span>{t('ui.joinPolicy')}</span><span className="font-black uppercase">{league.join_policy}</span></div>
                <div className="flex justify-between"><span>{t('ui.created')}</span><span className="font-black">{formatDate(league.created_at)}</span></div>
              </div>
            </div>
          </div>

          {isOwner && league.join_policy === 'approval' && (
            <div className="border-4 border-main bg-card rounded-sm overflow-hidden">
              <div className="bg-main text-inv font-black px-3 sm:px-4 py-2.5 sm:py-3 uppercase tracking-wide text-xs sm:text-sm border-b-4 border-main flex items-center justify-between gap-3">
                <span>{t('ui.pendingRequests')}</span>
                <span className="bg-c1 text-main border-2 border-main px-2 py-0.5 text-[10px]">{joinRequests.length}</span>
              </div>
              {joinRequests.length === 0 && <div className="p-3 font-black uppercase text-xs">{t('ui.noPendingRequests')}</div>}
              {joinRequests.map((request) => (
                <div key={request.user_id} className="p-3 border-b-2 border-line last:border-b-0 grid grid-cols-[1fr_auto] items-center gap-3">
                  <span className="font-black uppercase text-sm truncate">{getPublicDisplayName(request.profiles, request.user_id)}</span>
                  <div className="flex gap-2">
                    <button onClick={() => handleRequestAction(request.user_id, 'approve')} className="bg-c3 border-2 border-main p-2 rounded-sm"><Check size={16} /></button>
                    <button onClick={() => handleRequestAction(request.user_id, 'reject')} className="bg-c5 border-2 border-main p-2 rounded-sm"><X size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-4 border-main bg-card rounded-sm overflow-hidden">
            <div className="bg-main text-inv font-black px-3 sm:px-4 py-2.5 sm:py-3 uppercase tracking-wide text-xs sm:text-sm border-b-4 border-main flex items-center justify-between gap-3">
              <span>{t('ui.miniLeaderboards')}</span>
              {user && <span className="bg-c1 text-main border-2 border-main px-2 py-0.5 text-[10px] inline-flex items-center gap-1">{t('ui.availablePoints')}: {availablePoints ?? t('ui.notSet')} {t('ui.pointsShort')}</span>}
            </div>
            {isOwner && (
              <div className="p-3 sm:p-4 border-b-4 border-main bg-page">
                <button type="button" onClick={() => setShowCreateEvent((value) => !value)} className="bg-c1 border-2 border-main px-3 py-2 font-black uppercase text-xs rounded-sm shadow-[3px_3px_0_var(--color-shadow)]">
                  {t('ui.createCustomEvent')}
                </button>
                {showCreateEvent && (
                  <form onSubmit={handleCreateEvent} className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2 text-xs font-bold">
                    <input required minLength={3} maxLength={64} value={eventForm.name} onChange={(item) => setEventForm((value) => ({ ...value, name: item.target.value }))} placeholder={t('ui.eventName')} className="bg-card border-2 border-main p-2.5 font-bold rounded-sm xl:col-span-2" />
                    <input required type="datetime-local" value={eventForm.startsAt} onChange={(item) => setEventForm((value) => ({ ...value, startsAt: item.target.value }))} className="bg-card border-2 border-main p-2.5 font-bold rounded-sm" aria-label={t('ui.startsAt')} />
                    <input required type="datetime-local" value={eventForm.endsAt} onChange={(item) => setEventForm((value) => ({ ...value, endsAt: item.target.value }))} className="bg-card border-2 border-main p-2.5 font-bold rounded-sm" aria-label={t('ui.endsAt')} />
                    <input required type="number" min={1} value={eventForm.minStake} onChange={(item) => setEventForm((value) => ({ ...value, minStake: item.target.value }))} placeholder={t('ui.minStake')} className="bg-card border-2 border-main p-2.5 font-bold rounded-sm" />
                    <input required type="number" min={1} value={eventForm.maxStake} onChange={(item) => setEventForm((value) => ({ ...value, maxStake: item.target.value }))} placeholder={t('ui.maxStake')} className="bg-card border-2 border-main p-2.5 font-bold rounded-sm" />
                    <select value={eventForm.payoutCurve} onChange={(item) => setEventForm((value) => ({ ...value, payoutCurve: item.target.value as PayoutCurve }))} className="bg-card border-2 border-main p-2.5 font-black rounded-sm md:col-span-2">
                      <option value="balanced_top3">{t('ui.balancedTop3')}</option>
                      <option value="winner_take_all">{t('ui.winnerTakeAll')}</option>
                      <option value="flat_top3">{t('ui.flatTop3')}</option>
                      <option value="custom_top3">{t('ui.customTop3')}</option>
                    </select>
                    {eventForm.payoutCurve === 'custom_top3' && eventForm.rankShares.map((share, index) => (
                      <input key={index} required type="number" min={0} max={100} value={share} onChange={(item) => setEventForm((value) => {
                        const rankShares = [...value.rankShares] as [string, string, string];
                        rankShares[index] = item.target.value;
                        return { ...value, rankShares };
                      })} placeholder={t(`ui.top${index + 1}Share`)} className="bg-card border-2 border-main p-2.5 font-bold rounded-sm" />
                    ))}
                    <button disabled={savingEvent} className="bg-c2 text-inv border-2 border-main px-3 py-2.5 font-black uppercase disabled:opacity-60 rounded-sm md:col-span-2 xl:col-span-4">{savingEvent ? t('ui.saving') : t('ui.createCustomEvent')}</button>
                  </form>
                )}
              </div>
            )}
            {events.length === 0 && <div className="p-4 font-black uppercase text-xs">{t('ui.noStandings')}</div>}
            {events.length > 0 && (
              <div className="p-3 sm:p-4 flex flex-col gap-5">
                {renderEventSection(t('ui.weeklyLeaderboard'), t('ui.weeklyLeaderboardBody'), groupedEvents.weekly)}
                {renderEventSection(t('ui.matchdayLeaderboard'), t('ui.matchdayLeaderboardBody'), groupedEvents.matchday)}
                {renderEventSection(t('ui.createCustomEvent'), t('ui.customLeaderboardBody'), groupedEvents.custom)}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-3 lg:gap-4">
            <div className="border-4 border-main bg-card rounded-sm overflow-hidden min-w-0">
              <div className="bg-main text-inv font-black px-3 sm:px-4 py-2.5 sm:py-3 uppercase tracking-wide text-xs sm:text-sm border-b-4 border-main flex justify-between items-center gap-3">
                <span>{t('ui.standings')}</span>
                <span className="text-[9px] sm:text-[10px] opacity-80 text-right leading-tight">{t('ui.postJoinScoringBody')}</span>
              </div>
              <div className="hidden md:grid grid-cols-[80px_1fr_120px_120px_120px_120px] bg-card border-b-4 border-main font-black uppercase text-[10px] tracking-widest text-subtle">
                <div className="p-3 border-r-2 border-main text-center">{t('ui.rank')}</div><div className="p-3 border-r-2 border-main">{t('ui.player')}</div><div className="p-3 border-r-2 border-main text-center">{t('ui.tier')}</div><div className="p-3 border-r-2 border-main text-center">{t('ui.points')}</div><div className="p-3 border-r-2 border-main text-center">{t('ui.accuracy')}</div><div className="p-3 text-center">{t('ui.streak')}</div>
              </div>
              <div className="bg-card flex flex-col">
                {standings.length === 0 && <div className="p-4 sm:p-6 font-black uppercase text-sm">{t('ui.noStandings')}</div>}
                {standings.map((entry) => (
                  <div key={entry.user_id} className="grid grid-cols-[48px_1fr_auto] md:grid-cols-[80px_1fr_120px_120px_120px_120px] border-b-4 border-main last:border-b-0 font-bold text-xs sm:text-sm hover:bg-muted transition-colors items-center">
                    <div className="p-3 md:border-r-2 border-main font-black text-base sm:text-lg text-center">#{entry.rank}</div>
                    <div className="p-3 md:border-r-2 border-main min-w-0"><div className="font-black uppercase truncate">{getPublicDisplayName(entry.profiles, entry.user_id)}</div><div className="text-[10px] sm:text-xs text-subtle uppercase truncate">{t('ui.previousRank', { rank: entry.previous_rank ?? entry.rank })}</div></div>
                    <div className="hidden md:flex p-3 md:border-r-2 border-main justify-center font-black"><RankBadge points={entry.points} size="sm" showLabel={false} /></div>
                    <div className="p-3 md:border-r-2 border-main text-right md:text-center font-black"><div className="text-base sm:text-lg leading-none">{entry.points}</div><div className="md:hidden text-[9px] uppercase text-subtle mt-1">{t('ui.points')}</div></div>
                    <div className="hidden md:block p-3 md:border-r-2 border-main md:text-center font-black">{entry.accuracy}%</div>
                    <div className="hidden md:block p-3 md:text-center font-black"><StreakBadge streak={entry.streak} size="sm" /></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:gap-4 min-w-0">
              <div className="border-4 border-main bg-card rounded-sm overflow-hidden">
                <div className="bg-main text-inv font-black px-3 sm:px-4 py-2.5 sm:py-3 uppercase tracking-wide text-xs sm:text-sm border-b-4 border-main">{t('ui.membersPreview')}</div>
                <div className="bg-card flex flex-col">
                  {members.map((member) => (
                    <div key={member.user_id} className="p-3 border-b-2 border-line last:border-b-0 grid grid-cols-[1fr_auto] items-center gap-3 font-bold text-xs sm:text-sm">
                      <div className="min-w-0"><div className="font-black uppercase truncate">{getPublicDisplayName(member.profiles, member.user_id)} {member.role === 'owner' ? `· ${t('ui.owner')}` : ''}</div><div className="text-[10px] text-subtle uppercase">{member.profiles?.points ?? 0} {t('ui.pointsShort')}</div></div>
                      {isOwner && member.role !== 'owner' && <button onClick={() => handleKickMember(member.user_id)} className="bg-c5 border-2 border-main p-2 rounded-sm"><UserMinus size={14} /></button>}
                    </div>
                  ))}
                  {members.length === 0 && <div className="p-3 font-black uppercase text-xs">{t('ui.noMembers')}</div>}
                </div>
              </div>

              {isOwner && (
                <form onSubmit={handleSaveLeague} className="border-4 border-main bg-card rounded-sm overflow-hidden flex flex-col">
                  <div className="bg-main text-inv font-black px-3 sm:px-4 py-2.5 sm:py-3 uppercase tracking-wide text-xs sm:text-sm border-b-4 border-main">{t('ui.editLeague')}</div>
                  <div className="p-3 flex flex-col gap-3">
                    <input value={editName} onChange={(event) => setEditName(event.target.value)} className="bg-page border-2 border-main p-2.5 font-bold text-sm rounded-sm" />
                    <textarea value={editDescription} onChange={(event) => setEditDescription(event.target.value)} className="bg-page border-2 border-main p-2.5 font-bold resize-none text-sm rounded-sm" rows={3} />
                    <button disabled={saving} className="bg-c2 text-inv border-2 border-main px-3 py-2.5 font-black uppercase disabled:opacity-60 rounded-sm">{saving ? t('ui.saving') : t('ui.save')}</button>
                  </div>
                </form>
              )}

              <div className="border-4 border-main bg-card rounded-sm overflow-hidden">
                <div className="bg-main text-inv font-black px-3 sm:px-4 py-2.5 sm:py-3 uppercase tracking-wide text-xs sm:text-sm border-b-4 border-main">{t('ui.leagueActivity')}</div>
                <div className="bg-card flex flex-col">
                  {leagueActivity.slice(0, 4).map((item) => (
                    <Link key={item.id} to={item.href ?? '/activity'} className="p-3 sm:p-4 border-b-2 border-line last:border-b-0 hover:bg-muted">
                      <div className="font-black uppercase text-xs sm:text-sm flex items-center gap-2"><Activity size={16} /> {item.title}</div>
                      <div className="font-bold text-[10px] sm:text-xs text-subtle mt-1 leading-snug line-clamp-2">{item.description}</div>
                    </Link>
                  ))}
                  {leagueActivity.length === 0 && <div className="p-4 font-black uppercase text-xs">{t('ui.noLeagueActivity')}</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
