import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { type ReactNode } from 'react';
import { useAuth } from './useAuth';
import { useAuthStore, getStoredRefreshToken } from '../stores/auth.store';
import { apiClient } from '../lib/api-client';

describe('useAuth hook', () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    return function QueryWrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useAuthStore.getState().clearAuth();

    // Mock axios adapter on apiClient to prevent real network calls
    apiClient.defaults.adapter = async (config) => ({
      data: { success: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });
  });

  it('provides unauthenticated initial status', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('performs login and updates both store and query state', async () => {
    const mockAuthResponse = {
      accessToken: 'login-access-tok',
      refreshToken: 'login-refresh-tok',
      user: {
        id: 'u-1',
        email: 'user@quizforge.local',
        name: 'Logged In User',
        role: 'USER' as const,
        avatarUrl: null,
        isEmailVerified: true,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    };

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: mockAuthResponse,
    });

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.login({
        email: 'user@quizforge.local',
        password: 'ValidPass123',
      });
    });

    expect(postSpy).toHaveBeenCalledWith('/auth/login', {
      email: 'user@quizforge.local',
      password: 'ValidPass123',
    });

    expect(useAuthStore.getState().accessToken).toBe('login-access-tok');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(getStoredRefreshToken()).toBe('login-refresh-tok');
    expect(result.current.user).toEqual(mockAuthResponse.user);

    postSpy.mockRestore();
  });

  it('performs logout and clears state and cache', async () => {
    useAuthStore.getState().setAccessToken('active-token');
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: { message: 'Đăng xuất thành công' },
    });

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.logout();
    });

    expect(postSpy).toHaveBeenCalledWith('/auth/logout', expect.any(Object));
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);

    postSpy.mockRestore();
  });
});
