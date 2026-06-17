import React from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Users, Crosshair, Clock, UserCheck, ChevronDown, CheckCircle2, TrendingUp, Lock, BookOpen, PenTool, BarChart2, ChevronRight, Target } from 'lucide-react';
import LegacySettingsMenu from './components/LegacySettingsMenu';

export default function Rules({ onNavigate, isVintage, setIsVintage, isDark, setIsDark, isRounded, setIsRounded, hasShadow, setHasShadow, hasFrame, setHasFrame }: { onNavigate: (page: string) => void, isVintage: boolean, setIsVintage: (v: boolean) => void, isDark: boolean, setIsDark: (v: boolean) => void, isRounded: boolean, setIsRounded: (v: boolean) => void, hasShadow: boolean, setHasShadow: (v: boolean) => void, hasFrame: boolean, setHasFrame: (v: boolean) => void }) {
  const { t } = useTranslation();
  const themeControls = { isVintage, setIsVintage, isDark, setIsDark, isRounded, setIsRounded, hasShadow, setHasShadow, hasFrame, setHasFrame };

  return (
    <div className="min-h-screen bg-page p-3 sm:p-4 lg:p-6 flex items-center justify-center font-sans">
      <div className="w-full max-w-[1600px] border-4 border-main rounded-lg shadow-[8px_8px_0px_var(--color-shadow)] sm:shadow-[16px_16px_0px_var(--color-shadow)] overflow-hidden flex flex-col mx-auto transition-all relative bg-card">
        
        {/* Mac OS styling frame header */}
        <div className="w-full h-8 border-b-4 border-main bg-main flex items-center px-4 gap-2 relative z-30 shrink-0">
          <div className="w-3 h-3 rounded-full bg-c5"></div>
          <div className="w-3 h-3 rounded-full bg-c1"></div>
          <div className="w-3 h-3 rounded-full bg-c3"></div>
        </div>

        {/* Navigation */}
        <nav className="flex items-center justify-between border-b-4 border-main px-6 py-4 bg-card z-30 relative shrink-0">
          <div className="text-xl md:text-3xl font-black uppercase tracking-tighter cursor-pointer" onClick={() => onNavigate('landing')}>PREDICT 2026</div>
          <div className="hidden lg:flex space-x-10 font-bold uppercase text-sm tracking-wide">
            <button className="hover:text-c2 transition-colors pb-1" onClick={() => onNavigate('matches')}>{t('nav.public.matches')}</button>
            <button className="hover:text-c2 transition-colors pb-1" onClick={() => onNavigate('leaderboard')}>{t('nav.public.leaderboard')}</button>
            <button className="text-c2 uppercase tracking-wide border-b-4 border-c2 pb-1">{t('nav.public.rules')}</button>
            <button className="hover:text-c2 transition-colors pb-1" onClick={() => onNavigate('prize-pool')}>{t('nav.public.prizePool')}</button>
          </div>
          <div className="flex items-center gap-3">
            <LegacySettingsMenu {...themeControls} />
            <button className="bg-c2 hover:opacity-80 transition-opacity text-inv font-black py-2 px-4 border-2 border-main flex items-center gap-3 transition-transform transform active:scale-95 shadow-[4px_4px_0_0_var(--color-shadow)]">
              <UserCheck size={18} strokeWidth={2.5} />
              <div className="flex flex-col items-start leading-[1.1] hidden sm:flex">
                <span className="text-[10px] uppercase font-bold opacity-80">{t('common.account')}</span>
                <span className="text-sm">{t('common.rewards')}</span>
              </div>
              <ChevronDown size={18} className="ml-1 hidden sm:block" />
            </button>
          </div>
        </nav>

        {/* BIG BACKGROUND IMAGE */}
        <div className="absolute inset-x-0 top-[84px] h-[calc(100vh-116px)] z-0 pointer-events-none opacity-90 overflow-hidden flex justify-center">
           <img src="https://s6.imgcdn.dev/Ybh5S0.webp" alt="Background" className="w-full h-full object-cover object-top" />
        </div>

        {/* Main Content Area */}
        <div className="relative z-10 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6 min-h-0">
          
          {/* Top Info Banner */}
          <div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col w-full xl:w-1/2 shadow-[8px_8px_0_0_var(--color-shadow)]">
             <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-1 text-main">
                {t('nav.public.rules')}
             </h1>
          </div>

          {/* Main White Wrapper for Content */}
          <div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col gap-4 lg:gap-6 shadow-[8px_8px_0_0_var(--color-shadow)] rounded-sm">
          {/* Top KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <div className="flex border-4 border-main bg-c1 p-3 sm:p-4 text-main shadow-[4px_4px_0_0_var(--color-shadow)] items-center">
              <div className="shrink-0 mr-3"><Trophy size={36} strokeWidth={2.5}/></div>
              <div className="flex flex-col justify-center">
                <div className="text-[10px] sm:text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">{t('nav.public.prizePool')}</div>
                <div className="text-xl sm:text-2xl font-black leading-none tracking-tight">$25,000</div>
                <div className="text-[8px] sm:text-[10px] font-bold uppercase mt-1">TOTAL GUARANTEED</div>
              </div>
            </div>
            
            <div className="flex border-4 border-main bg-c2 p-3 sm:p-4 text-inv shadow-[4px_4px_0_0_var(--color-shadow)] items-center">
              <div className="shrink-0 mr-3"><Users size={36} strokeWidth={2.5}/></div>
              <div className="flex flex-col justify-center">
                <div className="text-[10px] sm:text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">TOTAL PLAYERS</div>
                <div className="text-xl sm:text-2xl font-black leading-none tracking-tight">12,480</div>
                <div className="text-[8px] sm:text-[10px] font-bold uppercase mt-1">JOINED</div>
              </div>
            </div>

            <div className="flex border-4 border-main bg-c3 p-3 sm:p-4 text-main shadow-[4px_4px_0_0_var(--color-shadow)] items-center">
              <div className="shrink-0 mr-3"><Crosshair size={36} strokeWidth={2.5}/></div>
              <div className="flex flex-col justify-center">
                <div className="text-[10px] sm:text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">SCORING SYSTEM</div>
                <div className="text-xl sm:text-2xl font-black leading-none tracking-tight">POINTS BASED</div>
                <div className="text-[8px] sm:text-[10px] font-bold uppercase mt-1">MULTIPLE BONUS TYPES</div>
              </div>
            </div>

            <div className="flex border-4 border-main bg-c4 p-3 sm:p-4 text-main shadow-[4px_4px_0_0_var(--color-shadow)] items-center">
              <div className="shrink-0 mr-3"><Clock size={36} strokeWidth={2.5}/></div>
              <div className="flex flex-col justify-center">
                <div className="text-[10px] sm:text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">DEADLINE BEFORE KICKOFF</div>
                <div className="text-xl sm:text-2xl font-black leading-none tracking-tight">PICKS LOCK</div>
                <div className="text-[8px] sm:text-[10px] font-bold uppercase mt-1">AT KICKOFF</div>
              </div>
            </div>
          </div>

          {/* 2-Column Main content Split */}
          <div className="flex flex-col xl:flex-row gap-4 lg:gap-6 items-start">
             
             {/* Left Column (Main details) */}
             <div className="flex-1 w-full flex flex-col gap-4 lg:gap-6">
                
                {/* 3-Column Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                   
                   {/* HOW SCORING WORKS */}
                   <div className="bg-card border-4 border-main flex flex-col shadow-[4px_4px_0_0_var(--color-shadow)] lg:col-span-1 h-full">
                      <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm lg:text-base border-b-4 border-main">HOW SCORING WORKS</div>
                      <div className="flex flex-col">
                         
                         <div className="flex p-3 border-b-2 border-line gap-3 items-center">
                            <div className="w-12 h-12 bg-c3 rounded-sm border-2 border-main flex items-center justify-center shrink-0 shadow-[2px_2px_0_0_var(--color-shadow)] text-main"><Target size={24} /></div>
                            <div className="flex flex-col flex-1">
                               <span className="font-black text-sm uppercase">EXACT SCORE</span>
                               <span className="text-[11px] font-bold text-subtle leading-snug">Predict the exact score of the match. Example: You pick 2-1 and the result is 2-1.</span>
                            </div>
                            <div className="font-black text-2xl text-c3 pl-1 shrink-0 drop-shadow-[1px_1px_0_var(--color-main)]">3 PTS</div>
                         </div>
                         
                         <div className="flex p-3 border-b-2 border-line gap-3 items-center">
                            <div className="w-12 h-12 bg-c2 rounded-sm border-2 border-main flex items-center justify-center shrink-0 shadow-[2px_2px_0_0_var(--color-shadow)] text-inv"><CheckCircle2 size={24} /></div>
                            <div className="flex flex-col flex-1">
                               <span className="font-black text-sm uppercase">CORRECT OUTCOME</span>
                               <span className="text-[11px] font-bold text-subtle leading-snug">Predict the correct result (Win/Draw/Lose), but not the exact score.</span>
                            </div>
                            <div className="font-black text-2xl text-c2 pl-1 shrink-0 drop-shadow-[1px_1px_0_var(--color-main)] text-stroke">1 PT</div>
                         </div>

                         <div className="flex p-3 border-b-2 border-line gap-3 items-center">
                            <div className="w-12 h-12 bg-c4 rounded-sm border-2 border-main flex items-center justify-center shrink-0 shadow-[2px_2px_0_0_var(--color-shadow)] text-main"><TrendingUp size={24} /></div>
                            <div className="flex flex-col flex-1">
                               <span className="font-black text-sm uppercase">STREAK BONUS</span>
                               <span className="text-[11px] font-bold text-subtle leading-snug">Earn a bonus for consecutive correct outcomes. Streak resets on any incorrect outcome.</span>
                            </div>
                            <div className="font-black text-2xl text-c4 pl-1 shrink-0 drop-shadow-[1px_1px_0_var(--color-main)]">+2 PTS</div>
                         </div>

                         <div className="flex p-3 border-b-2 border-line gap-3 items-center">
                            <div className="w-12 h-12 bg-[#B14EFF] rounded-sm border-2 border-main flex items-center justify-center shrink-0 shadow-[2px_2px_0_0_var(--color-shadow)] text-inv"><Trophy size={24} /></div>
                            <div className="flex flex-col flex-1">
                               <span className="font-black text-sm uppercase">KNOCKOUT BONUS</span>
                               <span className="text-[11px] font-bold text-subtle leading-snug">Extra points for correct picks in Knockout Stage (Quarter-Finals and beyond).</span>
                            </div>
                            <div className="font-black text-2xl text-[#B14EFF] pl-1 shrink-0 drop-shadow-[1px_1px_0_var(--color-main)]">+1 PT</div>
                         </div>

                         <div className="flex p-3 gap-3 items-center bg-muted">
                            <div className="w-12 h-12 bg-c5 rounded-sm border-2 border-main flex items-center justify-center shrink-0 shadow-[2px_2px_0_0_var(--color-shadow)] text-inv"><Lock size={24} /></div>
                            <div className="flex flex-col flex-1">
                               <span className="font-black text-sm uppercase">NO POINTS AFTER DEADLINE</span>
                               <span className="text-[11px] font-bold text-subtle leading-snug">Picks submitted after kickoff are locked and will not earn any points.</span>
                            </div>
                            <div className="font-black text-2xl text-c5 pl-1 shrink-0 drop-shadow-[1px_1px_0_var(--color-main)]">0 PTS</div>
                         </div>

                      </div>
                   </div>

                   {/* HOW TO PLAY */}
                   <div className="bg-card border-4 border-main flex flex-col shadow-[4px_4px_0_0_var(--color-shadow)] lg:col-span-1 h-full">
                      <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm lg:text-base border-b-4 border-main">HOW TO PLAY</div>
                      <div className="flex flex-col flex-1">
                        
                         <div className="flex border-b-2 border-line flex-1">
                            <div className="w-12 bg-c2 text-inv font-black flex items-center justify-center text-3xl border-r-2 border-main shrink-0">1</div>
                            <div className="flex flex-col justify-center p-3">
                               <span className="font-black text-[13px] uppercase tracking-wide">CHOOSE A MATCH</span>
                               <span className="text-[11px] font-bold text-subtle mt-0.5 leading-snug">Browse upcoming matches and select one to make your prediction.</span>
                            </div>
                         </div>

                         <div className="flex border-b-2 border-line flex-1">
                            <div className="w-12 bg-c2 text-inv font-black flex items-center justify-center text-3xl border-r-2 border-main shrink-0">2</div>
                            <div className="flex flex-col justify-center p-3">
                               <span className="font-black text-[13px] uppercase tracking-wide">ENTER YOUR SCORE</span>
                               <span className="text-[11px] font-bold text-subtle mt-0.5 leading-snug">Predict the exact score and submit your pick.</span>
                            </div>
                         </div>

                         <div className="flex border-b-2 border-line flex-1">
                            <div className="w-12 bg-c2 text-inv font-black flex items-center justify-center text-3xl border-r-2 border-main shrink-0">3</div>
                            <div className="flex flex-col justify-center p-3">
                               <span className="font-black text-[13px] uppercase tracking-wide">SAVE YOUR PICKS</span>
                               <span className="text-[11px] font-bold text-subtle mt-0.5 leading-snug">All changes are saved automatically. Review before the deadline.</span>
                            </div>
                         </div>

                         <div className="flex border-b-2 border-line flex-1">
                            <div className="w-12 bg-c2 text-inv font-black flex items-center justify-center text-3xl border-r-2 border-main shrink-0">4</div>
                            <div className="flex flex-col justify-center p-3">
                               <span className="font-black text-[13px] uppercase tracking-wide">PICKS LOCK AT KICKOFF</span>
                               <span className="text-[11px] font-bold text-subtle mt-0.5 leading-snug">You can't edit picks once the match has kicked off.</span>
                            </div>
                         </div>

                         <div className="flex flex-1">
                            <div className="w-12 bg-c2 text-inv font-black flex items-center justify-center text-3xl border-r-2 border-main shrink-0">5</div>
                            <div className="flex flex-col justify-center p-3">
                               <span className="font-black text-[13px] uppercase tracking-wide">EARN POINTS</span>
                               <span className="text-[11px] font-bold text-subtle mt-0.5 leading-snug">Points are awarded after the match based on the scoring rules.</span>
                            </div>
                         </div>

                      </div>
                   </div>

                   {/* PRIZE DISTRIBUTION */}
                   <div className="bg-card border-4 border-main flex flex-col shadow-[4px_4px_0_0_var(--color-shadow)] lg:col-span-1 h-full">
                      <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm lg:text-base border-b-4 border-main">PRIZE DISTRIBUTION</div>
                      <div className="flex flex-col flex-1">
                         
                         <div className="flex border-b-2 border-line items-stretch">
                            <div className="w-10 bg-[#FFD700] text-main font-black flex flex-col justify-center items-center border-r-2 border-main shrink-0 py-3 text-xl bg-c1">1</div>
                            <div className="font-black px-3 py-3 flex-1 flex items-center text-sm uppercase">1ST PLACE</div>
                            <div className="font-black px-3 py-3 text-right flex items-center text-lg shrink-0">$10,000</div>
                         </div>

                         <div className="flex border-b-2 border-line items-stretch">
                            <div className="w-10 bg-muted text-main font-black flex flex-col justify-center items-center border-r-2 border-main shrink-0 py-3 text-xl">2</div>
                            <div className="font-black px-3 py-3 flex-1 flex items-center text-sm uppercase">2ND PLACE</div>
                            <div className="font-black px-3 py-3 text-right flex items-center text-lg shrink-0">$5,000</div>
                         </div>

                         <div className="flex border-b-2 border-line items-stretch">
                            <div className="w-10 bg-c4 text-main font-black flex flex-col justify-center items-center border-r-2 border-main shrink-0 py-3 text-xl">3</div>
                            <div className="font-black px-3 py-3 flex-1 flex items-center text-sm uppercase">3RD PLACE</div>
                            <div className="font-black px-3 py-3 text-right flex items-center text-lg shrink-0">$2,500</div>
                         </div>

                         <div className="flex border-b-2 border-line items-stretch">
                            <div className="font-bold px-4 py-4 flex-1 flex items-center text-sm uppercase border-r-2 border-line">4TH - 10TH PLACE</div>
                            <div className="font-black px-4 py-4 text-right flex items-center justify-end text-lg shrink-0 w-[100px]">$750</div>
                         </div>

                         <div className="flex border-b-2 border-line items-stretch">
                            <div className="font-bold px-4 py-4 flex-1 flex items-center text-sm uppercase border-r-2 border-line">11TH - 100TH PLACE</div>
                            <div className="font-black px-4 py-4 text-right flex items-center justify-end text-lg shrink-0 w-[100px]">$250</div>
                         </div>

                         <div className="flex items-stretch flex-1 min-h-[60px]">
                            <div className="font-bold px-4 py-3 flex-1 flex flex-col justify-center text-sm uppercase border-r-2 border-line">OTHER PARTICIPANTS</div>
                            <div className="font-black px-4 py-3 text-right flex flex-col justify-center items-end text-sm shrink-0 w-[130px] leading-tight">ENTRY TO LADDER PRIZES</div>
                         </div>

                      </div>
                   </div>

                </div>

                {/* 2-Column Grid (Bottom) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mt-2">
                   
                   {/* TIEBREAKERS */}
                   <div className="bg-card border-4 border-main flex flex-col shadow-[4px_4px_0_0_var(--color-shadow)] lg:col-span-1">
                      <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm lg:text-base border-b-4 border-main">TIEBREAKERS</div>
                      <div className="p-4 flex flex-col">
                         <div className="flex items-center gap-3 mb-3">
                           <div className="w-5 h-5 bg-c3 text-main font-black flex items-center justify-center text-[10px] rounded-sm border border-main shrink-0 shadow-[2px_2px_0_var(--color-main)]">1</div>
                           <span className="font-bold text-sm">More exact scores predicted</span>
                         </div>
                         <div className="flex items-center gap-3 mb-3">
                           <div className="w-5 h-5 bg-c3 text-main font-black flex items-center justify-center text-[10px] rounded-sm border border-main shrink-0 shadow-[2px_2px_0_var(--color-main)]">2</div>
                           <span className="font-bold text-sm">Higher overall accuracy (more correct outcomes)</span>
                         </div>
                         <div className="flex items-center gap-3 mb-3">
                           <div className="w-5 h-5 bg-c3 text-main font-black flex items-center justify-center text-[10px] rounded-sm border border-main shrink-0 shadow-[2px_2px_0_var(--color-main)]">3</div>
                           <span className="font-bold text-sm leading-snug">Longer current winning streak</span>
                         </div>
                         <div className="flex items-center gap-3">
                           <div className="w-5 h-5 bg-c3 text-main font-black flex items-center justify-center text-[10px] rounded-sm border border-main shrink-0 shadow-[2px_2px_0_var(--color-main)]">4</div>
                           <span className="font-bold text-sm">Earliest submission time</span>
                         </div>
                      </div>
                   </div>

                   <div className="bg-card border-4 border-main flex flex-col shadow-[4px_4px_0_0_var(--color-shadow)] lg:col-span-2">
                      <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm lg:text-base border-b-4 border-main">{t('rules.importantRules')}</div>
                      <div className="p-4 lg:p-5 flex flex-col justify-center h-full">
                         <ul className="list-none space-y-3">
                           <li className="flex items-start gap-3">
                             <div className="w-1.5 h-1.5 rounded-full bg-c5 shrink-0 mt-2"></div>
                             <span className="font-bold text-sm">{t('rules.importantItems.oneAccount')}</span>
                           </li>
                           <li className="flex items-start gap-3">
                             <div className="w-1.5 h-1.5 rounded-full bg-c5 shrink-0 mt-2"></div>
                             <span className="font-bold text-sm">{t('rules.importantItems.editBeforeKickoff')}</span>
                           </li>
                           <li className="flex items-start gap-3">
                             <div className="w-1.5 h-1.5 rounded-full bg-c5 shrink-0 mt-2"></div>
                             <span className="font-bold text-sm">{t('rules.importantItems.noLateEntries')}</span>
                           </li>
                           <li className="flex items-start gap-3">
                             <div className="w-1.5 h-1.5 rounded-full bg-c5 shrink-0 mt-2"></div>
                             <span className="font-bold text-sm">{t('rules.importantItems.suspiciousActivity')}</span>
                           </li>
                           <li className="flex items-start gap-3">
                             <div className="w-1.5 h-1.5 rounded-full bg-c5 shrink-0 mt-2"></div>
                             <span className="font-bold text-sm">{t('rules.importantItems.rewardEligibility')}</span>
                           </li>
                         </ul>
                      </div>
                   </div>

                </div>

             </div>

             {/* Right Column: Sidebar Panels */}
             <div className="w-full xl:w-[350px] flex flex-col gap-4 lg:gap-6 flex-shrink-0">
               
                {/* QUICK SUMMARY */}
                <div className="bg-card border-4 border-main flex flex-col shadow-[4px_4px_0_0_var(--color-shadow)]">
                   <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-xs border-b-4 border-main">
                     QUICK SUMMARY
                   </div>
                   <div className="p-4 flex flex-col gap-3 font-bold text-[13px]">
                      <div className="flex items-center gap-3">
                         <div className="w-6 h-6 flex items-center justify-center bg-c1 border-2 border-main shadow-[2px_2px_0_var(--color-main)] shrink-0 rounded-sm text-main"><Target size={14} strokeWidth={3}/></div>
                         <span>Exact score = <span className="font-black">3 pts</span></span>
                      </div>
                      <div className="flex items-center gap-3">
                         <div className="w-6 h-6 flex items-center justify-center bg-c2 border-2 border-main shadow-[2px_2px_0_var(--color-main)] shrink-0 rounded-sm text-inv"><CheckCircle2 size={14} strokeWidth={3}/></div>
                         <span>Correct outcome = <span className="font-black">1 pt</span></span>
                      </div>
                      <div className="flex items-center gap-3">
                         <div className="w-6 h-6 flex items-center justify-center bg-c4 border-2 border-main shadow-[2px_2px_0_var(--color-main)] shrink-0 rounded-sm text-main"><TrendingUp size={14} strokeWidth={3}/></div>
                         <span>Streak bonus up to <span className="font-black">+2 pts</span></span>
                      </div>
                      <div className="flex items-center gap-3">
                         <div className="w-6 h-6 flex items-center justify-center bg-[#B14EFF] border-2 border-main shadow-[2px_2px_0_var(--color-main)] shrink-0 rounded-sm text-inv"><Trophy size={14} strokeWidth={3}/></div>
                         <span>Knockout bonus = <span className="font-black">+1 pt</span></span>
                      </div>
                      <div className="flex items-center gap-3">
                         <div className="w-6 h-6 flex items-center justify-center bg-c5 border-2 border-main shadow-[2px_2px_0_var(--color-main)] shrink-0 rounded-sm text-inv"><Lock size={14} strokeWidth={3}/></div>
                         <span>Picks lock at kickoff</span>
                      </div>
                   </div>
                </div>

                {/* SCORING EXAMPLE */}
                <div className="bg-card border-4 border-main flex flex-col shadow-[4px_4px_0_0_var(--color-shadow)]">
                   <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-xs border-b-4 border-main">
                     SCORING EXAMPLE
                   </div>
                   <div className="flex flex-col text-sm font-bold">
                      <div className="flex justify-center items-center py-3 border-b-2 border-main gap-2 bg-muted font-black text-base">
                         <span className="text-xl">🇧🇷</span> <span>BRA vs ESP</span> <span className="text-xl">🇪🇸</span>
                      </div>
                      <div className="flex justify-between items-center py-2 px-4 border-b border-line border-dashed">
                         <span className="text-subtle uppercase text-xs">YOUR PICK</span>
                         <span className="font-black">2 - 1</span>
                      </div>
                      <div className="flex justify-between items-center py-2 px-4 border-b-2 border-main">
                         <span className="text-subtle uppercase text-xs">ACTUAL RESULT</span>
                         <span className="font-black">2 - 1</span>
                      </div>
                      <div className="flex flex-col p-4 bg-page gap-2">
                         <span className="text-[10px] font-black uppercase text-subtle mb-1 tracking-wider">SCORE BREAKDOWN</span>
                         <div className="flex justify-between items-center text-xs">
                           <span className="flex items-center gap-2"><CheckCircle2 size={12} className="text-c3" strokeWidth={3}/> Exact score</span>
                           <span className="font-black">+3 pts</span>
                         </div>
                         <div className="flex justify-between items-center text-xs">
                           <span className="flex items-center gap-2"><CheckCircle2 size={12} className="text-c3" strokeWidth={3}/> Correct outcome</span>
                           <span className="font-black">+1 pt</span>
                         </div>
                         <div className="flex justify-between items-center text-xs">
                           <span className="flex items-center gap-2 text-c4"><TrendingUp size={12} strokeWidth={3}/> 2-match streak</span>
                           <span className="font-black">+2 pts</span>
                         </div>
                      </div>
                      <div className="flex justify-between items-center py-3 px-4 border-t-2 border-main text-main text-sm uppercase font-black bg-card">
                         <span>TOTAL POINTS EARNED</span>
                         <span className="text-lg text-c3 drop-shadow-[1px_1px_0_var(--color-main)]">6 PTS</span>
                      </div>
                   </div>
                </div>

                {/* FAQ */}
                <div className="bg-card border-4 border-main flex flex-col shadow-[4px_4px_0_0_var(--color-shadow)]">
                   <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-xs flex justify-between items-center border-b-4 border-main">
                     <span>FAQ</span>
                   </div>
                   <div className="flex flex-col">
                      <div className="flex justify-between items-center py-3 border-b-2 border-line cursor-pointer hover:bg-muted font-bold text-xs sm:text-sm px-4 group">
                        <span>Can I edit my picks?</span>
                        <ChevronRight size={18} className="text-subtle group-hover:text-main"/>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b-2 border-line cursor-pointer hover:bg-muted font-bold text-xs sm:text-sm px-4 group">
                        <span>What happens if a match is postponed?</span>
                        <ChevronRight size={18} className="text-subtle group-hover:text-main"/>
                      </div>
                      <div className="flex justify-between items-center py-3 cursor-pointer hover:bg-muted font-bold text-xs sm:text-sm px-4 group">
                        <span>How does rewards eligibility work?</span>
                        <ChevronRight size={18} className="text-subtle group-hover:text-main"/>
                      </div>
                   </div>
                </div>

                {/* NEXT DEADLINE */}
                <div className="bg-card border-4 border-main flex flex-col mt-auto shadow-[4px_4px_0_0_var(--color-shadow)]">
                   <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-xs border-b-4 border-main">
                     NEXT DEADLINE
                   </div>
                   <div className="p-4 flex items-center gap-4 justify-center">
                      <div className="flex flex-col text-center">
                         <div className="text-3xl font-black text-c5 tracking-tighter flex items-center justify-center gap-1 drop-shadow-[2px_2px_0_rgba(0,0,0,0.1)]">
                            02<span className="text-main mb-1">:</span>15<span className="text-main mb-1">:</span>34
                         </div>
                         <div className="flex items-center justify-center gap-4 text-[9px] font-black uppercase text-main tracking-widest mt-[-2px] mb-2 opacity-80">
                            <span>HRS</span><span>MINS</span><span>SECS</span>
                         </div>
                         <div className="font-bold text-xs uppercase tracking-wide text-main">
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
