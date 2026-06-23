import React, { lazy, Suspense, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';

const Landing = lazy(() => import('./Landing'));
const Picks = lazy(() => import('./Picks'));
const Leaderboard = lazy(() => import('./Leaderboard'));
const Rules = lazy(() => import('./Rules'));
const PointsGuide = lazy(() => import('./PointsGuide'));
const Login = lazy(() => import('./Login'));
const Register = lazy(() => import('./Register'));
const ResetPassword = lazy(() => import('./ResetPassword'));
const Onboarding = lazy(() => import('./Onboarding'));
const Fixtures = lazy(() => import('./Fixtures'));
const Achievements = lazy(() => import('./pages/Achievements'));
const Activity = lazy(() => import('./pages/Activity'));
const AdminAudit = lazy(() => import('./pages/AdminAudit'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Badges = lazy(() => import('./pages/Badges'));
const JoinLeague = lazy(() => import('./pages/JoinLeague'));
const LeagueCreate = lazy(() => import('./pages/LeagueCreate'));
const LeagueDetail = lazy(() => import('./pages/LeagueDetail'));
const Leagues = lazy(() => import('./pages/Leagues'));
const MatchDetail = lazy(() => import('./pages/MatchDetail'));
const MyPredictions = lazy(() => import('./pages/MyPredictions'));
const PredictionBreakdown = lazy(() => import('./pages/PredictionBreakdown'));
const Profile = lazy(() => import('./pages/Profile'));
const Rewards = lazy(() => import('./pages/Rewards'));

export type ThemeControls = {
  isVintage: boolean;
  setIsVintage: (value: boolean) => void;
  isDark: boolean;
  setIsDark: (value: boolean) => void;
  isRounded: boolean;
  setIsRounded: (value: boolean) => void;
  hasShadow: boolean;
  setHasShadow: (value: boolean) => void;
  hasFrame: boolean;
  setHasFrame: (value: boolean) => void;
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

function RouteFallback() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-page text-main p-6 font-black uppercase">
      {t('ui.loadingPage')}
    </div>
  );
}

export default function App() {
  const [isVintage, setIsVintage] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isRounded, setIsRounded] = useState(true);
  const [hasShadow, setHasShadow] = useState(true);
  const [hasFrame, setHasFrame] = useState(false);

  useEffect(() => {
    let cls = 'bg-page text-main min-h-screen';
    if (isVintage) cls += ' theme-vintage';
    if (isDark) cls += ' theme-dark';
    if (isRounded) cls += ' theme-rounded';
    if (!hasShadow) cls += ' theme-no-shadow';
    if (!hasFrame) cls += ' theme-no-frame';
    document.body.className = cls;
  }, [isVintage, isDark, isRounded, hasShadow, hasFrame]);

  const themeControls: ThemeControls = {
    isVintage,
    setIsVintage,
    isDark,
    setIsDark,
    isRounded,
    setIsRounded,
    hasShadow,
    setHasShadow,
    hasFrame,
    setHasFrame,
  };

  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<LegacyRoute Component={Landing} themeControls={themeControls} />} />
          <Route path="/login" element={<LegacyRoute Component={Login} themeControls={themeControls} />} />
          <Route path="/register" element={<LegacyRoute Component={Register} themeControls={themeControls} />} />
          <Route path="/reset-password" element={<LegacyRoute Component={ResetPassword} themeControls={themeControls} />} />
          <Route path="/onboarding" element={<LegacyRoute Component={Onboarding} themeControls={themeControls} />} />
          <Route path="/matches" element={<LegacyRoute Component={Fixtures} themeControls={themeControls} />} />
          <Route path="/picks" element={<LegacyRoute Component={Picks} themeControls={themeControls} />} />
          <Route path="/my-predictions" element={<MyPredictions themeControls={themeControls} />} />
          <Route path="/leaderboard" element={<LegacyRoute Component={Leaderboard} themeControls={themeControls} />} />
          <Route path="/rules" element={<LegacyRoute Component={Rules} themeControls={themeControls} />} />
          <Route path="/points-guide" element={<LegacyRoute Component={PointsGuide} themeControls={themeControls} />} />
          <Route path="/prize-pool" element={<Navigate to="/points-guide" replace />} />
          <Route path="/profile" element={<Profile themeControls={themeControls} />} />
          <Route path="/badges" element={<Badges themeControls={themeControls} />} />
          <Route path="/achievements" element={<Achievements themeControls={themeControls} />} />
          <Route path="/leagues" element={<Leagues themeControls={themeControls} />} />
          <Route path="/leagues/create" element={<LeagueCreate themeControls={themeControls} />} />
          <Route path="/leagues/join/:inviteCode" element={<JoinLeague themeControls={themeControls} />} />
          <Route path="/leagues/:leagueId" element={<LeagueDetail themeControls={themeControls} />} />
          <Route path="/global-arena" element={<Navigate to="/leagues/global-arena" replace />} />
          <Route path="/activity" element={<Activity themeControls={themeControls} />} />
          <Route path="/rewards" element={<Rewards themeControls={themeControls} />} />
          <Route path="/admin" element={<AdminDashboard themeControls={themeControls} />} />
          <Route path="/admin/audit" element={<AdminAudit themeControls={themeControls} />} />
          <Route path="/matches/:matchId" element={<MatchDetail themeControls={themeControls} />} />
          <Route path="/predictions/:predictionId" element={<PredictionBreakdown themeControls={themeControls} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
