/**
 * Fix-checking tests — verify bugs are resolved after the fix.
 *
 * Validates: Properties 1, 3, 5 from design.md
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { renderHook } from '@testing-library/react';

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
  mockSubscribeToUserConfig,
  mockSubscribeToTransactions,
  mockSaveTransaction,
  mockDeleteTransaction,
  mockSaveUserConfig,
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
  mockSubscribeToUserConfig: vi.fn(),
  mockSubscribeToTransactions: vi.fn(),
  mockSaveTransaction: vi.fn(),
  mockDeleteTransaction: vi.fn(),
  mockSaveUserConfig:          vi.fn().mockResolvedValue(undefined),
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
  subscribeToUserConfig: mockSubscribeToUserConfig,
  subscribeToTransactions: mockSubscribeToTransactions,
  saveTransaction: mockSaveTransaction,
  deleteTransaction: mockDeleteTransaction,
  saveUserConfig:          mockSaveUserConfig,
}));

import { useAuth } from '../hooks/useAuth';
import { useUserData } from '../hooks/useUserData';

// ─── 7.1 signIn() uses popup as primary regardless of device ─────────────
// Validates: Property 1
describe('7.1 Auth uses popup primary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRedirectResult.mockResolvedValue(null);
    mockOnAuthStateChanged.mockImplementation((auth, cb) => { cb(null); return () => {}; });
    mockSignInWithPopup.mockResolvedValue(undefined);
  });

  it('calls signInWithPopup primarily', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn();
    });

    expect(mockSignInWithPopup).toHaveBeenCalledTimes(1);
  });
});

// ─── 7.2 getRedirectResult resolves user and sets authState = "signed-in" ─────
// Validates: Property 1
describe('7.2 Redirect result restores auth state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets authState to signed-in when getRedirectResult returns a user', async () => {
    const mockUser = { uid: 'mobile-user', displayName: 'Mobile User' };
    mockGetRedirectResult.mockResolvedValue({ user: mockUser });
    mockOnAuthStateChanged.mockImplementation((auth, cb) => {
      cb(mockUser);
      return () => {};
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.authState).toBe('signed-in');
      expect(result.current.user).toEqual(mockUser);
    });
  });
});

// ─── 7.3 useUserData sets needsSetup=false when onboardingComplete=true ────────
// Validates: Property 3
describe('7.3 Returning user needsSetup override', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets needsSetup=false when onboardingComplete=true even if appData is absent', async () => {
    mockGetOnboardingStatus.mockResolvedValue({ onboardingComplete: true });
    mockSubscribeToUserConfig.mockImplementation((uid, onData, onSetup) => {
      onSetup();
      return () => {};
    });

    const { result } = renderHook(() => useUserData('user-returning'));

    await waitFor(() => {
      expect(result.current.onboardingChecked).toBe(true);
      expect(result.current.loaded).toBe(true);
    });

    expect(result.current.needsSetup).toBe(false);
  });
});

// ─── 7.4 SetupModal calls onComplete after successful save ────────────────────
// Validates: Property 3
describe('7.4 SetupModal calls onComplete after save', () => {
  it('calls onComplete after save() succeeds', async () => {
    const { SetupModal } = await import('../components/Modals');
    const mockSave       = vi.fn().mockResolvedValue(undefined);
    const mockClose      = vi.fn();
    const mockShowToast  = vi.fn();
    const mockOnComplete = vi.fn();

    render(
      <SetupModal
        data={{ monthlyIncome: 0, monthlyBudget: 0 }}
        save={mockSave}
        close={mockClose}
        showToast={mockShowToast}
        onComplete={mockOnComplete}
      />
    );

    const incomeInput = screen.getByPlaceholderText(/e\.g\. 55000/i);
    await userEvent.clear(incomeInput);
    await userEvent.type(incomeInput, '50000');

    const saveBtn = screen.getByText(/Save →/i);
    await userEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledTimes(1);
      expect(mockOnComplete).toHaveBeenCalledTimes(1);
      expect(mockClose).toHaveBeenCalledTimes(1);
    });

    // onComplete must be called before close
    const onCompleteOrder = mockOnComplete.mock.invocationCallOrder[0];
    const closeOrder      = mockClose.mock.invocationCallOrder[0];
    expect(onCompleteOrder).toBeLessThan(closeOrder);
  });
});

// ─── 7.5 MainApp does not render SetupModal while onboardingChecked = false ───
// Validates: Property 5
describe('7.5 No SetupModal while onboardingChecked is false', () => {
  it('onboardingChecked is false while async check is pending', () => {
    vi.clearAllMocks();
    // onboardingChecked never resolves
    mockGetOnboardingStatus.mockReturnValue(new Promise(() => {}));
    mockSubscribeToUserConfig.mockImplementation((uid, onData, onSetup) => {
      onSetup();
      return () => {};
    });

    const { result } = renderHook(() => useUserData('user-flicker'));

    // onboardingChecked is false → App.jsx gates on this and shows Splash
    expect(result.current.onboardingChecked).toBe(false);
  });
});

// ─── 7.6 MainApp does not render SetupModal when onboardingComplete=true ──────
// Validates: Property 3
describe('7.6 No SetupModal when onboardingComplete=true after check resolves', () => {
  it('needsSetup is false when onboardingComplete=true after onboardingChecked resolves', async () => {
    vi.clearAllMocks();
    mockGetOnboardingStatus.mockResolvedValue({ onboardingComplete: true });
    mockSubscribeToUserConfig.mockImplementation((uid, onData, onSetup) => {
      onSetup(); // appData absent
      return () => {};
    });

    const { result } = renderHook(() => useUserData('user-returning-2'));

    await waitFor(() => {
      expect(result.current.onboardingChecked).toBe(true);
    });

    expect(result.current.needsSetup).toBe(false);
  });
});
