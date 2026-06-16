import React, { useState } from 'react';
import { Trophy, BarChart2, DollarSign, Globe, Settings, Wallet, ChevronDown, Mail, Lock, Eye, Square, ChevronRight, UserPlus, ClipboardList, Star, User, Flag, Shield } from 'lucide-react';

export default function Register({ onNavigate, isVintage, setIsVintage, isDark, setIsDark, isRounded, setIsRounded, hasShadow, setHasShadow }: { onNavigate: (page: string) => void, isVintage: boolean, setIsVintage: (v: boolean) => void, isDark: boolean, setIsDark: (v: boolean) => void, isRounded: boolean, setIsRounded: (v: boolean) => void, hasShadow: boolean, setHasShadow: (v: boolean) => void }) {
  const [showSettings, setShowSettings] = useState(false);
  const [agree, setAgree] = useState(true);

  const handleRegister = () => {
     onNavigate('onboarding');
  };

  return (
    <div className="h-[100dvh] bg-page p-3 sm:p-4 lg:p-6 flex flex-col font-sans relative">
      <div className="w-full max-w-[1600px] border-4 border-main rounded-lg shadow-[8px_8px_0px_var(--color-shadow)] sm:shadow-[16px_16px_0px_var(--color-shadow)] overflow-hidden flex flex-col mx-auto transition-all relative bg-card flex-1 min-h-0">
        
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
                  {/* Settings ignored for brevity */}
                </div>
              )}
            </div>
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
        <div className="absolute inset-0 z-0 top-[84px] pointer-events-none opacity-90 overflow-hidden flex justify-center">
           <img src="https://s6.imgcdn.dev/Ybh5S0.webp" alt="Background" className="w-full h-full object-cover object-center lg:object-top" />
        </div>

        {/* Main Content Area */}
        <div className="relative z-10 flex flex-col p-4 lg:p-8 xl:p-12 gap-6 flex-1 overflow-y-auto min-h-0">
          
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 max-w-7xl mx-auto w-full items-center lg:items-start flex-1 relative lg:pt-4">
             
             {/* Left Column Text */}
             <div className="flex-1 flex flex-col bg-card border-4 border-main p-6 lg:p-10 shadow-[8px_8px_0_0_var(--color-shadow)] relative z-10 mb-4 lg:mb-0">
                <div className="text-c2 font-black uppercase tracking-widest text-sm mb-2">FIFA WORLD CUP 2026™</div>
                <h1 className="text-6xl md:text-[5.5rem] font-black uppercase tracking-tighter leading-[0.85] mb-6 drop-shadow-[4px_4px_0_rgba(0,0,0,0.05)] text-main">
                   CREATE<br/>ACCOUNT
                </h1>
                <p className="font-bold text-lg max-w-[400px] leading-snug mb-10 text-main">
                   Join the competition, make predictions, climb the leaderboard, and compete for the <span className="text-c3 font-black">$25,000</span> prize pool.
                </p>

                {/* Features list */}
                <div className="flex flex-col gap-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-c1 border-2 border-main flex items-center justify-center shrink-0 shadow-[2px_2px_0_0_var(--color-shadow)] text-main">
                      <DollarSign size={24} strokeWidth={2.5}/>
                    </div>
                    <div className="flex flex-col mt-0.5">
                       <span className="font-black uppercase text-sm leading-tight text-main">FREE TO PLAY</span>
                       <span className="text-xs font-bold text-subtle leading-snug max-w-[200px] mt-1">No entry fees. Just sign up and play.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-c2 border-2 border-main flex items-center justify-center shrink-0 shadow-[2px_2px_0_0_var(--color-shadow)] text-inv">
                      <Globe size={24} strokeWidth={2.5}/>
                    </div>
                    <div className="flex flex-col mt-0.5">
                       <span className="font-black uppercase text-sm leading-tight text-main">GLOBAL RANK</span>
                       <span className="text-xs font-bold text-subtle leading-snug max-w-[200px] mt-1">Compete against fans from around the world.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-c4 border-2 border-main flex items-center justify-center shrink-0 shadow-[2px_2px_0_0_var(--color-shadow)] text-main">
                      <Trophy size={24} strokeWidth={2.5}/>
                    </div>
                    <div className="flex flex-col mt-0.5">
                       <span className="font-black uppercase text-sm leading-tight text-main">WIN REWARDS</span>
                       <span className="text-xs font-bold text-subtle leading-snug max-w-[200px] mt-1">Top players qualify for the $25,000 prize pool.</span>
                    </div>
                  </div>
                </div>

             </div>

             {/* Right Column Form */}
             <div className="w-full max-w-[450px] flex flex-col shrink-0 z-10 relative">
                {/* Tabs */}
                <div className="flex items-end text-sm">
                   <div className="bg-card text-main font-black uppercase px-6 py-3 border-4 border-main border-b-0 w-1/2 text-center cursor-pointer hover:bg-muted" onClick={() => onNavigate('login')}>SIGN IN</div>
                   <div className="bg-c2 text-inv font-black uppercase px-6 py-3 border-4 border-main border-b-0 border-l-2 w-1/2 text-center cursor-pointer">CREATE ACCOUNT</div>
                </div>
                
                {/* Form body */}
                <div className="bg-card border-4 border-main p-6 flex flex-col gap-4 shadow-[8px_8px_0_0_var(--color-shadow)] relative z-10 w-full mb-4">
                   
                   <div className="flex flex-col gap-1.5">
                      <label className="font-black uppercase text-xs">USERNAME</label>
                      <div className="relative">
                         <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-main opacity-80"/>
                         <input type="text" placeholder="Choose a username" className="w-full border-2 border-main p-3 pl-10 font-bold text-sm bg-card shadow-[2px_2px_0_0_var(--color-shadow)] focus:shadow-none focus:translate-y-[2px] focus:translate-x-[2px] transition-all outline-none" />
                      </div>
                   </div>

                   <div className="flex flex-col gap-1.5">
                      <label className="font-black uppercase text-xs">EMAIL</label>
                      <div className="relative">
                         <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-main opacity-80"/>
                         <input type="email" placeholder="Enter your email address" className="w-full border-2 border-main p-3 pl-10 font-bold text-sm bg-card shadow-[2px_2px_0_0_var(--color-shadow)] focus:shadow-none focus:translate-y-[2px] focus:translate-x-[2px] transition-all outline-none" />
                      </div>
                   </div>

                   <div className="flex flex-col gap-1.5">
                      <label className="font-black uppercase text-xs">PASSWORD</label>
                      <div className="relative">
                         <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-main opacity-80"/>
                         <input type="password" placeholder="Create a password" className="w-full border-2 border-main p-3 pl-10 pr-10 font-bold text-sm bg-card shadow-[2px_2px_0_0_var(--color-shadow)] focus:shadow-none focus:translate-y-[2px] focus:translate-x-[2px] transition-all outline-none" />
                         <Eye size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-main opacity-80 cursor-pointer"/>
                      </div>
                   </div>

                   <div className="flex flex-col gap-1.5">
                      <label className="font-black uppercase text-xs">CONFIRM PASSWORD</label>
                      <div className="relative">
                         <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-main opacity-80"/>
                         <input type="password" placeholder="Confirm your password" className="w-full border-2 border-main p-3 pl-10 pr-10 font-bold text-sm bg-card shadow-[2px_2px_0_0_var(--color-shadow)] focus:shadow-none focus:translate-y-[2px] focus:translate-x-[2px] transition-all outline-none" />
                         <Eye size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-main opacity-80 cursor-pointer"/>
                      </div>
                   </div>

                   <div className="flex flex-col gap-1.5">
                      <label className="font-black uppercase text-xs">COUNTRY / FAN CLUB</label>
                      <div className="relative">
                         <Flag size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-main opacity-80"/>
                         <select className="w-full border-2 border-main p-3 pl-10 pr-10 font-bold text-sm bg-card shadow-[2px_2px_0_0_var(--color-shadow)] focus:shadow-none focus:translate-y-[2px] focus:translate-x-[2px] transition-all outline-none appearance-none cursor-pointer">
                           <option value="">Select your country or fan club</option>
                           <option value="us">United States</option>
                           <option value="br">Brazil</option>
                           <option value="fr">France</option>
                         </select>
                         <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-main pointer-events-none"/>
                      </div>
                   </div>

                   <div className="flex items-center gap-2 mt-1 mb-2">
                      <label className="group flex items-center cursor-pointer gap-2 relative">
                         <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="peer sr-only" />
                         <div className="w-4 h-4 bg-card border-2 border-main flex items-center justify-center shrink-0 text-inv peer-checked:bg-c2 transition-colors">
                            {agree && <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3 text-inv"><path d="M11.6666 3.5L5.24992 9.91667L2.33325 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                         </div>
                         <span className="font-bold text-xs select-none">
                            I agree to the <span className="text-c2 hover:underline cursor-pointer">Rules</span> and <span className="text-c2 hover:underline cursor-pointer">Prize Terms</span>.
                         </span>
                      </label>
                   </div>

                   <button onClick={handleRegister} className="w-full bg-c2 hover:opacity-90 text-inv font-black uppercase py-4 border-2 border-main shadow-[4px_4px_0_0_var(--color-shadow)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all text-lg mb-2">
                      CREATE ACCOUNT
                   </button>

                   <div className="relative flex items-center justify-center py-2">
                      <div className="absolute inset-x-0 h-0.5 bg-line top-1/2 -translate-y-1/2 mx-2"></div>
                      <span className="bg-card px-4 font-bold text-xs uppercase z-10 relative">OR</span>
                   </div>

                   <button className="w-full bg-card hover:bg-muted text-main font-black uppercase py-3 border-2 border-main shadow-[4px_4px_0_0_var(--color-shadow)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all text-sm flex items-center justify-center gap-3">
                      <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                      CONTINUE WITH GOOGLE
                   </button>

                   <div className="text-center font-bold text-xs mt-3">
                      Already have an account? <span className="text-c2 cursor-pointer hover:underline" onClick={() => onNavigate('login')}>Sign in</span>
                   </div>
                </div>

             </div>

          </div>

          {/* Banner below the main block, stretches across */}
          <div className="bg-card border-4 border-main p-4 flex flex-col md:flex-row items-stretch gap-4 md:gap-0 shadow-[8px_8px_0_0_var(--color-shadow)] mt-4 z-10 relative">
             <div className="flex items-center gap-3 flex-1 border-b-2 md:border-b-0 md:border-r-2 border-line pb-3 md:pb-0 md:pr-3">
                <div className="w-10 h-10 rounded-full bg-c1 border-2 border-main flex items-center justify-center shrink-0">
                   <DollarSign size={20} strokeWidth={2.5} className="text-main" />
                </div>
                <div className="flex flex-col">
                   <span className="font-black text-xs uppercase text-main">NO ENTRY FEE</span>
                   <span className="text-[10px] font-bold text-subtle leading-tight mt-0.5">Sign up and play for free.<br/>Everyone can join.</span>
                </div>
             </div>
             <div className="flex items-center gap-3 flex-1 border-b-2 md:border-b-0 md:border-r-2 border-line pb-3 md:pb-0 md:px-3">
                <div className="w-10 h-10 rounded-full bg-card text-c2 border-2 border-c2 flex items-center justify-center shrink-0">
                   <Shield size={20} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                   <span className="font-black text-xs uppercase text-main">SECURE ACCOUNT</span>
                   <span className="text-[10px] font-bold text-subtle leading-tight mt-0.5">Your data is protected<br/>with industry-standard security.</span>
                </div>
             </div>
             <div className="flex items-center gap-3 flex-1 md:pl-3">
                <div className="w-10 h-10 rounded-full bg-c4 text-inv border-2 border-main flex items-center justify-center shrink-0">
                   <BarChart2 size={20} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                   <span className="font-black text-xs uppercase text-main">ELIGIBLE FOR LEADERBOARDS</span>
                   <span className="text-[10px] font-bold text-subtle leading-tight mt-0.5">Start predicting to earn points<br/>and climb the ranks.</span>
                </div>
             </div>
          </div>

          {/* BOTTOM BANNER (1,2,3,4) Similar to Rules/PrizePool */}
          <div className="flex flex-col lg:flex-row border-4 border-main shadow-[8px_8px_0_0_var(--color-shadow)] bg-card overflow-hidden w-full uppercase mt-4 shrink-0 relative z-10">
             
             {/* Step 1 */}
             <div className="flex-1 flex border-b-4 lg:border-b-0 lg:border-r-4 border-main min-h-[80px]">
                <div className="w-[4rem] bg-c1 flex justify-center items-center border-r-4 border-main shrink-0 text-main pb-1">
                   <span className="font-black text-5xl leading-none">1</span>
                </div>
                <div className="w-12 bg-c1 flex justify-center items-center shrink-0 text-main relative">
                   <div className="bg-main/20 w-0.5 absolute right-0 top-0 bottom-0"></div>
                   <UserPlus size={24} strokeWidth={2.5}/>
                </div>
                <div className="flex flex-col justify-center p-3 flex-1 bg-page">
                   <span className="font-black text-xs tracking-wide">CREATE ACCOUNT</span>
                   <span className="text-[9px] font-bold leading-[1.2] capitalize text-subtle mt-1 max-w-[150px]">Sign up in seconds and join the competition.</span>
                </div>
                <div className="flex items-center justify-center px-2 bg-page">
                   <ChevronRight size={20} className="text-main" />
                </div>
             </div>

             {/* Step 2 */}
             <div className="flex-1 flex border-b-4 lg:border-b-0 lg:border-r-4 border-main min-h-[80px]">
                <div className="w-[4rem] bg-c2 flex justify-center items-center border-r-4 border-main shrink-0 text-inv pb-1">
                   <span className="font-black text-5xl leading-none">2</span>
                </div>
                <div className="w-12 bg-c2 flex justify-center items-center shrink-0 text-inv relative">
                   <div className="bg-main/20 w-0.5 absolute right-0 top-0 bottom-0"></div>
                   <ClipboardList size={24} strokeWidth={2.5}/>
                </div>
                <div className="flex flex-col justify-center p-3 flex-1 bg-page">
                   <span className="font-black text-xs tracking-wide">PICK MATCHES</span>
                   <span className="text-[9px] font-bold leading-[1.2] capitalize text-subtle mt-1 max-w-[150px]">Make your predictions for upcoming games.</span>
                </div>
                <div className="flex items-center justify-center px-2 bg-page">
                   <ChevronRight size={20} className="text-main" />
                </div>
             </div>

             {/* Step 3 */}
             <div className="flex-1 flex border-b-4 lg:border-b-0 lg:border-r-4 border-main min-h-[80px]">
                <div className="w-[4rem] bg-c3 flex justify-center items-center border-r-4 border-main shrink-0 text-main pb-1">
                   <span className="font-black text-5xl leading-none">3</span>
                </div>
                <div className="w-12 bg-c3 flex justify-center items-center shrink-0 text-main relative">
                   <div className="bg-main/20 w-0.5 absolute right-0 top-0 bottom-0"></div>
                   <BarChart2 size={24} strokeWidth={2.5}/>
                </div>
                <div className="flex flex-col justify-center p-3 flex-1 bg-page">
                   <span className="font-black text-xs tracking-wide">EARN POINTS</span>
                   <span className="text-[9px] font-bold leading-[1.2] capitalize text-subtle mt-1 max-w-[150px]">Get points for correct predictions and streaks.</span>
                </div>
                <div className="flex items-center justify-center px-2 bg-page">
                   <ChevronRight size={20} className="text-main" />
                </div>
             </div>

             {/* Step 4 */}
             <div className="flex-1 flex min-h-[80px]">
                <div className="w-[4rem] bg-c4 flex justify-center items-center border-r-4 border-main shrink-0 text-main pb-1">
                   <span className="font-black text-5xl leading-none">4</span>
                </div>
                <div className="w-12 bg-c4 flex justify-center items-center border-r-4 border-main shrink-0 text-main">
                   <Trophy size={24} strokeWidth={2.5}/>
                </div>
                <div className="flex flex-col justify-center p-3 flex-1 bg-page">
                   <span className="font-black text-xs tracking-wide">WIN PRIZES</span>
                   <span className="text-[9px] font-bold leading-[1.2] capitalize text-subtle mt-1 max-w-[150px]">Top players share the $25,000 prize pool.</span>
                </div>
             </div>

          </div>

        </div>
      </div>
    </div>
  );
}
