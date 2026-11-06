import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import {
  Button,
  Input,
  Label,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Badge,
  Alert,
  AlertTitle,
  AlertDescription,
} from './index';

describe('UI Primitives', () => {
  afterEach(() => {
    cleanup();
  });

  describe('Button Primitive', () => {
    it('renders children and handles click event', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Bấm vào đây</Button>);

      const button = screen.getByRole('button', { name: /bấm vào đây/i });
      expect(button).toBeDefined();

      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('disables button when disabled or isLoading is true', () => {
      render(<Button isLoading>Đang tải</Button>);
      const button = screen.getByRole('button', { name: /đang tải/i });
      expect(button).toHaveProperty('disabled', true);
    });

    it('applies variant classes correctly', () => {
      const { container } = render(<Button variant="destructive">Xóa bài thi</Button>);
      expect((container.firstChild as HTMLElement).className).toContain('bg-red-600');
    });
  });

  describe('Input Primitive', () => {
    it('renders with label and helper text', () => {
      render(
        <Input
          label="Địa chỉ Email"
          helperText="Chúng tôi không bao giờ chia sẻ email của bạn"
          placeholder="user@example.com"
        />,
      );

      expect(screen.getByText('Địa chỉ Email')).toBeDefined();
      expect(screen.getByText('Chúng tôi không bao giờ chia sẻ email của bạn')).toBeDefined();
      expect(screen.getByPlaceholderText('user@example.com')).toBeDefined();
    });

    it('renders error state with aria-invalid', () => {
      render(<Input label="Mật khẩu" error="Mật khẩu không hợp lệ" />);

      const input = screen.getByLabelText('Mật khẩu');
      expect(input.getAttribute('aria-invalid')).toBe('true');
      expect(screen.getByText('Mật khẩu không hợp lệ')).toBeDefined();
    });
  });

  describe('Label Primitive', () => {
    it('renders label text and required star', () => {
      render(<Label required>Họ và tên</Label>);
      expect(screen.getByText('Họ và tên')).toBeDefined();
      expect(screen.getByText('*')).toBeDefined();
    });
  });

  describe('Card Primitive', () => {
    it('renders card sections correctly', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Tiêu đề thẻ</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Nội dung câu hỏi</p>
          </CardContent>
          <CardFooter>
            <p>Chân thẻ</p>
          </CardFooter>
        </Card>,
      );

      expect(screen.getByText('Tiêu đề thẻ')).toBeDefined();
      expect(screen.getByText('Nội dung câu hỏi')).toBeDefined();
      expect(screen.getByText('Chân thẻ')).toBeDefined();
    });
  });

  describe('Badge Primitive', () => {
    it('renders badge with text and correct variant', () => {
      render(<Badge variant="success">Hoàn thành</Badge>);
      const badge = screen.getByText('Hoàn thành');
      expect(badge).toBeDefined();
      expect(badge.className).toContain('bg-emerald-100');
    });
  });

  describe('Alert Primitive', () => {
    it('renders alert with accessible role and title', () => {
      render(
        <Alert variant="error">
          <AlertTitle>Lỗi xảy ra</AlertTitle>
          <AlertDescription>Không thể tải đề thi</AlertDescription>
        </Alert>,
      );

      const alert = screen.getByRole('alert');
      expect(alert).toBeDefined();
      expect(screen.getByText('Lỗi xảy ra')).toBeDefined();
      expect(screen.getByText('Không thể tải đề thi')).toBeDefined();
    });
  });
});
