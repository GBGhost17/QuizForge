import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import React from 'react';
import { TestsPage } from './TestsPage';
import { TestEditorPage } from './TestEditorPage';
import { TestDetailPage } from './TestDetailPage';
import { apiClient } from '../../lib/api-client';
import { useAuthStore } from '../../stores/auth.store';
import type { Test } from '@quizforge/shared-types';

vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,mockqr'),
  },
}));

describe('Tests & Test Builder Feature Integration (Stage S07)', () => {
  let queryClient: QueryClient;

  const mockSnapshot = {
    id: 'snap-1',
    versionId: 'ver-1',
    questionId: 'q-1',
    order: 1,
    points: 2.0,
    type: 'SINGLE_CHOICE' as const,
    prompt: 'Giá trị của biểu thức 2 + 3 là bao nhiêu?',
    explanation: 'Phép cộng cơ bản',
    options: [
      { id: 'opt-1', questionId: 'q-1', text: '5', isCorrect: true, order: 0, createdAt: '' },
      { id: 'opt-2', questionId: 'q-1', text: '6', isCorrect: false, order: 1, createdAt: '' },
    ],
    rubric: null,
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const draftVersion = {
    id: 'ver-1',
    testId: 'test-1',
    versionNumber: 1,
    title: 'Đề thi thử Toán 12',
    description: 'Bộ đề thi thử số 1',
    instructions: 'Thí sinh làm bài trong 45 phút',
    timeLimitMinutes: 45,
    maxAttempts: 1,
    shuffleQuestions: true,
    shuffleOptions: true,
    releaseMode: 'ON_FINALIZATION' as const,
    passScore: 5.0,
    totalPoints: 2.0,
    isPublished: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    questionSnapshots: [mockSnapshot],
    sessions: [],
  };

  const mockTestDraft: Test = {
    id: 'test-1',
    authorId: 'user-1',
    title: 'Đề thi thử Toán 12',
    description: 'Bộ đề thi thử số 1',
    instructions: 'Thí sinh làm bài trong 45 phút',
    mode: 'ASSIGNMENT',
    status: 'DRAFT',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    versions: [draftVersion],
  };

  const mockTestPublished: Test = {
    ...mockTestDraft,
    id: 'test-2',
    title: 'Đề thi chính thức Học kỳ 1',
    status: 'PUBLISHED',
    versions: [
      {
        ...draftVersion,
        id: 'ver-2',
        testId: 'test-2',
        isPublished: true,
        publishedAt: '2026-01-01T08:00:00.000Z',
        sessions: [
          {
            id: 'sess-1',
            versionId: 'ver-2',
            joinCode: 'ABC123',
            title: 'Phòng thi: Đề thi chính thức Học kỳ 1',
            status: 'ACTIVE',
            createdAt: '2026-01-01T08:00:00.000Z',
            updatedAt: '2026-01-01T08:00:00.000Z',
          },
        ],
      },
    ],
  };

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

    useAuthStore.setState({
      accessToken: 'mock-token',
      isAuthenticated: true,
      isInitialized: true,
    });

    // Default mock response for apiClient
    apiClient.defaults.adapter = async (config) => {
      if (config.url === '/tests' && config.method === 'get') {
        return {
          data: {
            data: [mockTestDraft, mockTestPublished],
            meta: { page: 1, limit: 12, total: 2, totalPages: 1 },
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        };
      }

      if (config.url === '/tests/test-1' && config.method === 'get') {
        return {
          data: mockTestDraft,
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        };
      }

      if (config.url === '/tests/test-2' && config.method === 'get') {
        return {
          data: mockTestPublished,
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        };
      }

      if (config.url === '/question-banks' && config.method === 'get') {
        return {
          data: {
            data: [{ id: 'bank-1', title: 'Toán 12', _count: { questions: 5 } }],
            meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        };
      }

      if (config.url === '/question-banks/bank-1/questions' && config.method === 'get') {
        return {
          data: {
            data: [{ id: 'q-2', prompt: 'Hàm số đồng biến khi nào?', options: [] }],
            meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        };
      }

      return {
        data: { success: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };
  });

  afterEach(() => {
    cleanup();
  });

  describe('TestsPage', () => {
    it('renders list of tests with draft and published statuses and join codes', async () => {
      renderWithProviders(<TestsPage />);

      expect(screen.getByText('Quản lý Đề thi & Xuất bản')).toBeTruthy();

      expect(await screen.findByText('Đề thi thử Toán 12')).toBeTruthy();
      expect(await screen.findByText('Đề thi chính thức Học kỳ 1')).toBeTruthy();
      expect(await screen.findByText('ABC123')).toBeTruthy();
      expect(await screen.findByText('Bản nháp')).toBeTruthy();
      expect(await screen.findByText('Đã xuất bản')).toBeTruthy();
    });

    it('opens create test modal when clicking "Tạo đề thi mới"', async () => {
      renderWithProviders(<TestsPage />);

      const createBtn = screen.getByRole('button', { name: /Tạo đề thi mới/i });
      fireEvent.click(createBtn);

      expect(await screen.findByLabelText(/Tiêu đề đề thi/i)).toBeTruthy();
    });
  });

  describe('TestDetailPage', () => {
    it('renders published test details with join code and immutable snapshots', async () => {
      renderWithProviders(
        <Routes>
          <Route path="/tests/:id" element={<TestDetailPage />} />
        </Routes>,
        ['/tests/test-2'],
      );

      expect(await screen.findByText('Đề thi chính thức Học kỳ 1')).toBeTruthy();
      expect(await screen.findByText('ABC123')).toBeTruthy();
      expect(await screen.findByText(/Giá trị của biểu thức 2 \+ 3 là bao nhiêu\?/i)).toBeTruthy();
      expect(await screen.findByText(/Snapshot đã đóng băng bất biến/i)).toBeTruthy();
      expect(await screen.findByText('2.0 điểm')).toBeTruthy();

      // Kiểm tra có nút Tạo mã QR và Đóng bài kiểm tra
      const qrBtn = screen.getAllByRole('button', { name: /Tạo mã QR/i })[0];
      expect(qrBtn).toBeTruthy();
      if (qrBtn) {
        fireEvent.click(qrBtn);
        expect(await screen.findByText(/Mã QR Vào Phòng Thi/i)).toBeTruthy();
      }

      const closeBtn = screen.getByRole('button', { name: /Đóng bài kiểm tra/i });
      expect(closeBtn).toBeTruthy();
    });
  });

  describe('TestEditorPage', () => {
    it('renders test editor with configuration and snapshots list', async () => {
      renderWithProviders(
        <Routes>
          <Route path="/tests/:id/edit" element={<TestEditorPage />} />
        </Routes>,
        ['/tests/test-1/edit'],
      );

      expect(await screen.findByDisplayValue('Đề thi thử Toán 12')).toBeTruthy();
      expect(await screen.findByText(/Giá trị của biểu thức 2 \+ 3 là bao nhiêu\?/i)).toBeTruthy();
      expect(screen.getByRole('button', { name: /Xuất bản đề thi/i })).toBeTruthy();
    });

    it('shows warning and blocks publishing when total points do not match target scale', async () => {
      renderWithProviders(
        <Routes>
          <Route path="/tests/:id/edit" element={<TestEditorPage />} />
        </Routes>,
        ['/tests/test-1/edit'],
      );

      expect(await screen.findByDisplayValue('Đề thi thử Toán 12')).toBeTruthy();

      // Thang điểm chuẩn mặc định là 10, nhưng test-1 chỉ có 1 câu 2.0 điểm
      const publishBtn = screen.getByRole('button', { name: /Xuất bản đề thi/i });
      fireEvent.click(publishBtn);

      expect(await screen.findByText('Cảnh báo chênh lệch điểm số')).toBeTruthy();
      expect(screen.getByText(/Không thể xuất bản đề thi/i)).toBeTruthy();
      expect(screen.getAllByText(/Chênh lệch:/i).length).toBeGreaterThanOrEqual(1);

      // Click nút tự động chia đều theo thang điểm
      const autoDistributeBtn = screen.getByRole('button', {
        name: /Tự động chia đều theo thang 10đ/i,
      });
      fireEvent.click(autoDistributeBtn);

      // Modal cảnh báo đóng lại và điểm được chia thành 10đ
      expect(
        await screen.findByText(/Đã tự động cân bằng tròn đúng 10 điểm cho 1 câu/i),
      ).toBeTruthy();
    });
  });
});
