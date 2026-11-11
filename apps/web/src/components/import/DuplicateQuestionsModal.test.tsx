import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { DuplicateQuestionsModal } from './DuplicateQuestionsModal';
import type { DuplicateMatch } from '@quizforge/shared-types';

describe('DuplicateQuestionsModal', () => {
  const mockOnClose = vi.fn();
  const mockOnConfirmExclusions = vi.fn();

  const mockDuplicates: DuplicateMatch[] = [
    {
      newQuestionIndex: 0,
      newQuestionPrompt: 'Phương trình bậc hai $ax^2 + bx + c = 0$ có nghiệm khi nào?',
      newQuestionType: 'SINGLE_CHOICE',
      existingQuestionId: 'q-old-1',
      existingQuestionPrompt: 'Điều kiện để phương trình bậc hai $ax^2 + bx + c = 0$ có nghiệm?',
      existingQuestionType: 'SINGLE_CHOICE',
      similarity: 0.92,
    },
    {
      newQuestionIndex: 1,
      newQuestionPrompt: 'Định luật vạn vật hấp dẫn do ai phát minh?',
      newQuestionType: 'SINGLE_CHOICE',
      existingQuestionId: 'q-old-2',
      existingQuestionPrompt: 'Ai là người phát hiện ra định luật vạn vật hấp dẫn?',
      existingQuestionType: 'SINGLE_CHOICE',
      similarity: 0.85,
    },
  ];

  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(
      <DuplicateQuestionsModal
        isOpen={false}
        onClose={mockOnClose}
        duplicates={mockDuplicates}
        totalQuestionsCount={5}
        bankTitle="Ngân hàng Vật lý & Toán"
        onConfirmExclusions={mockOnConfirmExclusions}
      />,
    );

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders side-by-side comparison with similarity percentages and math content', () => {
    render(
      <DuplicateQuestionsModal
        isOpen={true}
        onClose={mockOnClose}
        duplicates={mockDuplicates}
        totalQuestionsCount={5}
        bankTitle="Ngân hàng Vật lý & Toán"
        onConfirmExclusions={mockOnConfirmExclusions}
      />,
    );

    expect(
      screen.getByRole('heading', {
        name: /Phát hiện 2 câu hỏi có tỉ lệ trùng lặp cao/i,
      }),
    ).toBeTruthy();

    expect(screen.getByText(/Ngân hàng Vật lý & Toán/i)).toBeTruthy();
    expect(screen.getByText('Độ tương đồng: 92%')).toBeTruthy();
    expect(screen.getByText('Độ tương đồng: 85%')).toBeTruthy();

    // Check prompts exist in preview cards
    expect(screen.getAllByText(/Phương trình bậc hai/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Định luật vạn vật hấp dẫn/).length).toBeGreaterThan(0);
  });

  it('allows toggling individual exclusions and confirming', () => {
    render(
      <DuplicateQuestionsModal
        isOpen={true}
        onClose={mockOnClose}
        duplicates={mockDuplicates}
        totalQuestionsCount={5}
        onConfirmExclusions={mockOnConfirmExclusions}
      />,
    );

    // By default, both duplicate questions (0, 1) are marked as excluded
    const toggleButtons = screen.getAllByRole('button', { name: /Đã chọn loại bỏ/i });
    expect(toggleButtons.length).toBe(2);

    // Toggle off the first question exclusion (keep question 0)
    const firstToggle = toggleButtons[0];
    expect(firstToggle).toBeDefined();
    if (firstToggle) {
      fireEvent.click(firstToggle);
    }

    // Now button switches to "Vẫn giữ lại"
    expect(screen.getByRole('button', { name: /^Vẫn giữ lại$/i })).toBeTruthy();

    // Confirm exclusions -> only question index 1 is excluded
    const confirmBtn = screen.getByRole('button', { name: /Xác nhận & Tiến hành nhập/i });
    fireEvent.click(confirmBtn);

    expect(mockOnConfirmExclusions).toHaveBeenCalledWith([1]);
  });

  it('supports "Loại bỏ tất cả" and "Bỏ chọn" bulk actions', () => {
    render(
      <DuplicateQuestionsModal
        isOpen={true}
        onClose={mockOnClose}
        duplicates={mockDuplicates}
        totalQuestionsCount={5}
        onConfirmExclusions={mockOnConfirmExclusions}
      />,
    );

    // Click "Bỏ chọn (Vẫn giữ lại tất cả)"
    const keepAllBtn = screen.getByRole('button', {
      name: /Bỏ chọn \(Vẫn giữ lại tất cả\)/i,
    });
    fireEvent.click(keepAllBtn);

    // Confirm -> 0 exclusions, keep all 5 questions
    const confirmBtn = screen.getByRole('button', { name: /Xác nhận & Tiến hành nhập/i });
    fireEvent.click(confirmBtn);

    expect(mockOnConfirmExclusions).toHaveBeenCalledWith([]);

    // Now click "Loại bỏ tất cả"
    const excludeAllBtn = screen.getByRole('button', {
      name: /Loại bỏ tất cả câu trùng/i,
    });
    fireEvent.click(excludeAllBtn);

    fireEvent.click(screen.getByRole('button', { name: /Xác nhận & Tiến hành nhập/i }));
    expect(mockOnConfirmExclusions).toHaveBeenCalledWith([0, 1]);
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <DuplicateQuestionsModal
        isOpen={true}
        onClose={mockOnClose}
        duplicates={mockDuplicates}
        totalQuestionsCount={5}
        onConfirmExclusions={mockOnConfirmExclusions}
      />,
    );

    const closeBtn = screen.getByTitle('Đóng');
    fireEvent.click(closeBtn);
    expect(mockOnClose).toHaveBeenCalled();
  });
});
