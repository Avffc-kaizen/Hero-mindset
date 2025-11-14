

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

// FIX: Switched from import.meta.env to process.env to resolve property 'env' does not exist error.
const FIREBASE_CONFIG = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
    measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

const isConfiguredCheck = !!(
    FIREBASE_CONFIG.apiKey &&
    FIREBASE_CONFIG.projectId &&
    FIREBASE_CONFIG.appId &&
    !String(FIREBASE_CONFIG.apiKey).startsWith("VITE_")
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
