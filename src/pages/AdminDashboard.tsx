import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ClipboardCheck, Radar, ShieldCheck, Trophy } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import { mockSuspiciousUserSignals } from '../data/mockAdmin';
import { mockPredictions } from '../data/mockPredictions';
import { mockRewards } from '../data/mockRewards';
import { getUserById } from '../data/mockUsers';
import { useAuth } from '../lib/auth';
import { listAdminAuditLogs, recalculateScores, updateMatchResult, type AdminAuditLogRow } from '../services/admin';
import { listGlobalLeaderboard, type LeaderboardEntryWithProfile } from '../services/leaderboard';
import { listMatches, type MatchRow } from '../services/matches';
import { getCurrentUserRole } from '../services/profile';
import { getErrorMessage } from '../services/serviceTypes';
import { getTeamMap, type TeamRow } from '../services/teams';
import type { ThemeControls } from '../App';

type AdminDashboardProps = {
  themeControls: ThemeControls;
};

type ResultDrafts = Record<string, { homeScore: string; awayScore: string }>;
type ActionState = { loading?: boolean; error?: string; success?: string };

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function getMatchLabel(match: MatchRow, teams: Map<string, TeamRow>) {
  const homeTeam = teams.get(match.home_team_id);
  const awayTeam = teams.get(match.away_team_id);
  return `${homeTeam?.short_name ?? match.home_team_id} vs ${awayTeam?.short_name ?? match.away_team_id}`;
}

export default function AdminDashboard({ themeControls }: AdminDashboardProps) {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [teams, setTeams] = useState<Map<string, TeamRow>>(new Map());
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntryWithProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLogRow[]>([]);
  const [resultDrafts, setResultDrafts] = useState<ResultDrafts>({});
  const [matchActionState, setMatchActionState] = useState<Record<string, ActionState>>({});
  const [recalcState, setRecalcState] = useState<ActionState>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadAdminData() {
    setLoading(true);
    setError(null);

    try {
      const [nextMatches, nextTeams, nextLeaderboard, nextAuditLogs] = await Promise.all([
        listMatches(),
        getTeamMap(),
        listGlobalLeaderboard(),
        listAdminAuditLogs(),
      ]);
      setMatches(nextMatches);
      setTeams(nextTeams);
      setLeaderboard(nextLeaderboard);
      setAuditLogs(nextAuditLogs);
      setResultDrafts(Object.fromEntries(nextMatches.map((match) => [match.id, {
        homeScore: match.home_score?.toString() ?? '',
        awayScore: match.away_score?.toString() ?? '',
      }])));
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user) {
      setRole(null);
      setRoleLoading(false);
      return;
    }

    let active = true;
    setRoleLoading(true);
    setError(null);

    getCurrentUserRole(user.id)
      .then((nextRole) => {
        if (!active) return;
        setRole(nextRole);
      })
      .catch((nextError) => {
        if (!active) return;
        setError(getErrorMessage(nextError));
      })
      .finally(() => {
        if (active) setRoleLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    if (role === 'admin') void loadAdminData();
  }, [role]);

  async function saveMatchResult(match: MatchRow) {
    const draft = resultDrafts[match.id];
    const homeScore = Number(draft?.homeScore);
    const awayScore = Number(draft?.awayScore);

    if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore) || homeScore < 0 || awayScore < 0) {
      setMatchActionState((current) => ({ ...current, [match.id]: { error: 'Enter two non-negative whole numbers.' } }));
      return;
    }

    setMatchActionState((current) => ({ ...current, [match.id]: { loading: true } }));

    try {
      await updateMatchResult({ matchId: match.id, homeScore, awayScore });
      await loadAdminData();
      setMatchActionState((current) => ({ ...current, [match.id]: { success: 'Result saved' } }));
    } catch (nextError) {
      setMatchActionState((current) => ({ ...current, [match.id]: { error: getErrorMessage(nextError) } }));
    }
  }

  async function runRecalculation() {
    setRecalcState({ loading: true });

    try {
      const result = await recalculateScores() as { predictionScores?: number; leaderboardEntries?: number };
      await loadAdminData();
      setRecalcState({ success: `Updated ${result.predictionScores ?? 0} scores / ${result.leaderboardEntries ?? 0} entries` });
    } catch (nextError) {
      setRecalcState({ error: getErrorMessage(nextError) });
    }
  }

  if (authLoading || roleLoading) {
    return (
      <AppShell themeControls={themeControls}>
        <div className="relative z-10 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6 min-h-0">
          <div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col w-full xl:w-1/2 shadow-[8px_8px_0_0_var(--color-shadow)]">
            <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-1 text-main">Admin Control Room</h1>
          </div>
          <div className="bg-card border-4 border-main p-4 lg:p-6 shadow-[8px_8px_0_0_var(--color-shadow)] rounded-sm font-black uppercase text-sm">Loading admin access...</div>
        </div>
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell themeControls={themeControls}>
        <div className="relative z-10 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6 min-h-0">
          <div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col w-full xl:w-1/2 shadow-[8px_8px_0_0_var(--color-shadow)]">
            <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-1 text-main">Admin Control Room</h1>
          </div>
          <div className="bg-card border-4 border-main p-4 lg:p-6 shadow-[8px_8px_0_0_var(--color-shadow)] rounded-sm font-black uppercase text-sm flex flex-col gap-3">
            <span>Sign in to access admin tools.</span>
            <Link to="/login" className="text-c2 underline">Go to login</Link>
          </div>
        </div>
      </AppShell>
    );
  }

  if (role !== 'admin') {
    return (
      <AppShell themeControls={themeControls}>
        <div className="relative z-10 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6 min-h-0">
          <div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col w-full xl:w-1/2 shadow-[8px_8px_0_0_var(--color-shadow)]">
            <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-1 text-main">Admin Control Room</h1>
          </div>
          <div className="bg-card border-4 border-main p-4 lg:p-6 shadow-[8px_8px_0_0_var(--color-shadow)] rounded-sm font-black uppercase text-sm">Admin access required.</div>
        </div>
      </AppShell>
    );
  }

  const finishedMatches = matches.filter((match) => match.status === 'finished').length;
  const lockedMatches = matches.filter((match) => match.status === 'locked' || match.status === 'live').length;
  const pendingRewards = mockRewards.filter((reward) => reward.status === 'pending').length;
  const recentPredictions = mockPredictions.slice(0, 5);

  return (
    <AppShell themeControls={themeControls}>
      <div className="relative z-10 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6 min-h-0">
        <div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col w-full xl:w-1/2 shadow-[8px_8px_0_0_var(--color-shadow)]">
          <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-1 text-main">
            Admin Control Room
          </h1>
        </div>

        <div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col gap-4 lg:gap-6 shadow-[8px_8px_0_0_var(--color-shadow)] rounded-sm">
          {error && <div className="bg-c5 border-4 border-main p-4 font-black uppercase text-sm">{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 border-b-4 border-main">
            <div className="flex items-center gap-4 border-b-4 sm:border-r-4 xl:border-b-0 border-main p-4 lg:p-5 bg-c1 text-main">
              <div className="shrink-0"><Trophy size={36} strokeWidth={2.5} /></div>
              <div className="flex flex-col justify-center">
                <div className="text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">Matches</div>
                <div className="text-2xl sm:text-3xl font-black leading-none">{loading ? '—' : matches.length}</div>
                <div className="text-[10px] font-bold uppercase mt-1">{finishedMatches} finished</div>
              </div>
            </div>
            <div className="flex items-center gap-4 border-b-4 xl:border-b-0 xl:border-r-4 border-main p-4 lg:p-5 bg-c2 text-inv">
              <div className="shrink-0"><ClipboardCheck size={36} strokeWidth={2.5} /></div>
              <div className="flex flex-col justify-center">
                <div className="text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">Leaderboard</div>
                <div className="text-2xl sm:text-3xl font-black leading-none">{loading ? '—' : leaderboard.length}</div>
                <div className="text-[10px] font-bold uppercase mt-1">{lockedMatches} locked/live matches</div>
              </div>
            </div>
            <div className="flex items-center gap-4 border-b-4 sm:border-b-0 sm:border-r-4 border-main p-4 lg:p-5 bg-c3 text-main">
              <div className="shrink-0"><Radar size={36} strokeWidth={2.5} /></div>
              <div className="flex flex-col justify-center">
                <div className="text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">Signals</div>
                <div className="text-2xl sm:text-3xl font-black leading-none">{mockSuspiciousUserSignals.length}</div>
                <div className="text-[10px] font-bold uppercase mt-1">Watch/review queue</div>
              </div>
            </div>
            <div className="flex items-center gap-4 border-main p-4 lg:p-5 bg-c4 text-main">
              <div className="shrink-0"><ShieldCheck size={36} strokeWidth={2.5} /></div>
              <div className="flex flex-col justify-center">
                <div className="text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">Rewards</div>
                <div className="text-2xl sm:text-3xl font-black leading-none">{pendingRewards}</div>
                <div className="text-[10px] font-bold uppercase mt-1">Pending manual review</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row flex-1">
            <div className="flex-1 border-r-0 xl:border-r-4 border-main flex flex-col bg-card min-w-0">
              <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm border-b-4 border-main">
                Match Operations
              </div>
              <div className="bg-card flex flex-col border-b-4 border-main">
                {loading && <div className="p-4 font-black uppercase text-sm">Loading admin data...</div>}
                {!loading && matches.map((match) => {
                  const state = matchActionState[match.id];
                  const draft = resultDrafts[match.id] ?? { homeScore: '', awayScore: '' };

                  return (
                    <div key={match.id} className="grid grid-cols-1 md:grid-cols-[1fr_120px_170px_170px] border-b-4 border-main last:border-b-0 font-bold text-sm hover:bg-muted transition-colors">
                      <div className="p-3 md:border-r-2 border-main">
                        <Link to={`/matches/${match.id}`} className="font-black uppercase hover:text-c2 hover:underline">{getMatchLabel(match, teams)}</Link>
                        <div className="text-xs text-subtle uppercase mt-1">{match.city}</div>
                      </div>
                      <div className="p-3 md:border-r-2 border-main uppercase">{match.status}</div>
                      <div className="p-3 md:border-r-2 border-main text-xs uppercase">Lock: {formatDate(match.lock_at)}</div>
                      <div className="p-3 flex flex-col gap-2">
                        <div className="flex gap-2">
                          <input value={draft.homeScore} onChange={(event) => setResultDrafts((current) => ({ ...current, [match.id]: { ...draft, homeScore: event.target.value } }))} className="w-14 bg-card border-2 border-main px-2 py-1 font-black text-center" inputMode="numeric" aria-label="Home score" />
                          <input value={draft.awayScore} onChange={(event) => setResultDrafts((current) => ({ ...current, [match.id]: { ...draft, awayScore: event.target.value } }))} className="w-14 bg-card border-2 border-main px-2 py-1 font-black text-center" inputMode="numeric" aria-label="Away score" />
                          <button type="button" onClick={() => void saveMatchResult(match)} disabled={state?.loading} className="bg-c2 text-inv border-2 border-main px-2 py-1 font-black uppercase text-[10px] disabled:opacity-60">Save</button>
                        </div>
                        {(state?.error || state?.success) && <div className={`font-black uppercase text-[10px] ${state.error ? 'text-c5' : 'text-c2'}`}>{state.error ?? state.success}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm border-b-4 border-main">
                Prediction Integrity
              </div>
              <div className="bg-card flex flex-col">
                {recentPredictions.map((prediction) => {
                  const user = getUserById(prediction.userId);
                  const match = matches.find((item) => item.id === prediction.matchId);
                  return (
                    <div key={prediction.id} className="grid grid-cols-1 md:grid-cols-[1fr_140px_110px_130px] border-b-4 border-main last:border-b-0 font-bold text-sm">
                      <div className="p-3 md:border-r-2 border-main">
                        <div className="font-black uppercase">{user?.username ?? prediction.userId}</div>
                        <div className="text-xs text-subtle uppercase mt-1">{match ? getMatchLabel(match, teams) : prediction.matchId}</div>
                      </div>
                      <div className="p-3 md:border-r-2 border-main">{prediction.homeScore}-{prediction.awayScore}</div>
                      <div className="p-3 md:border-r-2 border-main">Rev {prediction.revision}</div>
                      <div className="p-3 uppercase text-[10px] font-black">{prediction.status}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="w-full xl:w-[380px] bg-card flex flex-col">
              <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm border-b-4 border-main">
                Leaderboard Recalc
              </div>
              <div className="p-4 bg-card flex flex-col gap-3 border-b-4 border-main">
                {leaderboard.slice(0, 4).map((entry) => (
                  <div key={entry.user_id} className="border-2 border-main p-3 flex items-center justify-between font-bold text-sm">
                    <span className="uppercase">#{entry.rank} {entry.profiles?.username ?? entry.user_id}</span>
                    <span className="font-black">{entry.points} pts</span>
                  </div>
                ))}
                <button type="button" onClick={() => void runRecalculation()} disabled={recalcState.loading} className="border-2 border-main bg-c1 p-3 font-black uppercase text-xs shadow-[2px_2px_0_var(--color-shadow)] disabled:opacity-60">
                  {recalcState.loading ? 'Recalculating...' : 'Recalculate Scores'}
                </button>
                {(recalcState.error || recalcState.success) && <div className={`border-2 border-main p-3 font-black uppercase text-xs ${recalcState.error ? 'bg-c5' : 'bg-c3'}`}>{recalcState.error ?? recalcState.success}</div>}
              </div>

              <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm border-b-4 border-main">
                Suspicious Signals
              </div>
              <div className="bg-card flex flex-col border-b-4 border-main">
                {mockSuspiciousUserSignals.map((signal) => {
                  const user = getUserById(signal.userId);
                  return (
                    <div key={signal.id} className="p-4 border-b-2 border-line last:border-b-0">
                      <div className="font-black uppercase flex items-center gap-2"><AlertTriangle size={16} /> {user?.username ?? signal.userId}</div>
                      <div className="text-xs font-bold text-subtle mt-1">{signal.label} • {signal.severity}</div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col flex-1 bg-card">
                <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm border-b-4 border-main flex justify-between items-center">
                  <span>Recent Audit Events</span>
                  <Link to="/admin/audit" className="text-[10px] opacity-80 hover:underline">View Audit Log</Link>
                </div>
                <div className="p-4 bg-card flex flex-col gap-3 text-xs font-bold flex-1">
                  {auditLogs.slice(0, 4).map((log) => (
                    <div key={log.id} className="border-b-2 border-line last:border-b-0 pb-3 last:pb-0">
                      <div className="font-black uppercase">{log.action.replaceAll('_', ' ')}</div>
                      <div className="text-subtle mt-1">{log.description}</div>
                    </div>
                  ))}
                  {!loading && auditLogs.length === 0 && <div className="font-black uppercase text-xs">No audit events yet.</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
