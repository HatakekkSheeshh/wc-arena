import React from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Users, Star, Gift, CheckCircle2, ShieldCheck, ClipboardCheck, Clock, Mail, User, PenTool, BarChart2, Medal, Flame } from 'lucide-react';
import AppShell from './components/layout/AppShell';

export default function PrizePool({ onNavigate, isVintage, setIsVintage, isDark, setIsDark, isRounded, setIsRounded, hasShadow, setHasShadow, hasFrame, setHasFrame }: { onNavigate: (page: string) => void, isVintage: boolean, setIsVintage: (v: boolean) => void, isDark: boolean, setIsDark: (v: boolean) => void, isRounded: boolean, setIsRounded: (v: boolean) => void, hasShadow: boolean, setHasShadow: (v: boolean) => void, hasFrame: boolean, setHasFrame: (v: boolean) => void }) {
  const { t } = useTranslation();
  const themeControls = { isVintage, setIsVintage, isDark, setIsDark, isRounded, setIsRounded, hasShadow, setHasShadow, hasFrame, setHasFrame };

  return (
    <AppShell themeControls={themeControls}>
        <div className="relative z-10 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6 min-h-0">
          
          {/* Top Info Banner */}
          <div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col w-full xl:w-1/2 shadow-[8px_8px_0_0_var(--color-shadow)]">
             <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-1 text-main">
                {t('nav.public.prizePool')}
             </h1>
          </div>

          {/* Main White Wrapper for Content */}
          <div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col gap-4 lg:gap-6 shadow-[8px_8px_0_0_var(--color-shadow)] rounded-sm">
            
            {/* Top KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              <div className="flex border-4 border-main bg-c1 p-3 sm:p-4 text-main shadow-[4px_4px_0_0_var(--color-shadow)] items-center">
                <div className="shrink-0 mr-3"><Trophy size={36} strokeWidth={2.5}/></div>
                <div className="flex flex-col justify-center">
                  <div className="text-[10px] sm:text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">TOTAL {t('nav.public.prizePool')}</div>
                  <div className="text-xl sm:text-2xl font-black leading-none tracking-tight">$25,000</div>
                  <div className="text-[8px] sm:text-[10px] font-bold uppercase mt-1">GUARANTEED</div>
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
                <div className="shrink-0 mr-3"><div className="w-10 h-10 border-2 border-main rounded-full flex items-center justify-center"><Star size={24} strokeWidth={3}/></div></div>
                <div className="flex flex-col justify-center">
                  <div className="text-[10px] sm:text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">WINNERS PAID</div>
                  <div className="text-xl sm:text-2xl font-black leading-none tracking-tight">1,000</div>
                  <div className="text-[8px] sm:text-[10px] font-bold uppercase mt-1">CASH PRIZES</div>
                </div>
              </div>

              <div className="flex border-4 border-main bg-c4 p-3 sm:p-4 text-main shadow-[4px_4px_0_0_var(--color-shadow)] items-center">
                <div className="shrink-0 mr-3"><Gift size={36} strokeWidth={2.5}/></div>
                <div className="flex flex-col justify-center">
                  <div className="text-[10px] sm:text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">WEEKLY BONUS POOL</div>
                  <div className="text-xl sm:text-2xl font-black leading-none tracking-tight">$2,500</div>
                  <div className="text-[8px] sm:text-[10px] font-bold uppercase mt-1">DISTRIBUTED WEEKLY</div>
                </div>
              </div>
            </div>

            {/* 2-Column Main content Split */}
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-stretch">
              
              {/* Left Column */}
              <div className="flex-1 w-full flex flex-col gap-4 lg:gap-6">
                 
                 {/* TOP PRIZE DISTRIBUTION */}
                 <div className="bg-card border-4 border-main flex flex-col shadow-[4px_4px_0_0_var(--color-shadow)]">
                    <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm lg:text-base border-b-4 border-main">TOP PRIZE DISTRIBUTION</div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 xl:gap-6 bg-page">
                       
                       {/* 1st Place */}
                       <div className="bg-[#FFE875] border-2 border-main p-4 flex flex-col justify-center items-center relative overflow-hidden shadow-[2px_2px_0_var(--color-main)] text-main min-h-[160px]">
                          <Trophy className="absolute -right-4 -bottom-4 opacity-10 text-main" size={120} />
                          <div className="flex items-center gap-2 mb-2 z-10">
                            <Medal size={28} className="text-[#D4AF37]" stroke="#000" strokeWidth={2}/>
                            <span className="font-black text-xl uppercase tracking-widest">1ST PLACE</span>
                            <Star size={16} className="fill-main" />
                          </div>
                          <div className="text-4xl xl:text-5xl font-black leading-none tracking-tighter z-10 mb-2">$10,000</div>
                          <div className="text-xs font-bold uppercase tracking-wide opacity-80 z-10">GRAND PRIZE</div>
                       </div>
                       
                       {/* 2nd Place */}
                       <div className="bg-[#E5E7EB] border-2 border-main p-4 flex flex-col justify-center items-center relative overflow-hidden shadow-[2px_2px_0_var(--color-main)] text-main min-h-[160px]">
                          <Trophy className="absolute -right-4 -bottom-4 opacity-10 text-main" size={120} />
                          <div className="flex items-center gap-2 mb-2 z-10">
                            <Medal size={28} className="text-[#C0C0C0]" stroke="#000" strokeWidth={2}/>
                            <span className="font-black text-xl uppercase tracking-widest">2ND PLACE</span>
                            <Star size={16} className="text-main" />
                          </div>
                          <div className="text-4xl xl:text-5xl font-black leading-none tracking-tighter z-10 mb-2">$5,000</div>
                          <div className="text-xs font-bold uppercase tracking-wide opacity-80 z-10">RUNNER-UP PRIZES</div>
                       </div>

                       {/* 3rd Place */}
                       <div className="bg-[#FCD3B6] border-2 border-main p-4 flex flex-col justify-center items-center relative overflow-hidden shadow-[2px_2px_0_var(--color-main)] text-main min-h-[160px]">
                          <Trophy className="absolute -right-4 -bottom-4 opacity-10 text-main" size={120} />
                          <div className="flex items-center gap-2 mb-2 z-10">
                            <Medal size={28} className="text-[#CD7F32]" stroke="#000" strokeWidth={2}/>
                            <span className="font-black text-xl uppercase tracking-widest">3RD PLACE</span>
                            <Star size={16} className="fill-main" />
                          </div>
                          <div className="text-4xl xl:text-5xl font-black leading-none tracking-tighter z-10 mb-2">$2,500</div>
                          <div className="text-xs font-bold uppercase tracking-wide opacity-80 z-10">THIRD PLACE PRIZE</div>
                       </div>

                    </div>
                 </div>

                 {/* RANKING TIERS */}
                 <div className="bg-card border-4 border-main flex flex-col shadow-[4px_4px_0_0_var(--color-shadow)]">
                    <div className="flex bg-main text-inv font-black uppercase tracking-wide text-xs border-b-4 border-main">
                      <div className="flex-1 px-4 py-3 border-r-4 border-main">RANKING TIERS</div>
                      <div className="w-[140px] px-4 py-3 text-right">PRIZE AMOUNT</div>
                    </div>
                    <div className="flex flex-col text-sm font-bold">
                       <div className="flex items-stretch border-b-2 border-line">
                         <div className="px-4 py-3 flex-1 flex items-center gap-3 border-r-2 border-main">
                            <Users size={18} className="text-subtle" />
                            <span className="uppercase">4TH - 10TH PLACE</span>
                         </div>
                         <div className="px-4 py-3 w-[140px] flex items-center justify-end font-black text-lg text-c3">$1,000</div>
                       </div>
                       <div className="flex items-stretch border-b-2 border-line">
                         <div className="px-4 py-3 flex-1 flex items-center gap-3 border-r-2 border-main">
                            <Users size={18} className="text-subtle" />
                            <span className="uppercase">11TH - 100TH PLACE</span>
                         </div>
                         <div className="px-4 py-3 w-[140px] flex items-center justify-end font-black text-lg text-c3">$250</div>
                       </div>
                       <div className="flex items-stretch border-b-2 border-line">
                         <div className="px-4 py-3 flex-1 flex items-center gap-3 border-r-2 border-main bg-page">
                            <Users size={18} className="text-subtle" />
                            <span className="uppercase">101ST - 1000TH PLACE</span>
                         </div>
                         <div className="px-4 py-3 w-[140px] flex items-center justify-end font-black text-lg text-c3 bg-page">$50</div>
                       </div>
                       <div className="px-4 py-3 bg-muted text-xs uppercase font-bold text-center flex items-center justify-center gap-2">
                          <span>★</span> Free entry. Sponsor/community-backed rewards are reviewed manually before approval.
                       </div>
                    </div>
                 </div>

                 {/* PRIZE CATEGORIES EXPLAINED */}
                 <div className="bg-card border-4 border-main flex flex-col shadow-[4px_4px_0_0_var(--color-shadow)]">
                    <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm border-b-4 border-main">PRIZE CATEGORIES EXPLAINED</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 lg:p-5 bg-page">
                       <div className="bg-card border-2 border-main p-4 relative shadow-[2px_2px_0_var(--color-main)] flex flex-col justify-center">
                          <div className="flex items-center gap-2 font-black uppercase text-xs mb-2 border-b-2 border-line pb-2">
                             <Trophy size={18} className="text-[#D4AF37]" stroke="black" strokeWidth={2}/> GRAND PRIZE
                          </div>
                          <span className="text-[11px] font-bold leading-snug">Awarded to the top 3 players on the overall leaderboard at the end of the tournament.</span>
                       </div>
                       <div className="bg-card border-2 border-c2 p-4 relative shadow-[2px_2px_0_var(--color-c2)] flex flex-col justify-center">
                          <div className="flex items-center gap-2 font-black uppercase text-xs mb-2 border-b-2 border-c2 pb-2 text-c2">
                             <Gift size={18} /> WEEKLY REWARDS
                          </div>
                          <span className="text-[11px] font-bold leading-snug text-main">Sponsor-backed rewards for top weekly performers after eligibility review.</span>
                       </div>
                       <div className="bg-card border-2 border-c4 p-4 relative shadow-[2px_2px_0_var(--color-c4)] flex flex-col justify-center">
                          <div className="flex items-center gap-2 font-black uppercase text-xs mb-2 border-b-2 border-c4 pb-2 text-c4">
                             <Flame size={18} /> STREAK REWARDS
                          </div>
                          <span className="text-[11px] font-bold leading-snug text-main">Earn bonus points and qualify for recognition tracks through correct streaks.</span>
                       </div>
                       <div className="bg-card border-2 border-c3 p-4 relative shadow-[2px_2px_0_var(--color-c3)] flex flex-col justify-center">
                          <div className="flex items-center gap-2 font-black uppercase text-xs mb-2 border-b-2 border-c3 pb-2 text-c3">
                             <div className="bg-c3 w-5 h-5 rounded-full flex items-center justify-center shrink-0"><Star size={12} className="fill-inv text-inv" /></div> BONUS CHALLENGES
                          </div>
                          <span className="text-[11px] font-bold leading-snug text-main">Special sponsor and community challenges with published eligibility rules.</span>
                       </div>
                    </div>
                 </div>

              </div>

              {/* Right Column */}
              <div className="w-full lg:w-[350px] flex flex-col gap-4 lg:gap-6 flex-shrink-0 self-stretch">
                 
                 {/* HOW TO WIN */}
                 <div className="bg-card border-4 border-main flex flex-col shadow-[4px_4px_0_0_var(--color-shadow)]">
                    <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-xs border-b-4 border-main">HOW TO WIN</div>
                    <div className="p-4 flex flex-col gap-3 font-bold text-xs bg-page">
                       <div className="flex items-start gap-2">
                          <CheckCircle2 size={16} className="text-c3 mt-0.5 shrink-0" strokeWidth={3}/>
                          <span>Predict exact scores to earn the most points.</span>
                       </div>
                       <div className="flex items-start gap-2">
                          <CheckCircle2 size={16} className="text-c2 mt-0.5 shrink-0" strokeWidth={3}/>
                          <span>Correct outcomes and streaks earn bonus points.</span>
                       </div>
                       <div className="flex items-start gap-2">
                          <CheckCircle2 size={16} className="text-c4 mt-0.5 shrink-0" strokeWidth={3}/>
                          <span>Climb the leaderboard to qualify for published reward tiers.</span>
                       </div>
                       <div className="flex items-start gap-2">
                          <CheckCircle2 size={16} className="text-c5 mt-0.5 shrink-0" strokeWidth={3}/>
                          <span>Compete weekly in a free-entry skill contest.</span>
                       </div>
                    </div>
                 </div>

                 {/* PAYOUT INFO */}
                 <div className="bg-card border-4 border-main flex flex-col shadow-[4px_4px_0_0_var(--color-shadow)]">
                    <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-xs border-b-4 border-main">PAYOUT INFO</div>
                    <div className="p-4 flex flex-col gap-3 font-bold text-xs bg-page">
                       <div className="flex items-center gap-3">
                          <div className="w-6 h-6 flex items-center justify-center bg-c1 border-2 border-main rounded-full shrink-0 text-main shadow-[2px_2px_0_var(--color-main)]"><ShieldCheck size={14} strokeWidth={3}/></div>
                          <span>Reward amounts are displayed in USD for transparency.</span>
                       </div>
                       <div className="flex items-center gap-3">
                          <div className="w-6 h-6 flex items-center justify-center bg-c2 border-2 border-main rounded-full shrink-0 text-inv shadow-[2px_2px_0_var(--color-main)]"><ClipboardCheck size={14} strokeWidth={3}/></div>
                          <span>Potential winners go through manual eligibility review.</span>
                       </div>
                       <div className="flex items-center gap-3">
                          <div className="w-6 h-6 flex items-center justify-center bg-c4 border-2 border-main rounded-full shrink-0 text-main shadow-[2px_2px_0_var(--color-main)]"><Clock size={14} strokeWidth={3}/></div>
                          <span>No deposits, entry fees, or stored wallet balance in this MVP.</span>
                       </div>
                       <div className="flex items-center gap-3">
                          <div className="w-6 h-6 flex items-center justify-center bg-c5 border-2 border-main rounded-full shrink-0 text-inv shadow-[2px_2px_0_var(--color-main)]"><Mail size={14} strokeWidth={3}/></div>
                          <span>Approved winners are contacted by email for next steps.</span>
                       </div>
                    </div>
                 </div>


                 {/* RECENT TOP WINNERS */}
                 <div className="bg-card border-4 border-main flex flex-col flex-1 shadow-[4px_4px_0_0_var(--color-shadow)]">
                    <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-xs border-b-4 border-main flex justify-between items-center">
                      <span>REWARD TRACK EXAMPLES</span>
                      <button onClick={() => onNavigate('rewards')} className="text-[10px] opacity-80 cursor-pointer hover:underline">VIEW REWARDS</button>
                    </div>
                    <div className="flex flex-col font-bold text-xs bg-page">
                       {[
                         { rank: 1, name: 'Sponsor Grand Prize', amount: '$10,000', bg: 'bg-c1 text-main border-r-2 border-main' },
                         { rank: 2, name: 'Runner-Up Review', amount: '$5,000', bg: 'bg-c2 text-inv border-r-2 border-main' },
                         { rank: 3, name: 'Community Recognition', amount: 'Manual', bg: 'bg-c3 text-main border-r-2 border-main' },
                         { rank: 4, name: 'Weekly Skill Track', amount: '$1,000', bg: 'bg-c4 text-main border-r-2 border-main' },
                         { rank: 5, name: 'Eligibility Review', amount: 'Required', bg: 'bg-c5 text-inv border-r-2 border-main' },
                       ].map((winner, idx) => (
                         <div key={idx} className={`flex items-center border-[1px] border-b-line ${idx === 4 ? 'border-b-0' : ''}`}>
                            <div className={`w-8 py-2 flex justify-center items-center font-black ${winner.bg}`}>{winner.rank}</div>
                            <div className="px-3 flex-1 flex items-center gap-2">
                               <div className="w-5 h-5 rounded-full bg-main text-inv flex items-center justify-center shrink-0">
                                 <User size={12} />
                               </div>
                               <span>{winner.name}</span>
                            </div>
                            <div className="px-3 font-black">{winner.amount}</div>
                         </div>
                       ))}
                    </div>
                 </div>

              </div>

            </div>
          </div>
          
        </div>
    </AppShell>
  );
}
