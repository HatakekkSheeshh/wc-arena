import { FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, LockKeyhole, Users } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import { useAuth } from '../lib/auth';
import { createLeague } from '../services/leagues';
import { getErrorMessage } from '../services/serviceTypes';
import type { ThemeControls } from '../App';

type LeagueCreateProps = {
  themeControls: ThemeControls;
};

export default function LeagueCreate({ themeControls }: LeagueCreateProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('private');
  const [joinPolicy, setJoinPolicy] = useState<'auto' | 'approval'>('auto');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const { league } = await createLeague({ name, description, visibility, joinPolicy });
      navigate(`/leagues/${league.slug}`);
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell themeControls={themeControls}>
      <div className="relative z-10 flex flex-col p-3 sm:p-4 lg:p-6 gap-3 lg:gap-6 min-h-0">
        <div className="bg-card border-4 border-main p-3 sm:p-4 lg:p-6 flex flex-col w-full xl:w-1/2 shadow-[6px_6px_0_0_var(--color-shadow)] lg:shadow-[8px_8px_0_0_var(--color-shadow)]">
          <div className="flex items-center gap-3 mb-3">
            <Link to="/leagues" className="bg-card hover:bg-muted border-2 border-main p-2 shadow-[3px_3px_0_var(--color-shadow)]"><ArrowLeft size={18} /></Link>
            <span className="border-2 border-main bg-c3 px-3 py-1 font-black uppercase text-xs">{t('ui.noCashPrize')}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-1 text-main leading-none">
            {t('ui.createLeague')}
          </h1>
          <p className="font-bold text-sm text-subtle max-w-xl">{t('ui.createLeagueBody')}</p>
        </div>

        <div className="bg-card border-4 border-main shadow-[6px_6px_0_0_var(--color-shadow)] lg:shadow-[8px_8px_0_0_var(--color-shadow)] rounded-sm overflow-hidden">
          {authLoading && <div className="p-6 font-black uppercase text-sm">{t('ui.loadingPage')}</div>}
          {!authLoading && !user && (
            <div className="p-4 sm:p-6 flex flex-col gap-4">
              <div className="bg-c1 border-4 border-main p-4 font-black uppercase text-sm">{t('ui.loginRequiredLeague')}</div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/login" className="bg-c2 text-inv border-2 border-main px-4 py-3 font-black uppercase text-center">{t('ui.login')}</Link>
                <Link to="/register" className="bg-card border-2 border-main px-4 py-3 font-black uppercase text-center">{t('ui.register')}</Link>
              </div>
            </div>
          )}
          {!authLoading && user && (
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 flex flex-col gap-4">
              {error && <div className="bg-c5 border-2 border-main p-3 font-black uppercase text-xs">{error}</div>}

              <label className="flex flex-col gap-2 font-black uppercase text-xs">
                {t('ui.leagueName')}
                <input value={name} onChange={(event) => setName(event.target.value)} minLength={3} maxLength={64} required className="bg-page border-2 border-main p-3 font-bold text-base normal-case outline-none" placeholder={t('ui.leagueNamePlaceholder')} />
              </label>

              <label className="flex flex-col gap-2 font-black uppercase text-xs">
                {t('ui.description')}
                <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={180} rows={3} className="bg-page border-2 border-main p-3 font-bold text-base normal-case outline-none resize-none" placeholder={t('ui.leagueDescriptionPlaceholder')} />
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button type="button" onClick={() => setVisibility('private')} className={`border-4 border-main p-4 text-left font-black uppercase ${visibility === 'private' ? 'bg-c2 text-inv' : 'bg-card'}`}>
                  <LockKeyhole size={24} />
                  <div className="mt-2">{t('ui.privateLabel')}</div>
                  <p className="text-xs font-bold normal-case mt-1 opacity-80">{t('ui.privateLeagueBody')}</p>
                </button>
                <button type="button" onClick={() => setVisibility('public')} className={`border-4 border-main p-4 text-left font-black uppercase ${visibility === 'public' ? 'bg-c1 text-main' : 'bg-card'}`}>
                  <Users size={24} />
                  <div className="mt-2">{t('ui.publicLabel')}</div>
                  <p className="text-xs font-bold normal-case mt-1 opacity-80">{t('ui.publicLeagueBody')}</p>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button type="button" onClick={() => setJoinPolicy('auto')} className={`border-2 border-main p-3 text-left font-black uppercase ${joinPolicy === 'auto' ? 'bg-c3' : 'bg-card'}`}>
                  {t('ui.autoJoin')}
                  <p className="text-xs font-bold normal-case mt-1 text-subtle">{t('ui.autoJoinBody')}</p>
                </button>
                <button type="button" onClick={() => setJoinPolicy('approval')} className={`border-2 border-main p-3 text-left font-black uppercase ${joinPolicy === 'approval' ? 'bg-c3' : 'bg-card'}`}>
                  {t('ui.approvalRequired')}
                  <p className="text-xs font-bold normal-case mt-1 text-subtle">{t('ui.approvalRequiredBody')}</p>
                </button>
              </div>

              <button disabled={submitting} className="bg-c2 text-inv border-4 border-main px-5 py-4 font-black uppercase text-sm shadow-[4px_4px_0_var(--color-shadow)] disabled:opacity-60">
                {submitting ? t('ui.creatingLeague') : t('ui.createLeague')}
              </button>
            </form>
          )}
        </div>
      </div>
    </AppShell>
  );
}
