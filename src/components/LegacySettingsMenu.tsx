import { Settings } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ThemeControls } from '../App';

type LegacySettingsMenuProps = ThemeControls;

export default function LegacySettingsMenu({ isVintage, setIsVintage, isDark, setIsDark, isRounded, setIsRounded, hasShadow, setHasShadow, hasFrame, setHasFrame }: LegacySettingsMenuProps) {
  const [showSettings, setShowSettings] = useState(false);
  const { t, i18n } = useTranslation();

  return (
    <div className="relative">
      <button onClick={() => setShowSettings(!showSettings)} className="w-10 md:w-11 h-10 md:h-11 border-2 border-main flex items-center justify-center hover:bg-muted transition-colors bg-card shadow-[2px_2px_0_0_var(--color-shadow)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none">
        <Settings size={20} className="text-main" />
      </button>
      {showSettings && (
        <div className="absolute right-0 top-14 bg-card border-4 border-main p-4 w-56 shadow-[4px_4px_0_0_var(--color-shadow)] z-50 flex flex-col gap-2">
          <div className="font-bold uppercase text-xs text-main">{t('settings.title')}</div>
          <label className="flex items-center justify-between cursor-pointer border-t-2 border-main pt-2"><span className="text-sm font-bold text-main">{t('settings.vintage')}</span><input type="checkbox" checked={isVintage} onChange={(e) => setIsVintage(e.target.checked)} className="w-4 h-4 border-2 border-main accent-main cursor-pointer" /></label>
          <label className="flex items-center justify-between cursor-pointer border-t-2 border-main pt-2"><span className="text-sm font-bold text-main">{t('settings.dark')}</span><input type="checkbox" checked={isDark} onChange={(e) => setIsDark(e.target.checked)} className="w-4 h-4 border-2 border-main accent-main cursor-pointer" /></label>
          <label className="flex items-center justify-between cursor-pointer border-t-2 border-main pt-2"><span className="text-sm font-bold text-main">{t('settings.rounded')}</span><input type="checkbox" checked={isRounded} onChange={(e) => setIsRounded(e.target.checked)} className="w-4 h-4 border-2 border-main accent-main cursor-pointer" /></label>
          <label className="flex items-center justify-between cursor-pointer border-t-2 border-main pt-2"><span className="text-sm font-bold text-main">{t('settings.shadows')}</span><input type="checkbox" checked={hasShadow} onChange={(e) => setHasShadow(e.target.checked)} className="w-4 h-4 border-2 border-main accent-main cursor-pointer" /></label>
          <label className="flex items-center justify-between cursor-pointer border-t-2 border-main pt-2"><span className="text-sm font-bold text-main">{t('settings.macFrame')}</span><input type="checkbox" checked={hasFrame} onChange={(e) => setHasFrame(e.target.checked)} className="w-4 h-4 border-2 border-main accent-main cursor-pointer" /></label>
          <label className="flex flex-col gap-2 border-t-2 border-main pt-2">
            <span className="text-sm font-bold text-main">{t('language.label')}</span>
            <select value={i18n.resolvedLanguage ?? 'en'} onChange={(event) => void i18n.changeLanguage(event.target.value)} className="border-2 border-main bg-card px-2 py-1 text-sm font-black uppercase text-main shadow-[2px_2px_0_0_var(--color-shadow)] outline-none">
              <option value="en">{t('language.english')}</option>
              <option value="vi">{t('language.vietnamese')}</option>
            </select>
          </label>
        </div>
      )}
    </div>
  );
}
