import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  CloudCheck,
  Loader2,
  Send,
} from 'lucide-react';
import { useAttemptDetail, useSaveAnswers, useSubmitAttempt } from '../../hooks/useAttempts';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Alert } from '../../components/ui/alert';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { MarkdownMathPreview } from '../../components/common/MarkdownMathPreview';
import type { QuestionType } from '@quizforge/shared-types';

interface LocalAnswer {
  selectedOptionIds?: string[];
  textAnswer?: string;
}

export const TakeTestPage: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  const { data: attempt, isLoading, error } = useAttemptDetail(attemptId);
  const saveMutation = useSaveAnswers();
  const submitMutation = useSubmitAttempt();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [localAnswers, setLocalAnswers] = useState<Record<string, LocalAnswer>>({});
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Khởi tạo answers từ backend khi attempt load lần đầu
  useEffect(() => {
    if (attempt) {
      if (attempt.status !== 'IN_PROGRESS') {
        navigate(`/attempts/${attempt.id}/submitted`, { replace: true });
        return;
      }
      const initial: Record<string, LocalAnswer> = {};
      for (const [snapId, ans] of Object.entries(attempt.answers)) {
        initial[snapId] = {
          selectedOptionIds: ans.selectedOptionIds,
          textAnswer: ans.textAnswer,
        };
      }
      setLocalAnswers(initial);
      setLastSavedAt(new Date().toLocaleTimeString('vi-VN'));
    }
  }, [attempt, navigate]);

  // Tự động lưu ngầm (Debounced Autosave)
  const pendingSaveRef = useRef<boolean>(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const performSave = useCallback(
    async (answersToSave: Record<string, LocalAnswer>) => {
      if (!attemptId) return;
      try {
        setIsSaving(true);
        const batch = Object.entries(answersToSave).map(([snapshotId, ans]) => ({
          snapshotId,
          selectedOptionIds: ans.selectedOptionIds,
          textAnswer: ans.textAnswer,
        }));

        if (batch.length > 0) {
          await saveMutation.mutateAsync({
            attemptId,
            payload: { answers: batch },
          });
          setLastSavedAt(new Date().toLocaleTimeString('vi-VN'));
        }
      } catch {
        // Lỗi lưu tạm thời sẽ được thử lại ở lần lưu kế tiếp
      } finally {
        setIsSaving(false);
        pendingSaveRef.current = false;
      }
    },
    [attemptId, saveMutation],
  );

  const handleForceSubmit = useCallback(async () => {
    if (!attemptId || submitMutation.isPending) return;
    try {
      await performSave(localAnswers);
      await submitMutation.mutateAsync(attemptId);
      navigate(`/attempts/${attemptId}/submitted`, { replace: true });
    } catch {
      // Error handled by mutation
    }
  }, [attemptId, submitMutation, performSave, localAnswers, navigate]);

  const scheduleSave = useCallback(
    (newAnswers: Record<string, LocalAnswer>) => {
      pendingSaveRef.current = true;
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        performSave(newAnswers);
      }, 1200);
    },
    [performSave],
  );

  // Bộ đếm ngược thời gian (Server-authoritative timer)
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!attempt?.expiresAt) {
      setSecondsRemaining(null);
      return;
    }

    const expiresTime = new Date(attempt.expiresAt).getTime();
    const serverTime = new Date(attempt.serverTime).getTime();
    const clientNow = Date.now();
    const serverClientOffset = serverTime - clientNow;

    const calculateRemaining = () => {
      const estimatedServerNow = Date.now() + serverClientOffset;
      const diffMs = expiresTime - estimatedServerNow;
      return Math.max(0, Math.floor(diffMs / 1000));
    };

    setSecondsRemaining(calculateRemaining());

    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setSecondsRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        handleForceSubmit();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [attempt?.expiresAt, attempt?.serverTime, handleForceSubmit]);

  const handleAnswerChange = (snapshotId: string, update: Partial<LocalAnswer>) => {
    setLocalAnswers((prev) => {
      const updated = {
        ...prev,
        [snapshotId]: {
          ...prev[snapshotId],
          ...update,
        },
      };
      scheduleSave(updated);
      return updated;
    });
  };

  const questions = useMemo(() => attempt?.questions || [], [attempt?.questions]);
  const currentQuestion = questions[currentIndex];

  const answeredCount = useMemo(() => {
    let count = 0;
    for (const q of questions) {
      const ans = localAnswers[q.snapshotId];
      if (!ans) continue;
      if (ans.selectedOptionIds && ans.selectedOptionIds.length > 0) {
        count++;
      } else if (ans.textAnswer && ans.textAnswer.trim().length > 0) {
        count++;
      }
    }
    return count;
  }, [questions, localAnswers]);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-slate-500">
        <LoadingSpinner size="lg" />
        <p className="mt-3 text-sm font-medium">Đang tải bài thi của bạn...</p>
      </div>
    );
  }

  if (error || !attempt || !currentQuestion) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4">
        <Alert variant="error">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div className="text-sm font-medium">
              {(axios.isAxiosError(error) &&
                (error.response?.data as { message?: string })?.message) ||
                'Không thể tải thông tin bài thi.'}
            </div>
          </div>
        </Alert>
        <div className="mt-4 text-center">
          <Button variant="outline" onClick={() => navigate('/join')}>
            Quay lại trang vào phòng thi
          </Button>
        </div>
      </div>
    );
  }

  const formatTimer = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const currentAnswer = localAnswers[currentQuestion.snapshotId] || {};

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* Sticky Exam Top Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 sm:px-8 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-slate-500 font-medium truncate">
              Lượt thi #{attempt.attemptNumber}
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">
              {attempt.title}
            </h1>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {/* Autosave Status Badge */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-500" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <CloudCheck className="w-4 h-4 text-emerald-500" />
                  <span>{lastSavedAt ? `Đã lưu ${lastSavedAt}` : 'Tự động lưu'}</span>
                </>
              )}
            </div>

            {/* Countdown Timer */}
            {secondsRemaining !== null && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-bold text-sm sm:text-base border shadow-2xs transition-colors ${
                  secondsRemaining < 60
                    ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                    : secondsRemaining < 300
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-slate-100 text-slate-800 border-slate-200'
                }`}
                title="Thời gian làm bài còn lại"
              >
                <Clock className="w-4 h-4" />
                <span>{formatTimer(secondsRemaining)}</span>
              </div>
            )}

            {/* Nộp bài button */}
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsSubmitModalOpen(true)}
              className="font-semibold shadow-xs"
            >
              <Send className="w-4 h-4 mr-1.5" />
              Nộp bài
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Question Navigator Palette */}
        <aside className="lg:col-span-1 order-2 lg:order-1">
          <Card className="p-4 bg-white border-slate-200 shadow-xs sticky top-20">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Mục lục câu hỏi
              </span>
              <span className="text-xs font-medium text-slate-500">
                <span className="font-bold text-emerald-600">{answeredCount}</span> /{' '}
                {questions.length} đã làm
              </span>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-4 gap-2">
              {questions.map((q, idx) => {
                const ans = localAnswers[q.snapshotId];
                const isAnswered =
                  (ans?.selectedOptionIds && ans.selectedOptionIds.length > 0) ||
                  (ans?.textAnswer && ans.textAnswer.trim().length > 0);
                const isCurrent = idx === currentIndex;

                return (
                  <button
                    key={q.snapshotId}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded-md font-semibold text-xs flex items-center justify-center transition-all ${
                      isCurrent
                        ? 'ring-2 ring-primary-500 ring-offset-1 bg-primary-600 text-white shadow-2xs'
                        : isAnswered
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {q.order}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-around text-[11px] text-slate-500">
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" />
                <span>Đã làm</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-slate-100 border border-slate-300" />
                <span>Chưa làm</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-primary-600" />
                <span>Đang xem</span>
              </div>
            </div>
          </Card>
        </aside>

        {/* Center: Question Workspace */}
        <section className="lg:col-span-3 order-1 lg:order-2 space-y-4">
          <Card className="p-6 sm:p-8 bg-white border-slate-200 shadow-sm">
            {/* Question Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-primary-600 uppercase tracking-wide">
                  Câu hỏi {currentQuestion.order}
                </span>
                <span className="text-xs text-slate-400">/ {questions.length}</span>
              </div>
              <Badge variant="secondary" className="font-semibold text-xs">
                {currentQuestion.points} điểm
              </Badge>
            </div>

            {/* Question Prompt */}
            <div className="mb-6">
              <MarkdownMathPreview
                content={currentQuestion.prompt}
                className="text-base text-slate-900 leading-relaxed"
              />
            </div>

            {/* Answer Controls based on Type */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              {renderQuestionInput(
                currentQuestion.type,
                currentQuestion.options,
                currentAnswer,
                (val) => handleAnswerChange(currentQuestion.snapshotId, val),
              )}
            </div>

            {/* Bottom Question Controls */}
            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Câu trước
              </Button>

              {currentIndex < questions.length - 1 ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))
                  }
                >
                  Câu tiếp theo
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsSubmitModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Kiểm tra & Nộp bài
                  <Send className="w-4 h-4 ml-1.5" />
                </Button>
              )}
            </div>
          </Card>
        </section>
      </main>

      {/* Submit Confirmation Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <Card className="max-w-md w-full p-6 shadow-xl border-slate-200">
            <div className="flex items-center gap-3 text-amber-600 mb-4">
              <div className="p-2.5 rounded-full bg-amber-50">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Xác nhận nộp bài thi</h3>
            </div>

            <div className="space-y-3 text-sm text-slate-600 mb-6">
              <p>
                Bạn đã hoàn thành{' '}
                <span className="font-bold text-slate-900">
                  {answeredCount}/{questions.length}
                </span>{' '}
                câu hỏi.
              </p>

              {answeredCount < questions.length && (
                <Alert variant="warning" className="text-xs">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>
                      Vẫn còn <strong>{questions.length - answeredCount}</strong> câu chưa có câu
                      trả lời.
                    </span>
                  </div>
                </Alert>
              )}

              <p className="text-xs text-slate-500">
                Khi đã xác nhận nộp bài, bạn sẽ không thể chỉnh sửa hoặc làm lại các câu hỏi này
                nữa.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={submitMutation.isPending}
                onClick={() => setIsSubmitModalOpen(false)}
              >
                Quay lại làm bài
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={submitMutation.isPending}
                onClick={handleForceSubmit}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {submitMutation.isPending ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-1.5" />
                    Đang nộp...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-1.5" />
                    Xác nhận nộp bài
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

function renderQuestionInput(
  type: QuestionType,
  options: Array<{ id: string; text: string; order: number }>,
  currentAnswer: LocalAnswer,
  onChange: (update: Partial<LocalAnswer>) => void,
) {
  switch (type) {
    case 'SINGLE_CHOICE':
    case 'TRUE_FALSE': {
      const selectedId = currentAnswer.selectedOptionIds?.[0] || '';
      return (
        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-500 mb-2">
            Chọn 1 phương án trả lời đúng:
          </div>
          {options.map((opt, idx) => {
            const isSelected = selectedId === opt.id;
            const letter = String.fromCharCode(65 + idx);
            return (
              <label
                key={opt.id}
                onClick={() => onChange({ selectedOptionIds: [opt.id] })}
                className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50/50 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-xs font-bold transition-colors ${
                    isSelected
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-100 text-slate-600 border border-slate-300'
                  }`}
                >
                  {letter}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <MarkdownMathPreview content={opt.text} className="text-sm text-slate-800" />
                </div>
              </label>
            );
          })}
        </div>
      );
    }

    case 'MULTIPLE_CHOICE': {
      const selectedIds = new Set(currentAnswer.selectedOptionIds || []);
      const toggleOption = (optId: string) => {
        const next = new Set(selectedIds);
        if (next.has(optId)) {
          next.delete(optId);
        } else {
          next.add(optId);
        }
        onChange({ selectedOptionIds: Array.from(next) });
      };

      return (
        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-500 mb-2">
            Chọn một hoặc nhiều phương án đúng:
          </div>
          {options.map((opt, idx) => {
            const isSelected = selectedIds.has(opt.id);
            const letter = String.fromCharCode(65 + idx);
            return (
              <label
                key={opt.id}
                onClick={() => toggleOption(opt.id)}
                className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50/50 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-md shrink-0 flex items-center justify-center text-xs font-bold transition-colors ${
                    isSelected
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-100 text-slate-600 border border-slate-300'
                  }`}
                >
                  {isSelected ? <Check className="w-4 h-4 stroke-[3]" /> : letter}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <MarkdownMathPreview content={opt.text} className="text-sm text-slate-800" />
                </div>
              </label>
            );
          })}
        </div>
      );
    }

    case 'SHORT_ANSWER': {
      return (
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700">
            Nhập câu trả lời ngắn của bạn:
          </label>
          <input
            type="text"
            value={currentAnswer.textAnswer || ''}
            onChange={(e) => onChange({ textAnswer: e.target.value })}
            placeholder="Ví dụ: Quang hợp, 100, x = 2..."
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
        </div>
      );
    }

    case 'ESSAY': {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-700">
              Nội dung bài viết tự luận:
            </label>
            <span className="text-[11px] text-slate-400">
              {(currentAnswer.textAnswer || '').length} / 10,000 ký tự
            </span>
          </div>
          <textarea
            rows={8}
            value={currentAnswer.textAnswer || ''}
            onChange={(e) => onChange({ textAnswer: e.target.value })}
            placeholder="Viết câu trả lời tự luận chi tiết tại đây..."
            maxLength={10000}
            className="w-full p-4 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 leading-relaxed font-sans"
          />
        </div>
      );
    }

    default:
      return null;
  }
}
