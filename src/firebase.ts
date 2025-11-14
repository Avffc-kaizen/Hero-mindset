import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, serverTimestamp } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { FIREBASE_CONFIG } from "./constants";

const isFirebaseConfigured = !!(
    FIREBASE_CONFIG.apiKey &&
    FIREBASE_CONFIG.projectId &&
    FIREBASE_CONFIG.appId &&
    !FIREBASE_CONFIG.apiKey.startsWith("VITE_") // Check for placeholder
);

let app: FirebaseApp | null = null;
let auth: ReturnType<typeof getAuth> | null = null;
let db: ReturnType<typeof getFirestore> | null = null;
let functions: ReturnType<typeof getFunctions> | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApp();
    
    auth = getAuth(app);
    db = getFirestore(app);
    functions = getFunctions(app, 'southamerica-east1');
    googleProvider = new GoogleAuthProvider();
  } catch (e) {
      console.error("!!! FIREBASE INITIALIZATION FAILED:", e);
  }
} else {
  console.warn("!!! O FIREBASE NÃO ESTÁ CONFIGURADO. VERIFIQUE SUAS VARIÁVEIS DE AMBIENTE. !!!");
}

export { app, isFirebaseConfigured, auth, db, functions, googleProvider, serverTimestamp };