import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { Activity, ArrowLeft, Check, Copy, Crown, Shield, Trophy, UserMinus, Users, X } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import RankBadge from '../components/ui/RankBadge';
import StreakBadge from '../components/ui/StreakBadge';
import { useAuth } from '../lib/auth';
import { listLeagueActivity, type ActivityEventRow } from '../services/activity';
import { listLeagueLeaderboard, type LeaderboardEntryWithProfile } from '../services/leaderboard';
import { approveJoinRequest, getLeague, joinLeague, kickLeagueMember, listLeagueJoinRequests, listLeagueMembers, rejectJoinRequest, updateLeague, type LeagueJoinRequestRow, type LeagueMemberRow, type LeagueRow } from '../services/leagues';
import { getErrorMessage } from '../services/serviceTypes';
import { getCurrentProfile, type ProfileRow } from '../services/profile';
import { getPublicDisplayName } from '../utils/displayName';
import type { ThemeControls } from '../App';

type LeagueDetailProps = {
  themeControls: ThemeControls;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
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
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentMembership = useMemo(() => members.find((member) => member.user_id === user?.id) ?? null, [members, user?.id]);
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
        const [nextStandings, nextCreator, nextMembers, nextActivity] = await Promise.all([
          listLeagueLeaderboard(nextLeague.id).catch(() => []),
          nextLeague.creator_id ? getCurrentProfile(nextLeague.creator_id).catch(() => null) : Promise.resolve(null),
          listLeagueMembers(nextLeague.id).catch(() => []),
          listLeagueActivity(nextLeague.id).catch(() => []),
        ]);
        setLeague(nextLeague);
        setEditName(nextLeague.name);
        setEditDescription(nextLeague.description);
        setStandings(nextStandings);
        setCreator(nextCreator);
        setMembers(nextMembers);
        setLeagueActivity(nextActivity);
      })
      .catch((nextError) => {
        setError(getErrorMessage(nextError));
        setLeague(null);
        setStandings([]);
        setMembers([]);
        setLeagueActivity([]);
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

  if (loading) {
    return (
      <AppShell themeControls={themeControls}>
        <div className="relative z-10 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6 min-h-0">
          <div className="bg-card border-4 border-main p-4 lg:p-6 shadow-[8px_8px_0_0_var(--color-shadow)] font-black uppercase">{t('ui.loadingLeague')}</div>
        </div>
      </AppShell>
    );
  }

  if (error || !league) {
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
