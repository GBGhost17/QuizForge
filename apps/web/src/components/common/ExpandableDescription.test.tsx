import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExpandableDescription } from './ExpandableDescription';

describe('ExpandableDescription', () => {
  it('renders default empty text when content is empty or null', () => {
    render(<ExpandableDescription content="" />);
    expect(screen.getByText('Chưa có mô tả cho ngân hàng câu hỏi này.')).toBeTruthy();
  });

  it('renders custom empty text when provided', () => {
    render(<ExpandableDescription content={null} emptyText="Chưa có thông tin." />);
    expect(screen.getByText('Chưa có thông tin.')).toBeTruthy();
  });

  it('renders short content without "Xem thêm" toggle button', () => {
    render(<ExpandableDescription content="Mô tả ngắn gọn một dòng duy nhất." />);
    expect(screen.getByText('Mô tả ngắn gọn một dòng duy nhất.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /xem thêm/i })).toBeNull();
  });

  it('renders long multi-line content with "Xem thêm" toggle and toggles expanded state', () => {
    const longContent = `Dòng 1: Giới thiệu chung về bộ đề thi thử THPT Quốc Gia năm 2026.
Dòng 2: Nội dung bao gồm toàn bộ kiến thức đại số và giải tích 12.
Dòng 3: Thí sinh cần nắm vững các công thức đạo hàm, tích phân và hàm số lũy thừa.
Dòng 4: Chúc các em ôn tập thật tốt và đạt điểm cao trong kỳ thi sắp tới.`;

    render(<ExpandableDescription content={longContent} />);

    // Content is rendered
    expect(screen.getByText(/Giới thiệu chung về bộ đề thi thử/)).toBeTruthy();

    // "Xem thêm" button is displayed
    const expandBtn = screen.getByRole('button', { name: /xem thêm/i });
    expect(expandBtn).toBeTruthy();
    expect(expandBtn.getAttribute('aria-expanded')).toBe('false');

    // Click "Xem thêm" -> toggles to "Thu gọn"
    fireEvent.click(expandBtn);
    expect(screen.getByRole('button', { name: /thu gọn/i })).toBeTruthy();
    expect(expandBtn.getAttribute('aria-expanded')).toBe('true');

    // Click "Thu gọn" -> toggles back to "Xem thêm"
    fireEvent.click(screen.getByRole('button', { name: /thu gọn/i }));
    expect(screen.getByRole('button', { name: /xem thêm/i })).toBeTruthy();
  });
});

