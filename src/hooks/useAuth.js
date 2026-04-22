import { useState, useEffect, useCallback } from "react";
import { auth, provider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from "../lib/firebase";
import { isMobile } from "../utils/formatters";

/**
 * Manages the full Firebase auth lifecycle:
 * - Detects redirect result on mobile
 * - Uses popup on desktop, redirect on mobile
 * - Exposes authState: "loading" | "signed-out" | "signed-in"
 */
export function useAuth() {
  const [authState, setAuthState] = useState("loading");
  const [user, setUser]           = useState(null);
  const [error, setError]         = useState("");

  // Handle redirect result (mobile sign-in returns here after redirect)
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          setUser(result.user);
          setAuthState("signed-in");
        }
      })
      .catch((err) => {
        console.error("Redirect result error:", err);
        // Non-fatal — redirect may simply not have happened
      });
  }, []);

  // Subscribe to auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) { setUser(u); setAuthState("signed-in"); }
      else   { setUser(null); setAuthState("signed-out"); }
    });
    return unsub;
  }, []);

  const signIn = useCallback(async () => {
    setError("");
    try {
      if (isMobile()) {
        await signInWithRedirect(auth, provider);
        // Page will redirect — nothing more to do here
      } else {
        await signInWithPopup(auth, provider);
      }
    } catch (err) {
      console.error("Sign-in error:", err);
      const codes = {
        "auth/popup-closed-by-user":   "Sign-in cancelled. Please try again.",
        "auth/popup-blocked":          "Popup blocked. Please allow popups for this site.",
        "auth/network-request-failed": "Network error. Check your connection.",
        "auth/cancelled-popup-request":"Sign-in cancelled. Please try again.",
      };
      setError(codes[err.code] || "Sign-in failed. Please try again.");
    }
  }, []);

  const signOutUser = useCallback(async () => {
    try { await signOut(auth); } catch (err) { console.error("Sign-out error:", err); }
  }, []);

  return { authState, user, error, signIn, signOutUser };
}
