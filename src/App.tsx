
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, Outlet, NavLink, useLocation } from 'react-router-dom';
import { UserState, Archetype, LifeMapCategory, RankTitle, JournalEntry, LessonDetails, Mission, Module, ProtectionModuleId } from './types';
import { INITIAL_USER_STATE, SKILL_TREES, PARAGON_PERKS, STATIC_DAILY_MISSIONS, STATIC_WEEKLY_MISSIONS, STATIC_MILESTONE_MISSIONS, INITIAL_LIFE_MAP_SCORES } from './constants';
import { Onboarding, LoginScreen } from './components/Login';
import HeroicDashboard from './components/Dashboard';
import Codex from './components/Codex';
import Guild from './components/Guild';
import IAMentor from './components/IAMentor';
import Journal from './components/Journal';
import Pantheon from './components/Pantheon';
import SkillTree from './components/SkillTree';
import Profile from './components/Profile';
import Missions from './components/Missions';
import LandingPage from './components/LandingPage';
import PaymentSuccess from './components/PaymentSuccess';
import LevelUpModal from './components/LevelUpModal';
import { generateDailyMissionsAI, generateWeeklyMissionsAI, generateMilestoneMissionsAI, generateProactiveOracleGuidance } from './services/geminiService';
import { buyProduct } from './services/paymentService';
import { Compass, Book, Shield, Bot, ScrollText, GitMerge, Sparkles, User as UserIcon, LogOut, ArrowLeft, Target, Menu, X } from 'lucide-react';

const XP_PER_LEVEL_FORMULA = (level: number) => Math.floor(100 * Math.pow(level, 1.5));

const RANK_THRESHOLDS: { [key in RankTitle]: number } = {
  [RankTitle.Iniciante]: 0,
  [RankTitle.Aventureiro]: 5,
  [RankTitle.Campeao]: 15,
  [RankTitle.Paladino]: 30,
  [RankTitle.Lendario]: 50,
  [RankTitle.Divino]: 50,
};

const getRank = (level: number, isAscended: boolean): RankTitle => {
  if (isAscended) return RankTitle.Divino;
  if (level >= RANK_THRESHOLDS[RankTitle.Lendario]) return RankTitle.Lendario;
  if (level >= RANK_THRESHOLDS[RankTitle.Paladino]) return RankTitle.Paladino;
  if (level >= RANK_THRESHOLDS[RankTitle.Campeao]) return RankTitle.Campeao;
  if (level >= RANK_THRESHOLDS[RankTitle.Aventureiro]) return RankTitle.Aventureiro;
  return RankTitle.Iniciante;
};

const isToday = (timestamp: number) => {
    if (!timestamp) return false;
    const today = new Date();
    const date = new Date(timestamp);
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
};

// --- COMPONENTS ---

const MobileMenu: React.FC<{ user: UserState, onReset: () => void }> = ({ user, onReset }) => {
  const menuLinks = [
    { to: "/app/mentor", icon: Bot, label: "Oráculo Diário" },
    { to: "/app/journal", icon: ScrollText, label: "Diário do Herói" },
    { to: "/app/skills", icon: GitMerge, label: "Habilidades" },
    { to: "/app/pantheon", icon: Sparkles, label: "Panteão" },
    { to: "/app/profile", icon: UserIcon, label: "Santuário" },
  ];

  const profileLink = menuLinks[menuLinks.length - 1];
  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-4 px-4 py-3 rounded-md text-base font-medium transition-colors ${
    isActive
        ? 'bg-zinc-800 text-white'
        : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
    }`;

  return (
    <div className="p-4 h-full flex flex-col">
       <div className="p-4 flex items-center gap-3 border-b border-zinc-800 mb-4">
            <UserIcon className="w-12 h-12 p-2 rounded-full bg-zinc-800"/>
            <div>
                <p className="font-bold text-white text-lg">{user.name}</p>
                <p className="text-sm text-zinc-400">{user.rank}</p>
            </div>
        </div>
      <nav className="space-y-1 flex-grow">
        {menuLinks.slice(0, -1).map(link => (
            <NavLink key={link.to} to={link.to} className={navLinkClasses}>
                <link.icon className="w-6 h-6" />
                {link.label}
            </NavLink>
        ))}
      </nav>
      <div className="mt-auto pt-4 border-t border-zinc-800 space-y-2">
        <NavLink to={profileLink.to} className={navLinkClasses}>
            <profileLink.icon className="w-6 h-6" />
            {profileLink.label}
        </NavLink>
        <button onClick={onReset} className="w-full flex items-center gap-4 px-4 py-3 rounded-md text-base font-medium text-zinc-400 hover:bg-zinc-800/50 hover:text-white transition-colors">
            <LogOut className="w-6 h-6" /> Sair (Reset)
        </button>
      </div>
    </div>
  )
}

const MainAppLayout: React.FC<{ user: UserState, onReset: () => void, onRedoDiagnosis: () => void }> = ({ user, onReset, onRedoDiagnosis }) => {
  const location = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const nextLevelXP = XP_PER_LEVEL_FORMULA(user.level);
  const xpProgress = (user.currentXP / nextLevelXP) * 100;

  const sidebarNavLinks = [
    { to: "/app/dashboard", icon: Compass, label: "Dashboard 360" },
    { to: "/app/missions", icon: Target, label: "Missões" },
    { to: "/app/codex", icon: Book, label: "Codex" },
    { to: "/app/guild", icon: Shield, label: "Guilda" },
    { to: "/app/mentor", icon: Bot, label: "Oráculo Diário" },
    { to: "/app/journal", icon: ScrollText, label: "Diário do Herói" },
    { to: "/app/skills", icon: GitMerge, label: "Habilidades" },
    { to: "/app/pantheon", icon: Sparkles, label: "Panteão" },
    { to: "/app/profile", icon: UserIcon, label: "Santuário" },
  ];

  const bottomNavLinks = [
    { to: "/app/dashboard", icon: Compass, label: "Dashboard" },
    { to: "/app/missions", icon: Target, label: "Missões" },
    { to: "/app/codex", icon: Book, label: "Codex" },
    { to: "/app/guild", icon: Shield, label: "Guilda" },
    { to: "/app/menu", icon: Menu, label: "Menu" },
  ];

  const SidebarContent = ({ onLinkClick }: { onLinkClick?: () => void }) => {
    const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
      `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
      }`;
      
    return (
     <div className="flex flex-col h-full bg-zinc-950">
        <div className="p-4 border-b border-zinc-800">
            <h1 className="font-mono font-bold text-lg uppercase tracking-tighter flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-500" /> Hero Mindset
            </h1>
        </div>
        <div className="p-4 flex items-center gap-3 border-b border-zinc-800">
            <UserIcon className="w-10 h-10 p-2 rounded-full bg-zinc-800"/>
            <div>
                <p className="font-bold text-white truncate max-w-[140px]">{user.name}</p>
                <p className="text-xs text-zinc-400">{user.rank}</p>
            </div>
        </div>
        <nav className="flex-grow p-4 space-y-1 overflow-y-auto">
            {sidebarNavLinks.slice(0, -1).map(link => (
                <NavLink key={link.to} to={link.to} className={navLinkClasses} onClick={onLinkClick}>
                    <link.icon className="w-5 h-5" />
                    {link.label}
                </NavLink>
            ))}
        </nav>
        <div className="p-4 border-t border-zinc-800 space-y-2">
             <NavLink to="/app/profile" className={navLinkClasses} onClick={onLinkClick}>
                <UserIcon className="w-5 h-5" />
                Santuário
            </NavLink>
            <button onClick={onReset} className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-zinc-400 hover:bg-zinc-800/50 hover:text-white transition-colors">
                <LogOut className="w-5 h-5" /> Sair
            </button>
        </div>
    </div>
    );
  };

  return (
    <div className="flex h-screen bg-black overflow-hidden">
      <aside className="hidden md:block w-64 flex-shrink-0 border-r border-zinc-800">
        <SidebarContent />
      </aside>

      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileSidebarOpen(false)}></div>
          <div className="relative flex-1 flex flex-col max-w-[80%] w-full bg-zinc-950 border-r border-zinc-800 animate-in slide-in-from-left duration-300">
            <div className="absolute top-0 right-0 -mr-12 pt-4">
              <button onClick={() => setIsMobileSidebarOpen(false)} className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
            <SidebarContent onLinkClick={() => setIsMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex-shrink-0 bg-zinc-950/80 backdrop-blur-sm border-b border-zinc-800 px-3 py-3 sm:p-4 flex items-center gap-4">
            <button onClick={() => setIsMobileSidebarOpen(true)} className="md:hidden text-zinc-400 hover:text-white transition-colors">
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex-grow flex items-center gap-4">
              <div className="font-mono text-xs sm:text-sm">
                <span className="font-bold text-white">LVL {user.level}</span>
              </div>
              <div className="flex-grow bg-zinc-800 rounded-full h-2.5 relative overflow-hidden">
                  <div className="bg-gradient-to-r from-zinc-500 to-white h-2.5 rounded-full transition-all duration-1000" style={{ width: `${xpProgress}%` }}></div>
              </div>
              <div className="font-mono text-xs text-zinc-400 hidden sm:block">
                {user.currentXP.toLocaleString()} / {nextLevelXP.toLocaleString()} XP
              </div>
            </div>
        </header>
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 bg-zinc-950 pb-20 md:pb-8">
          <div key={location.pathname} className="animate-in fade-in duration-300 h-full">
            {location.pathname.includes('dashboard') 
              ? <HeroicDashboard user={user} onReset={onRedoDiagnosis} hasSubscription={user.hasSubscription} onUpgrade={() => buyProduct('mentor_ia', { userId: user.email })} />
              : <Outlet />
            }
          </div>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-zinc-950 border-t border-zinc-800 md:hidden flex justify-around items-center z-40">
        {bottomNavLinks.map(link => (
           <NavLink key={link.to} to={link.to} className={({ isActive }) => `flex flex-col items-center justify-center h-full w-full text-xs transition-all duration-200 active:scale-95 gap-1 pt-1 ${isActive ? 'text-white border-t-2 border-white' : 'text-zinc-400 border-t-2 border-transparent hover:text-white'}`}>
              <link.icon className="w-5 h-5" />
              <span>{link.label}</span>
            </NavLink>
        ))}
      </nav>
    </div>
  );
};

// --- MAIN APP LOGIC ---

const AppContent: React.FC = () => {
  const [user, setUser] = useState<UserState>(() => {
    try {
      const saved = localStorage.getItem('hero_360_user');
      if (saved) {
          const parsed = JSON.parse(saved);
          // SAFETY: Hydrate missing fields for version compatibility (V2 -> V3)
          return {
              ...INITIAL_USER_STATE,
              ...parsed,
              // Ensure critical V3 arrays and objects exist
              activeModules: parsed.activeModules || [],
              company: parsed.company || undefined,
              businessRoadmap: parsed.businessRoadmap || [],
              bioData: parsed.bioData || { sleepHours: 0, workoutsThisWeek: 0, waterIntake: 0 },
              focusHistory: parsed.focusHistory || [],
              missions: parsed.missions || [],
              unlockedSkills: parsed.unlockedSkills || INITIAL_USER_STATE.unlockedSkills,
              lifeMapScores: parsed.lifeMapScores || INITIAL_LIFE_MAP_SCORES,
              // Force login state if data exists to prevent white screen
              isLoggedIn: parsed.isLoggedIn ?? true, 
              onboardingCompleted: parsed.onboardingCompleted ?? true
          }
      }
    } catch (e) {
      console.error("Failed to load user state", e);
    }
    return INITIAL_USER_STATE;
  });
  
  const navigate = useNavigate();
  const [isMissionsLoading, setIsMissionsLoading] = useState(false);
  const [levelUpModalData, setLevelUpModalData] = useState<{visible: boolean, level: number, rank: RankTitle} | null>(null);
  const prevLevelRef = useRef(user.level);

  useEffect(() => {
    if (user.isLoggedIn) {
      localStorage.setItem('hero_360_user', JSON.stringify(user));
    }
  }, [user]);

  useEffect(() => {
    if (user.level > prevLevelRef.current) {
        setLevelUpModalData({ visible: true, level: user.level, rank: user.rank });
    }
    prevLevelRef.current = user.level;
  }, [user.level, user.rank]);
  
  const addXP = useCallback((xp: number) => {
    setUser(prevUser => {
      let newXP = prevUser.currentXP + xp;
      let newLevel = prevUser.level;
      let newSkillPoints = prevUser.skillPoints;
      let nextLevelXP = XP_PER_LEVEL_FORMULA(newLevel);

      while (newXP >= nextLevelXP) {
        newXP -= nextLevelXP;
        newLevel += 1;
        newSkillPoints += 1;
        nextLevelXP = XP_PER_LEVEL_FORMULA(newLevel);
      }
      return { ...prevUser, currentXP: newXP, level: newLevel, skillPoints: newSkillPoints, rank: getRank(newLevel, prevUser.isAscended || false) };
    });
  }, []);

  const removeXP = useCallback((amount: number) => {
    setUser(prevUser => {
      const newXP = Math.max(0, prevUser.currentXP - amount);
      return { ...prevUser, currentXP: newXP };
    });
  }, []);

  // --- EFFICIENT DATA LOADING STRATEGY ---
  
  // 1. Proactive Oracle (Only once per day)
  useEffect(() => {
      const checkOracleGuidance = async () => {
          if (user.isLoggedIn && user.hasSubscription && user.onboardingCompleted) {
              const lastGuidanceDate = user.dailyGuidance?.date;
              if (!lastGuidanceDate || !isToday(lastGuidanceDate)) {
                  try {
                      const guidance = await generateProactiveOracleGuidance(user);
                      setUser(prev => ({ ...prev, dailyGuidance: guidance }));
                  } catch (e) {}
              }
          }
      };
      checkOracleGuidance();
  }, [user.isLoggedIn, user.hasSubscription, user.onboardingCompleted]);

  // 2. Missions (Lazy Load + Fallback)
  useEffect(() => {
    const getWeekNumber = (d: Date) => {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    };

    const isSameWeek = (ts1: number, ts2: number) => {
        if (!ts1 || !ts2) return false;
        return getWeekNumber(new Date(ts1)) === getWeekNumber(new Date(ts2));
    };

    const refreshMissions = async () => {
      if (!user.onboardingCompleted || !user.isLoggedIn) return;

      const now = Date.now();
      const needsDaily = !isToday(user.lastDailyMissionRefresh);
      const needsWeekly = !isSameWeek(now, user.lastWeeklyMissionRefresh);
      const needsMilestone = (now - user.lastMilestoneMissionRefresh) > (30 * 24 * 60 * 60 * 1000);

      if (!needsDaily && !needsWeekly && !needsMilestone) return;
      
      setIsMissionsLoading(true);

      try {
        let dailyMissions = user.missions.filter(m => m.type === 'daily');
        let weeklyMissions = user.missions.filter(m => m.type === 'weekly');
        let milestoneMissions = user.missions.filter(m => m.type === 'milestone');
        
        // Use AI only if subscribed, else fallback instantly to static
        if (needsDaily) dailyMissions = user.hasSubscription ? await generateDailyMissionsAI(user.level, user.rank) : STATIC_DAILY_MISSIONS.map(m => ({ ...m, completed: false, id: `static-d-${now}-${Math.random()}` }));
        if (needsWeekly) weeklyMissions = user.hasSubscription ? await generateWeeklyMissionsAI(user.level, user.rank) : STATIC_WEEKLY_MISSIONS.map(m => ({ ...m, completed: false, id: `static-w-${now}-${Math.random()}` }));
        if (needsMilestone) milestoneMissions = user.hasSubscription ? await generateMilestoneMissionsAI(user.level, user.rank, user.stats, user.journalEntries) : STATIC_MILESTONE_MISSIONS.map(m => ({ ...m, completed: false, id: `static-m-${now}-${Math.random()}` }));

        // Safety Check: if AI returns empty arrays (errors), use static
        if (dailyMissions.length === 0) dailyMissions = STATIC_DAILY_MISSIONS.map(m => ({ ...m, completed: false, id: `fallback-d-${now}` }));
        if (weeklyMissions.length === 0) weeklyMissions = STATIC_WEEKLY_MISSIONS.map(m => ({ ...m, completed: false, id: `fallback-w-${now}` }));

        setUser(prev => ({
          ...prev,
          missions: [...dailyMissions, ...weeklyMissions, ...milestoneMissions],
          lastDailyMissionRefresh: needsDaily ? now : prev.lastDailyMissionRefresh,
          lastWeeklyMissionRefresh: needsWeekly ? now : prev.lastWeeklyMissionRefresh,
          lastMilestoneMissionRefresh: needsMilestone ? now : prev.lastMilestoneMissionRefresh
        }));
      } catch (error) {
        console.error("Failed to refresh missions:", error);
      } finally {
        setIsMissionsLoading(false);
      }
    };

    refreshMissions();
  }, [user.onboardingCompleted, user.isLoggedIn, user.hasSubscription, user.lastDailyMissionRefresh, user.lastWeeklyMissionRefresh, user.lastMilestoneMissionRefresh, user.missions, user.level, user.rank, user.stats, user.journalEntries]);

  const handleCompleteMission = useCallback((missionId: string) => {
    setUser(prevUser => {
      const mission = prevUser.missions.find(m => m.id === missionId);
      if (mission && !mission.completed) {
        addXP(mission.xp);
        return {
          ...prevUser,
          missions: prevUser.missions.map(m =>
            m.id === missionId ? { ...m, completed: true } : m
          ),
        };
      }
      return prevUser;
    });
  }, [addXP]);

  const handleOnboardingComplete = (archetype: Archetype, lifeMapScores: Record<LifeMapCategory, number>, focusAreas: LifeMapCategory[], mapAnalysis?: string) => {
    setUser(prev => ({
      ...prev,
      onboardingCompleted: true,
      archetype: archetype,
      lifeMapScores: lifeMapScores,
      focusAreas: focusAreas,
      mapAnalysis: mapAnalysis
    }));
    navigate('/app/dashboard', { replace: true });
  };
  
  const handleReset = () => {
    localStorage.clear();
    setUser(INITIAL_USER_STATE);
    navigate('/', { replace: true });
  };

  const handleRedoDiagnosis = () => {
     setUser(prev => ({ ...prev, onboardingCompleted: false }));
     navigate('/onboarding');
  };
  
  const handleCompleteLesson = useCallback((completedLesson: LessonDetails) => {
    setUser(prev => {
        let completedToday = prev.lessonsCompletedToday;
        let lastCompletionDate = prev.lastLessonCompletionDate;

        if (!isToday(lastCompletionDate)) {
            completedToday = 0;
        }

        if (completedToday >= 3) {
            return prev; // Daily limit reached
        }
        
        addXP(50);

        const newModules = JSON.parse(JSON.stringify(prev.modules));

        let lessonFoundAndUpdated = false;
        for (const mod of newModules) {
            for (const lesson of mod.lessons) {
                if (lesson.id === completedLesson.id) {
                    lesson.completed = true;
                    lessonFoundAndUpdated = true;
                    break;
                }
            }
            if(lessonFoundAndUpdated) break;
        }

        // Unlock next lesson
        const allLessonsFlat: LessonDetails[] = newModules.flatMap((mod: Module) => mod.lessons);
        const completedLessonIndex = allLessonsFlat.findIndex((l: LessonDetails) => l.id === completedLesson.id);

        if (completedLessonIndex !== -1) {
            const nextLessonIndex = completedLessonIndex + 1;
            if (nextLessonIndex < allLessonsFlat.length) {
                allLessonsFlat[nextLessonIndex].locked = false;
            }
        }
        
        return {
            ...prev,
            modules: newModules,
            lessonsCompletedToday: completedToday + 1,
            lastLessonCompletionDate: Date.now(),
        };
    });
  }, [addXP]);

  const handleAddJournalEntry = useCallback((content: string) => {
     setUser(prev => ({
       ...prev,
       journalEntries: [{ id: Date.now().toString(), date: Date.now(), content, isAnalyzed: false }, ...prev.journalEntries]
     }))
  }, []);

  const handleUpdateJournalEntry = useCallback((id: string, updates: Partial<JournalEntry>) => {
    setUser(prev => ({
      ...prev,
      journalEntries: prev.journalEntries.map(e => e.id === id ? { ...e, ...updates } : e)
    }));
  }, []);
  
  const handleUnlockSkill = useCallback((skillId: string) => {
    const category = Object.keys(SKILL_TREES).find(cat => SKILL_TREES[cat as keyof typeof SKILL_TREES].some(s => s.id === skillId));
    if(!category) return;
    const skill = SKILL_TREES[category as keyof typeof SKILL_TREES].find(s => s.id === skillId);

    if (skill && user.skillPoints >= skill.cost && !user.unlockedSkills.includes(skillId)) {
        setUser(prev => ({
            ...prev,
            skillPoints: prev.skillPoints - skill.cost,
            unlockedSkills: [...prev.unlockedSkills, skillId]
        }));
    }
  }, [user.skillPoints, user.unlockedSkills]);

  const handleSpendParagonPoint = useCallback((perkId: string) => {
    const perk = PARAGON_PERKS.find(p => p.id === perkId);
    const currentLevel = user.paragonPerks[perkId] || 0;
    if (perk && currentLevel < perk.maxLevel) {
        const cost = perk.cost(currentLevel);
        if (user.paragonPoints >= cost) {
            setUser(prev => ({
                ...prev,
                paragonPoints: prev.paragonPoints - cost,
                paragonPerks: { ...prev.paragonPerks, [perkId]: currentLevel + 1 }
            }));
        }
    }
  }, [user.paragonPerks, user.paragonPoints]);

  const handleAscend = useCallback(() => {
    if (user.level >= 50) {
        const paragonPointsEarned = Math.floor(user.currentXP / 1000) + 1;
        setUser(prev => ({
            ...prev,
            level: 1,
            currentXP: 0,
            isAscended: true,
            rank: RankTitle.Divino,
            paragonPoints: prev.paragonPoints + paragonPointsEarned,
            skillPoints: 0,
            unlockedSkills: [],
        }));
    }
  }, [user.level, user.currentXP, user.paragonPoints]);

  const handleBossAttack = useCallback((type: 'daily' | 'weekly' | 'monthly') => {
    addXP(10 * (type === 'daily' ? 1 : type === 'weekly' ? 5 : 20));
    setUser(prev => ({
        ...prev,
        lastBossAttacks: {
            ...prev.lastBossAttacks,
            [type]: Date.now()
        }
    }));
  }, [addXP]);

  const handlePunish = useCallback((amount: number) => {
      removeXP(amount);
  }, [removeXP]);

  const handleBuy = async (productId: string) => {
      try {
          await buyProduct(productId, { userId: user.email });
      } catch (err: any) {
          console.error("Purchase Error:", err);
          alert(err.message || 'Erro ao iniciar compra');
      }
  };

  const handleUpgrade = async (productId: string) => {
      try {
          await buyProduct(productId, { userId: user.email });
      } catch (err: any) {
          console.error("Upgrade Error:", err);
          alert(err.message || 'Erro ao iniciar upgrade');
      }
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };
  
  const handleLogin = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    const savedUserRaw = localStorage.getItem('hero_360_user');
    if (savedUserRaw) {
        const savedUser = JSON.parse(savedUserRaw);
        if (savedUser.email?.toLowerCase() === email.toLowerCase() && savedUser.password === password) {
            setUser({ ...savedUser, isLoggedIn: true });
            navigate('/app/dashboard');
            return { success: true };
        }
    }
    return { success: false, message: 'Credenciais inválidas.' };
  };
  
  const handleForgotPassword = async (email: string): Promise<{ success: boolean, message: string }> => {
    return { success: true, message: 'Link de recuperação enviado.' };
  };

  const handleAccountSetup = (productId: string, details: { name: string, email: string, password?: string }) => {
      // Determine unlock level based on abstract product ID or fallback to Stripe ID checks
      const isUpgrade = productId === 'mentor_ia' || productId === 'sucesso_360' || productId.includes('price_'); // Fallback for raw price IDs

      if(isUpgrade) {
        setUser(prev => ({ 
            ...prev, 
            hasSubscription: true, 
            // Grant 'soberano' module access if the product is Sucesso 360
            activeModules: (productId === 'sucesso_360' || productId.includes('Sucesso'))
                ? Array.from(new Set([...prev.activeModules, 'soberano' as ProtectionModuleId]))
                : prev.activeModules 
        }));
        navigate('/app/dashboard');
        return;
      }

      const newUser: UserState = {
          ...INITIAL_USER_STATE,
          isLoggedIn: true,
          onboardingCompleted: false,
          name: details.name,
          email: details.email,
          password: details.password,
          hasSubscription: true, // Hero Vitalício implies base subscription
          createdAt: Date.now(),
      };
      setUser(newUser);
      localStorage.setItem('hero_360_user', JSON.stringify(newUser));
      navigate('/onboarding');
  };
  
  const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
    if (!user.isLoggedIn) return <Navigate to="/login" replace />;
    if (!user.onboardingCompleted) return <Navigate to="/onboarding" replace />;
    return children;
  };
  
  const OnboardingRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
    if (!user.isLoggedIn) return <Navigate to="/login" replace />;
    if (user.onboardingCompleted) return <Navigate to="/app/dashboard" replace />;
    return children;
  };

  const isDailyLimitReached = !isToday(user.lastLessonCompletionDate) ? false : user.lessonsCompletedToday >= 3;

  return (
      <>
        {levelUpModalData && levelUpModalData.visible && (
            <LevelUpModal level={levelUpModalData.level} rank={levelUpModalData.rank} onClose={() => setLevelUpModalData(null)} />
        )}
        <Routes>
            <Route path="/" element={<LandingPage onBuy={handleBuy} onGoToLogin={handleGoToLogin} />} />
            <Route path="/login" element={<LoginScreen onLogin={handleLogin} onForgotPassword={handleForgotPassword} onNavigateToLanding={() => navigate('/')} />} />
            <Route path="/payment-success/:productId" element={<PaymentSuccess onAccountSetup={handleAccountSetup} />} />
            
            <Route path="/onboarding" element={
                <OnboardingRoute>
                <Onboarding onComplete={handleOnboardingComplete} />
                </OnboardingRoute>
            } />

            <Route path="/app" element={
                <ProtectedRoute>
                <MainAppLayout user={user} onReset={handleReset} onRedoDiagnosis={handleRedoDiagnosis} />
                </ProtectedRoute>
            }>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<HeroicDashboard user={user} onReset={handleRedoDiagnosis} hasSubscription={user.hasSubscription} onUpgrade={() => handleUpgrade('mentor_ia')} />} />
                <Route path="missions" element={<Missions missions={user.missions} onCompleteMission={handleCompleteMission} loading={isMissionsLoading} />} />
                <Route path="codex" element={<Codex modules={user.modules} onCompleteLesson={handleCompleteLesson} hasSubscription={user.hasSubscription} onUpgrade={() => handleUpgrade('mentor_ia')} isDailyLimitReached={isDailyLimitReached} />} />
                <Route path="guild" element={<Guild user={user} hasSubscription={user.hasSubscription} onUpgrade={() => handleUpgrade('mentor_ia')} onAscend={handleAscend} onBossAttack={handleBossAttack} onPunish={handlePunish} />} />
                <Route path="mentor" element={<IAMentor user={user} hasSubscription={user.hasSubscription} onUpgrade={() => handleUpgrade('mentor_ia')} />} />
                <Route path="journal" element={<Journal entries={user.journalEntries} onAddEntry={handleAddJournalEntry} onUpdateEntry={handleUpdateJournalEntry} userName={user.name} hasSubscription={user.hasSubscription} onUpgrade={() => handleUpgrade('mentor_ia')} />} />
                <Route path="skills" element={<SkillTree user={user} onUnlockSkill={handleUnlockSkill} />} />
                <Route path="pantheon" element={<Pantheon user={user} onSpendPoint={handleSpendParagonPoint} />} />
                <Route path="profile" element={<Profile user={user} onUpdateProfile={(updates) => setUser(p => ({...p, ...updates}))} onDeleteAccount={handleReset} onUpgrade={() => handleUpgrade('mentor_ia')} onPasswordChange={handleForgotPassword} />} />
                <Route path="menu" element={<MobileMenu user={user} onReset={handleReset} />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </>
  );
};

const App: React.FC = () => (
  <HashRouter>
     <AppContent />
  </HashRouter>
);

export default App;
