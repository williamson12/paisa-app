import { useState, useEffect, useCallback } from "react";
import {
  subscribeToUserData,
  saveUserData,
  getOnboardingStatus,
  setOnboardingComplete as persistOnboardingComplete,
  saveOnboardingProfile,
} from "../services/firestore";
import { DEFAULT_DATA } from "../utils/constants";

/**
 * Manages the user's financial data:
 * - Subscribes to Firestore with offline fallback
 * - Checks onboarding status from users/{uid}
 * - Exposes save() for appData/{uid} and onboarding completion for users/{uid}
 */
export function useUserData(userId) {
  const [data, setData] = useState(DEFAULT_DATA);
  const [loaded, setLoaded] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    if (!userId) return;

    let active = true;
    getOnboardingStatus(userId)
      .then(({ onboardingComplete: complete }) => {
        if (active) setOnboardingComplete(complete);
      })
      .catch((err) => {
        console.error("getOnboardingStatus error:", err);
      })
      .finally(() => {
        if (active) setOnboardingChecked(true);
      });

    return () => {
      active = false;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    return subscribeToUserData(
      userId,
      (d) => {
        setData(d);
        setNeedsSetup(false);
        setLoaded(true);
      },
      () => {
        setData(DEFAULT_DATA);
        setNeedsSetup(true);
        setLoaded(true);
      }
    );
  }, [userId]);

  const save = useCallback(async (newData) => {
    setData(newData);

    try {
      await saveUserData(userId, newData);
    } catch (err) {
      console.error("Save error:", err);
    }
  }, [userId]);

  const markOnboardingComplete = useCallback(async (profile) => {
    try {
      if (profile) {
        await saveOnboardingProfile(userId, profile);
      } else {
        await persistOnboardingComplete(userId);
      }

      setOnboardingComplete(true);
      setNeedsSetup(false);
    } catch (err) {
      console.error("markOnboardingComplete error:", err);
      throw err;
    }
  }, [userId]);

  return {
    data,
    loaded,
    needsSetup: onboardingComplete ? false : needsSetup,
    setNeedsSetup,
    save,
    onboardingChecked,
    markOnboardingComplete,
  };
}
