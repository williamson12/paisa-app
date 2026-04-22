import { useState, useEffect, useCallback } from "react";
import { subscribeToUserData, saveUserData } from "../services/firestore";
import { DEFAULT_DATA, STORAGE_KEY } from "../utils/constants";

/**
 * Manages the user's financial data with a layered strategy:
 * 1. Immediate: Load from localStorage for zero-flicker UX.
 * 2. Background: Sync from Firestore and update state.
 */
export function useUserData(userId) {
  const [data, setData] = useState(() => {
    try {
      const local = localStorage.getItem(STORAGE_KEY);
      return local ? JSON.parse(local) : DEFAULT_DATA;
    } catch {
      return DEFAULT_DATA;
    }
  });
  
  const [loaded, setLoaded]   = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const unsub = subscribeToUserData(
      userId,
      (firestoreData) => {
        setData(firestoreData);
        // If income is not set, we need the onboarding prompt
        setNeedsSetup(!firestoreData.monthlyIncome);
        setLoaded(true);
      },
      () => {
        // Fallback or No Data: check if the current data (from local) is empty
        if (!data.monthlyIncome) {
          setNeedsSetup(true);
        }
        setLoaded(true);
      }
    );

    return unsub;
  }, [userId, data.monthlyIncome]);

  const save = useCallback(async (newData) => {
    setData(newData); // Optimistic UI update
    try {
      await saveUserData(userId, newData);
    } catch (err) {
      console.error("Save failed:", err);
    }
  }, [userId]);

  return { data, loaded, needsSetup, setNeedsSetup, save };
}
