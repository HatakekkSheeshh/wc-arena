import { Link } from 'react-router-dom';
import { Award, BarChart2, Flame, Shield, Star, Trophy, Users } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import PageHero from '../components/ui/PageHero';
import Panel from '../components/ui/Panel';
import StatCard from '../components/ui/StatCard';
import StatusPill from '../components/ui/StatusPill';
import { mockBadges } from '../data/mockBadges';
import { mockLeagues } from '../data/mockLeagues';
import { getMatchById } from '../data/mockMatches';
import { mockPredictions } from '../data/mockPredictions';
import { getTeamById } from '../data/mockTeams';
import { currentUserId, getUserById } from '../data/mockUsers';
import { calculateAccuracy, calculateStreak, getPredictionOutcome } from '../lib/scoring';
import type { ThemeControls } from '../App';
import type { Match, MatchResult, Prediction, PredictionDisplayStatus } from '../types/domain';

type ProfileProps = {
  themeControls: ThemeControls;
};

function getMatchResult(match: Match): MatchResult | undefined {
  if (typeof match.homeScore !== 'number' || typeof match.awayScore !== 'number') return undefined;
  return { homeScore: match.homeScore, awayScore: match.awayScore };
}

function getDisplayStatus(prediction: Prediction, result?: MatchResult): PredictionDisplayStatus {
  if (!result) return prediction.status === 'locked' ? 'locked' : 'pending';
  return getPredictionOutcome(prediction, result);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(value));
}

export default function Profile({ themeControls }: ProfileProps) {
  const user = getUserById(currentUserId);
  const userPredictions = mockPredictions.filter((prediction) => prediction.userId === currentUserId);
  const scoredItems = userPredictions.map((prediction) => {
    const match = getMatchById(prediction.matchId);
    return { prediction, result: match ? getMatchResult(match) : undefined };
  });
  const accuracy = calculateAccuracy(scoredItems);
  const streak = calculateStreak(scoredItems);
  const unlockedBadges = mockBadges.filter((badge) => badge.unlockedAt);
  const favoriteTeam = user?.fanClubTeamId ? getTeamById(user.fanClubTeamId) : undefined;

  if (!user) {
    return (
      <AppShell themeControls={themeControls}>
        <div className="relative z-10 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6 bg-page flex-1">
          <PageHero title="Profile Not Found" description="The current mock user could not be loaded." />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell themeControls={themeControls}>
      <div className="relative z-10 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6 bg-page flex-1">
        <PageHero title="Player Profile" description="Your World Cup 2026 contest identity, form, achievements, and league footprint.">
          <Link to="/activity" className="bg-c2 text-inv font-black uppercase py-3 px-4 border-2 border-main shadow-[3px_3px_0_var(--color-shadow)] text-xs">View Activity</Link>
        </PageHero>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
          <StatCard label="Global Rank" value={`#${user.rank ?? '—'}`} subtitle="Global Arena" tone="blue" icon={<Trophy size={34} strokeWidth={2.5} />} />
          <StatCard label="Points" value={user.points} subtitle="Current total" tone="lime" icon={<Star size={34} strokeWidth={2.5} fill="currentColor" />} />
          <StatCard label="Accuracy" value={`${accuracy || user.accuracy || 0}%`} subtitle="Exact or outcome" tone="green" icon={<BarChart2 size={34} strokeWidth={2.5} />} />
          <StatCard label="Streak" value={streak || user.currentStreak} subtitle={`Best ${user.bestStreak}`} tone="orange" icon={<Flame size={34} strokeWidth={2.5} />} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-4 lg:gap-6 items-start">
          <div className="flex flex-col gap-4">
            <Panel title="Identity">
              <div className="p-5 bg-card flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 border-4 border-main rounded-full bg-c1 flex items-center justify-center font-black text-3xl shadow-[4px_4px_0_var(--color-shadow)]">{user.username.slice(0, 2).toUpperCase()}</div>
                  <div>
                    <div className="font-black text-3xl uppercase tracking-tighter">{user.username}</div>
                    <div className="font-bold text-sm text-subtle">{user.email}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm font-bold">
                  <div className="border-2 border-main p-3 bg-page"><div className="text-[10px] uppercase text-subtle font-black">Fan team</div>{favoriteTeam?.name ?? 'Not set'}</div>
                  <div className="border-2 border-main p-3 bg-page"><div className="text-[10px] uppercase text-subtle font-black">Joined</div>{formatDate(user.createdAt)}</div>
                </div>
              </div>
            </Panel>

            <Panel title="Leagues">
              <div className="p-4 bg-card flex flex-col gap-3">
                {mockLeagues.map((league) => (
                  <Link key={league.id} to={`/leagues/${league.id}`} className="border-2 border-main p-3 hover:bg-muted shadow-[2px_2px_0_var(--color-shadow)]">
                    <div className="font-black uppercase">{league.name}</div>
                    <div className="text-xs font-bold text-subtle uppercase mt-1">{league.memberCount.toLocaleString()} members • {league.visibility}</div>
                  </Link>
                ))}
              </div>
            </Panel>
          </div>

          <div className="flex flex-col gap-4">
            <Panel title="Recent Predictions" className="overflow-hidden">
              <div className="bg-card flex flex-col">
                {userPredictions.slice(0, 5).map((prediction) => {
                  const match = getMatchById(prediction.matchId);
                  if (!match) return null;
                  const result = getMatchResult(match);
                  const homeTeam = getTeamById(match.homeTeamId);
                  const awayTeam = getTeamById(match.awayTeamId);
                  return (
                    <div key={prediction.id} className="grid grid-cols-1 md:grid-cols-[1fr_140px_130px] border-b-2 border-line last:border-b-0 font-bold text-sm">
                      <div className="p-3 md:border-r-2 border-main">
                        <Link to={`/matches/${match.id}`} className="font-black uppercase hover:text-c2 hover:underline">{homeTeam?.name} vs {awayTeam?.name}</Link>
                        <div className="text-xs text-subtle uppercase mt-1">{formatDate(match.kickoffAt)} • {match.city}</div>
                      </div>
                      <div className="p-3 md:border-r-2 border-main font-black md:text-center">{homeTeam?.shortName} {prediction.homeScore}-{prediction.awayScore} {awayTeam?.shortName}</div>
                      <div className="p-3 flex md:justify-center"><StatusPill status={getDisplayStatus(prediction, result)} /></div>
                    </div>
                  );
                })}
              </div>
            </Panel>

            <Panel title="Badge Progress">
              <div className="p-4 bg-card grid grid-cols-1 md:grid-cols-3 gap-3">
                {mockBadges.map((badge) => {
                  const progress = badge.progressCurrent && badge.progressTarget ? Math.round((badge.progressCurrent / badge.progressTarget) * 100) : 0;
                  return (
                    <Link key={badge.id} to="/badges" className="border-2 border-main p-3 bg-page hover:bg-muted shadow-[2px_2px_0_var(--color-shadow)]">
                      <div className="flex items-center gap-2 font-black uppercase text-sm"><Award size={18} /> {badge.name}</div>
                      <div className="text-xs font-bold text-subtle mt-2">{badge.description}</div>
                      <div className="h-3 border-2 border-main mt-3 bg-card"><div className="h-full bg-c3" style={{ width: `${Math.min(progress, 100)}%` }} /></div>
                      <div className="text-[10px] font-black uppercase mt-2">{badge.unlockedAt ? 'Unlocked' : `${badge.progressCurrent ?? 0}/${badge.progressTarget ?? 0}`}</div>
                    </Link>
                  );
                })}
              </div>
            </Panel>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link to="/badges" className="bg-c1 border-4 border-main p-4 shadow-[4px_4px_0_var(--color-shadow)] font-black uppercase flex items-center gap-3"><Shield /> {unlockedBadges.length} unlocked badges</Link>
              <Link to="/leagues" className="bg-c2 text-inv border-4 border-main p-4 shadow-[4px_4px_0_var(--color-shadow)] font-black uppercase flex items-center gap-3"><Users /> Browse leagues</Link>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
