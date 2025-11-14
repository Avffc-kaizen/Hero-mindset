import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, serverTimestamp, type Firestore } from "firebase/firestore";
import { getFunctions, type Functions } from "firebase/functions";

// --- Firebase instances (will be lazy-loaded) ---
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let functions: Functions | null = null;
let googleProvider: GoogleAuthProvider | null = null;
let _isFirebaseConfigured = false;

function _initializeFirebase() {
    // Prevent re-initialization
    if (_isFirebaseConfigured) {
        return;
    }

    const FIREBASE_CONFIG = {
        apiKey: process.env.VITE_FIREBASE_API_KEY,
        authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.VITE_FIREBASE_APP_ID,
        measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
    };

    const isConfigured = !!(
        FIREBASE_CONFIG.apiKey &&
        FIREBASE_CONFIG.projectId &&
        FIREBASE_CONFIG.appId &&
        !String(FIREBASE_CONFIG.apiKey).startsWith("VITE_")
    );

    if (isConfigured) {
        try {
            app = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApp();
            auth = getAuth(app);
            db = getFirestore(app);
            functions = getFunctions(app, 'southamerica-east1');
            googleProvider = new GoogleAuthProvider();
            _isFirebaseConfigured = true;
        } catch (e) {
            console.error("!!! FIREBASE INITIALIZATION FAILED:", e);
        }
    } else {
        console.warn("!!! O FIREBASE NÃO ESTÁ CONFIGURADO. VERIFIQUE SUAS VARIÁVEIS DE AMBIENTE. !!!");
    }
}

// --- Getters for Firebase services ---
// These will initialize on first call.

export function getIsFirebaseConfigured() {
    if (!_isFirebaseConfigured) _initializeFirebase();
    return _isFirebaseConfigured;
}

export function getFirebaseApp() {
    if (!app) _initializeFirebase();
    return app;
}

export function getFirebaseAuth() {
    if (!auth) _initializeFirebase();
    return auth;
}

export function getFirebaseDb() {
    if (!db) _initializeFirebase();
    return db;
}

export function getFirebaseFunctions() {
    if (!functions) _initializeFirebase();
    return functions;
}

export function getGoogleProvider() {
    if (!googleProvider) _initializeFirebase();
    return googleProvider;
}

// Re-export serverTimestamp for convenience
export { serverTimestamp };