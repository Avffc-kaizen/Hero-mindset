import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, serverTimestamp, type Firestore } from "firebase/firestore";
import { getFunctions, type Functions } from "firebase/functions";
import { getStorage, type FirebaseStorage } from "firebase/storage";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let functions: Functions | null = null;
let storage: FirebaseStorage | null = null;
let googleProvider: GoogleAuthProvider | null = null;
let isFirebaseConfigured = false;

const FIREBASE_CONFIG = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

const isConfiguredCheck = !!(
    FIREBASE_CONFIG.apiKey &&
    FIREBASE_CONFIG.projectId &&
    FIREBASE_CONFIG.appId
);

if (isConfiguredCheck) {
    try {
        app = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApp();
        auth = getAuth(app);
        db = getFirestore(app);
        functions = getFunctions(app, 'southamerica-east1');
        storage = getStorage(app);
        googleProvider = new GoogleAuthProvider();
        isFirebaseConfigured = true;
    } catch (e) {
        console.error("!!! FIREBASE INITIALIZATION FAILED:", e);
    }
} else {
    console.warn("!!! O FIREBASE NÃO ESTÁ CONFIGURADO. VERIFIQUE SUAS VARIÁVEIS DE AMBIENTE. !!!");
}

export { auth, db, functions, storage, googleProvider, serverTimestamp, isFirebaseConfigured };