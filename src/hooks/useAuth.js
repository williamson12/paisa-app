import { useState, useEffect, useCallback } from "react";
import {
  auth,
  provider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  ensureAuthPersistence,
} from "../lib/firebase";
import { isMobile } from "../utils/formatters";

const REDIRECT_FALLBACK_CODES = new Set([
  "auth/popup-blocked",
  "auth/cancelled-popup-request",
  "auth/operation-not-supported-in-this-environment",
]);

const REDIRECT_STORAGE_KEY = "paisa_google_redirect_pending";

const authErrorMessages = {
  "auth/popup-closed-by-user": "Sign-in cancelled. Please try again.",
  "auth/popup-blocked": "Popup blocked. Opening Google sign-in in this tab instead.",
  "auth/network-request-failed": "Network error. Check your connection.",
  "auth/cancelled-popup-request": "Sign-in cancelled. Please try again.",
  "auth/unauthorized-domain": "This domain is not allowed in Firebase Auth. Add it in Firebase Console > Authentication > Settings > Authorized domains.",
  "auth/operation-not-supported-in-this-environment": "This browser cannot open a popup. Opening Google sign-in in this tab instead.",
};

function markRedirectStarted() {
  sessionStorage.setItem(REDIRECT_STORAGE_KEY, "1");
}

function clearRedirectStarted() {
  sessionStorage.removeItem(REDIRECT_STORAGE_KEY);
}

/**
 * Manages the full Firebase auth lifecycle:
 * - Uses redirect sign-in on mobile browsers
 * - Keeps popup sign-in on desktop with redirect fallback
 * - Restores redirect sessions through onAuthStateChanged
 */
export function useAuth() {
  const [authState, setAuthState] = useState("loading");
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    ensureAuthPersistence()
      .then(() => getRedirectResult(auth))
      .then((result) => {
        if (result?.user) {
          clearRedirectStarted();
        }
      })
      .catch((err) => {
        console.error("Redirect result error:", err);
        clearRedirectStarted();
        setError(authErrorMessages[err.code] || "Google sign-in could not be completed. Please try again.");
      });
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        setAuthState("signed-in");
      } else {
        setUser(null);
        setAuthState("signed-out");
      }
    });

    return unsub;
  }, []);

  const signIn = useCallback(async () => {
    setError("");

    try {
      await ensureAuthPersistence();

      if (isMobile()) {
        markRedirectStarted();
        await signInWithRedirect(auth, provider);
        return;
      }

      try {
        await signInWithPopup(auth, provider);
      } catch (err) {
        if (REDIRECT_FALLBACK_CODES.has(err.code)) {
          markRedirectStarted();
          await signInWithRedirect(auth, provider);
          return;
        }

        throw err;
      }
    } catch (err) {
      console.error("Sign-in error:", err);

      clearRedirectStarted();
      setError(authErrorMessages[err.code] || "Sign-in failed. Please try again.");
    }
  }, []);

  const signOutUser = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Sign-out error:", err);
    }
  }, []);

  return { authState, user, error, signIn, signOutUser };
}
