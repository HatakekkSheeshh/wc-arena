import { useEffect, useMemo, useState } from 'react';
import { Camera, Search, Shield, Shirt, Users } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import { getErrorMessage } from '../services/serviceTypes';
import { getTournamentTeamSquad, listTournamentSquadSummaries, type TeamSquad, type TeamSquadSummary, type TournamentSquadPlayer } from '../services/players';
import { getTeamFlag } from '../utils/teamFlags';
import type { ThemeControls } from '../App';

type SquadGalleryProps = {
  themeControls: ThemeControls;
};

type SortMode = 'position' | 'goals' | 'caps' | 'number' | 'name';
type PositionGroup = 'GK' | 'DF' | 'MF' | 'FW' | 'Other';

type PositionGroupData = {
  key: PositionGroup;
  label: string;
  players: TournamentSquadPlayer[];
};

const POSITION_GROUPS: PositionGroupData[] = [
  { key: 'GK', label: 'Goalkeepers', players: [] },
  { key: 'DF', label: 'Defenders', players: [] },
  { key: 'MF', label: 'Midfielders', players: [] },
  { key: 'FW', label: 'Forwards', players: [] },
  { key: 'Other', label: 'Other roles', players: [] },
];

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'position', label: 'Position' },
  { value: 'goals', label: 'Goals' },
  { value: 'caps', label: 'Caps' },
  { value: 'number', label: 'Number' },
  { value: 'name', label: 'Name' },
];

function TeamFlag({ squad }: { squad: TeamSquadSummary }) {
  const Flag = getTeamFlag(squad.team.country_code, squad.team.short_name);
  if (!Flag) return <span className="font-black text-xs">{squad.team.short_name.slice(0, 2)}</span>;
  return <Flag className="w-full h-full object-cover" title={squad.team.name} />;
}

function getPositionGroup(position: string): PositionGroup {
  const normalizedPosition = position.toUpperCase();
  if (normalizedPosition.includes('GK')) return 'GK';
  if (normalizedPosition.includes('DF') || normalizedPosition.includes('CB') || normalizedPosition.includes('LB') || normalizedPosition.includes('RB')) return 'DF';
  if (normalizedPosition.includes('MF') || normalizedPosition.includes('CM') || normalizedPosition.includes('DM') || normalizedPosition.includes('AM')) return 'MF';
  if (normalizedPosition.includes('FW') || normalizedPosition.includes('ST') || normalizedPosition.includes('CF') || normalizedPosition.includes('WG')) return 'FW';
  return 'Other';
}

function compareBySquadNumber(first: TournamentSquadPlayer, second: TournamentSquadPlayer) {
  if (first.squad_number !== null && second.squad_number !== null) return first.squad_number - second.squad_number;
  if (first.squad_number !== null) return -1;
  if (second.squad_number !== null) return 1;
  return first.player.display_name.localeCompare(second.player.display_name);
}

function sortPlayers(players: TournamentSquadPlayer[], sortMode: SortMode) {
  return [...players].sort((first, second) => {
    if (sortMode === 'goals') return (second.international_goals ?? 0) - (first.international_goals ?? 0) || compareBySquadNumber(first, second);
    if (sortMode === 'caps') return (second.caps ?? 0) - (first.caps ?? 0) || compareBySquadNumber(first, second);
    if (sortMode === 'name') return first.player.display_name.localeCompare(second.player.display_name);
    return compareBySquadNumber(first, second);
  });
}

function groupPlayersByPosition(players: TournamentSquadPlayer[], sortMode: SortMode) {
  const playersByGroup = new Map<PositionGroup, TournamentSquadPlayer[]>();

  for (const row of players) {
    const group = getPositionGroup(row.position);
    playersByGroup.set(group, [...(playersByGroup.get(group) ?? []), row]);
  }

  return POSITION_GROUPS.map((group) => ({
    ...group,
    players: sortPlayers(playersByGroup.get(group.key) ?? [], sortMode),
  })).filter((group) => group.players.length > 0);
}

function PlayerCard({ row }: { row: TournamentSquadPlayer }) {
  return (
    <article className="border-4 border-main bg-card shadow-[4px_4px_0_var(--color-shadow)] min-w-0">
      <div className="relative aspect-square border-b-4 border-main bg-muted overflow-hidden">
        {row.player.image_url ? (
          <img src={row.player.image_url} alt={row.player.display_name} loading="lazy" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-c1 text-main"><Camera size={42} strokeWidth={2.5} /></div>
        )}
        <div className="absolute left-2 top-2 bg-main text-inv border-2 border-main px-2 py-1 font-black text-xs shadow-[2px_2px_0_var(--color-shadow)]">
          #{row.squad_number ?? '—'}
        </div>
        {row.captain && <div className="absolute right-2 top-2 bg-c3 text-main border-2 border-main px-2 py-1 font-black text-xs shadow-[2px_2px_0_var(--color-shadow)]">CAP</div>}
      </div>
      <div className="p-3 flex flex-col gap-2 min-w-0">
        <div className="font-black uppercase text-sm sm:text-base leading-tight truncate text-main" title={row.player.display_name}>{row.player.display_name}</div>
        <div className="grid grid-cols-2 gap-2 text-[10px] font-black uppercase">
          <div className="border-2 border-main bg-c1 text-main px-2 py-1">{row.position}</div>
          <div className="border-2 border-main bg-page text-main px-2 py-1 truncate" title={row.club ?? row.player.club ?? '—'}>{row.club ?? row.player.club ?? '—'}</div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[10px] font-bold uppercase text-subtle">
          <span>Caps {row.caps ?? 0}</span>
          <span>Goals {row.international_goals ?? 0}</span>
        </div>
      </div>
    </article>
  );
}

export default function SquadGallery({ themeControls }: SquadGalleryProps) {
  const [squadSummaries, setSquadSummaries] = useState<TeamSquadSummary[]>([]);
  const [squadsByTeamId, setSquadsByTeamId] = useState<Record<string, TeamSquad>>({});
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('position');
  const [loadingSummaries, setLoadingSummaries] = useState(true);
  const [loadingSquad, setLoadingSquad] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoadingSummaries(true);
    setError(null);

    listTournamentSquadSummaries()
      .then((nextSquads) => {
        if (!active) return;
        setSquadSummaries(nextSquads);
        setSelectedTeamId((currentTeamId) => currentTeamId ?? nextSquads[0]?.team.id ?? null);
      })
      .catch((nextError) => {
        if (!active) return;
        setError(getErrorMessage(nextError));
      })
      .finally(() => {
        if (active) setLoadingSummaries(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedTeamId) {
      setLoadingSquad(false);
      return;
    }

    if (squadsByTeamId[selectedTeamId]) {
      setLoadingSquad(false);
      return;
    }

    let active = true;
    setLoadingSquad(true);
    setError(null);

    getTournamentTeamSquad(selectedTeamId)
      .then((nextSquad) => {
        if (!active || !nextSquad) return;
        setSquadsByTeamId((currentSquads) => ({ ...currentSquads, [nextSquad.team.id]: nextSquad }));
      })
      .catch((nextError) => {
        if (!active) return;
        setError(getErrorMessage(nextError));
      })
      .finally(() => {
        if (active) setLoadingSquad(false);
      });

    return () => {
      active = false;
    };
  }, [selectedTeamId, squadsByTeamId]);

  const selectedSummary = squadSummaries.find((squad) => squad.team.id === selectedTeamId) ?? null;
  const selectedSquad = selectedTeamId ? squadsByTeamId[selectedTeamId] : null;
  const totalPlayers = squadSummaries.reduce((total, squad) => total + squad.playerCount, 0);
  const loadedImages = selectedSquad?.players.filter((row) => row.player.image_url).length ?? 0;

  const visiblePlayers = useMemo(() => {
    const query = search.trim().toLowerCase();
    const players = selectedSquad?.players ?? [];
    if (!query) return players;
    return players.filter((row) => `${row.player.display_name} ${row.position} ${row.club ?? ''}`.toLowerCase().includes(query));
  }, [search, selectedSquad]);

  const groupedPlayers = useMemo(() => groupPlayersByPosition(visiblePlayers, sortMode), [sortMode, visiblePlayers]);

  return (
    <AppShell themeControls={themeControls}>
      <div className="relative z-10 flex flex-col p-3 sm:p-4 lg:p-6 gap-3 lg:gap-6 min-h-0">
        <section className="bg-card border-4 border-main p-3 sm:p-4 lg:p-6 flex flex-col gap-3 w-full xl:w-1/2 shadow-[6px_6px_0_0_var(--color-shadow)] lg:shadow-[8px_8px_0_0_var(--color-shadow)]">
          <div className="inline-flex w-fit items-center gap-2 border-2 border-main bg-c3 px-3 py-1 font-black uppercase text-[10px] tracking-widest text-main shadow-[2px_2px_0_var(--color-shadow)]">
            <Camera size={14} strokeWidth={3} /> Team-first CDN Demo
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tighter text-main leading-none">Squad Gallery</h1>
          <p className="font-bold text-sm sm:text-base text-subtle max-w-3xl">
            Pick a team to load only that squad and its CDN images, then browse the players by role, goals, caps, number, or name.
          </p>
        </section>

        <section className="bg-card border-4 border-main p-3 sm:p-4 lg:p-6 flex flex-col gap-3 lg:gap-6 shadow-[6px_6px_0_0_var(--color-shadow)] lg:shadow-[8px_8px_0_0_var(--color-shadow)] rounded-sm">
          <div className="grid grid-cols-2 xl:grid-cols-4 border-b-4 border-main">
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-4 border-r-4 border-b-4 xl:border-b-0 border-main p-2 sm:p-4 lg:p-5 bg-c1 text-main min-w-0 text-center sm:text-left">
              <Users size={24} strokeWidth={2.5} className="sm:w-9 sm:h-9 shrink-0" />
              <div className="min-w-0"><div className="text-[8px] sm:text-xs uppercase font-black tracking-widest leading-none mb-1 truncate">Total players</div><div className="text-base sm:text-3xl font-black leading-none">{totalPlayers}</div><div className="text-[8px] sm:text-[10px] font-bold uppercase mt-1 truncate">Seeded catalog</div></div>
            </div>
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-4 border-b-4 xl:border-b-0 xl:border-r-4 border-main p-2 sm:p-4 lg:p-5 bg-c2 text-inv min-w-0 text-center sm:text-left">
              <Camera size={24} strokeWidth={2.5} className="sm:w-9 sm:h-9 shrink-0" />
              <div className="min-w-0"><div className="text-[8px] sm:text-xs uppercase font-black tracking-widest leading-none mb-1 truncate">Loaded images</div><div className="text-base sm:text-3xl font-black leading-none">{loadedImages}</div><div className="text-[8px] sm:text-[10px] font-bold uppercase mt-1 text-c1 truncate">Selected team only</div></div>
            </div>
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-4 border-r-4 border-main p-2 sm:p-4 lg:p-5 bg-c3 text-main min-w-0 text-center sm:text-left">
              <Shield size={24} strokeWidth={2.5} className="sm:w-9 sm:h-9 shrink-0" />
              <div className="min-w-0"><div className="text-[8px] sm:text-xs uppercase font-black tracking-widest leading-none mb-1 truncate">Teams</div><div className="text-base sm:text-3xl font-black leading-none">{squadSummaries.length}</div><div className="text-[8px] sm:text-[10px] font-bold uppercase mt-1 truncate">Lazy-loaded</div></div>
            </div>
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-4 border-main p-2 sm:p-4 lg:p-5 bg-c4 text-main min-w-0 text-center sm:text-left">
              <Shirt size={24} strokeWidth={2.5} className="sm:w-9 sm:h-9 shrink-0" />
              <div className="min-w-0"><div className="text-[8px] sm:text-xs uppercase font-black tracking-widest leading-none mb-1 truncate">Current squad</div><div className="text-base sm:text-3xl font-black leading-none">{selectedSummary?.playerCount ?? 0}</div><div className="text-[8px] sm:text-[10px] font-bold uppercase mt-1 truncate">{selectedSummary?.team.short_name ?? '—'}</div></div>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row flex-1 min-h-[560px]">
            <aside className="order-1 xl:order-1 w-full xl:w-[340px] border-b-4 xl:border-b-0 xl:border-r-4 border-main bg-card flex flex-col">
              <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm border-b-4 border-main flex items-center justify-between">
                <span>Teams</span>
                <span className="text-c1 text-xs">{squadSummaries.length}</span>
              </div>
              <div className="p-3 border-b-4 border-main flex flex-col gap-3 bg-muted">
                <label className="border-2 border-main bg-card flex items-center gap-2 px-3 py-2 shadow-[2px_2px_0_var(--color-shadow)]">
                  <Search size={16} strokeWidth={3} className="shrink-0" />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search selected squad" className="w-full bg-transparent outline-none font-black uppercase text-xs placeholder:text-subtle" />
                </label>
                <div className="border-2 border-main bg-c1 px-3 py-2 font-black uppercase text-[10px] leading-relaxed text-main shadow-[2px_2px_0_var(--color-shadow)]">
                  Team-first mode loads about 26 player photos instead of 1248 on page open.
                </div>
              </div>
              <div className="max-h-[520px] overflow-y-auto bg-card">
                {loadingSummaries && <div className="p-4 font-black uppercase text-sm border-b-4 border-main">Loading teams...</div>}
                {!loadingSummaries && squadSummaries.map((squad) => (
                  <button key={squad.team.id} type="button" onClick={() => setSelectedTeamId(squad.team.id)} className={`w-full grid grid-cols-[32px_1fr_auto] items-center gap-3 p-3 border-b border-line text-left transition-colors ${selectedTeamId === squad.team.id ? 'bg-c2 text-inv' : 'bg-card text-main hover:bg-elevated'}`}>
                    <span className="w-8 h-8 border-2 border-main bg-page flex items-center justify-center overflow-hidden"><TeamFlag squad={squad} /></span>
                    <span className="min-w-0"><span className="block font-black uppercase text-xs truncate">{squad.team.name}</span><span className="block font-bold uppercase text-[10px] opacity-70">Group {squad.team.group_code ?? '—'}</span></span>
                    <span className="font-black text-xs">{squad.playerCount}</span>
                  </button>
                ))}
              </div>
            </aside>

            <main className="order-2 xl:order-2 flex-1 bg-muted min-w-0 flex flex-col">
              {error && <div className="p-6 bg-c5 text-main font-black uppercase text-sm border-b-4 border-main">{error}</div>}
              {!error && loadingSquad && <div className="p-6 bg-card font-black uppercase text-sm border-b-4 border-main">Loading selected squad...</div>}
              {!error && !loadingSquad && selectedSummary && !selectedSquad && <div className="p-6 bg-card font-black uppercase text-sm border-b-4 border-main">Select a team to load squad photos.</div>}
              {!error && !loadingSquad && selectedSquad && (
                <section className="flex flex-col flex-1">
                  <div className="bg-main text-inv border-b-4 border-main p-3 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-10 h-10 border-2 border-main bg-page flex items-center justify-center overflow-hidden shrink-0"><TeamFlag squad={selectedSquad} /></span>
                      <div className="min-w-0">
                        <h2 className="font-black uppercase text-lg sm:text-2xl leading-none truncate">{selectedSquad.team.name}</h2>
                        <div className="font-bold uppercase text-[10px] sm:text-xs text-faint mt-1">Group {selectedSquad.team.group_code ?? '—'} · Coach {selectedSquad.coachName ?? '—'} · {visiblePlayers.length}/{selectedSquad.players.length} players</div>
                      </div>
                    </div>
                    <div className="flex border-2 border-main font-bold text-[10px] sm:text-xs uppercase overflow-x-auto bg-card text-main">
                      {SORT_OPTIONS.map((option) => (
                        <button key={option.value} type="button" onClick={() => setSortMode(option.value)} className={`${sortMode === option.value ? 'bg-c3 text-main' : 'bg-card hover:bg-elevated'} px-3 sm:px-4 py-1.5 border-r-2 border-main last:border-r-0 min-w-[82px]`}>
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {visiblePlayers.length === 0 ? (
                    <div className="p-6 font-black uppercase text-sm bg-card border-b-4 border-main">No squad players found.</div>
                  ) : (
                    <div className="flex flex-col">
                      {groupedPlayers.map((group) => (
                        <section key={group.key} className="border-b-4 border-main bg-page">
                          <div className="bg-card border-b-4 border-main p-3 sm:p-4 flex items-center justify-between">
                            <div>
                              <h3 className="font-black uppercase text-xl sm:text-2xl leading-none text-main">{group.key}</h3>
                              <div className="font-bold uppercase text-[10px] sm:text-xs text-subtle mt-1">{group.label} · {group.players.length} players · sorted by {SORT_OPTIONS.find((option) => option.value === sortMode)?.label}</div>
                            </div>
                            <div className="bg-c1 border-2 border-main px-3 py-1 font-black uppercase text-xs shadow-[2px_2px_0_var(--color-shadow)]">{group.players.length}</div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 p-3 sm:p-4">
                            {group.players.map((row) => <div key={`${selectedSquad.team.id}-${row.player.id}`}><PlayerCard row={row} /></div>)}
                          </div>
                        </section>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </main>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
