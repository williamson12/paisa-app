import { db, doc, setDoc, getDoc, onSnapshot, collection, query, orderBy, limit, deleteDoc } from "../lib/firebase";

/**
 * Subscribe to the user's config document (income, budget).
 */
export function subscribeToUserConfig(userId, onData, onSetup) {
  const docRef = doc(db, "users", userId);
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      onData(snap.data());
    } else {
      onSetup();
    }
  }, (err) => {
    console.error("Firestore config subscription error:", err);
    onSetup();
  });
}

/**
 * Subscribe to the user's transactions subcollection.
 * Uses a limit of 2000 for scalable local caching and memory efficiency.
 */
export function subscribeToTransactions(userId, onData) {
  const q = query(
    collection(db, "users", userId, "transactions"),
    orderBy("date", "desc"),
    limit(2000)
  );

  return onSnapshot(q, (snap) => {
    const txns = [];
    snap.forEach((docSnap) => {
      txns.push({ id: docSnap.id, ...docSnap.data() });
    });
    onData(txns);
  }, (err) => {
    console.error("Firestore transactions subscription error:", err);
  });
}

/**
 * Add a new transaction (or update an existing one).
 * Uses setDoc with the provided ID to allow optimistic offline updates reliably.
 */
export async function saveTransaction(userId, txn) {
  const txRef = doc(db, "users", userId, "transactions", txn.id);
  await setDoc(txRef, {
    ...txn,
    createdAt: txn.createdAt || new Date().toISOString(),
  }, { merge: true });
}

/**
 * Delete a transaction.
 */
export async function deleteTransaction(userId, txId) {
  const txRef = doc(db, "users", userId, "transactions", txId);
  await deleteDoc(txRef);
}

/**
 * Check onboarding status.
 * Uses a timeout and falls back to a simple localStorage flag if completely offline.
 */
export async function getOnboardingStatus(userId) {
  const localKey = `paisa_onboarding_${userId}`;
  try {
    const docRef = doc(db, "users", userId);
    
    // 5-second timeout to prevent UI hang on slow networks or offline
    const snap = await Promise.race([
      getDoc(docRef),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000))
    ]);

    if (snap.exists() && snap.data().onboardingComplete) {
      localStorage.setItem(localKey, "true");
      return { onboardingComplete: true };
    }
    return { onboardingComplete: false };
  } catch (err) {
    console.error("getOnboardingStatus error/timeout:", err.message);
    const local = localStorage.getItem(localKey);
    return { onboardingComplete: local === "true" };
  }
}

/**
 * Save user config (income, budget, onboarding state).
 */
export async function saveUserConfig(userId, config) {
  const docRef = doc(db, "users", userId);
  if (config.onboardingComplete) {
    localStorage.setItem(`paisa_onboarding_${userId}`, "true");
  }
  await setDoc(docRef, { ...config, updatedAt: new Date().toISOString() }, { merge: true });
}
