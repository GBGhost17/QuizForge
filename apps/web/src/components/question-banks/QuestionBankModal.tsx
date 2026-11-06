import React, { useEffect, useState } from 'react';
import { CreateQuestionBankSchema } from '@quizforge/validation';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Alert, AlertDescription } from '../ui/alert';
import type { QuestionBank } from '@quizforge/shared-types';

interface QuestionBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; description?: string }) => Promise<void>;
  bankToEdit?: QuestionBank | null;
  isLoading?: boolean;
}

export function QuestionBankModal({
  isOpen,
  onClose,
  onSubmit,
  bankToEdit,
  isLoading,
}: QuestionBankModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bankToEdit) {
      setTitle(bankToEdit.title);
      setDescription(bankToEdit.description || '');
    } else {
      setTitle('');
      setDescription('');
    }
    setError(null);
  }, [bankToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationResult = CreateQuestionBankSchema.safeParse({
      title,
      description: description || undefined,
    });

    if (!validationResult.success) {
      setError(validationResult.error.errors[0]?.message || 'Dữ liệu không hợp lệ');
      return;
    }

    try {
      await onSubmit(validationResult.data);
      onClose();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Có lỗi xảy ra khi lưu ngân hàng câu hỏi';
      setError(message);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl transition-all">
        <h2 id="modal-title" className="text-xl font-bold text-slate-900">
          {bankToEdit ? 'Chỉnh sửa ngân hàng câu hỏi' : 'Tạo ngân hàng câu hỏi mới'}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Ngân hàng câu hỏi giúp bạn phân loại và tái sử dụng câu hỏi cho nhiều đề thi khác nhau.
        </p>

        {error && (
          <Alert variant="error" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <Input
            id="bank-title"
            label="Tiêu đề ngân hàng câu hỏi"
            placeholder="Ví dụ: Đại số tuyến tính, Lịch sử Việt Nam..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />

          <div className="space-y-1">
            <label htmlFor="bank-description" className="block text-sm font-medium text-slate-700">
              Mô tả chi tiết (Tùy chọn)
            </label>
            <textarea
              id="bank-description"
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-600"
              placeholder="Ghi chú về phạm vi kiến thức, đối tượng học sinh..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading}>
              {bankToEdit ? 'Lưu thay đổi' : 'Tạo ngân hàng'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
