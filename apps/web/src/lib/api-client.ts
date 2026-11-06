import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/auth.store';
import type { AuthResponse } from '@quizforge/shared-types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
  withCredentials: true,
});

// -------------------------------------------------------------
// REQUEST INTERCEPTOR: ATTACH ACCESS TOKEN
// -------------------------------------------------------------
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error),
);

// -------------------------------------------------------------
// RESPONSE INTERCEPTOR: HANDLE 401 & REFRESH TOKEN ROTATION
// -------------------------------------------------------------
interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null): void => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryConfig | undefined;

    // Reject immediately if no request config or not a 401 error
    if (!originalRequest || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Do not retry refresh, login, or already retried requests to prevent loops
    const isAuthRoute =
      originalRequest.url?.includes('/auth/refresh') ||
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/register');

    if (originalRequest._retry || isAuthRoute) {
      return Promise.reject(error);
    }

    // If a refresh is already in progress, enqueue this request
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((newAccessToken) => {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Call refresh endpoint with HttpOnly cookie automatically sent via credentials
      const response = await axios.post<AuthResponse>(
        `${API_BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true },
      );

      const { accessToken: newAccessToken } = response.data;

      // Update state with newly rotated token strictly in memory
      useAuthStore.getState().setAccessToken(newAccessToken);

      processQueue(null, newAccessToken);

      // Retry the failed original request with new token
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      useAuthStore.getState().clearAuth();

      // Redirect to login page in browser environment
      if (
        typeof window !== 'undefined' &&
        window.location?.pathname &&
        window.location.pathname !== '/login'
      ) {
        try {
          window.location.href = '/login';
        } catch {
          // jsdom navigation guard in test environments
        }
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
