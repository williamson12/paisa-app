/**
 * Shared Firebase mock factory for tests.
 * Import and call setupFirebaseMocks() in each test file's beforeEach.
 */
import { vi } from 'vitest';

export function createFirebaseMocks() {
  const mockSignInWithPopup = vi.fn().mockResolvedValue({ user: { uid: 'test-uid', displayName: 'Test User' } });
  const mockSignInWithRedirect = vi.fn().mockResolvedValue(undefined);
  const mockGetRedirectResult = vi.fn().mockResolvedValue(null);
  const mockSignOut = vi.fn().mockResolvedValue(undefined);
  const mockOnAuthStateChanged = vi.fn((auth, cb) => {
    cb(null);
    return () => {};
  });
  const mockSetPersistence = vi.fn().mockResolvedValue(undefined);
  const mockGetDoc = vi.fn();
  const mockSetDoc = vi.fn().mockResolvedValue(undefined);
  const mockDoc = vi.fn((db, collection, id) => ({ path: `${collection}/${id}` }));
  const mockOnSnapshot = vi.fn(() => () => {});

  return {
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
  };
}
