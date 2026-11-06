import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import { useAuthStore } from '../stores/auth.store';
import type { AuthResponse, UserProfile } from '@quizforge/shared-types';
import type { LoginInput, RegisterInput } from '@quizforge/validation';

export const AUTH_QUERY_KEY = ['auth', 'me'] as const;

export function useAuth() {
  const queryClient = useQueryClient();
  const { accessToken, isAuthenticated, isInitialized, setAccessToken, clearAuth } = useAuthStore();

  // -------------------------------------------------------------
  // SERVER STATE: CURRENT USER PROFILE
  // -------------------------------------------------------------
  const {
    data: user = null,
    isLoading,
    isError,
    error,
    refetch: refetchUser,
  } = useQuery<UserProfile | null>({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async () => {
      const response = await apiClient.get<UserProfile>('/auth/me');
      return response.data;
    },
    enabled: Boolean(accessToken && isAuthenticated),
    staleTime: 5 * 60 * 1000, // Cache profile for 5 minutes
    retry: false,
  });

  // -------------------------------------------------------------
  // MUTATION: LOGIN
  // -------------------------------------------------------------
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginInput): Promise<AuthResponse> => {
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
      return response.data;
    },
    onSuccess: (data) => {
      setAccessToken(data.accessToken);
      queryClient.setQueryData(AUTH_QUERY_KEY, data.user);
    },
  });

  // -------------------------------------------------------------
  // MUTATION: REGISTER
  // -------------------------------------------------------------
  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterInput): Promise<AuthResponse> => {
      const response = await apiClient.post<AuthResponse>('/auth/register', credentials);
      return response.data;
    },
    onSuccess: (data) => {
      setAccessToken(data.accessToken);
      queryClient.setQueryData(AUTH_QUERY_KEY, data.user);
    },
  });

  // -------------------------------------------------------------
  // MUTATION: LOGOUT
  // -------------------------------------------------------------
  const logoutMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      await apiClient.post('/auth/logout');
    },
    onSettled: () => {
      clearAuth();
      queryClient.removeQueries({ queryKey: AUTH_QUERY_KEY });
      queryClient.clear();
    },
  });

  // -------------------------------------------------------------
  // HELPER: SILENT REFRESH FROM HTTPONLY COOKIE
  // -------------------------------------------------------------
  const refreshSession = useCallback(async (): Promise<AuthResponse | null> => {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/refresh');
      setAccessToken(response.data.accessToken);
      queryClient.setQueryData(AUTH_QUERY_KEY, response.data.user);
      return response.data;
    } catch {
      clearAuth();
      return null;
    }
  }, [setAccessToken, clearAuth, queryClient]);

  return {
    user,
    isAuthenticated,
    isInitialized,
    isLoading,
    isError,
    error,
    refetchUser,
    refreshSession,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,
    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
  };
}
