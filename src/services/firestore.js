import { db, doc, setDoc, onSnapshot } from "../lib/firebase";
import { STORAGE_KEY } from "../utils/constants";

/**
 * Subscribe to the user's Firestore document.
 * Falls back to localStorage if Firestore times out or errors.
 *
 * @param {string} userId
 * @param {(data: object) => void} onData   Called with data when resolved
 * @param {() => void}             onSetup  Called when no data exists anywhere
 * @returns {() => void}                    Unsubscribe function
 */
export function subscribeToUserData(userId, onData, onSetup) {
  const docRef = doc(db, "appData", userId);
  let resolved = false;

  const fallback = () => {
    const local = localStorage.getItem(STORAGE_KEY);
    if (local) {
      try { onData(JSON.parse(local)); return; } catch {}
    }
    onSetup();
  };

  // 5-second Firestore timeout → graceful offline fallback
  const timer = setTimeout(() => {
    if (!resolved) {
      console.warn("Firestore timeout — using local data.");
      fallback();
    }
  }, 5000);

  const unsub = onSnapshot(
    docRef,
    (snap) => {
      resolved = true;
      clearTimeout(timer);
      if (snap.exists()) {
        onData(snap.data());
      } else {
        const local = localStorage.getItem(STORAGE_KEY);
        if (local) {
          try {
            const d = JSON.parse(local);
            onData(d);
            // Migrate local data to Firestore silently
            setDoc(docRef, d).catch(console.error);
          } catch { onSetup(); }
        } else {
          onSetup();
        }
      }
    },
    (err) => {
      resolved = true;
      clearTimeout(timer);
      console.warn("Firestore error:", err.code);
      fallback();
    }
  );

  return () => { clearTimeout(timer); unsub(); };
}

/**
 * Persist data to both localStorage and Firestore.
 */
export async function saveUserData(userId, data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  const docRef = doc(db, "appData", userId);
  await setDoc(docRef, data);
}
