
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from 'firebase/functions';
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDYAR2rsJ673seTMClTGfMhp4a6GjwLEio",
  authDomain: "hero-mindset.firebaseapp.com",
  projectId: "hero-mindset",
  storageBucket: "hero-mindset.appspot.com",
  messagingSenderId: "220402560101",
  appId: "1:220402560101:web:93c6fa158a1f675d55ea8c",
  measurementId: "G-FE75B12XCS"
};

// --- Conditional Initialization ---

export const isFirebaseConfigured = firebaseConfig.apiKey !== "YOUR_FIREBASE_API_KEY" && !firebaseConfig.apiKey.startsWith('{{');

let app, auth, db, functions, analytics;

if (isFirebaseConfigured) {
  // Initialize Firebase
  app = initializeApp(firebaseConfig);

  // Initialize Firebase services
  auth = getAuth(app);
  db = getFirestore(app);
  // É uma boa prática especificar a região se suas funções não estiverem em us-central1
  functions = getFunctions(app, 'southamerica-east1');
  analytics = getAnalytics(app);
} else {
  console.error("!!! FIREBASE NÃO ESTÁ CONFIGURADO !!!");
  console.error("Por favor, adicione sua Web API Key no arquivo 'src/firebase.ts'");
}


// Export the services (they will be undefined if not configured)
export { app, auth, db, functions, analytics };