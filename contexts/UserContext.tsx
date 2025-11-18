import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UserState, Archetype, LifeMapCategory, JournalEntry, LessonDetails, Mission, RankTitle, Squad, ProtectionModuleId, ParagonPerk, ChatMessage } from '../types';
import { INITIAL_USER_STATE, STATIC_DAILY_MISSIONS, STATIC_WEEKLY_MISSIONS, MOCK_SQUADS, PRODUCTS, XP_PER_LEVEL_FORMULA, PARAGON_PERKS, SKILL_TREES, STATIC_MILESTONE_MISSIONS, ORACLE_DAILY_MESSAGE_LIMIT } from '../constants';
import { generateDailyMissionsAI, generateWeeklyMissionsAI, generateProactiveOracleGuidance, getMentorChatReply, generateDailyAnalysisAI } from '../services/geminiService';
import { createCheckoutSession } from '../services/paymentService';
import { useError } from './ErrorContext';
import { getRank, isToday, isSameWeek } from '../src/utils';

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
  const userDocUnsubscribe = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured || !firebaseAuth || !firebaseDb) {
      showError(FIREBASE_UNCONFIGURED_ERROR);
      setLoadingAuth(false);
      return;
    }

    const authUnsubscribe = onAuthStateChanged(firebaseAuth, (userAuth) => {
      if (userDocUnsubscribe.current) {
        userDocUnsubscribe.current();
        userDocUnsubscribe.current = null;
      }

      if (userAuth) {
        const userDocRef = doc(firebaseDb, "users", userAuth.uid);
        userDocUnsubscribe.current = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data() as UserState; // Cast to UserState
             setUser({
                ...INITIAL_USER_STATE,
                ...userData,
                uid: userAuth.uid,
                email: userAuth.email || userData.email, // Prefer auth email but fallback
                isLoggedIn: true,
            });
          } else {
            console.warn("User authenticated but no Firestore document found. Logging out.");
            signOut(firebaseAuth);
          }
          setLoadingAuth(false);
        }, (error) => {
          console.error("Error listening to user document:", error);
          showError("Erro ao carregar dados do usuário.");
          signOut(firebaseAuth);
          setLoadingAuth(false);
        });
      } else {
        setUser(INITIAL_USER_STATE);
        setLoadingAuth(false);
      }
    });

    return () => {
      authUnsubscribe();
      if (userDocUnsubscribe.current) {
        userDocUnsubscribe.current();
      }
    };
  }, [showError]);
  
  const writeUserUpdate = useCallback(async (updates: Partial<UserState>) => {
    if (!user.uid || !isFirebaseConfigured || !firebaseDb) return;
    const userDocRef = doc(firebaseDb, "users", user.uid);
    try {
      await updateDoc(userDocRef, updates);
    } catch (error) {
      console.error("Error updating user document:", error);
      showError("Falha ao salvar o progresso.");
    }
  }, [user.uid, showError]);

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
    if (!isFirebaseConfigured || !firebaseAuth) {
        showError(FIREBASE_UNCONFIGURED_ERROR);
        return { success: false, message: FIREBASE_UNCONFIGURED_ERROR };
    }
    try {
        await signInWithEmailAndPassword(firebaseAuth, email, password);
        return { success: true };
    } catch (error: any) {
        console.error("Login Error:", error);
        let message = "Ocorreu um erro. Tente novamente.";
        if (['auth/user-not-found', 'auth/wrong-password', 'auth/invalid-credential'].includes(error.code)) {
            message = "Email ou senha inválidos.";
        }
        showError(message);
        return { success: false, message };
    }
  };
  
  const handleSignUp = async (name: string, email: string, password: string): Promise<{success: boolean, message?: string}> => {
      if (!isFirebaseConfigured || !firebaseAuth || !firebaseDb) {
        showError(FIREBASE_UNCONFIGURED_ERROR);
        return { success: false, message: FIREBASE_UNCONFIGURED_ERROR };
    }
    
    const purchaseQuery = query(
        collection(firebaseDb, 'purchases'),
        where('email', '==', email.toLowerCase()),
        where('status', '==', 'verified_for_signup'),
        limit(1)
    );
    const purchaseSnap = await getDocs(purchaseQuery);
    if (purchaseSnap.empty) {
        const message = 'Acesso negado. É necessário adquirir o Acesso Vitalício antes de criar uma conta.';
        showError(message);
        return { success: false, message };
    }
    
    try {
        const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        const { user: userAuth } = userCredential;

        const userDocRef = doc(firebaseDb, "users", userAuth.uid);
        const newUserDoc = {
            ...INITIAL_USER_STATE,
            uid: userAuth.uid, name, email: email.toLowerCase(),
            createdAt: serverTimestamp(), hasPaidBase: true,
        };
        
        const batch = writeBatch(firebaseDb);
        batch.set(userDocRef, newUserDoc);
        
        const purchaseDoc = purchaseSnap.docs[0];
        batch.update(purchaseDoc.ref, { status: 'claimed', uid: userAuth.uid, claimedAt: serverTimestamp() });

        await batch.commit();

        if (typeof window.fbq === 'function') { window.fbq('track', 'CompleteRegistration'); }
        return { success: true };
    } catch (error: any) {
        console.error("Signup Error:", error);
        let message = "Ocorreu um erro. Tente novamente.";
        if (error.code === 'auth/email-already-in-use') { message = "Este email já está em uso. Tente fazer login."; } 
        else if (error.code === 'auth/weak-password') { message = "A senha é muito fraca. Use pelo menos 6 caracteres."; }
        showError(message);
        return { success: false, message };
    }
  };

  const handleGoogleLogin = async (): Promise<{ success: boolean; message?: string }> => {
    if (!isFirebaseConfigured || !firebaseAuth || !firebaseDb || !googleProvider) {
        showError(FIREBASE_UNCONFIGURED_ERROR);
        return { success: false, message: FIREBASE_UNCONFIGURED_ERROR };
    }
    try {
        const result = await signInWithPopup(firebaseAuth, googleProvider);
        const { user: userAuth } = result;
        const additionalInfo = getAdditionalUserInfo(result);
        const email = (userAuth.email || '').toLowerCase();
        
        if (additionalInfo?.isNewUser) {
             const purchaseQuery = query(collection(firebaseDb, 'purchases'), where('email', '==', email), where('status', '==', 'verified_for_signup'), limit(1));
            const purchaseSnap = await getDocs(purchaseQuery);
            if (purchaseSnap.empty) {
                await signOut(firebaseAuth);
                const message = 'Acesso negado. Adquira o Acesso Vitalício antes de criar uma conta.';
                showError(message);
                return { success: false, message };
            }
            
            const userDocRef = doc(firebaseDb, "users", userAuth.uid);
            const newUserDoc = {
                ...INITIAL_USER_STATE, uid: userAuth.uid, name: userAuth.displayName || email.split('@')[0], email: email,
                createdAt: serverTimestamp(), hasPaidBase: true,
            };
            
            const batch = writeBatch(firebaseDb);
            batch.set(userDocRef, newUserDoc);
            batch.update(purchaseSnap.docs[0].ref, { status: 'claimed', uid: userAuth.uid, claimedAt: serverTimestamp() });
            await batch.commit();

            if (typeof window.fbq === 'function') { window.fbq('track', 'CompleteRegistration'); }
        }
        return { success: true };
    } catch (error: any) {
        console.error("Google Login Error:", error);
        let message = "Falha no login com o Google.";
        if (error.code === 'auth/popup-closed-by-user') { message = 'Login com Google cancelado.'; } 
        else if (error.code === 'auth/account-exists-with-different-credential') { message = 'Já existe uma conta com este email. Faça login com email e senha.'; }
        showError(message);
        return { success: false, message };
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
      const updatedMissions = user.missions.map(m => m.id === missionId ? {...m, completed: true, completionDate: Date.now()} : m);
      writeUserUpdate({ missions: updatedMissions });
    }
  };

  const handleOnboardingComplete = (archetype: Archetype, lifeMapScores: Record<LifeMapCategory, number>, focusAreas: LifeMapCategory[], mapAnalysis?: string) => {
      writeUserUpdate({ onboardingCompleted: true, archetype, lifeMapScores, focusAreas, mapAnalysis });
  };
  
  const handleReset = async () => { 
      if (!isFirebaseConfigured || !firebaseAuth) {
        showError("Firebase não configurado. Impossível sair.");
        return;
      }
      try {
        await signOut(firebaseAuth);
        navigate('/');
      } catch (error) {
        console.error("Logout Error:", error);
        showError("Erro ao sair da conta.");
      }
  };
  
  const handleRedoDiagnosis = () => { 
      writeUserUpdate({ onboardingCompleted: false });
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
    if (!isFirebaseConfigured || !firebaseAuth) {
        const message = "Serviço indisponível.";
        showError(message);
        return { success: false, message };
    }
    try {
        await sendPasswordResetEmail(firebaseAuth, email);
        return { success: true, message: "Link de recuperação enviado para seu email." };
    } catch (error: any) {
        console.error("Password Reset Error:", error);
        let message = "Falha ao enviar email. Tente novamente.";
        if (error.code === 'auth/user-not-found') {
            message = "Nenhum usuário encontrado com este email.";
        }
        showError(message);
        return { success: false, message };
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
  
  const handleSendMentorMessage = useCallback(async (message: string, isQuickChat: boolean = false) => {
    const isNewDay = !isToday(user.lastMentorMessageDate);
    const messagesSent = isNewDay ? 0 : user.mentorMessagesSentToday;

    if (messagesSent >= ORACLE_DAILY_MESSAGE_LIMIT) {
        showError("Você atingiu o limite de 5 mensagens diárias para o Oráculo.");
        throw new Error("Message limit reached");
    }

    const userMessage: ChatMessage = { id: `msg-${Date.now()}`, role: 'user', text: message, timestamp: Date.now(), isQuickChat };
    
    const updatedHistory = [...user.mentorChatHistory, userMessage];
    const updatedCount = messagesSent + 1;
    
    // Optimistically update UI
    setUser(prev => ({ ...prev, mentorChatHistory: updatedHistory }));

    try {
        const replyText = await getMentorChatReply(updatedHistory, user);
        const modelMessage: ChatMessage = { id: `msg-${Date.now()+1}`, role: 'model', text: replyText, timestamp: Date.now(), isQuickChat };
        
        writeUserUpdate({ 
            mentorChatHistory: [...updatedHistory, modelMessage],
            mentorMessagesSentToday: updatedCount,
            lastMentorMessageDate: Date.now()
        });
    } catch(err) {
        // Revert optimistic update on failure
        setUser(prev => ({...prev, mentorChatHistory: user.mentorChatHistory}));
        showError("A conexão com o Oráculo falhou. Tente novamente.");
        throw err;
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
    writeUserUpdate({ 
        mentorChatHistory: [...user.mentorChatHistory, analysisMessage],
        lastAnalysisTimestamp: Date.now(),
    });
  };

  const value: UserContextType = { user, squads, isMissionsLoading, loadingAuth, isProcessingPayment, levelUpData, closeLevelUpModal: () => setLevelUpData(null), handleOnboardingComplete, handleReset, handleRedoDiagnosis, handleCompleteLesson, handleAddJournalEntry, handleUpdateJournalEntry, handleUnlockSkill, handleSpendParagonPoint, handleAscend, handlePunish, handleLogin, handleGoogleLogin, handleSignUp, handleForgotPassword, handleUpdateUser, handlePurchase, handleCreateSquad, handleJoinSquad, handleLeaveSquad, handleCompleteMission, handleBossAttack, handleSendMentorMessage, handleRequestDailyAnalysis };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};