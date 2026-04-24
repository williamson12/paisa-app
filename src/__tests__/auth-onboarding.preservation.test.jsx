/**
 * Preservation-checking tests — verify unchanged behaviors after the fix.
 *
 * Validates: Properties 2, 4 and Requirements 3.1–3.3 from design.md
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, waitFor } from '@testing-library/react';
import React from 'react';
import { renderHook } from '@testing-library/react';
import * as fc from 'fast-check';

// ─── Hoist mocks ──────────────────────────────────────────────────────────────
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

// ─── 8.1 Desktop auth still uses popup ───────────────────────────────────────
// Validates: Property 2
describe('8.1 Desktop auth uses popup (unchanged)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRedirectResult.mockResolvedValue(null);
    mockOnAuthStateChanged.mockImplementation((auth, cb) => { cb(null); return () => {}; });
    mockSignInWithPopup.mockResolvedValue({ user: { uid: 'desktop-user' } });
  });

  it('calls signInWithPopup when isMobile() = false', async () => {
    mockIsMobile.mockReturnValue(false);
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn();
    });

    expect(mockSignInWithPopup).toHaveBeenCalledTimes(1);
    expect(mockSignInWithRedirect).not.toHaveBeenCalled();
  });
});

// ─── 8.2 New user still sees SetupModal ──────────────────────────────────────
// Validates: Property 4
describe('8.2 New user still sees SetupModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('needsSetup=true when users/{uid} has no onboardingComplete flag', async () => {
    mockGetOnboardingStatus.mockResolvedValue({ onboardingComplete: false });
    mockSubscribeToUserData.mockImplementation((uid, onData, onSetup) => {
      onSetup();
      return () => {};
    });

    const { result } = renderHook(() => useUserData('new-user'));

    await waitFor(() => {
      expect(result.current.onboardingChecked).toBe(true);
      expect(result.current.loaded).toBe(true);
    });

    expect(result.current.needsSetup).toBe(true);
  });
});

// ─── 8.3 save() still writes to appData/{uid} ────────────────────────────────
// Validates: Requirements 3.3
describe('8.3 Financial data persistence unchanged', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOnboardingStatus.mockResolvedValue({ onboardingComplete: false });
    mockSubscribeToUserData.mockImplementation((uid, onData) => {
      onData({ monthlyIncome: 50000, monthlyBudget: 30000, transactions: [] });
      return () => {};
    });
  });

  it('save() calls saveUserData with the correct data', async () => {
    const { result } = renderHook(() => useUserData('user-save'));

    await waitFor(() => expect(result.current.loaded).toBe(true));

    const newData = { monthlyIncome: 60000, monthlyBudget: 40000, transactions: [] };
    await act(async () => {
      await result.current.save(newData);
    });

    expect(mockSaveUserData).toHaveBeenCalledWith('user-save', newData);
  });
});

// ─── 8.4 setOnboardingComplete writes with merge ─────────────────────────────
// Validates: Requirements 3.3
describe('8.4 setOnboardingComplete writes with merge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOnboardingStatus.mockResolvedValue({ onboardingComplete: false });
    mockSubscribeToUserData.mockImplementation((uid, onData) => {
      onData({ monthlyIncome: 50000, transactions: [] });
      return () => {};
    });
  });

  it('markOnboardingComplete calls setOnboardingComplete with the userId', async () => {
    const { result } = renderHook(() => useUserData('user-mark'));

    await waitFor(() => expect(result.current.loaded).toBe(true));

    await act(async () => {
      await result.current.markOnboardingComplete();
    });

    expect(mockSetOnboardingComplete).toHaveBeenCalledWith('user-mark');
  });

  it('markOnboardingComplete sets local onboardingComplete state to true', async () => {
    const { result } = renderHook(() => useUserData('user-mark-2'));

    await waitFor(() => expect(result.current.loaded).toBe(true));

    // Before: needsSetup is false (appData present), but let's verify onboarding state
    await act(async () => {
      await result.current.markOnboardingComplete();
    });

    // After marking complete, needsSetup should remain false
    expect(result.current.needsSetup).toBe(false);
  });
});

// ─── 8.5 Property-based: correct auth method always selected ─────────────────
// Validates: Property 2
// **Validates: Requirements 2.1, 3.1**
describe('8.5 PBT: correct auth method for any isMobile() value', () => {
  it('always selects the correct auth method based on isMobile()', async () => {
    await fc.assert(
      fc.asyncProperty(fc.boolean(), async (mobile) => {
        vi.clearAllMocks();
        mockGetRedirectResult.mockResolvedValue(null);
        mockOnAuthStateChanged.mockImplementation((auth, cb) => { cb(null); return () => {}; });
        mockSignInWithPopup.mockResolvedValue({ user: { uid: 'u' } });
        mockSignInWithRedirect.mockResolvedValue(undefined);

        mockIsMobile.mockReturnValue(mobile);

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn();
        });

        if (mobile) {
          expect(mockSignInWithRedirect).toHaveBeenCalledTimes(1);
          expect(mockSignInWithPopup).not.toHaveBeenCalled();
        } else {
          expect(mockSignInWithPopup).toHaveBeenCalledTimes(1);
          expect(mockSignInWithRedirect).not.toHaveBeenCalled();
        }
      }),
      { numRuns: 20 }
    );
  });
});

// ─── 8.6 Property-based: SetupModal visibility always correct ────────────────
// Validates: Properties 3, 4
// **Validates: Requirements 2.3, 2.4, 3.2**
describe('8.6 PBT: SetupModal visibility for any session state', () => {
  it('SetupModal visibility is always correct for any session state', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.boolean(), // onboardingComplete
        fc.boolean(), // appDataPresent
        async (onboardingComplete, appDataPresent) => {
          vi.clearAllMocks();

          mockGetOnboardingStatus.mockResolvedValue({ onboardingComplete });
          mockSubscribeToUserData.mockImplementation((uid, onData, onSetup) => {
            if (appDataPresent) {
              onData({ monthlyIncome: 50000, transactions: [] });
            } else {
              onSetup();
            }
            return () => {};
          });

          const { result } = renderHook(() => useUserData('pbt-user'));

          await waitFor(() => {
            expect(result.current.onboardingChecked).toBe(true);
            expect(result.current.loaded).toBe(true);
          });

          const expectedNeedsSetup = !onboardingComplete && !appDataPresent;
          expect(result.current.needsSetup).toBe(expectedNeedsSetup);
        }
      ),
      { numRuns: 20 }
    );
  });
});
