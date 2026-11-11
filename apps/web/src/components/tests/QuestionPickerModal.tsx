import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useQuestionBanks } from '../../hooks/useQuestionBanks';
import { useQuestions } from '../../hooks/useQuestions';
import { Check, CheckSquare, Search, Square, X } from 'lucide-react';
import { MarkdownMathPreview } from '../common/MarkdownMathPreview';
import type { Difficulty } from '@quizforge/shared-types';

interface QuestionPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddQuestions: (questionIds: string[], defaultPoints: number) => Promise<void>;
  existingQuestionIds?: string[];
  isLoading?: boolean;
}

export function QuestionPickerModal({
  isOpen,
  onClose,
  onAddQuestions,
  existingQuestionIds = [],
  isLoading,
}: QuestionPickerModalProps) {
  const [selectedBankId, setSelectedBankId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | undefined>(undefined);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());
  const [defaultPoints] = useState<number>(1.0);
  const [error, setError] = useState<string | null>(null);

  const { data: banksData, isLoading: isLoadingBanks } = useQuestionBanks({ limit: 100 });
  const banks = banksData?.data || [];

  // Tự động chọn ngân hàng đầu tiên nếu chưa chọn
  const activeBankId = selectedBankId || (banks.length > 0 ? banks[0]?.id : '');

  const { data: questionsData, isLoading: isLoadingQuestions } = useQuestions(activeBankId, {
    q: searchTerm || undefined,
    difficulty: difficultyFilter,
    limit: 100,
  });

  const questions = questionsData?.data || [];

  const getDifficultyBadge = (difficulty?: string) => {
    switch (difficulty) {
      case 'EASY':
        return (
          <span
            data-testid="difficulty-badge"
            className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
          >
            Dễ
          </span>
        );
      case 'MEDIUM':
        return (
          <span
            data-testid="difficulty-badge"
            className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
          >
            Trung bình
          </span>
        );
      case 'HARD':
        return (
          <span
            data-testid="difficulty-badge"
            className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-950/50 dark:text-rose-400"
          >
            Khó
          </span>
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    setSelectedQuestionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    const selectable = questions
      .filter((q) => !existingQuestionIds.includes(q.id))
      .map((q) => q.id);
    setSelectedQuestionIds(new Set(selectable));
  };

  const clearSelection = () => {
    setSelectedQuestionIds(new Set());
  };

  const handleSubmit = async () => {
    if (selectedQuestionIds.size === 0) {
      setError('Vui lòng chọn ít nhất 1 câu hỏi');
      return;
    }

    try {
      setError(null);
      await onAddQuestions(Array.from(selectedQuestionIds), defaultPoints);
      setSelectedQuestionIds(new Set());
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      setError(
        errorObj?.response?.data?.message || errorObj?.message || 'Có lỗi xảy ra khi thêm câu hỏi',
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex h-[90vh] w-full max-w-4xl flex-col rounded-xl bg-white shadow-xl dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Chọn câu hỏi từ ngân hàng
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Chọn câu hỏi từ các ngân hàng cá nhân để đưa vào snapshot đề thi
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Toolbar */}
        <div className="grid grid-cols-1 gap-3 border-b p-4 sm:grid-cols-3 dark:border-slate-800">
          <div>
            <Label htmlFor="bank-select" className="text-xs">
              Ngân hàng câu hỏi
            </Label>
            <select
              id="bank-select"
              value={activeBankId}
              onChange={(e) => {
                setSelectedBankId(e.target.value);
                setSelectedQuestionIds(new Set());
              }}
              disabled={isLoadingBanks}
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {banks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} ({b._count?.questions ?? 0} câu)
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="search-q" className="text-xs">
              Tìm kiếm nội dung
            </Label>
            <div className="relative mt-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                id="search-q"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nội dung câu hỏi..."
                className="pl-8 text-sm"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="difficulty-filter" className="text-xs">
              Mức độ khó
            </Label>
            <select
              id="difficulty-filter"
              value={difficultyFilter || ''}
              onChange={(e) => setDifficultyFilter((e.target.value as Difficulty) || undefined)}
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="">Tất cả mức độ</option>
              <option value="EASY">Dễ</option>
              <option value="MEDIUM">Trung bình</option>
              <option value="HARD">Khó</option>
            </select>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between bg-slate-50 px-4 py-2 text-xs text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={selectAll}
              className="flex items-center gap-1 font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            >
              <CheckSquare className="h-4 w-4" /> Chọn tất cả
            </button>
            <button
              type="button"
              onClick={clearSelection}
              className="flex items-center gap-1 font-medium text-slate-500 hover:underline"
            >
              <Square className="h-4 w-4" /> Bỏ chọn
            </button>
          </div>
          <div>
            Đã chọn: <span className="font-bold text-indigo-600">{selectedQuestionIds.size}</span>{' '}
            câu hỏi
          </div>
        </div>

        {/* Question List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
              {error}
            </div>
          )}

          {isLoadingQuestions ? (
            <div className="flex h-32 items-center justify-center text-sm text-slate-400">
              Đang tải danh sách câu hỏi...
            </div>
          ) : questions.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center text-sm text-slate-400">
              Ngân hàng này chưa có câu hỏi nào phù hợp.
            </div>
          ) : (
            questions.map((q) => {
              const isAlreadyIn = existingQuestionIds.includes(q.id);
              const isSelected = selectedQuestionIds.has(q.id);

              return (
                <div
                  key={q.id}
                  onClick={() => !isAlreadyIn && toggleSelect(q.id)}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                    isAlreadyIn
                      ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-60 dark:border-slate-800 dark:bg-slate-900'
                      : isSelected
                        ? 'border-indigo-500 bg-indigo-50/50 dark:border-indigo-500/80 dark:bg-indigo-950/20'
                        : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected || isAlreadyIn}
                    disabled={isAlreadyIn}
                    onChange={() => {}}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                        {q.type}
                      </span>
                      {getDifficultyBadge(q.difficulty)}
                      {isAlreadyIn && (
                        <span className="text-xs text-amber-600 dark:text-amber-400">
                          (Đã có trong đề)
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-100 line-clamp-2">
                      <MarkdownMathPreview content={q.prompt} />
                    </div>
                    {q.options && q.options.length > 0 && (
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {q.options.length} lựa chọn đáp án
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t p-4 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || selectedQuestionIds.size === 0}
            className="flex items-center gap-2"
          >
            <Check className="h-4 w-4" />
            {isLoading ? 'Đang thêm...' : `Thêm ${selectedQuestionIds.size} câu hỏi vào đề`}
          </Button>
        </div>
      </div>
    </div>
  );
}
