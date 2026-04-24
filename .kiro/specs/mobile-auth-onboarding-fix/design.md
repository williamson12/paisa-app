# Mobile Auth & Onboarding Fix — Bugfix Design

## Overview

This document covers the design for fixing two related bugs in the Paisa finance tracker app that together degrade the mobile user experience.

**Bug 1 — Google Auth popup fails on mobile:** `signInWithPopup` is blocked by mobile browsers. The fix detects mobile devices via the existing `isMobile()` utility and switches to `signInWithRedirect`, then handles the result via `getRedirectResult` on page reload. Desktop popup flow is unchanged. Session persistence is enforced via `browserLocalPersistence`.

**Bug 2 — Onboarding popup repeats on every visit:** The `SetupModal` is shown whenever `needsSetup` is true, which is derived solely from whether the `appData/{uid}` Firestore document exists. Because `onboardingComplete` is never stored, returning users who open a fresh session see the modal again. The fix persists `onboardingComplete: true` to a separate `users/{uid}` document in Firestore when setup is completed, and checks that flag after auth state is confirmed before showing the modal.

---

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug — mobile device using popup auth, or returning user with `onboardingComplete: true` seeing the setup modal.
- **Property (P)**: The desired behavior when the bug condition holds — redirect used on mobile; modal skipped for returning users.
- **Preservation**: Existing desktop popup flow, new-user onboarding flow, financial data persistence, and tab navigation that must remain unchanged by the fix.
- **`isMobile()`**: Utility in `src/utils/formatters.js` that detects mobile devices via `navigator.userAgent`.
- **`useAuth()`**: Hook in `src/hooks/useAuth.js` that manages the Firebase auth lifecycle, exposes `authState`, `user`, `signIn`, and `signOutUser`.
- **`useUserData()`**: Hook in `src/hooks/useUserData.js` that subscribes to `appData/{uid}` in Firestore and exposes `needsSetup`.
- **`subscribeToUserData()`**: Service function in `src/services/firestore.js` that subscribes to `appData/{uid}` with a localStorage fallback.
- **`saveUserData()`**: Service function in `src/services/firestore.js` that persists financial data to `appData/{uid}`.
- **`needsSetup`**: Boolean state in `useUserData` that is `true` when no financial data document exists anywhere.
- **`onboardingComplete`**: Boolean flag stored at `users/{uid}` in Firestore that marks whether the user has completed the setup modal at least once.
- **`browserLocalPersistence`**: Firebase Auth persistence mode that keeps the user signed in across page reloads in the same browser.
- **`SetupModal`**: The income/savings configuration modal in `src/components/Modals.jsx`, shown to new users on first sign-in.
- **`AuthGate`**: Component in `src/App.jsx` that routes between splash, login, and main app based on `authState`.
- **`MainApp`**: Component in `src/App.jsx` that owns the `setup` modal state and calls `useUserData`.

---

## Bug Details

### Bug 1 — Mobile Auth Popup

The bug manifests when a user on a mobile browser taps "Continue with Google". The `signIn` function in `useAuth.js` calls `signInWithPopup`, which mobile browsers block or silently fail. The user is left on the login screen with no progress.

**Formal Specification:**
```
FUNCTION isMobileAuthBugCondition(X)
  INPUT: X of type AuthAttempt { device: string, authMethod: string }
  OUTPUT: boolean

  RETURN isMobile(X.device) = true
    AND X.authMethod = "signInWithPopup"
END FUNCTION
```

**Examples:**
- iPhone Safari: user taps "Continue with Google" → popup blocked → stuck on login screen (bug)
- Android Chrome: user taps "Continue with Google" → popup silently fails → no feedback (bug)
- MacBook Chrome: user clicks "Continue with Google" → popup opens → signs in successfully (no bug)
- iPad Safari: user taps "Continue with Google" → popup blocked → stuck on login screen (bug)

---

### Bug 2 — Onboarding Repeat

The bug manifests when a returning user opens the app after a previous successful onboarding. `useUserData` calls `subscribeToUserData`, which checks `appData/{uid}`. If the document exists, `onData` is called and `needsSetup` stays `false`. However, if the document is absent (e.g., cleared, new device, or Firestore timeout), `onSetup` is called and `needsSetup` becomes `true`, triggering the modal — even though the user already completed onboarding. Additionally, there is no explicit `onboardingComplete` flag, so the system cannot distinguish a genuinely new user from a returning user whose data is temporarily unavailable.

**Formal Specification:**
```
FUNCTION isOnboardingBugCondition(X)
  INPUT: X of type UserSession { uid: string, firestoreOnboardingDoc: object | null }
  OUTPUT: boolean

  RETURN X.firestoreOnboardingDoc.onboardingComplete = true
    AND onboardingModalShown(X) = true
END FUNCTION
```

**Examples:**
- Returning user, `appData/{uid}` exists, no `onboardingComplete` flag → modal shown again (bug)
- Returning user, `appData/{uid}` missing (new device), no `onboardingComplete` flag → modal shown again (bug)
- New user, no Firestore data anywhere → modal shown (correct, no bug)
- Returning user, `onboardingComplete: true` in `users/{uid}` → modal skipped (correct after fix)

---

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Desktop users signing in via `signInWithPopup` must continue to work exactly as before.
- New users with no `onboardingComplete` flag in Firestore must still see the `SetupModal` on first sign-in.
- Financial data (`transactions`, `monthlyIncome`, `monthlyBudget`) must continue to be persisted to `appData/{uid}` as before.
- Tab navigation (Home, Add, History, Charts, Advisor) must continue to work without re-triggering auth or onboarding checks.
- Sign-out must continue to clear auth state and return to the login screen.
- Firestore offline fallback to localStorage must continue to work for financial data.

**Scope:**
All inputs that do NOT involve a mobile device attempting popup auth, or a returning user with `onboardingComplete: true`, should be completely unaffected by this fix. This includes:
- Desktop sign-in flows
- New user first-time onboarding
- All financial data read/write operations
- All page navigation within the authenticated app

---

## Hypothesized Root Cause

### Bug 1 — Mobile Auth

1. **No mobile detection before popup**: `useAuth.js` already imports `isMobile` and `signInWithRedirect`, and the `signIn` callback already has the correct branching logic (`if (isMobile()) signInWithRedirect else signInWithPopup`). However, `browserLocalPersistence` is not explicitly set, which may cause session loss after the redirect completes.

2. **Missing `setPersistence` call**: Firebase Auth defaults to `browserSessionPersistence` in some environments. Without explicitly calling `setPersistence(auth, browserLocalPersistence)` before the redirect, the session may not survive the page reload that follows `signInWithRedirect`.

3. **`getRedirectResult` race with `onAuthStateChanged`**: Both effects run on mount. If `onAuthStateChanged` fires before `getRedirectResult` resolves, `authState` may briefly flicker to `"signed-out"` before settling on `"signed-in"`.

### Bug 2 — Onboarding Repeat

1. **No `onboardingComplete` flag stored**: `saveUserData` in `firestore.js` only writes to `appData/{uid}`. There is no write to `users/{uid}` with an `onboardingComplete` flag. The `SetupModal.submit` handler calls `save(data)` which goes through `saveUserData` — it never sets `onboardingComplete`.

2. **`needsSetup` derived from data absence only**: `useUserData` sets `needsSetup = true` whenever `subscribeToUserData` calls `onSetup` (i.e., no Firestore doc and no localStorage). This is correct for new users but incorrect for returning users whose data is temporarily unavailable.

3. **No separate onboarding check**: There is no hook or service function that reads `users/{uid}` to check `onboardingComplete`. The `MainApp` component only uses `needsSetup` from `useUserData`, which is purely data-driven.

4. **UI flicker during auth resolution**: `AuthGate` shows `<Splash />` while `authState === "loading"`, but once `authState === "signed-in"`, `MainApp` renders immediately. If `useUserData` hasn't loaded yet, the `needsSetup` check in `MainApp` runs before Firestore data arrives, potentially showing the modal for a frame.

---

## Correctness Properties

Property 1: Bug Condition — Mobile Auth Uses Redirect

_For any_ auth attempt where `isMobile()` returns true, the fixed `signIn` function SHALL call `signInWithRedirect` (not `signInWithPopup`), and after the redirect completes, `getRedirectResult` SHALL resolve the authenticated user, resulting in `authState === "signed-in"` with session persisted via `browserLocalPersistence`.

**Validates: Requirements 2.1, 2.2, 2.6**

Property 2: Preservation — Desktop Auth Uses Popup

_For any_ auth attempt where `isMobile()` returns false, the fixed `signIn` function SHALL produce exactly the same behavior as the original function, calling `signInWithPopup` and resolving `authState === "signed-in"` without any redirect.

**Validates: Requirements 3.1**

Property 3: Bug Condition — Returning User Skips Onboarding Modal

_For any_ user session where `users/{uid}` exists in Firestore with `onboardingComplete === true`, the fixed app SHALL NOT show the `SetupModal`, regardless of whether `appData/{uid}` is present or absent.

**Validates: Requirements 2.3, 2.4**

Property 4: Preservation — New User Still Sees Onboarding Modal

_For any_ user session where `users/{uid}` does NOT exist in Firestore (or `onboardingComplete` is absent/false), the fixed app SHALL show the `SetupModal` so the user can configure their financial baseline, preserving the new-user onboarding flow.

**Validates: Requirements 3.2**

Property 5: Preservation — No UI Flicker During Loading

_For any_ app load where auth state or Firestore checks are in progress, the fixed app SHALL display a loading/splash state and SHALL NOT render the `SetupModal` or main content until both `authState` is resolved and the onboarding check is complete.

**Validates: Requirements 2.5**

---

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

---

**File**: `src/lib/firebase.js`

**Changes**:
1. **Import `browserLocalPersistence` and `setPersistence`** from `firebase/auth`.
2. **Call `setPersistence(auth, browserLocalPersistence)`** immediately after `getAuth(app)` so the session survives page reloads after redirect.

---

**File**: `src/services/firestore.js`

**Changes**:
1. **Add `getOnboardingStatus(userId)`** — a one-time read of `users/{uid}` that returns `{ onboardingComplete: boolean }`. Uses `getDoc` (not `onSnapshot`) since this is a one-time check at session start.
2. **Add `setOnboardingComplete(userId)`** — writes `{ onboardingComplete: true }` to `users/{uid}` using `setDoc` with `{ merge: true }` so it doesn't overwrite other potential fields.

---

**File**: `src/hooks/useUserData.js`

**Changes**:
1. **Add `onboardingChecked` state** — boolean, starts `false`, set to `true` once the `users/{uid}` check resolves.
2. **Add `onboardingComplete` state** — boolean, starts `false`, set from the Firestore read result.
3. **On mount, call `getOnboardingStatus(userId)`** — resolves before or in parallel with `subscribeToUserData`. If `onboardingComplete === true`, override `needsSetup` to `false` regardless of what `subscribeToUserData` returns.
4. **Expose `onboardingChecked`** so `MainApp` can gate rendering until both data and onboarding checks are done.
5. **Update `save()`** — after a successful save that includes the first-time setup data, call `setOnboardingComplete(userId)` to persist the flag.

   Alternatively (simpler): expose a `markOnboardingComplete` callback from the hook, called by `SetupModal` via `App.jsx` after a successful save.

---

**File**: `src/App.jsx`

**Changes**:
1. **Pass `markOnboardingComplete` to `SetupModal`** — called inside `SetupModal.submit` after `save()` succeeds, so the `users/{uid}` flag is written at the right moment.
2. **Gate `MainApp` render on `onboardingChecked`** — show `<Splash subtitle="Syncing your data…" />` until both `loaded` and `onboardingChecked` are true, preventing the modal from flashing before checks complete.
3. **Update the `needsSetup` → `setup` logic** — the existing `if (!setup && needsSetup)` block in `MainApp` already works; it just needs `needsSetup` to be correctly `false` for returning users, which the hook changes above will ensure.

---

**File**: `src/components/Modals.jsx`

**Changes**:
1. **Accept `onComplete` prop in `SetupModal`** — called after `save()` succeeds in `submit`, before `close()`. This is the hook for writing `onboardingComplete: true` to Firestore.

---

### Implementation Order

1. `src/lib/firebase.js` — add `setPersistence` (prerequisite for Bug 1)
2. `src/services/firestore.js` — add `getOnboardingStatus` and `setOnboardingComplete`
3. `src/hooks/useUserData.js` — add onboarding check logic and expose `onboardingChecked`
4. `src/components/Modals.jsx` — add `onComplete` prop to `SetupModal`
5. `src/App.jsx` — wire `onComplete`, gate on `onboardingChecked`, pass `markOnboardingComplete`

---

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate each bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

---

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bugs BEFORE implementing the fix. Confirm or refute the root cause analysis.

**Bug 1 — Test Plan**: Mock `isMobile()` to return `true` and assert that `signIn()` calls `signInWithPopup`. This should fail on unfixed code if the branching is missing, or pass if the branching already exists (confirming the root cause is `setPersistence`, not the branch itself).

**Bug 1 — Test Cases**:
1. **Mobile popup call test**: Mock `isMobile() = true`, call `signIn()`, assert `signInWithPopup` was called — should FAIL on unfixed code (or reveal the real root cause).
2. **Mobile redirect call test**: Mock `isMobile() = true`, call `signIn()`, assert `signInWithRedirect` was called — should PASS if branching exists, confirming `setPersistence` is the missing piece.
3. **Redirect result test**: Mock `getRedirectResult` to return a user, assert `authState` becomes `"signed-in"` — should PASS if `getRedirectResult` effect is wired correctly.

**Bug 2 — Test Plan**: Render `MainApp` with a mocked `useUserData` that returns `needsSetup: true` (simulating a returning user whose `appData` doc is missing). Assert that `SetupModal` is shown. This should PASS on unfixed code (demonstrating the bug).

**Bug 2 — Test Cases**:
1. **Returning user modal test**: Mock `users/{uid}` with `onboardingComplete: true`, mock `appData/{uid}` as absent, assert `SetupModal` is NOT shown — should FAIL on unfixed code.
2. **New user modal test**: Mock both docs as absent, assert `SetupModal` IS shown — should PASS on both unfixed and fixed code.
3. **Flicker test**: Assert `SetupModal` is not rendered while `onboardingChecked = false` — should FAIL on unfixed code.

**Expected Counterexamples**:
- `SetupModal` renders for returning users when `appData/{uid}` is absent
- `signInWithPopup` is called on mobile (if branching is missing) or session is lost after redirect (if `setPersistence` is missing)

---

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed functions produce the expected behavior.

**Pseudocode:**
```
// Bug 1
FOR ALL X WHERE isMobileAuthBugCondition(X) DO
  result := signIn_fixed(X)
  ASSERT usedRedirect(result) = true
    AND authState(result) = "signed-in"
    AND sessionPersists(result) = true
END FOR

// Bug 2
FOR ALL X WHERE isOnboardingBugCondition(X) DO
  result := resolveOnboarding_fixed(X)
  ASSERT onboardingModalShown(result) = false
END FOR
```

---

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed functions produce the same result as the original functions.

**Pseudocode:**
```
// Bug 1 — Desktop auth unchanged
FOR ALL X WHERE NOT isMobileAuthBugCondition(X) DO
  ASSERT signIn_original(X) = signIn_fixed(X)
END FOR

// Bug 2 — New user onboarding unchanged
FOR ALL X WHERE NOT isOnboardingBugCondition(X) AND X.firestoreOnboardingDoc = null DO
  ASSERT resolveOnboarding_original(X) = resolveOnboarding_fixed(X)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because it generates many test cases automatically across the input domain and catches edge cases that manual unit tests might miss.

**Test Cases**:
1. **Desktop popup preservation**: Verify `signInWithPopup` is still called when `isMobile() = false` after fix.
2. **New user onboarding preservation**: Verify `SetupModal` still appears when `users/{uid}` has no `onboardingComplete` flag.
3. **Financial data preservation**: Verify `save()` still writes to `appData/{uid}` correctly after the hook changes.
4. **Tab navigation preservation**: Verify switching tabs does not re-trigger auth or onboarding checks.

---

### Unit Tests

- Test `signIn()` calls `signInWithRedirect` when `isMobile()` returns `true`
- Test `signIn()` calls `signInWithPopup` when `isMobile()` returns `false`
- Test `getOnboardingStatus()` returns `{ onboardingComplete: true }` when `users/{uid}` doc exists with that flag
- Test `getOnboardingStatus()` returns `{ onboardingComplete: false }` when `users/{uid}` doc is absent
- Test `setOnboardingComplete()` writes `{ onboardingComplete: true }` to `users/{uid}` with merge
- Test `useUserData` sets `needsSetup = false` when `onboardingComplete = true`, even if `appData/{uid}` is absent
- Test `SetupModal` calls `onComplete` after a successful save
- Test `MainApp` does not render `SetupModal` while `onboardingChecked = false`

### Property-Based Tests

- Generate random `isMobile()` return values and verify the correct auth method is always selected
- Generate random user session states (various combinations of `appData` presence and `onboardingComplete` values) and verify `SetupModal` visibility is always correct
- Generate random sequences of save operations and verify `onboardingComplete` is written exactly once (on first save) and `appData` is always written

### Integration Tests

- Full mobile sign-in flow: mock redirect, verify `getRedirectResult` resolves user, verify `authState === "signed-in"`, verify session persists across simulated reload
- Full returning user flow: sign in, complete setup, sign out, sign in again — verify modal does not reappear
- Full new user flow: sign in with no prior data — verify modal appears, user completes it, `onboardingComplete` is written to Firestore
- Firestore offline scenario: `appData/{uid}` unavailable but `users/{uid}` has `onboardingComplete: true` — verify modal is still suppressed
