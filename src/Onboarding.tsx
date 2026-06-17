import { User, Star, ChevronDown, Upload, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type OnboardingProps = {
  onNavigate: (page: string) => void;
};

export default function Onboarding({ onNavigate }: OnboardingProps) {
  const { t } = useTranslation();

  const handleFinish = () => {
    onNavigate('picks');
  };

  return (
    <div className="h-[100dvh] bg-page p-3 sm:p-4 lg:p-6 flex flex-col font-sans relative">
      <div className="w-full max-w-[1600px] border-4 border-main rounded-lg shadow-[8px_8px_0px_var(--color-shadow)] sm:shadow-[16px_16px_0px_var(--color-shadow)] overflow-hidden flex flex-col mx-auto transition-all relative bg-card flex-1 min-h-0">
        <div className="w-full h-8 border-b-4 border-main bg-main flex items-center px-4 gap-2 relative z-30 shrink-0">
          <div className="w-3 h-3 rounded-full bg-c5"></div>
          <div className="w-3 h-3 rounded-full bg-c1"></div>
          <div className="w-3 h-3 rounded-full bg-c3"></div>
        </div>

        <nav className="flex items-center justify-between border-b-4 border-main px-6 py-4 bg-card z-30 relative shrink-0">
          <div className="text-xl md:text-3xl font-black uppercase tracking-tighter cursor-pointer" onClick={() => onNavigate('landing')}>{t('common.product')}</div>
          <div className="flex items-center gap-3"></div>
        </nav>

        <div className="absolute inset-0 z-0 top-[84px] pointer-events-none opacity-50 overflow-hidden flex justify-center">
          <img src="https://s6.imgcdn.dev/Ybh5S0.webp" alt="Background" className="w-full h-full object-cover object-center lg:object-top" />
        </div>

        <div className="relative z-10 flex flex-col p-4 lg:p-8 justify-center items-center flex-1 overflow-y-auto">
          <div className="bg-card w-full max-w-2xl border-4 border-main p-6 lg:p-10 shadow-[8px_8px_0_0_var(--color-shadow)] flex flex-col items-center">
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4 text-center">{t('onboarding.title')}</h1>
            <p className="font-bold text-center text-subtle mb-8 max-w-md">{t('onboarding.body')}</p>

            <div className="w-full flex flex-col gap-6">
              <div className="flex flex-col items-center gap-3">
                <div className="w-24 h-24 rounded-full border-4 border-main bg-muted flex items-center justify-center overflow-hidden relative group cursor-pointer shadow-[2px_2px_0_var(--color-main)]">
                  <User size={40} className="text-main opacity-50" />
                  <div className="absolute inset-0 bg-main/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Upload size={20} className="text-inv mb-1" />
                    <span className="text-inv font-black text-[10px] uppercase">{t('onboarding.upload')}</span>
                  </div>
                </div>
                <span className="font-bold text-xs uppercase tracking-wide">{t('onboarding.avatar')}</span>
              </div>

              <div className="flex flex-col gap-1.5 w-full">
                <label className="font-black uppercase text-xs">{t('onboarding.displayName')}</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-main opacity-80" />
                  <input type="text" placeholder={t('onboarding.displayNamePlaceholder')} defaultValue="GoalGuru_99" className="w-full border-2 border-main p-3 pl-10 font-bold text-sm bg-card shadow-[2px_2px_0_0_var(--color-shadow)] focus:shadow-none focus:translate-y-[2px] focus:translate-x-[2px] transition-all outline-none" />
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
            </div>

            <div className="w-full mt-10">
              <button onClick={handleFinish} className="w-full bg-c3 hover:opacity-90 text-main font-black uppercase py-4 border-2 border-main shadow-[4px_4px_0_0_var(--color-shadow)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all text-xl flex items-center justify-center gap-3">
                {t('onboarding.startPredicting')} <ChevronRight strokeWidth={3} />
              </button>
              <div className="text-center mt-4">
                <span className="text-xs font-bold text-subtle cursor-pointer hover:text-main hover:underline" onClick={handleFinish}>{t('onboarding.skipForNow')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
