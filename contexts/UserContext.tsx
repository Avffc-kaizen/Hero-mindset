import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UserState, Archetype, LifeMapCategory, JournalEntry, LessonDetails, Mission, RankTitle, Squad, SquadMember } from '../types';
import { INITIAL_USER_STATE, SKILL_TREES, PARAGON_PERKS, STATIC_DAILY_MISSIONS, STATIC_WEEKLY_MISSIONS, MOCK_SQUADS, MIN_LEVEL_TO_CREATE_SQUAD, MAX_SQUAD_SIZE } from '../constants';
import { generateDailyMissionsAI, generateWeeklyMissionsAI, generateProactiveOracleGuidance } from '../services/geminiService';
import { buyProduct } from '../services/paymentService';
import { useError } from './ErrorContext';
import { XP_PER_LEVEL_FORMULA, getRank, isToday, isSameWeek } from '../utils';
// FIX: Centralize firebase imports to resolve module conflicts and fix serverTimestamp errors.
import { auth, db, functions, isFirebaseConfigured, firebase } from '../firebase';
// FIX: Using v8 compat imports for Firebase to resolve module errors.
// FIX: Removed modular Firebase auth import (`User as FirebaseUser`) to resolve type conflicts with the v8 compat library. The `firebase.User` type from the compat library will be used instead.

interface UserContextType {
  user: UserState;
  squads: Squad[];
  isMissionsLoading: boolean;
  loadingAuth: boolean;
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
  // FIX: Updated type to use `firebase.User` from the v8 compat library instead of the conflicting modular import.
  handleAccountSetup: (name: string, email: string, password?: string) => Promise<{ success: boolean; message?: string; user?: firebase.User }>;
  handleUpdateUser: (updates: Partial<UserState>) => void;
  handleBuy: (productId: string, metadata?: Record<string, any>) => Promise<void>;
  handleUpgrade: (productId: string) => Promise<void>;
  handleVerifyNewPurchase: (sessionId: string) => Promise<{ success: boolean; name?: string; email?: string; message?: string; }>;
  handleVerifyUpgrade: (sessionId: string) => Promise<{ success: boolean; message?: string }>;
  handleCreateSquad: (name: string, motto: string) => void;
  handleJoinSquad: (squadId: string) => void;
  handleLeaveSquad: (squadId: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
};

const FIREBASE_UNCONFIGURED_ERROR = "Funcionalidade indisponível. A conexão com o servidor principal não foi configurada corretamente.";

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserState>(INITIAL_USER_STATE);
  const [squads, setSquads] = useState<Squad[]>(MOCK_SQUADS);
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
      // FIX: Changed to Firebase v8 compat syntax.
      const userDocRef = db.collection("users").doc(currentUser.uid);
      try {
        const { createdAt, ...clientSafeUpdates } = updates;
        const cleanUpdates: { [key: string]: any } = {};
        Object.keys(clientSafeUpdates).forEach(keyStr => {
          const key = keyStr as keyof typeof clientSafeUpdates;
          if (clientSafeUpdates[key] !== undefined) cleanUpdates[key] = clientSafeUpdates[key];
        });
        if (Object.keys(cleanUpdates).length > 0) {
            // FIX: Changed to Firebase v8 compat syntax.
            // FIX: Changed to use centralized firebase import to fix `firestore` property not found error.
            await userDocRef.update({ ...cleanUpdates, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
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
    const unsubscribeAuth = auth.onAuthStateChanged(authUser => {
      let snapshotUnsubscribe: (() => void) | null = null;

      if (authUser) {
        const userDocRef = db.collection('users').doc(authUser.uid);
        if (snapshotUnsubscribe) snapshotUnsubscribe();
        snapshotUnsubscribe = userDocRef.onSnapshot(
          async userDoc => {
            if (userDoc.exists) {
              const userData = userDoc.data();
              const mergedUser: UserState = {
                ...INITIAL_USER_STATE,
                ...userData,
                uid: authUser.uid,
                isLoggedIn: true,
                email: authUser.email || userData.email || '',
                createdAt: userData.createdAt?.toDate
                  ? userData.createdAt.toDate().getTime()
                  : userData.createdAt || Date.now(),
              };
              setUser(mergedUser);
              setLoadingAuth(false);
            } else {
              console.warn(
                `User document not found for UID: ${authUser.uid}. Creating one.`
              );
              const newUserDoc = {
                ...INITIAL_USER_STATE,
                uid: authUser.uid,
                email: authUser.email || '',
                name: authUser.displayName || 'Herói',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
              };
              try {
                await userDocRef.set(newUserDoc);
                // The snapshot listener will be re-triggered with the new document,
                // and setLoadingAuth will be handled in the `if (userDoc.exists)` block.
              } catch (error) {
                console.error('Failed to create missing user document:', error);
                showError('Falha ao acessar os dados da sua conta. Tente novamente.');
                await auth.signOut();
                setLoadingAuth(false);
              }
            }
          },
          error => {
            console.error('Firestore listener error:', error);
            showError('Conexão com o servidor perdida.');
            auth.signOut();
            setLoadingAuth(false);
          }
        );
      } else {
        if (snapshotUnsubscribe) snapshotUnsubscribe();
        setUser(INITIAL_USER_STATE);
        setLoadingAuth(false);
      }
      return () => {
        if (snapshotUnsubscribe) snapshotUnsubscribe();
      };
    });
    return () => unsubscribeAuth();
  }, [showError]);
  
  useEffect(() => {
    if(!loadingAuth && user.isLoggedIn) {
      if(user.onboardingCompleted) {
        if (location.pathname === '/' || location.pathname.startsWith('/onboarding') || location.pathname.startsWith('/login')) {
          navigate('/app/dashboard', { replace: true });
        }
      } else {
         if (!location.pathname.startsWith('/onboarding')) {
          navigate('/onboarding', { replace: true });
         }
      }
    }
  }, [loadingAuth, user.isLoggedIn, user.onboardingCompleted, navigate, location.pathname]);


  useEffect(() => {
    if (user.level > prevLevelRef.current && prevLevelRef.current > 0) setLevelUpData({ level: user.level, rank: user.rank });
    prevLevelRef.current = user.level;
  }, [user.level, user.rank]);
  
  const closeLevelUpModal = () => setLevelUpData(null);

  const addXP = useCallback((xp: number) => {
    let newXP = user.currentXP + xp;
    let newLevel = user.level;
    let newSkillPoints = user.skillPoints;
    let nextLevelXP = XP_PER_LEVEL_FORMULA(newLevel);
    while (newXP >= nextLevelXP) {
        newXP -= nextLevelXP; newLevel += 1; newSkillPoints += 1;
        nextLevelXP = XP_PER_LEVEL_FORMULA(newLevel);
    }
    writeUserUpdate({ currentXP: newXP, level: newLevel, skillPoints: newSkillPoints, rank: getRank(newLevel, user.isAscended || false) });
  }, [user, writeUserUpdate]);
  
  const handleCompleteMission = useCallback((missionId: string) => {
    const mission = user.missions.find(m => m.id === missionId);
    if (mission && !mission.completed) {
      addXP(mission.xp);
      writeUserUpdate({ missions: user.missions.map(m => m.id === missionId ? { ...m, completed: true } : m) });
    }
  }, [addXP, user.missions, writeUserUpdate]);
  
   useEffect(() => {
      const checkOracleGuidance = async () => {
          if (user.isLoggedIn && user.hasSubscription && user.onboardingCompleted && (!user.dailyGuidance?.date || !isToday(user.dailyGuidance.date))) {
              try { writeUserUpdate({ dailyGuidance: await generateProactiveOracleGuidance(user) }); } catch (e: any) { showError(e.message); }
          }
      };
      const timer = setTimeout(checkOracleGuidance, 1000); // Delay to prevent race condition on login
      return () => clearTimeout(timer);
  }, [user.isLoggedIn, user.onboardingCompleted, user.dailyGuidance, user.hasSubscription, writeUserUpdate, showError]);

  useEffect(() => {
    const refreshMissions = async () => {
      if (!user.onboardingCompleted || !user.isLoggedIn) return;
      const now = Date.now();
      const needsDaily = !isToday(user.lastDailyMissionRefresh);
      if (!needsDaily) return;
      
      setIsMissionsLoading(true);
      try {
        const dailyMissions = user.hasSubscription ? await generateDailyMissionsAI(user.level, user.rank) : STATIC_DAILY_MISSIONS;
        const weeklyMissions = !isSameWeek(now, user.lastWeeklyMissionRefresh) ? (user.hasSubscription ? await generateWeeklyMissionsAI(user.level, user.rank) : STATIC_WEEKLY_MISSIONS) : user.missions.filter(m => m.type === 'weekly');
        
        writeUserUpdate({
          missions: [...dailyMissions, ...weeklyMissions, ...user.missions.filter(m => m.type === 'milestone')].map(m=>({...m, completed:false})),
          lastDailyMissionRefresh: now,
          lastWeeklyMissionRefresh: !isSameWeek(now, user.lastWeeklyMissionRefresh) ? now : user.lastWeeklyMissionRefresh,
        });
      } catch (error: any) { 
        showError("Falha ao gerar missões IA. Usando protocolo padrão.");
        writeUserUpdate({ missions: [...STATIC_DAILY_MISSIONS, ...STATIC_WEEKLY_MISSIONS, ...user.missions.filter(m => m.type === 'milestone')].map(m => ({...m, completed: false})) });
      } finally { setIsMissionsLoading(false); }
    };
    if(!loadingAuth) refreshMissions();
  }, [user.onboardingCompleted, user.isLoggedIn, user.hasSubscription, user.level, user.rank, user.lastDailyMissionRefresh, user.lastWeeklyMissionRefresh, user.missions, writeUserUpdate, showError, loadingAuth]);

  const handleLogin = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    if (!isFirebaseConfigured) return { success: false, message: FIREBASE_UNCONFIGURED_ERROR };
    try { 
      // FIX: Changed to Firebase v8 compat syntax.
      await auth.signInWithEmailAndPassword(email, password); return { success: true }; }
    catch (error: any) { return { success: false, message: "Email ou senha inválidos." }; }
  };

  // FIX: Updated type to use `firebase.User` from the v8 compat library instead of the conflicting modular import.
  const handleAccountSetup = async (name: string, email: string, password?: string): Promise<{ success: boolean; message?: string; user?: firebase.User }> => {
    if (!isFirebaseConfigured) return { success: false, message: FIREBASE_UNCONFIGURED_ERROR };
    if (!password) return { success: false, message: "A senha é obrigatória." };
    try {
        // FIX: Changed to Firebase v8 compat syntax.
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const newUser = userCredential.user;
        if (!newUser) throw new Error("User creation failed.");
        // FIX: Changed to Firebase v8 compat syntax.
        // FIX: Changed to use centralized firebase import to fix `firestore` property not found error.
        await db.collection("users").doc(newUser.uid).set({ ...INITIAL_USER_STATE, uid: newUser.uid, name, email, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
        return { success: true, user: newUser };
    } catch (error: any) {
        return { success: false, message: error.code === 'auth/email-already-in-use' ? "Este email já está em uso." : "Falha ao criar conta." };
    }
  };
  
  const handleVerifyNewPurchase = async (sessionId: string): Promise<{ success: boolean; name?: string; email?: string; message?: string; }> => {
    if (!isFirebaseConfigured) return { success: false, message: FIREBASE_UNCONFIGURED_ERROR };
    try {
        // FIX: Changed to Firebase v8 compat syntax.
        const verifyHeroPurchaseAndGetData = functions.httpsCallable('verifyHeroPurchaseAndGetData');
        const result = await verifyHeroPurchaseAndGetData({ sessionId });
        return result.data as { success: boolean, name: string, email: string, message?: string };
    } catch (error: any) { return { success: false, message: error.message || "Falha ao verificar sua compra." }; }
  };

  const handleVerifyUpgrade = async (sessionId: string) => {
    if (!isFirebaseConfigured) return { success: false, message: FIREBASE_UNCONFIGURED_ERROR };
    try {
        // FIX: Changed to Firebase v8 compat syntax.
        const verifyCheckoutSession = functions.httpsCallable('verifyCheckoutSession');
        await verifyCheckoutSession({ sessionId });
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message || "Falha ao verificar seu upgrade." };
    }
  };

  const handleReset = async () => { if (isFirebaseConfigured) { 
    // FIX: Changed to Firebase v8 compat syntax.
    await auth.signOut(); navigate('/'); 
  }};
  
  const handleForgotPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
      if (!isFirebaseConfigured) return { success: false, message: FIREBASE_UNCONFIGURED_ERROR };
      try { 
        // FIX: Changed to Firebase v8 compat syntax.
        await auth.sendPasswordResetEmail(email); return { success: true, message: 'Se uma conta existir, um link foi enviado.' }; }
      catch (error: any) { return { success: false, message: 'Falha ao enviar o email.' }; }
  };
  
  const handleOnboardingComplete = useCallback((archetype: Archetype, lifeMapScores: Record<LifeMapCategory, number>, focusAreas: LifeMapCategory[], mapAnalysis?: string) => {
    writeUserUpdate({ onboardingCompleted: true, archetype, lifeMapScores, focusAreas, mapAnalysis });
  }, [writeUserUpdate]);

  const handleRedoDiagnosis = useCallback(() => { writeUserUpdate({ onboardingCompleted: false }); navigate('/onboarding'); }, [writeUserUpdate, navigate]);
  
  const handleCompleteLesson = useCallback((completedLesson: LessonDetails) => {
    let completedToday = isToday(user.lastLessonCompletionDate) ? user.lessonsCompletedToday : 0;
    if (completedToday >= 3) { showError("Limite diário de lições atingido."); return; }
    addXP(50);
    const newModules = JSON.parse(JSON.stringify(user.modules));
    let lessonFound = false;
    for (let i = 0; i < newModules.length; i++) {
        for (let j = 0; j < newModules[i].lessons.length; j++) {
            if (newModules[i].lessons[j].id === completedLesson.id) {
                newModules[i].lessons[j].completed = true;
                if (j + 1 < newModules[i].lessons.length) newModules[i].lessons[j + 1].locked = false;
                else if (i + 1 < newModules.length && newModules[i+1].lessons.length > 0) newModules[i + 1].lessons[0].locked = false;
                lessonFound = true; break;
            }
        }
        if(lessonFound) break;
    }
    writeUserUpdate({ modules: newModules, lessonsCompletedToday: completedToday + 1, lastLessonCompletionDate: Date.now() });
  }, [user, addXP, showError, writeUserUpdate]);

  const handleAddJournalEntry = useCallback((content: string) => {
     writeUserUpdate({ journalEntries: [{ id: Date.now().toString(), date: Date.now(), content, isAnalyzed: false }, ...user.journalEntries] });
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
    if (perk && currentLevel < perk.maxLevel && user.paragonPoints >= perk.cost(currentLevel)) {
        writeUserUpdate({ paragonPoints: user.paragonPoints - perk.cost(currentLevel), paragonPerks: { ...user.paragonPerks, [perkId]: currentLevel + 1 } });
    }
  }, [user.paragonPerks, user.paragonPoints, writeUserUpdate]);

  const handleAscend = useCallback(() => {
    if (user.level >= 50) writeUserUpdate({ level: 1, currentXP: 0, isAscended: true, rank: RankTitle.Divino, paragonPoints: user.paragonPoints + Math.floor(user.currentXP / 1000) + 1, skillPoints: 0, unlockedSkills: [] });
  }, [user, writeUserUpdate]);

  const handleBossAttack = useCallback((type: 'daily' | 'weekly' | 'monthly') => {
    addXP(10 * (type === 'daily' ? 1 : type === 'weekly' ? 5 : 20));
    writeUserUpdate({ lastBossAttacks: { ...user.lastBossAttacks, [type]: Date.now() } });
  }, [addXP, user.lastBossAttacks, writeUserUpdate]);

  const handlePunish = useCallback((amount: number) => { 
    writeUserUpdate({ currentXP: Math.max(0, user.currentXP - amount) });
    showError(`Punição: -${amount} XP por quebra de protocolo.`);
  }, [user.currentXP, writeUserUpdate, showError]);

  const handleUpdateUser = useCallback((updates: Partial<UserState>) => { writeUserUpdate(updates); }, [writeUserUpdate]);

  const handleBuy = async (productId: string, metadata?: Record<string, any>) => {
    try { await buyProduct(productId, metadata); }
    catch (err: any) { showError(err.message || 'Erro ao iniciar compra.'); throw err; }
  };
  
  const handleUpgrade = async (productId: string) => {
    try { 
      await buyProduct(productId); 
    }
    catch (err: any) { showError(err.message || 'Erro ao iniciar upgrade.'); }
  };
  
  const handleCreateSquad = useCallback((name: string, motto: string) => {
    if (user.level < MIN_LEVEL_TO_CREATE_SQUAD) { showError(`Nível ${MIN_LEVEL_TO_CREATE_SQUAD} necessário.`); return; }
    const newSquad: Squad = { id: `squad-${Date.now()}`, name, motto, leaderId: user.uid, leaderName: user.name, members: [{ id: user.uid, name: user.name, rank: user.rank, level: user.level, archetype: user.archetype }], createdAt: Date.now() };
    setSquads(prev => [...prev, newSquad]);
    writeUserUpdate({ joinedSquadIds: [...user.joinedSquadIds, newSquad.id] });
  }, [user, showError, writeUserUpdate]);

  const handleJoinSquad = useCallback((squadId: string) => {
    const squad = squads.find(s => s.id === squadId);
    if (!squad || user.joinedSquadIds.includes(squadId) || squad.members.length >= MAX_SQUAD_SIZE) { showError("Não foi possível entrar no esquadrão."); return; }
    const newMember: SquadMember = { id: user.uid, name: user.name, rank: user.rank, level: user.level, archetype: user.archetype };
    setSquads(prev => prev.map(s => s.id === squadId ? { ...s, members: [...s.members, newMember] } : s));
    writeUserUpdate({ joinedSquadIds: [...user.joinedSquadIds, squadId] });
  }, [squads, user, showError, writeUserUpdate]);
  
  const handleLeaveSquad = useCallback((squadId: string) => {
    setSquads(prev => prev.map(s => s.id === squadId ? { ...s, members: s.members.filter(m => m.id !== user.uid) } : s).filter(s => s.leaderId !== user.uid));
    writeUserUpdate({ joinedSquadIds: user.joinedSquadIds.filter(id => id !== squadId) });
  }, [user, writeUserUpdate]);

  const value = { user, squads, isMissionsLoading, loadingAuth, levelUpData, closeLevelUpModal, addXP, handleCompleteMission, handleOnboardingComplete, handleReset, handleRedoDiagnosis, handleCompleteLesson, handleAddJournalEntry, handleUpdateJournalEntry, handleUnlockSkill, handleSpendParagonPoint, handleAscend, handleBossAttack, handlePunish, handleLogin, handleForgotPassword, handleAccountSetup, handleUpdateUser, handleBuy, handleUpgrade, handleVerifyNewPurchase, handleVerifyUpgrade, handleCreateSquad, handleJoinSquad, handleLeaveSquad };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
