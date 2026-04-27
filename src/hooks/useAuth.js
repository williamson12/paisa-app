import { useState, useEffect, useCallback, useRef } from "react";
import {
  auth,
  provider,
  isMobile,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  ensureAuthPersistence,
} from "../lib/firebase";

const REDIRECT_FALLBACK_CODES = new Set([
  "auth/popup-blocked",
  "auth/cancelled-popup-request",
  "auth/operation-not-supported-in-this-environment",
]);

const authErrorMessages = {
  "auth/popup-closed-by-user":    "Sign-in cancelled. Please try again.",
  "auth/popup-blocked":           "Popup blocked. Redirecting to Google sign-in…",
  "auth/network-request-failed":  "Network error. Check your connection.",
  "auth/cancelled-popup-request": "Sign-in cancelled. Please try again.",
  "auth/unauthorized-domain":     "This domain is not authorised in Firebase Console.",
  "auth/operation-not-supported-in-this-environment": "Redirecting to Google sign-in…",
};

export function useAuth() {
  const [authState, setAuthState] = useState("loading");
  const [user,      setUser]      = useState(null);
  const [error,     setError]     = useState("");

  // Track whether getRedirectResult has finished so onAuthStateChanged
  // doesn't prematurely flip the state to "signed-out" on mobile.
  const redirectChecked = useRef(!isMobile()); // desktop: skip, mobile: wait

  // ── Step 1: Process redirect result on EVERY mobile device ───────────────
  // Both iOS and Android use signInWithRedirect, so we must always call
  // getRedirectResult() on mobile — not just Android.
  useEffect(() => {
    if (!isMobile()) return; // desktop uses popup — nothing to process

    let cancelled = false;

    ensureAuthPersistence()
      .then(() => getRedirectResult(auth))
      .then((result) => {
        if (cancelled) return;
        if (result?.user) {
          setUser(result.user);
          setAuthState("signed-in");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Redirect result error:", err);
        setError(authErrorMessages[err.code] || "Sign-in failed. Please try again.");
      })
      .finally(() => {
        if (!cancelled) {
          redirectChecked.current = true;
        }
      });

    return () => { cancelled = true; };
  }, []);

  // ── Step 2: Auth state listener — covers all platforms ───────────────────
  // On mobile we defer to the redirect-result check above for the initial
  // auth state so we don't flash "signed-out" before the redirect completes.
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        setAuthState("signed-in");
      } else {
        // Only set signed-out once the redirect result has been processed.
        // Without this guard, mobile users see a signed-out flash mid-redirect.
        if (redirectChecked.current) {
          setUser(null);
          setAuthState("signed-out");
        }
      }
    });
    return unsub;
  }, []);

  // ── Sign-in ───────────────────────────────────────────────────────────────
  const signIn = useCallback(async () => {
    setError("");

    try {
      await ensureAuthPersistence();

      if (isMobile()) {
        // ALL mobile devices use redirect:
        //   • iOS Safari: third-party cookie restrictions (ITP) break popup auth.
        //   • Android:    redirect is more stable than popup in WebViews/Chrome.
        await signInWithRedirect(auth, provider);
        return; // page will reload — execution stops here
      }

      // Desktop: popup is fast and reliable
      try {
        await signInWithPopup(auth, provider);
      } catch (err) {
        if (REDIRECT_FALLBACK_CODES.has(err.code)) {
          // Last-resort fallback for browsers that block popups even on desktop
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

  // ── Sign-out ──────────────────────────────────────────────────────────────
  const signOutUser = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Sign-out error:", err);
    }
  }, []);

  return { authState, user, error, signIn, signOutUser };
}