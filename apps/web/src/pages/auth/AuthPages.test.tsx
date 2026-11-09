import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import React from 'react';
import { LoginPage } from './LoginPage';
import { RegisterPage } from './RegisterPage';
import { ForgotPasswordPage } from './ForgotPasswordPage';
import { ResetPasswordPage } from './ResetPasswordPage';
import { GoogleCallbackPage } from './GoogleCallbackPage';
import { apiClient } from '../../lib/api-client';
import { useAuthStore } from '../../stores/auth.store';

describe('Auth Pages Integration', () => {
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

  describe('LoginPage', () => {
    it('renders login form with accessible inputs', () => {
      renderWithProviders(<LoginPage />);

      expect(screen.getByRole('heading', { name: /đăng nhập/i })).toBeTruthy();
      expect(screen.getByLabelText(/địa chỉ email/i)).toBeTruthy();
      expect(screen.getByLabelText(/mật khẩu/i)).toBeTruthy();
      expect(screen.getByRole('button', { name: /^đăng nhập$/i })).toBeTruthy();
    });

    it('renders Google login button', () => {
      renderWithProviders(<LoginPage />);
      expect(screen.getByRole('button', { name: /đăng nhập với google/i })).toBeTruthy();
    });

    it('shows oauth error when error=oauth_failed is in URL', () => {
      renderWithProviders(<LoginPage />, ['/login?error=oauth_failed']);
      expect(screen.getByText(/đăng nhập bằng tài khoản google không thành công/i)).toBeTruthy();
    });

    it('shows validation error when email is invalid', async () => {
      renderWithProviders(<LoginPage />);

      fireEvent.change(screen.getByLabelText(/địa chỉ email/i), {
        target: { value: 'invalid-email' },
      });
      fireEvent.change(screen.getByLabelText(/mật khẩu/i), {
        target: { value: 'Secret123' },
      });
      fireEvent.click(screen.getByRole('button', { name: /^đăng nhập$/i }));

      expect(await screen.findByRole('alert')).toBeTruthy();
      expect(screen.getByText(/email không đúng định dạng/i)).toBeTruthy();
    });

    it('successfully logs in with valid credentials', async () => {
      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        data: {
          accessToken: 'test-access-token',
          refreshToken: 'test-refresh-token',
          user: {
            id: 'u-1',
            email: 'valid@quizforge.local',
            name: 'Test User',
            role: 'USER',
            avatarUrl: null,
            isEmailVerified: true,
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        },
      });

      renderWithProviders(
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<div>Trang chủ</div>} />
        </Routes>,
        ['/login'],
      );

      fireEvent.change(screen.getByLabelText(/địa chỉ email/i), {
        target: { value: 'valid@quizforge.local' },
      });
      fireEvent.change(screen.getByLabelText(/mật khẩu/i), {
        target: { value: 'ValidPass123' },
      });
      fireEvent.click(screen.getByRole('button', { name: /^đăng nhập$/i }));

      await waitFor(() => {
        expect(postSpy).toHaveBeenCalledWith('/auth/login', {
          email: 'valid@quizforge.local',
          password: 'ValidPass123',
        });
        expect(screen.getByText('Trang chủ')).toBeTruthy();
      });

      postSpy.mockRestore();
    });

    it('sanitizes Vietnamese IME diacritics into English ASCII on login inputs', () => {
      renderWithProviders(<LoginPage />);

      const emailInput = screen.getByLabelText(/địa chỉ email/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/mật khẩu/i) as HTMLInputElement;

      fireEvent.change(emailInput, { target: { value: 'nguyễn.đạt@vidu.vn' } });
      expect(emailInput.value).toBe('nguyen.dat@vidu.vn');

      fireEvent.change(passwordInput, { target: { value: 'MậtKhẩu123!' } });
      expect(passwordInput.value).toBe('MatKhau123!');
    });

    it('renders "Quên mật khẩu?" link below the password input', () => {
      renderWithProviders(<LoginPage />);

      const passwordInput = screen.getByLabelText(/mật khẩu/i);
      const forgotLink = screen.getByRole('link', { name: /quên mật khẩu\?/i });

      // Verify DOM position: forgotLink appears after passwordInput in DOM order
      expect(
        passwordInput.compareDocumentPosition(forgotLink) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });
  });

  describe('RegisterPage', () => {
    it('sanitizes Vietnamese input to English characters in register fields', () => {
      renderWithProviders(<RegisterPage />);

      const nameInput = screen.getByLabelText(/họ và tên/i) as HTMLInputElement;
      const emailInput = screen.getByLabelText(/địa chỉ email/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/^mật khẩu/i) as HTMLInputElement;

      fireEvent.change(nameInput, { target: { value: 'Nguyễn Văn Đạt' } });
      expect(nameInput.value).toBe('Nguyen Van Dat');

      fireEvent.change(emailInput, { target: { value: 'nguyễn@gmail.com' } });
      expect(emailInput.value).toBe('nguyen@gmail.com');

      fireEvent.change(passwordInput, { target: { value: 'P@ssw0rdđ' } });
      expect(passwordInput.value).toBe('P@ssw0rdd');
    });
    it('renders Google register button', () => {
      renderWithProviders(<RegisterPage />);
      expect(screen.getByRole('button', { name: /đăng ký với google/i })).toBeTruthy();
    });

    it('shows error when passwords do not match', async () => {
      renderWithProviders(<RegisterPage />);

      fireEvent.change(screen.getByLabelText(/họ và tên/i), {
        target: { value: 'Test Student' },
      });
      fireEvent.change(screen.getByLabelText(/địa chỉ email/i), {
        target: { value: 'student@quizforge.local' },
      });
      fireEvent.change(screen.getByLabelText(/^mật khẩu/i), {
        target: { value: 'ValidPass123' },
      });
      fireEvent.change(screen.getByLabelText(/xác nhận mật khẩu/i), {
        target: { value: 'DifferentPass123' },
      });

      fireEvent.click(screen.getByRole('button', { name: /đăng ký tài khoản/i }));

      expect(await screen.findByRole('alert')).toBeTruthy();
      expect(screen.getByText(/mật khẩu xác nhận không khớp/i)).toBeTruthy();
    });

    it('successfully registers a new account', async () => {
      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        data: {
          accessToken: 'reg-access-token',
          refreshToken: 'reg-refresh-token',
          user: {
            id: 'u-reg',
            email: 'newuser@quizforge.local',
            name: 'New User',
            role: 'USER',
            avatarUrl: null,
            isEmailVerified: true,
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        },
      });

      renderWithProviders(
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<div>Trang chủ sau đăng ký</div>} />
        </Routes>,
        ['/register'],
      );

      fireEvent.change(screen.getByLabelText(/họ và tên/i), {
        target: { value: 'New User' },
      });
      fireEvent.change(screen.getByLabelText(/địa chỉ email/i), {
        target: { value: 'newuser@quizforge.local' },
      });
      fireEvent.change(screen.getByLabelText(/^mật khẩu/i), {
        target: { value: 'ValidPass123' },
      });
      fireEvent.change(screen.getByLabelText(/xác nhận mật khẩu/i), {
        target: { value: 'ValidPass123' },
      });

      fireEvent.click(screen.getByRole('button', { name: /đăng ký tài khoản/i }));

      await waitFor(() => {
        expect(postSpy).toHaveBeenCalledWith('/auth/register', {
          name: 'New User',
          email: 'newuser@quizforge.local',
          password: 'ValidPass123',
        });
        expect(screen.getByText('Trang chủ sau đăng ký')).toBeTruthy();
      });

      postSpy.mockRestore();
    });
  });

  describe('ForgotPasswordPage', () => {
    it('submits email and displays success notification', async () => {
      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        data: { message: 'Nếu email tồn tại, link đặt lại mật khẩu đã được gửi.' },
      });

      renderWithProviders(<ForgotPasswordPage />);

      fireEvent.change(screen.getByLabelText(/địa chỉ email đã đăng ký/i), {
        target: { value: 'forgot@quizforge.local' },
      });
      fireEvent.click(screen.getByRole('button', { name: /gửi yêu cầu khôi phục/i }));

      await waitFor(() => {
        expect(postSpy).toHaveBeenCalledWith('/auth/forgot-password', {
          email: 'forgot@quizforge.local',
        });
        expect(screen.getByText(/tồn tại trong hệ thống/i)).toBeTruthy();
      });

      postSpy.mockRestore();
    });
  });

  describe('ResetPasswordPage', () => {
    it('reads token from URL and submits new password', async () => {
      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        data: { message: 'Đặt lại mật khẩu thành công.' },
      });

      renderWithProviders(<ResetPasswordPage />, ['/reset-password?token=sample-reset-token']);

      fireEvent.change(screen.getByLabelText(/^mật khẩu mới/i), {
        target: { value: 'NewSecurePass123' },
      });
      fireEvent.change(screen.getByLabelText(/xác nhận mật khẩu mới/i), {
        target: { value: 'NewSecurePass123' },
      });

      fireEvent.click(screen.getByRole('button', { name: /cập nhật mật khẩu/i }));

      await waitFor(() => {
        expect(postSpy).toHaveBeenCalledWith('/auth/reset-password', {
          token: 'sample-reset-token',
          newPassword: 'NewSecurePass123',
        });
        expect(screen.getByText(/cập nhật thành công/i)).toBeTruthy();
      });

      postSpy.mockRestore();
    });
  });

  describe('GoogleCallbackPage', () => {
    it('processes accessToken from URL, updates store in memory, and redirects to home', async () => {
      renderWithProviders(
        <Routes>
          <Route path="/auth/callback" element={<GoogleCallbackPage />} />
          <Route path="/" element={<div>Trang chủ từ OAuth</div>} />
        </Routes>,
        ['/auth/callback?accessToken=google-acc-token'],
      );

      await waitFor(() => {
        expect(useAuthStore.getState().accessToken).toBe('google-acc-token');
        expect(screen.getByText('Trang chủ từ OAuth')).toBeTruthy();
      });
    });

    it('renders error alert when tokens are missing', async () => {
      renderWithProviders(<GoogleCallbackPage />, ['/auth/callback?error=oauth_failed']);

      expect(await screen.findByText(/xác thực tài khoản google không thành công/i)).toBeTruthy();
      expect(screen.getByRole('button', { name: /quay lại trang đăng nhập/i })).toBeTruthy();
    });
  });
});
