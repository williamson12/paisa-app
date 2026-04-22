import { useState, useEffect, useCallback } from "react";
import { subscribeToUserData, saveUserData } from "../services/firestore";
import { DEFAULT_DATA } from "../utils/constants";

/**
 * Manages the user's financial data:
 * - Subscribes to Firestore with offline fallback
 * - Exposes a save() function that writes to both localStorage + Firestore
 */
export function useUserData(userId) {
  const [data, setData]       = useState(DEFAULT_DATA);
  const [loaded, setLoaded]   = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const unsub = subscribeToUserData(
      userId,
      (d) => {
        setData(d);
        setNeedsSetup(false);
        setLoaded(true);
      },
      () => {
        setNeedsSetup(true);
        setLoaded(true);
      }
    );

    return unsub;
  }, [userId]);

  const save = useCallback(async (newData) => {
    setData(newData); // Optimistic update
    try {
      await saveUserData(userId, newData);
    } catch (err) {
      console.error("Save error:", err);
      // Data already in localStorage via service — no crash
    }
  }, [userId]);

  return { data, loaded, needsSetup, setNeedsSetup, save };
}
