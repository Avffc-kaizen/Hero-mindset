import React, { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ErrorProvider } from './contexts/ErrorContext';
import { UserProvider, useUser } from './contexts/UserContext';
import { isToday } from './utils';

// Lazy load components for better performance
const MainAppLayout = lazy(() => import('./components/MainAppLayout'));
const LevelUpModal = lazy(() => import('./components/LevelUpModal'));
const LandingPage = lazy(() => import('./components/LandingPage'));
const LoginScreen = lazy(() => import('./components/Login').then(module => ({ default: module.LoginScreen })));
const Onboarding = lazy(() => import('./components/Login').then(module => ({ default: module.Onboarding })));
const PaymentSuccess = lazy(() => import('./components/PaymentSuccess'));
const HeroicDashboard = lazy(() => import('./components/Dashboard'));
const Missions = lazy(() => import('./components/Missions'));
const Codex = lazy(() => import('./components/Codex'));
const Guild = lazy(() => import('./components/Guild'));
const IAMentor = lazy(() => import('./components/IAMentor'));
const Journal = lazy(() => import('./components/Journal'));
const SkillTree = lazy(() => import('./components/SkillTree'));
const Pantheon = lazy(() => import('./components/Pantheon'));
const Profile = lazy(() => import('./components/Profile'));
const Settings = lazy(() => import('./components/Settings'));
const LifeMapPage = lazy(() => import('./components/LifeMapPage'));
const TacticalArsenal = lazy(() => import('./components/TacticalArsenal'));
const StorageTest = lazy(() => import('./components/StorageTest'));

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

  if (loadingAuth && !user.isLoggedIn) {
    // Show a loading screen only on the initial auth check
    return <LoadingFallback />;
  }

  return (
      <>
        {levelUpData && <Suspense fallback={null}><LevelUpModal level={levelUpData.level} rank={levelUpData.rank} onClose={closeLevelUpModal} /></Suspense>}
        <Suspense fallback={<LoadingFallback />}>
            <Routes>
                <Route path="/" element={user.isLoggedIn && user.onboardingCompleted ? <Navigate to="/app/dashboard" replace /> : <LandingPage />} />
                <Route path="/login" element={<LoginScreen />} />
                <Route path="/payment-success/:productId" element={<PaymentSuccess />} />
                <Route path="/onboarding" element={<OnboardingRoute><Onboarding /></OnboardingRoute>} />
                
                <Route path="/app" element={<ProtectedRoute><MainAppLayout /></ProtectedRoute>}>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<HeroicDashboard />} />
                    <Route path="mapa" element={<LifeMapPage />} />
                    <Route path="missions" element={<Missions />} />
                    <Route path="codex" element={<Codex isDailyLimitReached={isDailyLimitReached} />} />
                    <Route path="guild" element={<Guild />} />
                    <Route path="mentor" element={<IAMentor />} />
                    <Route path="journal" element={<Journal />} />
                    <Route path="skills" element={<SkillTree />} />
                    <Route path="arsenal" element={<TacticalArsenal />} />
                    <Route path="pantheon" element={<Pantheon />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="storage-test" element={<StorageTest />} />
                </Route>
                
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Suspense>
      </>
  );
};

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
