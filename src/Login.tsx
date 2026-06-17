import { Trophy, BarChart2, Crown, DollarSign, Globe, Wallet, ChevronDown, Mail, Lock, Eye, CheckSquare, ChevronRight, UserPlus, ClipboardList, PenTool, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LegacySettingsMenu from './components/LegacySettingsMenu';

export default function Login({ onNavigate, isVintage, setIsVintage, isDark, setIsDark, isRounded, setIsRounded, hasShadow, setHasShadow, hasFrame, setHasFrame }: { onNavigate: (page: string) => void, isVintage: boolean, setIsVintage: (v: boolean) => void, isDark: boolean, setIsDark: (v: boolean) => void, isRounded: boolean, setIsRounded: (v: boolean) => void, hasShadow: boolean, setHasShadow: (v: boolean) => void, hasFrame: boolean, setHasFrame: (v: boolean) => void }) {
  const { t } = useTranslation();
  const themeControls = { isVintage, setIsVintage, isDark, setIsDark, isRounded, setIsRounded, hasShadow, setHasShadow, hasFrame, setHasFrame };

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
          <div className="text-xl md:text-3xl font-black uppercase tracking-tighter cursor-pointer" onClick={() => onNavigate('landing')}>{t('common.product')}</div>
          <div className="hidden lg:flex space-x-10 font-bold uppercase text-sm tracking-wide">
            <button className="hover:text-c2 transition-colors pb-1" onClick={() => onNavigate('matches')}>{t('nav.public.matches')}</button>
            <button className="hover:text-c2 transition-colors pb-1" onClick={() => onNavigate('leaderboard')}>{t('nav.public.leaderboard')}</button>
            <button className="hover:text-c2 transition-colors pb-1" onClick={() => onNavigate('rules')}>{t('nav.public.rules')}</button>
            <button className="hover:text-c2 transition-colors pb-1" onClick={() => onNavigate('prize-pool')}>{t('nav.public.prizePool')}</button>
          </div>
          <div className="flex items-center gap-3">
            <LegacySettingsMenu {...themeControls} />
            <button className="bg-c2 hover:opacity-80 transition-opacity text-inv font-black py-2 px-4 border-2 border-main flex items-center gap-3 transition-transform transform active:scale-95 shadow-[4px_4px_0_0_var(--color-shadow)]">
              <Wallet size={18} strokeWidth={2.5} />
              <div className="flex flex-col items-start leading-[1.1] hidden sm:flex">
                <span className="text-[10px] uppercase font-bold opacity-80">{t('auth.wallet')}</span>
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
                <div className="text-c2 font-black uppercase tracking-widest text-sm mb-2">{t('auth.heroEyebrow')}</div>
                <h1 className="text-6xl md:text-[5.5rem] font-black uppercase tracking-tighter leading-[0.85] mb-6 drop-shadow-[4px_4px_0_rgba(0,0,0,0.05)] text-main">
                   {t('auth.loginTitleLine1')}<br/>{t('auth.loginTitleLine2')}
                </h1>
                <p className="font-bold text-lg max-w-[400px] leading-snug mb-10 text-main">
                   {t('auth.loginBody')}
                </p>

                {/* Features list */}
                <div className="flex flex-col gap-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-c1 border-2 border-main flex items-center justify-center shrink-0 shadow-[2px_2px_0_0_var(--color-shadow)] text-main">
                      <Trophy size={24} strokeWidth={2.5}/>
                    </div>
                    <div className="flex flex-col mt-0.5">
                       <span className="font-black uppercase text-sm leading-tight text-main">{t('auth.features.predictTitle')}</span>
                       <span className="text-xs font-bold text-subtle leading-snug max-w-[200px] mt-1">{t('auth.features.predictBody')}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-c2 border-2 border-main flex items-center justify-center shrink-0 shadow-[2px_2px_0_0_var(--color-shadow)] text-inv">
                      <BarChart2 size={24} strokeWidth={2.5}/>
                    </div>
                    <div className="flex flex-col mt-0.5">
                       <span className="font-black uppercase text-sm leading-tight text-main">{t('auth.features.pointsTitle')}</span>
                       <span className="text-xs font-bold text-subtle leading-snug max-w-[200px] mt-1">{t('auth.features.pointsBody')}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-c4 border-2 border-main flex items-center justify-center shrink-0 shadow-[2px_2px_0_0_var(--color-shadow)] text-main">
                      <Crown size={24} strokeWidth={2.5}/>
                    </div>
                    <div className="flex flex-col mt-0.5">
                       <span className="font-black uppercase text-sm leading-tight text-main">{t('auth.features.rewardsTitle')}</span>
                       <span className="text-xs font-bold text-subtle leading-snug max-w-[200px] mt-1">{t('auth.features.rewardsBody')}</span>
                    </div>
                  </div>
                </div>

             </div>

             {/* Right Column Form */}
             <div className="w-full max-w-[450px] flex flex-col shrink-0 z-10 relative">
                {/* Tabs */}
                <div className="flex items-end text-sm">
                   <div className="bg-c2 text-inv font-black uppercase px-6 py-3 border-4 border-main border-b-0 w-1/2 text-center cursor-pointer">{t('auth.signIn')}</div>
                   <div className="bg-card text-main font-black uppercase px-6 py-3 border-4 border-main border-b-0 border-l-2 w-1/2 text-center cursor-pointer hover:bg-muted" onClick={() => onNavigate('register')}>{t('auth.createAccount')}</div>
                </div>
                
                {/* Form body */}
                <div className="bg-card border-4 border-main p-6 flex flex-col gap-4 shadow-[8px_8px_0_0_var(--color-shadow)] relative z-10 w-full mb-6">
                   <div className="flex flex-col gap-1.5">
                      <label className="font-black uppercase text-xs">{t('auth.emailUsername')}</label>
                      <div className="relative">
                         <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-main opacity-80"/>
                         <input type="text" placeholder={t('auth.enterEmailUsername')} className="w-full border-2 border-main p-3 pl-10 font-bold text-sm bg-card shadow-[2px_2px_0_0_var(--color-shadow)] focus:shadow-none focus:translate-y-[2px] focus:translate-x-[2px] transition-all outline-none" />
                      </div>
                   </div>
                   <div className="flex flex-col gap-1.5">
                      <label className="font-black uppercase text-xs">{t('auth.password')}</label>
                      <div className="relative">
                         <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-main opacity-80"/>
                         <input type="password" placeholder={t('auth.enterPassword')} className="w-full border-2 border-main p-3 pl-10 pr-10 font-bold text-sm bg-card shadow-[2px_2px_0_0_var(--color-shadow)] focus:shadow-none focus:translate-y-[2px] focus:translate-x-[2px] transition-all outline-none" />
                         <Eye size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-main opacity-80 cursor-pointer"/>
                      </div>
                   </div>
                   <div className="flex items-center justify-between mt-1 mb-2">
                      <label className="flex items-center gap-2 cursor-pointer group">
                         <div className="w-4 h-4 bg-c2 border-2 border-main flex items-center justify-center shrink-0 text-inv">
                            <CheckSquare size={12} className="opacity-100" />
                         </div>
                         <span className="font-bold text-xs">{t('auth.rememberMe')}</span>
                      </label>
                      <span className="font-bold text-xs text-c2 cursor-pointer hover:underline">{t('auth.forgotPassword')}</span>
                   </div>

                   <button className="w-full bg-c2 hover:opacity-90 text-inv font-black uppercase py-4 border-2 border-main shadow-[4px_4px_0_0_var(--color-shadow)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all text-lg mb-2">
                      {t('auth.signIn')}
                   </button>

                   <div className="relative flex items-center justify-center py-2">
                      <div className="absolute inset-x-0 h-0.5 bg-line top-1/2 -translate-y-1/2 mx-2"></div>
                      <span className="bg-card px-4 font-bold text-xs uppercase z-10 relative">{t('auth.or')}</span>
                   </div>

                   <button className="w-full bg-card hover:bg-muted text-main font-black uppercase py-3 border-2 border-main shadow-[4px_4px_0_0_var(--color-shadow)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all text-sm flex items-center justify-center gap-3">
                      <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                      {t('auth.continueWithGoogle')}
                   </button>

                   <div className="text-center font-bold text-xs mt-3">
                      {t('auth.newHere')} <span className="text-c2 cursor-pointer hover:underline" onClick={() => onNavigate('register')}>{t('auth.createAccountLink')}</span>
                   </div>
                </div>

                {/* Below form banner */}
                <div className="bg-card border-4 border-main p-4 flex flex-col md:flex-row items-stretch gap-4 md:gap-0 shadow-[8px_8px_0_0_var(--color-shadow)]">
                   <div className="flex items-center gap-3 flex-1 border-b-2 md:border-b-0 md:border-r-2 border-line pb-3 md:pb-0 md:pr-3">
                      <div className="w-8 h-8 rounded-full bg-c1 border-2 border-main flex items-center justify-center shrink-0">
                         <DollarSign size={16} strokeWidth={3} className="text-main" />
                      </div>
                      <div className="flex flex-col">
                         <span className="font-black text-[10px] uppercase text-main">{t('auth.features.freeTitle')}</span>
                         <span className="text-[9px] font-bold text-subtle leading-tight">{t('auth.features.freeBody')}</span>
                      </div>
                   </div>
                   <div className="flex items-center gap-3 flex-1 border-b-2 md:border-b-0 md:border-r-2 border-line pb-3 md:pb-0 md:px-3">
                      <div className="w-8 h-8 rounded-full bg-c2 text-inv border-2 border-main flex items-center justify-center shrink-0">
                         <Globe size={16} strokeWidth={3} />
                      </div>
                      <div className="flex flex-col">
                         <span className="font-black text-[10px] uppercase text-main">{t('auth.features.leaderboardTitle')}</span>
                         <span className="text-[9px] font-bold text-subtle leading-tight">{t('auth.features.leaderboardBody')}</span>
                      </div>
                   </div>
                   <div className="flex items-center gap-3 flex-1 md:pl-3">
                      <div className="w-8 h-8 rounded-full bg-c4 text-main border-2 border-main flex items-center justify-center shrink-0">
                         <Trophy size={16} strokeWidth={3} />
                      </div>
                      <div className="flex flex-col">
                         <span className="font-black text-[10px] uppercase text-main">{t('auth.features.eligibleTitle')}</span>
                         <span className="text-[9px] font-bold text-subtle leading-tight">{t('auth.features.eligibleBody')}</span>
                      </div>
                   </div>
                </div>
             </div>

          </div>

          {/* BOTTOM BANNER */}
          <div className="flex flex-col lg:flex-row border-4 border-main shadow-[8px_8px_0_0_var(--color-shadow)] bg-card overflow-hidden w-full uppercase mt-auto shrink-0 relative z-10">
             
             {/* Step 1 */}
             <div className="flex-1 flex border-b-4 lg:border-b-0 lg:border-r-4 border-main min-h-[90px] xl:min-h-[100px]">
                <div className="w-[4.5rem] bg-c1 flex justify-center items-center border-r-4 border-main shrink-0 text-main pb-1">
                   <span className="font-black text-6xl leading-none">1</span>
                </div>
                <div className="w-16 bg-c1 flex justify-center items-center shrink-0 text-main relative">
                   <div className="bg-main/20 w-0.5 absolute right-0 top-0 bottom-0"></div>
                   <UserPlus size={28} strokeWidth={2.5}/>
                </div>
                <div className="flex flex-col justify-center p-3 flex-1 bg-page">
                   <span className="font-black text-[13px] xl:text-sm tracking-wide">{t('auth.createAccount')}</span>
                   <span className="text-[10px] xl:text-[11px] font-bold leading-[1.2] capitalize text-subtle mt-1 max-w-[170px]">{t('auth.steps.createAccountBody')}</span>
                </div>
                <div className="flex items-center justify-center px-4 bg-page">
                   <ChevronRight size={24} className="text-main" />
                </div>
             </div>

             {/* Step 2 */}
             <div className="flex-1 flex border-b-4 lg:border-b-0 lg:border-r-4 border-main min-h-[90px] xl:min-h-[100px]">
                <div className="w-[4.5rem] bg-c2 flex justify-center items-center border-r-4 border-main shrink-0 text-inv pb-1">
                   <span className="font-black text-6xl leading-none">2</span>
                </div>
                <div className="w-16 bg-c2 flex justify-center items-center shrink-0 text-inv relative">
                   <div className="bg-main/20 w-0.5 absolute right-0 top-0 bottom-0"></div>
                   <ClipboardList size={28} strokeWidth={2.5}/>
                </div>
                <div className="flex flex-col justify-center p-3 flex-1 bg-page">
                   <span className="font-black text-[13px] xl:text-sm tracking-wide">{t('picks.makeYourPicks')}</span>
                   <span className="text-[10px] xl:text-[11px] font-bold leading-[1.2] capitalize text-subtle mt-1 max-w-[170px]">{t('auth.features.predictBody')}</span>
                </div>
                <div className="flex items-center justify-center px-4 bg-page">
                   <ChevronRight size={24} className="text-main" />
                </div>
             </div>

             {/* Step 3 */}
             <div className="flex-1 flex min-h-[90px] xl:min-h-[100px]">
                <div className="w-[4.5rem] bg-c3 flex justify-center items-center border-r-4 border-main shrink-0 text-main pb-1">
                   <span className="font-black text-6xl leading-none">3</span>
                </div>
                <div className="w-16 bg-c3 flex justify-center items-center border-r-4 border-main shrink-0 text-main">
                   <BarChart2 size={28} strokeWidth={2.5}/>
                </div>
                <div className="flex flex-col justify-center p-3 flex-1 bg-page">
                   <span className="font-black text-[13px] xl:text-sm tracking-wide">{t('auth.features.climbTitle')}</span>
                   <span className="text-[10px] xl:text-[11px] font-bold leading-[1.2] capitalize text-subtle mt-1 max-w-[170px]">{t('auth.steps.winPrizesBody')}</span>
                </div>
             </div>

          </div>

        </div>
      </div>
    </div>
  );
}
