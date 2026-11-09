import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MarkdownImportPage } from './MarkdownImportPage';
import {
  useQuestionBank,
  useQuestionBanks,
  useCreateQuestionBank,
} from '../../hooks/useQuestionBanks';
import { useMarkdownImport } from '../../hooks/useMarkdownImport';
import type { QuestionBank } from '@quizforge/shared-types';

vi.mock('../../hooks/useQuestionBanks');
vi.mock('../../hooks/useMarkdownImport');

describe('MarkdownImportPage', () => {
  let queryClient: QueryClient;
  const mockParse = vi.fn();
  const mockCommit = vi.fn();

  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const mockBankData: QuestionBank = {
      id: 'bank-1',
      ownerId: 'user-1',
      title: 'Ngân hàng Toán đại số',
      description: 'Mô tả bài tập',
      isArchived: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      _count: { questions: 10 },
    };

    vi.mocked(useQuestionBank).mockReturnValue({
      data: mockBankData,
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useQuestionBank>);

    vi.mocked(useQuestionBanks).mockReturnValue({
      data: { data: [mockBankData], meta: { page: 1, limit: 15, total: 1, totalPages: 1 } },
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useQuestionBanks>);

    vi.mocked(useCreateQuestionBank).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({ id: 'new-bank-1', title: 'Ngân hàng mới' }),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateQuestionBank>);

    vi.mocked(useMarkdownImport).mockReturnValue({
      parse: mockParse,
      isParsing: false,
      parseError: null,
      parseResult: undefined,
      resetParse: vi.fn(),
      commit: mockCommit,
      isCommitting: false,
      commitError: null,
      commitResult: undefined,
    });
  });

  const renderComponent = (initialEntry = '/question-banks/bank-1/import') => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route path="/question-banks/:id/import" element={<MarkdownImportPage />} />
            <Route path="/import" element={<MarkdownImportPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  it('renders dual-pane layout with editor and empty preview state', () => {
    renderComponent();

    expect(screen.getByText('Nhập câu hỏi từ Markdown')).toBeTruthy();
    expect(screen.getByText('Ngân hàng Toán đại số')).toBeTruthy();
    expect(screen.getByPlaceholderText('Dán hoặc nhập nội dung Markdown tại đây...')).toBeTruthy();
    expect(screen.getByText('Phân tích & Xem trước')).toBeTruthy();
    expect(screen.getByText('Chưa có câu hỏi hợp lệ nào được phân tích')).toBeTruthy();
  });

  it('triggers parse on button click', async () => {
    mockParse.mockResolvedValueOnce({
      questions: [],
      diagnostics: [],
      totalQuestions: 0,
      hasErrors: false,
    });

    renderComponent();

    const textarea = screen.getByPlaceholderText(/dán hoặc nhập nội dung markdown/i);
    fireEvent.change(textarea, {
      target: { value: '## Q1: Câu hỏi mẫu\n> type: SINGLE_CHOICE\n- [x] A\n- [ ] B' },
    });

    const parseBtn = screen.getAllByText('Phân tích & Xem trước')[0];
    expect(parseBtn).toBeDefined();
    if (parseBtn) {
      fireEvent.click(parseBtn);
    }

    expect(mockParse).toHaveBeenCalled();
  });

  it('displays rendered question cards when parseResult contains questions', () => {
    vi.mocked(useMarkdownImport).mockReturnValue({
      parse: mockParse,
      isParsing: false,
      parseError: null,
      parseResult: {
        title: 'Bộ đề mẫu',
        questions: [
          {
            type: 'SINGLE_CHOICE',
            prompt: 'Giải phương trình $2x = 4$',
            difficulty: 'EASY',
            defaultPoints: 1.0,
            rawSourceLine: 5,
            options: [
              { text: '$x = 2$', isCorrect: true, explanation: 'Chính xác' },
              { text: '$x = 3$', isCorrect: false },
            ],
          },
        ],
        diagnostics: [],
        totalQuestions: 1,
        validQuestionsCount: 1,
        hasErrors: false,
      },
      resetParse: vi.fn(),
      commit: mockCommit,
      isCommitting: false,
      commitError: null,
      commitResult: undefined,
    });

    renderComponent();

    expect(screen.getByText('Xem trước câu hỏi (1 câu hợp lệ)')).toBeTruthy();
    expect(screen.getByText('Trắc nghiệm 1 đáp án')).toBeTruthy();
    expect(screen.queryByText('Dễ')).toBeNull(); // Mặc định không hiện nhãn độ khó

    // Bật tùy chọn hiển thị nhãn độ khó
    fireEvent.click(screen.getByLabelText(/hiện nhãn độ khó/i));
    expect(screen.getByText('Dễ')).toBeTruthy();

    expect(screen.getByText('Dòng 5')).toBeTruthy();
  });

  it('displays diagnostics badges and remediation when syntax errors exist', () => {
    vi.mocked(useMarkdownImport).mockReturnValue({
      parse: mockParse,
      isParsing: false,
      parseError: null,
      parseResult: {
        questions: [],
        diagnostics: [
          {
            line: 12,
            severity: 'ERROR',
            message: 'SINGLE_CHOICE phải có chính xác 1 đáp án đúng.',
            remediation: 'Đánh dấu duy nhất một phương án bằng [x].',
          },
        ],
        totalQuestions: 1,
        validQuestionsCount: 0,
        hasErrors: true,
      },
      resetParse: vi.fn(),
      commit: mockCommit,
      isCommitting: false,
      commitError: null,
      commitResult: undefined,
    });

    renderComponent();

    expect(screen.getByText('1 lỗi')).toBeTruthy();
    expect(screen.getByText(/Dòng 12: SINGLE_CHOICE phải có chính xác 1 đáp án đúng/)).toBeTruthy();
    expect(
      screen.getByText(/Hướng khắc phục: Đánh dấu duy nhất một phương án bằng \[x\]/),
    ).toBeTruthy();
  });

  it('calls commit when clicking commit button with valid questions', async () => {
    mockCommit.mockResolvedValueOnce({
      count: 1,
      bankId: 'bank-1',
      message: 'Đã nhập thành công 1 câu hỏi',
    });

    vi.mocked(useMarkdownImport).mockReturnValue({
      parse: mockParse,
      isParsing: false,
      parseError: null,
      parseResult: {
        questions: [
          {
            type: 'TRUE_FALSE',
            prompt: 'Trái đất quay quanh mặt trời',
            difficulty: 'EASY',
            defaultPoints: 1.0,
            rawSourceLine: 2,
            options: [
              { text: 'Đúng', isCorrect: true },
              { text: 'Sai', isCorrect: false },
            ],
          },
        ],
        diagnostics: [],
        totalQuestions: 1,
        validQuestionsCount: 1,
        hasErrors: false,
      },
      resetParse: vi.fn(),
      commit: mockCommit,
      isCommitting: false,
      commitError: null,
      commitResult: undefined,
    });

    renderComponent();

    const commitBtn = screen.getByRole('button', { name: /Nhập 1 câu vào ngân hàng/i });
    expect((commitBtn as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(commitBtn);
    expect(mockCommit).toHaveBeenCalled();
  });

  it('opens GeneratePromptModal and generates customized prompt for AI', () => {
    renderComponent();

    // Click "Tạo Prompt AI" button
    const promptBtn = screen.getByRole('button', { name: /tạo prompt ai/i });
    fireEvent.click(promptBtn);

    // Modal opens
    expect(screen.getByRole('heading', { name: /tạo prompt ai sinh đề markdown/i })).toBeTruthy();
    expect(screen.getByLabelText(/môn học \/ chủ đề đề thi/i)).toBeTruthy();

    // Submit form to generate prompt
    const generateBtn = screen.getByRole('button', { name: /sinh prompt ai/i });
    fireEvent.click(generateBtn);

    // Tab switches to prompt view
    expect(screen.getByText(/sao chép prompt dưới đây và dán vào chatgpt/i)).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /sao chép prompt/i }).length).toBeGreaterThan(0);
  });

  it('displays warning notice when question count exceeds 20 in GeneratePromptModal', () => {
    renderComponent();

    // Click "Tạo Prompt AI" button
    const promptBtn = screen.getByRole('button', { name: /tạo prompt ai/i });
    fireEvent.click(promptBtn);

    const countInput = screen.getByLabelText(/số lượng câu hỏi/i);
    // Initially count is 10, no warning
    expect(screen.queryByText(/lưu ý khi tạo số lượng lớn/i)).toBeNull();

    // Change to 30
    fireEvent.change(countInput, { target: { value: '30' } });
    expect(screen.getByText(/lưu ý khi tạo số lượng lớn \(30 câu\)/i)).toBeTruthy();
    expect(screen.getByText(/giới hạn độ dài phản hồi/i)).toBeTruthy();
  });

  it('generates prompt without points configuration since points belong to test builder', () => {
    renderComponent();

    // Click "Tạo Prompt AI" button
    const promptBtn = screen.getByRole('button', { name: /tạo prompt ai/i });
    fireEvent.click(promptBtn);

    // Không còn input thang điểm hay điểm mỗi câu trong ngân hàng
    expect(screen.queryByLabelText(/điểm mỗi câu hỏi/i)).toBeNull();
    expect(screen.queryByLabelText(/tổng thang điểm đề thi/i)).toBeNull();
  });

  it('opens SelectTargetBankModal when clicking commit from /import route without bankId', async () => {
    vi.mocked(useMarkdownImport).mockReturnValue({
      parse: mockParse,
      isParsing: false,
      parseError: null,
      parseResult: {
        questions: [
          {
            type: 'TRUE_FALSE',
            prompt: 'Trái đất quay quanh mặt trời',
            difficulty: 'EASY',
            defaultPoints: 1.0,
            rawSourceLine: 2,
            options: [
              { text: 'Đúng', isCorrect: true },
              { text: 'Sai', isCorrect: false },
            ],
          },
        ],
        diagnostics: [],
        totalQuestions: 1,
        validQuestionsCount: 1,
        hasErrors: false,
      },
      resetParse: vi.fn(),
      commit: mockCommit,
      isCommitting: false,
      commitError: null,
      commitResult: undefined,
    });

    renderComponent('/import');

    const commitBtn = screen.getByRole('button', { name: /Nhập 1 câu vào ngân hàng/i });
    fireEvent.click(commitBtn);

    // Modal opens
    expect(
      await screen.findByRole('heading', { name: /chọn ngân hàng câu hỏi đích/i }),
    ).toBeTruthy();
    const bankCards = screen.getAllByText('Ngân hàng Toán đại số');
    expect(bankCards.length).toBeGreaterThan(0);

    // Select the bank card inside the modal and confirm
    const targetCard = bankCards[bankCards.length - 1];
    expect(targetCard).toBeDefined();
    if (targetCard) {
      fireEvent.click(targetCard);
    }
    const confirmBtn = screen.getByRole('button', { name: /xác nhận & nhập câu hỏi/i });
    fireEvent.click(confirmBtn);

    expect(mockCommit).toHaveBeenCalledWith({
      bankId: 'bank-1',
      questions: expect.any(Array),
    });
  });

  it('displays the AI content verification advisory warning when questions are parsed', () => {
    vi.mocked(useMarkdownImport).mockReturnValue({
      parse: mockParse,
      isParsing: false,
      parseError: null,
      parseResult: {
        questions: [
          {
            type: 'SINGLE_CHOICE',
            prompt: 'Hàm số y = x^2 đồng biến trên khoảng nào?',
            difficulty: 'EASY',
            defaultPoints: 1.0,
            rawSourceLine: 2,
            options: [
              { text: '(0; +∞)', isCorrect: true },
              { text: '(-∞; 0)', isCorrect: false },
            ],
          },
        ],
        diagnostics: [],
        totalQuestions: 1,
        validQuestionsCount: 1,
        hasErrors: false,
      },
      resetParse: vi.fn(),
      commit: mockCommit,
      isCommitting: false,
      commitError: null,
      commitResult: undefined,
    });

    renderComponent();

    expect(screen.getByTestId('ai-verification-alert')).toBeTruthy();
    expect(screen.getByText('Lưu ý kiểm duyệt nội dung do AI tạo')).toBeTruthy();
    expect(
      screen.getByText(/Nội dung do mô hình AI sinh ra có thể phát sinh sai sót/i),
    ).toBeTruthy();
  });

  it('allows copying all diagnostics and single diagnostic to clipboard', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    });

    vi.mocked(useMarkdownImport).mockReturnValue({
      parse: mockParse,
      isParsing: false,
      parseError: null,
      parseResult: {
        questions: [],
        diagnostics: [
          {
            line: 5,
            message: 'Thiếu phương án đúng trong câu hỏi SINGLE_CHOICE',
            severity: 'ERROR',
            remediation: 'Đánh dấu ít nhất một phương án đúng với - [x]',
          },
          {
            line: 12,
            message: 'Không tìm thấy thang điểm',
            severity: 'WARNING',
            remediation: "Bổ sung '> points: 1.0'",
          },
        ],
        totalQuestions: 1,
        validQuestionsCount: 0,
        hasErrors: true,
      },
      resetParse: vi.fn(),
      commit: mockCommit,
      isCommitting: false,
      commitError: null,
      commitResult: undefined,
    });

    renderComponent();

    // Diagnostics report displays badges
    expect(screen.getByText('1 lỗi')).toBeTruthy();
    expect(screen.getByText('1 cảnh báo')).toBeTruthy();

    // 1. Copy all diagnostics
    const copyAllBtn = screen.getByRole('button', { name: /sao chép tất cả lỗi/i });
    expect(copyAllBtn).toBeTruthy();
    fireEvent.click(copyAllBtn);

    expect(writeTextMock).toHaveBeenCalledTimes(1);
    const firstCall = writeTextMock.mock.calls[0];
    expect(firstCall).toBeDefined();
    const copiedAllPayload = firstCall?.[0] as string;
    expect(copiedAllPayload).toContain('[QuizForge - Chẩn đoán cú pháp Markdown]');
    expect(copiedAllPayload).toContain('1 lỗi, 1 cảnh báo');
    expect(copiedAllPayload).toContain('Thiếu phương án đúng');
    expect(copiedAllPayload).toContain('Đánh dấu ít nhất một phương án đúng');

    // 2. Copy single diagnostic
    const copySingleBtns = screen.getAllByRole('button', { name: /sao chép chi tiết lỗi này/i });
    expect(copySingleBtns.length).toBe(2);
    const firstSingleBtn = copySingleBtns[0];
    expect(firstSingleBtn).toBeDefined();
    if (firstSingleBtn) {
      fireEvent.click(firstSingleBtn);
    }

    expect(writeTextMock).toHaveBeenCalledTimes(2);
    const secondCall = writeTextMock.mock.calls[1];
    expect(secondCall).toBeDefined();
    const copiedSinglePayload = secondCall?.[0] as string;
    expect(copiedSinglePayload).toContain('Dòng 5 [ERROR]: Thiếu phương án đúng');
    expect(copiedSinglePayload).toContain('Đánh dấu ít nhất một phương án đúng');
  });
});
