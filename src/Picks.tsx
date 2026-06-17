import React, { useState } from 'react';
import { Trophy, Users, Wallet, ChevronDown, Calendar, Star, CheckCircle, Pencil, Lock, Target, TrendingUp, BarChart2, ArrowRight, User, Settings } from 'lucide-react';
import { PitchIcon, RainbowGraphic } from './Landing';
import { BR, ES, FR, AR, JP, MX, DE, MA, US as USFlag, KR } from 'country-flag-icons/react/3x2';

export default function Picks({ onNavigate, isVintage, setIsVintage, isDark, setIsDark, isRounded, setIsRounded, hasShadow, setHasShadow, hasFrame, setHasFrame }: { onNavigate: (page: string) => void, isVintage: boolean, setIsVintage: (v: boolean) => void, isDark: boolean, setIsDark: (v: boolean) => void, isRounded: boolean, setIsRounded: (v: boolean) => void, hasShadow: boolean, setHasShadow: (v: boolean) => void, hasFrame: boolean, setHasFrame: (v: boolean) => void }) {
  const [showSettings, setShowSettings] = useState(false);

  const matches = [
    {
      id: 1, dateBg: 'bg-c1', dateText: 'text-accent-on', month: 'JUN 12', time: '18:00',
      stadium: 'METLIFE STADIUM', city: 'NEW YORK, USA',
      team1: 'BRAZIL', flag1: <BR className="w-full h-full object-cover" />, team2: 'SPAIN', flag2: <ES className="w-full h-full object-cover" />,
      score1: '2', score2: '1', status: 'OPEN', statusBg: 'bg-c3',
      featured: true, pts: '+3 PTS'
    },
    {
      id: 2, dateBg: 'bg-card', dateText: 'text-main', month: 'JUN 12', time: '21:00',
      stadium: 'SOFI STADIUM', city: 'LOS ANGELES, USA',
      team1: 'FRANCE', flag1: <FR className="w-full h-full object-cover" />, team2: 'ARGENTINA', flag2: <AR className="w-full h-full object-cover" />,
      score1: '1', score2: '1', status: 'LOCKED SOON', statusBg: 'bg-c1',
      featured: false, pts: '+3 PTS'
    },
    {
      id: 3, dateBg: 'bg-card', dateText: 'text-main', month: 'JUN 13', time: '15:00',
      stadium: 'NRG STADIUM', city: 'HOUSTON, USA',
      team1: 'JAPAN', flag1: <JP className="w-full h-full object-cover" />, team2: 'MEXICO', flag2: <MX className="w-full h-full object-cover" />,
      score1: '0', score2: '2', status: 'SUBMITTED', statusBg: 'bg-c3',
      featured: false, pts: '+3 PTS', submitted: true
    },
    {
      id: 4, dateBg: 'bg-card', dateText: 'text-main', month: 'JUN 13', time: '18:00',
      stadium: 'AT&T STADIUM', city: 'DALLAS, USA',
      team1: 'GERMANY', flag1: <DE className="w-full h-full object-cover" />, team2: 'MOROCCO', flag2: <MA className="w-full h-full object-cover" />,
      score1: '2', score2: '0', status: 'OPEN', statusBg: 'bg-c3',
      featured: false, pts: '+3 PTS'
    },
    {
      id: 5, dateBg: 'bg-card', dateText: 'text-main', month: 'JUN 14', time: '12:00',
      stadium: 'HARD ROCK STADIUM', city: 'MIAMI, USA',
      team1: 'USA', flag1: <USFlag className="w-full h-full object-cover" />, team2: 'SOUTH KOREA', flag2: <KR className="w-full h-full object-cover" />,
      score1: '3', score2: '1', status: 'OPEN', statusBg: 'bg-c3',
      featured: false, pts: '+3 PTS'
    }
  ];

  const slipItems = [
    { label: 'Exact Score Bonuses', calculation: '5 x 3 pts', value: '15 pts', icon: <Star size={16} /> },
    { label: 'Correct Outcome (est.)', calculation: '5 x 1 pt', value: '5 pts', icon: <CheckCircle size={16} className="text-c2" /> },
    { label: 'Streak Bonus', calculation: 'Active', value: '+2 pts', icon: <TrendingUp size={16} className="text-c4" /> },
  ];

  const yourPicks = [
    { t1: 'BRA', t2: 'ESP', score: '2 - 1', status: 'OPEN', bg: 'bg-c3', flag1: <BR className="w-5 h-auto rounded-[2px] border border-main/10" />, flag2: <ES className="w-5 h-auto rounded-[2px] border border-main/10" /> },
    { t1: 'FRA', t2: 'ARG', score: '1 - 1', status: 'LOCKED SOON', bg: 'bg-c1', flag1: <FR className="w-5 h-auto rounded-[2px] border border-main/10" />, flag2: <AR className="w-5 h-auto rounded-[2px] border border-main/10" /> },
    { t1: 'JPN', t2: 'MEX', score: '0 - 2', status: 'SUBMITTED', bg: 'bg-c3', flag1: <JP className="w-5 h-auto rounded-[2px] border border-main/10" />, flag2: <MX className="w-5 h-auto rounded-[2px] border border-main/10" /> },
    { t1: 'GER', t2: 'MAR', score: '2 - 0', status: 'OPEN', bg: 'bg-c3', flag1: <DE className="w-5 h-auto rounded-[2px] border border-main/10" />, flag2: <MA className="w-5 h-auto rounded-[2px] border border-main/10" /> },
    { t1: 'USA', t2: 'KOR', score: '3 - 1', status: 'OPEN', bg: 'bg-c3', flag1: <USFlag className="w-5 h-auto rounded-[2px] border border-main/10" />, flag2: <KR className="w-5 h-auto rounded-[2px] border border-main/10" /> },
  ];

  const leaderboardWrapper = [
    { rank: 1, name: 'GoalGuru', pts: '2,450', color: 'bg-c1', textRank: 'text-accent-on' },
    { rank: 2, name: 'NetBuster', pts: '2,120', color: 'bg-c2', textRank: 'text-accent-inv' },
    { rank: 3, name: 'PitchWizard', pts: '1,980', color: 'bg-c3', textRank: 'text-accent-on' },
    { rank: 4, name: 'ScoreMaster', pts: '1,765', color: 'bg-c4', textRank: 'text-accent-on' },
    { rank: 5, name: 'TheOptimist', pts: '1,620', color: 'bg-c5', textRank: 'text-accent-inv' },
  ];

  return (
    <div className="min-h-screen bg-page p-3 sm:p-4 lg:p-6 flex items-center justify-center font-sans">
      <div className="w-full max-w-[1600px] bg-card border-4 border-main rounded-lg shadow-[8px_8px_0px_var(--color-shadow)] sm:shadow-[16px_16px_0px_var(--color-shadow)] overflow-hidden flex flex-col mx-auto transition-all">
        
        {/* Mac OS styling frame header */}
        <div className="w-full h-8 border-b-4 border-main bg-main flex items-center px-4 gap-2">
          <div className="w-3 h-3 rounded-full bg-c5"></div>
          <div className="w-3 h-3 rounded-full bg-c1"></div>
          <div className="w-3 h-3 rounded-full bg-c3"></div>
        </div>

        {/* Navigation */}
        <nav className="flex items-center justify-between border-b-4 border-main px-6 py-4 bg-card z-20 relative">
          <div className="text-xl md:text-3xl font-black uppercase tracking-tighter cursor-pointer" onClick={() => onNavigate('landing')}>PREDICT 2026</div>
          <div className="hidden lg:flex space-x-10 font-bold uppercase text-sm tracking-wide">
            <button className="hover:text-c2 transition-colors pb-1" onClick={() => onNavigate('matches')}>MATCHES</button>
            <button className="hover:text-c2 transition-colors pb-1" onClick={() => onNavigate('leaderboard')}>LEADERBOARD</button>
            <button className="hover:text-c2 transition-colors pb-1" onClick={() => onNavigate('rules')}>RULES</button>
            <button className="hover:text-c2 transition-colors pb-1" onClick={() => onNavigate('prize-pool')}>PRIZE POOL</button>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button onClick={() => setShowSettings(!showSettings)} className="w-10 md:w-11 h-10 md:h-11 border-2 border-main flex items-center justify-center hover:bg-muted transition-colors bg-card shadow-[2px_2px_0_0_var(--color-shadow)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none">
                <Settings size={20} className="text-main" />
              </button>
              {showSettings && (
                <div className="absolute right-0 top-14 bg-card border-4 border-main p-4 w-52 shadow-[4px_4px_0_0_var(--color-shadow)] z-50 flex flex-col gap-2">
                  <div className="font-bold uppercase text-xs text-main">Settings</div>
                  <label className="flex items-center justify-between cursor-pointer border-t-2 border-main pt-2">
                    <span className="text-sm font-bold text-main">Vintage Mode</span>
                    <input type="checkbox" checked={isVintage} onChange={(e) => setIsVintage(e.target.checked)} className="w-4 h-4 border-2 border-main accent-main cursor-pointer" />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer border-t-2 border-main pt-2">
                    <span className="text-sm font-bold text-main">Dark Mode</span>
                    <input type="checkbox" checked={isDark} onChange={(e) => setIsDark(e.target.checked)} className="w-4 h-4 border-2 border-main accent-main cursor-pointer" />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer border-t-2 border-main pt-2">
                    <span className="text-sm font-bold text-main">Rounded Corners</span>
                    <input type="checkbox" checked={isRounded} onChange={(e) => setIsRounded(e.target.checked)} className="w-4 h-4 border-2 border-main accent-main cursor-pointer" />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer border-t-2 border-main pt-2">
                    <span className="text-sm font-bold text-main">Shadows</span>
                    <input type="checkbox" checked={hasShadow} onChange={(e) => setHasShadow(e.target.checked)} className="w-4 h-4 border-2 border-main accent-main cursor-pointer" />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer border-t-2 border-main pt-2">
                    <span className="text-sm font-bold text-main">Mac Frame</span>
                    <input type="checkbox" checked={hasFrame} onChange={(e) => setHasFrame(e.target.checked)} className="w-4 h-4 border-2 border-main accent-main cursor-pointer" />
                  </label>
                </div>
              )}
            </div>
            <button className="bg-c2 hover:opacity-80 transition-opacity text-inv font-black py-2 px-4 border-2 border-main flex items-center gap-3 transition-transform transform active:scale-95 shadow-[4px_4px_0_0_var(--color-shadow)]">
              <Wallet size={18} strokeWidth={2.5} />
              <div className="flex flex-col items-start leading-[1.1]">
                <span className="text-[10px] uppercase font-bold opacity-80">Wallet</span>
                <span className="text-sm">$125.40</span>
              </div>
              <ChevronDown size={18} className="ml-1" />
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="relative border-b-4 border-main bg-card overflow-hidden min-h-[220px] flex items-center">
          <RainbowGraphic />
          
          <div className="relative z-10 w-full lg:w-[50%] p-8 lg:p-12">
            <h1 className="text-[2.5rem] sm:text-[3.5rem] lg:text-[4rem] font-black uppercase leading-[0.95] tracking-tighter mb-4 text-main">
              MAKE YOUR PICKS
            </h1>
            <p className="font-semibold text-base sm:text-lg max-w-lg leading-snug text-subtle">
              Predict the exact scores for each match. Submit before kickoff to earn points and climb the leaderboard.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 border-b-4 border-main">
          <div className="flex items-center gap-4 sm:border-r-4 border-b-4 sm:border-b-0 border-main p-4 lg:p-5 bg-c1 text-main">
            <div className="shrink-0"><Trophy size={36} strokeWidth={2.5}/></div>
            <div className="flex flex-col justify-center">
              <div className="text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">PRIZE POOL</div>
              <div className="text-2xl sm:text-3xl font-black leading-none">$25,000</div>
              <div className="text-[10px] font-bold uppercase mt-1">TOTAL GUARANTEED</div>
            </div>
          </div>
          <div className="flex items-center gap-4 sm:border-r-4 border-b-4 sm:border-b-0 border-main p-4 lg:p-5 bg-c2 text-accent-inv">
            <div className="shrink-0"><Users size={36} strokeWidth={2.5}/></div>
            <div className="flex flex-col justify-center">
              <div className="text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">TOTAL PLAYERS</div>
              <div className="text-2xl sm:text-3xl font-black leading-none">12,480</div>
              <div className="text-[10px] font-bold uppercase mt-1 text-c1">JOINED</div>
            </div>
          </div>
          <div className="flex items-center gap-4 border-main p-4 lg:p-5 bg-c3 text-main">
            <div className="shrink-0"><PitchIcon className="w-9 h-9" /></div>
            <div className="flex flex-col justify-center">
              <div className="text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">MATCHES OPEN</div>
              <div className="text-2xl sm:text-3xl font-black leading-none">28</div>
              <div className="text-[10px] font-bold uppercase mt-1">MAKE YOUR PICKS</div>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="flex flex-col xl:flex-row flex-1">
          
          {/* Left Column: Matches */}
          <div className="flex-1 border-r-0 xl:border-r-4 border-main flex flex-col bg-muted">
            
            {/* Tabs */}
            <div className="flex flex-wrap border-b-4 border-main font-black text-sm md:text-base uppercase">
              <button className="bg-c2 text-accent-inv px-6 py-3 border-r-4 border-main flex-1 min-w-[max-content] md:flex-none">GROUP STAGE</button>
              <button className="bg-card text-main hover:bg-elevated px-4 md:px-6 py-3 border-r-4 border-b-4 md:border-b-0 border-main flex-1 min-w-[max-content] md:flex-none">ROUND OF 16</button>
              <button className="bg-card text-main hover:bg-elevated px-4 md:px-6 py-3 border-r-4 border-b-4 md:border-b-0 border-main flex-1 min-w-[max-content] md:flex-none">QUARTER-FINALS</button>
              <button className="bg-card text-main hover:bg-elevated px-4 md:px-6 py-3 border-r-4 border-b-4 md:border-b-0 border-main flex-1 min-w-[max-content] md:flex-none">SEMI-FINALS</button>
              <button className="bg-card text-main hover:bg-elevated px-4 md:px-6 py-3 md:flex-1">FINAL</button>
            </div>
            
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between p-3 border-b-4 border-main bg-card gap-3">
               <div className="flex items-center gap-3 w-full sm:w-auto">
                 <button className="flex items-center justify-between border-2 border-main px-3 py-1.5 font-bold text-sm min-w-[140px] uppercase">
                   MATCHDAY 1 <ChevronDown size={16} />
                 </button>
                 <div className="flex items-center gap-2 font-bold text-sm uppercase px-2 py-1">
                   <Calendar size={16} />
                   JUN 12 - JUN 18
                 </div>
               </div>
               
               <div className="flex border-2 border-main font-bold text-xs uppercase self-stretch sm:self-auto overflow-hidden">
                 <button className="bg-c2 text-accent-inv px-4 py-1.5 border-r-2 border-main">ALL</button>
                 <button className="bg-card hover:bg-elevated px-4 py-1.5 border-r-2 border-main">OPEN</button>
                 <button className="bg-card hover:bg-elevated px-4 py-1.5 border-r-2 border-main">LOCKED</button>
                 <button className="bg-card hover:bg-elevated px-4 py-1.5">SUBMITTED</button>
               </div>
            </div>
            
            {/* Match List */}
            <div className="flex flex-col">
              {matches.map((match) => (
                <div key={match.id} className="flex border-b-4 border-main bg-card relative">
                  
                  {/* Featured Tag */}
                  {match.featured && (
                    <div className="absolute top-0 right-auto sm:left-24 bg-c1 border-x-4 border-b-4 border-main px-3 py-1 font-black text-[10px] uppercase flex items-center gap-1 z-10 shadow-[2px_2px_0_0_var(--color-shadow)]">
                      <Star size={12} fill="currentColor" /> FEATURED MATCH
                    </div>
                  )}

                  {/* Left Column (Date/Stadium) */}
                  <div className={`w-24 sm:w-32 border-r-4 border-main flex flex-col pt-6 sm:pt-4 p-2 sm:p-3 ${match.dateBg} justify-start`}>
                    <div className="font-bold text-[10px] sm:text-xs uppercase whitespace-nowrap mb-0.5">{match.month}</div>
                    <div className="font-black text-xl sm:text-2xl leading-none">{match.time}</div>
                    <div className="font-bold text-[9px] sm:text-[10px] uppercase opacity-80 mb-4 md:mb-6">UTC</div>
                    
                    <div className="mt-auto flex flex-col gap-0.5 text-faint hidden md:flex">
                       <span className="text-[9px] uppercase font-bold leading-tight">{match.stadium}</span>
                       <span className="text-[8px] uppercase font-bold opacity-80 leading-tight">{match.city}</span>
                    </div>
                  </div>

                  {/* Right Content */}
                  <div className={`flex-1 flex flex-col md:flex-row items-center p-3 lg:p-6 ${match.featured ? 'pt-8 lg:pt-8' : ''}`}>
                     
                     <div className="flex-1 flex items-center justify-between w-full relative">
                        {/* Team 1 */}
                        <div className="flex items-center gap-2 lg:gap-4 w-[35%] lg:w-[30%] justify-start">
                          <div className="w-8 h-8 lg:w-10 lg:h-10 border-2 border-main rounded-full overflow-hidden text-lg lg:text-xl flex items-center justify-center bg-elevated flex-shrink-0">
                            {match.flag1}
                          </div>
                          <span className="font-black text-sm lg:text-lg uppercase tracking-wide truncate">{match.team1}</span>
                        </div>

                        {/* Scores */}
                        <div className="flex flex-col items-center justify-center relative px-2">
                           <div className="flex items-center gap-2">
                            <input type="text" readOnly value={match.score1} className="w-10 h-10 lg:w-12 lg:h-12 border-[3px] border-main flex items-center justify-center font-black text-xl text-center bg-card shadow-[2px_2px_0_0_var(--color-shadow)] focus:shadow-none transition-all outline-none" />
                            <div className="font-black text-xl">-</div>
                            <input type="text" readOnly value={match.score2} className="w-10 h-10 lg:w-12 lg:h-12 border-[3px] border-main flex items-center justify-center font-black text-xl text-center bg-card shadow-[2px_2px_0_0_var(--color-shadow)] focus:shadow-none transition-all outline-none" />
                           </div>
                           <div className="absolute -bottom-5 w-[140px] text-center text-[8px] md:text-[9px] font-bold text-faint uppercase tracking-wider">
                             EXACT SCORE BONUS: 3 PTS
                           </div>
                        </div>

                        {/* Team 2 */}
                        <div className="flex items-center gap-2 lg:gap-4 w-[35%] lg:w-[30%] justify-end">
                          <span className="font-black text-sm lg:text-lg uppercase tracking-wide truncate">{match.team2}</span>
                          <div className="w-8 h-8 lg:w-10 lg:h-10 border-2 border-main rounded-full overflow-hidden text-lg lg:text-xl flex items-center justify-center bg-elevated flex-shrink-0">
                            {match.flag2}
                          </div>
                        </div>
                     </div>

                     {/* Mobile Stadium (shown below in flex on small screens) */}
                     <div className="w-full mt-4 flex items-center justify-between md:hidden pb-2 border-b border-line">
                        <div className="flex flex-col gap-0.5 text-faint">
                           <span className="text-[10px] uppercase font-bold leading-tight">{match.stadium}</span>
                           <span className="text-[9px] uppercase font-bold opacity-80 leading-tight">{match.city}</span>
                        </div>
                     </div>

                     {/* Right Actions */}
                     <div className="w-full md:w-auto mt-4 md:mt-0 md:ml-6 flex items-center space-x-3 justify-end">
                        <div className="border border-main bg-card rounded-full px-2 py-0.5 text-[10px] lg:text-xs font-bold whitespace-nowrap shadow-[1px_1px_0_0_var(--color-shadow)]">
                          {match.pts}
                        </div>
                        <button className={`${match.statusBg} text-accent-on font-black text-[10px] lg:text-xs uppercase tracking-wide px-3 lg:px-4 py-1.5 lg:py-2 border-2 border-main shadow-[2px_2px_0_0_var(--color-shadow)] flex items-center gap-1.5 min-w-[90px] lg:min-w-[110px] justify-center`}>
                           {match.submitted && <CheckCircle size={14} className="text-main" strokeWidth={3} />}
                           {match.status}
                        </button>
                     </div>

                  </div>
                </div>
              ))}
            </div>

            {/* Save Picks Action Block */}
            <div className="bg-c2 text-accent-inv p-6 md:p-8 flex items-center justify-between border-b-4 border-main cursor-pointer group transition-colors hover:opacity-80 transition-opacity">
               <div className="flex flex-col">
                  <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-1">SAVE MY PICKS</h2>
                  <p className="text-xs md:text-sm font-semibold opacity-90">All changes are saved automatically. Submit before kickoff to lock in your picks.</p>
               </div>
               <ArrowRight size={48} strokeWidth={3} className="transform group-hover:translate-x-2 transition-transform" />
            </div>

          </div>

          {/* Right Column: Sidebar */}
          <div className="w-full xl:w-[420px] bg-card flex flex-col">
            
            {/* My Slip Box */}
            <div className="flex flex-col">
               <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm flex justify-between items-center border-b-4 border-main">
                 <span>MY SLIP</span>
                 <span className="text-c1 font-bold text-xs"><span className="text-accent-inv">5/64</span> PICKS MADE</span>
               </div>
               <div className="bg-muted p-4 flex flex-col gap-3 border-b-4 border-main text-sm">
                 {slipItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between border-b border-line pb-2 last:border-0 last:pb-0">
                       <div className="flex items-center gap-2 font-bold text-subtle">
                          <div className="w-6 h-6 bg-card border border-line flex items-center justify-center shrink-0">
                             {item.icon}
                          </div>
                          {item.label}
                       </div>
                       <div className="flex items-center gap-4 text-right">
                          <span className="text-xs text-faint font-medium">{item.calculation}</span>
                          <span className="font-black w-14">{item.value}</span>
                       </div>
                    </div>
                 ))}
                 <div className="mt-2 pt-3 border-t-2 border-main flex items-center justify-between font-black uppercase">
                    <span className="text-subtle text-sm">TOTAL POTENTIAL POINTS</span>
                    <span className="text-xl">22 PTS</span>
                 </div>
               </div>
            </div>

            {/* Your Picks */}
            <div className="flex flex-col border-b-4 border-main">
               <div className="bg-main text-inv font-black px-4 py-2 uppercase tracking-wide text-[11px] flex justify-between items-center">
                 <span>YOUR PICKS (5)</span>
                 <span className="text-faint font-bold hover:text-inv cursor-pointer">VIEW ALL</span>
               </div>
               <div className="flex flex-col bg-card p-2 gap-1.5">
                  {yourPicks.map((p, i) => (
                     <div key={i} className="flex items-center justify-between text-xs font-bold border border-line p-2">
                        <div className="flex items-center gap-1.5 sm:gap-2 w-[40%]">
                           <span className="mr-1 flex items-center">{p.flag1}</span>
                           <span>{p.t1}</span>
                           <span className="text-faint font-normal ml-0.5 mr-0.5 text-[10px]">vs</span>
                           <span>{p.t2}</span>
                           <span className="ml-1 flex items-center">{p.flag2}</span>
                        </div>
                        <div className="font-black px-2">{p.score}</div>
                        <div className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-sm border border-main font-black ${p.bg} text-accent-on`}>
                           {p.status}
                        </div>
                     </div>
                  ))}
               </div>
            </div>

            {/* Top Players */}
            <div className="flex flex-col border-b-4 border-main">
               <div className="bg-main text-inv font-black px-4 py-2 uppercase tracking-wide text-[11px] flex justify-between items-center">
                 <span>TOP PLAYERS THIS WEEK</span>
                 <span className="text-faint font-bold hover:text-inv cursor-pointer" onClick={() => onNavigate('leaderboard')}>VIEW LEADERBOARD</span>
               </div>
               <div className="flex flex-col bg-card">
                  {leaderboardWrapper.map((item) => (
                     <div key={item.rank} className="flex border-b border-line last:border-b-0 items-stretch hover:bg-elevated transition-colors text-sm">
                        <div className={`w-8 sm:w-10 border-r border-line flex items-center justify-center font-black ${item.color} ${item.textRank}`}>
                         {item.rank}
                        </div>
                        <div className="p-2 border-r border-line flex items-center justify-center bg-elevated">
                         <User size={14} strokeWidth={3} className="text-main" />
                        </div>
                        <div className="flex-1 p-2 font-bold flex items-center">
                         {item.name}
                        </div>
                        <div className="p-2 font-black flex items-center justify-end text-main">
                         {item.pts} PTS
                        </div>
                     </div>
                  ))}
               </div>
            </div>

            {/* Bottom Info Blocks (Split) */}
            <div className="flex flex-row flex-1">
               <div className="flex-1 flex flex-col border-r-4 border-main">
                  <div className="bg-main text-inv font-black px-3 py-2 uppercase tracking-wide text-[11px]">
                     SCORING RULES
                  </div>
                  <div className="p-3 flex flex-col gap-2 font-bold text-xs bg-card text-subtle">
                     <div className="flex items-center gap-2">
                       <div className="bg-c1 p-1 border border-main flex items-center justify-center">
                         <Target size={14} strokeWidth={2.5} className="text-accent-on"/>
                       </div>
                       <span>Exact score = 3 pts</span>
                     </div>
                     <div className="flex items-center gap-2">
                       <div className="bg-c2 p-1 border border-main flex items-center justify-center">
                         <CheckCircle size={14} strokeWidth={2.5} className="text-accent-inv"/>
                       </div>
                       <span>Correct outcome = 1 pt</span>
                     </div>
                     <div className="flex items-center gap-2">
                       <div className="bg-c4 p-1 border border-main flex items-center justify-center">
                         <TrendingUp size={14} strokeWidth={2.5} className="text-accent-inv"/>
                       </div>
                       <span>Streak bonus up to 5 pts</span>
                     </div>
                  </div>
               </div>
               
               <div className="flex-1 flex flex-col bg-muted">
                  <div className="bg-main text-inv font-black px-3 py-2 uppercase tracking-wide text-[11px]">
                     NEXT DEADLINE
                  </div>
                  <div className="p-4 flex flex-col justify-center items-center h-full gap-1 pt-2">
                     <div className="text-3xl font-black text-c5 tracking-tighter">02:15:34</div>
                     <div className="text-center font-bold text-xs leading-tight">
                        Jun 12, 18:00 UTC<br/>BRA vs ESP
                     </div>
                  </div>
               </div>
            </div>

          </div>
        </div>
        
        {/* Step Strip at the very bottom */}
        <div className="flex flex-col md:flex-row bg-card border-t-4 border-main flex-shrink-0">
          <div className="flex items-stretch border-b-4 md:border-b-0 md:border-r-4 border-main flex-1">
             <div className="w-12 flex items-center justify-center border-r-4 border-main font-black text-3xl">1</div>
             <div className="w-12 flex items-center justify-center border-r-4 border-main bg-c1">
               <Pencil size={20} className="text-accent-on" />
             </div>
             <div className="p-2 sm:p-3 flex flex-col justify-center">
               <div className="font-black uppercase text-xs mb-0.5">Pick Scores</div>
               <div className="font-medium text-[10px] text-subtle leading-tight">Enter the exact scores<br className="hidden md:block"/>for each match.</div>
             </div>
          </div>
          <div className="flex items-stretch border-b-4 md:border-b-0 md:border-r-4 border-main flex-1">
             <div className="w-12 flex items-center justify-center border-r-4 border-main font-black text-3xl text-accent-inv bg-c2">2</div>
             <div className="w-12 flex items-center justify-center border-r-4 border-main bg-c2">
               <Lock size={20} className="text-accent-inv" />
             </div>
             <div className="p-2 sm:p-3 flex flex-col justify-center">
               <div className="font-black uppercase text-xs mb-0.5">Save Before Kickoff</div>
               <div className="font-medium text-[10px] text-subtle leading-tight">Submit your picks before<br className="hidden md:block"/>the match starts.</div>
             </div>
          </div>
          <div className="flex items-stretch border-b-4 md:border-b-0 md:border-r-4 border-main flex-1">
             <div className="w-12 flex items-center justify-center border-r-4 border-main font-black text-3xl">3</div>
             <div className="w-12 flex items-center justify-center border-r-4 border-main bg-c3">
               <BarChart2 size={20} className="text-accent-on" />
             </div>
             <div className="p-2 sm:p-3 flex flex-col justify-center">
               <div className="font-black uppercase text-xs mb-0.5">Climb Leaderboard</div>
               <div className="font-medium text-[10px] text-subtle leading-tight">Earn points and rank<br className="hidden md:block"/>higher each week.</div>
             </div>
          </div>
          <div className="flex items-stretch flex-1">
             <div className="w-12 flex items-center justify-center border-r-4 border-main font-black text-3xl bg-c4">4</div>
             <div className="w-12 flex items-center justify-center border-r-4 border-main bg-c4">
               <Trophy size={20} className="text-accent-on" />
             </div>
             <div className="p-2 sm:p-3 flex flex-col justify-center">
               <div className="font-black uppercase text-xs mb-0.5">Win Prize Pool</div>
               <div className="font-medium text-[10px] text-subtle leading-tight">Top players share the<br className="hidden md:block"/>$25,000 prize pool.</div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
