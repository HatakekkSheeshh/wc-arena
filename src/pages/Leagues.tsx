import { Link } from 'react-router-dom';
import { Crown, LockKeyhole, Shield, Trophy, Users } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import PageHero from '../components/ui/PageHero';
import Panel from '../components/ui/Panel';
import StatCard from '../components/ui/StatCard';
import { mockLeaderboard } from '../data/mockLeaderboard';
import { mockLeagues } from '../data/mockLeagues';
import { getUserById } from '../data/mockUsers';
import type { ThemeControls } from '../App';

type LeaguesProps = {
  themeControls: ThemeControls;
};

export default function Leagues({ themeControls }: LeaguesProps) {
  const totalMembers = mockLeagues.reduce((sum, league) => sum + league.memberCount, 0);
  const privateCount = mockLeagues.filter((league) => league.visibility === 'private').length;
  const topEntry = mockLeaderboard[0];
  const topUser = topEntry ? getUserById(topEntry.userId) : undefined;

  return (
    <AppShell themeControls={themeControls}>
      <div className="relative z-10 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6 bg-page flex-1">
        <PageHero title="Leagues" description="Compete in public arenas and private friend groups with global scoring and skill-based standings." />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
          <StatCard label="Active Leagues" value={mockLeagues.length} subtitle="Mock contests" tone="blue" icon={<Trophy size={34} strokeWidth={2.5} />} />
          <StatCard label="Members" value={totalMembers.toLocaleString()} subtitle="Across leagues" tone="lime" icon={<Users size={34} strokeWidth={2.5} />} />
          <StatCard label="Private" value={privateCount} subtitle="Invite-only" tone="green" icon={<LockKeyhole size={34} strokeWidth={2.5} />} />
          <StatCard label="Leader" value={topUser?.username ?? '—'} subtitle={`${topEntry?.points ?? 0} pts`} tone="orange" icon={<Crown size={34} strokeWidth={2.5} />} />
        </div>

        <Panel title="League Directory">
          <div className="p-4 bg-card grid grid-cols-1 lg:grid-cols-2 gap-4">
            {mockLeagues.map((league) => (
              <article key={league.id} className="border-4 border-main bg-page shadow-[4px_4px_0_var(--color-shadow)] flex flex-col">
                <div className="p-5 border-b-4 border-main flex items-start justify-between gap-4">
                  <div>
                    <div className="font-black uppercase text-3xl tracking-tighter">{league.name}</div>
                    <div className="font-bold uppercase text-xs text-subtle mt-1">/{league.slug}</div>
                  </div>
                  <div className="bg-c1 border-2 border-main px-3 py-1 font-black uppercase text-[10px] shadow-[2px_2px_0_var(--color-shadow)]">{league.visibility}</div>
                </div>
                <div className="p-4 grid grid-cols-2 gap-3 font-bold text-sm">
                  <div className="border-2 border-main bg-card p-3"><div className="font-black uppercase text-[10px] text-subtle">Members</div>{league.memberCount.toLocaleString()}</div>
                  <div className="border-2 border-main bg-card p-3"><div className="font-black uppercase text-[10px] text-subtle">Scoring</div>{league.scoringMode}</div>
                  <div className="border-2 border-main bg-card p-3"><div className="font-black uppercase text-[10px] text-subtle">Prize Mode</div>{league.prizeMode}</div>
                  <div className="border-2 border-main bg-card p-3"><div className="font-black uppercase text-[10px] text-subtle">Invite</div>{league.inviteCode}</div>
                </div>
                <div className="p-4 pt-0 flex gap-3 mt-auto">
                  <Link to={`/leagues/${league.id}`} className="flex-1 bg-c2 text-inv font-black uppercase py-3 px-4 border-2 border-main shadow-[3px_3px_0_var(--color-shadow)] text-center text-xs">View League</Link>
                </div>
              </article>
            ))}
          </div>
        </Panel>

        <div className="border-4 border-main bg-c1 p-4 shadow-[4px_4px_0_var(--color-shadow)] font-black uppercase text-xs leading-relaxed flex items-center gap-3">
          <Shield size={22} /> Leagues use contest standings and symbolic or sponsor-backed rewards only; no wagering or odds are part of this flow.
        </div>
      </div>
    </AppShell>
  );
}
