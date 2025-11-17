import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, serverTimestamp, type Firestore } from "firebase/firestore";
import { getFunctions, type Functions } from "firebase/functions";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getAnalytics, type Analytics } from "firebase/analytics";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let functions: Functions | null = null;
let storage: FirebaseStorage | null = null;
let analytics: Analytics | null = null;
let googleProvider: GoogleAuthProvider | null = null;
let isFirebaseConfigured = false;

// A configuração foi inserida diretamente para evitar problemas com variáveis de ambiente no AI Studio.
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDYAR2rsJ673seTMClTGfMhp4a6GjwLEio",
  authDomain: "hero-mindset.firebaseapp.com",
  projectId: "hero-mindset",
  storageBucket: "hero-mindset.appspot.com",
  messagingSenderId: "220402560101",
  appId: "1:220402560101:web:93c6fa158a1f675d55ea8c",
  measurementId: "G-FE75B12XCS"
};


// Verificação simples para garantir que as chaves não estão vazias.
if (FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId) {
    try {
        app = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApp();
        auth = getAuth(app);
        db = getFirestore(app);
        functions = getFunctions(app, 'southamerica-east1');
        storage = getStorage(app);
        analytics = getAnalytics(app);
        googleProvider = new GoogleAuthProvider();
        isFirebaseConfigured = true;
    } catch (e) {
        console.error("!!! FALHA NA INICIALIZAÇÃO DO FIREBASE:", e);
    }
} else {
    console.warn("!!! O FIREBASE NÃO ESTÁ CONFIGURADO. VERIFIQUE OS VALORES EM src/firebase.ts !!!");
}

export { auth, db, functions, storage, googleProvider, serverTimestamp, isFirebaseConfigured, analytics };