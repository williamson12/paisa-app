import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot, getDoc, enableIndexedDbPersistence } from "firebase/firestore";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  browserLocalPersistence,
  setPersistence,
} from "firebase/auth";

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const app      = initializeApp(firebaseConfig);
const db       = getFirestore(app);
const auth     = getAuth(app);

let authPersistencePromise = null;

function ensureAuthPersistence() {
  if (!authPersistencePromise) {
    authPersistencePromise = setPersistence(auth, browserLocalPersistence).catch((err) => {
      authPersistencePromise = null;
      throw err;
    });
  }

  return authPersistencePromise;
}

// Ensure session survives page reloads (required for signInWithRedirect on mobile).
ensureAuthPersistence().catch(console.error);

const provider = new GoogleAuthProvider();
provider.addScope("profile");
provider.addScope("email");
provider.setCustomParameters({ prompt: "select_account" });

// Enable offline persistence (best-effort — fails silently in non-supported envs)
enableIndexedDbPersistence(db).catch(() => {});

export {
  db, auth, provider,
  doc, setDoc, onSnapshot, getDoc,
  signInWithPopup, signInWithRedirect, getRedirectResult,
  signOut, onAuthStateChanged,
  browserLocalPersistence, setPersistence, ensureAuthPersistence,
};
