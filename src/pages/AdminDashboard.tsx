import { Link } from 'react-router-dom';
import { AlertTriangle, ClipboardCheck, Lock, Radar, ShieldCheck, Trophy, Users } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import PageHero from '../components/ui/PageHero';
import Panel from '../components/ui/Panel';
import StatCard from '../components/ui/StatCard';
import { mockAdminAuditLogs, mockSuspiciousUserSignals } from '../data/mockAdmin';
import { mockLeaderboard } from '../data/mockLeaderboard';
import { mockMatches } from '../data/mockMatches';
import { mockPredictions } from '../data/mockPredictions';
import { mockRewards } from '../data/mockRewards';
import { getTeamById } from '../data/mockTeams';
import { getUserById } from '../data/mockUsers';
import type { ThemeControls } from '../App';
import type { Match } from '../types/domain';

type AdminDashboardProps = {
  themeControls: ThemeControls;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function getMatchLabel(match: Match) {
  const homeTeam = getTeamById(match.homeTeamId);
  const awayTeam = getTeamById(match.awayTeamId);
  return `${homeTeam?.shortName ?? match.homeTeamId} vs ${awayTeam?.shortName ?? match.awayTeamId}`;
}

export default function AdminDashboard({ themeControls }: AdminDashboardProps) {
  const finishedMatches = mockMatches.filter((match) => match.status === 'finished').length;
  const lockedMatches = mockMatches.filter((match) => match.status === 'locked' || match.status === 'live').length;
  const pendingRewards = mockRewards.filter((reward) => reward.status === 'pending').length;
  const recentPredictions = mockPredictions.slice(0, 5);

  return (
    <AppShell themeControls={themeControls}>
      <div className="relative z-10 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6 bg-page flex-1">
        <PageHero title="Admin Control Room" description="Read-only MVP dashboard for match operations, prediction integrity, reward review, and anti-cheat signals.">
          <Link to="/admin/audit" className="bg-c2 text-inv font-black uppercase py-3 px-4 border-2 border-main shadow-[3px_3px_0_var(--color-shadow)] text-xs">View Audit Log</Link>
        </PageHero>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
          <StatCard label="Matches" value={mockMatches.length} subtitle={`${finishedMatches} finished`} tone="blue" icon={<Trophy size={34} strokeWidth={2.5} />} />
          <StatCard label="Predictions" value={mockPredictions.length} subtitle={`${lockedMatches} locked/live matches`} tone="lime" icon={<ClipboardCheck size={34} strokeWidth={2.5} />} />
          <StatCard label="Signals" value={mockSuspiciousUserSignals.length} subtitle="Watch/review queue" tone="orange" icon={<Radar size={34} strokeWidth={2.5} />} />
          <StatCard label="Rewards" value={pendingRewards} subtitle="Pending manual review" tone="green" icon={<ShieldCheck size={34} strokeWidth={2.5} />} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-4 lg:gap-6 items-start">
          <div className="flex flex-col gap-4 lg:gap-6">
            <Panel title="Match Operations Preview" className="overflow-hidden">
              <div className="bg-card flex flex-col">
                {mockMatches.map((match) => (
                  <div key={match.id} className="grid grid-cols-1 md:grid-cols-[1fr_150px_170px_130px] border-b-2 border-line last:border-b-0 font-bold text-sm">
                    <div className="p-3 md:border-r-2 border-main">
                      <Link to={`/matches/${match.id}`} className="font-black uppercase hover:text-c2 hover:underline">{getMatchLabel(match)}</Link>
                      <div className="text-xs text-subtle uppercase mt-1">{match.city}</div>
                    </div>
                    <div className="p-3 md:border-r-2 border-main uppercase">{match.status}</div>
                    <div className="p-3 md:border-r-2 border-main text-xs uppercase">Lock: {formatDate(match.lockAt)}</div>
                    <div className="p-3 font-black uppercase text-[10px] text-c2">Review only</div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Prediction Integrity" className="overflow-hidden">
              <div className="bg-card flex flex-col">
                {recentPredictions.map((prediction) => {
                  const user = getUserById(prediction.userId);
                  const match = mockMatches.find((item) => item.id === prediction.matchId);
                  return (
                    <div key={prediction.id} className="grid grid-cols-1 md:grid-cols-[1fr_140px_110px_130px] border-b-2 border-line last:border-b-0 font-bold text-sm">
                      <div className="p-3 md:border-r-2 border-main">
                        <div className="font-black uppercase">{user?.username ?? prediction.userId}</div>
                        <div className="text-xs text-subtle uppercase mt-1">{match ? getMatchLabel(match) : prediction.matchId}</div>
                      </div>
                      <div className="p-3 md:border-r-2 border-main">{prediction.homeScore}-{prediction.awayScore}</div>
                      <div className="p-3 md:border-r-2 border-main">Rev {prediction.revision}</div>
                      <div className="p-3 uppercase text-[10px] font-black">{prediction.status}</div>
                    </div>
                  );
                })}
              </div>
            </Panel>
          </div>

          <div className="flex flex-col gap-4 lg:gap-6">
            <Panel title="Leaderboard Recalc Preview">
              <div className="p-4 bg-card flex flex-col gap-3">
                {mockLeaderboard.slice(0, 4).map((entry) => {
                  const user = getUserById(entry.userId);
                  return (
                    <div key={entry.userId} className="border-2 border-main bg-page p-3 shadow-[2px_2px_0_var(--color-shadow)] flex items-center justify-between font-bold text-sm">
                      <span className="uppercase">#{entry.rank} {user?.username ?? entry.userId}</span>
                      <span className="font-black">{entry.points} pts</span>
                    </div>
                  );
                })}
                <div className="border-2 border-main bg-c1 p-3 font-black uppercase text-xs shadow-[2px_2px_0_var(--color-shadow)]">Preview only: no stored standings are changed.</div>
              </div>
            </Panel>

            <Panel title="Suspicious Signals">
              <div className="p-4 bg-card flex flex-col gap-3">
                {mockSuspiciousUserSignals.map((signal) => {
                  const user = getUserById(signal.userId);
                  return (
                    <div key={signal.id} className="border-2 border-main bg-page p-3 shadow-[2px_2px_0_var(--color-shadow)]">
                      <div className="font-black uppercase flex items-center gap-2"><AlertTriangle size={16} /> {user?.username ?? signal.userId}</div>
                      <div className="text-xs font-bold text-subtle mt-1">{signal.label} • {signal.severity}</div>
                    </div>
                  );
                })}
              </div>
            </Panel>

            <Panel title="Recent Audit Events">
              <div className="p-4 bg-card flex flex-col gap-3 text-xs font-bold">
                {mockAdminAuditLogs.slice(0, 4).map((log) => (
                  <div key={log.id} className="border-b-2 border-line last:border-b-0 pb-3 last:pb-0">
                    <div className="font-black uppercase">{log.action.replaceAll('_', ' ')}</div>
                    <div className="text-subtle mt-1">{log.description}</div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
