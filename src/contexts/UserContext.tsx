import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UserState, Archetype, LifeMapCategory, JournalEntry, LessonDetails, Mission, RankTitle, Squad, ProtectionModuleId, ParagonPerk, ChatMessage } from '../types';
import { INITIAL_USER_STATE, STATIC_DAILY_MISSIONS, STATIC_WEEKLY_MISSIONS, MOCK_SQUADS, PRODUCTS, XP_PER_LEVEL_FORMULA, PARAGON_PERKS, SKILL_TREES, STATIC_MILESTONE_MISSIONS, ORACLE_DAILY_MESSAGE_LIMIT } from '../constants';
import { generateDailyMissionsAI, generateWeeklyMissionsAI, generateProactiveOracleGuidance, getMentorChatReply, generateDailyAnalysisAI } from '../services/geminiService';
import { createCheckoutSession } from '../services/paymentService';
import { useError } from './ErrorContext';
import { getRank, isToday, isSameWeek } from '../utils';

import { 
    auth as firebaseAuth,
    db as firebaseDb,
    functions as firebaseFunctions,
    isFirebaseConfigured,
    googleProvider,
    serverTimestamp
} from '../firebase';
import { 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    signInWithPopup, 
    signOut, 
    sendPasswordResetEmail, 
    getAdditionalUserInfo
} from 'firebase/auth';
import { 
    doc, 
    onSnapshot, 
    updateDoc, 
    setDoc, 
    getDoc,
    collection,
    query,
    where,
    limit,
    getDocs,
    writeBatch
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

declare global {
  interface Window {
    fbq: (...args: any[]) => void;
  }
}

interface UserContextType {
  user: UserState;
  squads: Squad[];
  isMissionsLoading: boolean;
  loadingAuth: boolean;
  isProcessingPayment: string;
  levelUpData: { level: number; rank: RankTitle } | null;
  closeLevelUpModal: () => void;
  handleOnboardingComplete: (archetype: Archetype, lifeMapScores: Record<LifeMapCategory, number>, focusAreas: LifeMapCategory[], mapAnalysis?: string) => void;
  handleReset: () => void;
  handleRedoDiagnosis: () => void;
  handleCompleteLesson: (completedLesson: LessonDetails) => void;
  handleAddJournalEntry: (content: string) => void;
  handleUpdateJournalEntry: (id: string, updates: Partial<JournalEntry>) => void;
  handleUnlockSkill: (skillId: string) => void;
  handleSpendParagonPoint: (perkId: string) => void;
  handleAscend: () => void;
  handlePunish: (amount: number) => void;
  handleLogin: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  handleGoogleLogin: () => Promise<{ success: boolean; message?: string }>;
  handleSignUp: (name: string, email: string, password: string, sessionId?: string | null) => Promise<{ success: boolean; message?: string }>;
  handleForgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  handleUpdateUser: (updates: Partial<UserState>) => void;
  handlePurchase: (productId: string) => Promise<void>;
  handleVerifyNewPurchase: (sessionId: string) => Promise<{ success: boolean; name?: string; email?: string; message?: string; }>;
  handleVerifyUpgrade: (sessionId: string) => Promise<{ success: boolean; message?: string }>;
  handleCreateSquad: (name: string, motto: string) => void;
  handleJoinSquad: (squadId: string) => void;
  handleLeaveSquad: (squadId: string) => void;
  handleCompleteMission: (missionId: string) => void;
  handleBossAttack: (bossType: 'daily' | 'weekly' | 'monthly', damage: number) => void;
  handleSendMentorMessage: (message: string, isQuickChat?: boolean) => Promise<void>;
  handleRequestDailyAnalysis: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
};

const FIREBASE_UNCONFIGURED_ERROR = "Funcionalidade indisponível. A conexão com o servidor não foi configurada.";

const MOCK_MASTER_USER_STATE: UserState = {
  ...INITIAL_USER_STATE,
  uid: 'master-user-uid-01',
  isLoggedIn: true,
  name: "Comandante",
  email: 'andreferraz@consegvida.com',
  onboardingCompleted: true,
  archetype: 'O Governante',
  lifeMapScores: {
    'Saúde & Fitness': 10, 'Intelectual': 9, 'Emocional': 8, 'Caráter': 10, 'Espiritual': 9,
    'Amoroso': 8, 'Social': 9, 'Financeiro': 10, 'Carreira': 10,
    'Qualidade de Vida': 9, 'Visão de Vida': 10, 'Família': 8
  },
  level: 60,
  currentXP: 15000,
  rank: RankTitle.Divino,
  isAscended: true,
  hasSubscription: true,
  activeModules: ['soberano', 'tita', 'sabio', 'monge', 'lider'],
  paragonPoints: 100,
  paragonPerks: {
      'xp_boost': 10,
      'stat_boost': 5,
      'mission_reroll': 3,
      'skill_point_mastery': 5
  },
  skillPoints: 20,
  unlockedSkills: ['int_1', 'int_2', 'fit_1', 'fin_1'],
  journalEntries: [
    { id: 'j1', date: Date.now() - 86400000, content: "A revisão estratégica semanal foi concluída. As métricas de engajamento da Guilda aumentaram 15%. O Protocolo Titã está otimizado." },
    { id: 'j2', date: Date.now() - 172800000, content: "Meditação matinal focada na clareza da Visão de Vida. A leitura do 'Meditações' de Marco Aurélio continua a fornecer insights valiosos." }
  ],
  missions: [
      ...STATIC_DAILY_MISSIONS.map((m, i) => ({...m, id: `sd-${i}`, completed: i < 2})),
      ...STATIC_WEEKLY_MISSIONS.map((m, i) => ({...m, id: `sw-${i}`, completed: true})),
      ...STATIC_MILESTONE_MISSIONS.map((m, i) => ({...m, id: `sm-${i}`, completed: true})),
  ],
  dailyGuidance: { date: Date.now(), content: 'Sua disciplina é a forja dos deuses. Continue a ascensão.', type: 'praise' },
  mentorChatHistory: [
      { id: 'msg-1', role: 'model', text: 'Bem vindo de volta, Comandante. Seus sistemas estão operacionais. Qual é a diretriz de hoje?', timestamp: Date.now() }
  ],
  hasPaidBase: true,
  businessRoadmap: [
    { id: 'br1', title: 'Expandir a Guilda para o Setor Alpha', completed: false },
    { id: 'br2', title: 'Otimizar o fluxo de recursos do Protocolo Soberano', completed: true },
  ],
  bioData: { sleepHours: 8, workoutsThisWeek: 5, waterIntake: 3.5 },
  dailyIntention: { id: new Date().toISOString().split('T')[0], text: 'Finalizar o balanço de Pontos Divinos.', completed: true },
  mentorMessagesSentToday: 0,
  lastMentorMessageDate: 0,
};

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserState>(MOCK_MASTER_USER_STATE);
  const [squads, setSquads] = useState<Squad[]>(MOCK_SQUADS);
  const [isMissionsLoading, setIsMissionsLoading] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{ level: number; rank: RankTitle } | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(false); // Set to false to bypass auth check
  const [isProcessingPayment, setIsProcessingPayment] = useState('');
  
  const navigate = useNavigate();
  const { showError } = useError();
  const prevLevelRef = useRef(user.level);
  
  const writeUserUpdate = useCallback(async (updates: Partial<UserState>) => {
    // In dev mode, we just update local state
    setUser(prev => ({...prev, ...updates}));
    console.log("DEV MODE: User update", updates);
    return;
  }, []);

  const addXP = useCallback((xp: number) => {
    setUser(currentUser => {
        if (!currentUser.isLoggedIn) return currentUser;

        let newXP = currentUser.currentXP + xp;
        let newLevel = currentUser.level;
        let newSkillPoints = currentUser.skillPoints;
        let nextLevelXP = XP_PER_LEVEL_FORMULA(newLevel);

        let didLevelUp = false;
        while (newXP >= nextLevelXP) {
            didLevelUp = true;
            newXP -= nextLevelXP;
            newLevel += 1;
            newSkillPoints += 1;
            nextLevelXP = XP_PER_LEVEL_FORMULA(newLevel);
        }
        
        const newRank = getRank(newLevel, currentUser.isAscended);
        if(didLevelUp) {
            setLevelUpData({ level: newLevel, rank: newRank });
        }
        
        const updates = { currentXP: newXP, level: newLevel, skillPoints: newSkillPoints, rank: newRank };
        writeUserUpdate(updates);
        return { ...currentUser, ...updates };
    });
  }, [writeUserUpdate]);
  
  const handlePurchase = async (productId: string) => {
    if (isProcessingPayment) return;
    setIsProcessingPayment(productId);
    try {
        const { sessionUrl } = await createCheckoutSession(productId);
        if (!sessionUrl) {
            throw new Error("O servidor não retornou uma URL de checkout.");
        }
        window.location.href = sessionUrl;
    } catch (err: any) {
        showError(err.message || "Falha ao iniciar o pagamento.");
        setIsProcessingPayment('');
    }
  };

  const handleLogin = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    showError("Login desativado no modo de desenvolvimento.");
    return { success: false, message: "Login desativado no modo de desenvolvimento." };
  };
  
  const handleSignUp = async (name: string, email: string, password: string, sessionId?: string | null): Promise<{success: boolean, message?: string}> => {
      showError("Cadastro desativado no modo de desenvolvimento.");
      return { success: false, message: "Cadastro desativado no modo de desenvolvimento." };
  };

  const handleGoogleLogin = async (): Promise<{ success: boolean; message?: string }> => {
    showError("Login desativado no modo de desenvolvimento.");
    return { success: false, message: "Login desativado no modo de desenvolvimento." };
  };
  
  const handleVerifyNewPurchase = async (sessionId: string): Promise<{ success: boolean; name?: string; email?: string; message?: string; }> => {
      showError("Verificação desativada no modo de desenvolvimento.");
      return { success: false, message: "Verificação desativada no modo de desenvolvimento." };
  };

  const handleVerifyUpgrade = async (sessionId: string) => {
      showError("Verificação desativada no modo de desenvolvimento.");
      return { success: false, message: "Verificação desativada no modo de desenvolvimento." };
  };
  
  const handleBossAttack = (bossType: 'daily' | 'weekly' | 'monthly', damage: number) => {
    console.log(`Attacking ${bossType} boss for ${damage} damage.`);
    addXP(damage);
    const updates = { lastBossAttacks: { ...user.lastBossAttacks, [bossType]: Date.now() }};
    writeUserUpdate(updates);
  };

  const handleCompleteMission = (missionId: string) => { 
    const mission = user.missions.find(m => m.id === missionId && !m.completed);
    if (mission) {
      addXP(mission.xp);
      const updatedMissions = user.missions.map(m => m.id === missionId ? {...m, completed: true, completionDate: Date.now()} : m);
      writeUserUpdate({ missions: updatedMissions });
    }
  };

  const handleOnboardingComplete = (archetype: Archetype, lifeMapScores: Record<LifeMapCategory, number>, focusAreas: LifeMapCategory[], mapAnalysis?: string) => {
      if (typeof window.fbq === 'function') {
        window.fbq('track', 'CompleteRegistration');
      }
      writeUserUpdate({ onboardingCompleted: true, archetype, lifeMapScores, focusAreas, mapAnalysis });
  };
  
  const handleReset = async () => { 
      // In dev mode, this will just reset to the mock state
      setUser(MOCK_MASTER_USER_STATE);
      navigate('/'); 
  };
  
  const handleRedoDiagnosis = () => { 
      writeUserUpdate({ onboardingCompleted: false });
      setUser(prev => ({...prev, onboardingCompleted: false}));
      navigate('/onboarding', { replace: true }); 
  };

  const handleAddJournalEntry = (content: string) => {
    const newEntry: JournalEntry = { id: Date.now().toString(), date: Date.now(), content, isAnalyzed: false };
    const updatedEntries = [newEntry, ...user.journalEntries];
    writeUserUpdate({ journalEntries: updatedEntries });
  };
  
  const handleUpdateJournalEntry = (id: string, updates: Partial<JournalEntry>) => {
    const updatedEntries = user.journalEntries.map(e => e.id === id ? { ...e, ...updates } : e);
    writeUserUpdate({ journalEntries: updatedEntries });
  }

  const handleForgotPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    showError("Recuperação de senha desativada no modo de desenvolvimento.");
    return { success: false, message: "Recuperação de senha desativada no modo de desenvolvimento." };
  };
  
  const handleCompleteLesson = (completedLesson: LessonDetails) => {
    if (user.lessonsCompletedToday >= 3 && !isToday(user.lastLessonCompletionDate)) {
      showError("Limite diário de lições atingido.");
      return;
    }
    addXP(50);
    const updatedModules = user.modules.map(mod => ({
      ...mod,
      lessons: mod.lessons.map(l => l.id === completedLesson.id ? { ...l, completed: true } : l)
    }));
    const updates = {
      modules: updatedModules,
      lessonsCompletedToday: isToday(user.lastLessonCompletionDate) ? user.lessonsCompletedToday + 1 : 1,
      lastLessonCompletionDate: Date.now()
    };
    writeUserUpdate(updates);
  };

  const handleUnlockSkill = (skillId: string) => {
      const allSkills = Object.values(SKILL_TREES).flat();
      const skill = allSkills.find(s => s.id === skillId);
      if (skill && user.skillPoints >= skill.cost && !user.unlockedSkills.includes(skillId)) {
          const updates = {
              skillPoints: user.skillPoints - skill.cost,
              unlockedSkills: [...user.unlockedSkills, skillId]
          };
          writeUserUpdate(updates);
      }
  };
  
  const handleSpendParagonPoint = (perkId: string) => {
      const perk = PARAGON_PERKS.find((p: ParagonPerk) => p.id === perkId);
      const currentLevel = user.paragonPerks[perkId] || 0;
      if (perk && currentLevel < perk.maxLevel) {
          const cost = perk.cost(currentLevel);
          if (user.paragonPoints >= cost) {
              const updates = {
                  paragonPoints: user.paragonPoints - cost,
                  paragonPerks: {
                      ...user.paragonPerks,
                      [perkId]: currentLevel + 1
                  }
              };
              writeUserUpdate(updates);
          }
      }
  };

  const handleAscend = () => {
      if (user.level >= 50 && !user.isAscended) {
          const updates = {
              isAscended: true,
              rank: RankTitle.Divino,
              level: 1,
              currentXP: 0,
              paragonPoints: user.paragonPoints + 10
          };
          writeUserUpdate(updates);
      }
  };
  
  const handlePunish = (amount: number) => {
      const newXP = Math.max(0, user.currentXP - amount);
      writeUserUpdate({ currentXP: newXP });
  };
  
  const handleUpdateUser = (updates: Partial<UserState>) => writeUserUpdate(updates);

  const handleCreateSquad = (name: string, motto: string) => {};
  const handleJoinSquad = (squadId: string) => {};
  const handleLeaveSquad = (squadId: string) => {};
  
  const handleSendMentorMessage = useCallback(async (message: string, isQuickChat: boolean = false) => {
    const currentUser = user;
    const isNewDay = !isToday(currentUser.lastMentorMessageDate);
    const messagesSent = isNewDay ? 0 : currentUser.mentorMessagesSentToday;

    if (messagesSent >= ORACLE_DAILY_MESSAGE_LIMIT) {
        showError("Você atingiu o limite de 5 mensagens diárias para o Oráculo.");
        return;
    }

    const userMessage: ChatMessage = { id: `msg-${Date.now()}`, role: 'user', text: message, timestamp: Date.now(), isQuickChat };
    
    const updatedHistory = [...currentUser.mentorChatHistory, userMessage];
    const updatedCount = messagesSent + 1;

    setUser(prev => ({
        ...prev, 
        mentorChatHistory: updatedHistory,
        mentorMessagesSentToday: updatedCount,
        lastMentorMessageDate: Date.now()
    }));

    try {
        const replyText = await getMentorChatReply(updatedHistory, currentUser);
        const modelMessage: ChatMessage = { id: `msg-${Date.now()+1}`, role: 'model', text: replyText, timestamp: Date.now(), isQuickChat };
        
        writeUserUpdate({ 
            mentorChatHistory: [...updatedHistory, modelMessage],
            mentorMessagesSentToday: updatedCount,
            lastMentorMessageDate: Date.now()
        });
    } catch(err) {
        setUser(prev => ({...prev, mentorChatHistory: currentUser.mentorChatHistory}));
        showError("A conexão com o Oráculo falhou. Tente novamente.");
    }
  }, [user, writeUserUpdate, showError]);

  const handleRequestDailyAnalysis = async () => {
    const analysisText = await generateDailyAnalysisAI({ rank: user.rank, stats: user.stats, journalEntries: user.journalEntries });
    const analysisMessage: ChatMessage = {
      id: `analysis-${Date.now()}`,
      role: 'model',
      text: `**Análise Diária do Oráculo**\n\n${analysisText}`,
      timestamp: Date.now(),
    };
    const lastAnalysisTimestamp = Date.now();
    writeUserUpdate({ 
        mentorChatHistory: [...user.mentorChatHistory, analysisMessage],
        lastAnalysisTimestamp: lastAnalysisTimestamp,
    });
  };

  const value: UserContextType = { user, squads, isMissionsLoading, loadingAuth, isProcessingPayment, levelUpData, closeLevelUpModal: () => setLevelUpData(null), handleOnboardingComplete, handleReset, handleRedoDiagnosis, handleCompleteLesson, handleAddJournalEntry, handleUpdateJournalEntry, handleUnlockSkill, handleSpendParagonPoint, handleAscend, handlePunish, handleLogin, handleGoogleLogin, handleSignUp, handleForgotPassword, handleUpdateUser, handlePurchase, handleVerifyNewPurchase, handleVerifyUpgrade, handleCreateSquad, handleJoinSquad, handleLeaveSquad, handleCompleteMission, handleBossAttack, handleSendMentorMessage, handleRequestDailyAnalysis };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};