# Mobile Auth & Onboarding Fix — Tasks

## Task List

- [ ] 1. Set up Firebase Auth session persistence
  - [ ] 1.1 Import `browserLocalPersistence` and `setPersistence` from `firebase/auth` in `src/lib/firebase.js`
  - [ ] 1.2 Call `setPersistence(auth, browserLocalPersistence)` immediately after `getAuth(app)` and export the resolved `auth` instance
  - [ ] 1.3 Export `browserLocalPersistence` and `setPersistence` from `src/lib/firebase.js` for use in tests

- [ ] 2. Add onboarding Firestore service functions
  - [ ] 2.1 Add `getOnboardingStatus(userId)` to `src/services/firestore.js` — performs a one-time `getDoc` on `users/{uid}` and returns `{ onboardingComplete: boolean }`
  - [ ] 2.2 Add `setOnboardingComplete(userId)` to `src/services/firestore.js` — writes `{ onboardingComplete: true }` to `users/{uid}` using `setDoc` with `{ merge: true }`
  - [ ] 2.3 Import `getDoc` from `firebase/firestore` in `src/lib/firebase.js` and re-export it

- [ ] 3. Update `useUserData` hook with onboarding check
  - [ ] 3.1 Add `onboardingChecked` state (boolean, starts `false`) to `useUserData`
  - [ ] 3.2 Add `onboardingComplete` state (boolean, starts `false`) to `useUserData`
  - [ ] 3.3 On mount, call `getOnboardingStatus(userId)` and set both `onboardingComplete` and `onboardingChecked` from the result
  - [ ] 3.4 Override `needsSetup` to `false` when `onboardingComplete === true`, regardless of `subscribeToUserData` result
  - [ ] 3.5 Add `markOnboardingComplete` callback to `useUserData` that calls `setOnboardingComplete(userId)` and sets local `onboardingComplete` state to `true`
  - [ ] 3.6 Expose `onboardingChecked` and `markOnboardingComplete` from the hook's return value

- [ ] 4. Update `SetupModal` to accept and call `onComplete` prop
  - [ ] 4.1 Add `onComplete` prop to `SetupModal` in `src/components/Modals.jsx`
  - [ ] 4.2 Call `onComplete()` inside `submit` after `save()` succeeds and before `close()`

- [ ] 5. Wire onboarding changes in `App.jsx`
  - [ ] 5.1 Destructure `onboardingChecked` and `markOnboardingComplete` from `useUserData` in `MainApp`
  - [ ] 5.2 Show `<Splash subtitle="Syncing your data..." />` until both `loaded` and `onboardingChecked` are `true`
  - [ ] 5.3 Pass `onComplete={markOnboardingComplete}` to `SetupModal` in `MainApp`

- [ ] 6. Write exploratory tests (run on unfixed code to confirm root causes)
  - [ ] 6.1 Write test: mock `isMobile() = true`, call `signIn()`, assert `signInWithRedirect` is called and `signInWithPopup` is NOT called
  - [ ] 6.2 Write test: mock `users/{uid}` with `onboardingComplete: true` and `appData/{uid}` absent, render `MainApp`, assert `SetupModal` is NOT shown — this should FAIL on unfixed code
  - [ ] 6.3 Write test: assert `SetupModal` is not rendered while `onboardingChecked = false` — this should FAIL on unfixed code

- [ ] 7. Write fix-checking tests (verify bugs are resolved after fix)
  - [ ] 7.1 Test `signIn()` calls `signInWithRedirect` when `isMobile() = true` (Property 1)
  - [ ] 7.2 Test `getRedirectResult` resolves user and sets `authState = "signed-in"` on page reload (Property 1)
  - [ ] 7.3 Test `useUserData` sets `needsSetup = false` when `getOnboardingStatus` returns `onboardingComplete: true`, even when `appData/{uid}` is absent (Property 3)
  - [ ] 7.4 Test `SetupModal` calls `onComplete` after successful save (Property 3)
  - [ ] 7.5 Test `MainApp` does not render `SetupModal` while `onboardingChecked = false` (Property 5)
  - [ ] 7.6 Test `MainApp` does not render `SetupModal` when `onboardingComplete = true` after `onboardingChecked` resolves (Property 3)

- [ ] 8. Write preservation-checking tests (verify unchanged behaviors)
  - [ ] 8.1 Test `signIn()` calls `signInWithPopup` when `isMobile() = false` — desktop flow unchanged (Property 2)
  - [ ] 8.2 Test `SetupModal` IS shown when `users/{uid}` has no `onboardingComplete` flag — new user flow unchanged (Property 4)
  - [ ] 8.3 Test `save()` still writes to `appData/{uid}` correctly after hook changes — financial data persistence unchanged (Requirements 3.3)
  - [ ] 8.4 Test `setOnboardingComplete` writes `{ onboardingComplete: true }` to `users/{uid}` with merge, not overwriting other fields (Requirements 3.3)
  - [ ] 8.5 Property-based test: for any combination of `isMobile()` result and auth method, the correct method is always selected (Property 2)
  - [ ] 8.6 Property-based test: for any user session state (various `appData` and `onboardingComplete` combinations), `SetupModal` visibility is always correct (Properties 3, 4)
