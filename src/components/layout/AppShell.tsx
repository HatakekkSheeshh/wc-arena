import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink } from 'react-router-dom';
import { ChevronDown, Settings, Wallet } from 'lucide-react';
import type { ThemeControls } from '../../App';
import { appNavigationGroups, mobileNavigation } from '../../config/navigation';

type AppShellProps = {
  children: React.ReactNode;
  themeControls: ThemeControls;
  fullHeight?: boolean;
};

function HeaderNavigation() {
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const { t } = useTranslation();

  return (
    <nav className="hidden lg:flex items-center gap-2 ml-6">
      {appNavigationGroups.map((group) => (
        <div key={group.labelKey} className="relative">
          <button
            type="button"
            onClick={() => setOpenGroup(openGroup === group.labelKey ? null : group.labelKey)}
            className={`border-2 border-main px-4 py-2 font-black uppercase text-xs flex items-center gap-2 shadow-[3px_3px_0_var(--color-shadow)] transition-all ${openGroup === group.labelKey ? 'bg-c2 text-inv translate-x-[2px] translate-y-[2px] shadow-none' : 'bg-page hover:bg-muted text-main'}`}
          >
            {t(group.labelKey)}
            <ChevronDown size={15} strokeWidth={3} />
          </button>
          {openGroup === group.labelKey && (
            <div className="absolute left-0 top-12 w-64 bg-card border-4 border-main p-3 shadow-[8px_8px_0_var(--color-shadow)] z-50 flex flex-col gap-2">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpenGroup(null)}
                    className={({ isActive }) => `border-2 border-main px-3 py-2 font-black uppercase text-xs flex items-center gap-3 transition-all ${isActive ? 'bg-c2 text-inv' : 'bg-page hover:bg-muted text-main'}`}
                  >
                    {Icon && <Icon size={17} strokeWidth={2.5} />}
                    <span>{t(item.labelKey)}</span>
                  </NavLink>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}

function ThemeSettings({ themeControls }: { themeControls: ThemeControls }) {
  const [showSettings, setShowSettings] = useState(false);
  const { t, i18n } = useTranslation();
  const { isVintage, setIsVintage, isDark, setIsDark, isRounded, setIsRounded, hasShadow, setHasShadow, hasFrame, setHasFrame } = themeControls;

  return (
    <div className="relative">
      <button type="button" onClick={() => setShowSettings(!showSettings)} className="w-10 md:w-11 h-10 md:h-11 border-2 border-main flex items-center justify-center hover:bg-muted transition-colors bg-card shadow-[2px_2px_0_0_var(--color-shadow)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none">
        <Settings size={20} className="text-main" />
      </button>
      {showSettings && (
        <div className="absolute right-0 top-14 bg-card border-4 border-main p-4 w-56 shadow-[4px_4px_0_0_var(--color-shadow)] z-50 flex flex-col gap-2">
          <div className="font-bold uppercase text-xs text-main">{t('settings.title')}</div>
          <label className="flex items-center justify-between cursor-pointer border-t-2 border-main pt-2"><span className="text-sm font-bold text-main">{t('settings.vintage')}</span><input type="checkbox" checked={isVintage} onChange={(event) => setIsVintage(event.target.checked)} className="w-4 h-4 border-2 border-main accent-main cursor-pointer" /></label>
          <label className="flex items-center justify-between cursor-pointer border-t-2 border-main pt-2"><span className="text-sm font-bold text-main">{t('settings.dark')}</span><input type="checkbox" checked={isDark} onChange={(event) => setIsDark(event.target.checked)} className="w-4 h-4 border-2 border-main accent-main cursor-pointer" /></label>
          <label className="flex items-center justify-between cursor-pointer border-t-2 border-main pt-2"><span className="text-sm font-bold text-main">{t('settings.rounded')}</span><input type="checkbox" checked={isRounded} onChange={(event) => setIsRounded(event.target.checked)} className="w-4 h-4 border-2 border-main accent-main cursor-pointer" /></label>
          <label className="flex items-center justify-between cursor-pointer border-t-2 border-main pt-2"><span className="text-sm font-bold text-main">{t('settings.shadows')}</span><input type="checkbox" checked={hasShadow} onChange={(event) => setHasShadow(event.target.checked)} className="w-4 h-4 border-2 border-main accent-main cursor-pointer" /></label>
          <label className="flex items-center justify-between cursor-pointer border-t-2 border-main pt-2"><span className="text-sm font-bold text-main">{t('settings.macFrame')}</span><input type="checkbox" checked={hasFrame} onChange={(event) => setHasFrame(event.target.checked)} className="w-4 h-4 border-2 border-main accent-main cursor-pointer" /></label>
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

export default function AppShell({ children, themeControls, fullHeight = false }: AppShellProps) {
  const { t } = useTranslation();

  return (
    <div className={`${fullHeight ? 'h-[100dvh]' : 'min-h-screen'} bg-page flex font-sans relative overflow-hidden`}>
      <div className="absolute inset-x-0 top-[84px] h-[calc(100vh-116px)] z-0 pointer-events-none opacity-90 overflow-hidden flex justify-center">
        <img src="https://s6.imgcdn.dev/Ybh5S0.webp" alt="" aria-hidden="true" className="w-full h-full object-cover object-top" />
      </div>
      <div className="flex-1 min-w-0 flex flex-col pb-20 lg:pb-0 h-screen overflow-y-auto relative z-10">
        <header className="flex items-center justify-between border-b-4 border-main px-4 md:px-6 py-4 bg-card z-30 sticky top-0 shrink-0 gap-4">
          <div className="flex items-center min-w-0">
            <Link to="/" className="text-xl md:text-3xl font-black uppercase tracking-tighter whitespace-nowrap hover:text-c2 transition-colors">PREDICT 2026</Link>
            <HeaderNavigation />
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <ThemeSettings themeControls={themeControls} />
            <Link to="/profile" className="bg-c2 hover:opacity-80 transition-opacity text-inv font-black py-2 px-4 border-2 border-main flex items-center gap-3 transform active:scale-95 shadow-[4px_4px_0_0_var(--color-shadow)]">
              <Wallet size={18} strokeWidth={2.5} />
              <div className="flex-col items-start leading-[1.1] hidden sm:flex">
                <span className="text-[10px] uppercase font-bold opacity-80">{t('common.account')}</span>
                <span className="text-sm">{t('common.profile')}</span>
              </div>
              <ChevronDown size={18} className="ml-1 hidden sm:block" />
            </Link>
          </div>
        </header>
        {children}
        <nav className="lg:hidden fixed left-3 right-3 bottom-3 z-50 border-4 border-main bg-card shadow-[6px_6px_0_var(--color-shadow)] grid grid-cols-4 overflow-hidden">
          {mobileNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `py-2 px-1 border-r-2 border-main last:border-r-0 flex flex-col items-center justify-center gap-1 font-black uppercase text-[10px] ${isActive ? 'bg-c2 text-inv' : 'bg-card text-main'}`}>
                {Icon && <Icon size={18} strokeWidth={2.5} />}
                <span>{t(item.shortLabelKey ?? item.labelKey)}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
