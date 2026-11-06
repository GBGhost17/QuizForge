import { create } from 'zustand';

export interface AuthUIState {
  accessToken: string | null;
  isAuthenticated: boolean;
  setAccessToken: (token: string | null) => void;
  clearAuth: () => void;
}

/**
 * Zustand store managing in-memory access token and client-side authentication state.
 * Access token is strictly kept in memory to mitigate XSS and local storage exposure.
 * Refresh tokens are managed exclusively via HttpOnly cookies by the server.
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
    set({
      accessToken: null,
      isAuthenticated: false,
    });
  },
}));
