import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle2, ClipboardCheck, Gift, ShieldCheck, Star, Trophy, Users } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import { listCurrentUserRewardEligibilityChecks, listCurrentUserRewardReviews, listRewardTrustNotes, type RewardEligibilityCheckRow, type RewardReviewRow, type RewardTrustNoteRow } from '../services/rewards';
import { getErrorMessage } from '../services/serviceTypes';
import type { ThemeControls } from '../App';
import type { EligibilityStatus, RewardStatus } from '../types/domain';

type RewardsProps = {
  themeControls: ThemeControls;
};

const statusStyles: Record<RewardStatus, string> = {
  pending: 'bg-c4 text-main',
  approved: 'bg-c3 text-main',
  recognized: 'bg-c2 text-inv',
  ineligible: 'bg-muted text-main',
};

const eligibilityStyles: Record<EligibilityStatus, string> = {
  passed: 'bg-c3 text-main',
  review: 'bg-c4 text-main',
  blocked: 'bg-c5 text-inv',
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function getEligibilityIcon(status: EligibilityStatus) {
  if (status === 'passed') return <CheckCircle2 size={18} strokeWidth={3} />;
  if (status === 'review') return <AlertTriangle size={18} strokeWidth={3} />;
  return <ShieldCheck size={18} strokeWidth={3} />;
}

function getRewardStatus(status: string): RewardStatus {
  if (status === 'paid' || status === 'recognized') return 'recognized';
  if (status === 'approved' || status === 'ineligible') return status;
  return 'pending';
}

function getRewardStatusLabel(status: RewardStatus) {
  if (status === 'recognized') return 'recognized';
  if (status === 'approved') return 'approved';
  if (status === 'ineligible') return 'not listed';
  return 'pending';
}

function getRewardSourceLabel(source: string) {
  if (source === 'manual') return 'fair-play';
  return 'community';
}

export default function Rewards({ themeControls }: RewardsProps) {
  const { t } = useTranslation();
  const [rewards, setRewards] = useState<RewardReviewRow[]>([]);
  const [eligibilityChecks, setEligibilityChecks] = useState<RewardEligibilityCheckRow[]>([]);
  const [trustNotes, setTrustNotes] = useState<RewardTrustNoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([listCurrentUserRewardReviews(), listCurrentUserRewardEligibilityChecks(), listRewardTrustNotes()])
      .then(([nextRewards, nextChecks, nextNotes]) => {
        if (!active) return;
        setRewards(nextRewards);
        setEligibilityChecks(nextChecks);
        setTrustNotes(nextNotes);
      })
      .catch((nextError) => {
        if (!active) return;
        setError(getErrorMessage(nextError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const approvedCount = rewards.filter((reward) => ['approved', 'paid', 'recognized'].includes(reward.status)).length;
  const pendingCount = rewards.filter((reward) => reward.status === 'pending').length;
  const recognitionPoints = rewards.reduce((sum, reward) => sum + reward.amount, 0);
  const passedChecks = eligibilityChecks.filter((check) => check.status === 'passed').length;

  return (
    <AppShell themeControls={themeControls}>
      <div className="relative z-10 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6 min-h-0">
        <div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col w-full xl:w-1/2 shadow-[8px_8px_0_0_var(--color-shadow)]">
          <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-1 text-main">
            {t('appPages.rewards.title')}
          </h1>
        </div>

        <div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col gap-4 lg:gap-6 shadow-[8px_8px_0_0_var(--color-shadow)] rounded-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 border-b-4 border-main">
            <div className="flex items-center gap-4 border-b-4 sm:border-r-4 xl:border-b-0 border-main p-4 lg:p-5 bg-c1 text-main">
              <div className="shrink-0"><ClipboardCheck size={36} strokeWidth={2.5} /></div>
              <div className="flex flex-col justify-center">
                <div className="text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">{t('appPages.rewards.eligibleChecks')}</div>
                <div className="text-2xl sm:text-3xl font-black leading-none">{passedChecks}/{eligibilityChecks.length}</div>
                <div className="text-[10px] font-bold uppercase mt-1">{t('appPages.rewards.manualReviewReady')}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 border-b-4 xl:border-b-0 xl:border-r-4 border-main p-4 lg:p-5 bg-c2 text-inv">
              <div className="shrink-0"><Gift size={36} strokeWidth={2.5} /></div>
              <div className="flex flex-col justify-center">
                <div className="text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">{t('appPages.rewards.rewardTracks')}</div>
                <div className="text-2xl sm:text-3xl font-black leading-none">{rewards.length}</div>
                <div className="text-[10px] font-bold uppercase mt-1">{t('appPages.rewards.communityGame')}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 border-b-4 sm:border-b-0 sm:border-r-4 border-main p-4 lg:p-5 bg-c3 text-main">
              <div className="shrink-0"><ShieldCheck size={36} strokeWidth={2.5} /></div>
              <div className="flex flex-col justify-center">
                <div className="text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">{t('appPages.rewards.pendingReview')}</div>
                <div className="text-2xl sm:text-3xl font-black leading-none">{pendingCount}</div>
                <div className="text-[10px] font-bold uppercase mt-1">{t('appPages.rewards.virtualPointsOnly')}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 border-main p-4 lg:p-5 bg-c4 text-main">
              <div className="shrink-0"><Trophy size={36} strokeWidth={2.5} /></div>
              <div className="flex flex-col justify-center">
                <div className="text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90">{t('appPages.rewards.approvedItems')}</div>
                <div className="text-2xl sm:text-3xl font-black leading-none">{approvedCount}</div>
                <div className="text-[10px] font-bold uppercase mt-1">{recognitionPoints.toLocaleString()} {t('ui.pointsShort')}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row flex-1">
            <div className="flex-1 border-r-0 xl:border-r-4 border-main flex flex-col bg-card min-w-0">
              <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm border-b-4 border-main">
                {t('appPages.rewards.eligibilityChecklist')}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 bg-card border-b-4 border-main">
                {eligibilityChecks.map((check, index) => {
                  const status = check.status as EligibilityStatus;
                  return (
                    <div key={check.id} className={`p-4 border-b-4 border-main flex gap-3 ${index % 2 === 0 ? 'md:border-r-4' : ''}`}>
                      <div className={`w-10 h-10 border-2 border-main flex items-center justify-center shrink-0 ${eligibilityStyles[status]}`}>
                        {getEligibilityIcon(status)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-black uppercase text-sm">{check.label}</div>
                        <div className="font-bold text-xs text-subtle mt-1 leading-snug">{check.description}</div>
                        {check.href && <Link to={check.href} className="inline-flex mt-3 text-[10px] font-black uppercase text-c2 hover:underline">{t('appPages.rewards.reviewDetails')}</Link>}
                      </div>
                    </div>
                  );
                })}
                {!loading && eligibilityChecks.length === 0 && <div className="p-4 font-black uppercase text-sm">{t('ui.noEligibilityChecks')}</div>}
              </div>

              <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm border-b-4 border-main">
                {t('appPages.rewards.rewardStatus')}
              </div>
              <div className="bg-card flex flex-col">
                {loading && <div className="p-6 font-black uppercase text-sm">{t('ui.loadingRewards')}</div>}
                {error && <div className="p-6 font-black uppercase text-sm bg-c5 text-main border-b-4 border-main">{error}</div>}
                {!loading && !error && rewards.length === 0 && <div className="p-6 font-black uppercase text-sm">{t('ui.noRewards')}</div>}
                {!loading && !error && rewards.map((reward) => {
                  const status = getRewardStatus(reward.status);
                  return (
                    <div key={reward.id} className="grid grid-cols-1 md:grid-cols-[1fr_150px_130px] border-b-4 border-main last:border-b-0 font-bold text-sm">
                      <div className="p-4 md:border-r-2 border-main">
                        <div className="font-black uppercase">{reward.title}</div>
                        <div className="text-xs text-subtle uppercase mt-1">{reward.period} • {reward.placement}</div>
                        <div className="text-xs font-bold mt-2 leading-snug">{reward.note}</div>
                      </div>
                      <div className="p-4 md:border-r-2 border-main flex md:items-center md:justify-center">
                        <span className={`border-2 border-main px-3 py-2 text-[10px] font-black uppercase ${statusStyles[status]}`}>{getRewardStatusLabel(status)}</span>
                      </div>
                      <div className="p-4 flex flex-col md:items-end justify-center bg-muted">
                        <span className="font-black text-lg">+{reward.amount.toLocaleString()} {t('ui.pointsShort')}</span>
                        <span className="text-[10px] uppercase text-subtle font-black">{getRewardSourceLabel(reward.source)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="w-full xl:w-[380px] bg-card flex flex-col">
              <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm border-b-4 border-main">
                {t('appPages.rewards.freeGameSafety')}
              </div>
              <div className="p-4 bg-card flex flex-col gap-3 font-bold text-sm border-b-4 border-main">
                <div className="bg-c1 text-main p-4 border-2 border-main">
                  <div className="font-black uppercase flex items-center gap-2"><ShieldCheck size={18} /> {t('appPages.rewards.noWalletBalance')}</div>
                  <p className="text-xs mt-2 leading-snug">{t('appPages.rewards.noWalletBody')}</p>
                </div>
                <Link to="/rules" className="bg-c2 text-inv border-2 border-main p-3 font-black uppercase text-xs flex items-center gap-2"><ClipboardCheck size={16} /> {t('appPages.rewards.publicRules')}</Link>
                <Link to="/points-guide" className="bg-c2 text-inv border-2 border-main p-3 font-black uppercase text-xs flex items-center gap-2"><Trophy size={16} /> {t('appPages.rewards.viewPointsGuide')}</Link>
                <Link to="/leaderboard" className="bg-card border-2 border-main p-3 font-black uppercase text-xs flex items-center gap-2"><Users size={16} /> {t('appPages.rewards.checkLeaderboardRank')}</Link>
                <Link to="/my-predictions" className="bg-card border-2 border-main p-3 font-black uppercase text-xs flex items-center gap-2"><Star size={16} /> {t('appPages.rewards.improvePredictions')}</Link>
              </div>

              <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm border-b-4 border-main">
                {t('appPages.rewards.trustNotes')}
              </div>
              <div className="bg-card flex flex-col border-b-4 border-main">
                {trustNotes.map((note) => (
                  <div key={note.id} className="p-4 border-b-2 border-line last:border-b-0">
                    <div className="font-black uppercase text-sm">{note.title}</div>
                    <div className="text-xs font-bold text-subtle mt-1 leading-snug">{note.description}</div>
                  </div>
                ))}
                {!loading && trustNotes.length === 0 && <div className="p-4 font-black uppercase text-xs">{t('ui.noTrustNotes')}</div>}
              </div>

              <div className="flex flex-col flex-1 bg-c1 text-main">
                <div className="bg-main text-inv font-black px-4 py-3 uppercase tracking-wide text-sm border-b-4 border-main">
                  {t('appPages.rewards.reviewTimeline')}
                </div>
                <div className="p-4 bg-card flex flex-col gap-3 text-xs font-bold flex-1">
                  {rewards.map((reward) => (
                    <div key={reward.id} className="flex justify-between gap-3 border-b-2 border-line last:border-b-0 pb-3 last:pb-0">
                      <span className="uppercase">{reward.title}</span>
                      <span className="text-subtle whitespace-nowrap">{formatDate(reward.updated_at)}</span>
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
