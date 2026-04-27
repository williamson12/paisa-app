import { useState, useEffect, useCallback } from "react";
import {
  auth,
  provider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
} from "../lib/firebase";

// ─────────────────────────────────────────────────────────────────────────────
// WHY THIS WORKS — the exact root cause of every previous failure:
//
// Firebase's getRedirectResult() does TWO things, not one:
//   1. Exchanges the OAuth token from a pending redirect (if any)
//   2. WAITS for Firebase's full auth initialization to complete
//      (including session restoration from localStorage/IndexedDB)
//
// onAuthStateChanged fires as soon as it is registered. If registered
// BEFORE getRedirectResult resolves, Firebase may not have finished
// restoring the persisted session yet — so it fires null, the UI shows
// the login page, and the user is bounced even though they are signed in.
//
// THE FIX: always await getRedirectResult() before subscribing to
// onAuthStateChanged, on ALL browsers, without device detection.
// After getRedirectResult resolves, auth.currentUser is guaranteed to be
// correct and onAuthStateChanged fires exactly once with the right value.
//
// DOUBLE-INVOKE GUARD: getRedirectResult consumes the redirect token on
// first call. If called twice (e.g. React component remount), the second
// call returns null, making the user appear logged out. The module-level
// promise means it truly runs only once per page load regardless of
// how many times the component mounts.
// ─────────────────────────────────────────────────────────────────────────────

let _redirectResultPromise = null;

function getRedirectResultOnce() {
  if (!_redirectResultPromise) {
    console.debug("[auth] calling getRedirectResult (once per page load)");
    _redirectResultPromise = getRedirectResult(auth)
      .then((result) => {
        console.debug("[auth] getRedirectResult resolved:", result?.user?.email ?? "no redirect user");
        return result;
      })
      .catch((err) => {
        console.error("[auth] getRedirectResult error:", err.code, err.message);
        _redirectResultPromise = null; // allow retry on network failure
        return null;
      });
  }
  return _redirectResultPromise;
}

const ERROR_MESSAGES = {
  "auth/popup-closed-by-user":    "Sign-in cancelled. Please try again.",
  "auth/popup-blocked":           "Popup blocked — trying redirect…",
  "auth/network-request-failed":  "Network error. Check your connection.",
  "auth/cancelled-popup-request": "Sign-in cancelled. Please try again.",
  "auth/unauthorized-domain":     "Domain not authorised in Firebase Console.",
};

const POPUP_FALLBACK_CODES = new Set([
  "auth/popup-blocked",
  "auth/cancelled-popup-request",
  "auth/operation-not-supported-in-this-environment",
]);

export function useAuth() {
  const [authState, setAuthState] = useState("loading");
  const [user,      setUser]      = useState(null);
  const [error,     setError]     = useState("");

  useEffect(() => {
    let alive  = true;
    let unsub  = () => {};

    async function init() {
      // STEP 1 — Always await getRedirectResult.
      //   • Exchanges any pending OAuth redirect token with Google.
      //   • Waits for Firebase's auth module to fully initialize
      //     (session restored from localStorage, currentUser populated).
      //   • Safe to call when no redirect happened — resolves null instantly.
      //   • Module-level promise ensures it runs at most once per page load.
      await getRedirectResultOnce();

      if (!alive) return;

      // STEP 2 — Subscribe AFTER step 1 is done.
      //   Firebase now has the correct auth state. onAuthStateChanged fires
      //   immediately once with the definitive user (or null) and then on
      //   every future change (sign-in, sign-out, token refresh).
      console.debug("[auth] registering onAuthStateChanged listener");

      unsub = onAuthStateChanged(auth, (u) => {
        if (!alive) return;
        console.debug("[auth] onAuthStateChanged →", u ? u.email : "null");
        if (u) {
          setUser(u);
          setAuthState("signed-in");
        } else {
          setUser(null);
          setAuthState("signed-out");
        }
      });
    }

    init().catch((err) => {
      console.error("[auth] init fatal:", err);
      if (alive) setAuthState("signed-out"); // never leave user on splash
    });

    return () => {
      alive = false;
      unsub();
    };
  }, []);

  // ── Sign in ───────────────────────────────────────────────────────────────
  const signIn = useCallback(async () => {
    setError("");
    try {
      // Attempt popup first — resolves in-page on desktop, opens new tab on
      // mobile Safari (which Firebase handles automatically).
      try {
        console.debug("[auth] attempting signInWithPopup");
        await signInWithPopup(auth, provider);
        // onAuthStateChanged fires automatically → authState becomes "signed-in"
      } catch (popupErr) {
        if (POPUP_FALLBACK_CODES.has(popupErr.code)) {
          // Popup was blocked — fall back to redirect.
          // Reset the guard so the next page load calls getRedirectResult fresh.
          console.debug("[auth] popup blocked, falling back to signInWithRedirect");
          _redirectResultPromise = null;
          await signInWithRedirect(auth, provider);
          // Page navigates away here — nothing below runs.
          return;
        }
        throw popupErr;
      }
    } catch (err) {
      console.error("[auth] signIn error:", err.code, err.message);
      setError(ERROR_MESSAGES[err.code] || "Sign-in failed. Please try again.");
    }
  }, []);

  // ── Sign out ──────────────────────────────────────────────────────────────
  const signOutUser = useCallback(async () => {
    try {
      console.debug("[auth] signing out");
      await signOut(auth);
      // onAuthStateChanged fires → authState becomes "signed-out"
    } catch (err) {
      console.error("[auth] signOut error:", err);
    }
  }, []);

  return { authState, user, error, signIn, signOutUser };
}