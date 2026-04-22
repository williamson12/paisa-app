import { useState, useEffect, useCallback } from "react";
import { auth, provider, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from "../lib/firebase";

/**
 * Manages the full Firebase auth lifecycle:
 * - Uses redirect-based sign-in (production standard for PWAs)
 * - Guards against redirect loops using sessionStorage
 * - Exposes authState: "loading" | "signed-out" | "signed-in"
 */
export function useAuth() {
  const [authState, setAuthState] = useState("loading");
  const [user, setUser]           = useState(null);
  const [error, setError]         = useState("");

  // Handle redirect result (returns here after Google redirect)
  useEffect(() => {
    // Check if we already handled this redirect in this tab session to prevent loops
    if (sessionStorage.getItem("paisa_auth_handled")) {
      return;
    }

    getRedirectResult(auth)
      .then((result) => {
        // Mark as handled immediately to block loops on reloads
        sessionStorage.setItem("paisa_auth_handled", "true");
        
        if (result?.user) {
          setUser(result.user);
          setAuthState("signed-in");
        }
      })
      .catch((err) => {
        console.error("Redirect error:", err);
        sessionStorage.setItem("paisa_auth_handled", "true");
        
        // Map common errors to friendly messages
        const messages = {
          "auth/credential-already-in-use": "This Google account is already linked.",
          "auth/network-request-failed":   "Network error. Please check your connection.",
        };
        setError(messages[err.code] || "Sign-in failed. Please try again.");
      });
  }, []);

  // Subscribe to auth state
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
    // Reset guard before starting a fresh flow
    sessionStorage.removeItem("paisa_auth_handled");
    try {
      await signInWithRedirect(auth, provider);
    } catch (err) {
      console.error("Redirect start error:", err);
      setError("Could not start Google sign-in.");
    }
  }, []);

  const signOutUser = useCallback(async () => {
    try {
      sessionStorage.removeItem("paisa_auth_handled");
      await signOut(auth);
    } catch (err) {
      console.error("Sign-out error:", err);
    }
  }, []);

  return { authState, user, error, signIn, signOutUser };
}
