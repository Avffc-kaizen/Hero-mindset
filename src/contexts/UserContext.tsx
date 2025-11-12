
import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { UserState, Archetype, LifeMapCategory, JournalEntry, LessonDetails, Mission, Module, RankTitle, Squad, SquadMember } from '../types';
import { INITIAL_USER_STATE, SKILL_TREES, PARAGON_PERKS, STATIC_DAILY_MISSIONS, STATIC_WEEKLY_MISSIONS, STATIC_MILESTONE_MISSIONS, INITIAL_LIFE_MAP_SCORES, MOCK_SQUADS, MIN_LEVEL_TO_CREATE_SQUAD, MAX_SQUAD_SIZE } from '../constants';
import { generateDailyMissionsAI, generateWeeklyMissionsAI, generateMilestoneMissionsAI, generateProactiveOracleGuidance } from '../services/geminiService';
import { buyProduct } from '../services/paymentService';
import { useError } from './ErrorContext';
import { XP_PER_LEVEL_FORMULA, getRank, isToday, isSameWeek } from '../utils';
import { auth, db, functions, isFirebaseConfigured } from '../firebase';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

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
  handleAccountSetup: (name: string, email: string, password?: string) => Promise<{ success: boolean; message?: string; user?: FirebaseUser }>;
  handleUpdateUser: (updates: Partial<UserState>) => void;
  handleBuy: (productId: string, metadata?: Record<string, any>) => Promise<void>;
  handleUpgrade: (productId: string) => Promise<void>;
  handleFinalizePurchase: (sessionId: string) => Promise<{ success: boolean }>;
  handleVerifyNewPurchase: (sessionId: string) => Promise<{ success: boolean; name?: string; email?: string; message?: string; }>;
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

const FIREBASE_UNCONFIGURED_ERROR = "Funcionalidade indisponível. A conexão com o servidor principal não foi configurada corretamente.";

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserState>(INITIAL_USER_STATE);
  const [squads, setSquads] = useState<Squad[]>(MOCK_SQUADS); // Squads still mock for now
  const [isMissionsLoading, setIsMissionsLoading] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{ level: number; rank: RankTitle } | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { showError } = useError();
  const prevLevelRef = useRef(user.level);
  
  const writeUserUpdate = useCallback(async (updates: Partial<UserState>) => {
    const currentUser = auth.currentUser;
    if (currentUser && isFirebaseConfigured) {
      const userDocRef = doc(db, "users", currentUser.uid);
      try {
        // Prevent overwriting server timestamp on local state update
        const { createdAt, ...clientSafeUpdates } = updates;
        
        // FIX: Remove undefined values to prevent Firestore errors.
        const cleanUpdates: { [key: string]: any } = {};
        Object.keys(clientSafeUpdates).forEach(keyStr => {
          const key = keyStr as keyof typeof clientSafeUpdates;
          if (clientSafeUpdates[key] !== undefined) {
            cleanUpdates[key] = clientSafeUpdates[key];
          }
        });

        if (Object.keys(cleanUpdates).length > 0) {
            await updateDoc(userDocRef, { ...cleanUpdates, updatedAt: serverTimestamp() });
        }
      } catch (err) {
        console.error("Firestore update failed:", err);
        showError("Falha ao salvar seu progresso. Verifique a conexão.");
      }
    }
  }, [showError]);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoadingAuth(false);
      return;
    }
    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      let snapshotUnsubscribe: (() => void) | null = null;
      
      const cleanup = () => {
        if (snapshotUnsubscribe) snapshotUnsubscribe();
      };

      if (authUser) {
        const userDocRef = doc(db, "users", authUser.uid);

        cleanup();
        snapshotUnsubscribe = onSnapshot(userDocRef, (userDoc) => {
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const mergedUser: UserState = {
              ...INITIAL_USER_STATE, ...userData,
              uid: authUser.uid, isLoggedIn: true,
              email: authUser.email || userData.email || '',
              createdAt: userData.createdAt?.toDate ? userData.createdAt.toDate().getTime() : (userData.createdAt || Date.now()),
              stats: { ...INITIAL_USER_STATE.stats, ...userData.stats },
              lastBossAttacks: { ...INITIAL_USER_STATE.lastBossAttacks, ...userData.lastBossAttacks },
              bioData: { ...INITIAL_USER_STATE.bioData, ...userData.bioData },
            };
            setUser(mergedUser);
            if (loadingAuth) setLoadingAuth(false);
          } else {
            // This case can happen briefly after signup, before the doc is created.
            // We set basic info, and the listener will pick up the full doc shortly.
            setLoadingAuth(false);
            setUser(prev => ({...prev, uid: authUser.uid, isLoggedIn: true, email: authUser.email || ''}));
          }
        }, (error) => {
          console.error("Firestore snapshot listener failed:", error);
          showError("Conexão com o servidor perdida.");
          signOut(auth);
        });
          
      } else {
        cleanup();
        setUser(INITIAL_USER_STATE);
        setLoadingAuth(false);
      }
      return cleanup;
    });

    return () => unsubscribeAuth();
  }, [showError, loadingAuth]);
  
  useEffect(() => {
    if (loadingAuth) return; // Don't redirect while checking auth status

    if (user.isLoggedIn) {
      const hasRequiredData = user.archetype && user.lifeMapScores;
      const isPublicPath = location.pathname === '/' || location.pathname.startsWith('/login') || location.pathname.startsWith('/payment-success');

      if (user.onboardingCompleted && hasRequiredData) {
        // User is fully set up, redirect to dashboard if they are on a public/onboarding page
        if (isPublicPath || location.pathname.startsWith('/onboarding')) {
          navigate('/app/dashboard', { replace: true });
        }
      } else {
        // User is not fully set up (either never onboarded or data is corrupt)
        // Redirect to onboarding if they aren't there already.
        if (!location.pathname.startsWith('/onboarding')) {
          // Show a specific error if data is corrupt
          if (user.onboardingCompleted && !hasRequiredData) {
            showError("Seus dados de diagnóstico estão incompletos. Por favor, refaça o mapeamento.");
          }
          navigate('/onboarding', { replace: true });
        }
      }
    }
  }, [user, loadingAuth, location.pathname, navigate, showError]);

  useEffect(() => {
    if (user.level > prevLevelRef.current && prevLevelRef.current > 0) {
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
        const updatedState = { ...prevUser, currentXP: newXP, level: newLevel, skillPoints: newSkillPoints, rank: getRank(newLevel, prevUser.isAscended || false) };
        writeUserUpdate({ currentXP: newXP, level: newLevel, skillPoints: newSkillPoints, rank: getRank(newLevel, prevUser.isAscended || false) });
        return updatedState;
    });
  }, [writeUserUpdate]);
  
  const handleCompleteMission = useCallback((missionId: string) => {
    const mission = user.missions.find(m => m.id === missionId);
    if (mission && !mission.completed) {
      addXP(mission.xp);
      writeUserUpdate({
        missions: user.missions.map(m =>
          m.id === missionId ? { ...m, completed: true } : m
        ),
      });
    }
  }, [addXP, user.missions, writeUserUpdate]);
  
  const removeXP = useCallback((amount: number) => {
     writeUserUpdate({ currentXP: Math.max(0, user.currentXP - amount) });
  }, [user.currentXP, writeUserUpdate]);
  
   useEffect(() => {
      const checkOracleGuidance = async () => {
          if (user.isLoggedIn && user.hasSubscription && user.onboardingCompleted) {
              const lastGuidanceDate = user.dailyGuidance?.date;
              if (!lastGuidanceDate || !isToday(lastGuidanceDate)) {
                  try {
                      const guidance = await generateProactiveOracleGuidance(user);
                      writeUserUpdate({ dailyGuidance: guidance });
                  } catch (e: any) {
                      showError(e.message);
                  }
              }
          }
      };
      checkOracleGuidance();
  }, [user.isLoggedIn, user.hasSubscription, user.onboardingCompleted, showError, writeUserUpdate, user]);

  useEffect(() => {
    const refreshMissions = async () => {
      if (!user.onboardingCompleted || !user.isLoggedIn) return;
      const now = Date.now();
      const needsDaily = !isToday(user.lastDailyMissionRefresh);
      const needsWeekly = !isSameWeek(now, user.lastWeeklyMissionRefresh);
      
      if (!needsDaily && !needsWeekly) return;
      
      setIsMissionsLoading(true);
      
      try {
        let dailyMissions = needsDaily ? (user.hasSubscription ? await generateDailyMissionsAI(user.level, user.rank) : STATIC_DAILY_MISSIONS) : user.missions.filter(m => m.type === 'daily');
        let weeklyMissions = needsWeekly ? (user.hasSubscription ? await generateWeeklyMissionsAI(user.level, user.rank) : STATIC_WEEKLY_MISSIONS) : user.missions.filter(m => m.type === 'weekly');
        let milestoneMissions = user.missions.filter(m => m.type === 'milestone');
        
        if (dailyMissions.length === 0) dailyMissions = STATIC_DAILY_MISSIONS;
        if (weeklyMissions.length === 0) weeklyMissions = STATIC_WEEKLY_MISSIONS;
        
        const missionsUpdate = {
          missions: [...dailyMissions.map(m=>({...m, completed:false})), ...weeklyMissions.map(m=>({...m, completed:false})), ...milestoneMissions],
          lastDailyMissionRefresh: needsDaily ? now : user.lastDailyMissionRefresh,
          lastWeeklyMissionRefresh: needsWeekly ? now : user.lastWeeklyMissionRefresh,
        };
        writeUserUpdate(missionsUpdate);
      } catch (error: any) { 
        showError("Falha ao gerar missões. Usando protocolo padrão.");
        const fallbackUpdate = {
            missions: [...STATIC_DAILY_MISSIONS, ...STATIC_WEEKLY_MISSIONS, ...user.missions.filter(m => m.type === 'milestone')].map(m => ({...m, completed: false})),
            lastDailyMissionRefresh: needsDaily ? now : user.lastDailyMissionRefresh,
            lastWeeklyMissionRefresh: needsWeekly ? now : user.lastWeeklyMissionRefresh,
        };
        writeUserUpdate(fallbackUpdate);
      } finally { 
        setIsMissionsLoading(false); 
      }
    };
    refreshMissions();
  }, [user.onboardingCompleted, user.isLoggedIn, user.hasSubscription, user.level, writeUserUpdate, showError]);

  const handleLogin = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    if (!isFirebaseConfigured) return { success: false, message: FIREBASE_UNCONFIGURED_ERROR };
    try {
        await signInWithEmailAndPassword(auth, email, password);
        return { success: true };
    } catch (error: any) {
        console.error("Login error:", error);
        return { success: false, message: "Email ou senha inválidos." };
    }
  };

  const handleAccountSetup = async (name: string, email: string, password?: string): Promise<{ success: boolean; message?: string; user?: FirebaseUser }> => {
    if (!isFirebaseConfigured) return { success: false, message: FIREBASE_UNCONFIGURED_ERROR };
    if (!password) return { success: false, message: "A senha é obrigatória para criar a conta." };
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = userCredential.user;
        
        const userDocRef = doc(db, "users", newUser.uid);
        const newUserDoc = { ...INITIAL_USER_STATE, uid: newUser.uid, name, email, createdAt: serverTimestamp() };
        await setDoc(userDocRef, newUserDoc);
        
        // This will trigger onAuthStateChanged, which handles the rest.
        return { success: true, user: newUser };
    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            return { success: false, message: "Este email já está em uso. Tente fazer login." };
        }
        return { success: false, message: "Falha ao criar conta." };
    }
  };

  const handleFinalizePurchase = async (sessionId: string): Promise<{ success: boolean }> => {
    // This function is for upgrades by logged-in users.
    if (!isFirebaseConfigured) {
        showError(FIREBASE_UNCONFIGURED_ERROR);
        return { success: false };
    }
    try {
        const verifyCheckoutSession = httpsCallable(functions, 'verifyCheckoutSession');
        const result = await verifyCheckoutSession({ sessionId });
        return { success: (result.data as any)?.success || false };
    } catch (error: any) {
        console.error("Finalize purchase error:", error);
        showError(error.message || "Falha ao verificar o pagamento.");
        return { success: false };
    }
  };
  
  const handleVerifyNewPurchase = async (sessionId: string): Promise<{ success: boolean; name?: string; email?: string; message?: string; }> => {
    if (!isFirebaseConfigured) return { success: false, message: FIREBASE_UNCONFIGURED_ERROR };
    try {
        const verifyFunction = httpsCallable(functions, 'verifyHeroPurchaseAndGetData');
        const result = await verifyFunction({ sessionId });
        const data = result.data as { success: boolean, name: string, email: string };
        return data;
    } catch (error: any) {
        console.error("Verify new purchase error:", error);
        return { success: false, message: error.message || "Falha ao verificar sua compra." };
    }
  };

  const handleReset = async () => {
    if (isFirebaseConfigured) await signOut(auth);
    // For local dev without Firebase, this clears state.
    setUser(INITIAL_USER_STATE);
    navigate('/', { replace: true });
  };
  
  const handleForgotPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
      if (!isFirebaseConfigured) return { success: false, message: FIREBASE_UNCONFIGURED_ERROR };
      try {
          await sendPasswordResetEmail(auth, email);
          return { success: true, message: 'Se uma conta existir, um link de recuperação foi enviado.' };
      } catch (error: any) {
          return { success: false, message: 'Falha ao enviar o email.' };
      }
  };
  
  const handleOnboardingComplete = useCallback((archetype: Archetype, lifeMapScores: Record<LifeMapCategory, number>, focusAreas: LifeMapCategory[], mapAnalysis?: string) => {
    writeUserUpdate({ onboardingCompleted: true, archetype, lifeMapScores, focusAreas, mapAnalysis });
  }, [writeUserUpdate]);

  const handleRedoDiagnosis = useCallback(() => {
     writeUserUpdate({ onboardingCompleted: false, lifeMapScores: INITIAL_LIFE_MAP_SCORES, focusAreas: [], archetype: null, mapAnalysis: undefined });
     navigate('/onboarding');
  }, [navigate, writeUserUpdate]);
  
  const handleCompleteLesson = useCallback((completedLesson: LessonDetails) => {
    let completedToday = isToday(user.lastLessonCompletionDate) ? user.lessonsCompletedToday : 0;
    if (completedToday >= 3) {
        showError("Limite diário de lições atingido.");
        return;
    }
    
    addXP(50);
    
    const newModules = JSON.parse(JSON.stringify(user.modules));
    let lessonFoundAndUnlocked = false;
    for (let i = 0; i < newModules.length; i++) {
        for (let j = 0; j < newModules[i].lessons.length; j++) {
            if (newModules[i].lessons[j].id === completedLesson.id) {
                newModules[i].lessons[j].completed = true;
                // Unlock next lesson
                if (j + 1 < newModules[i].lessons.length) {
                    newModules[i].lessons[j + 1].locked = false;
                } else if (i + 1 < newModules.length && newModules[i+1].lessons.length > 0) {
                    newModules[i + 1].lessons[0].locked = false;
                }
                lessonFoundAndUnlocked = true;
                break;
            }
        }
        if(lessonFoundAndUnlocked) break;
    }
    
    writeUserUpdate({ modules: newModules, lessonsCompletedToday: completedToday + 1, lastLessonCompletionDate: Date.now() });
  }, [user, addXP, showError, writeUserUpdate]);

  const handleAddJournalEntry = useCallback((content: string) => {
     const newEntry = { id: Date.now().toString(), date: Date.now(), content, isAnalyzed: false };
     writeUserUpdate({ journalEntries: [newEntry, ...user.journalEntries] });
  }, [user.journalEntries, writeUserUpdate]);

  const handleUpdateJournalEntry = useCallback((id: string, updates: Partial<JournalEntry>) => {
    writeUserUpdate({ journalEntries: user.journalEntries.map(e => e.id === id ? { ...e, ...updates } : e) });
  }, [user.journalEntries, writeUserUpdate]);
  
  const handleUnlockSkill = useCallback((skillId: string) => {
    const skill = Object.values(SKILL_TREES).flat().find(s => s.id === skillId);
    if (skill && user.skillPoints >= skill.cost && !user.unlockedSkills.includes(skillId)) {
        writeUserUpdate({ skillPoints: user.skillPoints - skill.cost, unlockedSkills: [...user.unlockedSkills, skillId] });
    }
  }, [user.skillPoints, user.unlockedSkills, writeUserUpdate]);

  const handleSpendParagonPoint = useCallback((perkId: string) => {
    const perk = PARAGON_PERKS.find(p => p.id === perkId);
    const currentLevel = user.paragonPerks[perkId] || 0;
    if (perk && currentLevel < perk.maxLevel) {
        const cost = perk.cost(currentLevel);
        if (user.paragonPoints >= cost) {
            writeUserUpdate({ paragonPoints: user.paragonPoints - cost, paragonPerks: { ...user.paragonPerks, [perkId]: currentLevel + 1 } });
        }
    }
  }, [user.paragonPerks, user.paragonPoints, writeUserUpdate]);

  const handleAscend = useCallback(() => {
    if (user.level >= 50) {
        const paragonPointsEarned = Math.floor(user.currentXP / 1000) + 1;
        writeUserUpdate({ level: 1, currentXP: 0, isAscended: true, rank: RankTitle.Divino, paragonPoints: user.paragonPoints + paragonPointsEarned, skillPoints: 0, unlockedSkills: [] });
    }
  }, [user.level, user.currentXP, user.paragonPoints, writeUserUpdate]);

  const handleBossAttack = useCallback((type: 'daily' | 'weekly' | 'monthly') => {
    addXP(10 * (type === 'daily' ? 1 : type === 'weekly' ? 5 : 20));
    writeUserUpdate({ lastBossAttacks: { ...user.lastBossAttacks, [type]: Date.now() } });
  }, [addXP, user.lastBossAttacks, writeUserUpdate]);

  const handlePunish = useCallback((amount: number) => { 
    removeXP(amount);
    showError(`Punição aplicada: -${amount} XP por quebra de protocolo.`);
  }, [removeXP, showError]);

  const handleUpdateUser = useCallback((updates: Partial<UserState>) => {
    writeUserUpdate(updates);
  }, [writeUserUpdate]);

  const handleBuy = async (productId: string, metadata?: Record<string, any>) => {
    try {
        if (!isFirebaseConfigured) throw new Error(FIREBASE_UNCONFIGURED_ERROR);
        // For new user purchases, auth is not required. For upgrades, it is.
        // The firebase function will handle the logic.
        await buyProduct(productId, metadata);
    }
    catch (err: any) { showError(err.message || 'Erro ao iniciar compra.'); throw err; }
  };
  
  const handleUpgrade = async (productId: string) => {
    try {
        if (!user.email) throw new Error("Email do usuário não encontrado.");
        await buyProduct(productId, { email: user.email });
    }
    catch (err: any) { showError(err.message || 'Erro ao iniciar upgrade.'); }
  };
  
  const handleCreateSquad = useCallback((name: string, motto: string) => {
    if (user.level < MIN_LEVEL_TO_CREATE_SQUAD) {
        showError(`Nível ${MIN_LEVEL_TO_CREATE_SQUAD} necessário.`);
        return;
    }
    const newSquad: Squad = {
        id: `squad-${Date.now()}`, name, motto, leaderId: user.uid, leaderName: user.name,
        members: [{ id: user.uid, name: user.name, rank: user.rank, level: user.level, archetype: user.archetype }],
        createdAt: Date.now(),
    };
    setSquads(prev => [...prev, newSquad]);
    writeUserUpdate({ joinedSquadIds: [...user.joinedSquadIds, newSquad.id] });
  }, [user, showError, writeUserUpdate]);

  const handleJoinSquad = useCallback((squadId: string) => {
    const squad = squads.find(s => s.id === squadId);
    if (!squad || user.joinedSquadIds.includes(squadId) || squad.members.length >= MAX_SQUAD_SIZE) {
        showError("Não foi possível entrar no esquadrão.");
        return;
    }
    const newMember: SquadMember = { id: user.uid, name: user.name, rank: user.rank, level: user.level, archetype: user.archetype };
    setSquads(prev => prev.map(s => s.id === squadId ? { ...s, members: [...s.members, newMember] } : s));
    writeUserUpdate({ joinedSquadIds: [...user.joinedSquadIds, squadId] });
  }, [squads, user, showError, writeUserUpdate]);
  
  const handleLeaveSquad = useCallback((squadId: string) => {
    setSquads(prev => prev.map(s => s.id === squadId ? { ...s, members: s.members.filter(m => m.id !== user.uid) } : s).filter(s => s.leaderId !== user.uid));
    writeUserUpdate({ joinedSquadIds: user.joinedSquadIds.filter(id => id !== squadId) });
  }, [user, writeUserUpdate]);

  const value = { user, squads, isMissionsLoading, levelUpData, closeLevelUpModal, addXP, handleCompleteMission, handleOnboardingComplete, handleReset, handleRedoDiagnosis, handleCompleteLesson, handleAddJournalEntry, handleUpdateJournalEntry, handleUnlockSkill, handleSpendParagonPoint, handleAscend, handleBossAttack, handlePunish, handleLogin, handleForgotPassword, handleAccountSetup, handleUpdateUser, handleBuy, handleUpgrade, handleFinalizePurchase, handleVerifyNewPurchase, handleCreateSquad, handleJoinSquad, handleLeaveSquad };

  return (
    <UserContext.Provider value={value}>
        {loadingAuth ? <div className="bg-black min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-zinc-500" /></div> : children}
    </UserContext.Provider>
  );
};
