import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import type { UserProfile } from '@quizforge/shared-types';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuth } from '../../hooks/useAuth';

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading spinner while session is restoring (not initialized)', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isInitialized: false,
      isLoading: false,
      isError: false,
      error: null,
      refetchUser: vi.fn(),
      refreshSession: vi.fn(),
      login: vi.fn(),
      isLoggingIn: false,
      loginError: null,
      register: vi.fn(),
      isRegistering: false,
      registerError: null,
      logout: vi.fn(),
      isLoggingOut: false,
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>,
    );

    expect(screen.getAllByText('Đang kiểm tra quyền truy cập...').length).toBeGreaterThan(0);
    expect(screen.queryByText('Protected Content')).toBeNull();
  });

  it('redirects to /login when initialized but unauthenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isInitialized: true,
      isLoading: false,
      isError: false,
      error: null,
      refetchUser: vi.fn(),
      refreshSession: vi.fn(),
      login: vi.fn(),
      isLoggingIn: false,
      loginError: null,
      register: vi.fn(),
      isRegistering: false,
      registerError: null,
      logout: vi.fn(),
      isLoggingOut: false,
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Login Page')).toBeTruthy();
    expect(screen.queryByText('Protected Content')).toBeNull();
  });

  it('renders children when initialized and authenticated', () => {
    const mockUser: UserProfile = {
      id: 'u1',
      email: 'user@example.com',
      role: 'USER',
      name: 'User',
      isEmailVerified: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isInitialized: true,
      isLoading: false,
      isError: false,
      error: null,
      refetchUser: vi.fn(),
      refreshSession: vi.fn(),
      login: vi.fn(),
      isLoggingIn: false,
      loginError: null,
      register: vi.fn(),
      isRegistering: false,
      registerError: null,
      logout: vi.fn(),
      isLoggingOut: false,
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>,
    );

    expect(screen.getByText('Protected Content')).toBeTruthy();
  });
});
