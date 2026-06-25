import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Users, Star, Gift, CheckCircle2, ShieldCheck, ClipboardCheck, Clock, Mail, User, Medal } from 'lucide-react';
import AppShell from './components/layout/AppShell';
import StreakBadge from './components/ui/StreakBadge';
import { listGlobalLeaderboard } from './services/leaderboard';

export default function PointsGuide({ onNavigate, isVintage, setIsVintage, isDark, setIsDark, isRounded, setIsRounded, hasShadow, setHasShadow, hasFrame, setHasFrame }: { onNavigate: (page: string) => void, isVintage: boolean, setIsVintage: (v: boolean) => void, isDark: boolean, setIsDark: (v: boolean) => void, isRounded: boolean, setIsRounded: (v: boolean) => void, hasShadow: boolean, setHasShadow: (v: boolean) => void, hasFrame: boolean, setHasFrame: (v: boolean) => void }) {
  const { t } = useTranslation();
  const themeControls = { isVintage, setIsVintage, isDark, setIsDark, isRounded, setIsRounded, hasShadow, setHasShadow, hasFrame, setHasFrame };
  const [totalPlayers, setTotalPlayers] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    listGlobalLeaderboard()
      .then((entries) => {
        if (active) setTotalPlayers(entries.length);
      })
      .catch(() => {
        if (active) setTotalPlayers(0);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <AppShell themeControls={themeControls}>
        <div className="relative z-10 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6 min-h-0">

          <div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col w-full xl:w-1/2 shadow-[8px_8px_0_0_var(--color-shadow)]">
             <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-1 text-main">
                {t('nav.public.pointsGuide')}
             </h1>
          </div>

          <div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col gap-4 lg:gap-6 shadow-[8px_8px_0_0_var(--color-shadow)] rounded-sm">

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 border-b-4 border-main">
              <div className="flex items-center gap-4 border-b-4 sm:border-r-4 xl:border-b-0 border-main p-4 lg:p-5 bg-c1 text-main">
                <div className="shrink-0"><Trophy size={36} strokeWidth={2.5}/></div>
                <div className="flex flex-col justify-center">
                  <div className="text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">{t('ui.pointChallenge')}</div>
                  <div className="text-2xl sm:text-3xl font-black leading-none">PTS</div>
                  <div className="text-[10px] font-bold uppercase mt-1">{t('ui.guaranteed')}</div>
                </div>
              </div>

              <div className="flex items-center gap-4 border-b-4 xl:border-b-0 xl:border-r-4 border-main p-4 lg:p-5 bg-c2 text-inv">
                <div className="shrink-0"><Users size={36} strokeWidth={2.5}/></div>
                <div className="flex flex-col justify-center">
                  <div className="text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">{t('ui.totalPlayers')}</div>
                  <div className="text-2xl sm:text-3xl font-black leading-none">{totalPlayers === null ? '…' : totalPlayers.toLocaleString()}</div>
                  <div className="text-[10px] font-bold uppercase mt-1">{t('ui.joined')}</div>
                </div>
              </div>

              <div className="flex items-center gap-4 border-b-4 sm:border-b-0 sm:border-r-4 border-main p-4 lg:p-5 bg-c3 text-main">
                <div className="shrink-0"><div className="w-10 h-10 border-2 border-main rounded-full flex items-center justify-center"><Star size={24} strokeWidth={3}/></div></div>
                <div className="flex flex-col justify-center">
                  <div className="text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">{t('ui.playersRecognized')}</div>
                  <div className="text-2xl sm:text-3xl font-black leading-none">1,000</div>
                  <div className="text-[10px] font-bold uppercase mt-1">{t('ui.recognitionTiers')}</div>
                </div>
              </div>

              <div className="flex items-center gap-4 border-main p-4 lg:p-5 bg-c4 text-main">
                <div className="shrink-0"><Gift size={36} strokeWidth={2.5}/></div>
                <div className="flex flex-col justify-center">
                  <div className="text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">{t('ui.weeklyBonusPool')}</div>
                  <div className="text-2xl sm:text-3xl font-black leading-none">Bronze Tier</div>
                  <div className="text-[10px] font-bold uppercase mt-1">{t('ui.distributedWeekly')}</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col xl:flex-row flex-1 items-stretch">

              <div className="flex-1 border-r-0 xl:border-r-4 border-main flex flex-col bg-muted min-w-0">

                 <div className="bg-card flex flex-col border-b-4 border-main">
                    <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-xs border-b-4 border-main min-h-[48px] flex items-center">{t('ui.topRecognitionDistribution')}</div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 xl:gap-6 bg-page">

                       <div className="bg-[#FFE875] border-2 border-main p-4 flex flex-col justify-center items-center relative overflow-hidden shadow-[2px_2px_0_var(--color-main)] text-main min-h-[160px]">
                          <Trophy className="absolute -right-4 -bottom-4 opacity-10 text-main" size={120} />
                          <div className="flex items-center gap-2 mb-2 z-10">
                            <Medal size={28} className="text-[#D4AF37]" stroke="#000" strokeWidth={2}/>
                            <span className="font-black text-xl uppercase tracking-widest">{t('ui.firstPlace')}</span>
                            <Star size={16} className="fill-main" />
                          </div>
                          <div className="text-4xl xl:text-5xl font-black leading-none tracking-tighter z-10 mb-2">Gold Tier</div>
                          <div className="text-xs font-bold uppercase tracking-wide opacity-80 z-10">{t('ui.topRecognition')}</div>
                       </div>

                       <div className="bg-[#E5E7EB] border-2 border-main p-4 flex flex-col justify-center items-center relative overflow-hidden shadow-[2px_2px_0_var(--color-main)] text-main min-h-[160px]">
                          <Trophy className="absolute -right-4 -bottom-4 opacity-10 text-main" size={120} />
                          <div className="flex items-center gap-2 mb-2 z-10">
                            <Medal size={28} className="text-[#C0C0C0]" stroke="#000" strokeWidth={2}/>
                            <span className="font-black text-xl uppercase tracking-widest">{t('ui.secondPlace')}</span>
                            <Star size={16} className="text-main" />
                          </div>
                          <div className="text-4xl xl:text-5xl font-black leading-none tracking-tighter z-10 mb-2">Silver Tier</div>
                          <div className="text-xs font-bold uppercase tracking-wide opacity-80 z-10">{t('ui.runnerUpRecognition')}</div>
                       </div>

                       <div className="bg-[#FCD3B6] border-2 border-main p-4 flex flex-col justify-center items-center relative overflow-hidden shadow-[2px_2px_0_var(--color-main)] text-main min-h-[160px]">
                          <Trophy className="absolute -right-4 -bottom-4 opacity-10 text-main" size={120} />
                          <div className="flex items-center gap-2 mb-2 z-10">
                            <Medal size={28} className="text-[#CD7F32]" stroke="#000" strokeWidth={2}/>
                            <span className="font-black text-xl uppercase tracking-widest">{t('ui.thirdPlace')}</span>
                            <Star size={16} className="fill-main" />
                          </div>
                          <div className="text-4xl xl:text-5xl font-black leading-none tracking-tighter z-10 mb-2">Bronze Tier</div>
                          <div className="text-xs font-bold uppercase tracking-wide opacity-80 z-10">{t('ui.thirdPlaceRecognition')}</div>
                       </div>

                    </div>
                 </div>

                 <div className="bg-card flex flex-col border-b-4 border-main">
                    <div className="flex bg-main text-inv font-black uppercase tracking-wide text-xs border-b-4 border-main">
                      <div className="flex-1 px-4 py-3 border-r-4 border-main">{t('ui.rankingTiers')}</div>
                      <div className="w-[140px] px-4 py-3 text-right">{t('ui.recognitionTier')}</div>
                    </div>
                    <div className="flex flex-col text-sm font-bold">
                       <div className="flex items-stretch border-b-2 border-line">
                         <div className="px-4 py-3 flex-1 flex items-center gap-3 border-r-2 border-main">
                            <Users size={18} className="text-subtle" />
                            <span className="uppercase">{t('ui.fourthToTenth')}</span>
                         </div>
                         <div className="px-4 py-3 w-[140px] flex items-center justify-end font-black text-lg text-c3">Top 10</div>
                       </div>
                       <div className="flex items-stretch border-b-2 border-line">
                         <div className="px-4 py-3 flex-1 flex items-center gap-3 border-r-2 border-main">
                            <Users size={18} className="text-subtle" />
                            <span className="uppercase">{t('ui.eleventhToHundredth')}</span>
                         </div>
                         <div className="px-4 py-3 w-[140px] flex items-center justify-end font-black text-lg text-c3">Top 100</div>
                       </div>
                       <div className="flex items-stretch border-b-2 border-line">
                         <div className="px-4 py-3 flex-1 flex items-center gap-3 border-r-2 border-main bg-page">
                            <Users size={18} className="text-subtle" />
                            <span className="uppercase">{t('ui.hundredFirstToThousandth')}</span>
                         </div>
                         <div className="px-4 py-3 w-[140px] flex items-center justify-end font-black text-lg text-c3 bg-page">Top 1000</div>
                       </div>
                       <div className="px-4 py-3 bg-muted text-xs uppercase font-bold text-center flex items-center justify-center gap-2">
                          <span>★</span> {t('ui.eligibilityNote')}
                       </div>
                    </div>
                 </div>

                 <div className="bg-card flex flex-col border-b-4 border-main">
                    <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm border-b-4 border-main">{t('ui.recognitionCategoriesExplained')}</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 lg:p-5 bg-page">
                       <div className="bg-card border-2 border-main p-4 relative shadow-[2px_2px_0_var(--color-main)] flex flex-col justify-center">
                          <div className="flex items-center gap-2 font-black uppercase text-xs mb-2 border-b-2 border-line pb-2">
                             <Trophy size={18} className="text-[#D4AF37]" stroke="black" strokeWidth={2}/> {t('ui.topRecognition')}
                          </div>
                          <span className="text-[11px] font-bold leading-snug">{t('ui.topRecognitionBody')}</span>
                       </div>
                       <div className="bg-card border-2 border-c2 p-4 relative shadow-[2px_2px_0_var(--color-c2)] flex flex-col justify-center">
                          <div className="flex items-center gap-2 font-black uppercase text-xs mb-2 border-b-2 border-c2 pb-2 text-c2">
                             <Gift size={18} /> {t('ui.weeklyRewards')}
                          </div>
                          <span className="text-[11px] font-bold leading-snug text-main">{t('ui.weeklyRewardsBody')}</span>
                       </div>
                       <div className="bg-card border-2 border-c4 p-4 relative shadow-[2px_2px_0_var(--color-c4)] flex flex-col justify-center">
                          <div className="flex items-center gap-2 font-black uppercase text-xs mb-2 border-b-2 border-c4 pb-2 text-c4">
                             <StreakBadge streak={3} size="sm" showValue={false} /> {t('ui.streakRewards')}
                          </div>
                          <span className="text-[11px] font-bold leading-snug text-main">{t('ui.streakRewardsBody')}</span>
                       </div>
                       <div className="bg-card border-2 border-c3 p-4 relative shadow-[2px_2px_0_var(--color-c3)] flex flex-col justify-center">
                          <div className="flex items-center gap-2 font-black uppercase text-xs mb-2 border-b-2 border-c3 pb-2 text-c3">
                             <div className="bg-c3 w-5 h-5 rounded-full flex items-center justify-center shrink-0"><Star size={12} className="fill-inv text-inv" /></div> {t('ui.bonusChallenges')}
                          </div>
                          <span className="text-[11px] font-bold leading-snug text-main">{t('ui.bonusChallengesBody')}</span>
                       </div>
                    </div>
                 </div>

              </div>

              <div className="w-full xl:w-[350px] bg-card flex flex-col flex-shrink-0 self-stretch min-h-full">

                 <div className="bg-card flex flex-col border-b-4 border-main">
                    <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-xs border-b-4 border-main min-h-[48px] flex items-center">{t('ui.howToWin')}</div>
                    <div className="p-4 flex flex-col gap-3 font-bold text-xs bg-page flex-1 justify-center">
                       <div className="flex items-start gap-2">
                          <CheckCircle2 size={16} className="text-c3 mt-0.5 shrink-0" strokeWidth={3}/>
                          <span>{t('ui.howToWinExact')}</span>
                       </div>
                       <div className="flex items-start gap-2">
                          <CheckCircle2 size={16} className="text-c2 mt-0.5 shrink-0" strokeWidth={3}/>
                          <span>{t('ui.howToWinOutcome')}</span>
                       </div>
                       <div className="flex items-start gap-2">
                          <CheckCircle2 size={16} className="text-c4 mt-0.5 shrink-0" strokeWidth={3}/>
                          <span>{t('ui.howToWinClimb')}</span>
                       </div>
                       <div className="flex items-start gap-2">
                          <CheckCircle2 size={16} className="text-c5 mt-0.5 shrink-0" strokeWidth={3}/>
                          <span>{t('ui.howToWinWeekly')}</span>
                       </div>
                    </div>
                 </div>

                 <div className="bg-card flex flex-col border-b-4 border-main">
                    <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-xs border-b-4 border-main">{t('ui.freeGameNote')}</div>
                    <div className="p-4 flex flex-col gap-3 font-bold text-xs bg-page">
                       <div className="flex items-center gap-3">
                          <div className="w-6 h-6 flex items-center justify-center bg-c1 border-2 border-main rounded-full shrink-0 text-main shadow-[2px_2px_0_var(--color-main)]"><ShieldCheck size={14} strokeWidth={3}/></div>
                          <span>{t('ui.virtualPointsOnly')}</span>
                       </div>
                       <div className="flex items-center gap-3">
                          <div className="w-6 h-6 flex items-center justify-center bg-c2 border-2 border-main rounded-full shrink-0 text-inv shadow-[2px_2px_0_var(--color-main)]"><ClipboardCheck size={14} strokeWidth={3}/></div>
                          <span>{t('ui.fairPlayReview')}</span>
                       </div>
                       <div className="flex items-center gap-3">
                          <div className="w-6 h-6 flex items-center justify-center bg-c4 border-2 border-main rounded-full shrink-0 text-main shadow-[2px_2px_0_var(--color-main)]"><Clock size={14} strokeWidth={3}/></div>
                          <span>{t('ui.noExchangeableValue')}</span>
                       </div>
                       <div className="flex items-center gap-3">
                          <div className="w-6 h-6 flex items-center justify-center bg-c5 border-2 border-main rounded-full shrink-0 text-inv shadow-[2px_2px_0_var(--color-main)]"><Mail size={14} strokeWidth={3}/></div>
                          <span>{t('ui.communityRecognitionOnly')}</span>
                       </div>
                    </div>
                 </div>


                 <div className="bg-card flex flex-col flex-1">
                    <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-xs border-b-4 border-main flex justify-between items-center">
                      <span>{t('ui.rewardTrackExamples')}</span>
                      <button onClick={() => onNavigate('rewards')} className="text-[10px] opacity-80 cursor-pointer hover:underline">{t('ui.viewRewards')}</button>
                    </div>
                    <div className="flex flex-col font-bold text-xs bg-page">
                       {[
                         { rank: 1, name: t('ui.topPredictionLegend'), amount: 'Gold Tier', bg: 'bg-c1 text-main border-r-2 border-main' },
                         { rank: 2, name: t('ui.runnerUpReview'), amount: 'Silver Tier', bg: 'bg-c2 text-inv border-r-2 border-main' },
                         { rank: 3, name: t('ui.communityRecognition'), amount: t('ui.manual'), bg: 'bg-c3 text-main border-r-2 border-main' },
                         { rank: 4, name: t('ui.weeklySkillTrack'), amount: 'Top 10', bg: 'bg-c4 text-main border-r-2 border-main' },
                         { rank: 5, name: t('ui.eligibilityReview'), amount: t('ui.required'), bg: 'bg-c5 text-inv border-r-2 border-main' },
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
