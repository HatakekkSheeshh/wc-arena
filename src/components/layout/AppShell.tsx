import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { CalendarCheck, ChevronDown, MoreHorizontal, Settings, Wallet, X } from 'lucide-react';
import type { ThemeControls } from '../../App';
import DailyLoginRewardPopup from '../DailyLoginRewardPopup';
import { appNavigationGroups } from '../../config/navigation';
import { useAuth } from '../../lib/auth';
import { claimDailyLoginReward, getTodayDailyLoginReward, type ClaimDailyLoginRewardResponse } from '../../services/dailyLoginReward';
import { getCurrentProfile, type ProfileRow } from '../../services/profile';
import PointsCoin from '../ui/PointsCoin';
import RankBadge from '../ui/RankBadge';
import StreakBadge from '../ui/StreakBadge';

type AppShellProps = {
  children: React.ReactNode;
  themeControls: ThemeControls;
  fullHeight?: boolean;
};

function HeaderNavigation() {
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (!openGroup) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!navRef.current?.contains(event.target as Node)) setOpenGroup(null);
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [openGroup]);

  return (
    <nav ref={navRef} className="hidden lg:flex items-center gap-2 ml-6">
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

function HeaderUserStats({ profile }: { profile: ProfileRow | null }) {
  if (!profile) return null;

  return (
    <Link to="/profile" className="hidden xl:grid grid-cols-[auto_auto_auto] items-center border-2 border-main bg-card shadow-[3px_3px_0_var(--color-shadow)] hover:bg-muted transition-colors divide-x-2 divide-main overflow-hidden">
      <div className="px-3 py-2 flex items-center gap-2">
        <RankBadge points={profile.points} size="sm" showPoints={false} className="text-[10px] text-main" />
      </div>
      <div className="px-3 py-2 flex items-center gap-2 font-black text-xs uppercase text-main">
        <StreakBadge streak={profile.current_streak} size="sm" showValue={false} />
        <span>{profile.current_streak}</span>
      </div>
      <div className="px-3 py-2 font-black text-xs uppercase text-main whitespace-nowrap flex items-center gap-2">
        <PointsCoin size="sm" />
        <span>{profile.points.toLocaleString()} PTS</span>
      </div>
    </Link>
  );
}

const mobilePrimaryPaths = ['/matches', '/picks', '/leaderboard'];

function ThemeSettings({ themeControls }: { themeControls: ThemeControls }) {
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement | null>(null);
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();
  const { isVintage, setIsVintage, isDark, setIsDark, isRounded, setIsRounded, hasShadow, setHasShadow, hasFrame, setHasFrame } = themeControls;

  useEffect(() => {
    if (!showSettings) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!settingsRef.current?.contains(event.target as Node)) setShowSettings(false);
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [showSettings]);

  return (
    <div ref={settingsRef} className="relative">
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
          {user && (
            <button type="button" onClick={() => void signOut()} className="border-t-2 border-main pt-2 text-left text-sm font-black uppercase text-c5 hover:underline">
              {t('common.signOut')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function AppShell({ children, themeControls, fullHeight = false }: AppShellProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const [dailyReward, setDailyReward] = useState<ClaimDailyLoginRewardResponse | null>(null);
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [showMobileMore, setShowMobileMore] = useState(false);
  const [dailyCheckInStatus, setDailyCheckInStatus] = useState<'idle' | 'claiming' | 'claimed'>('idle');
  const [dailyCheckInError, setDailyCheckInError] = useState<string | null>(null);
  const [showAlreadyClaimedMessage, setShowAlreadyClaimedMessage] = useState(false);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const mobileNavRef = useRef<HTMLElement | null>(null);
  const [mobileScrollSpacer, setMobileScrollSpacer] = useState(128);

  useEffect(() => {
    const nav = mobileNavRef.current;
    if (!nav) return;

    const updateSpacer = () => {
      const rect = nav.getBoundingClientRect();
      const bottomGap = Math.max(window.innerHeight - rect.bottom, 0);
      setMobileScrollSpacer(Math.ceil(rect.height + bottomGap + 96));
    };

    updateSpacer();
    const resizeObserver = new ResizeObserver(updateSpacer);
    resizeObserver.observe(nav);
    window.addEventListener('resize', updateSpacer);
    window.addEventListener('orientationchange', updateSpacer);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateSpacer);
      window.removeEventListener('orientationchange', updateSpacer);
    };
  }, []);

  useEffect(() => {
    const updateProfilePoints = (event: Event) => {
      const points = (event as CustomEvent<{ points?: unknown }>).detail?.points;
      if (typeof points !== 'number') return;
      setProfile((currentProfile) => currentProfile ? { ...currentProfile, points } : currentProfile);
    };

    window.addEventListener('wc26:profile-points-changed', updateProfilePoints);
    return () => window.removeEventListener('wc26:profile-points-changed', updateProfilePoints);
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setDailyReward(null);
      setDailyCheckInStatus('idle');
      setShowAlreadyClaimedMessage(false);
      return;
    }

    let active = true;

    Promise.all([getCurrentProfile(user.id), getTodayDailyLoginReward()])
      .then(([nextProfile, reward]) => {
        if (!active) return;
        setProfile(nextProfile);

        if (!reward) {
          setDailyReward(null);
          setDailyCheckInStatus('idle');
          setShowAlreadyClaimedMessage(false);
          return;
        }

        setDailyReward({
          claimed: false,
          alreadyClaimed: true,
          pointsAwarded: reward.pointsAwarded,
          rewardDate: reward.rewardDate,
          weekStartDate: reward.weekStartDate,
          weekday: reward.weekday,
          totalPoints: nextProfile.points,
        });
        setDailyCheckInStatus('claimed');
        setShowAlreadyClaimedMessage(true);
      })
      .catch(() => {
        if (!active) return;
        setProfile(null);
        setDailyReward(null);
        setDailyCheckInStatus('idle');
        setShowAlreadyClaimedMessage(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  function openDailyCheckIn() {
    if (!user) return;
    setShowDailyReward(true);
  }

  function closeDailyCheckIn() {
    setShowDailyReward(false);
    if (dailyCheckInStatus === 'claimed') setShowAlreadyClaimedMessage(true);
  }

  async function handleDailyCheckIn() {
    if (!user || dailyCheckInStatus === 'claiming' || dailyCheckInStatus === 'claimed') return;

    setDailyCheckInStatus('claiming');
    setDailyCheckInError(null);
    try {
      const reward = await claimDailyLoginReward();
      setDailyReward(reward);
      setShowAlreadyClaimedMessage(reward.alreadyClaimed);
      setProfile((currentProfile) => currentProfile ? { ...currentProfile, points: reward.totalPoints } : currentProfile);
      setDailyCheckInStatus('claimed');
    } catch (error) {
      setDailyCheckInStatus('idle');
      setDailyCheckInError(error instanceof Error ? error.message : t('dailyLogin.claimError'));
    }
  }

  const mobilePrimaryNavigation = appNavigationGroups.flatMap((group) => group.items).filter((item) => mobilePrimaryPaths.includes(item.to));
  const mobileMoreGroups = appNavigationGroups
    .filter((group) => group.labelKey !== 'nav.groups.admin' || profile?.role === 'admin')
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !mobilePrimaryPaths.includes(item.to)),
    }))
    .filter((group) => group.items.length > 0);
  const isMoreActive = mobileMoreGroups.some((group) => group.items.some((item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)));
  const mobileScrollClearance = `${mobileScrollSpacer}px`;

  return (
    <div className={`${fullHeight ? 'h-[100dvh]' : 'min-h-screen'} bg-page flex font-sans relative overflow-hidden`}>
      <div className="absolute inset-x-0 top-[84px] h-[calc(100vh-116px)] z-0 pointer-events-none opacity-90 overflow-hidden flex justify-center">
        <img src="https://s6.imgcdn.dev/Ybh5S0.webp" alt="" aria-hidden="true" className="w-full h-full object-cover object-top" />
      </div>
      <div className="flex-1 min-w-0 min-h-0 flex flex-col pb-[var(--mobile-scroll-clearance)] lg:pb-0 h-[100dvh] overflow-y-auto relative z-10 scroll-pb-[var(--mobile-scroll-clearance)] lg:scroll-pb-0" style={{ '--mobile-scroll-clearance': mobileScrollClearance } as React.CSSProperties}>
        <header className="flex items-center justify-between border-b-4 border-main px-4 md:px-6 py-4 bg-card z-30 sticky top-0 shrink-0 gap-4">
          <div className="flex items-center min-w-0">
            <Link to="/" className="text-xl md:text-3xl font-black uppercase tracking-tighter whitespace-nowrap hover:text-c2 transition-colors">{t('common.product')}</Link>
            <HeaderNavigation />
          </div>
          <div className="flex items-center gap-3 ml-auto">
            {user && (
              <button
                type="button"
                onClick={openDailyCheckIn}
                disabled={dailyCheckInStatus === 'claiming'}
                className={`border-2 border-main py-2 px-3 md:px-4 font-black uppercase text-xs flex items-center gap-2 shadow-[4px_4px_0_0_var(--color-shadow)] transition-all active:translate-y-[2px] active:translate-x-[2px] active:shadow-none ${dailyCheckInStatus === 'claimed' ? 'bg-muted text-subtle hover:bg-card' : 'bg-c1 text-main hover:bg-c3'}`}
              >
                <CalendarCheck size={18} strokeWidth={2.5} />
                <span className="hidden sm:inline">
                  {dailyCheckInStatus === 'claiming' ? t('dailyLogin.claiming') : dailyCheckInStatus === 'claimed' ? t('dailyLogin.claimed') : t('dailyLogin.headerClaim')}
                </span>
                <span className="sm:hidden">+1</span>
              </button>
            )}
            {user && <HeaderUserStats profile={profile} />}
            <ThemeSettings themeControls={themeControls} />
            <Link to={user ? '/profile' : '/login'} className="bg-c2 hover:opacity-80 transition-opacity text-inv font-black py-2 px-4 border-2 border-main flex items-center gap-3 transform active:scale-95 shadow-[4px_4px_0_0_var(--color-shadow)]">
              <Wallet size={18} strokeWidth={2.5} />
              <div className="flex-col items-start leading-[1.1] hidden sm:flex">
                <span className="text-[10px] uppercase font-bold opacity-80">{t('common.account')}</span>
                <span className="text-sm">{user ? t('common.profile') : t('auth.signIn')}</span>
              </div>
              <ChevronDown size={18} className="ml-1 hidden sm:block" />
            </Link>
          </div>
        </header>
        <main className="shrink-0">
          {children}
        </main>
        <div aria-hidden="true" className="lg:hidden shrink-0" style={{ height: mobileScrollSpacer }} />
        {showMobileMore && (
          <div className="lg:hidden fixed inset-0 z-40">
            <button type="button" aria-label={t('ui.closeMenu')} onClick={() => setShowMobileMore(false)} className="absolute inset-0 bg-main/35" />
            <div className="absolute left-3 right-3 bottom-[68px] max-h-[62dvh] overflow-y-auto bg-card border-[3px] border-main shadow-[5px_5px_0_var(--color-shadow)] rounded-lg">
              <div className="sticky top-0 z-10 bg-c2 text-inv border-b-[3px] border-main px-3 py-2 flex items-center justify-between rounded-t-lg">
                <div className="font-black uppercase text-xs tracking-wide">{t('common.morePages')}</div>
                <button type="button" onClick={() => setShowMobileMore(false)} className="border-2 border-main bg-card text-main p-1 shadow-[2px_2px_0_var(--color-shadow)]" aria-label={t('ui.closeMenu')}>
                  <X size={16} strokeWidth={3} />
                </button>
              </div>
              <div className="p-2 flex flex-col gap-2 pb-3">
                {user && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMobileMore(false);
                      openDailyCheckIn();
                    }}
                    disabled={dailyCheckInStatus === 'claiming'}
                    className={`border-2 border-main px-3 py-2 font-black uppercase text-[11px] flex items-center gap-3 shadow-[2px_2px_0_var(--color-shadow)] rounded-md ${dailyCheckInStatus === 'claimed' ? 'bg-muted text-subtle' : 'bg-c1 text-main'}`}
                  >
                    <CalendarCheck size={17} strokeWidth={2.5} />
                    <span>{dailyCheckInStatus === 'claiming' ? t('dailyLogin.claiming') : dailyCheckInStatus === 'claimed' ? t('dailyLogin.claimed') : t('dailyLogin.headerClaim')}</span>
                  </button>
                )}
                {mobileMoreGroups.map((group) => (
                  <div key={group.labelKey} className="border-2 border-main bg-page rounded-md overflow-hidden">
                    <div className="border-b-2 border-main px-3 py-1.5 font-black uppercase text-[10px] text-subtle bg-muted rounded-t-md">{t(group.labelKey)}</div>
                    <div className="grid grid-cols-2 gap-2 p-2">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={() => setShowMobileMore(false)}
                            className={({ isActive }) => `min-h-11 border-2 border-main px-2 py-2 flex items-center gap-2 font-black uppercase text-[10px] rounded-md ${isActive ? 'bg-c2 text-inv' : 'bg-card text-main'}`}
                          >
                            {Icon && <Icon size={16} strokeWidth={2.5} className="shrink-0" />}
                            <span className="truncate">{t(item.shortLabelKey ?? item.labelKey)}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <nav ref={mobileNavRef} className="lg:hidden fixed left-3 right-3 bottom-3 z-50 border-[3px] border-main bg-card shadow-[4px_4px_0_var(--color-shadow)] grid grid-cols-4 overflow-hidden">
        {mobilePrimaryNavigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} onClick={() => setShowMobileMore(false)} className={({ isActive }) => `min-h-[48px] py-1 px-1 border-r-2 border-main flex flex-col items-center justify-center gap-0.5 font-black uppercase text-[9px] leading-none ${isActive ? 'bg-c2 text-inv' : 'bg-card text-main'}`}>
              {Icon && <Icon size={17} strokeWidth={2.5} />}
              <span>{t(item.shortLabelKey ?? item.labelKey)}</span>
            </NavLink>
          );
        })}
        <button type="button" onClick={() => setShowMobileMore((current) => !current)} className={`min-h-[48px] py-1 px-1 flex flex-col items-center justify-center gap-0.5 font-black uppercase text-[9px] leading-none ${showMobileMore || isMoreActive ? 'bg-c2 text-inv' : 'bg-card text-main'}`} aria-expanded={showMobileMore}>
          <MoreHorizontal size={17} strokeWidth={2.5} />
          <span>{t('common.more')}</span>
        </button>
      </nav>
      <DailyLoginRewardPopup
        open={showDailyReward}
        status={dailyCheckInStatus}
        alreadyClaimed={dailyReward?.alreadyClaimed || showAlreadyClaimedMessage}
        pointsAwarded={dailyReward?.pointsAwarded ?? (new Date().getDay() || 7)}
        totalPoints={dailyReward?.totalPoints}
        weekday={dailyReward?.weekday}
        error={dailyCheckInError}
        onClaim={() => void handleDailyCheckIn()}
        onClose={closeDailyCheckIn}
      />
    </div>
  );
}
