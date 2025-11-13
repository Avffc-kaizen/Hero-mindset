import React, { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LevelUpModal from './components/LevelUpModal';
import { isToday } from './utils';
import { Loader2 } from 'lucide-react';
import { ErrorProvider } from './contexts/ErrorContext';
import { UserProvider, useUser } from './contexts/UserContext';
import MainAppLayout from './components/MainAppLayout';

// --- LAZY-LOADED COMPONENTS ---
const LazyLandingPage = lazy(() => import('./components/LandingPage'));
const LazyLoginScreen = lazy(() => import('./components/Login').then(module => ({ default: module.LoginScreen })));
const LazyOnboarding = lazy(() => import('./components/Login').then(module => ({ default: module.Onboarding })));
const LazyPaymentSuccess = lazy(() => import('./components/PaymentSuccess'));
const LazyHeroicDashboard = lazy(() => import('./components/Dashboard'));
const LazyMissions = lazy(() => import('./components/Missions'));
const LazyCodex = lazy(() => import('./components/Codex'));
const LazyGuild = lazy(() => import('./components/Guild'));
const LazyIAMentor = lazy(() => import('./components/IAMentor'));
const LazyJournal = lazy(() => import('./components/Journal'));
const LazySkillTree = lazy(() => import('./components/SkillTree'));
const LazyPantheon = lazy(() => import('./components/Pantheon'));
const LazyProfile = lazy(() => import('./components/Profile'));
const LazyTacticalArsenal = lazy(() => import('./components/TacticalArsenal'));
const LazyLifeMapPage = lazy(() => import('./components/LifeMapPage'));


// --- LAYOUT & ROUTING COMPONENTS ---

const LoadingFallback: React.FC = () => (
    <div className="bg-black min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
    </div>
);

const AppContent: React.FC = () => {
  const { user, levelUpData, closeLevelUpModal, loadingAuth } = useUser();
  const location = useLocation();

  const isDailyLimitReached = !isToday(user.lastLessonCompletionDate) ? false : user.lessonsCompletedToday >= 3;

  const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
    if (loadingAuth) return <LoadingFallback />;
    if (!user.isLoggedIn) return <Navigate to="/login" state={{ from: location }} replace />;
    if (!user.onboardingCompleted) return <Navigate to="/onboarding" replace />;
    return children;
  };
  
  const OnboardingRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
    if (loadingAuth) return <LoadingFallback />;
    if (!user.isLoggedIn) return <Navigate to="/login" state={{ from: location }} replace />;
    if (user.onboardingCompleted) return <Navigate to="/app/dashboard" replace />;
    return children;
  };

  if (loadingAuth && location.pathname !== '/' && !location.pathname.startsWith('/payment-success')) {
    return <LoadingFallback />;
  }

  return (
      <>
        {levelUpData && <LevelUpModal level={levelUpData.level} rank={levelUpData.rank} onClose={closeLevelUpModal} />}
        <Suspense fallback={<LoadingFallback />}>
            <Routes>
                <Route path="/" element={user.isLoggedIn && user.onboardingCompleted ? <Navigate to="/app/dashboard" replace /> : <LazyLandingPage />} />
                <Route path="/login" element={<LazyLoginScreen />} />
                <Route path="/payment-success/:productId" element={<LazyPaymentSuccess />} />
                <Route path="/onboarding" element={<OnboardingRoute><LazyOnboarding /></OnboardingRoute>} />
                <Route path="/app" element={<ProtectedRoute><MainAppLayout /></ProtectedRoute>}>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<LazyHeroicDashboard />} />
                    <Route path="mapa" element={<LazyLifeMapPage />} />
                    <Route path="missions" element={<LazyMissions />} />
                    <Route path="codex" element={<LazyCodex isDailyLimitReached={isDailyLimitReached} />} />
                    <Route path="guild" element={<LazyGuild />} />
                    <Route path="mentor" element={<LazyIAMentor />} />
                    <Route path="journal" element={<LazyJournal />} />
                    <Route path="skills" element={<LazySkillTree />} />
                    <Route path="pantheon" element={<LazyPantheon />} />
                    <Route path="profile" element={<LazyProfile />} />
                    <Route path="arsenal" element={<LazyTacticalArsenal />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Suspense>
      </>
  );
};

// --- ROOT APP COMPONENT ---
const App: React.FC = () => (
  <HashRouter>
    <ErrorProvider>
      <UserProvider>
        <AppContent />
      </UserProvider>
    </ErrorProvider>
  </HashRouter>
);

export default App;