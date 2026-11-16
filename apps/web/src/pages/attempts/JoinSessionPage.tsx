import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileQuestion,
  GraduationCap,
  LogIn,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useJoinSessionPreview, useStartOrResumeAttempt } from '../../hooks/useAttempts';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card } from '../../components/ui/card';
import { Alert } from '../../components/ui/alert';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ExpandableDescription } from '../../components/common/ExpandableDescription';

export const JoinSessionPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCode = (searchParams.get('code') || '').trim().toUpperCase();

  const [inputCode, setInputCode] = useState(initialCode);
  const [debouncedCode, setDebouncedCode] = useState(initialCode);

  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const startMutation = useStartOrResumeAttempt();

  // Debounce cập nhật mã phòng để query
  useEffect(() => {
    const timer = setTimeout(() => {
      const clean = inputCode.trim().toUpperCase();
      setDebouncedCode(clean);
      if (clean) {
        setSearchParams({ code: clean }, { replace: true });
      } else {
        setSearchParams({}, { replace: true });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [inputCode, setSearchParams]);

  const isValidCode = /^[A-Z0-9]{6}$/.test(debouncedCode);

  const {
    data: preview,
    isLoading: isPreviewLoading,
    error: previewError,
  } = useJoinSessionPreview(debouncedCode, isAuthenticated && isValidCode);

  const handleStart = async () => {
    if (!debouncedCode) return;
    try {
      const attempt = await startMutation.mutateAsync(debouncedCode);
      navigate(`/take-test/${attempt.id}`);
    } catch {
      // Error is captured by mutation state
    }
  };

  const errorMessage =
    (axios.isAxiosError(previewError) &&
      (previewError.response?.data as { message?: string })?.message) ||
    (axios.isAxiosError(startMutation.error) &&
      (startMutation.error.response?.data as { message?: string })?.message) ||
    null;

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 sm:px-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-50 text-primary-600 mb-4 shadow-sm border border-primary-100">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Vào phòng thi bài kiểm tra
        </h1>
        <p className="mt-2 text-slate-600 text-sm sm:text-base">
          Nhập mã phòng gồm 6 ký tự được cung cấp bởi giáo viên hoặc ban tổ chức để tham gia làm
          bài.
        </p>
      </div>

      <Card className="p-6 sm:p-8 shadow-sm border-slate-200">
        <div className="mb-6">
          <label
            htmlFor="join-code-input"
            className="block text-sm font-semibold text-slate-700 mb-2"
          >
            Mã phòng thi (6 ký tự)
          </label>
          <div className="relative">
            <Input
              id="join-code-input"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="Ví dụ: ABC123"
              maxLength={6}
              className="text-center text-2xl font-mono tracking-widest uppercase font-bold py-3 h-14"
              autoFocus
            />
          </div>
          {inputCode.length > 0 && !isValidCode && (
            <p className="mt-2 text-xs text-amber-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              Mã phòng phải gồm đúng 6 ký tự chữ hoa hoặc chữ số (A-Z, 0-9).
            </p>
          )}
        </div>

        {/* Chưa đăng nhập */}
        {!isAuthLoading && !isAuthenticated && isValidCode && (
          <Alert variant="warning" className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <LogIn className="w-5 h-5 shrink-0 text-amber-600" />
                <span className="text-sm font-medium">
                  Vui lòng đăng nhập để hệ thống ghi nhận bài làm của bạn.
                </span>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() =>
                  navigate(
                    `/login?redirect=${encodeURIComponent(location.pathname + location.search)}`,
                  )
                }
              >
                Đăng nhập ngay
              </Button>
            </div>
          </Alert>
        )}

        {/* Đang tải preview */}
        {isPreviewLoading && (
          <div className="py-8 flex flex-col items-center justify-center text-slate-500">
            <LoadingSpinner size="lg" />
            <p className="mt-3 text-sm">Đang kiểm tra phòng thi...</p>
          </div>
        )}

        {/* Lỗi khi tìm phòng thi */}
        {errorMessage && (
          <Alert variant="error" className="mb-6">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div className="text-sm">{errorMessage}</div>
            </div>
          </Alert>
        )}

        {/* Thông tin phòng thi hợp lệ */}
        {preview && (
          <div className="space-y-6 pt-4 border-t border-slate-100">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-primary-600 uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                Bài kiểm tra chính thức
              </div>
              <h2 className="text-xl font-bold text-slate-900">{preview.testTitle}</h2>
              <p className="text-xs text-slate-500 mt-1">
                Người tạo đề:{' '}
                <span className="font-medium text-slate-700">{preview.authorName}</span>
              </p>
            </div>

            {preview.description && (
              <ExpandableDescription
                content={preview.description}
                collapsedMaxHeight={70}
                className="bg-slate-50/70 p-3.5 rounded-lg border border-slate-100 text-xs"
              />
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2">
              <div className="bg-slate-50 rounded-lg p-3 text-center border border-slate-100">
                <div className="flex items-center justify-center text-slate-400 mb-1">
                  <FileQuestion className="w-4 h-4" />
                </div>
                <div className="text-lg font-bold text-slate-800">{preview.totalQuestions}</div>
                <div className="text-[11px] text-slate-500">Số câu hỏi</div>
              </div>

              <div className="bg-slate-50 rounded-lg p-3 text-center border border-slate-100">
                <div className="flex items-center justify-center text-slate-400 mb-1">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="text-lg font-bold text-slate-800">
                  {preview.timeLimitMinutes ? `${preview.timeLimitMinutes}'` : 'Vô hạn'}
                </div>
                <div className="text-[11px] text-slate-500">Thời gian làm</div>
              </div>

              <div className="bg-slate-50 rounded-lg p-3 text-center border border-slate-100">
                <div className="flex items-center justify-center text-slate-400 mb-1">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div className="text-lg font-bold text-slate-800">
                  {preview.usedAttempts} / {preview.maxAttempts}
                </div>
                <div className="text-[11px] text-slate-500">Lượt đã làm</div>
              </div>

              <div className="bg-slate-50 rounded-lg p-3 text-center border border-slate-100">
                <div className="flex items-center justify-center text-slate-400 mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="text-lg font-bold text-slate-800">{preview.totalPoints}</div>
                <div className="text-[11px] text-slate-500">Tổng điểm</div>
              </div>
            </div>

            {preview.activeAttemptId ? (
              <div className="space-y-3">
                <Alert variant="default">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary-600" />
                    <span className="text-xs font-medium">
                      Bạn đang có một bài thi dở dang cho phòng thi này. Bạn có thể tiếp tục làm
                      ngay.
                    </span>
                  </div>
                </Alert>
                <Button
                  variant="primary"
                  className="w-full h-12 text-base font-semibold"
                  onClick={() => navigate(`/take-test/${preview.activeAttemptId}`)}
                >
                  Tiếp tục làm bài
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            ) : preview.canAttempt ? (
              <Button
                variant="primary"
                className="w-full h-12 text-base font-semibold"
                disabled={startMutation.isPending}
                onClick={handleStart}
              >
                {startMutation.isPending ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Đang khởi tạo bài thi...
                  </>
                ) : (
                  <>
                    Bắt đầu làm bài thi
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            ) : (
              <Alert variant="warning">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-medium">
                    {preview.reason || 'Bạn không thể bắt đầu thêm lượt làm bài mới.'}
                  </span>
                </div>
              </Alert>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};
