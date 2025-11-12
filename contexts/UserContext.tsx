
import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserState, Archetype, LifeMapCategory, JournalEntry, LessonDetails, Mission, Module, RankTitle, Squad, SquadMember } from '../types';
import { INITIAL_USER_STATE, SKILL_TREES, PARAGON_PERKS, STATIC_DAILY_MISSIONS, STATIC_WEEKLY_MISSIONS, STATIC_MILESTONE_MISSIONS, INITIAL_LIFE_MAP_SCORES, MOCK_SQUADS, MIN_LEVEL_TO_CREATE_SQUAD, MAX_SQUAD_SIZE } from '../constants';
import { generateDailyMissionsAI, generateWeeklyMissionsAI, generateMilestoneMissionsAI, generateProactiveOracleGuidance } from '../services/geminiService';
import { buyProduct } from '../services/paymentService';
import { useError } from './ErrorContext';
import { XP_PER_LEVEL_FORMULA, getRank, isToday, isSameWeek } from '../utils';

interface UserContextType {
  user: UserState;
  squads: Squad[];
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
  handleBuy: (productId: string, metadata?: Record<string, any>) => Promise<void>;
  handleUpgrade: (productId: string) => Promise<void>;
  handleCreateSquad: (name: string, motto: string) => void;
  handleJoinSquad: (squadId: string) => void;
  handleLeaveSquad: (squadId: string) => void;
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
  
  const [squads, setSquads] = useState<Squad[]>(() => {
    const saved = localStorage.getItem('hero_squads');
    return saved ? JSON.parse(saved) : MOCK_SQUADS;
  });

  const navigate = useNavigate();
  const location = useLocation();
  const { showError } = useError();
  const [isMissionsLoading, setIsMissionsLoading] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{ level: number; rank: RankTitle } | null>(null);
  const prevLevelRef = useRef(user.level);

  useEffect(() => {
    if (user.isLoggedIn) {
      localStorage.setItem('hero_360_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('hero_360_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('hero_squads', JSON.stringify(squads));
  }, [squads]);
  
  useEffect(() => {
    if (user.isLoggedIn) {
        const isPublicPath = location.pathname === '/' || location.pathname.startsWith('/login') || location.pathname.startsWith('/payment-success');
        if (user.onboardingCompleted) {
            if (isPublicPath || location.pathname.startsWith('/onboarding')) {
                navigate('/app/dashboard', { replace: true });
            }
        } else {
            if (!location.pathname.startsWith('/onboarding')) {
                navigate('/onboarding', { replace: true });
            }
        }
    } else {
        if (location.pathname.startsWith('/app')) {
            navigate('/', { replace: true });
        }
    }
  }, [user.isLoggedIn, user.onboardingCompleted, location.pathname, navigate]);


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
  }, [user.isLoggedIn, user.hasSubscription, user.onboardingCompleted, showError, user.dailyGuidance]);

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
        if (milestoneMissions.length === 0) milestoneMissions = STATIC_MILESTONE_MISSIONS;
        
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
            missions: [...STATIC_DAILY_MISSIONS, ...STATIC_WEEKLY_MISSIONS, ...STATIC_MILESTONE_MISSIONS].map(m => ({...m, completed: false})),
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
    // Navigation is handled by the routing useEffect
  }, []);
  
  const handleReset = useCallback(() => {
    localStorage.clear();
    setUser(INITIAL_USER_STATE);
    setSquads(MOCK_SQUADS);
    navigate('/', { replace: true });
  }, [navigate]);

  const handleRedoDiagnosis = useCallback(() => {
     setUser(prev => ({ ...prev, onboardingCompleted: false, lifeMapScores: INITIAL_LIFE_MAP_SCORES, focusAreas: [], archetype: null, mapAnalysis: undefined }));
     navigate('/onboarding');
  }, [navigate]);
  
  const handleCompleteLesson = useCallback((completedLesson: LessonDetails) => {
    setUser(prev => {
        let completedToday = isToday(prev.lastLessonCompletionDate) ? prev.lessonsCompletedToday : 0;
        if (completedToday >= 3) {
            showError("Limite diário de lições atingido.");
            return prev;
        };
        
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
  }, [addXP, showError]);

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
        setUser(prev => ({ ...prev, level: 1, currentXP: 0, isAscended: true, rank: RankTitle.Divino, paragonPoints: prev.paragonPoints + paragonPointsEarned, skillPoints: 0, unlockedSkills: [] }));
    }
  }, [user.level, user.currentXP, user.paragonPoints]);

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
        try {
            const savedUser = JSON.parse(savedUserRaw);
            if (savedUser.email?.toLowerCase() === email.toLowerCase() && savedUser.password === password) {
                setUser({ ...savedUser, isLoggedIn: true });
                return { success: true };
            }
        } catch (e) {
            console.error("Error parsing user data from localStorage", e);
        }
    }
    return { success: false, message: 'Credenciais inválidas ou herói não encontrado.' };
  }, []);
  
  const handleForgotPassword = useCallback(async (email: string): Promise<{ success: boolean; message: string }> => {
    console.log(`Password reset for ${email}`);
    return { success: true, message: 'Se uma conta existir, um link de recuperação foi enviado.' };
  }, []);

  const handleAccountSetup = useCallback((productId: string, details: { name: string; email: string; password?: string }) => {
      const isUpgrade = productId !== 'hero_vitalicio';

      if(isUpgrade) {
        if (productId === 'mentor_ia') {
          setUser(prev => ({ ...prev, hasSubscription: true }));
        } 
        else if (productId === 'sucesso_360') {
            setUser(prev => ({ ...prev, hasSubscription: true, activeModules: ['soberano', 'tita']}));
        }
        navigate('/app/dashboard');
        return;
      }

      const newUser: UserState = { 
        ...INITIAL_USER_STATE, 
        uid: `user_${Date.now()}`,
        isLoggedIn: true, 
        onboardingCompleted: false,
        name: details.name, 
        email: details.email, 
        password: details.password, 
        createdAt: Date.now() 
      };
      setUser(newUser);
      // Let the routing useEffect handle navigation to /onboarding
  }, [navigate]);

  const handleUpdateUser = useCallback((updates: Partial<UserState>) => {
    setUser(prev => ({ ...prev, ...updates }));
  }, []);

  const handleBuy = async (productId: string, metadata?: Record<string, any>) => {
    try { await buyProduct(productId, metadata); }
    catch (err: any) { showError(err.message || 'Erro ao iniciar compra.'); }
  };
  
  const handleUpgrade = async (productId: string) => {
    try { await buyProduct(productId, { email: user.email }); }
    catch (err: any) { showError(err.message || 'Erro ao iniciar upgrade.'); }
  };
  
  const handleCreateSquad = useCallback((name: string, motto: string) => {
    if (user.level < MIN_LEVEL_TO_CREATE_SQUAD) {
        showError(`Nível ${MIN_LEVEL_TO_CREATE_SQUAD} necessário para criar um esquadrão.`);
        return;
    }
    const newSquad: Squad = {
        id: `squad-${Date.now()}`, name, motto,
        leaderId: user.uid,
        leaderName: user.name,
        members: [{ id: user.uid, name: user.name, rank: user.rank, level: user.level, archetype: user.archetype }],
        createdAt: Date.now(),
    };
    setSquads(prev => [...prev, newSquad]);
    setUser(prev => ({ ...prev, joinedSquadIds: [...prev.joinedSquadIds, newSquad.id] }));
  }, [user, showError]);

  const handleJoinSquad = useCallback((squadId: string) => {
    const squad = squads.find(s => s.id === squadId);
    if (!squad || user.joinedSquadIds.includes(squadId) || squad.members.length >= MAX_SQUAD_SIZE) {
        showError(squad?.members.length >= MAX_SQUAD_SIZE ? "Esquadrão está cheio." : "Não foi possível entrar no esquadrão.");
        return;
    }
    const newMember: SquadMember = { id: user.uid, name: user.name, rank: user.rank, level: user.level, archetype: user.archetype };
    setSquads(prev => prev.map(s => s.id === squadId ? { ...s, members: [...s.members, newMember] } : s));
    setUser(prev => ({ ...prev, joinedSquadIds: [...prev.joinedSquadIds, squadId] }));
  }, [squads, user, showError]);
  
  const handleLeaveSquad = useCallback((squadId: string) => {
    const squad = squads.find(s => s.id === squadId);
    if (!squad) return;

    if (squad.leaderId === user.uid) { // Leader leaves, disband
        setSquads(prev => prev.filter(s => s.id !== squadId));
        setUser(prev => ({ ...prev, joinedSquadIds: prev.joinedSquadIds.filter(id => id !== squadId) }));
    } else { // Member leaves
        setSquads(prev => prev.map(s => s.id === squadId ? { ...s, members: s.members.filter(m => m.id !== user.uid) } : s));
        setUser(prev => ({ ...prev, joinedSquadIds: prev.joinedSquadIds.filter(id => id !== squadId) }));
    }
  }, [squads, user.uid, user.name]);

  const value = { user, squads, isMissionsLoading, levelUpData, closeLevelUpModal, addXP, handleCompleteMission, handleOnboardingComplete, handleReset, handleRedoDiagnosis, handleCompleteLesson, handleAddJournalEntry, handleUpdateJournalEntry, handleUnlockSkill, handleSpendParagonPoint, handleAscend, handleBossAttack, handlePunish, handleLogin, handleForgotPassword, handleAccountSetup, handleUpdateUser, handleBuy, handleUpgrade, handleCreateSquad, handleJoinSquad, handleLeaveSquad };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
