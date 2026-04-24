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
]);

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
      .catch((err) => {
        console.error("Redirect result error:", err);
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
        await signInWithRedirect(auth, provider);
        return;
      }

      try {
        await signInWithPopup(auth, provider);
      } catch (err) {
        if (REDIRECT_FALLBACK_CODES.has(err.code)) {
          await signInWithRedirect(auth, provider);
          return;
        }

        throw err;
      }
    } catch (err) {
      console.error("Sign-in error:", err);

      const codes = {
        "auth/popup-closed-by-user": "Sign-in cancelled. Please try again.",
        "auth/popup-blocked": "Popup blocked. Redirecting sign-in did not start. Please try again.",
        "auth/network-request-failed": "Network error. Check your connection.",
        "auth/cancelled-popup-request": "Sign-in cancelled. Please try again.",
      };

      setError(codes[err.code] || "Sign-in failed. Please try again.");
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
