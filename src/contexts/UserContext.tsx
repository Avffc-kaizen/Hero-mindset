import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UserState, Archetype, LifeMapCategory, JournalEntry, LessonDetails, Mission, RankTitle, Squad, ProtectionModuleId, ParagonPerk, ChatMessage } from '../types';
import { INITIAL_USER_STATE, STATIC_DAILY_MISSIONS, STATIC_WEEKLY_MISSIONS, MOCK_SQUADS, PRODUCTS, XP_PER_LEVEL_FORMULA, PARAGON_PERKS, SKILL_TREES } from '../constants';
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

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserState>(INITIAL_USER_STATE);
  const [squads, setSquads] = useState<Squad[]>(MOCK_SQUADS);
  const [isMissionsLoading, setIsMissionsLoading] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{ level: number; rank: RankTitle } | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState('');
  
  const navigate = useNavigate();
  const { showError } = useError();
  const prevLevelRef = useRef(user.level);
  
  const writeUserUpdate = useCallback(async (updates: Partial<UserState>) => {
    const auth = firebaseAuth;
    const db = firebaseDb;
    if (!auth?.currentUser || !db) return;
    const userDocRef = doc(db, "users", auth.currentUser.uid);
    try {
      await updateDoc(userDocRef, { ...updates, updatedAt: serverTimestamp() });
    } catch (err) {
      console.error("Firestore update failed:", err);
      showError("Falha ao salvar seu progresso.");
    }
  }, [showError]);

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
    const auth = firebaseAuth;
    if (!auth) return { success: false, message: FIREBASE_UNCONFIGURED_ERROR };
    try { 
      await signInWithEmailAndPassword(auth, email, password); 
      return { success: true }; 
    } catch (error: any) {
      return { success: false, message: "Email ou Senha de Comando inválidos." }; 
    }
  };
  
  const handleSignUp = async (name: string, email: string, password: string, sessionId?: string | null): Promise<{success: boolean, message?: string}> => {
      const auth = firebaseAuth;
      const db = firebaseDb;
      if (!auth || !db) return { success: false, message: FIREBASE_UNCONFIGURED_ERROR };
      try {
          let purchaseDocRef;
          
          if (sessionId) {
              const specificPurchaseRef = doc(db, "purchases", sessionId);
              const purchaseDoc = await getDoc(specificPurchaseRef);
              if (purchaseDoc.exists() && purchaseDoc.data().email.toLowerCase() === email.toLowerCase() && purchaseDoc.data().status === 'verified_for_signup') {
                  purchaseDocRef = purchaseDoc.ref;
              } else {
                   return { success: false, message: 'A sessão de compra é inválida, não corresponde a este email ou já foi utilizada.' };
              }
          } else {
              // Fallback for generic flow (e.g., Eduzz or manual)
              const purchasesRef = collection(db, 'purchases');
              const q = query(purchasesRef, where("email", "==", email.toLowerCase()), where("status", "==", "verified_for_signup"), limit(1));
              const purchaseSnap = await getDocs(q);

              if (purchaseSnap.empty) {
                  return { success: false, message: 'Nenhuma compra verificada foi encontrada para este email. Garanta seu acesso e tente novamente.' };
              }
              purchaseDocRef = purchaseSnap.docs[0].ref;
          }
          
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const userDocRef = doc(db, "users", userCredential.user.uid);
          
          const newUserState = {
            ...INITIAL_USER_STATE,
            uid: userCredential.user.uid,
            name: name,
            email: email,
            createdAt: Date.now(),
            hasPaidBase: true,
          };

          const batch = writeBatch(db);
          batch.set(userDocRef, { ...newUserState, createdAt: serverTimestamp() });
          batch.update(purchaseDocRef, { status: 'claimed', uid: userCredential.user.uid });
          await batch.commit();

          setUser(newUserState); // Immediately update local state
          return { success: true };
      } catch (error: any) {
          if (error.code === 'auth/email-already-in-use') {
              return { success: false, message: 'Este email já está em uso.' };
          }
          console.error("SignUp error:", error);
          return { success: false, message: 'Falha ao criar a conta.' };
      }
  };

  const handleGoogleLogin = async (): Promise<{ success: boolean; message?: string }> => {
    const auth = firebaseAuth;
    const db = firebaseDb;
    if (!auth || !googleProvider || !db) return { success: false, message: FIREBASE_UNCONFIGURED_ERROR };
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const { isNewUser } = getAdditionalUserInfo(result);
      const userDocRef = doc(db, "users", result.user.uid);

      if (isNewUser) {
        const purchasesRef = collection(db, 'purchases');
        const q = query(purchasesRef, where("email", "==", result.user.email), where("status", "==", "verified_for_signup"), limit(1));
        const purchaseSnap = await getDocs(q);
        
        if (purchaseSnap.empty) {
            await signOut(auth);
            return { success: false, message: 'Conta não encontrada. Por favor, compre o acesso ou use o email da compra.' };
        }

        const purchaseDocRef = purchaseSnap.docs[0].ref;
        const newUserState = {
            ...INITIAL_USER_STATE,
            uid: result.user.uid,
            name: result.user.displayName || "Herói",
            email: result.user.email,
            hasPaidBase: true,
        };

        const batch = writeBatch(db);
        batch.set(userDocRef, { ...newUserState, createdAt: serverTimestamp() });
        batch.update(purchaseDocRef, { status: 'claimed', uid: result.user.uid });
        await batch.commit();
      }
      return { success: true };
    } catch (error: any) {
      console.error("Google Login Error:", error);
      return { success: false, message: 'Falha no login com Google. Verifique se pop-ups estão bloqueados.' };
    }
  };
  
  const handleVerifyNewPurchase = async (sessionId: string): Promise<{ success: boolean; name?: string; email?: string; message?: string; }> => {
      const db = firebaseDb;
      if (!db) return { success: false, message: FIREBASE_UNCONFIGURED_ERROR };

      const retries = 5;
      const delay = 2000; // 2 seconds

      for (let i = 0; i < retries; i++) {
          try {
              const purchaseRef = doc(db, "purchases", sessionId);
              const purchaseDoc = await getDoc(purchaseRef);

              if (purchaseDoc.exists() && purchaseDoc.data().status === 'verified_for_signup') {
                  const data = purchaseDoc.data();
                  return { success: true, name: data.name, email: data.email };
              }
          } catch (error) {
              console.error(`Tentativa de verificação ${i + 1} falhou:`, error);
          }
          
          if (i < retries - 1) {
              await new Promise(resolve => setTimeout(resolve, delay));
          }
      }

      return { success: false, message: "Não foi possível verificar sua compra. Isso pode levar alguns minutos. Se o problema persistir, contate o suporte." };
  };

  const handleVerifyUpgrade = async (sessionId: string) => {
      const db = firebaseDb;
      const auth = firebaseAuth;
      if (!db || !auth?.currentUser) return { success: false, message: "Você precisa estar logado para fazer um upgrade." };
      try {
          const purchaseRef = doc(db, "purchases", sessionId);
          const purchaseDoc = await getDoc(purchaseRef);
          
          if (purchaseDoc.exists() && purchaseDoc.data().uid === auth.currentUser.uid) {
              return { success: true };
          }
          return { success: false, message: "Upgrade não pôde ser verificado."};
      } catch (error) {
          return { success: false, message: "Erro ao verificar o upgrade."};
      }
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
      const updatedMissions = user.missions.map(m => m.id === missionId ? {...m, completed: true} : m);
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
      const auth = firebaseAuth;
      if (auth) await signOut(auth); 
      setUser(INITIAL_USER_STATE);
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
    const auth = firebaseAuth;
    if (!auth) return { success: false, message: FIREBASE_UNCONFIGURED_ERROR };
    try { 
      await sendPasswordResetEmail(auth, email); 
      return { success: true, message: 'Se uma conta existir, um link de recuperação foi enviado.' }; 
    } catch (error: any) { 
        return { success: false, message: 'Falha ao enviar o email.' }; 
    }
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
  
  const handleSendMentorMessage = async (message: string, isQuickChat: boolean = false) => {
    const userMessage: ChatMessage = { id: `msg-${Date.now()}`, role: 'user', text: message, timestamp: Date.now(), isQuickChat };
    const updatedHistory = [...user.mentorChatHistory, userMessage];
    setUser(prev => ({...prev, mentorChatHistory: updatedHistory})); // Optimistic update

    try {
        const replyText = await getMentorChatReply(updatedHistory, user);
        const modelMessage: ChatMessage = { id: `msg-${Date.now()+1}`, role: 'model', text: replyText, timestamp: Date.now(), isQuickChat };
        writeUserUpdate({ mentorChatHistory: [...updatedHistory, modelMessage] });
    } catch(err) {
        setUser(prev => ({...prev, mentorChatHistory: user.mentorChatHistory})); // Revert on error
        throw err;
    }
  };

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

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoadingAuth(false);
      return;
    }
    const auth = firebaseAuth;
    if (!auth) {
        setLoadingAuth(false);
        return;
    }
    const unsubscribe = onAuthStateChanged(auth, authUser => {
      let userSnapshotUnsubscribe: (() => void) | null = null;
      const db = firebaseDb;
      if (authUser && db) {
        const userDocRef = doc(db, 'users', authUser.uid);
        userSnapshotUnsubscribe = onSnapshot(userDocRef, userDoc => {
          if (userDoc.exists()) {
            const userData = userDoc.data() as UserState;
            setUser({
                ...INITIAL_USER_STATE,
                ...userData,
                createdAt: userData.createdAt?.toMillis ? userData.createdAt.toMillis() : userData.createdAt,
                uid: authUser.uid, 
                isLoggedIn: true, 
                email: authUser.email || ''
            });
          }
          setLoadingAuth(false);
        });
      } else {
        setUser(INITIAL_USER_STATE);
        setLoadingAuth(false);
      }
      return () => { if (userSnapshotUnsubscribe) userSnapshotUnsubscribe(); };
    });
    return () => unsubscribe();
  }, []);

  const value: UserContextType = { user, squads, isMissionsLoading, loadingAuth, isProcessingPayment, levelUpData, closeLevelUpModal: () => setLevelUpData(null), handleOnboardingComplete, handleReset, handleRedoDiagnosis, handleCompleteLesson, handleAddJournalEntry, handleUpdateJournalEntry, handleUnlockSkill, handleSpendParagonPoint, handleAscend, handlePunish, handleLogin, handleGoogleLogin, handleSignUp, handleForgotPassword, handleUpdateUser, handlePurchase, handleVerifyNewPurchase, handleVerifyUpgrade, handleCreateSquad, handleJoinSquad, handleLeaveSquad, handleCompleteMission, handleBossAttack, handleSendMentorMessage, handleRequestDailyAnalysis };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
