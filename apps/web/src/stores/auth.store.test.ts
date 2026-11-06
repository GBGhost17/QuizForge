import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './auth.store';

describe('Auth Store (Zustand)', () => {
  beforeEach(() => {
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

  it('resets state strictly in memory upon clearAuth', () => {
    useAuthStore.getState().setAccessToken('mock-access-token');

    useAuthStore.getState().clearAuth();

    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});
