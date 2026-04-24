# Bugfix Requirements Document

## Introduction

This document covers two related bugs in the Paisa finance tracker app that together degrade the mobile user experience:

**Bug 1 — Google Auth popup fails on mobile:** On mobile browsers, `signInWithPopup` is blocked or silently fails because mobile browsers restrict cross-origin popups. The fix is to detect mobile devices and use `signInWithRedirect` instead, then handle the result via `getRedirectResult` after the page reloads.

**Bug 2 — Onboarding popup repeats on every visit:** The income/savings setup modal (`SetupModal`) is shown whenever `needsSetup` is true, which is derived purely from whether a Firestore document exists. Because the document path used is `appData/{uid}` and the onboarding completion state is not explicitly stored, returning users who open a fresh link may see the setup modal again. The fix is to persist an `onboardingComplete` flag in Firestore under `users/{uid}` and check it after auth state is confirmed before deciding whether to show the modal.

---

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user taps "Continue with Google" on a mobile browser THEN the system attempts `signInWithPopup`, which is blocked or fails silently, leaving the user stuck on the login screen with no feedback or a generic error.

1.2 WHEN `signInWithPopup` is blocked on mobile THEN the system does not fall back to `signInWithRedirect`, so the sign-in flow never completes on mobile devices.

1.3 WHEN a returning user opens the app link on any device after a previous successful onboarding THEN the system shows the income/savings setup modal again because `onboardingComplete` is not stored in Firestore and `needsSetup` is re-evaluated from scratch on each session.

1.4 WHEN the app loads and auth state is still being resolved THEN the system may briefly render the setup modal or the main UI before the auth and onboarding checks complete, causing a visible UI flicker.

---

### Expected Behavior (Correct)

2.1 WHEN a user taps "Continue with Google" on a mobile browser THEN the system SHALL detect the mobile context and call `signInWithRedirect` instead of `signInWithPopup`, initiating a full-page redirect to Google's auth flow.

2.2 WHEN the page reloads after a mobile redirect sign-in THEN the system SHALL call `getRedirectResult` to retrieve the authenticated user and restore auth state correctly via `onAuthStateChanged`.

2.3 WHEN a user completes the income/savings setup modal for the first time THEN the system SHALL persist `{ income, savings, onboardingComplete: true }` to Firestore at `users/{uid}`, marking onboarding as done.

2.4 WHEN a returning user opens the app and auth state is confirmed THEN the system SHALL fetch the `users/{uid}` Firestore document and, if `onboardingComplete === true`, skip the setup modal entirely.

2.5 WHEN the app is loading auth state or fetching the onboarding flag THEN the system SHALL display a loading/splash state and SHALL NOT render the setup modal or main content until both checks are complete, preventing UI flicker.

2.6 WHEN a user signs in on mobile and the redirect completes THEN the system SHALL maintain session persistence using `browserLocalPersistence` so the user remains signed in across page reloads.

---

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user signs in on a desktop browser THEN the system SHALL CONTINUE TO use `signInWithPopup` for a seamless inline sign-in experience.

3.2 WHEN a new user signs in for the first time and no `onboardingComplete` flag exists in Firestore THEN the system SHALL CONTINUE TO show the income/savings setup modal so they can configure their financial baseline.

3.3 WHEN a user saves their income and budget via the setup modal THEN the system SHALL CONTINUE TO persist transaction and financial data to Firestore under `appData/{uid}` as before.

3.4 WHEN a user is already signed in and navigates between tabs (Home, Add, History, Charts, Advisor) THEN the system SHALL CONTINUE TO render the correct page without re-triggering auth or onboarding checks.

3.5 WHEN Firestore is unavailable or times out THEN the system SHALL CONTINUE TO fall back to localStorage for financial data, and SHALL CONTINUE TO show the setup modal only if no local data exists either.

3.6 WHEN a user signs out THEN the system SHALL CONTINUE TO clear auth state and return to the login screen.

---

## Bug Condition Derivation

### Bug 1 — Mobile Auth

```pascal
FUNCTION isMobileAuthBugCondition(X)
  INPUT: X of type AuthAttempt { browser: string, device: string }
  OUTPUT: boolean

  RETURN isMobileDevice(X.device) AND authMethod(X) = signInWithPopup
END FUNCTION

// Property: Fix Checking — Mobile Auth
FOR ALL X WHERE isMobileAuthBugCondition(X) DO
  result ← signIn'(X)
  ASSERT usedRedirect(result) = true
    AND authState'(result) = "signed-in"
    AND no_crash(result)
END FOR

// Property: Preservation Checking — Desktop Auth
FOR ALL X WHERE NOT isMobileAuthBugCondition(X) DO
  ASSERT signIn(X) = signIn'(X)   // popup flow unchanged on desktop
END FOR
```

### Bug 2 — Onboarding Repeat

```pascal
FUNCTION isOnboardingBugCondition(X)
  INPUT: X of type UserSession { uid: string, firestoreDoc: object | null }
  OUTPUT: boolean

  RETURN X.firestoreDoc.onboardingComplete = true
    AND onboardingModalShown(X) = true
END FUNCTION

// Property: Fix Checking — Onboarding Skip
FOR ALL X WHERE isOnboardingBugCondition(X) DO
  result ← resolveOnboarding'(X)
  ASSERT onboardingModalShown(result) = false
END FOR

// Property: Preservation Checking — New User Onboarding
FOR ALL X WHERE NOT isOnboardingBugCondition(X) AND X.firestoreDoc = null DO
  ASSERT resolveOnboarding(X) = resolveOnboarding'(X)  // modal still shown for new users
END FOR
```
