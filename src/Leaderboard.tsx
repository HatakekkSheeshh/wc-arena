import React from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Users, Wallet, ChevronDown, Calendar, Star, TrendingDown, TrendingUp, BarChart2, Medal, User, Settings } from 'lucide-react';
import { RainbowGraphic } from './Landing';
import LegacySettingsMenu from './components/LegacySettingsMenu';

export default function Leaderboard({ onNavigate, isVintage, setIsVintage, isDark, setIsDark, isRounded, setIsRounded, hasShadow, setHasShadow, hasFrame, setHasFrame }: { onNavigate: (page: string) => void, isVintage: boolean, setIsVintage: (v: boolean) => void, isDark: boolean, setIsDark: (v: boolean) => void, isRounded: boolean, setIsRounded: (v: boolean) => void, hasShadow: boolean, setHasShadow: (v: boolean) => void, hasFrame: boolean, setHasFrame: (v: boolean) => void }) {
  const { t } = useTranslation();
  const themeControls = { isVintage, setIsVintage, isDark, setIsDark, isRounded, setIsRounded, hasShadow, setHasShadow, hasFrame, setHasFrame };

  const leaderboardTop3 = [
    { rank: 2, name: 'NetBuster', pts: '2,120', avatar: 'https://i.pravatar.cc/150?u=2', exactScores: 34, color: 'bg-c2', textColor: 'text-accent-inv', border: 'border-main' },
    { rank: 1, name: 'GoalGuru', pts: '2,450', avatar: 'https://i.pravatar.cc/150?u=1', exactScores: 41, color: 'bg-c1', textColor: 'text-accent-on', border: 'border-main' },
    { rank: 3, name: 'PitchWizard', pts: '1,980', avatar: 'https://i.pravatar.cc/150?u=3', exactScores: 32, color: 'bg-c4', textColor: 'text-accent-on', border: 'border-main' },
  ];

  const leaderboardRest = [
    { rank: 4, name: 'ScoreMaster', avatar: 'https://i.pravatar.cc/150?u=4', pts: '1,765', exactScores: 29, accuracy: 68, streak: 6, change: 0 },
    { rank: 5, name: 'TheOptimist', avatar: 'https://i.pravatar.cc/150?u=5', pts: '1,620', exactScores: 27, accuracy: 64, streak: 5, change: 2 },
    { rank: 6, name: 'KickKing', avatar: 'https://i.pravatar.cc/150?u=6', pts: '1,510', exactScores: 24, accuracy: 61, streak: 4, change: -1 },
    { rank: 7, name: 'WorldCupFan', avatar: 'https://i.pravatar.cc/150?u=7', pts: '1,430', exactScores: 23, accuracy: 59, streak: 3, change: 3 },
    { rank: 8, name: 'PredicTactix', avatar: 'https://i.pravatar.cc/150?u=8', pts: '1,365', exactScores: 22, accuracy: 57, streak: 2, change: -2 },
    { rank: 9, name: 'GoldenBoot', avatar: 'https://i.pravatar.cc/150?u=9', pts: '1,295', exactScores: 20, accuracy: 55, streak: 4, change: 0 },
    { rank: 10, name: 'SuperPicks', avatar: 'https://i.pravatar.cc/150?u=10', pts: '1,210', exactScores: 19, accuracy: 53, streak: 3, change: 1 },
  ];

  const recentMovers = [
    { name: 'RisingStar', avatar: 'https://i.pravatar.cc/150?u=11', pts: '1,180', change: 25 },
    { name: 'FootyGuru', avatar: 'https://i.pravatar.cc/150?u=12', pts: '1,105', change: 18 },
    { name: 'OldSchool', avatar: 'https://i.pravatar.cc/150?u=13', pts: '980', change: -20 },
  ];

  return (
    <div className="min-h-screen bg-page p-3 sm:p-4 lg:p-6 flex items-center justify-center font-sans">
      <div className="w-full max-w-[1600px] border-4 border-main rounded-lg shadow-[8px_8px_0px_var(--color-shadow)] sm:shadow-[16px_16px_0px_var(--color-shadow)] overflow-hidden flex flex-col mx-auto transition-all relative bg-card">
        
        {/* Mac OS styling frame header */}
        <div className="w-full h-8 border-b-4 border-main bg-main flex items-center px-4 gap-2 relative z-30">
          <div className="w-3 h-3 rounded-full bg-c5"></div>
          <div className="w-3 h-3 rounded-full bg-c1"></div>
          <div className="w-3 h-3 rounded-full bg-c3"></div>
        </div>

        {/* Navigation */}
        <nav className="flex items-center justify-between border-b-4 border-main px-6 py-4 bg-card z-30 relative">
          <div className="text-xl md:text-3xl font-black uppercase tracking-tighter cursor-pointer" onClick={() => onNavigate('landing')}>PREDICT 2026</div>
          <div className="hidden lg:flex space-x-10 font-bold uppercase text-sm tracking-wide">
            <button className="hover:text-c2 transition-colors pb-1 text-main" onClick={() => onNavigate('matches')}>{t('nav.public.matches')}</button>
            <button className="text-c2 uppercase tracking-wide border-b-4 border-c2 pb-1">{t('nav.public.leaderboard')}</button>
            <button className="hover:text-c2 transition-colors pb-1 text-main" onClick={() => onNavigate('rules')}>{t('nav.public.rules')}</button>
            <button className="hover:text-c2 transition-colors pb-1 text-main" onClick={() => onNavigate('prize-pool')}>{t('nav.public.prizePool')}</button>
          </div>
          <div className="flex items-center gap-3">
            <LegacySettingsMenu {...themeControls} />
            <button className="bg-c2 hover:opacity-80 transition-opacity text-inv font-black py-2 px-4 border-2 border-main flex items-center gap-3 transition-transform transform active:scale-95 shadow-[4px_4px_0_0_var(--color-shadow)]">
              <Wallet size={18} strokeWidth={2.5} />
              <div className="flex flex-col items-start leading-[1.1] hidden sm:flex">
                <span className="text-[10px] uppercase font-bold opacity-80">Wallet</span>
                <span className="text-sm">$125.40</span>
              </div>
              <ChevronDown size={18} className="ml-1 hidden sm:block" />
            </button>
          </div>
        </nav>

        {/* BIG BACKGROUND IMAGE */}
        <div className="absolute inset-x-0 top-[84px] h-[calc(100vh-116px)] z-0 pointer-events-none opacity-90 overflow-hidden flex justify-center">
           <img src="https://s6.imgcdn.dev/Ybh5S0.webp" alt="Background" className="w-full h-full object-cover object-top" />
        </div>

        {/* Main Content Area (Scrollable or growing) */}
        <div className="relative z-10 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6 min-h-0">
          
          {/* Top Info Banner */}
          <div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col w-full xl:w-1/2 shadow-[8px_8px_0_0_var(--color-shadow)]">
             <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-1 text-main">
                {t('nav.public.leaderboard')}
             </h1>
          </div>

          {/* Main White Wrapper for Content */}
          <div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col gap-4 lg:gap-6 shadow-[8px_8px_0_0_var(--color-shadow)] rounded-sm">
            {/* Stats Section */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <div className="flex border-4 border-main bg-c1 p-3 sm:p-4 text-main shadow-[4px_4px_0_0_var(--color-shadow)]">
              <div className="shrink-0 mr-3"><Trophy size={36} strokeWidth={2.5}/></div>
              <div className="flex flex-col justify-center">
                <div className="text-[10px] sm:text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">{t('nav.public.prizePool')}</div>
                <div className="text-xl sm:text-2xl font-black leading-none">$25,000</div>
                <div className="text-[8px] sm:text-[10px] font-bold uppercase mt-1">TOTAL GUARANTEED</div>
              </div>
            </div>
            <div className="flex border-4 border-main bg-c2 p-3 sm:p-4 text-inv shadow-[4px_4px_0_0_var(--color-shadow)]">
              <div className="shrink-0 mr-3"><Users size={36} strokeWidth={2.5}/></div>
              <div className="flex flex-col justify-center">
                <div className="text-[10px] sm:text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">TOTAL PLAYERS</div>
                <div className="text-xl sm:text-2xl font-black leading-none">12,480</div>
                <div className="text-[8px] sm:text-[10px] font-bold uppercase mt-1">JOINED</div>
              </div>
            </div>
            <div className="flex border-4 border-main bg-c3 p-3 sm:p-4 text-main shadow-[4px_4px_0_0_var(--color-shadow)]">
              <div className="shrink-0 mr-3"><BarChart2 size={36} strokeWidth={2.5}/></div>
              <div className="flex flex-col justify-center">
                <div className="text-[10px] sm:text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">YOUR RANK</div>
                <div className="text-xl sm:text-2xl font-black leading-none">124</div>
                <div className="text-[8px] sm:text-[10px] font-bold uppercase mt-1 opacity-80">OUT OF 12,480</div>
              </div>
            </div>
            <div className="flex border-4 border-main bg-c4 p-3 sm:p-4 text-main shadow-[4px_4px_0_0_var(--color-shadow)]">
              <div className="shrink-0 mr-3"><Star size={36} fill="currentColor" strokeWidth={2.5}/></div>
              <div className="flex flex-col justify-center">
                <div className="text-[10px] sm:text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">YOUR POINTS</div>
                <div className="text-xl sm:text-2xl font-black leading-none">1,250</div>
                <div className="text-[8px] sm:text-[10px] font-bold uppercase mt-1">TOTAL POINTS</div>
              </div>
            </div>
          </div>

          {/* 2-Column Split */}
          <div className="flex flex-col xl:flex-row gap-4 lg:gap-6 items-start">
             
             {/* Left Column (Leaderboard) */}
             <div className="flex-1 w-full flex flex-col gap-4">
                
                {/* Tabs */}
                <div className="flex flex-col sm:flex-row font-black text-xs md:text-sm uppercase tracking-wide gap-4">
                   <div className="flex flex-1 border-4 border-main bg-card shadow-[4px_4px_0_0_var(--color-shadow)] rounded-sm overflow-hidden">
                     <button className="bg-c2 text-accent-inv px-2 py-2 md:py-3 border-r-4 border-main flex-1 text-center">GLOBAL</button>
                     <button className="text-main hover:bg-elevated px-2 py-2 md:py-3 border-r-4 border-main flex-1 text-center">FRIENDS</button>
                     <button className="text-main hover:bg-elevated px-2 py-2 md:py-3 flex-1 text-center">WEEKLY</button>
                   </div>
                   <div className="flex flex-1 border-4 border-main bg-card shadow-[4px_4px_0_0_var(--color-shadow)] rounded-sm overflow-hidden">
                     <button className="bg-c2 text-accent-inv px-1 py-2 md:py-3 border-r-4 border-main flex-1 text-center">GROUP STAGE</button>
                     <button className="text-main hover:bg-elevated px-1 py-2 md:py-3 border-r-4 border-main flex-1 text-center">KNOCKOUT</button>
                     <button className="text-main hover:bg-elevated px-1 py-2 md:py-3 flex-1 text-center">OVERALL</button>
                   </div>
                </div>

                {/* Leaderboard Master Box */}
                <div className="border-4 border-main bg-card flex flex-col shadow-[8px_8px_0_0_var(--color-shadow)]">
                   
                   {/* Podium */}
                   <div className="flex flex-col sm:flex-row items-end p-4 md:p-6 lg:p-8 pb-0 gap-4 md:gap-0 justify-center">
                     {/* 2nd Place */}
                     <div className={`w-full sm:w-1/3 border-4 border-main border-b-0 rounded-t-lg pt-10 pb-4 px-3 flex flex-col items-center relative ${leaderboardTop3[0].color} ${leaderboardTop3[0].textColor} sm:-mr-2 z-10 sm:shadow-[2px_0px_0_0_var(--color-shadow)]`}>
                        <div className="absolute -top-6 w-12 h-12 rounded-full border-4 border-main bg-card flex items-center justify-center font-black text-xl text-main shadow-[2px_2px_0_0_var(--color-shadow)]">
                          2
                        </div>
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-main overflow-hidden bg-elevated mb-3 flex-shrink-0 shadow-[2px_2px_0_0_var(--color-shadow)]">
                           <img src={leaderboardTop3[0].avatar} alt={leaderboardTop3[0].name} className="w-full h-full object-cover" />
                        </div>
                        <div className="font-bold text-sm md:text-lg leading-tight truncate w-full text-center">{leaderboardTop3[0].name}</div>
                        <div className="font-black text-2xl md:text-3xl mb-4">{leaderboardTop3[0].pts} <span className="text-sm md:text-lg">PTS</span></div>
                        <div className="bg-card text-main border-2 border-main rounded-sm px-2 py-1 flex items-center gap-1 text-[9px] md:text-[10px] font-black uppercase text-center justify-center shadow-[2px_2px_0_0_var(--color-shadow)]">
                           <Star size={12} fill="currentColor" /> EXACT SCORES: {leaderboardTop3[0].exactScores}
                        </div>
                     </div>

                     {/* 1st Place */}
                     <div className={`w-full sm:w-[40%] xl:w-[38%] border-4 border-main border-b-0 rounded-t-lg pt-12 pb-6 px-4 flex flex-col items-center relative ${leaderboardTop3[1].color} ${leaderboardTop3[1].textColor} z-20 shadow-[0px_-2px_0_0_var(--color-shadow)] transform sm:-translate-y-4`}>
                        <div className="absolute -top-7 w-14 h-14 rounded-full border-4 border-main bg-c1 flex items-center justify-center font-black text-3xl text-main shadow-[2px_2px_0_0_var(--color-shadow)]">
                          1
                        </div>
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-main overflow-hidden bg-elevated mb-3 flex-shrink-0 shadow-[2px_2px_0_0_var(--color-shadow)]">
                           <img src={leaderboardTop3[1].avatar} alt={leaderboardTop3[1].name} className="w-full h-full object-cover" />
                        </div>
                        <div className="font-bold text-base md:text-xl leading-tight truncate w-full text-center">{leaderboardTop3[1].name}</div>
                        <div className="font-black text-3xl md:text-4xl mb-4 text-main">{leaderboardTop3[1].pts} <span className="text-lg md:text-xl">PTS</span></div>
                        <div className="bg-card text-main border-2 border-main rounded-sm px-3 py-1 flex items-center gap-1 text-[10px] md:text-[11px] font-black uppercase text-center justify-center shadow-[2px_2px_0_0_var(--color-shadow)]">
                           <Star size={14} fill="currentColor" /> EXACT SCORES: {leaderboardTop3[1].exactScores}
                        </div>
                     </div>

                     {/* 3rd Place */}
                     <div className={`w-full sm:w-1/3 border-4 border-main border-b-0 rounded-t-lg pt-10 pb-4 px-3 flex flex-col items-center relative ${leaderboardTop3[2].color} ${leaderboardTop3[2].textColor} sm:-ml-2 z-10 sm:shadow-[-2px_0px_0_0_var(--color-shadow)]`}>
                        <div className="absolute -top-6 w-12 h-12 rounded-full border-4 border-main bg-card flex items-center justify-center font-black text-xl text-main shadow-[2px_2px_0_0_var(--color-shadow)]">
                          3
                        </div>
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-main overflow-hidden bg-elevated mb-3 flex-shrink-0 shadow-[2px_2px_0_0_var(--color-shadow)]">
                           <img src={leaderboardTop3[2].avatar} alt={leaderboardTop3[2].name} className="w-full h-full object-cover" />
                        </div>
                        <div className="font-bold text-sm md:text-lg leading-tight truncate w-full text-center">{leaderboardTop3[2].name}</div>
                        <div className="font-black text-2xl md:text-3xl mb-4 text-inv">{leaderboardTop3[2].pts} <span className="text-sm md:text-lg">PTS</span></div>
                        <div className="bg-card text-main border-2 border-main rounded-sm px-2 py-1 flex items-center gap-1 text-[9px] md:text-[10px] font-black uppercase text-center justify-center shadow-[2px_2px_0_0_var(--color-shadow)]">
                           <Star size={12} fill="currentColor" /> EXACT SCORES: {leaderboardTop3[2].exactScores}
                        </div>
                     </div>
                   </div>

                   {/* Main List Box */}
                   <div className="border-t-4 border-main">
                      {/* Table Header */}
                      <div className="hidden sm:flex items-center border-b-4 border-main p-3 font-black text-xs uppercase bg-card text-main tracking-wide">
                         <div className="w-16 text-center">RANK</div>
                         <div className="w-12"></div>
                         <div className="flex-1">PLAYER</div>
                         <div className="w-24 text-center">POINTS</div>
                         <div className="w-32 text-center text-[10px] lg:text-xs">EXACT SCORES</div>
                         <div className="w-32 text-center">ACCURACY</div>
                         <div className="w-20 text-center">STREAK</div>
                         <div className="w-20 text-center">CHANGE</div>
                      </div>

                      {/* Table Rows */}
                      <div className="flex flex-col">
                         {leaderboardRest.map((item, idx) => (
                           <div key={item.rank} className={`flex flex-col sm:flex-row sm:items-center p-3 lg:p-3 border-b-2 border-line hover:bg-muted transition-colors`}>
                              
                              <div className="flex items-center flex-1 sm:w-auto mb-2 sm:mb-0">
                                <div className="w-10 sm:w-16 font-black text-base sm:text-lg text-center">{item.rank}</div>
                                <div className="w-8 h-8 rounded-full border-2 border-main overflow-hidden bg-elevated mr-3 flex-shrink-0">
                                   <img src={item.avatar} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 font-bold text-sm lg:text-base leading-tight truncate">{item.name}</div>
                                <div className="font-black text-base sm:hidden">{item.pts}</div>
                              </div>

                              <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto text-xs sm:text-sm pl-10 sm:pl-0 font-bold">
                                 <div className="hidden sm:block w-24 text-center text-sm">{item.pts}</div>
                                 <div className="w-auto sm:w-32 text-center text-subtle sm:text-main flex flex-col sm:flex-row items-center sm:justify-center">
                                   <span className="sm:hidden text-[9px] uppercase font-black tracking-widest text-faint mb-0.5">EXACT</span>
                                   {item.exactScores}
                                 </div>
                                 <div className="w-auto sm:w-32 text-center flex flex-col sm:flex-row sm:items-center sm:justify-center gap-1 sm:gap-2">
                                   <span className="sm:hidden text-[9px] uppercase font-black tracking-widest text-faint mb-0.5">ACCURACY</span>
                                   <div className="flex items-center justify-center gap-2">
                                     <span className="w-8 text-right font-medium">{item.accuracy}%</span>
                                     <div className="hidden sm:block w-12 h-2 bg-muted rounded-full border border-main overflow-hidden">
                                       <div className="bg-c3 h-full" style={{ width: `${item.accuracy}%` }}></div>
                                     </div>
                                   </div>
                                 </div>
                                 <div className="w-auto sm:w-20 text-center flex flex-col sm:flex-row items-center sm:justify-center gap-0.5 font-medium">
                                   <span className="sm:hidden text-[9px] uppercase font-black tracking-widest text-faint mb-0.5">STREAK</span>
                                   {item.streak} <span className="text-c4" style={{filter: 'drop-shadow(1px 1px 0px var(--color-main))'}}>🔥</span>
                                 </div>
                                 <div className="w-auto sm:w-20 text-center flex flex-col sm:flex-row items-center sm:justify-center">
                                   <span className="sm:hidden text-[9px] uppercase font-black tracking-widest text-faint mb-0.5">CHANGE</span>
                                   {item.change > 0 ? (
                                      <span className="text-c3 drop-shadow-[1px_1px_0_var(--color-main)]">▲ {item.change}</span>
                                   ) : item.change < 0 ? (
                                      <span className="text-c5 drop-shadow-[1px_1px_0_var(--color-main)]">▼ {Math.abs(item.change)}</span>
                                   ) : (
                                      <span className="text-subtle font-bold">—</span>
                                   )}
                                 </div>
                              </div>

                           </div>
                         ))}

                         {/* "Your Rank" Row */}
                         <div className="flex flex-col sm:flex-row sm:items-center p-3 lg:p-3 bg-c1 border-y-4 border-main hover:opacity-90">
                            <div className="flex items-center flex-1 sm:w-auto mb-2 sm:mb-0 text-main">
                              <div className="w-10 sm:w-16 font-black text-lg text-center">124</div>
                              <div className="w-8 h-8 rounded-full border-2 border-main overflow-hidden bg-card mr-3 flex-shrink-0">
                                 <User size={20} className="w-full h-full p-1 text-main" />
                              </div>
                              <div className="flex-1 font-black text-sm lg:text-base leading-tight truncate">Your Name</div>
                              <div className="font-black text-base sm:hidden">1,250</div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto text-xs sm:text-sm pl-10 sm:pl-0 font-black text-main">
                               <div className="hidden sm:block w-24 text-center">1,250</div>
                               <div className="w-auto sm:w-32 text-center flex flex-col sm:flex-row items-center sm:justify-center">
                                 <span className="sm:hidden text-[9px] uppercase tracking-widest opacity-70 mb-0.5">EXACT</span>
                                 18
                               </div>
                               <div className="w-auto sm:w-32 text-center flex flex-col sm:flex-row sm:items-center sm:justify-center gap-1 sm:gap-2">
                                 <span className="sm:hidden text-[9px] uppercase tracking-widest opacity-70 mb-0.5">ACCURACY</span>
                                 <div className="flex items-center justify-center gap-2">
                                   <span className="w-8 text-right">52%</span>
                                   <div className="hidden sm:block w-12 h-2 bg-main/10 rounded-full border border-main overflow-hidden">
                                     <div className="bg-main h-full" style={{ width: `52%` }}></div>
                                   </div>
                                 </div>
                               </div>
                               <div className="w-auto sm:w-20 text-center flex flex-col sm:flex-row items-center sm:justify-center gap-0.5">
                                 <span className="sm:hidden text-[9px] uppercase tracking-widest opacity-70 mb-0.5">STREAK</span>
                                 2 <span className="text-c4" style={{filter: 'drop-shadow(1px 1px 0px var(--color-main))'}}>🔥</span>
                               </div>
                               <div className="w-auto sm:w-20 text-center flex flex-col sm:flex-row items-center sm:justify-center font-black">
                                 <span className="sm:hidden text-[9px] uppercase tracking-widest opacity-70 mb-0.5">CHANGE</span>
                                 <span className="text-c3 font-black bg-main text-[#E4FF00] px-1 shadow-[2px_2px_0_0_var(--color-card)] border border-card">▲ 15</span>
                               </div>
                            </div>
                         </div>

                         {/* Pagination */}
                         <div className="p-4 sm:p-6 flex items-center justify-center gap-1 sm:gap-2 font-bold text-xs sm:text-sm bg-card border-t-2 border-main border-dashed">
                            <button className="w-8 h-8 flex items-center justify-center border-2 border-main hover:bg-elevated transition-colors shadow-[2px_2px_0_0_var(--color-shadow)]">«</button>
                            <button className="w-8 h-8 flex items-center justify-center border-2 border-main hover:bg-elevated transition-colors shadow-[2px_2px_0_0_var(--color-shadow)]">1</button>
                            <button className="w-8 h-8 flex items-center justify-center border-2 border-main bg-c2 text-accent-inv shadow-[2px_2px_0_0_var(--color-shadow)]">2</button>
                            <button className="w-8 h-8 flex items-center justify-center border-2 border-main hover:bg-elevated transition-colors shadow-[2px_2px_0_0_var(--color-shadow)] hidden sm:flex">3</button>
                            <button className="w-8 h-8 flex items-center justify-center border-2 border-main hover:bg-elevated transition-colors shadow-[2px_2px_0_0_var(--color-shadow)] hidden sm:flex">4</button>
                            <button className="w-8 h-8 flex items-center justify-center border-2 border-main hover:bg-elevated transition-colors shadow-[2px_2px_0_0_var(--color-shadow)] hidden md:flex">5</button>
                            <span className="w-6 sm:w-8 text-center text-subtle">...</span>
                            <button className="w-10 h-8 flex items-center justify-center border-2 border-main hover:bg-elevated transition-colors shadow-[2px_2px_0_0_var(--color-shadow)] hidden sm:flex">249</button>
                            <button className="w-10 h-8 flex items-center justify-center border-2 border-main hover:bg-elevated transition-colors shadow-[2px_2px_0_0_var(--color-shadow)]">250</button>
                            <button className="w-8 h-8 flex items-center justify-center border-2 border-main hover:bg-elevated transition-colors shadow-[2px_2px_0_0_var(--color-shadow)]">»</button>
                         </div>

                      </div>
                   </div>
                </div>
             </div>

             {/* Right Column: Sidebar Panels */}
             <div className="w-full xl:w-[350px] flex flex-col gap-4 lg:gap-6 flex-shrink-0">
               
               {/* YOUR STATS */}
               <div className="bg-card border-4 border-main flex flex-col shadow-[8px_8px_0_0_var(--color-shadow)]">
                  <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-xs flex justify-between items-center border-b-4 border-main">
                    <span>YOUR STATS</span>
                    <span className="text-faint font-bold hover:text-inv cursor-pointer lowercase hover:underline">VIEW FULL STATS</span>
                  </div>
                  <div className="p-4 flex flex-col gap-3 font-bold text-sm">
                    <div className="flex justify-between items-center pb-2 border-b-2 border-line border-dashed text-subtle">
                       <span className="flex items-center gap-2 text-main"><Trophy size={16} /> RANK</span>
                       <span className="text-main font-black">124</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b-2 border-line border-dashed text-subtle">
                       <span className="flex items-center gap-2 text-main"><Star size={16} /> POINTS</span>
                       <span className="text-main font-black">1,250</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b-2 border-line border-dashed text-subtle">
                       <span className="flex items-center gap-2 text-main"><Star size={16} /> EXACT SCORES</span>
                       <span className="text-main font-black">18</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b-2 border-line text-subtle">
                       <span className="flex items-center gap-2 text-main"><Calendar size={16} /> TOTAL {t('nav.public.matches')}</span>
                       <span className="text-main font-black">28</span>
                    </div>
                    
                    <div className="pt-2 flex flex-col gap-2">
                       <div className="flex justify-between items-center text-xs uppercase font-black tracking-widest text-main">
                          <span>ACCURACY</span>
                          <span>52%</span>
                       </div>
                       <div className="w-full h-3 bg-muted border-2 border-main overflow-hidden">
                          <div className="h-full bg-c3" style={{ width: '52%' }}></div>
                       </div>
                    </div>
                  </div>
               </div>

               {/* TOP PRIZE BREAKDOWN */}
               <div className="bg-card border-4 border-main flex flex-col shadow-[8px_8px_0_0_var(--color-shadow)]">
                  <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-xs border-b-4 border-main">
                    TOP PRIZE BREAKDOWN
                  </div>
                  <div className="p-4 flex flex-col text-sm font-bold text-main">
                    <div className="flex justify-between items-center pb-2 border-b border-line mb-2">
                       <span className="flex items-center gap-2"><div className="w-5 text-center text-base drop-shadow-[1px_1px_0_var(--color-shadow)]">🏆</div> 1ST PLACE</span>
                       <span className="text-c3 font-black">$10,000</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-line mb-2">
                       <span className="flex items-center gap-2"><div className="w-5 text-center text-base drop-shadow-[1px_1px_0_var(--color-shadow)]">🥈</div> 2ND PLACE</span>
                       <span className="text-c2 font-black">$5,000</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-line mb-2">
                       <span className="flex items-center gap-2"><div className="w-5 text-center text-base drop-shadow-[1px_1px_0_var(--color-shadow)]">🥉</div> 3RD PLACE</span>
                       <span className="text-c4 font-black">$2,500</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                       <span className="pl-7">4TH - 10TH</span>
                       <span>$1,000</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                       <span className="pl-7">11TH - 100TH</span>
                       <span>$250</span>
                    </div>
                    <div className="flex justify-between items-center py-1 mb-2">
                       <span className="pl-7 text-xs">101ST - 1000TH</span>
                       <span>$50</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t-2 border-main font-black uppercase">
                       <span>TOTAL {t('nav.public.prizePool')}</span>
                       <span className="text-lg">$25,000</span>
                    </div>
                  </div>
               </div>

               {/* RECENT MOVERS */}
               <div className="bg-card border-4 border-main flex flex-col shadow-[8px_8px_0_0_var(--color-shadow)]">
                  <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-xs flex justify-between items-center border-b-4 border-main">
                    <span>RECENT MOVERS</span>
                    <span className="text-faint font-bold hover:text-inv cursor-pointer lowercase hover:underline">VIEW ALL</span>
                  </div>
                  <div className="flex flex-col">
                     {recentMovers.map((mover, idx) => (
                        <div key={idx} className="flex px-4 py-2.5 border-b border-line last:border-b-0 items-center justify-between text-sm font-bold">
                           <div className="flex items-center gap-2 w-14 shrink-0">
                              {mover.change > 0 ? (
                                 <span className="text-c3 flex items-center font-black drop-shadow-[1px_1px_0_var(--color-shadow)]"><TrendingUp size={14} className="mr-0.5" strokeWidth={3}/> {mover.change}</span>
                              ) : (
                                 <span className="text-c5 flex items-center font-black drop-shadow-[1px_1px_0_var(--color-shadow)]"><TrendingDown size={14} className="mr-0.5" strokeWidth={3}/> {Math.abs(mover.change)}</span>
                              )}
                           </div>
                           <div className="flex-1 flex items-center gap-2 ml-1">
                              <div className="w-6 h-6 rounded-full border-2 border-main overflow-hidden bg-elevated shrink-0">
                                 <img src={mover.avatar} alt={mover.name} className="w-full h-full object-cover" />
                              </div>
                              <span className="truncate">{mover.name}</span>
                           </div>
                           <div className="font-medium flex items-baseline gap-1 text-right">
                              {mover.pts} <span className="text-[9px] font-black tracking-widest text-faint hidden sm:block">PTS</span>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               {/* NEXT DEADLINE */}
               <div className="bg-card border-4 border-main flex flex-col shadow-[8px_8px_0_0_var(--color-shadow)]">
                  <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-xs border-b-4 border-main">
                    NEXT DEADLINE
                  </div>
                  <div className="p-4 flex items-center gap-4 justify-center">
                     <div className="w-12 h-12 bg-card border-2 border-main flex items-center justify-center shrink-0 shadow-[4px_4px_0_0_var(--color-shadow)]">
                        <Calendar size={28} />
                     </div>
                     <div className="flex flex-col text-center">
                        <div className="text-3xl font-black text-c5 tracking-tighter flex items-center justify-center gap-1 drop-shadow-[1px_1px_0_var(--color-shadow)]">
                           02<span className="text-main mb-1">:</span>15<span className="text-main mb-1">:</span>34
                        </div>
                        <div className="flex items-center justify-center gap-6 text-[9px] font-black uppercase text-main tracking-widest mt-[-2px] mb-2 pr-1">
                           <span>HRS</span><span>MINS</span><span>SECS</span>
                        </div>
                        <div className="font-bold text-xs uppercase tracking-wide">
                           Jun 12, 18:00 UTC <span className="mx-1">•</span> BRA vs ESP
                        </div>
                     </div>
                  </div>
               </div>

             </div>
          </div>
          </div>

        </div>
      </div>
    </div>
  );
}
