import { FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Crown, LockKeyhole, Plus, Shield, Trophy, Users } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import { useAuth } from '../lib/auth';
import { listGlobalLeaderboard, type LeaderboardEntryWithProfile } from '../services/leaderboard';
import { joinLeague, listCurrentUserLeagueMemberships, listLeagues, type LeagueRow } from '../services/leagues';
import { getErrorMessage } from '../services/serviceTypes';
import { getPublicDisplayName } from '../utils/displayName';
import type { ThemeControls } from '../App';

type LeaguesProps = {
  themeControls: ThemeControls;
};

export default function Leagues({ themeControls }: LeaguesProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [leagues, setLeagues] = useState<LeagueRow[]>([]);
  const [membershipLeagueIds, setMembershipLeagueIds] = useState<Set<string>>(new Set());
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntryWithProfile[]>([]);
  const [inviteCode, setInviteCode] = useState('');
  const [joiningLeagueId, setJoiningLeagueId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([
      listLeagues(),
      listGlobalLeaderboard(),
      user ? listCurrentUserLeagueMemberships().catch(() => []) : Promise.resolve([]),
    ])
      .then(([nextLeagues, nextLeaderboard, nextMemberships]) => {
        if (!active) return;
        setLeagues(nextLeagues);
        setLeaderboard(nextLeaderboard);
        setMembershipLeagueIds(new Set(nextMemberships.map((membership) => membership.league_id)));
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
  }, [user]);

  async function handleJoinByCode(event: FormEvent) {
    event.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!inviteCode.trim()) return;
    navigate(`/leagues/join/${inviteCode.trim().toUpperCase()}`);
  }

  async function handleJoinPublicLeague(league: LeagueRow) {
    if (!user) {
      navigate('/login');
      return;
    }

    setJoiningLeagueId(league.id);
    setError(null);
    try {
      const result = await joinLeague({ leagueId: league.id });
      if (result.status === 'pending') {
        setMembershipLeagueIds(new Set(membershipLeagueIds));
      } else {
        setMembershipLeagueIds(new Set([...membershipLeagueIds, league.id]));
      }
      navigate(`/leagues/${league.slug}`);
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setJoiningLeagueId(null);
    }
  }

  const totalMembers = leagues.reduce((sum, league) => sum + league.member_count, 0);
  const privateCount = leagues.filter((league) => league.visibility === 'private').length;
  const publicCount = leagues.length - privateCount;
  const topEntry = leaderboard[0];
  const topUsername = topEntry ? getPublicDisplayName(topEntry.profiles, topEntry.user_id) : null;

  return (
    <AppShell themeControls={themeControls}>
      <div className="relative z-10 flex flex-col p-3 sm:p-4 lg:p-6 gap-3 lg:gap-6 min-h-0">
        <div className="bg-card border-4 border-main p-3 sm:p-4 lg:p-6 flex flex-col w-full xl:w-1/2 shadow-[6px_6px_0_0_var(--color-shadow)] lg:shadow-[8px_8px_0_0_var(--color-shadow)]">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-1 text-main leading-none">
            {t('ui.leagues')}
          </h1>
          <p className="font-bold text-sm text-subtle max-w-xl">{t('ui.leaguesHubBody')}</p>
        </div>

        <div className="bg-card border-4 border-main p-3 sm:p-4 lg:p-6 flex flex-col gap-3 lg:gap-6 shadow-[6px_6px_0_0_var(--color-shadow)] lg:shadow-[8px_8px_0_0_var(--color-shadow)] rounded-sm">
          <div className="grid grid-cols-2 xl:grid-cols-4 border-b-4 border-main">
            <div className="flex items-center gap-2 sm:gap-4 border-b-4 border-r-4 xl:border-b-0 border-main p-2.5 sm:p-4 lg:p-5 bg-c1 text-main min-w-0">
              <Trophy size={24} className="sm:w-9 sm:h-9 shrink-0" strokeWidth={2.5} />
              <div className="min-w-0"><div className="text-[9px] sm:text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90 truncate">{t('ui.activeLeagues')}</div><div className="text-lg sm:text-3xl font-black leading-none">{leagues.length}</div></div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 border-b-4 xl:border-b-0 xl:border-r-4 border-main p-2.5 sm:p-4 lg:p-5 bg-c2 text-inv min-w-0">
              <Users size={24} className="sm:w-9 sm:h-9 shrink-0" strokeWidth={2.5} />
              <div className="min-w-0"><div className="text-[9px] sm:text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90 truncate">{t('ui.members')}</div><div className="text-lg sm:text-3xl font-black leading-none">{totalMembers.toLocaleString()}</div></div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 border-r-4 xl:border-r-4 border-main p-2.5 sm:p-4 lg:p-5 bg-c3 text-main min-w-0">
              <LockKeyhole size={24} className="sm:w-9 sm:h-9 shrink-0" strokeWidth={2.5} />
              <div className="min-w-0"><div className="text-[9px] sm:text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90 truncate">{t('ui.privateLabel')}</div><div className="text-lg sm:text-3xl font-black leading-none">{privateCount}</div></div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 border-main p-2.5 sm:p-4 lg:p-5 bg-c4 text-main min-w-0">
              <Crown size={24} className="sm:w-9 sm:h-9 shrink-0" strokeWidth={2.5} />
              <div className="min-w-0"><div className="text-[9px] sm:text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90 truncate">{t('ui.leader')}</div><div className="text-lg sm:text-3xl font-black leading-none truncate">{topUsername ?? '—'}</div></div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
            <div className="border-4 border-main bg-card min-w-0">
              <div className="bg-main text-inv font-black px-3 sm:px-4 py-2.5 sm:py-3 uppercase tracking-wide text-xs sm:text-sm border-b-4 border-main flex items-center justify-between gap-3">
                <span>{t('ui.leagueDirectory')}</span>
                <Link to="/leagues/create" className="bg-c1 text-main border-2 border-main px-3 py-1 inline-flex items-center gap-2"><Plus size={14} /> {t('ui.createLeague')}</Link>
              </div>
              <div className="flex flex-col bg-card">
                {loading && <div className="p-6 font-black uppercase text-sm">{t('ui.loadingLeague')}</div>}
                {error && <div className="p-6 font-black uppercase text-sm bg-c5 text-main border-b-4 border-main">{error}</div>}
                {!loading && !error && leagues.length === 0 && <div className="p-6 font-black uppercase text-sm">{t('ui.noLeagues')}</div>}
                {!loading && !error && leagues.map((league) => {
                  const isMember = membershipLeagueIds.has(league.id);
                  return (
                    <article key={league.id} className="grid grid-cols-1 lg:grid-cols-[1fr_220px] border-b-4 border-main last:border-b-0 hover:bg-muted transition-colors">
                      <div className="p-3 sm:p-4 lg:p-5 lg:border-r-2 border-main flex flex-col gap-3 sm:gap-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-black uppercase text-xl sm:text-2xl lg:text-3xl tracking-tighter text-main leading-none truncate">{league.name}</div>
                            <div className="font-bold uppercase text-[10px] sm:text-xs text-subtle mt-1 truncate">/{league.slug}</div>
                            {league.description && <div className="font-bold text-xs text-subtle mt-2 line-clamp-2 normal-case">{league.description}</div>}
                          </div>
                          <div className="bg-c1 border-2 border-main px-2.5 sm:px-3 py-1 font-black uppercase text-[9px] sm:text-[10px] w-fit shrink-0">{league.visibility}</div>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 border-2 border-main text-xs sm:text-sm font-bold overflow-hidden">
                          <div className="p-2.5 sm:p-3 border-r-2 border-b-2 lg:border-b-0 border-main"><div className="font-black uppercase text-[9px] sm:text-[10px] text-subtle">{t('ui.members')}</div>{league.member_count.toLocaleString()}</div>
                          <div className="p-2.5 sm:p-3 lg:border-r-2 border-b-2 lg:border-b-0 border-main"><div className="font-black uppercase text-[9px] sm:text-[10px] text-subtle">{t('ui.scoring')}</div>{t('ui.postJoinScoring')}</div>
                          <div className="p-2.5 sm:p-3 border-r-2 border-main"><div className="font-black uppercase text-[9px] sm:text-[10px] text-subtle">{t('ui.joinPolicy')}</div>{league.join_policy}</div>
                          <div className="p-2.5 sm:p-3"><div className="font-black uppercase text-[9px] sm:text-[10px] text-subtle">{t('ui.recognitionMode')}</div>{t('ui.noCashPrize')}</div>
                        </div>
                      </div>
                      <div className="p-3 sm:p-4 lg:p-5 flex lg:flex-col justify-center gap-3 bg-muted">
                        <Link to={`/leagues/${league.slug}`} className="flex-1 bg-c2 hover:bg-main text-inv font-black uppercase py-3 px-4 border-2 border-main text-center text-xs transition-colors">
                          {t('ui.viewLeague')}
                        </Link>
                        {!isMember && league.visibility === 'public' && (
                          <button onClick={() => handleJoinPublicLeague(league)} disabled={joiningLeagueId === league.id} className="flex-1 bg-card hover:bg-c1 text-main font-black uppercase py-3 px-4 border-2 border-main text-center text-xs transition-colors disabled:opacity-60">
                            {joiningLeagueId === league.id ? t('ui.joiningLeague') : league.join_policy === 'approval' ? t('ui.requestToJoin') : t('ui.joinLeague')}
                          </button>
                        )}
                        {isMember && <div className="flex-1 bg-c3 border-2 border-main py-3 px-4 text-center text-xs font-black uppercase">{t('ui.joined')}</div>}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            <div className="bg-card border-4 border-main flex flex-col">
              <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm border-b-4 border-main">
                {t('ui.joinByCode')}
              </div>
              <form onSubmit={handleJoinByCode} className="p-4 bg-card flex flex-col gap-3 border-b-4 border-main">
                <input value={inviteCode} onChange={(event) => setInviteCode(event.target.value)} className="bg-page border-2 border-main p-3 font-black uppercase outline-none" placeholder={t('ui.inviteCode')} />
                <button className="bg-c2 text-inv border-2 border-main px-4 py-3 font-black uppercase">{t('ui.joinLeague')}</button>
              </form>
              <div className="p-4 bg-c3 text-main font-black uppercase text-xs leading-relaxed flex items-start gap-3 flex-1">
                <Shield size={22} className="shrink-0" />
                <span>{t('ui.leagueSafetyBody', { publicCount, privateCount })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
