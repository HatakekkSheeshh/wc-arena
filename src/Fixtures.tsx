import React from 'react';
import { useTranslation } from 'react-i18next';
import { FR, DE, AR, SA, BR, MX, GB, TN, US as USFlag, ES, CR, MA, HR, CH, HU } from 'country-flag-icons/react/3x2';
import {
  Trophy, Wallet, ChevronDown, ChevronRight, Clock, Search, Filter,
  MapPin, CheckCircle2, XCircle, ArrowRight, Star, AlertCircle,
  PlayCircle, Calendar, Flag, Goal, Activity, BarChart2, Check, ExternalLink, CalendarDays, MonitorPlay, Binoculars, Pencil, Settings
} from 'lucide-react';
import LegacySettingsMenu from './components/LegacySettingsMenu';

export default function Fixtures({ onNavigate, isVintage, setIsVintage, isDark, setIsDark, isRounded, setIsRounded, hasShadow, setHasShadow, hasFrame, setHasFrame }: { onNavigate: (page: string) => void, isVintage: boolean, setIsVintage: (v: boolean) => void, isDark: boolean, setIsDark: (v: boolean) => void, isRounded: boolean, setIsRounded: (v: boolean) => void, hasShadow: boolean, setHasShadow: (v: boolean) => void, hasFrame: boolean, setHasFrame: (v: boolean) => void }) {
  const { t } = useTranslation();
  const themeControls = { isVintage, setIsVintage, isDark, setIsDark, isRounded, setIsRounded, hasShadow, setHasShadow, hasFrame, setHasFrame };

  return (
    <div className="h-[100dvh] bg-page p-3 sm:p-4 lg:p-6 flex flex-col font-sans relative">
      <div className="w-full max-w-[1600px] border-4 border-main rounded-lg shadow-[8px_8px_0px_var(--color-shadow)] sm:shadow-[16px_16px_0px_var(--color-shadow)] overflow-hidden flex flex-col mx-auto transition-all relative bg-card flex-1 min-h-0">
        
        {/* Header Bar */}
        <div className="w-full h-8 border-b-4 border-main bg-main flex items-center px-4 gap-2 relative z-30 shrink-0">
          <div className="w-3 h-3 rounded-full bg-c5"></div>
          <div className="w-3 h-3 rounded-full bg-c1"></div>
          <div className="w-3 h-3 rounded-full bg-c3"></div>
        </div>

        {/* Navigation */}
        <nav className="flex items-center justify-between border-b-4 border-main px-6 py-4 bg-card z-30 relative shrink-0">
          <div className="text-xl md:text-3xl font-black uppercase tracking-tighter cursor-pointer" onClick={() => onNavigate('landing')}>PREDICT 2026</div>
          <div className="hidden lg:flex space-x-10 font-bold uppercase text-sm tracking-wide">
            <button className="text-c2 uppercase tracking-wide border-b-4 border-c2 pb-1" onClick={() => onNavigate('matches')}>{t('nav.public.matches')}</button>
            <button className="hover:text-c2 transition-colors pb-1" onClick={() => onNavigate('leaderboard')}>{t('nav.public.leaderboard')}</button>
            <button className="hover:text-c2 transition-colors pb-1" onClick={() => onNavigate('rules')}>{t('nav.public.rules')}</button>
            <button className="hover:text-c2 transition-colors pb-1" onClick={() => onNavigate('prize-pool')}>{t('nav.public.prizePool')}</button>
          </div>
          <div className="flex items-center gap-3">
            <LegacySettingsMenu {...themeControls} />
            <button onClick={() => onNavigate('login')} className="bg-c2 hover:opacity-80 transition-opacity text-inv font-black py-2 px-4 border-2 border-main flex items-center gap-3 transition-transform transform active:scale-95 shadow-[4px_4px_0_0_var(--color-shadow)]">
              <Wallet size={18} strokeWidth={2.5} />
              <div className="flex flex-col items-start leading-[1.1] hidden sm:flex">
                <span className="text-[10px] uppercase font-bold opacity-80">Wallet</span>
                <span className="text-sm">$125.40</span>
              </div>
              <ChevronDown size={18} className="ml-1 hidden sm:block" />
            </button>
          </div>
        </nav>

        {/* Scrollable Content */}
        <div className="relative z-10 flex flex-col flex-1 overflow-y-auto bg-page min-h-0">
          
          {/* Header Section */}
          <div className="flex justify-between items-stretch border-b-4 border-main relative bg-card shrink-0 border-t-4 sm:border-t-0 border-main">
            <div className="flex flex-col px-6 py-6 lg:p-10 w-full lg:w-1/2 z-10 justify-center">
              <h1 className="text-5xl md:text-[5rem] font-black uppercase tracking-tighter leading-[0.85] mb-4 text-main drop-shadow-[4px_4px_0_rgba(0,0,0,0.05)]">
                FIXTURES
              </h1>
              <p className="font-bold text-base md:text-lg max-w-[450px] leading-snug text-main">
                Track every World Cup 2026 match, kickoff time, results, and prediction status.
              </p>
            </div>
            <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-2/3 pointer-events-none z-0">
               <img src="https://s6.imgcdn.dev/Ybh5S0.webp" alt="Background" className="w-[120%] h-full object-cover object-[center_20%]" />
               <div className="absolute inset-0 bg-gradient-to-r from-card via-transparent to-transparent"></div>
            </div>
          </div>

          {/* Top Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 border-b-4 border-main shrink-0 relative z-10">
            {/* Stat 1 */}
            <div className="bg-c3 p-4 lg:p-5 flex items-center gap-4 border-r-4 md:border-b-0 border-b-4 border-main">
              <div className="shrink-0 text-main">
                <MonitorPlay size={32} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                 <span className="font-black text-[10px] md:text-xs uppercase text-main opacity-90 tracking-widest mb-1 leading-none">TOTAL {t('nav.public.matches')}</span>
                 <span className="font-black text-2xl sm:text-3xl leading-none text-main">64</span>
              </div>
            </div>
            {/* Stat 2 */}
            <div className="bg-c2 text-inv p-4 lg:p-5 flex items-center gap-4 md:border-r-4 border-b-4 md:border-b-0 border-main">
              <div className="shrink-0 text-inv">
                <Activity size={32} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                 <span className="font-black text-[10px] md:text-xs uppercase opacity-90 tracking-widest mb-1 leading-none">LIVE NOW</span>
                 <span className="font-black text-2xl sm:text-3xl leading-none">2</span>
              </div>
            </div>
            {/* Stat 3 */}
            <div className="bg-c5 text-main p-4 lg:p-5 flex items-center gap-4 border-r-4 border-main">
              <div className="shrink-0 text-main">
                <CalendarDays size={32} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col text-main">
                 <span className="font-black text-[10px] md:text-xs uppercase opacity-90 tracking-widest mb-1 leading-none">UPCOMING TODAY</span>
                 <span className="font-black text-2xl sm:text-3xl leading-none">6</span>
              </div>
            </div>
            {/* Stat 4 */}
            <div className="bg-[#FF6B00] text-main p-4 lg:p-5 flex items-center gap-4">
              <div className="shrink-0 text-main">
                <Flag size={32} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col text-main">
                 <span className="font-black text-[10px] md:text-xs uppercase opacity-90 tracking-widest mb-1 leading-none">COMPLETED</span>
                 <span className="font-black text-2xl sm:text-3xl leading-none">18</span>
              </div>
            </div>
          </div>

          {/* Main 2-column layout */}
          <div className="flex flex-col lg:flex-row flex-1">
             
             {/* Left Column: Match List */}
             <div className="flex-1 border-r-0 lg:border-r-4 border-main flex flex-col min-w-0 bg-muted">
                {/* Tabs */}
                <div className="flex flex-wrap md:flex-nowrap border-b-4 border-main bg-card">
                   <button className="flex-1 min-w-[30%] md:min-w-0 py-3 bg-c2 text-inv font-black text-[10px] md:text-xs uppercase border-b-4 md:border-b-0 border-r-4 border-main hover:opacity-90">GROUP STAGE</button>
                   <button className="flex-1 min-w-[30%] md:min-w-0 py-3 bg-card hover:bg-muted text-main font-black text-[10px] md:text-xs uppercase border-b-4 md:border-b-0 border-r-4 border-main">ROUND OF 16</button>
                   <button className="flex-1 min-w-[30%] md:min-w-0 py-3 bg-card hover:bg-muted text-main font-black text-[10px] md:text-xs uppercase border-b-4 md:border-b-0 border-r-4 border-main">QUARTER-FINALS</button>
                   <button className="flex-1 min-w-[50%] md:min-w-0 py-3 bg-card hover:bg-muted text-main font-black text-[10px] md:text-xs uppercase border-r-4 md:border-r-4 border-main">SEMI-FINALS</button>
                   <button className="flex-1 min-w-[50%] md:min-w-0 py-3 bg-card hover:bg-muted text-main font-black text-[10px] md:text-xs uppercase">FINAL</button>
                </div>

                {/* Filters */}
                <div className="border-b-4 border-main bg-card p-4 flex flex-col relative z-20">
                   <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                      <div className="flex items-center gap-4 w-full md:w-auto">
                         <div className="relative flex-1 md:flex-none">
                            <select className="appearance-none w-full md:w-40 border-2 border-main py-2 pl-3 pr-8 font-black uppercase text-xs bg-card shadow-[2px_2px_0_0_var(--color-shadow)] outline-none cursor-pointer focus:translate-y-[2px] focus:translate-x-[2px] focus:shadow-none transition-all">
                               <option>MATCHDAY 2</option>
                               <option>MATCHDAY 1</option>
                               <option>MATCHDAY 3</option>
                            </select>
                            <ChevronDown size={14} strokeWidth={3} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                         </div>
                         <div className="flex items-center gap-2 border-2 border-main py-2 px-3 bg-page shadow-[2px_2px_0_0_var(--color-shadow)] font-bold text-xs uppercase flex-1 md:flex-none justify-center">
                            <Calendar size={14} className="text-main" />
                            JUN 12 - JUN 18
                         </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-0 border-2 border-main shadow-[2px_2px_0_0_var(--color-shadow)] w-full md:w-auto">
                         <button className="px-4 py-2 bg-c2 text-inv font-black text-[10px] uppercase flex-1 md:flex-none border-r-2 border-main border-b-2 sm:border-b-0">ALL</button>
                         <button className="px-4 py-2 bg-card hover:bg-muted text-main font-black text-[10px] uppercase flex-1 md:flex-none border-r-2 border-main border-b-2 sm:border-b-0">OPEN</button>
                         <button className="px-4 py-2 bg-card hover:bg-muted text-main font-black text-[10px] uppercase flex-1 md:flex-none border-r-2 md:border-r-2 border-main border-b-2 sm:border-b-0">LOCKED</button>
                         <button className="px-4 py-2 bg-card hover:bg-muted text-main font-black text-[10px] uppercase flex-1 md:flex-none border-r-2 border-main">LIVE</button>
                         <button className="px-4 py-2 bg-card hover:bg-muted text-main font-black text-[10px] uppercase flex-1 md:flex-none">COMPLETED</button>
                      </div>
                   </div>

                   {/* Table Header (Desktop Only) */}
                   <div className="hidden md:flex items-center border-b-4 border-main pb-2 pt-2 bg-page font-black text-[10px] uppercase text-subtle px-4">
                       <div className="w-20">KICKOFF (LOCAL)</div>
                       <div className="flex-1 min-w-[120px]">STADIUM</div>
                       <div className="flex-1 text-right">TEAM A</div>
                       <div className="w-16 text-center">VS</div>
                       <div className="flex-1 text-left">TEAM B</div>
                       <div className="w-24 text-center">STATUS</div>
                       <div className="w-24 text-center">ACTION</div>
                   </div>

                   {/* Matches List */}
                   <div className="flex flex-col bg-card">
                      
                      {/* Featured Match - Open */}
                      <div className="relative border-b-2 border-main bg-card p-3 md:p-4 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0 hover:bg-page transition-colors">
                         <div className="absolute top-0 left-0 bg-c1 border-r-2 border-b-2 border-main text-main text-[10px] px-3 py-0.5 flex items-center gap-1.5 font-black uppercase z-10">
                           <Star size={12} className="fill-main" /> FEATURED MATCH
                         </div>
                         <div className="flex items-center w-full md:w-auto gap-4 md:gap-0 mt-2 md:mt-0">
                            <div className="w-20 flex flex-col items-center md:items-start text-main">
                               <span className="font-black text-[10px] uppercase">JUN 14</span>
                               <span className="font-black text-xl leading-none mt-0.5">20:00</span>
                               <span className="font-bold text-[9px] uppercase text-subtle">ET</span>
                            </div>
                            <div className="flex-1 min-w-[120px] flex items-center gap-2 hidden md:flex">
                               <div className="w-6 h-6 border-2 border-main rounded-full bg-muted flex items-center justify-center shrink-0">
                                  <MapPin size={10} className="text-subtle" />
                               </div>
                               <div className="flex flex-col">
                                  <span className="font-black text-[9px] uppercase">LUSAIL STADIUM</span>
                                  <span className="font-bold text-[9px] uppercase text-subtle">LUSAIL, QAT</span>
                               </div>
                            </div>
                         </div>
                         <div className="flex flex-1 items-center justify-center gap-3 w-full md:w-auto">
                            <div className="flex-1 flex items-center justify-end gap-2 text-right">
                               <span className="font-black text-sm uppercase hidden sm:block">FRANCE</span>
                               <span className="font-black text-sm uppercase sm:hidden">FRA</span>
                               <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-main rounded-full overflow-hidden flex items-center justify-center shrink-0"><FR className="w-full h-full object-cover" /></div>
                            </div>
                            <div className="w-14 sm:w-16 flex items-center justify-between border-[3px] border-main bg-page font-black text-sm p-1 shadow-[2px_2px_0_var(--color-shadow)]">
                               <div className="w-5 text-center">-</div>
                               <span className="text-subtle">:</span>
                               <div className="w-5 text-center">-</div>
                            </div>
                            <div className="flex-1 flex items-center justify-start gap-2 text-left">
                               <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-main rounded-full overflow-hidden flex items-center justify-center shrink-0"><DE className="w-full h-full object-cover" /></div>
                               <span className="font-black text-sm uppercase hidden sm:block">GERMANY</span>
                               <span className="font-black text-sm uppercase sm:hidden">GER</span>
                            </div>
                         </div>
                         <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end mt-2 md:mt-0 pt-3 md:pt-0 border-t-2 md:border-t-0 border-line">
                            <div className="w-24 flex justify-center">
                               <span className="bg-c5 text-main font-black text-[10px] px-3 py-1 border-2 border-main uppercase shadow-[2px_2px_0_var(--color-shadow)]">OPEN</span>
                            </div>
                            <div className="w-24 flex justify-center">
                               <button onClick={() => onNavigate('matches/m-ger-mar')} className="bg-c2 hover:opacity-90 text-inv font-black text-[10px] px-3 py-1.5 border-2 border-main uppercase flex items-center justify-center gap-1 w-full shadow-[2px_2px_0_var(--color-shadow)] focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px] transition-all">
                                  PREDICT <ChevronRight size={14} className="-mr-1" strokeWidth={3} />
                               </button>
                            </div>
                         </div>
                      </div>

                      {/* Locked Soon Match */}
                      <div className="border-b-2 border-main bg-card p-3 md:p-4 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0 hover:bg-page transition-colors cursor-default">
                         <div className="flex items-center w-full md:w-auto gap-4 md:gap-0">
                            <div className="w-20 flex flex-col items-center md:items-start text-main">
                               <span className="font-black text-[10px] uppercase">JUN 14</span>
                               <span className="font-black text-xl leading-none mt-0.5">17:00</span>
                               <span className="font-bold text-[9px] uppercase text-subtle">ET</span>
                            </div>
                            <div className="flex-1 min-w-[120px] flex items-center gap-2 hidden md:flex">
                               <div className="w-6 h-6 border-2 border-main rounded-full bg-muted flex items-center justify-center shrink-0">
                                  <MapPin size={10} className="text-subtle" />
                               </div>
                               <div className="flex flex-col">
                                  <span className="font-black text-[9px] uppercase">SOFI STADIUM</span>
                                  <span className="font-bold text-[9px] uppercase text-subtle">LOS ANGELES, USA</span>
                               </div>
                            </div>
                         </div>
                         <div className="flex flex-1 items-center justify-center gap-3 w-full md:w-auto">
                            <div className="flex-1 flex items-center justify-end gap-2 text-right opacity-90">
                               <span className="font-black text-sm uppercase hidden sm:block">ARGENTINA</span>
                               <span className="font-black text-sm uppercase sm:hidden">ARG</span>
                               <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-main rounded-full overflow-hidden flex items-center justify-center shrink-0"><AR className="w-full h-full object-cover" /></div>
                            </div>
                            <div className="w-14 sm:w-16 flex items-center justify-between border-[3px] border-main bg-card font-black text-sm p-1 shadow-[2px_2px_0_var(--color-shadow)]">
                               <div className="w-5 text-center">-</div>
                               <span className="text-subtle">:</span>
                               <div className="w-5 text-center">-</div>
                            </div>
                            <div className="flex-1 flex items-center justify-start gap-2 text-left opacity-90">
                               <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-main rounded-full overflow-hidden flex items-center justify-center shrink-0"><SA className="w-full h-full object-cover" /></div>
                               <span className="font-black text-sm uppercase hidden sm:block">SAUDI ARABIA</span>
                               <span className="font-black text-sm uppercase sm:hidden">KSA</span>
                            </div>
                         </div>
                         <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end mt-2 md:mt-0 pt-3 md:pt-0 border-t-2 md:border-t-0 border-line">
                            <div className="w-24 flex justify-center">
                               <span className="bg-c1 text-main font-black text-[10px] px-2 py-1 border-2 border-main uppercase shadow-[2px_2px_0_var(--color-shadow)] text-center w-full">LOCKED SOON</span>
                            </div>
                            <div className="w-24 flex justify-center">
                               <button onClick={() => onNavigate('matches/m-fra-arg')} className="bg-card hover:bg-muted text-main font-black text-[10px] px-3 py-1.5 border-2 border-main uppercase flex items-center justify-center gap-1 w-full shadow-[2px_2px_0_var(--color-shadow)] focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px] transition-all">
                                  DETAILS <ChevronRight size={14} className="-mr-1" strokeWidth={3} />
                               </button>
                            </div>
                         </div>
                      </div>

                      {/* Live Match */}
                      <div className="border-b-2 border-main bg-[#f0f9ff] p-3 md:p-4 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0 hover:bg-[#e0f2fe] transition-colors cursor-default relative">
                         <div className="absolute top-2 left-2 flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-c4 animate-pulse"></div>
                         </div>
                         <div className="flex items-center w-full md:w-auto gap-4 md:gap-0 pl-3">
                            <div className="w-16 md:w-20 flex flex-col items-center md:items-start text-c4">
                               <span className="font-black text-[10px] uppercase">JUN 13</span>
                               <span className="font-black text-xl md:text-[22px] leading-none mt-0.5">12:00</span>
                               <span className="font-bold text-[9px] uppercase">ET</span>
                            </div>
                            <div className="flex-1 min-w-[120px] flex items-center gap-2 hidden md:flex">
                               <div className="w-6 h-6 border-2 border-main rounded-full bg-muted flex items-center justify-center shrink-0">
                                  <MapPin size={10} className="text-subtle" />
                               </div>
                               <div className="flex flex-col">
                                  <span className="font-black text-[9px] uppercase">NRG STADIUM</span>
                                  <span className="font-bold text-[9px] uppercase text-subtle">HOUSTON, USA</span>
                               </div>
                            </div>
                         </div>
                         <div className="flex flex-1 items-center justify-center gap-3 w-full md:w-auto">
                            <div className="flex-1 flex items-center justify-end gap-2 text-right">
                               <span className="font-black text-sm uppercase hidden sm:block">BRAZIL</span>
                               <span className="font-black text-sm uppercase sm:hidden">BRA</span>
                               <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-main rounded-full overflow-hidden flex items-center justify-center shrink-0"><BR className="w-full h-full object-cover" /></div>
                            </div>
                            <div className="w-14 sm:w-16 flex flex-col items-center justify-center border-[3px] border-c4 bg-page font-black text-lg p-1 shadow-[2px_2px_0_var(--color-c4)] text-c4 py-0.5">
                               <div className="flex items-center w-full justify-between px-1">
                                 <span>1</span>
                                 <span>:</span>
                                 <span>0</span>
                               </div>
                               <span className="text-[8px] bg-c4 text-inv px-1 h-3 flex items-center leading-none mt-0.5">45'</span>
                            </div>
                            <div className="flex-1 flex items-center justify-start gap-2 text-left">
                               <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-main rounded-full overflow-hidden flex items-center justify-center shrink-0"><MX className="w-full h-full object-cover" /></div>
                               <span className="font-black text-sm uppercase hidden sm:block">MEXICO</span>
                               <span className="font-black text-sm uppercase sm:hidden">MEX</span>
                            </div>
                         </div>
                         <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end mt-2 md:mt-0 pt-3 md:pt-0 border-t-2 md:border-t-0 border-line">
                            <div className="w-24 flex justify-center">
                               <span className="bg-c4 text-inv font-black text-[10px] px-3 py-1 border-2 border-main uppercase shadow-[2px_2px_0_var(--color-shadow)]">LIVE</span>
                            </div>
                            <div className="w-24 flex justify-center">
                               <button className="bg-c2 text-inv font-black text-[10px] px-2 py-1.5 border-2 border-main uppercase flex items-center justify-center gap-1 w-full shadow-[2px_2px_0_var(--color-shadow)] hover:opacity-90 transition-all">
                                  VIEW LIVE <ChevronRight size={14} className="-mr-1" strokeWidth={3} />
                               </button>
                            </div>
                         </div>
                      </div>

                      {/* Completed Match */}
                      <div className="border-b-2 border-main bg-card p-3 md:p-4 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0 opacity-80 hover:bg-page transition-colors">
                         <div className="flex items-center w-full md:w-auto gap-4 md:gap-0">
                            <div className="w-20 flex flex-col items-center md:items-start text-subtle">
                               <span className="font-black text-[10px] uppercase">JUN 13</span>
                               <span className="font-black text-xl leading-none mt-0.5">09:00</span>
                               <span className="font-bold text-[9px] uppercase">ET</span>
                            </div>
                            <div className="flex-1 min-w-[120px] flex items-center gap-2 hidden md:flex">
                               <div className="w-6 h-6 border-2 border-main rounded-full bg-muted flex items-center justify-center shrink-0">
                                  <MapPin size={10} className="text-subtle" />
                               </div>
                               <div className="flex flex-col">
                                  <span className="font-black text-[9px] uppercase">AT&T STADIUM</span>
                                  <span className="font-bold text-[9px] uppercase text-subtle">DALLAS, USA</span>
                               </div>
                            </div>
                         </div>
                         <div className="flex flex-1 items-center justify-center gap-3 w-full md:w-auto">
                            <div className="flex-1 flex items-center justify-end gap-2 text-right">
                               <span className="font-black text-sm uppercase hidden sm:block">ENGLAND</span>
                               <span className="font-black text-sm uppercase sm:hidden">ENG</span>
                               <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-main rounded-full overflow-hidden flex items-center justify-center shrink-0"><GB className="w-full h-full object-cover" /></div>
                            </div>
                            <div className="w-14 sm:w-16 flex flex-col items-center justify-center border-[3px] border-main bg-muted font-black text-sm p-1 shadow-[2px_2px_0_var(--color-shadow)] py-0.5">
                               <div className="flex items-center w-full justify-between px-1">
                                 <span>2</span>
                                 <span className="text-subtle">:</span>
                                 <span>1</span>
                               </div>
                               <span className="text-[8px] uppercase text-subtle">FT</span>
                            </div>
                            <div className="flex-1 flex items-center justify-start gap-2 text-left">
                               <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-main rounded-full overflow-hidden flex items-center justify-center shrink-0"><TN className="w-full h-full object-cover" /></div>
                               <span className="font-black text-sm uppercase hidden sm:block">TUNISIA</span>
                               <span className="font-black text-sm uppercase sm:hidden">TUN</span>
                            </div>
                         </div>
                         <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end mt-2 md:mt-0 pt-3 md:pt-0 border-t-2 md:border-t-0 border-line">
                            <div className="w-24 flex justify-center">
                               <span className="font-black text-[10px] uppercase text-subtle">FT</span>
                            </div>
                            <div className="w-24 flex justify-center">
                               <button onClick={() => onNavigate('matches/m-jpn-mex')} className="bg-card hover:bg-page text-main font-black text-[10px] px-3 py-1.5 border-2 border-main uppercase flex items-center justify-center gap-1 w-full shadow-[2px_2px_0_var(--color-shadow)] transition-all">
                                  RESULTS <ChevronRight size={14} className="-mr-1" strokeWidth={3} />
                               </button>
                            </div>
                         </div>
                      </div>

                      {/* Open Match 2 */}
                      <div className="border-b-2 border-main bg-card p-3 md:p-4 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0 hover:bg-page transition-colors cursor-default">
                         <div className="flex items-center w-full md:w-auto gap-4 md:gap-0">
                            <div className="w-20 flex flex-col items-center md:items-start text-main">
                               <span className="font-black text-[10px] uppercase">JUN 13</span>
                               <span className="font-black text-xl leading-none mt-0.5">21:00</span>
                               <span className="font-bold text-[9px] uppercase text-subtle">ET</span>
                            </div>
                            <div className="flex-1 min-w-[120px] flex items-center gap-2 hidden md:flex">
                               <div className="w-6 h-6 border-2 border-main rounded-full bg-muted flex items-center justify-center shrink-0">
                                  <MapPin size={10} className="text-subtle" />
                               </div>
                               <div className="flex flex-col">
                                  <span className="font-black text-[9px] uppercase">HARD ROCK STADIUM</span>
                                  <span className="font-bold text-[9px] uppercase text-subtle">MIAMI, USA</span>
                               </div>
                            </div>
                         </div>
                         <div className="flex flex-1 items-center justify-center gap-3 w-full md:w-auto">
                            <div className="flex-1 flex items-center justify-end gap-2 text-right">
                               <span className="font-black text-sm uppercase hidden sm:block">USA</span>
                               <span className="font-black text-sm uppercase sm:hidden">USA</span>
                               <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-main rounded-full overflow-hidden flex items-center justify-center shrink-0"><USFlag className="w-full h-full object-cover" /></div>
                            </div>
                            <div className="w-14 sm:w-16 flex items-center justify-between border-[3px] border-main bg-card font-black text-sm p-1 shadow-[2px_2px_0_var(--color-shadow)]">
                               <div className="w-5 text-center">-</div>
                               <span className="text-subtle">:</span>
                               <div className="w-5 text-center">-</div>
                            </div>
                            <div className="flex-1 flex items-center justify-start gap-2 text-left">
                               <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-main rounded-full overflow-hidden flex items-center justify-center shrink-0"><GB className="w-full h-full object-cover" /></div>
                               <span className="font-black text-sm uppercase hidden sm:block">WALES</span>
                               <span className="font-black text-sm uppercase sm:hidden">WAL</span>
                            </div>
                         </div>
                         <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end mt-2 md:mt-0 pt-3 md:pt-0 border-t-2 md:border-t-0 border-line">
                            <div className="w-24 flex justify-center">
                               <span className="bg-c5 text-main font-black text-[10px] px-3 py-1 border-2 border-main uppercase shadow-[2px_2px_0_var(--color-shadow)]">OPEN</span>
                            </div>
                            <div className="w-24 flex justify-center">
                               <button onClick={() => onNavigate('matches/m-usa-kor')} className="bg-c2 hover:opacity-90 text-inv font-black text-[10px] px-3 py-1.5 border-2 border-main uppercase flex items-center justify-center gap-1 w-full shadow-[2px_2px_0_var(--color-shadow)] focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px] transition-all">
                                  PREDICT <ChevronRight size={14} className="-mr-1" strokeWidth={3} />
                               </button>
                            </div>
                         </div>
                      </div>

                      {/* Locked Match */}
                      <div className="border-b-2 border-main bg-card p-3 md:p-4 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0 hover:bg-page transition-colors cursor-default opacity-90">
                         <div className="flex items-center w-full md:w-auto gap-4 md:gap-0">
                            <div className="w-20 flex flex-col items-center md:items-start text-main">
                               <span className="font-black text-[10px] uppercase">JUN 12</span>
                               <span className="font-black text-xl leading-none mt-0.5">18:00</span>
                               <span className="font-bold text-[9px] uppercase text-subtle">ET</span>
                            </div>
                            <div className="flex-1 min-w-[120px] flex items-center gap-2 hidden md:flex">
                               <div className="w-6 h-6 border-2 border-main rounded-full bg-muted flex items-center justify-center shrink-0">
                                  <MapPin size={10} className="text-subtle" />
                               </div>
                               <div className="flex flex-col">
                                  <span className="font-black text-[9px] uppercase">METLIFE STADIUM</span>
                                  <span className="font-bold text-[9px] uppercase text-subtle">NEW YORK, USA</span>
                               </div>
                            </div>
                         </div>
                         <div className="flex flex-1 items-center justify-center gap-3 w-full md:w-auto">
                            <div className="flex-1 flex items-center justify-end gap-2 text-right">
                               <span className="font-black text-sm uppercase hidden sm:block">SPAIN</span>
                               <span className="font-black text-sm uppercase sm:hidden">ESP</span>
                               <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-main rounded-full overflow-hidden flex items-center justify-center shrink-0"><ES className="w-full h-full object-cover" /></div>
                            </div>
                            <div className="w-14 sm:w-16 flex items-center justify-between border-[3px] border-main bg-page font-black text-sm p-1 shadow-[2px_2px_0_var(--color-shadow)]">
                               <div className="w-5 text-center">-</div>
                               <span className="text-subtle">:</span>
                               <div className="w-5 text-center">-</div>
                            </div>
                            <div className="flex-1 flex items-center justify-start gap-2 text-left">
                               <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-main rounded-full overflow-hidden flex items-center justify-center shrink-0"><CR className="w-full h-full object-cover" /></div>
                               <span className="font-black text-sm uppercase hidden sm:block">COSTA RICA</span>
                               <span className="font-black text-sm uppercase sm:hidden">CRC</span>
                            </div>
                         </div>
                         <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end mt-2 md:mt-0 pt-3 md:pt-0 border-t-2 md:border-t-0 border-line">
                            <div className="w-24 flex justify-center">
                               <span className="bg-muted text-main font-black text-[10px] px-3 py-1 border-2 border-main uppercase shadow-[2px_2px_0_var(--color-shadow)]">LOCKED</span>
                            </div>
                            <div className="w-24 flex justify-center">
                               <button onClick={() => onNavigate('matches/m-bra-esp')} className="bg-card hover:bg-page text-main font-black text-[10px] px-3 py-1.5 border-2 border-main uppercase flex items-center justify-center gap-1 w-full shadow-[2px_2px_0_var(--color-shadow)] transition-all">
                                  DETAILS <ChevronRight size={14} className="-mr-1" strokeWidth={3} />
                               </button>
                            </div>
                         </div>
                      </div>

                   </div>
                </div>

             </div>

             {/* Right Column: Widgets */}
             <div className="w-full lg:w-[320px] xl:w-[360px] bg-card flex flex-col shrink-0 relative z-20">
                
                {/* Next Deadline */}
                <div className="flex flex-col border-b-4 border-main bg-page">
                   <div className="bg-main text-inv font-black uppercase text-xs py-2 px-3 flex items-center border-b-4 border-main">
                      NEXT DEADLINE
                   </div>
                   <div className="p-4 flex flex-col items-center text-center">
                      <Clock size={24} className="mb-2 text-main" />
                      <span className="font-bold text-[10px] uppercase mb-1">PREDICTIONS LOCK IN</span>
                      <span className="font-black text-4xl xl:text-5xl text-c4 font-mono tracking-tighter w-full mb-1">01:45:23</span>
                      <span className="font-black text-xs uppercase">Jun 14, 17:00 ET</span>
                      <span className="font-bold text-xs text-subtle mt-0.5 mb-4">Argentina vs Saudi Arabia</span>
                      <button onClick={() => onNavigate('picks')} className="w-full bg-c2 hover:opacity-90 text-inv font-black text-xs uppercase py-3 border-2 border-main shadow-[2px_2px_0_var(--color-shadow)] flex items-center justify-center gap-2 transition-transform active:translate-y-[2px] active:translate-x-[2px] active:shadow-none focus:outline-none">
                         GO TO MY PICKS <ChevronRight size={16} strokeWidth={3} />
                      </button>
                   </div>
                </div>

                {/* Today's Live Matches */}
                <div className="flex flex-col border-b-4 border-main">
                   <div className="bg-main text-inv font-black uppercase text-xs py-2 px-3 flex items-center justify-between border-b-4 border-main">
                      <span>TODAY'S LIVE {t('nav.public.matches')}</span>
                      <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-c4 animate-pulse"></div> <span className="text-[9px]">LIVE</span></div>
                   </div>
                   <div className="flex flex-col">
                      <div className="p-3 border-b border-line flex items-center justify-between text-sm hover:bg-page transition-colors cursor-pointer group">
                         <div className="flex items-center gap-2 font-black">
                            <div className="w-5 h-5 rounded-[2px] overflow-hidden flex items-center justify-center shrink-0 border border-main/10"><BR className="w-full h-full object-cover" /></div>
                            <span className="w-8">BRA</span>
                            <span className="mr-1">1 : 0</span>
                            <span className="w-8 text-right">MEX</span>
                            <div className="w-5 h-5 rounded-[2px] overflow-hidden flex items-center justify-center shrink-0 border border-main/10"><MX className="w-full h-full object-cover" /></div>
                         </div>
                         <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-c4">45'</span>
                            <button className="bg-c5 text-main font-black text-[9px] px-2 py-1 border-2 border-main uppercase shadow-[2px_2px_0_0_var(--color-shadow)] uppercase">WATCH</button>
                         </div>
                      </div>
                      <div className="p-3 flex items-center justify-between text-sm hover:bg-page transition-colors cursor-pointer group">
                         <div className="flex items-center gap-2 font-black">
                            <div className="w-5 h-5 rounded-[2px] overflow-hidden flex items-center justify-center shrink-0 border border-main/10"><MA className="w-full h-full object-cover" /></div>
                            <span className="w-8">MAR</span>
                            <span className="mr-1">0 : 0</span>
                            <span className="w-8 text-right">CRO</span>
                            <div className="w-5 h-5 rounded-[2px] overflow-hidden flex items-center justify-center shrink-0 border border-main/10"><HR className="w-full h-full object-cover" /></div>
                         </div>
                         <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-c4">22'</span>
                            <button className="bg-c5 text-main font-black text-[9px] px-2 py-1 border-2 border-main uppercase shadow-[2px_2px_0_0_var(--color-shadow)] uppercase">WATCH</button>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Your Predictions Stats */}
                <div className="flex flex-col border-b-4 border-main">
                   <div className="bg-main text-inv font-black uppercase text-xs py-2 px-3 flex items-center justify-between border-b-4 border-main">
                      <span>YOUR PREDICTIONS</span>
                      <span className="text-[9px] hover:underline cursor-pointer">VIEW ALL</span>
                   </div>
                   <div className="flex flex-col">
                      <div className="flex items-center justify-between px-3 py-2 border-b-2 border-line">
                         <div className="flex items-center gap-2 font-bold text-sm">
                            <Clock size={16} className="text-subtle" /> <span>12</span>
                         </div>
                         <span className="bg-c5 text-main font-black text-[9px] px-2 py-0.5 border-2 border-main uppercase">OPEN</span>
                      </div>
                      <div className="flex items-center justify-between px-3 py-2 border-b-2 border-line">
                         <div className="flex items-center gap-2 font-bold text-sm">
                            <Settings size={16} className="text-subtle" /> <span>5</span>
                         </div>
                         <span className="bg-c1 text-main font-black text-[9px] px-2 py-0.5 border-2 border-main uppercase">LOCKED</span>
                      </div>
                      <div className="flex items-center justify-between px-3 py-2 border-b-2 border-line">
                         <div className="flex items-center gap-2 font-bold text-sm">
                            <CheckCircle2 size={16} className="text-c5" /> <span>18</span>
                         </div>
                         <span className="text-c5 font-black text-[9px] px-2 pt-0.5 uppercase">CORRECT</span>
                      </div>
                      <div className="flex items-center justify-between px-3 py-2">
                         <div className="flex items-center gap-2 font-bold text-sm">
                            <XCircle size={16} className="text-c4" /> <span>7</span>
                         </div>
                         <span className="text-c4 font-black text-[9px] px-2 pt-0.5 uppercase">INCORRECT</span>
                      </div>
                   </div>
                </div>

                {/* Group Standings */}
                <div className="border-b-4 lg:border-b-0 border-main bg-card flex flex-col">
                   <div className="bg-main text-inv font-black uppercase text-xs py-2 px-3 flex items-center justify-between border-b-4 border-main">
                      <span>GROUP A STANDINGS</span>
                      <span className="text-[9px] hover:underline cursor-pointer">VIEW TABLE</span>
                   </div>
                   <div className="flex flex-col text-xs">
                      <div className="flex font-black uppercase bg-page px-2 py-1 border-b-2 border-main text-[9px]">
                         <div className="w-8 text-center">POS</div>
                         <div className="flex-1 pl-1">TEAM</div>
                         <div className="w-6 text-center">P</div>
                         <div className="w-8 text-center">GD</div>
                         <div className="w-8 text-center">PTS</div>
                      </div>
                      {[
                        { pos: 1, team: 'GERMANY', p: 1, gd: '+2', pts: 3, bg: 'bg-page', flag: <DE className="w-5 h-3.5 border border-main/20" /> },
                        { pos: 2, team: 'SWITZERLAND', p: 1, gd: '+1', pts: 3, bg: 'bg-card', flag: <CH className="w-5 h-3.5 border border-main/20" /> },
                        { pos: 3, team: 'HUNGARY', p: 1, gd: '-1', pts: 0, bg: 'bg-page', flag: <HU className="w-5 h-3.5 border border-main/20" /> },
                        { pos: 4, team: 'SCOTLAND', p: 1, gd: '-2', pts: 0, bg: 'bg-card', flag: <GB className="w-5 h-3.5 border border-main/20" /> },
                      ].map((row, i) => (
                        <div key={i} className={`flex items-center font-bold px-2 py-2 border-b-2 border-line ${i === 3 ? 'border-b-0' : ''} ${row.bg}`}>
                           <div className={`w-8 text-center font-black ${row.pos === 1 ? 'bg-c5 text-main border-2 border-main' : row.pos === 2 ? 'bg-c2 text-inv border-2 border-main' : 'bg-main text-inv border-2 border-main'}`}>{row.pos}</div>
                           <div className="flex-1 pl-2 flex items-center gap-1.5 font-black">
                              <div className="flex shrink-0 items-center justify-center">{row.flag}</div>
                              <span className="truncate max-w-[80px] xl:max-w-[120px]">{row.team}</span>
                           </div>
                           <div className="w-6 text-center">{row.p}</div>
                           <div className="w-8 text-center">{row.gd}</div>
                           <div className="w-8 text-center font-black">{row.pts}</div>
                        </div>
                      ))}
                   </div>
                </div>

             </div>

          </div>

          {/* BOTTOM BANNER */}
          <div className="flex flex-col lg:flex-row border-t-4 border-main bg-card overflow-hidden w-full uppercase shrink-0 mt-auto">
             
             {/* Step 1 */}
             <div className="flex-1 flex border-b-4 lg:border-b-0 lg:border-r-4 border-main min-h-[90px] xl:min-h-[100px]">
                <div className="w-[4.5rem] bg-c3 flex justify-center items-center border-r-4 border-main shrink-0 text-main pb-1">
                   <span className="font-black text-6xl leading-none">1</span>
                </div>
                <div className="w-16 bg-c3 flex justify-center items-center border-r-4 border-main shrink-0 text-main">
                   <Binoculars size={28} strokeWidth={2.5}/>
                </div>
                <div className="flex flex-col justify-center p-3 flex-1 bg-page">
                   <span className="font-black text-[13px] xl:text-sm tracking-wide">BROWSE FIXTURES</span>
                   <span className="text-[10px] xl:text-[11px] font-bold leading-[1.2] capitalize text-subtle mt-1 max-w-[170px]">Explore all World Cup 2026 matches and schedule.</span>
                </div>
             </div>

             {/* Step 2 */}
             <div className="flex-1 flex border-b-4 lg:border-b-0 lg:border-r-4 border-main min-h-[90px] xl:min-h-[100px]">
                <div className="w-[4.5rem] bg-c2 flex justify-center items-center border-r-4 border-main shrink-0 text-inv pb-1">
                   <span className="font-black text-6xl leading-none">2</span>
                </div>
                <div className="w-16 bg-c2 flex justify-center items-center border-r-4 border-main shrink-0 text-inv">
                   <Pencil size={28} strokeWidth={2.5}/>
                </div>
                <div className="flex flex-col justify-center p-3 flex-1 bg-page">
                   <span className="font-black text-[13px] xl:text-sm tracking-wide">PICK {t('nav.public.matches')}</span>
                   <span className="text-[10px] xl:text-[11px] font-bold leading-[1.2] capitalize text-subtle mt-1 max-w-[170px]">Make your predictions before kickoff.</span>
                </div>
             </div>

             {/* Step 3 */}
             <div className="flex-1 flex border-b-4 lg:border-b-0 lg:border-r-4 border-main min-h-[90px] xl:min-h-[100px]">
                <div className="w-[4.5rem] bg-c5 flex justify-center items-center border-r-4 border-main shrink-0 text-main pb-1">
                   <span className="font-black text-6xl leading-none">3</span>
                </div>
                <div className="w-16 bg-c5 flex justify-center items-center border-r-4 border-main shrink-0 text-main">
                   <BarChart2 size={28} strokeWidth={2.5}/>
                </div>
                <div className="flex flex-col justify-center p-3 flex-1 bg-page">
                   <span className="font-black text-[13px] xl:text-sm tracking-wide">TRACK RESULTS</span>
                   <span className="text-[10px] xl:text-[11px] font-bold leading-[1.2] capitalize text-subtle mt-1 max-w-[170px]">Follow live scores and completed matches.</span>
                </div>
             </div>

             {/* Step 4 */}
             <div className="flex-1 flex min-h-[90px] xl:min-h-[100px]">
                <div className="w-[4.5rem] bg-[#FF6B00] flex justify-center items-center border-r-4 border-main shrink-0 text-main pb-1">
                   <span className="font-black text-6xl leading-none">4</span>
                </div>
                <div className="w-16 bg-[#FF6B00] flex justify-center items-center border-r-4 border-main shrink-0 text-main">
                   <Trophy size={28} strokeWidth={2.5}/>
                </div>
                <div className="flex flex-col justify-center p-3 flex-1 bg-page">
                   <span className="font-black text-[13px] xl:text-sm tracking-wide">CLIMB {t('nav.public.leaderboard')}</span>
                   <span className="text-[10px] xl:text-[11px] font-bold leading-[1.2] capitalize text-subtle mt-1 max-w-[170px]">Earn points and rank higher each week.</span>
                </div>
             </div>

          </div>

        </div>
      </div>
    </div>
  );
}
