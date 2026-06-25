import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Users, Crosshair, Clock, CheckCircle2, TrendingUp, Lock, Target, Gauge, ShieldPlus, PlusCircle } from 'lucide-react';
import AppShell from './components/layout/AppShell';
import { listGlobalLeaderboard } from './services/leaderboard';

export default function Rules({ onNavigate, isVintage, setIsVintage, isDark, setIsDark, isRounded, setIsRounded, hasShadow, setHasShadow, hasFrame, setHasFrame }: { onNavigate: (page: string) => void, isVintage: boolean, setIsVintage: (v: boolean) => void, isDark: boolean, setIsDark: (v: boolean) => void, isRounded: boolean, setIsRounded: (v: boolean) => void, hasShadow: boolean, setHasShadow: (v: boolean) => void, hasFrame: boolean, setHasFrame: (v: boolean) => void }) {
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

          {/* Top Info Banner */}
          <div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col w-full xl:w-1/2 shadow-[8px_8px_0_0_var(--color-shadow)]">
             <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-1 text-main">
                {t('nav.public.rules')}
             </h1>
          </div>

          {/* Main White Wrapper for Content */}
          <div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col gap-4 lg:gap-6 shadow-[8px_8px_0_0_var(--color-shadow)] rounded-sm">
          {/* Top KPI row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 border-b-4 border-main">
            <div className="flex items-center gap-4 border-b-4 sm:border-r-4 xl:border-b-0 border-main p-4 lg:p-5 bg-c1 text-main">
              <div className="shrink-0"><Trophy size={36} strokeWidth={2.5}/></div>
              <div className="flex flex-col justify-center">
                <div className="text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">{t('nav.public.pointsGuide')}</div>
                <div className="text-2xl sm:text-3xl font-black leading-none">PTS</div>
                <div className="text-[10px] font-bold uppercase mt-1">{t('ui.totalGuaranteed')}</div>
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
              <div className="shrink-0"><Crosshair size={36} strokeWidth={2.5}/></div>
              <div className="flex flex-col justify-center">
                <div className="text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">{t('ui.scoringSystem')}</div>
                <div className="text-2xl sm:text-3xl font-black leading-none">{t('ui.pointsBased')}</div>
                <div className="text-[10px] font-bold uppercase mt-1">{t('ui.multipleBonusTypes')}</div>
              </div>
            </div>

            <div className="flex items-center gap-4 border-main p-4 lg:p-5 bg-c4 text-main">
              <div className="shrink-0"><Clock size={36} strokeWidth={2.5}/></div>
              <div className="flex flex-col justify-center">
                <div className="text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">{t('ui.deadlineBeforeKickoff')}</div>
                <div className="text-2xl sm:text-3xl font-black leading-none">{t('ui.picksLock')}</div>
                <div className="text-[10px] font-bold uppercase mt-1">{t('ui.atKickoff')}</div>
              </div>
            </div>
          </div>

          {/* 2-Column Main content Split */}
          <div className="flex flex-col xl:flex-row flex-1 items-stretch">

             {/* Left Column (Main details) */}
             <div className="flex-1 border-r-0 xl:border-r-4 border-main flex flex-col bg-muted min-w-0">

                {/* 3-Column Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3">

                   {/* HOW SCORING WORKS */}
                   <div className="bg-card flex flex-col lg:col-span-1 h-full border-b-4 lg:border-r-4 border-main">
                      <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-xs border-b-4 border-main min-h-[48px] flex items-center">{t('ui.howScoringWorks')}</div>
                      <div className="flex flex-col">

                         <div className="flex p-3 border-b-2 border-line gap-3 items-center">
                            <div className="w-12 h-12 bg-c3 rounded-sm border-2 border-main flex items-center justify-center shrink-0 shadow-[2px_2px_0_0_var(--color-shadow)] text-main"><Target size={24} /></div>
                            <div className="flex flex-col flex-1">
                               <span className="font-black text-sm uppercase">{t('ui.exactScore')}</span>
                               <span className="text-[11px] font-bold text-subtle leading-snug">{t('ui.exactScoreRuleBody')}</span>
                            </div>
                            <div className="font-black text-2xl text-c3 pl-1 shrink-0 drop-shadow-[1px_1px_0_var(--color-main)]">5 {t('ui.pointsShort')}</div>
                         </div>

                         <div className="flex p-3 border-b-2 border-line gap-3 items-center">
                            <div className="w-12 h-12 bg-c2 rounded-sm border-2 border-main flex items-center justify-center shrink-0 shadow-[2px_2px_0_0_var(--color-shadow)] text-inv"><CheckCircle2 size={24} /></div>
                            <div className="flex flex-col flex-1">
                               <span className="font-black text-sm uppercase">{t('ui.correctOutcome')}</span>
                               <span className="text-[11px] font-bold text-subtle leading-snug">{t('ui.correctOutcomeRuleBody')}</span>
                            </div>
                            <div className="font-black text-2xl text-c2 pl-1 shrink-0 drop-shadow-[1px_1px_0_var(--color-main)] text-stroke">2 {t('ui.pointsShort')}</div>
                         </div>

                         <div className="flex p-3 border-b-2 border-line gap-3 items-center">
                            <div className="w-12 h-12 bg-c1 rounded-sm border-2 border-main flex items-center justify-center shrink-0 shadow-[2px_2px_0_0_var(--color-shadow)] text-main"><PlusCircle size={24} /></div>
                            <div className="flex flex-col flex-1">
                               <span className="font-black text-sm uppercase">{t('ui.goalDifferenceBonus')}</span>
                               <span className="text-[11px] font-bold text-subtle leading-snug">{t('ui.goalDifferenceBonusRuleBody')}</span>
                            </div>
                            <div className="font-black text-2xl text-c1 pl-1 shrink-0 drop-shadow-[1px_1px_0_var(--color-main)]">+1</div>
                         </div>

                         <div className="flex p-3 border-b-2 border-line gap-3 items-center">
                            <div className="w-12 h-12 bg-muted rounded-sm border-2 border-main flex items-center justify-center shrink-0 shadow-[2px_2px_0_0_var(--color-shadow)] text-main"><PlusCircle size={24} /></div>
                            <div className="flex flex-col flex-1">
                               <span className="font-black text-sm uppercase">{t('ui.teamScoreBonus')}</span>
                               <span className="text-[11px] font-bold text-subtle leading-snug">{t('ui.teamScoreBonusRuleBody')}</span>
                            </div>
                            <div className="font-black text-2xl text-main pl-1 shrink-0 drop-shadow-[1px_1px_0_var(--color-shadow)]">+1</div>
                         </div>

                         <div className="flex p-3 border-b-2 border-line gap-3 items-center">
                            <div className="w-12 h-12 bg-c4 rounded-sm border-2 border-main flex items-center justify-center shrink-0 shadow-[2px_2px_0_0_var(--color-shadow)] text-main"><TrendingUp size={24} /></div>
                            <div className="flex flex-col flex-1">
                               <span className="font-black text-sm uppercase">{t('ui.streakBonus')}</span>
                               <span className="text-[11px] font-bold text-subtle leading-snug">{t('ui.streakBonusRuleBody')}</span>
                            </div>
                            <div className="font-black text-2xl text-c4 pl-1 shrink-0 drop-shadow-[1px_1px_0_var(--color-main)]">{t('ui.streakBonusRuleValue')}</div>
                         </div>

                         <div className="flex p-3 border-b-2 border-line gap-3 items-center">
                            <div className="w-12 h-12 bg-[#B14EFF] rounded-sm border-2 border-main flex items-center justify-center shrink-0 shadow-[2px_2px_0_0_var(--color-shadow)] text-inv"><Gauge size={24} /></div>
                            <div className="flex flex-col flex-1">
                               <span className="font-black text-sm uppercase">{t('ui.riskMultiplier')}</span>
                               <span className="text-[11px] font-bold text-subtle leading-snug">{t('ui.riskMultiplierRuleBody')}</span>
                            </div>
                            <div className="font-black text-2xl text-[#B14EFF] pl-1 shrink-0 drop-shadow-[1px_1px_0_var(--color-main)]">{t('ui.riskMultiplierRuleValue')}</div>
                         </div>

                         <div className="flex p-3 border-b-2 border-line gap-3 items-center">
                            <div className="w-12 h-12 bg-c5 rounded-sm border-2 border-main flex items-center justify-center shrink-0 shadow-[2px_2px_0_0_var(--color-shadow)] text-inv"><ShieldPlus size={24} /></div>
                            <div className="flex flex-col flex-1">
                               <span className="font-black text-sm uppercase">{t('ui.underdogBonus')}</span>
                               <span className="text-[11px] font-bold text-subtle leading-snug">{t('ui.underdogBonusRuleBody')}</span>
                            </div>
                            <div className="font-black text-2xl text-c5 pl-1 shrink-0 drop-shadow-[1px_1px_0_var(--color-main)]">{t('ui.underdogBonusRuleValue')}</div>
                         </div>

                         <div className="flex p-3 gap-3 items-center bg-muted">
                            <div className="w-12 h-12 bg-main rounded-sm border-2 border-main flex items-center justify-center shrink-0 shadow-[2px_2px_0_0_var(--color-shadow)] text-inv"><Lock size={24} /></div>
                            <div className="flex flex-col flex-1">
                               <span className="font-black text-sm uppercase">{t('ui.noPointsAfterDeadline')}</span>
                               <span className="text-[11px] font-bold text-subtle leading-snug">{t('ui.noPointsAfterDeadlineBody')}</span>
                            </div>
                            <div className="font-black text-2xl text-main pl-1 shrink-0 drop-shadow-[1px_1px_0_var(--color-shadow)]">0 {t('ui.pointsShort')}</div>
                         </div>

                      </div>
                   </div>

                   {/* HOW TO PLAY */}
                   <div className="bg-card flex flex-col lg:col-span-1 h-full border-b-4 lg:border-r-4 border-main">
                      <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-xs border-b-4 border-main min-h-[48px] flex items-center">{t('ui.howToPlay')}</div>
                      <div className="flex flex-col flex-1">

                         <div className="flex border-b-2 border-line flex-1">
                            <div className="w-12 bg-c2 text-inv font-black flex items-center justify-center text-3xl border-r-2 border-main shrink-0">1</div>
                            <div className="flex flex-col justify-center p-3">
                               <span className="font-black text-[13px] uppercase tracking-wide">{t('ui.chooseMatch')}</span>
                               <span className="text-[11px] font-bold text-subtle mt-0.5 leading-snug">{t('ui.chooseMatchBody')}</span>
                            </div>
                         </div>

                         <div className="flex border-b-2 border-line flex-1">
                            <div className="w-12 bg-c2 text-inv font-black flex items-center justify-center text-3xl border-r-2 border-main shrink-0">2</div>
                            <div className="flex flex-col justify-center p-3">
                               <span className="font-black text-[13px] uppercase tracking-wide">{t('ui.enterYourScore')}</span>
                               <span className="text-[11px] font-bold text-subtle mt-0.5 leading-snug">{t('ui.enterYourScoreBody')}</span>
                            </div>
                         </div>

                         <div className="flex border-b-2 border-line flex-1">
                            <div className="w-12 bg-c2 text-inv font-black flex items-center justify-center text-3xl border-r-2 border-main shrink-0">3</div>
                            <div className="flex flex-col justify-center p-3">
                               <span className="font-black text-[13px] uppercase tracking-wide">{t('ui.saveYourPicks')}</span>
                               <span className="text-[11px] font-bold text-subtle mt-0.5 leading-snug">{t('ui.saveYourPicksBody')}</span>
                            </div>
                         </div>

                         <div className="flex border-b-2 border-line flex-1">
                            <div className="w-12 bg-c2 text-inv font-black flex items-center justify-center text-3xl border-r-2 border-main shrink-0">4</div>
                            <div className="flex flex-col justify-center p-3">
                               <span className="font-black text-[13px] uppercase tracking-wide">{t('ui.picksLockAtKickoff')}</span>
                               <span className="text-[11px] font-bold text-subtle mt-0.5 leading-snug">{t('ui.picksLockAtKickoffBody')}</span>
                            </div>
                         </div>

                         <div className="flex flex-1">
                            <div className="w-12 bg-c2 text-inv font-black flex items-center justify-center text-3xl border-r-2 border-main shrink-0">5</div>
                            <div className="flex flex-col justify-center p-3">
                               <span className="font-black text-[13px] uppercase tracking-wide">{t('ui.earnPoints')}</span>
                               <span className="text-[11px] font-bold text-subtle mt-0.5 leading-snug">{t('ui.earnPointsBody')}</span>
                            </div>
                         </div>

                      </div>
                   </div>

                   {/* PRIZE DISTRIBUTION */}
                   <div className="bg-card flex flex-col lg:col-span-1 h-full border-b-4 border-main">
                      <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-xs border-b-4 border-main min-h-[48px] flex items-center">{t('ui.prizeDistribution')}</div>
                      <div className="flex flex-col flex-1">

                         <div className="flex border-b-2 border-line items-stretch">
                            <div className="rank-chip-right w-10 bg-c1 text-main font-black flex flex-col justify-center items-center border-r-2 border-main shrink-0 py-3 text-xl rounded-r-sm rounded-l-none">1</div>
                            <div className="font-black px-3 py-3 flex-1 flex items-center text-sm uppercase">{t('ui.firstPlace')}</div>
                            <div className="font-black px-3 py-3 text-right flex items-center text-lg shrink-0">Gold Tier</div>
                         </div>

                         <div className="flex border-b-2 border-line items-stretch">
                            <div className="rank-chip-right w-10 bg-muted text-main font-black flex flex-col justify-center items-center border-r-2 border-main shrink-0 py-3 text-xl rounded-r-sm rounded-l-none">2</div>
                            <div className="font-black px-3 py-3 flex-1 flex items-center text-sm uppercase">{t('ui.secondPlace')}</div>
                            <div className="font-black px-3 py-3 text-right flex items-center text-lg shrink-0">Silver Tier</div>
                         </div>

                         <div className="flex border-b-2 border-line items-stretch">
                            <div className="rank-chip-right w-10 bg-c4 text-main font-black flex flex-col justify-center items-center border-r-2 border-main shrink-0 py-3 text-xl rounded-r-sm rounded-l-none">3</div>
                            <div className="font-black px-3 py-3 flex-1 flex items-center text-sm uppercase">{t('ui.thirdPlace')}</div>
                            <div className="font-black px-3 py-3 text-right flex items-center text-lg shrink-0">Bronze Tier</div>
                         </div>

                         <div className="flex border-b-2 border-line items-stretch">
                            <div className="font-bold px-4 py-4 flex-1 flex items-center text-sm uppercase border-r-2 border-line">{t('ui.fourthToTenth')}</div>
                            <div className="font-black px-4 py-4 text-right flex items-center justify-end text-lg shrink-0 w-[100px]">Top 10</div>
                         </div>

                         <div className="flex border-b-2 border-line items-stretch">
                            <div className="font-bold px-4 py-4 flex-1 flex items-center text-sm uppercase border-r-2 border-line">{t('ui.eleventhToHundredth')}</div>
                            <div className="font-black px-4 py-4 text-right flex items-center justify-end text-lg shrink-0 w-[100px]">Top 100</div>
                         </div>

                         <div className="flex items-stretch flex-1 min-h-[60px]">
                            <div className="font-bold px-4 py-3 flex-1 flex flex-col justify-center text-sm uppercase border-r-2 border-line">{t('ui.otherParticipants')}</div>
                            <div className="font-black px-4 py-3 text-right flex flex-col justify-center items-end text-sm shrink-0 w-[130px] leading-tight">{t('ui.entryToLadderPrizes')}</div>
                         </div>

                      </div>
                   </div>

                </div>

                {/* 2-Column Grid (Bottom) */}
                <div className="grid grid-cols-1 lg:grid-cols-3">

                   {/* TIEBREAKERS */}
                   <div className="bg-card flex flex-col border-b-4 lg:border-r-4 border-main lg:col-span-1">
                      <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-xs border-b-4 border-main min-h-[48px] flex items-center">{t('ui.tiebreakers')}</div>
                      <div className="p-4 flex flex-col">
                         <div className="flex items-center gap-3 mb-3">
                           <div className="w-5 h-5 bg-c3 text-main font-black flex items-center justify-center text-[10px] rounded-sm border border-main shrink-0 shadow-[2px_2px_0_var(--color-main)]">1</div>
                           <span className="font-bold text-sm">{t('ui.moreExactScores')}</span>
                         </div>
                         <div className="flex items-center gap-3 mb-3">
                           <div className="w-5 h-5 bg-c3 text-main font-black flex items-center justify-center text-[10px] rounded-sm border border-main shrink-0 shadow-[2px_2px_0_var(--color-main)]">2</div>
                           <span className="font-bold text-sm">{t('ui.higherAccuracy')}</span>
                         </div>
                         <div className="flex items-center gap-3 mb-3">
                           <div className="w-5 h-5 bg-c3 text-main font-black flex items-center justify-center text-[10px] rounded-sm border border-main shrink-0 shadow-[2px_2px_0_var(--color-main)]">3</div>
                           <span className="font-bold text-sm leading-snug">{t('ui.longerStreak')}</span>
                         </div>
                         <div className="flex items-center gap-3">
                           <div className="w-5 h-5 bg-c3 text-main font-black flex items-center justify-center text-[10px] rounded-sm border border-main shrink-0 shadow-[2px_2px_0_var(--color-main)]">4</div>
                           <span className="font-bold text-sm">{t('ui.earliestSubmission')}</span>
                         </div>
                      </div>
                   </div>

                   <div className="bg-card flex flex-col border-b-4 border-main lg:col-span-2">
                      <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-xs border-b-4 border-main min-h-[48px] flex items-center">{t('rules.importantRules')}</div>
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
             <div className="w-full xl:w-[350px] bg-card flex flex-col flex-shrink-0 self-stretch">

                {/* QUICK SUMMARY */}
                <div className="bg-card flex flex-col border-b-4 border-main">
                   <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-xs border-b-4 border-main min-h-[48px] flex items-center">
                     {t('ui.quickSummary')}
                   </div>
                   <div className="p-4 flex flex-col gap-3 font-bold text-[13px]">
                      <div className="flex items-center gap-3">
                         <div className="w-6 h-6 flex items-center justify-center bg-c1 border-2 border-main shadow-[2px_2px_0_var(--color-main)] shrink-0 rounded-sm text-main"><Target size={14} strokeWidth={3}/></div>
                         <span>{t('ui.exactScore')} = <span className="font-black">5 {t('ui.pointsShort')}</span></span>
                      </div>
                      <div className="flex items-center gap-3">
                         <div className="w-6 h-6 flex items-center justify-center bg-c2 border-2 border-main shadow-[2px_2px_0_var(--color-main)] shrink-0 rounded-sm text-inv"><CheckCircle2 size={14} strokeWidth={3}/></div>
                         <span>{t('ui.correctOutcome')} = <span className="font-black">2 {t('ui.pointsShort')}</span></span>
                      </div>
                      <div className="flex items-center gap-3">
                         <div className="w-6 h-6 flex items-center justify-center bg-c1 border-2 border-main shadow-[2px_2px_0_var(--color-main)] shrink-0 rounded-sm text-main"><PlusCircle size={14} strokeWidth={3}/></div>
                         <span>{t('ui.goalDifferenceBonus')} = <span className="font-black">+1</span></span>
                      </div>
                      <div className="flex items-center gap-3">
                         <div className="w-6 h-6 flex items-center justify-center bg-muted border-2 border-main shadow-[2px_2px_0_var(--color-main)] shrink-0 rounded-sm text-main"><PlusCircle size={14} strokeWidth={3}/></div>
                         <span>{t('ui.teamScoreBonus')} = <span className="font-black">+1</span></span>
                      </div>
                      <div className="flex items-center gap-3">
                         <div className="w-6 h-6 flex items-center justify-center bg-c4 border-2 border-main shadow-[2px_2px_0_var(--color-main)] shrink-0 rounded-sm text-main"><TrendingUp size={14} strokeWidth={3}/></div>
                         <span>{t('ui.streakBonus')} = <span className="font-black">{t('ui.streakBonusRuleValue')}</span></span>
                      </div>
                      <div className="flex items-center gap-3">
                         <div className="w-6 h-6 flex items-center justify-center bg-[#B14EFF] border-2 border-main shadow-[2px_2px_0_var(--color-main)] shrink-0 rounded-sm text-inv"><Gauge size={14} strokeWidth={3}/></div>
                         <span>{t('ui.riskMultiplier')} = <span className="font-black">{t('ui.riskMultiplierRuleValue')}</span></span>
                      </div>
                      <div className="flex items-center gap-3">
                         <div className="w-6 h-6 flex items-center justify-center bg-c5 border-2 border-main shadow-[2px_2px_0_var(--color-main)] shrink-0 rounded-sm text-inv"><ShieldPlus size={14} strokeWidth={3}/></div>
                         <span>{t('ui.underdogBonus')} = <span className="font-black">{t('ui.underdogBonusRuleValue')}</span></span>
                      </div>
                      <div className="flex items-center gap-3">
                         <div className="w-6 h-6 flex items-center justify-center bg-c5 border-2 border-main shadow-[2px_2px_0_var(--color-main)] shrink-0 rounded-sm text-inv"><Lock size={14} strokeWidth={3}/></div>
                         <span>{t('ui.picksLockAtKickoff')}</span>
                      </div>
                   </div>
                </div>

                {/* SCORING EXAMPLE */}
                <div className="bg-card flex flex-col flex-1">
                   <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-xs border-b-4 border-main min-h-[48px] flex items-center">
                     {t('ui.scoringExample')}
                   </div>
                   <div className="flex flex-col text-sm font-bold">
                      <div className="flex justify-center items-center py-3 border-b-2 border-main gap-2 bg-muted font-black text-base">
                         <span className="text-xl">🇧🇷</span> <span>BRA vs ESP</span> <span className="text-xl">🇪🇸</span>
                      </div>
                      <div className="flex justify-between items-center py-2 px-4 border-b border-line border-dashed">
                         <span className="text-subtle uppercase text-xs">{t('ui.yourPick')}</span>
                         <span className="font-black">2 - 1</span>
                      </div>
                      <div className="flex justify-between items-center py-2 px-4 border-b-2 border-main">
                         <span className="text-subtle uppercase text-xs">{t('ui.actualResult')}</span>
                         <span className="font-black">2 - 1</span>
                      </div>
                      <div className="flex flex-col p-4 bg-page gap-2">
                         <span className="text-[10px] font-black uppercase text-subtle mb-1 tracking-wider">{t('ui.scoreBreakdown')}</span>
                         <div className="flex justify-between items-center text-xs">
                           <span className="flex items-center gap-2"><CheckCircle2 size={12} className="text-c3" strokeWidth={3}/> {t('ui.exactScore')}</span>
                           <span className="font-black">+5 {t('ui.pointsShort')}</span>
                         </div>
                         <div className="flex justify-between items-center text-xs">
                           <span className="flex items-center gap-2 text-c4"><TrendingUp size={12} strokeWidth={3}/> {t('ui.twoMatchStreak')}</span>
                           <span className="font-black">+1 {t('ui.pointsShort')}</span>
                         </div>
                         <div className="flex justify-between items-center text-xs">
                           <span className="flex items-center gap-2"><ShieldPlus size={12} className="text-c5" strokeWidth={3}/> {t('ui.underdogBonus')}</span>
                           <span className="font-black">+0–+3 {t('ui.pointsShort')}</span>
                         </div>
                      </div>
                      <div className="flex justify-between items-center py-3 px-4 border-t-2 border-main text-main text-sm uppercase font-black bg-card">
                         <span>{t('ui.totalPointsEarned')}</span>
                         <span className="text-lg text-c3 drop-shadow-[1px_1px_0_var(--color-main)]">6+ {t('ui.pointsShort')}</span>
                      </div>
                   </div>
                </div>



             </div>
          </div>
          </div>

        </div>
    </AppShell>
  );
}
