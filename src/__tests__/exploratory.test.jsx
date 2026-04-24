/**
 * Exploratory tests — document what the bugs were and verify fixed behavior.
 *
 * These tests are written AFTER the fix is applied (Tasks 1–5 are done).
 * They verify the corrected behavior and serve as regression guards.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, waitFor } from '@testing-library/react';
import React from 'react';
import { renderHook } from '@testing-library/react';

// ─── Hoist mocks so they are available when vi.mock factories run ─────────────
const {
  mockSignInWithPopup,
  mockSignInWithRedirect,
  mockGetRedirectResult,
  mockSignOut,
  mockOnAuthStateChanged,
  mockSetPersistence,
  mockGetDoc,
  mockSetDoc,
  mockDoc,
  mockOnSnapshot,
  mockGetOnboardingStatus,
  mockSetOnboardingComplete,
  mockSubscribeToUserData,
  mockSaveUserData,
  mockIsMobile,
} = vi.hoisted(() => ({
  mockSignInWithPopup:    vi.fn(),
  mockSignInWithRedirect: vi.fn().mockResolvedValue(undefined),
  mockGetRedirectResult:  vi.fn().mockResolvedValue(null),
  mockSignOut:            vi.fn().mockResolvedValue(undefined),
  mockOnAuthStateChanged: vi.fn(),
  mockSetPersistence:     vi.fn().mockResolvedValue(undefined),
  mockGetDoc:             vi.fn(),
  mockSetDoc:             vi.fn().mockResolvedValue(undefined),
  mockDoc:                vi.fn((db, col, id) => ({ path: `${col}/${id}` })),
  mockOnSnapshot:         vi.fn(),
  mockGetOnboardingStatus:   vi.fn(),
  mockSetOnboardingComplete: vi.fn().mockResolvedValue(undefined),
  mockSubscribeToUserData:   vi.fn(),
  mockSaveUserData:          vi.fn().mockResolvedValue(undefined),
  mockIsMobile:              vi.fn(),
}));

vi.mock('../lib/firebase', () => ({
  auth: {},
  db: {},
  provider: {},
  signInWithPopup:    mockSignInWithPopup,
  signInWithRedirect: mockSignInWithRedirect,
  getRedirectResult:  mockGetRedirectResult,
  signOut:            mockSignOut,
  onAuthStateChanged: mockOnAuthStateChanged,
  ensureAuthPersistence: () => mockSetPersistence(),
  setPersistence:     mockSetPersistence,
  browserLocalPersistence: 'LOCAL',
  doc:        mockDoc,
  setDoc:     mockSetDoc,
  getDoc:     mockGetDoc,
  onSnapshot: mockOnSnapshot,
}));

vi.mock('../utils/formatters', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, isMobile: mockIsMobile };
});

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => React.createElement('div', props, children),
    button: ({ children, ...props }) => React.createElement('button', props, children),
  },
  AnimatePresence: ({ children }) => React.createElement(React.Fragment, null, children),
}));

vi.mock('../services/firestore', () => ({
  getOnboardingStatus:   mockGetOnboardingStatus,
  setOnboardingComplete: mockSetOnboardingComplete,
  saveOnboardingProfile: vi.fn().mockResolvedValue(undefined),
  subscribeToUserData:   mockSubscribeToUserData,
  saveUserData:          mockSaveUserData,
}));

import { useAuth } from '../hooks/useAuth';
import { useUserData } from '../hooks/useUserData';

// ─── 6.1 Mobile sign-in uses redirect, not popup ─────────────────────────────
describe('6.1 Mobile sign-in routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRedirectResult.mockResolvedValue(null);
    mockOnAuthStateChanged.mockImplementation((auth, cb) => { cb(null); return () => {}; });
    mockSignInWithRedirect.mockResolvedValue(undefined);
  });

  it('calls signInWithRedirect (not signInWithPopup) when isMobile() = true', async () => {
    mockIsMobile.mockReturnValue(true);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn();
    });

    expect(mockSignInWithRedirect).toHaveBeenCalledTimes(1);
    expect(mockSignInWithPopup).not.toHaveBeenCalled();
  });
});

// ─── 6.2 Returning user with onboardingComplete:true does NOT see SetupModal ──
describe('6.2 Returning user skips SetupModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // users/{uid} has onboardingComplete: true
    mockGetOnboardingStatus.mockResolvedValue({ onboardingComplete: true });
    // appData/{uid} is absent — onSetup would be called
    mockSubscribeToUserData.mockImplementation((uid, onData, onSetup) => {
      onSetup(); // no appData doc
      return () => {};
    });
  });

  it('does NOT show SetupModal when onboardingComplete=true even if appData is absent', async () => {
    const { result } = renderHook(() => useUserData('user-123'));

    await waitFor(() => {
      expect(result.current.onboardingChecked).toBe(true);
      expect(result.current.loaded).toBe(true);
    });

    // needsSetup should be false because onboardingComplete overrides it
    expect(result.current.needsSetup).toBe(false);
  });
});

// ─── 6.3 SetupModal not rendered while onboardingChecked = false ──────────────
describe('6.3 No SetupModal while onboardingChecked is false', () => {
  it('onboardingChecked starts as false before the async check resolves', () => {
    vi.clearAllMocks();

    // Make getOnboardingStatus never resolve (simulates pending check)
    mockGetOnboardingStatus.mockReturnValue(new Promise(() => {}));
    mockSubscribeToUserData.mockImplementation((uid, onData, onSetup) => {
      onSetup(); // would trigger needsSetup = true
      return () => {};
    });

    const { result } = renderHook(() => useUserData('user-456'));

    // onboardingChecked should still be false (promise hasn't resolved)
    expect(result.current.onboardingChecked).toBe(false);
  });
});
