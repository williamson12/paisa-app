import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
  getDoc,
  enableIndexedDbPersistence,
} from "firebase/firestore";
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

const app  = initializeApp(firebaseConfig);
const db   = getFirestore(app);
const auth = getAuth(app);

// ─── Auth Persistence ──────────────────────────────────────────────────────
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

// Kick off persistence immediately so it's ready before any sign-in call.
ensureAuthPersistence().catch(console.error);

// ─── Google Auth Provider ──────────────────────────────────────────────────
const provider = new GoogleAuthProvider();
provider.addScope("profile");
provider.addScope("email");
provider.setCustomParameters({ prompt: "select_account" });

// ─── Device Detection ──────────────────────────────────────────────────────
/**
 * Returns true for any mobile/tablet device.
 * Both iOS and Android use signInWithRedirect — popup is unreliable on mobile:
 *   • iOS Safari blocks third-party cookies needed for popup auth (ITP).
 *   • Android Chrome often blocks popups.
 */
function isMobile() {
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
    navigator.userAgent
  );
}

// ─── Offline Persistence (Firestore) ──────────────────────────────────────
// Best-effort — fails silently in unsupported environments (e.g. Safari private).
enableIndexedDbPersistence(db).catch(() => {});

// ─── Exports ───────────────────────────────────────────────────────────────
export {
  db, auth, provider, isMobile,
  doc, setDoc, onSnapshot, getDoc,
  signInWithPopup, signInWithRedirect, getRedirectResult,
  signOut, onAuthStateChanged,
  browserLocalPersistence, setPersistence, ensureAuthPersistence,
};
