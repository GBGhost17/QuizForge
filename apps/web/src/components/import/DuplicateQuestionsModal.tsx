import { useState, useEffect } from 'react';
import { AlertTriangle, Check, CheckSquare, Square, Trash2, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { MarkdownMathPreview } from '../common/MarkdownMathPreview';
import type { DuplicateMatch } from '@quizforge/shared-types';

interface DuplicateQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  duplicates: DuplicateMatch[];
  totalQuestionsCount: number;
  bankTitle?: string;
  onConfirmExclusions: (excludedIndices: number[]) => void;
  isSubmitting?: boolean;
}

export function DuplicateQuestionsModal({
  isOpen,
  onClose,
  duplicates,
  totalQuestionsCount,
  bankTitle,
  onConfirmExclusions,
  isSubmitting = false,
}: DuplicateQuestionsModalProps) {
  // By default, pre-select all duplicate question indices for exclusion to protect bank integrity
  const [excludedIndices, setExcludedIndices] = useState<Set<number>>(() => {
    return new Set(duplicates.map((d) => d.newQuestionIndex));
  });

  useEffect(() => {
    if (isOpen) {
      setExcludedIndices(new Set(duplicates.map((d) => d.newQuestionIndex)));
    }
  }, [isOpen, duplicates]);

  if (!isOpen || duplicates.length === 0) return null;

  const toggleExclusion = (index: number) => {
    setExcludedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const excludeAll = () => {
    setExcludedIndices(new Set(duplicates.map((d) => d.newQuestionIndex)));
  };

  const keepAll = () => {
    setExcludedIndices(new Set());
  };

  const handleConfirm = () => {
    onConfirmExclusions(Array.from(excludedIndices));
  };

  const remainingCount = totalQuestionsCount - excludedIndices.size;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="duplicate-modal-title"
    >
      <div className="flex h-[90vh] w-full max-w-5xl flex-col rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-5 bg-amber-50/70 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-900/50">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="duplicate-modal-title"
                className="text-lg font-bold text-slate-900 dark:text-white"
              >
                Phát hiện {duplicates.length} câu hỏi có tỉ lệ trùng lặp cao (≥ 85%)
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Các câu hỏi dưới đây có phần trọng tâm (công thức toán, dữ kiện cốt lõi) tương đồng
                cao với bộ câu hỏi đã có sẵn trong ngân hàng{' '}
                {bankTitle ? <strong>"{bankTitle}"</strong> : ''}. Thầy/Cô có toàn quyền đối chiếu
                và xác nhận loại bỏ hoặc giữ lại từng câu trước khi nhập.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            title="Đóng"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-2.5 text-xs dark:border-slate-800 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={excludeAll}
              className="flex items-center gap-1.5 font-medium text-amber-700 hover:underline dark:text-amber-400"
            >
              <CheckSquare className="h-4 w-4" /> Loại bỏ tất cả câu trùng ({duplicates.length})
            </button>
            <button
              type="button"
              onClick={keepAll}
              className="flex items-center gap-1.5 font-medium text-slate-600 hover:underline dark:text-slate-400"
            >
              <Square className="h-4 w-4" /> Bỏ chọn (Vẫn giữ lại tất cả)
            </button>
          </div>
          <div className="text-slate-600 dark:text-slate-300">
            Đã chọn loại bỏ: <strong className="text-amber-600">{excludedIndices.size}</strong> /{' '}
            {duplicates.length} câu trùng
          </div>
        </div>

        {/* Duplicates Comparison List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {duplicates.map((dup, idx) => {
            const isExcluded = excludedIndices.has(dup.newQuestionIndex);
            const percentage = Math.round(dup.similarity * 100);

            return (
              <div
                key={idx}
                className={`rounded-xl border transition-all ${
                  isExcluded
                    ? 'border-amber-300 bg-amber-50/20 dark:border-amber-900/60 dark:bg-amber-950/10'
                    : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                }`}
              >
                {/* Item Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-800/40">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[11px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Cặp trùng lặp #{idx + 1}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[11px] font-semibold ${
                        percentage >= 95
                          ? 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300'
                          : 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300'
                      }`}
                    >
                      Độ tương đồng: {percentage}%
                    </Badge>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleExclusion(dup.newQuestionIndex)}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                      isExcluded
                        ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {isExcluded ? (
                      <>
                        <Trash2 className="h-3.5 w-3.5 text-amber-600" />
                        <span>Đã chọn loại bỏ</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Vẫn giữ lại</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Side-by-Side Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800 p-4 gap-4">
                  {/* Left: New Question */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-indigo-600 text-white text-[10px]">
                        Câu mới chuẩn bị thêm (#{dup.newQuestionIndex + 1})
                      </Badge>
                      {dup.newQuestionType && (
                        <span className="text-[11px] text-slate-400">{dup.newQuestionType}</span>
                      )}
                    </div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white p-3 rounded-lg bg-indigo-50/30 border border-indigo-100/60 dark:bg-slate-800/60 dark:border-slate-700">
                      <MarkdownMathPreview content={dup.newQuestionPrompt} />
                    </div>
                  </div>

                  {/* Right: Existing Question in Bank */}
                  <div className="space-y-2 md:pl-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50 text-[10px] dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                        Đã có sẵn trong ngân hàng
                      </Badge>
                      {dup.existingQuestionType && (
                        <span className="text-[11px] text-slate-400">{dup.existingQuestionType}</span>
                      )}
                    </div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white p-3 rounded-lg bg-slate-50 border border-slate-200/80 dark:bg-slate-800/40 dark:border-slate-800">
                      <MarkdownMathPreview content={dup.existingQuestionPrompt} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs text-slate-500">
            {remainingCount > 0 ? (
              <span>
                Sau khi loại bỏ <strong>{excludedIndices.size}</strong> câu trùng, sẽ nhập{' '}
                <strong className="text-emerald-600">{remainingCount}</strong> câu hợp lệ còn lại.
              </span>
            ) : (
              <span className="text-amber-600 font-medium">
                Tất cả các câu hỏi đều bị đánh dấu loại bỏ. Sẽ không có câu nào được nhập.
              </span>
            )}
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy bỏ
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting || (remainingCount === 0 && excludedIndices.size === totalQuestionsCount)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
            >
              <Check className="h-4 w-4" />
              {isSubmitting
                ? 'Đang nhập...'
                : `Xác nhận & Tiến hành nhập (${remainingCount} câu)`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
