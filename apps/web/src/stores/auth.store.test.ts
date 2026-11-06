import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore, getStoredRefreshToken, setStoredRefreshToken } from './auth.store';

describe('Auth Store (Zustand)', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.getState().clearAuth();
  });

  it('initializes with unauthenticated state', () => {
    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('updates accessToken and isAuthenticated upon setAccessToken', () => {
    useAuthStore.getState().setAccessToken('mock-access-token');

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('mock-access-token');
    expect(state.isAuthenticated).toBe(true);
  });

  it('resets state and clears persistent refresh token upon clearAuth', () => {
    setStoredRefreshToken('mock-refresh-token');
    useAuthStore.getState().setAccessToken('mock-access-token');

    useAuthStore.getState().clearAuth();

    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(getStoredRefreshToken()).toBeNull();
  });

  it('stores and retrieves refresh token from localStorage', () => {
    setStoredRefreshToken('persisted-token');
    expect(getStoredRefreshToken()).toBe('persisted-token');

    setStoredRefreshToken(null);
    expect(getStoredRefreshToken()).toBeNull();
  });
});
