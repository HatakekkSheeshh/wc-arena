import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ChevronDown, Settings, Wallet } from 'lucide-react';
import type { ThemeControls } from '../../App';

type AppShellProps = {
  children: React.ReactNode;
  themeControls: ThemeControls;
  fullHeight?: boolean;
};

const navItems = [
  { label: 'Matches', to: '/matches' },
  { label: 'My Picks', to: '/picks' },
  { label: 'My Predictions', to: '/my-predictions' },
  { label: 'Leaderboard', to: '/leaderboard' },
  { label: 'Profile', to: '/profile' },
  { label: 'Badges', to: '/badges' },
  { label: 'Leagues', to: '/leagues' },
  { label: 'Activity', to: '/activity' },
  { label: 'Rewards', to: '/rewards' },
];

export default function AppShell({ children, themeControls, fullHeight = false }: AppShellProps) {
  const [showSettings, setShowSettings] = useState(false);
  const { isVintage, setIsVintage, isDark, setIsDark, isRounded, setIsRounded, hasShadow, setHasShadow } = themeControls;

  return (
    <div className={`${fullHeight ? 'h-[100dvh]' : 'min-h-screen'} bg-page p-3 sm:p-4 lg:p-6 flex flex-col font-sans relative`}>
      <div className={`w-full max-w-[1600px] border-4 border-main rounded-lg shadow-[8px_8px_0px_var(--color-shadow)] sm:shadow-[16px_16px_0px_var(--color-shadow)] overflow-hidden flex flex-col mx-auto transition-all relative bg-card ${fullHeight ? 'flex-1 min-h-0' : ''}`}>
        <div className="w-full h-8 border-b-4 border-main bg-main flex items-center px-4 gap-2 relative z-30 shrink-0">
          <div className="w-3 h-3 rounded-full bg-c5" />
          <div className="w-3 h-3 rounded-full bg-c1" />
          <div className="w-3 h-3 rounded-full bg-c3" />
        </div>
        <nav className="flex items-center justify-between border-b-4 border-main px-6 py-4 bg-card z-30 relative shrink-0">
          <Link to="/" className="text-xl md:text-3xl font-black uppercase tracking-tighter">PREDICT 2026</Link>
          <div className="hidden xl:flex space-x-8 font-bold uppercase text-sm tracking-wide">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => isActive ? 'text-c2 border-b-4 border-c2 pb-1' : 'hover:text-c2 transition-colors pb-1'}>
                {item.label}
              </NavLink>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button type="button" onClick={() => setShowSettings(!showSettings)} className="w-10 md:w-11 h-10 md:h-11 border-2 border-main flex items-center justify-center hover:bg-muted transition-colors bg-card shadow-[2px_2px_0_0_var(--color-shadow)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none">
                <Settings size={20} className="text-main" />
              </button>
              {showSettings && (
                <div className="absolute right-0 top-14 bg-card border-4 border-main p-4 w-52 shadow-[4px_4px_0_0_var(--color-shadow)] z-50 flex flex-col gap-2">
                  <div className="font-bold uppercase text-xs text-main">Settings</div>
                  <label className="flex items-center justify-between cursor-pointer border-t-2 border-main pt-2"><span className="text-sm font-bold text-main">Vintage Mode</span><input type="checkbox" checked={isVintage} onChange={(event) => setIsVintage(event.target.checked)} className="w-4 h-4 border-2 border-main accent-main cursor-pointer" /></label>
                  <label className="flex items-center justify-between cursor-pointer border-t-2 border-main pt-2"><span className="text-sm font-bold text-main">Dark Mode</span><input type="checkbox" checked={isDark} onChange={(event) => setIsDark(event.target.checked)} className="w-4 h-4 border-2 border-main accent-main cursor-pointer" /></label>
                  <label className="flex items-center justify-between cursor-pointer border-t-2 border-main pt-2"><span className="text-sm font-bold text-main">Rounded Corners</span><input type="checkbox" checked={isRounded} onChange={(event) => setIsRounded(event.target.checked)} className="w-4 h-4 border-2 border-main accent-main cursor-pointer" /></label>
                  <label className="flex items-center justify-between cursor-pointer border-t-2 border-main pt-2"><span className="text-sm font-bold text-main">Shadows</span><input type="checkbox" checked={hasShadow} onChange={(event) => setHasShadow(event.target.checked)} className="w-4 h-4 border-2 border-main accent-main cursor-pointer" /></label>
                </div>
              )}
            </div>
            <Link to="/profile" className="bg-c2 hover:opacity-80 transition-opacity text-inv font-black py-2 px-4 border-2 border-main flex items-center gap-3 transform active:scale-95 shadow-[4px_4px_0_0_var(--color-shadow)]">
              <Wallet size={18} strokeWidth={2.5} />
              <div className="flex-col items-start leading-[1.1] hidden sm:flex">
                <span className="text-[10px] uppercase font-bold opacity-80">Account</span>
                <span className="text-sm">Profile</span>
              </div>
              <ChevronDown size={18} className="ml-1 hidden sm:block" />
            </Link>
          </div>
        </nav>
        {children}
      </div>
    </div>
  );
}
