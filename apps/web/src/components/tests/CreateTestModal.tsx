import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { X } from 'lucide-react';
import type { CreateTestDto, TestMode } from '@quizforge/shared-types';

interface CreateTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: CreateTestDto) => Promise<void>;
  isLoading?: boolean;
}

export function CreateTestModal({ isOpen, onClose, onSubmit, isLoading }: CreateTestModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<TestMode>('ASSIGNMENT');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number | undefined>(45);
  const [maxAttempts, setMaxAttempts] = useState<number>(1);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Tiêu đề đề thi không được để trống');
      return;
    }

    try {
      setError(null);
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        mode,
        timeLimitMinutes: timeLimitMinutes ? Number(timeLimitMinutes) : undefined,
        maxAttempts: Number(maxAttempts) || 1,
        shuffleQuestions,
        shuffleOptions,
      });
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      setError(
        errorObj?.response?.data?.message || errorObj?.message || 'Có lỗi xảy ra khi tạo đề thi',
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Tạo đề thi mới</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
              {error}
            </div>
          )}

          <div>
            <Label htmlFor="test-title">Tiêu đề đề thi *</Label>
            <Input
              id="test-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Kiểm tra 1 tiết Toán Giải tích 12"
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="test-desc">Mô tả chi tiết</Label>
            <textarea
              id="test-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ghi chú nội dung trọng tâm của đề thi..."
              rows={3}
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="test-mode">Chế độ thi</Label>
              <select
                id="test-mode"
                value={mode}
                onChange={(e) => setMode(e.target.value as TestMode)}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="ASSIGNMENT">Bài tập / Kiểm tra (ASSIGNMENT)</option>
                <option value="PRACTICE">Luyện tập tự do (PRACTICE)</option>
                <option value="LIVE">Thi trực tiếp theo phòng (LIVE)</option>
              </select>
            </div>

            <div>
              <Label htmlFor="time-limit">Thời gian làm bài (phút)</Label>
              <Input
                id="time-limit"
                type="number"
                min={1}
                max={1440}
                value={timeLimitMinutes ?? ''}
                onChange={(e) =>
                  setTimeLimitMinutes(e.target.value ? Number(e.target.value) : undefined)
                }
                placeholder="Để trống nếu không giới hạn"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="max-attempts">Số lần làm tối đa</Label>
              <Input
                id="max-attempts"
                type="number"
                min={1}
                max={100}
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(Number(e.target.value) || 1)}
                className="mt-1"
              />
            </div>

            <div className="flex flex-col justify-end space-y-2 pt-2">
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={shuffleQuestions}
                  onChange={(e) => setShuffleQuestions(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800"
                />
                Đảo thứ tự câu hỏi
              </label>

              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={shuffleOptions}
                  onChange={(e) => setShuffleOptions(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800"
                />
                Đảo thứ tự đáp án (A, B, C, D)
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-800">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Đang tạo...' : 'Tạo đề thi'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
