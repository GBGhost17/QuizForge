import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import React from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { DashboardPage } from '../../pages/DashboardPage';
import { ProtectedRoute } from '../auth/ProtectedRoute';
import { PublicOnlyRoute } from '../auth/PublicOnlyRoute';
import { useAuthStore } from '../../stores/auth.store';
import { useUIStore } from '../../stores/ui.store';
import { apiClient } from '../../lib/api-client';

describe('Layout and Navigation Integration', () => {
  let queryClient: QueryClient;

  const renderWithProviders = (ui: React.ReactElement, initialEntries = ['/']) => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
      </QueryClientProvider>,
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useAuthStore.getState().clearAuth();
    useUIStore.setState({ activeRole: 'creator', isSidebarOpen: false });

    apiClient.defaults.adapter = async (config) => ({
      data: { success: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe('Navbar', () => {
    it('renders brand logo and user details when authenticated', () => {
      useAuthStore.getState().setAccessToken('mock-token');

      const client = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      client.setQueryData(['auth', 'me'], {
        id: 'u-1',
        name: 'Giáo viên Minh',
        email: 'minh@quizforge.local',
        role: 'USER',
      });

      render(
        <QueryClientProvider client={client}>
          <MemoryRouter>
            <Navbar />
          </MemoryRouter>
        </QueryClientProvider>,
      );

      expect(screen.getByText('Forge')).toBeTruthy();
      expect(screen.getByText('Giáo viên Minh')).toBeTruthy();
      expect(screen.getByRole('button', { name: /đăng xuất/i })).toBeTruthy();
    });
  });

  describe('Sidebar Navigation', () => {
    it('displays Creator navigation links when in Creator mode', () => {
      useUIStore.setState({ activeRole: 'creator' });
      renderWithProviders(<Sidebar />);

      expect(screen.getByText('Ngân hàng câu hỏi')).toBeTruthy();
      expect(screen.getByText('Đề thi & Xuất bản')).toBeTruthy();
      expect(screen.getByText('Import Markdown')).toBeTruthy();
    });

    it('displays Participant navigation links when in Participant mode', () => {
      useUIStore.setState({ activeRole: 'participant' });
      renderWithProviders(<Sidebar />);

      expect(screen.getByText('Vào thi bằng mã')).toBeTruthy();
      expect(screen.getByText('Lịch sử bài làm')).toBeTruthy();
      expect(screen.getByText('Tự luyện tập')).toBeTruthy();
    });

    it('allows users to switch roles between Soạn đề and Làm bài inside the sidebar', () => {
      useUIStore.setState({ activeRole: 'creator' });
      renderWithProviders(<Sidebar />);

      const participantBtn = screen.getByRole('button', { name: /^làm bài$/i });
      fireEvent.click(participantBtn);
      expect(useUIStore.getState().activeRole).toBe('participant');

      const creatorBtn = screen.getByRole('button', { name: /^soạn đề$/i });
      fireEvent.click(creatorBtn);
      expect(useUIStore.getState().activeRole).toBe('creator');
    });

    it('positions sidebar drawer below navbar without overlapping logo or navbar', () => {
      const { container } = renderWithProviders(<Sidebar />);
      const aside = container.querySelector('aside');
      expect(aside?.className).toContain('top-16');
      expect(aside?.className).toContain('z-40');
    });
  });

  describe('DashboardPage', () => {
    it('renders Creator quick actions and empty state', () => {
      useUIStore.setState({ activeRole: 'creator' });
      renderWithProviders(<DashboardPage />);

      expect(screen.getByText('Không gian Soạn đề')).toBeTruthy();
      expect(screen.getByText('Tạo đề thi mới')).toBeTruthy();
      expect(screen.getByText('Chưa có bài thi nào được khởi tạo')).toBeTruthy();
    });

    it('renders Participant join code box when in Participant mode', () => {
      useUIStore.setState({ activeRole: 'participant' });
      renderWithProviders(<DashboardPage />);

      expect(screen.getByText('Không gian Làm bài')).toBeTruthy();
      expect(screen.getByText('Tham gia bài thi ngay')).toBeTruthy();
      expect(screen.getByPlaceholderText('Ví dụ: QUIZ101')).toBeTruthy();
    });
  });

  describe('Route Guards', () => {
    it('ProtectedRoute redirects unauthenticated visitors to /login', () => {
      useAuthStore.getState().clearAuth();

      renderWithProviders(
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div>Khu vực bí mật</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Trang đăng nhập đích</div>} />
        </Routes>,
        ['/protected'],
      );

      expect(screen.queryByText('Khu vực bí mật')).toBeNull();
      expect(screen.getByText('Trang đăng nhập đích')).toBeTruthy();
    });

    it('ProtectedRoute renders protected content for authenticated users', async () => {
      useAuthStore.getState().setAccessToken('valid-jwt-token');

      const client = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      client.setQueryData(['auth', 'me'], {
        id: 'u-1',
        name: 'Logged In User',
        email: 'user@quizforge.local',
        role: 'USER',
      });

      render(
        <QueryClientProvider client={client}>
          <MemoryRouter initialEntries={['/protected']}>
            <Routes>
              <Route
                path="/protected"
                element={
                  <ProtectedRoute>
                    <div>Khu vực bí mật</div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>,
      );

      expect(await screen.findByText('Khu vực bí mật')).toBeTruthy();
    });

    it('PublicOnlyRoute redirects authenticated users to root /', () => {
      useAuthStore.getState().setAccessToken('already-logged-in-jwt');

      renderWithProviders(
        <Routes>
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <div>Trang đăng nhập công khai</div>
              </PublicOnlyRoute>
            }
          />
          <Route path="/" element={<div>Trang chủ cho người đã đăng nhập</div>} />
        </Routes>,
        ['/login'],
      );

      expect(screen.queryByText('Trang đăng nhập công khai')).toBeNull();
      expect(screen.getByText('Trang chủ cho người đã đăng nhập')).toBeTruthy();
    });
  });
});
