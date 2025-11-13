
import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth, initializeAuth, browserLocalPersistence } from "firebase/auth";
import { getFirestore, serverTimestamp, Firestore } from "firebase/firestore";
import { getFunctions, Functions } from "firebase/functions";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: "hero-mindset.firebaseapp.com",
  projectId: "hero-mindset",
  storageBucket: "hero-mindset.appspot.com",
  messagingSenderId: "220402560101",
  appId: "1:220402560101:web:93c6fa158a1f675d55ea8c",
  measurementId: "G-FE75B12XCS"
};

// --- Singleton Pattern for Firebase Initialization ---
const initializeFirebaseServices = () => {
  const isConfigured = !!firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("placeholder");
  if (!isConfigured) {
    console.warn("!!! FIREBASE NÃO ESTÁ CONFIGURADO CORRETAMENTE !!!");
    // Return nulls if not configured to prevent crashes, but functionality will be disabled.
    return { isFirebaseConfigured: false, app: null, auth: null, db: null, functions: null, googleProvider: null };
  }

  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  
  let authInstance: Auth;
  try {
    // This is the primary action. We want to set persistence.
    // This will throw an error on HMR reloads if it's already been called.
    authInstance = initializeAuth(app, {
      persistence: browserLocalPersistence
    });
  } catch (error) {
    // If ANY error occurs, we assume it's because auth was already initialized.
    // We fall back to simply getting the existing instance. This is more robust
    // for HMR than checking for a specific error code.
    authInstance = getAuth(app);
  }

  const db = getFirestore(app);
  const functions = getFunctions(app, 'southamerica-east1');
  const googleProvider = new GoogleAuthProvider();

  return { isFirebaseConfigured: true, app, auth: authInstance, db, functions, googleProvider };
};

// Initialize and export the services.
const { isFirebaseConfigured, app, auth, db, functions, googleProvider } = initializeFirebaseServices();

// serverTimestamp needs to be exported separately as it's not an initialized service.
export { isFirebaseConfigured, app, auth, db, functions, googleProvider, serverTimestamp };
