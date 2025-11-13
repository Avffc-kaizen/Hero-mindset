
import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";
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

// --- Conditional Initialization ---
export const isFirebaseConfigured = !!firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("placeholder");

let app: FirebaseApp | undefined;
let auth: Auth | null = null;
let db: Firestore | null = null;
let functions: Functions | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    functions = getFunctions(app, 'southamerica-east1');
    googleProvider = new GoogleAuthProvider();
  } catch (e) {
    console.error("Firebase initialization error:", e);
  }
} else {
  console.warn("!!! FIREBASE NÃO ESTÁ CONFIGURADO CORRETAMENTE !!!");
  console.warn("A API Key parece ser um placeholder. Funcionalidades online podem não funcionar.");
}


export { app, auth, db, functions, googleProvider, serverTimestamp };