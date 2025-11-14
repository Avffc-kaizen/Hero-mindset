
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, serverTimestamp } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

// FIX: Replaced import.meta.env with process.env to resolve TypeScript type errors.
// This assumes the build tool (e.g., Vite) is configured to expose these variables on process.env.
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Check if the configuration is valid
const isFirebaseConfigured = !!firebaseConfig.apiKey;

let app;
let auth: ReturnType<typeof getAuth> | null = null;
let db: ReturnType<typeof getFirestore> | null = null;
let functions: ReturnType<typeof getFunctions> | null = null;
let googleProvider: GoogleAuthProvider | null = null;

// Initialize Firebase only if the configuration is provided.
if (isFirebaseConfigured) {
  // HMR-safe initialization: ensures we don't re-initialize the app on hot reloads.
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  
  // Get services after ensuring the app is initialized.
  auth = getAuth(app);
  db = getFirestore(app);
  functions = getFunctions(app, 'southamerica-east1');
  googleProvider = new GoogleAuthProvider();
} else {
  console.warn("!!! FIREBASE NÃO ESTÁ CONFIGURADO. VERIFIQUE SUAS VARIÁVEIS DE AMBIENTE. !!!");
}

// Export the initialized services and the configuration status.
export { isFirebaseConfigured, auth, db, functions, googleProvider, serverTimestamp };
