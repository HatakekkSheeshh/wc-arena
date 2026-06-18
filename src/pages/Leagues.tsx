import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown, LockKeyhole, Shield, Trophy, Users } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import { listGlobalLeaderboard, type LeaderboardEntryWithProfile } from '../services/leaderboard';
import { listLeagues, type LeagueRow } from '../services/leagues';
import { getErrorMessage } from '../services/serviceTypes';
import type { ThemeControls } from '../App';

type LeaguesProps = {
  themeControls: ThemeControls;
};

export default function Leagues({ themeControls }: LeaguesProps) {
  const [leagues, setLeagues] = useState<LeagueRow[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntryWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([listLeagues(), listGlobalLeaderboard()])
      .then(([nextLeagues, nextLeaderboard]) => {
        if (!active) return;
        setLeagues(nextLeagues);
        setLeaderboard(nextLeaderboard);
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

  const totalMembers = leagues.reduce((sum, league) => sum + league.member_count, 0);
  const privateCount = leagues.filter((league) => league.visibility === 'private').length;
  const publicCount = leagues.length - privateCount;
  const topEntry = leaderboard[0];
  const topUsername = topEntry?.profiles?.username;

  return (
    <AppShell themeControls={themeControls}>
      <div className="relative z-10 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6 min-h-0">
        <div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col w-full xl:w-1/2 shadow-[8px_8px_0_0_var(--color-shadow)]">
          <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-1 text-main">
            Leagues
          </h1>
        </div>

        <div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col gap-4 lg:gap-6 shadow-[8px_8px_0_0_var(--color-shadow)] rounded-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 border-b-4 border-main">
            <div className="flex items-center gap-4 border-b-4 sm:border-r-4 xl:border-b-0 border-main p-4 lg:p-5 bg-c1 text-main">
              <div className="shrink-0"><Trophy size={36} strokeWidth={2.5} /></div>
              <div className="flex flex-col justify-center">
                <div className="text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">Active Leagues</div>
                <div className="text-2xl sm:text-3xl font-black leading-none">{leagues.length}</div>
                <div className="text-[10px] font-bold uppercase mt-1">Live contests</div>
              </div>
            </div>
            <div className="flex items-center gap-4 border-b-4 xl:border-b-0 xl:border-r-4 border-main p-4 lg:p-5 bg-c2 text-inv">
              <div className="shrink-0"><Users size={36} strokeWidth={2.5} /></div>
              <div className="flex flex-col justify-center">
                <div className="text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">Members</div>
                <div className="text-2xl sm:text-3xl font-black leading-none">{totalMembers.toLocaleString()}</div>
                <div className="text-[10px] font-bold uppercase mt-1">Across leagues</div>
              </div>
            </div>
            <div className="flex items-center gap-4 border-b-4 sm:border-b-0 sm:border-r-4 border-main p-4 lg:p-5 bg-c3 text-main">
              <div className="shrink-0"><LockKeyhole size={36} strokeWidth={2.5} /></div>
              <div className="flex flex-col justify-center">
                <div className="text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">Private</div>
                <div className="text-2xl sm:text-3xl font-black leading-none">{privateCount}</div>
                <div className="text-[10px] font-bold uppercase mt-1">Invite-only</div>
              </div>
            </div>
            <div className="flex items-center gap-4 border-main p-4 lg:p-5 bg-c4 text-main">
              <div className="shrink-0"><Crown size={36} strokeWidth={2.5} /></div>
              <div className="flex flex-col justify-center">
                <div className="text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">Leader</div>
                <div className="text-2xl sm:text-3xl font-black leading-none">{topUsername ?? '—'}</div>
                <div className="text-[10px] font-bold uppercase mt-1">{topEntry?.points ?? 0} pts</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row flex-1">
            <div className="flex-1 border-r-0 xl:border-r-4 border-main flex flex-col bg-card min-w-0">
              <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm border-b-4 border-main">
                League Directory
              </div>
              <div className="flex flex-col bg-card">
                {loading && <div className="p-6 font-black uppercase text-sm">Loading leagues...</div>}
                {error && <div className="p-6 font-black uppercase text-sm bg-c5 text-main border-b-4 border-main">{error}</div>}
                {!loading && !error && leagues.length === 0 && <div className="p-6 font-black uppercase text-sm">No leagues available.</div>}
                {!loading && !error && leagues.map((league) => (
                  <article key={league.id} className="grid grid-cols-1 lg:grid-cols-[1fr_260px] border-b-4 border-main last:border-b-0 hover:bg-muted transition-colors">
                    <div className="p-4 lg:p-5 lg:border-r-2 border-main flex flex-col gap-4">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                        <div>
                          <div className="font-black uppercase text-2xl lg:text-3xl tracking-tighter text-main">{league.name}</div>
                          <div className="font-bold uppercase text-xs text-subtle mt-1">/{league.slug}</div>
                        </div>
                        <div className="bg-c1 border-2 border-main px-3 py-1 font-black uppercase text-[10px] w-fit">{league.visibility}</div>
                      </div>
                      <div className="grid grid-cols-2 lg:grid-cols-4 border-2 border-main text-sm font-bold">
                        <div className="p-3 border-r-2 border-b-2 lg:border-b-0 border-main">
                          <div className="font-black uppercase text-[10px] text-subtle">Members</div>
                          {league.member_count.toLocaleString()}
                        </div>
                        <div className="p-3 lg:border-r-2 border-b-2 lg:border-b-0 border-main">
                          <div className="font-black uppercase text-[10px] text-subtle">Scoring</div>
                          {league.scoring_mode}
                        </div>
                        <div className="p-3 border-r-2 border-main">
                          <div className="font-black uppercase text-[10px] text-subtle">Prize Mode</div>
                          {league.prize_mode}
                        </div>
                        <div className="p-3">
                          <div className="font-black uppercase text-[10px] text-subtle">Invite</div>
                          {league.invite_code}
                        </div>
                      </div>
                    </div>
                    <div className="p-4 lg:p-5 flex flex-col justify-center gap-3 bg-muted">
                      <div className="font-black uppercase text-[10px] tracking-widest text-subtle">Contest Group</div>
                      <div className="font-bold text-sm leading-snug text-main">Compete with global scoring and skill-based standings.</div>
                      <Link to={`/leagues/${league.id}`} className="bg-c2 hover:bg-main text-inv font-black uppercase py-3 px-4 border-2 border-main text-center text-xs transition-colors">
                        View League
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="w-full xl:w-[360px] bg-card flex flex-col">
              <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm border-b-4 border-main">
                League Snapshot
              </div>
              <div className="p-4 bg-card flex flex-col gap-3 text-sm font-bold border-b-4 border-main">
                <div className="flex justify-between border-b-2 border-line pb-2"><span>Public Leagues</span><span className="font-black">{publicCount}</span></div>
                <div className="flex justify-between border-b-2 border-line pb-2"><span>Private Leagues</span><span className="font-black">{privateCount}</span></div>
                <div className="flex justify-between"><span>Total Members</span><span className="font-black">{totalMembers.toLocaleString()}</span></div>
              </div>

              <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm border-b-4 border-main">
                Top Player
              </div>
              <div className="p-4 bg-c1 text-main font-black uppercase border-b-4 border-main">
                <div className="text-3xl tracking-tighter">{topUsername ?? '—'}</div>
                <div className="text-xs mt-1 opacity-80">{topEntry?.points ?? 0} points on the global board</div>
              </div>

              <div className="flex-1 bg-card flex flex-col">
                <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm border-b-4 border-main">
                  Integrity Note
                </div>
                <div className="p-4 bg-c3 text-main font-black uppercase text-xs leading-relaxed flex items-start gap-3 flex-1">
                  <Shield size={22} className="shrink-0" />
                  <span>Leagues use contest standings and symbolic or sponsor-backed rewards for free-to-play competition.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
