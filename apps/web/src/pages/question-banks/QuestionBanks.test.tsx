import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import React from 'react';
import { QuestionBanksPage } from './QuestionBanksPage';
import { QuestionBankDetailPage } from './QuestionBankDetailPage';
import { apiClient } from '../../lib/api-client';
import { useAuthStore } from '../../stores/auth.store';

describe('Question Banks Feature Integration', () => {
  let queryClient: QueryClient;

  const mockBank = {
    id: 'bank-1',
    ownerId: 'user-1',
    title: 'Toán học 12',
    description: 'Bộ đề thi thử',
    isArchived: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    _count: { questions: 2 },
  };

  const mockQuestions = [
    {
      id: 'q-1',
      bankId: 'bank-1',
      type: 'SINGLE_CHOICE' as const,
      prompt: 'Thủ đô của Việt Nam là gì?',
      explanation: 'Hà Nội là thủ đô.',
      topic: 'Địa lý',
      tags: ['dia-ly'],
      difficulty: 'EASY' as const,
      defaultPoints: 1.0,
      rubric: null,
      isArchived: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      options: [
        {
          id: 'opt-1',
          questionId: 'q-1',
          text: 'Hà Nội',
          isCorrect: true,
          explanation: null,
          order: 0,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'opt-2',
          questionId: 'q-1',
          text: 'TP. Hồ Chí Minh',
          isCorrect: false,
          explanation: null,
          order: 1,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    },
    {
      id: 'q-2',
      bankId: 'bank-1',
      type: 'TRUE_FALSE' as const,
      prompt: 'Mặt Trời quay quanh Trái Đất.',
      explanation: 'Trái Đất quay quanh Mặt Trời.',
      topic: 'Thiên văn',
      tags: [],
      difficulty: 'MEDIUM' as const,
      defaultPoints: 1.0,
      rubric: null,
      isArchived: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      options: [
        {
          id: 'opt-3',
          questionId: 'q-2',
          text: 'Đúng',
          isCorrect: false,
          explanation: null,
          order: 0,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'opt-4',
          questionId: 'q-2',
          text: 'Sai',
          isCorrect: true,
          explanation: null,
          order: 1,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    },
  ];

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
    useAuthStore.getState().setAccessToken('mock-token');

    // Default mock response for apiClient
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

  describe('QuestionBanksPage', () => {
    it('renders heading and empty state when no banks returned', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: { data: [], meta: { page: 1, limit: 9, total: 0, totalPages: 1 } },
      });

      renderWithProviders(<QuestionBanksPage />);

      expect(screen.getByRole('heading', { name: /ngân hàng câu hỏi/i })).toBeTruthy();
      expect(await screen.findByText(/chưa có ngân hàng câu hỏi nào/i)).toBeTruthy();
    });

    it('renders list of question bank cards', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: { data: [mockBank], meta: { page: 1, limit: 9, total: 1, totalPages: 1 } },
      });

      renderWithProviders(<QuestionBanksPage />);

      expect(await screen.findByText('Toán học 12')).toBeTruthy();
      expect(screen.getByText('Bộ đề thi thử')).toBeTruthy();
      expect(screen.getByText(/2 câu hỏi/i)).toBeTruthy();
      expect(screen.getByRole('button', { name: /xem câu hỏi/i })).toBeTruthy();
    });

    it('opens create modal and submits new question bank', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: { data: [], meta: { page: 1, limit: 9, total: 0, totalPages: 1 } },
      });
      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        data: mockBank,
      });

      renderWithProviders(<QuestionBanksPage />);

      fireEvent.click(await screen.findByRole('button', { name: /tạo ngân hàng mới/i }));

      expect(screen.getByRole('heading', { name: /tạo ngân hàng câu hỏi mới/i })).toBeTruthy();

      fireEvent.change(screen.getByLabelText(/tiêu đề ngân hàng câu hỏi/i), {
        target: { value: 'Toán học 12' },
      });
      fireEvent.change(screen.getByLabelText(/mô tả chi tiết/i), {
        target: { value: 'Bộ đề thi thử' },
      });

      fireEvent.click(screen.getByRole('button', { name: /^tạo ngân hàng$/i }));

      await waitFor(() => {
        expect(postSpy).toHaveBeenCalledWith('/question-banks', {
          title: 'Toán học 12',
          description: 'Bộ đề thi thử',
        });
      });

      postSpy.mockRestore();
    });
  });

  describe('QuestionBankDetailPage', () => {
    it('renders bank details and questions list', async () => {
      vi.spyOn(apiClient, 'get')
        .mockResolvedValueOnce({ data: mockBank }) // Bank detail
        .mockResolvedValueOnce({
          data: { data: mockQuestions, meta: { page: 1, limit: 15, total: 2, totalPages: 1 } },
        }); // Questions list

      renderWithProviders(
        <Routes>
          <Route path="/question-banks/:id" element={<QuestionBankDetailPage />} />
        </Routes>,
        ['/question-banks/bank-1'],
      );

      expect(await screen.findByRole('heading', { name: 'Toán học 12' })).toBeTruthy();
      expect(screen.getByText('Thủ đô của Việt Nam là gì?')).toBeTruthy();
      expect(screen.getByText('Mặt Trời quay quanh Trái Đất.')).toBeTruthy();
      expect(screen.getByText('Hà Nội')).toBeTruthy();
      expect(screen.getByText('TP. Hồ Chí Minh')).toBeTruthy();
    });

    it('opens question editor modal when clicking "Thêm câu hỏi"', async () => {
      vi.spyOn(apiClient, 'get')
        .mockResolvedValueOnce({ data: mockBank })
        .mockResolvedValueOnce({
          data: { data: mockQuestions, meta: { page: 1, limit: 15, total: 2, totalPages: 1 } },
        });

      renderWithProviders(
        <Routes>
          <Route path="/question-banks/:id" element={<QuestionBankDetailPage />} />
        </Routes>,
        ['/question-banks/bank-1'],
      );

      fireEvent.click(await screen.findByRole('button', { name: /thêm câu hỏi/i }));

      expect(screen.getByRole('heading', { name: /thêm câu hỏi mới/i })).toBeTruthy();
      expect(screen.getByLabelText(/loại câu hỏi/i)).toBeTruthy();
      expect(screen.getByLabelText(/nội dung câu hỏi/i)).toBeTruthy();
    });
  });
});
