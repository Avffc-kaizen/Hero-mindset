import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, serverTimestamp, type Firestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
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

// The configuration was inserted directly to avoid issues with environment variables in AI Studio.
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDYAR2rsJ673seTMClTGfMhp4a6GjwLEio",
  authDomain: "hero-mindset.firebaseapp.com",
  projectId: "hero-mindset",
  storageBucket: "hero-mindset.appspot.com",
  messagingSenderId: "220402560101",
  appId: "1:220402560101:web:93c6fa158a1f675d55ea8c",
  measurementId: "G-FE75B12XCS"
};


// Simple check to ensure keys are not empty.
if (FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId) {
    try {
        app = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApp();
        auth = getAuth(app);
        
        // Initialize Firestore with offline persistence using the new API
        if (typeof window !== 'undefined') {
            try {
                db = initializeFirestore(app, {
                    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
                });
            } catch (err: any) {
                console.warn(`Firestore persistence could not be enabled: ${err.code}. The app will work online-only.`);
                // Fallback to default in-memory cache if persistence fails
                db = getFirestore(app);
            }
        } else {
            // For non-browser environments
            db = getFirestore(app);
        }

        functions = getFunctions(app, 'southamerica-east1');
        storage = getStorage(app);
        googleProvider = new GoogleAuthProvider();
        
        // Only initialize analytics in a browser environment
        if (typeof window !== 'undefined') {
            analytics = getAnalytics(app);
        }

        isFirebaseConfigured = true;
    } catch (e) {
        console.error("!!! FIREBASE INITIALIZATION FAILED:", e);
    }
} else {
    console.warn("!!! FIREBASE IS NOT CONFIGURED. CHECK VALUES IN src/firebase.ts !!!");
}

export { auth, db, functions, storage, googleProvider, serverTimestamp, isFirebaseConfigured, analytics };
