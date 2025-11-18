import React, { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
// FIX: Corrected import path for ErrorProvider.
import { ErrorProvider } from './src/contexts/ErrorContext';
// FIX: Corrected import paths for UserProvider and useUser.
import { UserProvider, useUser } from './src/contexts/UserContext';
// FIX: Corrected import path for isToday utility.
import { isToday } from './src/utils';

// Lazy load components for better performance
// FIX: Correct lazy import for MainAppLayout to use default export.
const MainAppLayout = lazy(() => import('./src/components/MainAppLayout'));
const LevelUpModal = lazy(() => import('./src/components/LevelUpModal'));
const LandingPage = lazy(() => import('./src/components/LandingPage'));
const LoginScreen = lazy(() => import('./src/components/Login').then(module => ({ default: module.LoginScreen })));
const Onboarding = lazy(() => import('./src/components/Login').then(module => ({ default: module.Onboarding })));
const PaymentSuccess = lazy(() => import('./src/components/PaymentSuccess'));
const HeroicDashboard = lazy(() => import('./src/components/Dashboard'));
const Missions = lazy(() => import('./src/components/Missions'));
const Codex = lazy(() => import('./src/components/Codex'));
const Guild = lazy(() => import('./src/components/Guild'));
const IAMentor = lazy(() => import('./src/components/IAMentor'));
const Journal = lazy(() => import('./src/components/Journal'));
// FIX: Corrected lazy import for SkillTree to handle named export.
const SkillTree = lazy(() => import('./src/components/SkillTree').then(module => ({ default: module.SkillTree })));
// FIX: Corrected lazy import for Pantheon to resolve missing default export error. It seems another component with the same name was causing issues.
const Pantheon = lazy(() => import('./src/components/Pantheon'));
// FIX: Corrected lazy import for Profile component to handle named export.
const Profile = lazy(() => import('./src/components/Profile').then(module => ({ default: module.Profile })));
const Settings = lazy(() => import('./src/components/Settings'));
const LifeMapPage = lazy(() => import('./src/components/LifeMapPage'));
const TacticalArsenal = lazy(() => import('./src/components/TacticalArsenal'));

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
                <Route path="/" element={<LandingPage />} />
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