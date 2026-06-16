import React, { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import Landing from './Landing';
import Picks from './Picks';
import Leaderboard from './Leaderboard';
import Rules from './Rules';
import PrizePool from './PrizePool';
import Login from './Login';
import Register from './Register';
import Onboarding from './Onboarding';
import Fixtures from './Fixtures';
import Activity from './pages/Activity';
import Badges from './pages/Badges';
import LeagueDetail from './pages/LeagueDetail';
import Leagues from './pages/Leagues';
import MatchDetail from './pages/MatchDetail';
import MyPredictions from './pages/MyPredictions';
import PredictionBreakdown from './pages/PredictionBreakdown';
import Profile from './pages/Profile';

export type ThemeControls = {
  isVintage: boolean;
  setIsVintage: (value: boolean) => void;
  isDark: boolean;
  setIsDark: (value: boolean) => void;
  isRounded: boolean;
  setIsRounded: (value: boolean) => void;
  hasShadow: boolean;
  setHasShadow: (value: boolean) => void;
};

type LegacyPageProps = ThemeControls & {
  onNavigate: (page: string) => void;
};

type LegacyRouteProps = {
  Component: React.ComponentType<LegacyPageProps>;
  themeControls: ThemeControls;
};

function pageToPath(page: string) {
  return page === 'landing' ? '/' : `/${page}`;
}

function LegacyRoute({ Component, themeControls }: LegacyRouteProps) {
  const navigate = useNavigate();

  return <Component {...themeControls} onNavigate={(page) => navigate(pageToPath(page))} />;
}

export default function App() {
  const [isVintage, setIsVintage] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isRounded, setIsRounded] = useState(false);
  const [hasShadow, setHasShadow] = useState(true);

  useEffect(() => {
    let cls = 'bg-page text-main min-h-screen';
    if (isVintage) cls += ' theme-vintage';
    if (isDark) cls += ' theme-dark';
    if (isRounded) cls += ' theme-rounded';
    if (!hasShadow) cls += ' theme-no-shadow';
    document.body.className = cls;
  }, [isVintage, isDark, isRounded, hasShadow]);

  const themeControls: ThemeControls = {
    isVintage,
    setIsVintage,
    isDark,
    setIsDark,
    isRounded,
    setIsRounded,
    hasShadow,
    setHasShadow,
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LegacyRoute Component={Landing} themeControls={themeControls} />} />
        <Route path="/login" element={<LegacyRoute Component={Login} themeControls={themeControls} />} />
        <Route path="/register" element={<LegacyRoute Component={Register} themeControls={themeControls} />} />
        <Route path="/onboarding" element={<LegacyRoute Component={Onboarding} themeControls={themeControls} />} />
        <Route path="/matches" element={<LegacyRoute Component={Fixtures} themeControls={themeControls} />} />
        <Route path="/picks" element={<LegacyRoute Component={Picks} themeControls={themeControls} />} />
        <Route path="/my-predictions" element={<MyPredictions themeControls={themeControls} />} />
        <Route path="/leaderboard" element={<LegacyRoute Component={Leaderboard} themeControls={themeControls} />} />
        <Route path="/rules" element={<LegacyRoute Component={Rules} themeControls={themeControls} />} />
        <Route path="/prize-pool" element={<LegacyRoute Component={PrizePool} themeControls={themeControls} />} />
        <Route path="/profile" element={<Profile themeControls={themeControls} />} />
        <Route path="/badges" element={<Badges themeControls={themeControls} />} />
        <Route path="/leagues" element={<Leagues themeControls={themeControls} />} />
        <Route path="/leagues/:leagueId" element={<LeagueDetail themeControls={themeControls} />} />
        <Route path="/activity" element={<Activity themeControls={themeControls} />} />
        <Route path="/matches/:matchId" element={<MatchDetail themeControls={themeControls} />} />
        <Route path="/predictions/:predictionId" element={<PredictionBreakdown themeControls={themeControls} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
