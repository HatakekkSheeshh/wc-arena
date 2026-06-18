import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, CheckCircle2, Eye, EyeOff, Lock, Mail, ShieldCheck, Trophy } from 'lucide-react';
import LegacySettingsMenu from './components/LegacySettingsMenu';
import { supabase } from './lib/supabaseClient';
import type { ThemeControls } from './App';

type LoginProps = ThemeControls & {
  onNavigate: (page: string) => void;
};

export default function Login({ onNavigate, ...themeControls }: LoginProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin() {
    setFormError(null);
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    setSubmitting(false);

    if (error) {
      setFormError(error.message);
      return;
    }

    onNavigate('matches');
  }

  return (
    <div className="min-h-screen bg-page font-sans relative overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-90 overflow-hidden flex justify-center">
        <img src="https://s6.imgcdn.dev/Ybh5S0.webp" alt="" aria-hidden="true" className="w-full h-full object-cover object-top" />
      </div>
      <div className="absolute inset-0 z-0 bg-page/15 pointer-events-none" />

      <div className="relative z-10 min-h-screen flex flex-col p-4 lg:p-6">
        <header className="flex items-center justify-between bg-card border-4 border-main px-4 md:px-6 py-4 shadow-[8px_8px_0_var(--color-shadow)]">
          <button type="button" onClick={() => onNavigate('landing')} className="text-xl md:text-3xl font-black uppercase tracking-tighter text-main hover:text-c2 transition-colors">
            {t('common.product')}
          </button>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => onNavigate('register')} className="hidden sm:flex bg-c2 text-inv border-2 border-main px-4 py-2 font-black uppercase text-xs shadow-[3px_3px_0_var(--color-shadow)]">
              {t('auth.createAccount')}
            </button>
            <LegacySettingsMenu {...themeControls} />
          </div>
        </header>

        <main className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_460px] gap-6 lg:gap-10 items-center w-full max-w-6xl mx-auto py-8 lg:py-12">
          <section className="bg-card border-4 border-main p-6 lg:p-10 shadow-[8px_8px_0_var(--color-shadow)] max-w-2xl">
            <div className="text-c2 font-black uppercase tracking-widest text-sm mb-3">{t('auth.heroEyebrow')}</div>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.88] text-main">
              {t('auth.loginTitleLine1')}<br />{t('auth.loginTitleLine2')}
            </h1>
            <p className="font-bold text-base lg:text-lg text-subtle mt-6 max-w-xl leading-snug">{t('auth.loginBody')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 border-2 border-main mt-8 uppercase text-xs font-black overflow-hidden">
              <div className="p-3 bg-c1 text-main sm:border-r-2 border-main flex items-center gap-2"><Trophy size={16} /> {t('auth.features.predictTitle')}</div>
              <div className="p-3 bg-c2 text-inv sm:border-r-2 border-main flex items-center gap-2"><CheckCircle2 size={16} /> {t('auth.features.pointsTitle')}</div>
              <div className="p-3 bg-c3 text-main flex items-center gap-2"><ShieldCheck size={16} /> {t('auth.features.freeTitle')}</div>
            </div>
          </section>

          <section className="bg-card border-4 border-main shadow-[8px_8px_0_var(--color-shadow)] overflow-hidden">
            <div className="grid grid-cols-2 border-b-4 border-main text-sm font-black uppercase">
              <div className="bg-c2 text-inv p-4 text-center">{t('auth.signIn')}</div>
              <button type="button" onClick={() => onNavigate('register')} className="bg-card text-main p-4 hover:bg-muted">{t('auth.createAccount')}</button>
            </div>
            <div className="p-5 lg:p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-black uppercase text-xs">{t('auth.emailUsername')}</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-main opacity-80 pointer-events-none" />
                  <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={t('auth.enterEmailUsername')} className="w-full border-2 border-main p-3 pl-10 font-bold text-sm bg-card shadow-[2px_2px_0_0_var(--color-shadow)] focus:shadow-[4px_4px_0_0_var(--color-shadow)] focus:ring-2 focus:ring-c2 transition-all outline-none" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-black uppercase text-xs">{t('auth.password')}</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-main opacity-80 pointer-events-none" />
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={t('auth.enterPassword')} className="w-full border-2 border-main p-3 pl-10 pr-12 font-bold text-sm bg-card shadow-[2px_2px_0_0_var(--color-shadow)] focus:shadow-[4px_4px_0_0_var(--color-shadow)] focus:ring-2 focus:ring-c2 transition-all outline-none" />
                  <button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-2 top-1/2 z-10 -translate-y-1/2 border-2 border-transparent p-1 text-main opacity-80 hover:opacity-100 focus:border-main focus:bg-muted focus:outline-none">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between mt-1 mb-2">
                <span className="font-bold text-xs text-subtle">{t('auth.rememberMe')}</span>
                <span className="font-bold text-xs text-c2 cursor-pointer hover:underline">{t('auth.forgotPassword')}</span>
              </div>
              {formError && <div className="border-2 border-main bg-c5 text-main p-3 font-black uppercase text-xs">{formError}</div>}
              <button type="button" onClick={handleLogin} disabled={submitting} className="w-full bg-c2 hover:opacity-90 text-inv font-black uppercase py-4 border-2 border-main shadow-[4px_4px_0_0_var(--color-shadow)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all text-lg disabled:opacity-60">
                {submitting ? 'Signing in...' : t('auth.signIn')}
              </button>
              <button type="button" onClick={() => onNavigate('register')} className="w-full bg-card hover:bg-muted text-main font-black uppercase py-3 border-2 border-main shadow-[4px_4px_0_0_var(--color-shadow)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all text-sm flex items-center justify-center gap-3">
                {t('auth.createAccountLink')} <ArrowRight size={18} strokeWidth={3} />
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
