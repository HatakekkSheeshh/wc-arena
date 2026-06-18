import { ChevronDown, ChevronRight, ShieldCheck, Star, Trophy, Upload, User, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LegacySettingsMenu from './components/LegacySettingsMenu';
import type { ThemeControls } from './App';

type OnboardingProps = ThemeControls & {
  onNavigate: (page: string) => void;
};

export default function Onboarding({ onNavigate, ...themeControls }: OnboardingProps) {
  const { t } = useTranslation();

  const handleFinish = () => {
    onNavigate('picks');
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
            <button type="button" onClick={handleFinish} className="hidden sm:flex bg-card text-main border-2 border-main px-4 py-2 font-black uppercase text-xs shadow-[3px_3px_0_var(--color-shadow)] hover:bg-muted">
              {t('onboarding.skipForNow')}
            </button>
            <LegacySettingsMenu {...themeControls} />
          </div>
        </header>

        <main className="flex-1 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_440px] gap-6 lg:gap-10 items-center w-full max-w-7xl mx-auto py-8 lg:py-12">
          <section className="bg-card border-4 border-main p-6 lg:p-10 shadow-[8px_8px_0_var(--color-shadow)] max-w-3xl">
            <div className="text-c2 font-black uppercase tracking-widest text-sm mb-3">{t('auth.heroEyebrow')}</div>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.88] text-main">
              {t('onboarding.title')}
            </h1>
            <p className="font-bold text-base lg:text-lg text-subtle mt-6 max-w-xl leading-snug">{t('onboarding.body')}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 border-2 border-main mt-8 uppercase overflow-hidden">
              <div className="flex items-center min-h-[92px] border-b-2 md:border-b-0 md:border-r-2 border-main bg-c1 text-main">
                <div className="w-16 self-stretch border-r-2 border-main flex items-center justify-center"><User size={28} strokeWidth={2.5} /></div>
                <div className="p-3">
                  <div className="font-black text-xs">{t('onboarding.displayName')}</div>
                  <div className="font-bold text-[10px] mt-1 opacity-80">{t('onboarding.displayNamePlaceholder')}</div>
                </div>
              </div>
              <div className="flex items-center min-h-[92px] border-b-2 md:border-b-0 md:border-r-2 border-main bg-c2 text-inv">
                <div className="w-16 self-stretch border-r-2 border-main flex items-center justify-center"><Star size={28} strokeWidth={2.5} /></div>
                <div className="p-3">
                  <div className="font-black text-xs">{t('onboarding.favoriteTeam')}</div>
                  <div className="font-bold text-[10px] mt-1 opacity-80">{t('onboarding.selectTeam')}</div>
                </div>
              </div>
              <div className="flex items-center min-h-[92px] bg-c3 text-main">
                <div className="w-16 self-stretch border-r-2 border-main flex items-center justify-center"><Trophy size={28} strokeWidth={2.5} /></div>
                <div className="p-3">
                  <div className="font-black text-xs">{t('onboarding.startPredicting')}</div>
                  <div className="font-bold text-[10px] mt-1 opacity-80">{t('auth.steps.pickMatches')}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
              <div className="bg-card border-2 border-main p-4 shadow-[3px_3px_0_var(--color-shadow)]">
                <ShieldCheck size={24} strokeWidth={2.5} className="mb-3 text-main" />
                <div className="font-black uppercase text-xs">{t('auth.features.secureTitle')}</div>
              </div>
              <div className="bg-card border-2 border-main p-4 shadow-[3px_3px_0_var(--color-shadow)]">
                <Users size={24} strokeWidth={2.5} className="mb-3 text-main" />
                <div className="font-black uppercase text-xs">{t('auth.features.globalTitle')}</div>
              </div>
              <div className="bg-card border-2 border-main p-4 shadow-[3px_3px_0_var(--color-shadow)]">
                <Trophy size={24} strokeWidth={2.5} className="mb-3 text-main" />
                <div className="font-black uppercase text-xs">{t('auth.features.pointsTitle')}</div>
              </div>
            </div>
          </section>

          <section className="bg-card border-4 border-main shadow-[8px_8px_0_var(--color-shadow)] overflow-hidden">
            <div className="bg-main text-inv border-b-4 border-main p-4 font-black uppercase text-sm tracking-wide">
              {t('onboarding.title')}
            </div>
            <div className="p-5 lg:p-6 bg-card flex flex-col gap-5">
              <div className="flex flex-col items-center gap-3 border-2 border-main p-5 bg-muted">
                <div className="w-24 h-24 rounded-full border-4 border-main bg-card flex items-center justify-center overflow-hidden relative group cursor-pointer shadow-[2px_2px_0_var(--color-shadow)]">
                  <User size={40} className="text-main opacity-50" />
                  <div className="absolute inset-0 bg-main/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Upload size={20} className="text-inv mb-1" />
                    <span className="text-inv font-black text-[10px] uppercase">{t('onboarding.upload')}</span>
                  </div>
                </div>
                <span className="font-black text-xs uppercase tracking-wide">{t('onboarding.avatar')}</span>
              </div>
              <div className="flex flex-col gap-1.5 w-full">
                <label className="font-black uppercase text-xs">{t('onboarding.displayName')}</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-main opacity-80" />
                  <input type="text" placeholder={t('onboarding.displayNamePlaceholder')} className="w-full border-2 border-main p-3 pl-10 font-bold text-sm bg-card shadow-[2px_2px_0_0_var(--color-shadow)] focus:shadow-none focus:translate-y-[2px] focus:translate-x-[2px] transition-all outline-none" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5 w-full">
                <label className="font-black uppercase text-xs">{t('onboarding.favoriteTeam')}</label>
                <div className="relative">
                  <Star size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-main opacity-80" />
                  <select className="w-full border-2 border-main p-3 pl-10 pr-10 font-bold text-sm bg-card shadow-[2px_2px_0_0_var(--color-shadow)] focus:shadow-none focus:translate-y-[2px] focus:translate-x-[2px] transition-all outline-none appearance-none cursor-pointer">
                    <option value="">{t('onboarding.selectTeam')}</option>
                    <option value="br">Brazil</option>
                    <option value="fr">France</option>
                    <option value="ar">Argentina</option>
                    <option value="es">Spain</option>
                    <option value="us">United States</option>
                    <option value="other">{t('onboarding.other')}</option>
                  </select>
                  <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-main pointer-events-none" />
                </div>
              </div>
              <button type="button" onClick={handleFinish} className="w-full bg-c3 hover:opacity-90 text-main font-black uppercase py-4 border-2 border-main shadow-[4px_4px_0_0_var(--color-shadow)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all text-lg flex items-center justify-center gap-3">
                {t('onboarding.startPredicting')} <ChevronRight strokeWidth={3} />
              </button>
              <button type="button" onClick={handleFinish} className="text-xs font-black uppercase text-subtle hover:text-main hover:underline">
                {t('onboarding.skipForNow')}
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
