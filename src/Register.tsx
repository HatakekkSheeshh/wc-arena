import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, CheckSquare, DollarSign, Eye, EyeOff, Globe, Lock, Mail, Shield, Trophy, User } from 'lucide-react';
import LegacySettingsMenu from './components/LegacySettingsMenu';
import GoogleIcon from './components/ui/GoogleIcon';
import { supabase } from './lib/supabaseClient';
import { getAuthRedirectUrl } from './utils/authRedirect';
import type { ThemeControls } from './App';

type RegisterProps = ThemeControls & {
  onNavigate: (page: string) => void;
};

export default function Register({ onNavigate, ...themeControls }: RegisterProps) {
  const { t } = useTranslation();
  const [agree, setAgree] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formNotice, setFormNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [oauthSubmitting, setOauthSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function handleGoogleRegister() {
    setFormError(null);
    setFormNotice(null);
    setOauthSubmitting(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getAuthRedirectUrl('/login'),
      },
    });

    if (error) {
      setOauthSubmitting(false);
      setFormError(error.message);
    }
  }

  const handleRegister = async () => {
    setFormError(null);
    setFormNotice(null);

    if (!agree) {
      setFormError(t('ui.acceptTerms'));
      return;
    }

    if (password !== confirmPassword) {
      setFormError(t('ui.passwordsMismatch'));
      return;
    }

    setSubmitting(true);
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim();

    if (normalizedUsername) {
      const { data: existingProfile, error: usernameError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', normalizedUsername)
        .maybeSingle();

      if (usernameError) {
        setSubmitting(false);
        setFormError(usernameError.message);
        return;
      }

      if (existingProfile) {
        setSubmitting(false);
        setFormError(t('ui.usernameTaken'));
        return;
      }
    }

    const emailRedirectTo = getAuthRedirectUrl('/login');
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: { username: normalizedUsername },
        emailRedirectTo,
      },
    });

    if (error || !data.user) {
      setSubmitting(false);
      const message = error?.message ?? t('ui.accountCreateError');
      if (message.toLowerCase().includes('redirect')) {
        setFormError(t('ui.redirectNotAllowed'));
      } else if (message.toLowerCase().includes('email')) {
        setFormError(t('ui.confirmationEmailError'));
      } else {
        setFormError(message);
      }
      return;
    }

    if (!data.session) {
      setSubmitting(false);
      setFormNotice(t('ui.accountCreatedConfirmEmail'));
      return;
    }

    setSubmitting(false);
    onNavigate('onboarding');
  };

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
            <button type="button" onClick={() => onNavigate('login')} className="hidden sm:flex bg-card text-main border-2 border-main px-4 py-2 font-black uppercase text-xs shadow-[3px_3px_0_var(--color-shadow)] hover:bg-muted">
              {t('auth.signIn')}
            </button>
            <LegacySettingsMenu {...themeControls} />
          </div>
        </header>

        <main className="flex-1 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_520px] gap-5 lg:gap-10 items-start xl:items-center w-full max-w-7xl mx-auto py-5 lg:py-12">
          <section className="order-2 xl:order-1 bg-card border-4 border-main p-5 lg:p-10 shadow-[8px_8px_0_var(--color-shadow)] max-w-3xl">
            <div className="text-c2 font-black uppercase tracking-widest text-sm mb-3">{t('auth.heroEyebrow')}</div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.88] text-main">
              {t('auth.registerTitleLine1')}<br />{t('auth.registerTitleLine2')}
            </h1>
            <p className="font-bold text-sm lg:text-lg text-subtle mt-4 lg:mt-6 max-w-xl leading-snug">{t('auth.registerBody')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 border-2 border-main mt-5 lg:mt-8 uppercase text-xs font-black overflow-hidden">
              <div className="p-4 bg-c1 text-main sm:border-r-2 border-main flex items-center gap-3"><DollarSign size={20} /> {t('auth.features.freeTitle')}</div>
              <div className="p-4 bg-c2 text-inv sm:border-r-2 border-main flex items-center gap-3"><Globe size={20} /> {t('auth.features.globalTitle')}</div>
              <div className="p-4 bg-c4 text-main flex items-center gap-3"><Shield size={20} /> {t('auth.features.secureTitle')}</div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5 lg:mt-6">
              {[t('auth.steps.createAccount'), t('auth.steps.pickMatches'), t('auth.steps.earnPoints'), t('auth.steps.winPrizes')].map((step, index) => (
                <div key={step} className="bg-card border-2 border-main p-3 shadow-[3px_3px_0_var(--color-shadow)] flex items-center gap-3">
                  <div className="w-8 h-8 bg-c3 border-2 border-main flex items-center justify-center font-black shrink-0">{index + 1}</div>
                  <div className="font-black uppercase text-[10px] leading-tight">{step}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="order-1 xl:order-2 bg-card border-4 border-main shadow-[8px_8px_0_var(--color-shadow)] overflow-hidden">
            <div className="grid grid-cols-2 border-b-4 border-main text-xs sm:text-sm font-black uppercase">
              <button type="button" onClick={() => onNavigate('login')} className="bg-card text-main p-3 sm:p-4 hover:bg-muted">{t('auth.signIn')}</button>
              <div className="bg-c2 text-inv p-3 sm:p-4 text-center">{t('auth.createAccount')}</div>
            </div>
            <div className="p-4 sm:p-5 lg:p-6 bg-card flex flex-col gap-3.5 sm:gap-4">
              <button type="button" onClick={handleGoogleRegister} disabled={oauthSubmitting || submitting} className="group relative w-full overflow-hidden bg-gradient-to-r from-c1 via-card to-c3 text-main font-black uppercase py-4 border-4 border-main shadow-[6px_6px_0_0_var(--color-shadow)] hover:-translate-y-0.5 hover:shadow-[8px_8px_0_0_var(--color-shadow)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all text-sm disabled:opacity-60 flex items-center justify-center gap-3">
                <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#4285F4] via-[#34A853] via-[#FBBC05] to-[#EA4335]" />
                <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-main bg-white shadow-[2px_2px_0_var(--color-shadow)] group-hover:rotate-[-6deg] transition-transform">
                  <GoogleIcon />
                </span>
                <span className="flex flex-col items-start leading-none">
                  <span className="text-[10px] tracking-[0.22em] text-subtle">{t('ui.fastSignup')}</span>
                  <span className="text-base">{oauthSubmitting ? t('ui.connecting') : t('auth.continueWithGoogle')}</span>
                </span>
              </button>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-[10px] font-black uppercase text-subtle">
                <div className="border-t-2 border-main" />
                <span>{t('ui.emailFallback')}</span>
                <div className="border-t-2 border-main" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-black uppercase text-xs">{t('auth.username')}</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-main opacity-80 pointer-events-none" />
                  <input type="text" value={username} onChange={(event) => setUsername(event.target.value)} placeholder={t('auth.chooseUsername')} className="w-full border-2 border-main p-3 pl-10 font-bold text-sm bg-card shadow-[2px_2px_0_0_var(--color-shadow)] focus:shadow-[4px_4px_0_0_var(--color-shadow)] focus:ring-2 focus:ring-c2 transition-all outline-none" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-black uppercase text-xs">{t('auth.email')}</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-main opacity-80 pointer-events-none" />
                  <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={t('auth.enterEmail')} className="w-full border-2 border-main p-3 pl-10 font-bold text-sm bg-card shadow-[2px_2px_0_0_var(--color-shadow)] focus:shadow-[4px_4px_0_0_var(--color-shadow)] focus:ring-2 focus:ring-c2 transition-all outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-black uppercase text-xs">{t('auth.password')}</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-main opacity-80 pointer-events-none" />
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={t('auth.createPassword')} className="w-full border-2 border-main p-3 pl-10 pr-12 font-bold text-sm bg-card shadow-[2px_2px_0_0_var(--color-shadow)] focus:shadow-[4px_4px_0_0_var(--color-shadow)] focus:ring-2 focus:ring-c2 transition-all outline-none" />
                    <button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? t('ui.hidePassword') : t('ui.showPassword')} className="absolute right-2 top-1/2 z-10 -translate-y-1/2 border-2 border-transparent p-1 text-main opacity-80 hover:opacity-100 focus:border-main focus:bg-muted focus:outline-none">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-black uppercase text-xs">{t('auth.confirmPassword')}</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-main opacity-80 pointer-events-none" />
                    <input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder={t('auth.confirmPasswordPlaceholder')} className="w-full border-2 border-main p-3 pl-10 pr-12 font-bold text-sm bg-card shadow-[2px_2px_0_0_var(--color-shadow)] focus:shadow-[4px_4px_0_0_var(--color-shadow)] focus:ring-2 focus:ring-c2 transition-all outline-none" />
                    <button type="button" onClick={() => setShowConfirmPassword((current) => !current)} aria-label={showConfirmPassword ? t('ui.hidePassword') : t('ui.showPassword')} className="absolute right-2 top-1/2 z-10 -translate-y-1/2 border-2 border-transparent p-1 text-main opacity-80 hover:opacity-100 focus:border-main focus:bg-muted focus:outline-none">
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
              <label className="group flex items-center cursor-pointer gap-2 relative">
                <input type="checkbox" checked={agree} onChange={(event) => setAgree(event.target.checked)} className="peer sr-only" />
                <div className="w-4 h-4 bg-card border-2 border-main flex items-center justify-center shrink-0 text-inv peer-checked:bg-c2 transition-colors">
                  {agree && <CheckSquare size={12} />}
                </div>
                <span className="font-bold text-xs select-none">{t('auth.agreePrefix')} <span className="text-c2 hover:underline cursor-pointer">{t('auth.rules')}</span> and <span className="text-c2 hover:underline cursor-pointer">{t('auth.prizeTerms')}</span>{t('auth.agreeSuffix')}</span>
              </label>
              {formError && <div className="border-2 border-main bg-c5 text-main p-3 font-black uppercase text-xs">{formError}</div>}
              {formNotice && <div className="border-2 border-main bg-c1 text-main p-3 font-black uppercase text-xs">{formNotice}</div>}
              <button type="button" onClick={handleRegister} disabled={submitting} className="w-full bg-c2 hover:opacity-90 text-inv font-black uppercase py-4 border-2 border-main shadow-[4px_4px_0_0_var(--color-shadow)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all text-lg disabled:opacity-60 flex items-center justify-center gap-3">
                {submitting ? t('ui.creatingAccount') : t('auth.createAccount')} <Trophy size={20} strokeWidth={3} />
              </button>
              <button type="button" onClick={() => onNavigate('login')} className="w-full bg-card hover:bg-muted text-main font-black uppercase py-3 border-2 border-main shadow-[4px_4px_0_0_var(--color-shadow)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all text-sm flex items-center justify-center gap-3">
                {t('auth.signIn')} <ArrowRight size={18} strokeWidth={3} />
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
