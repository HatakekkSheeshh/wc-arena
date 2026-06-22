import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock3 } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import { useAuth } from '../lib/auth';
import { joinLeague, type LeagueRow } from '../services/leagues';
import { getErrorMessage } from '../services/serviceTypes';
import type { ThemeControls } from '../App';

type JoinLeagueProps = {
  themeControls: ThemeControls;
};

export default function JoinLeague({ themeControls }: JoinLeagueProps) {
  const { t } = useTranslation();
  const { inviteCode } = useParams();
  const { user, loading: authLoading } = useAuth();
  const [league, setLeague] = useState<LeagueRow | null>(null);
  const [status, setStatus] = useState<'loading' | 'joined' | 'pending' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !inviteCode) {
      setStatus('error');
      return;
    }

    let active = true;
    setStatus('loading');
    setError(null);

    joinLeague({ inviteCode })
      .then((result) => {
        if (!active) return;
        setLeague(result.league);
        setStatus(result.status);
      })
      .catch((nextError) => {
        if (!active) return;
        setError(getErrorMessage(nextError));
        setStatus('error');
      });

    return () => {
      active = false;
    };
  }, [authLoading, inviteCode, user]);

  return (
    <AppShell themeControls={themeControls}>
      <div className="relative z-10 flex flex-col p-3 sm:p-4 lg:p-6 gap-3 lg:gap-6 min-h-0">
        <div className="bg-card border-4 border-main p-3 sm:p-4 lg:p-6 flex flex-col w-full xl:w-1/2 shadow-[6px_6px_0_0_var(--color-shadow)] lg:shadow-[8px_8px_0_0_var(--color-shadow)]">
          <div className="flex items-center gap-3 mb-3">
            <Link to="/leagues" className="bg-card hover:bg-muted border-2 border-main p-2 shadow-[3px_3px_0_var(--color-shadow)]"><ArrowLeft size={18} /></Link>
            <span className="border-2 border-main bg-c1 px-3 py-1 font-black uppercase text-xs">{inviteCode}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-1 text-main leading-none">
            {t('ui.joinLeague')}
          </h1>
          <p className="font-bold text-sm text-subtle max-w-xl">{t('ui.joinLeagueBody')}</p>
        </div>

        <div className="bg-card border-4 border-main shadow-[6px_6px_0_0_var(--color-shadow)] lg:shadow-[8px_8px_0_0_var(--color-shadow)] rounded-sm overflow-hidden">
          {(authLoading || status === 'loading') && user && <div className="p-6 font-black uppercase text-sm">{t('ui.joiningLeague')}</div>}
          {!authLoading && !user && (
            <div className="p-4 sm:p-6 flex flex-col gap-4">
              <div className="bg-c1 border-4 border-main p-4 font-black uppercase text-sm">{t('ui.loginRequiredLeague')}</div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/login" className="bg-c2 text-inv border-2 border-main px-4 py-3 font-black uppercase text-center">{t('ui.login')}</Link>
                <Link to="/register" className="bg-card border-2 border-main px-4 py-3 font-black uppercase text-center">{t('ui.register')}</Link>
              </div>
            </div>
          )}
          {user && status === 'joined' && league && (
            <div className="p-4 sm:p-6 flex flex-col gap-4">
              <div className="bg-c3 border-4 border-main p-4 font-black uppercase text-sm flex items-center gap-3"><CheckCircle2 size={22} /> {t('ui.joinedLeagueSuccess')}</div>
              <Link to={`/leagues/${league.slug}`} className="bg-c2 text-inv border-2 border-main px-4 py-3 font-black uppercase text-center">{t('ui.viewLeague')}</Link>
            </div>
          )}
          {user && status === 'pending' && league && (
            <div className="p-4 sm:p-6 flex flex-col gap-4">
              <div className="bg-c1 border-4 border-main p-4 font-black uppercase text-sm flex items-center gap-3"><Clock3 size={22} /> {t('ui.joinRequestPending')}</div>
              <Link to="/leagues" className="bg-card border-2 border-main px-4 py-3 font-black uppercase text-center">{t('ui.backToLeagues')}</Link>
            </div>
          )}
          {user && status === 'error' && (
            <div className="p-4 sm:p-6 flex flex-col gap-4">
              <div className="bg-c5 border-4 border-main p-4 font-black uppercase text-sm">{error ?? t('ui.invalidInviteCode')}</div>
              <Link to="/leagues" className="bg-card border-2 border-main px-4 py-3 font-black uppercase text-center">{t('ui.backToLeagues')}</Link>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
