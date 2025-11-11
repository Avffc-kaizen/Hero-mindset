import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserState, Archetype, LifeMapCategory, JournalEntry, LessonDetails, Mission, Module, RankTitle } from '../types';
import { INITIAL_USER_STATE, SKILL_TREES, PARAGON_PERKS, STATIC_DAILY_MISSIONS, STATIC_WEEKLY_MISSIONS, STATIC_MILESTONE_MISSIONS, INITIAL_LIFE_MAP_SCORES } from '../constants';
import { generateDailyMissionsAI, generateWeeklyMissionsAI, generateMilestoneMissionsAI, generateProactiveOracleGuidance } from '../services/geminiService';
import { buyProduct } from '../services/paymentService';
import { useError } from './ErrorContext';
import { XP_PER_LEVEL_FORMULA, getRank, isToday, isSameWeek } from '../utils';

interface UserContextType {
  user: UserState;
  isMissionsLoading: boolean;
  levelUpData: { level: number; rank: RankTitle } | null;
  closeLevelUpModal: () => void;
  addXP: (xp: number) => void;
  handleCompleteMission: (missionId: string) => void;
  handleOnboardingComplete: (archetype: Archetype, lifeMapScores: Record<LifeMapCategory, number>, focusAreas: LifeMapCategory[], mapAnalysis?: string) => void;
  handleReset: () => void;
  handleRedoDiagnosis: () => void;
  handleCompleteLesson: (completedLesson: LessonDetails) => void;
  handleAddJournalEntry: (content: string) => void;
  handleUpdateJournalEntry: (id: string, updates: Partial<JournalEntry>) => void;
  handleUnlockSkill: (skillId: string) => void;
  handleSpendParagonPoint: (perkId: string) => void;
  handleAscend: () => void;
  handleBossAttack: (type: 'daily' | 'weekly' | 'monthly') => void;
  handlePunish: (amount: number) => void;
  handleLogin: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  handleForgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  handleAccountSetup: (productId: string, details: { name: string; email: string; password?: string }) => void;
  handleUpdateUser: (updates: Partial<UserState>) => void;
  handleBuy: (productId: string) => Promise<void>;
  handleUpgrade: (productId: string) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserState>(() => {
    try {
      const saved = localStorage.getItem('hero_360_user');
      if (saved) {
          const parsed = JSON.parse(saved);
          return { ...INITIAL_USER_STATE, ...parsed };
      }
    } catch (e) {
      console.error("Failed to load user state", e);
    }
    return INITIAL_USER_STATE;
  });
  
  const navigate = useNavigate();
  const { showError } = useError();
  const [isMissionsLoading, setIsMissionsLoading] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{ level: number; rank: RankTitle } | null>(null);
  const prevLevelRef = useRef(user.level);

  useEffect(() => {
    if (user.isLoggedIn) {
      localStorage.setItem('hero_360_user', JSON.stringify(user));
    }
  }, [user]);

  useEffect(() => {
    if (user.level > prevLevelRef.current) {
        setLevelUpData({ level: user.level, rank: user.rank });
    }
    prevLevelRef.current = user.level;
  }, [user.level, user.rank]);
  
  const closeLevelUpModal = () => setLevelUpData(null);

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


  useEffect(() => {
      const checkOracleGuidance = async () => {
          if (user.isLoggedIn && user.hasSubscription && user.onboardingCompleted) {
              const lastGuidanceDate = user.dailyGuidance?.date;
              if (!lastGuidanceDate || !isToday(lastGuidanceDate)) {
                  try {
                      const guidance = await generateProactiveOracleGuidance(user);
                      setUser(prev => ({ ...prev, dailyGuidance: guidance }));
                  } catch (e: any) {
                      showError(e.message);
                  }
              }
          }
      };
      checkOracleGuidance();
  }, [user.isLoggedIn, user.hasSubscription, user.onboardingCompleted, showError, user]);

  useEffect(() => {
    const refreshMissions = async () => {
      if (!user.onboardingCompleted || !user.isLoggedIn) return;
      const now = Date.now();
      const needsDaily = !isToday(user.lastDailyMissionRefresh);
      const needsWeekly = !isSameWeek(now, user.lastWeeklyMissionRefresh);
      const needsMilestone = (now - user.lastMilestoneMissionRefresh) > (30 * 24 * 60 * 60 * 1000);
      if (!needsDaily && !needsWeekly && !needsMilestone) return;
      
      setIsMissionsLoading(true);
      
      try {
        let dailyMissions = needsDaily ? (user.hasSubscription ? await generateDailyMissionsAI(user.level, user.rank) : STATIC_DAILY_MISSIONS) : user.missions.filter(m => m.type === 'daily');
        let weeklyMissions = needsWeekly ? (user.hasSubscription ? await generateWeeklyMissionsAI(user.level, user.rank) : STATIC_WEEKLY_MISSIONS) : user.missions.filter(m => m.type === 'weekly');
        let milestoneMissions = needsMilestone ? (user.hasSubscription ? await generateMilestoneMissionsAI(user.level, user.rank, user.stats, user.journalEntries) : STATIC_MILESTONE_MISSIONS) : user.missions.filter(m => m.type === 'milestone');
        
        if (dailyMissions.length === 0) dailyMissions = STATIC_DAILY_MISSIONS;
        if (weeklyMissions.length === 0) weeklyMissions = STATIC_WEEKLY_MISSIONS;
        
        setUser(prev => ({
          ...prev,
          missions: [...dailyMissions.map(m=>({...m, completed:false})), ...weeklyMissions.map(m=>({...m, completed:false})), ...milestoneMissions.map(m=>({...m, completed:false}))],
          lastDailyMissionRefresh: needsDaily ? now : prev.lastDailyMissionRefresh,
          lastWeeklyMissionRefresh: needsWeekly ? now : prev.lastWeeklyMissionRefresh,
          lastMilestoneMissionRefresh: needsMilestone ? now : prev.lastMilestoneMissionRefresh
        }));
      } catch (error: any) { 
        showError("Falha ao gerar missões. Usando protocolo padrão.");
        // Fallback to static missions on any error
        setUser(prev => ({
            ...prev,
            missions: [...STATIC_DAILY_MISSIONS, ...STATIC_WEEKLY_MISSIONS, ...STATIC_MILESTONE_MISSIONS],
            lastDailyMissionRefresh: needsDaily ? now : prev.lastDailyMissionRefresh,
            lastWeeklyMissionRefresh: needsWeekly ? now : prev.lastWeeklyMissionRefresh,
            lastMilestoneMissionRefresh: needsMilestone ? now : prev.lastMilestoneMissionRefresh
        }));
      } finally { 
        setIsMissionsLoading(false); 
      }
    };
    refreshMissions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.onboardingCompleted, user.isLoggedIn, user.hasSubscription, user.level]);

  const handleCompleteMission = useCallback((missionId: string) => {
    const mission = user.missions.find(m => m.id === missionId);
    if (mission && !mission.completed) {
      addXP(mission.xp);
      setUser(prevUser => ({ ...prevUser, missions: prevUser.missions.map(m => m.id === missionId ? { ...m, completed: true } : m) }));
    }
  }, [addXP, user.missions]);

  const handleOnboardingComplete = useCallback((archetype: Archetype, lifeMapScores: Record<LifeMapCategory, number>, focusAreas: LifeMapCategory[], mapAnalysis?: string) => {
    setUser(prev => ({ ...prev, onboardingCompleted: true, archetype, lifeMapScores, focusAreas, mapAnalysis }));
    navigate('/app/dashboard', { replace: true });
  }, [navigate]);
  
  const handleReset = useCallback(() => {
    localStorage.clear();
    setUser(INITIAL_USER_STATE);
    navigate('/', { replace: true });
  }, [navigate]);

  const handleRedoDiagnosis = useCallback(() => {
     setUser(prev => ({ ...prev, onboardingCompleted: false, lifeMapScores: INITIAL_LIFE_MAP_SCORES, focusAreas: [], archetype: null }));
     navigate('/onboarding');
  }, [navigate]);
  
  const handleCompleteLesson = useCallback((completedLesson: LessonDetails) => {
    setUser(prev => {
        let completedToday = isToday(prev.lastLessonCompletionDate) ? prev.lessonsCompletedToday : 0;
        if (completedToday >= 3) return prev;
        
        addXP(50);
        
        const newModules = JSON.parse(JSON.stringify(prev.modules));
        const allLessonsFlat: LessonDetails[] = newModules.flatMap((mod: Module) => mod.lessons);
        const completedLessonIndex = allLessonsFlat.findIndex(l => l.id === completedLesson.id);

        if (completedLessonIndex !== -1) {
            allLessonsFlat[completedLessonIndex].completed = true;
            if (completedLessonIndex + 1 < allLessonsFlat.length) {
                allLessonsFlat[completedLessonIndex + 1].locked = false;
            }
        }
        return { ...prev, modules: newModules, lessonsCompletedToday: completedToday + 1, lastLessonCompletionDate: Date.now() };
    });
  }, [addXP]);

  const handleAddJournalEntry = useCallback((content: string) => {
     setUser(prev => ({ ...prev, journalEntries: [{ id: Date.now().toString(), date: Date.now(), content, isAnalyzed: false }, ...prev.journalEntries] }))
  }, []);

  const handleUpdateJournalEntry = useCallback((id: string, updates: Partial<JournalEntry>) => {
    setUser(prev => ({ ...prev, journalEntries: prev.journalEntries.map(e => e.id === id ? { ...e, ...updates } : e) }));
  }, []);
  
  const handleUnlockSkill = useCallback((skillId: string) => {
    const skill = Object.values(SKILL_TREES).flat().find(s => s.id === skillId);
    if (skill && user.skillPoints >= skill.cost && !user.unlockedSkills.includes(skillId)) {
        setUser(prev => ({ ...prev, skillPoints: prev.skillPoints - skill.cost, unlockedSkills: [...prev.unlockedSkills, skillId] }));
    }
  }, [user.skillPoints, user.unlockedSkills]);

  const handleSpendParagonPoint = useCallback((perkId: string) => {
    const perk = PARAGON_PERKS.find(p => p.id === perkId);
    const currentLevel = user.paragonPerks[perkId] || 0;
    if (perk && currentLevel < perk.maxLevel) {
        const cost = perk.cost(currentLevel);
        if (user.paragonPoints >= cost) {
            setUser(prev => ({ ...prev, paragonPoints: prev.paragonPoints - cost, paragonPerks: { ...prev.paragonPerks, [perkId]: currentLevel + 1 } }));
        }
    }
  }, [user.paragonPerks, user.paragonPoints]);

  const handleAscend = useCallback(() => {
    if (user.level >= 50) {
        const paragonPointsEarned = Math.floor(user.currentXP / 1000) + 1;
        setUser(prev => ({ ...prev, level: 1, currentXP: 0, isAscended: true, rank: 'Divino', paragonPoints: prev.paragonPoints + paragonPointsEarned, skillPoints: 0, unlockedSkills: [] }));
    }
  }, [user.level, user.currentXP]);

  const handleBossAttack = useCallback((type: 'daily' | 'weekly' | 'monthly') => {
    addXP(10 * (type === 'daily' ? 1 : type === 'weekly' ? 5 : 20));
    setUser(prev => ({ ...prev, lastBossAttacks: { ...prev.lastBossAttacks, [type]: Date.now() } }));
  }, [addXP]);

  const handlePunish = useCallback((amount: number) => { 
    removeXP(amount);
    showError(`Punição aplicada: -${amount} XP por quebra de protocolo.`);
  }, [removeXP, showError]);

  const handleLogin = useCallback(async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
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
  }, [navigate]);
  
  const handleForgotPassword = useCallback(async (email: string): Promise<{ success: boolean, message: string }> => {
    return { success: true, message: 'Se uma conta existir, um link de recuperação foi enviado.' };
  }, []);

  const handleAccountSetup = useCallback((productId: string, details: { name: string; email: string; password?: string }) => {
      const isUpgrade = productId !== 'hero_vitalicio';

      if(isUpgrade) {
        setUser(prev => ({ ...prev, hasSubscription: true, activeModules: ['soberano'] })); // Simplified for now
        navigate('/app/dashboard');
        return;
      }

      const newUser = { ...INITIAL_USER_STATE, isLoggedIn: true, name: details.name, email: details.email, password: details.password, hasSubscription: true, createdAt: Date.now() };
      setUser(newUser);
      localStorage.setItem('hero_360_user', JSON.stringify(newUser));
      navigate('/onboarding');
  }, [navigate]);

  const handleUpdateUser = useCallback((updates: Partial<UserState>) => {
    setUser(prev => ({ ...prev, ...updates }));
  }, []);

  const handleBuy = async (productId: string) => {
    try { await buyProduct(productId); }
    catch (err: any) { showError(err.message || 'Erro ao iniciar compra.'); }
  };
  const handleUpgrade = async (productId: string) => {
    try { await buyProduct(productId, { userId: user.email }); }
    catch (err: any) { showError(err.message || 'Erro ao iniciar upgrade.'); }
  };

  const value = { user, isMissionsLoading, levelUpData, closeLevelUpModal, addXP, handleCompleteMission, handleOnboardingComplete, handleReset, handleRedoDiagnosis, handleCompleteLesson, handleAddJournalEntry, handleUpdateJournalEntry, handleUnlockSkill, handleSpendParagonPoint, handleAscend, handleBossAttack, handlePunish, handleLogin, handleForgotPassword, handleAccountSetup, handleUpdateUser, handleBuy, handleUpgrade };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};