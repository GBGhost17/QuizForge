import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useEffect } from 'react';
import { refreshSessionRequest } from '../lib/api-client';
import { useAuthStore } from '../stores/auth.store';
import { AUTH_QUERY_KEY } from '../hooks/useAuth';

const queryClient = new QueryClient();

export function AuthInitializer({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const setInitialized = useAuthStore((s) => s.setInitialized);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const data = await refreshSessionRequest();
        if (isMounted) {
          setAccessToken(data.accessToken);
          qc.setQueryData(AUTH_QUERY_KEY, data.user);
          setInitialized(true);
        }
      } catch {
        if (isMounted) {
          clearAuth();
          setInitialized(true);
        }
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, [setAccessToken, setInitialized, clearAuth, qc]);

  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer>{children}</AuthInitializer>
    </QueryClientProvider>
  );
}
