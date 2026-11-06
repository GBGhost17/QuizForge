import { create } from 'zustand';

const REFRESH_TOKEN_KEY = 'quizforge_refresh_token';

/**
 * Retrieves the refresh token from persistent storage.
 */
export const getStoredRefreshToken = (): string | null => {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
};

/**
 * Persists or removes the refresh token in storage.
 */
export const setStoredRefreshToken = (token: string | null): void => {
  try {
    if (token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  } catch {
    // Storage access may be restricted in sandboxed environments
  }
};

export interface AuthUIState {
  accessToken: string | null;
  isAuthenticated: boolean;
  setAccessToken: (token: string | null) => void;
  clearAuth: () => void;
}

/**
 * Zustand store managing in-memory access token and client-side authentication state.
 * Access token is strictly kept in memory to mitigate XSS exposure.
 */
export const useAuthStore = create<AuthUIState>((set) => ({
  accessToken: null,
  isAuthenticated: false,
  setAccessToken: (token: string | null) =>
    set({
      accessToken: token,
      isAuthenticated: Boolean(token),
    }),
  clearAuth: () => {
    setStoredRefreshToken(null);
    set({
      accessToken: null,
      isAuthenticated: false,
    });
  },
}));
