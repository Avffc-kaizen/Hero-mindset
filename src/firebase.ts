
import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, serverTimestamp } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { FIREBASE_CONFIG } from "./constants";

const isFirebaseConfigured = !!FIREBASE_CONFIG.apiKey;

let app: FirebaseApp | null = null;
let auth: ReturnType<typeof getAuth> | null = null;
let db: ReturnType<typeof getFirestore> | null = null;
let functions: ReturnType<typeof getFunctions> | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (isFirebaseConfigured) {
  app = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApp();
  
  auth = getAuth(app);
  db = getFirestore(app);
  functions = getFunctions(app, 'southamerica-east1');
  googleProvider = new GoogleAuthProvider();
} else {
  console.warn("!!! FIREBASE IS NOT CONFIGURED. CHECK YOUR ENVIRONMENT VARIABLES. !!!");
}

export { app, isFirebaseConfigured, auth, db, functions, googleProvider, serverTimestamp };
