import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import React from 'react';
import { JoinSessionPage } from './JoinSessionPage';
import { TakeTestPage } from './TakeTestPage';
import { AttemptSubmittedPage } from './AttemptSubmittedPage';
import { AttemptsHistoryPage } from './AttemptsHistoryPage';
import { apiClient } from '../../lib/api-client';
import { useAuthStore } from '../../stores/auth.store';
import type { AttemptDetail, AttemptSummary, SessionPreview } from '@quizforge/shared-types';

describe('Attempts Feature Integration (Stage S08: Student Attempt Engine)', () => {
  let queryClient: QueryClient;

  const mockUser = {
    id: 'user-1',
    email: 'student@example.com',
    name: 'Học sinh A',
    role: 'USER' as const,
    isEmailVerified: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  const mockSessionPreview: SessionPreview = {
    sessionId: 'sess-1',
    joinCode: 'ABC123',
    testTitle: 'Bài kiểm tra Toán học kỳ 1',
    description: 'Đề thi chính thức môn Toán',
    instructions: 'Không sử dụng tài liệu',
    authorName: 'Thầy Nguyễn Văn A',
    timeLimitMinutes: 45,
    totalQuestions: 2,
    totalPoints: 10,
    maxAttempts: 2,
    usedAttempts: 0,
    activeAttemptId: null,
    canAttempt: true,
  };

  const mockAttemptDetail: AttemptDetail = {
    id: 'att-1',
    versionId: 'ver-1',
    sessionId: 'sess-1',
    userId: 'user-1',
    attemptNumber: 1,
    status: 'IN_PROGRESS',
    totalPoints: 10,
    startedAt: new Date().toISOString(),
    submittedAt: null,
    expiresAt: new Date(Date.now() + 2700000).toISOString(),
    serverTime: new Date().toISOString(),
    timeLimitMinutes: 45,
    title: 'Bài kiểm tra Toán học kỳ 1',
    instructions: 'Không sử dụng tài liệu',
    questions: [
      {
        snapshotId: 'snap-1',
        order: 1,
        points: 5,
        type: 'SINGLE_CHOICE',
        prompt: '1 + 1 bằng mấy?',
        options: [
          { id: 'opt-1', text: '2', order: 1 },
          { id: 'opt-2', text: '3', order: 2 },
        ],
      },
      {
        snapshotId: 'snap-2',
        order: 2,
        points: 5,
        type: 'SHORT_ANSWER',
        prompt: 'Thủ đô của Việt Nam là gì?',
        options: [],
      },
    ],
    answers: {},
  };

  const mockAttemptSummaries: AttemptSummary[] = [
    {
      id: 'att-1',
      versionId: 'ver-1',
      sessionId: 'sess-1',
      testTitle: 'Bài kiểm tra Toán học kỳ 1',
      attemptNumber: 1,
      status: 'IN_PROGRESS',
      startedAt: new Date().toISOString(),
      submittedAt: null,
      score: null,
      totalPoints: 10,
    },
    {
      id: 'att-2',
      versionId: 'ver-2',
      sessionId: 'sess-2',
      testTitle: 'Kiểm tra Tiếng Anh 15 phút',
      attemptNumber: 1,
      status: 'SUBMITTED',
      startedAt: new Date(Date.now() - 86400000).toISOString(),
      submittedAt: new Date(Date.now() - 85500000).toISOString(),
      score: null,
      totalPoints: 10,
    },
  ];

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    useAuthStore.setState({
      accessToken: 'mock-token',
      isAuthenticated: true,
      isInitialized: true,
    });

    queryClient.setQueryData(['auth', 'me'], mockUser);

    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url === '/auth/me') {
        return { data: mockUser };
      }
      if (url.includes('/sessions/join/ABC123')) {
        return { data: mockSessionPreview };
      }
      if (url === '/attempts/att-1') {
        return { data: mockAttemptDetail };
      }
      if (url === '/attempts') {
        return { data: mockAttemptSummaries };
      }
      return { data: null };
    });

    vi.spyOn(apiClient, 'post').mockImplementation(async (url: string) => {
      if (url.includes('/sessions/join/ABC123/start')) {
        return { data: mockAttemptDetail };
      }
      if (url.includes('/attempts/att-1/submit')) {
        return {
          data: {
            id: 'att-1',
            status: 'SUBMITTED',
            submittedAt: new Date().toISOString(),
            message: 'Nộp bài thi thành công',
          },
        };
      }
      return { data: {} };
    });

    vi.spyOn(apiClient, 'patch').mockImplementation(async () => {
      return { data: { success: true, savedCount: 1, serverTime: new Date().toISOString() } };
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('JoinSessionPage', () => {
    it('renders input and displays test preview when valid code is entered', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/join?code=ABC123']}>
            <JoinSessionPage />
          </MemoryRouter>
        </QueryClientProvider>,
      );

      expect(screen.getByText('Vào phòng thi bài kiểm tra')).toBeTruthy();

      await waitFor(() => {
        expect(screen.getByText('Bài kiểm tra Toán học kỳ 1')).toBeTruthy();
      });

      expect(screen.getByText('Thầy Nguyễn Văn A')).toBeTruthy();
      expect(screen.getByText(/Bắt đầu làm bài thi/i)).toBeTruthy();
    });

    it('displays warning when attempts limit is exceeded', async () => {
      vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
        if (url === '/auth/me') {
          return { data: mockUser };
        }
        if (url.includes('/sessions/join/ABC123')) {
          return {
            data: {
              ...mockSessionPreview,
              canAttempt: false,
              usedAttempts: 2,
              reason: 'Bạn đã sử dụng hết số lượt làm bài cho phép cho bài thi này',
            },
          };
        }
        return { data: null };
      });

      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/join?code=ABC123']}>
            <JoinSessionPage />
          </MemoryRouter>
        </QueryClientProvider>,
      );

      await waitFor(() => {
        expect(
          screen.getByText('Bạn đã sử dụng hết số lượt làm bài cho phép cho bài thi này'),
        ).toBeTruthy();
      });

      expect(screen.queryByText(/Bắt đầu làm bài thi/i)).toBeNull();
    });
  });

  describe('TakeTestPage', () => {
    it('renders assessment runner with question palette, markdown prompt and options', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/take-test/att-1']}>
            <Routes>
              <Route path="/take-test/:attemptId" element={<TakeTestPage />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText('Bài kiểm tra Toán học kỳ 1')).toBeTruthy();
      });

      expect(screen.getByText('1 + 1 bằng mấy?')).toBeTruthy();
      expect(screen.getAllByText('2').length).toBeGreaterThan(0);
      expect(screen.getByText('3')).toBeTruthy();
      expect(screen.getByText('Mục lục câu hỏi')).toBeTruthy();
    });

    it('opens submit confirmation modal when Nộp bài is clicked', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/take-test/att-1']}>
            <Routes>
              <Route path="/take-test/:attemptId" element={<TakeTestPage />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText('1 + 1 bằng mấy?')).toBeTruthy();
      });

      const submitBtn = screen.getByRole('button', { name: /Nộp bài/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText('Xác nhận nộp bài thi')).toBeTruthy();
      });

      expect(screen.getByText('Quay lại làm bài')).toBeTruthy();
      expect(screen.getByText('Xác nhận nộp bài')).toBeTruthy();
    });
  });

  describe('AttemptSubmittedPage', () => {
    it('renders confirmation card with submission details', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/attempts/att-1/submitted']}>
            <Routes>
              <Route path="/attempts/:attemptId/submitted" element={<AttemptSubmittedPage />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText('Nộp bài thi thành công!')).toBeTruthy();
      });

      expect(screen.getByText('Xem lịch sử làm bài')).toBeTruthy();
      expect(screen.getByText('Về trang chủ')).toBeTruthy();
    });
  });

  describe('AttemptsHistoryPage', () => {
    it('renders list of user past attempts with status badges', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/attempts']}>
            <Routes>
              <Route path="/attempts" element={<AttemptsHistoryPage />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText('Bài kiểm tra Toán học kỳ 1')).toBeTruthy();
      });

      expect(screen.getByText('Kiểm tra Tiếng Anh 15 phút')).toBeTruthy();
      expect(screen.getByText('Đang làm dở')).toBeTruthy();
      expect(screen.getByText('Đã nộp bài')).toBeTruthy();
    });
  });
});
