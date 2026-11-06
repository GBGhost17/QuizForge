import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import { apiClient } from './api-client';
import { useAuthStore } from '../stores/auth.store';

vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>();
  return {
    default: {
      ...actual.default,
      post: vi.fn(),
    },
  };
});

describe('API Client Interceptors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().clearAuth();

    // Mock axios adapter on apiClient to prevent real network calls in jsdom
    apiClient.defaults.adapter = async (config) => ({
      data: { success: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });
  });

  it('attaches Bearer token from auth store when available', async () => {
    useAuthStore.getState().setAccessToken('valid-access-token');

    const requestInterceptor = apiClient.interceptors.request as unknown as {
      handlers: Array<{
        fulfilled: (cfg: { headers: Record<string, string> }) => {
          headers: Record<string, string>;
        };
      }>;
    };

    const handler = requestInterceptor.handlers[0]?.fulfilled;
    expect(handler).toBeDefined();

    if (handler) {
      const config = { headers: {} };
      const modifiedConfig = handler(config);
      expect(modifiedConfig.headers['Authorization']).toBe('Bearer valid-access-token');
    }
  });

  it('does not overwrite existing Authorization header', async () => {
    useAuthStore.getState().setAccessToken('store-token');

    const requestInterceptor = apiClient.interceptors.request as unknown as {
      handlers: Array<{
        fulfilled: (cfg: { headers: Record<string, string> }) => {
          headers: Record<string, string>;
        };
      }>;
    };

    const handler = requestInterceptor.handlers[0]?.fulfilled;
    if (handler) {
      const config = { headers: { Authorization: 'Custom-Bearer' } };
      const modifiedConfig = handler(config);
      expect(modifiedConfig.headers['Authorization']).toBe('Custom-Bearer');
    }
  });

  it('clears auth on 401 when refresh request fails', async () => {
    useAuthStore.getState().setAccessToken('expired-token');

    const mockedPost = vi.mocked(axios.post);
    mockedPost.mockRejectedValueOnce(new Error('Refresh cookie expired'));

    const responseInterceptor = apiClient.interceptors.response as unknown as {
      handlers: Array<{ rejected: (err: unknown) => Promise<unknown> }>;
    };

    const errorHandler = responseInterceptor.handlers[0]?.rejected;
    expect(errorHandler).toBeDefined();

    if (errorHandler) {
      const mockError = {
        config: { url: '/protected-resource', headers: {} },
        response: { status: 401 },
      };

      await expect(errorHandler(mockError)).rejects.toThrow();
      expect(useAuthStore.getState().accessToken).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    }
  });

  it('attempts token rotation upon 401 via HttpOnly cookie', async () => {
    useAuthStore.getState().setAccessToken('old-access-token');

    const mockedPost = vi.mocked(axios.post);
    mockedPost.mockResolvedValueOnce({
      data: {
        accessToken: 'new-rotated-access-token',
        user: { id: 'u1', email: 'test@quizforge.local', name: 'Test', role: 'USER' },
      },
    });

    const responseInterceptor = apiClient.interceptors.response as unknown as {
      handlers: Array<{ rejected: (err: unknown) => Promise<unknown> }>;
    };

    const errorHandler = responseInterceptor.handlers[0]?.rejected;
    if (errorHandler) {
      const mockError = {
        config: { url: '/user/profile', headers: {} },
        response: { status: 401 },
      };

      await errorHandler(mockError);

      expect(mockedPost).toHaveBeenCalledWith(
        expect.stringContaining('/auth/refresh'),
        {},
        { withCredentials: true },
      );
      expect(useAuthStore.getState().accessToken).toBe('new-rotated-access-token');
    }
  });
});
