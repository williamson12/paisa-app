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

const authErrorMessages = {
  "auth/popup-closed-by-user":    "Sign-in cancelled. Please try again.",
  "auth/popup-blocked":           "Popup blocked. Opening Google sign-in in this tab instead.",
  "auth/network-request-failed":  "Network error. Check your connection.",
  "auth/cancelled-popup-request": "Sign-in cancelled. Please try again.",
  "auth/unauthorized-domain":     "This domain is not allowed in Firebase Auth. Add it in Firebase Console > Authentication > Settings > Authorized domains.",
  "auth/operation-not-supported-in-this-environment": "This browser cannot open a popup. Opening Google sign-in in this tab instead.",
};

export function useAuth() {
  const [authState, setAuthState] = useState("loading");
  const [user,      setUser]      = useState(null);
  const [error,     setError]     = useState("");

  // ✅ Step 1: Ensure persistence is set before anything auth-related runs
  useEffect(() => {
    ensureAuthPersistence().catch(console.error);
  }, []);

  // ✅ Step 2: Complete any pending redirect login BEFORE listening to auth state.
  //    On mobile, Google redirects back to your app — getRedirectResult() must be
  //    awaited to finalise the session. Without this, the user stays signed-out
  //    even after a successful Google redirect.
  useEffect(() => {
    let cancelled = false;

    ensureAuthPersistence()
      .then(() => getRedirectResult(auth))
      .then((result) => {
        if (cancelled) return;
        if (result?.user) {
          // onAuthStateChanged will also fire — this just surfaces errors if any
          setUser(result.user);
          setAuthState("signed-in");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Redirect result error:", err);
        setError(authErrorMessages[err.code] || "Sign-in failed. Please try again.");
        setAuthState("signed-out");
      });

    return () => { cancelled = true; };
  }, []);

  // ✅ Step 3: Auth state listener (covers page reloads, sign-out, token refresh)
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
        // ✅ Redirect flow — page will reload; getRedirectResult handles the rest
        await signInWithRedirect(auth, provider);
        return;
      }

      // Desktop: try popup first, fall back to redirect if blocked
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