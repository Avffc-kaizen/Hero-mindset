// FIX: Changed imports to use Firebase v8 compat library to resolve module export errors.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/functions';
import 'firebase/compat/analytics';


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: "hero-mindset.firebaseapp.com",
  projectId: "hero-mindset",
  storageBucket: "hero-mindset.appspot.com",
  messagingSenderId: "220402560101",
  appId: "1:220402560101:web:93c6fa158a1f675d55ea8c",
  measurementId: "G-FE75B12XCS"
};

// --- Conditional Initialization ---

export const isFirebaseConfigured = firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("AIzaSy") && !firebaseConfig.apiKey.includes("placeholder");

// FIX: Changed app initialization to Firebase v8 compat syntax.
let app: firebase.app.App | null = null;
if (isFirebaseConfigured) {
  if (firebase.apps.length === 0) {
    app = firebase.initializeApp(firebaseConfig);
  } else {
    app = firebase.app();
  }
}

// FIX: Changed service initialization to Firebase v8 compat syntax.
const auth = app ? firebase.auth() : null;
const db = app ? firebase.firestore() : null;
const functions = app ? app.functions('southamerica-east1') : null;
const googleProvider = app ? new firebase.auth.GoogleAuthProvider() : null;
let analytics: firebase.analytics.Analytics | null = null;

if (app && isFirebaseConfigured) {
  // FIX: Switched to v8 compat syntax for analytics.
  if (typeof window !== 'undefined') {
    firebase.analytics.isSupported().then(supported => {
      if (supported) {
          analytics = firebase.analytics();
      }
    }).catch(e => {
      console.warn("Firebase Analytics check failed.", e);
    });
  }
} else {
  console.warn("!!! FIREBASE NÃO ESTÁ CONFIGURADO CORRETAMENTE !!!");
  console.warn("A API Key parece ser um placeholder. Funcionalidades online podem não funcionar.");
}


// FIX: Export the `firebase` object itself for accessing compat library features like `FieldValue`.
// Export the services (they will be uninitialized if not configured but this is guarded by isFirebaseConfigured)
export { app, auth, db, functions, analytics, firebase, googleProvider };
