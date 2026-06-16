import { Link, useParams } from 'react-router-dom';
import { Activity, ArrowLeft, Crown, Shield, Trophy, Users } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import PageHero from '../components/ui/PageHero';
import Panel from '../components/ui/Panel';
import StatCard from '../components/ui/StatCard';
import { mockActivity } from '../data/mockActivity';
import { mockLeaderboard } from '../data/mockLeaderboard';
import { mockLeagues } from '../data/mockLeagues';
import { getUserById, mockUsers } from '../data/mockUsers';
import type { ThemeControls } from '../App';

type LeagueDetailProps = {
  themeControls: ThemeControls;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

export default function LeagueDetail({ themeControls }: LeagueDetailProps) {
  const { leagueId } = useParams();
  const league = mockLeagues.find((item) => item.id === leagueId);

  if (!league) {
    return (
      <AppShell themeControls={themeControls}>
        <div className="relative z-10 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6 bg-page flex-1">
          <PageHero title="League Not Found" description="This league is not available in the current mock data." />
          <Panel>
            <div className="p-6 bg-card"><Link to="/leagues" className="bg-c2 text-inv font-black uppercase py-3 px-4 border-2 border-main shadow-[3px_3px_0_var(--color-shadow)]">Back to Leagues</Link></div>
          </Panel>
        </div>
      </AppShell>
    );
  }

  const creator = getUserById(league.creatorId);
  const leagueActivity = mockActivity.filter((item) => item.leagueId === league.id || league.id === 'league-global');

  return (
    <AppShell themeControls={themeControls}>
      <div className="relative z-10 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6 bg-page flex-1">
        <PageHero title={league.name} description="League standings, members, and recent contest activity.">
          <Link to="/leagues" className="bg-card hover:bg-muted text-main font-black uppercase py-3 px-4 border-2 border-main shadow-[3px_3px_0_var(--color-shadow)] text-xs flex items-center gap-2"><ArrowLeft size={16} /> All Leagues</Link>
        </PageHero>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
          <StatCard label="Members" value={league.memberCount.toLocaleString()} subtitle={league.visibility} tone="blue" icon={<Users size={34} strokeWidth={2.5} />} />
          <StatCard label="Scoring" value={league.scoringMode} subtitle="Ruleset" tone="lime" icon={<Trophy size={34} strokeWidth={2.5} />} />
          <StatCard label="Prize Mode" value={league.prizeMode} subtitle="Contest-safe" tone="green" icon={<Shield size={34} strokeWidth={2.5} />} />
          <StatCard label="Creator" value={creator?.username ?? '—'} subtitle={formatDate(league.createdAt)} tone="orange" icon={<Crown size={34} strokeWidth={2.5} />} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-4 lg:gap-6 items-start">
          <Panel title="Standings" className="overflow-hidden">
            <div className="hidden md:grid grid-cols-[80px_1fr_120px_120px_120px] bg-card border-b-4 border-main font-black uppercase text-[10px] tracking-widest text-subtle">
              <div className="p-3 border-r-2 border-main text-center">Rank</div>
              <div className="p-3 border-r-2 border-main">Player</div>
              <div className="p-3 border-r-2 border-main text-center">Points</div>
              <div className="p-3 border-r-2 border-main text-center">Accuracy</div>
              <div className="p-3 text-center">Streak</div>
            </div>
            <div className="bg-card flex flex-col">
              {mockLeaderboard.map((entry) => {
                const user = getUserById(entry.userId);
                return (
                  <div key={entry.userId} className="grid grid-cols-1 md:grid-cols-[80px_1fr_120px_120px_120px] border-b-2 border-line last:border-b-0 font-bold text-sm hover:bg-muted">
                    <div className="p-3 md:border-r-2 border-main font-black text-lg md:text-center">#{entry.rank}</div>
                    <div className="p-3 md:border-r-2 border-main"><div className="font-black uppercase">{user?.username ?? entry.userId}</div><div className="text-xs text-subtle uppercase">Previous #{entry.previousRank ?? entry.rank}</div></div>
                    <div className="p-3 md:border-r-2 border-main md:text-center font-black">{entry.points}</div>
                    <div className="p-3 md:border-r-2 border-main md:text-center font-black">{entry.accuracy}%</div>
                    <div className="p-3 md:text-center font-black">{entry.streak}</div>
                  </div>
                );
              })}
            </div>
          </Panel>

          <div className="flex flex-col gap-4">
            <Panel title="League Info">
              <div className="p-4 bg-card flex flex-col gap-3 font-bold text-sm">
                <div className="flex justify-between border-b-2 border-line pb-2"><span>Invite code</span><span className="font-black">{league.inviteCode}</span></div>
                <div className="flex justify-between border-b-2 border-line pb-2"><span>Visibility</span><span className="font-black uppercase">{league.visibility}</span></div>
                <div className="flex justify-between border-b-2 border-line pb-2"><span>Prize mode</span><span className="font-black uppercase">{league.prizeMode}</span></div>
                <div className="flex justify-between"><span>Created</span><span className="font-black">{formatDate(league.createdAt)}</span></div>
              </div>
            </Panel>

            <Panel title="Members Preview">
              <div className="p-3 bg-card flex flex-col gap-2">
                {mockUsers.map((user) => (
                  <div key={user.id} className="border-2 border-line p-2 flex items-center justify-between font-bold text-sm">
                    <span className="font-black uppercase">{user.username}</span>
                    <span>{user.points} pts</span>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="League Activity">
              <div className="p-3 bg-card flex flex-col gap-2">
                {leagueActivity.slice(0, 4).map((item) => (
                  <Link key={item.id} to={item.href ?? '/activity'} className="border-2 border-main p-3 hover:bg-muted shadow-[2px_2px_0_var(--color-shadow)]">
                    <div className="font-black uppercase text-sm flex items-center gap-2"><Activity size={16} /> {item.title}</div>
                    <div className="font-bold text-xs text-subtle mt-1">{item.description}</div>
                  </Link>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
