import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Clock, FileCheck, Home, RotateCcw, ShieldCheck } from 'lucide-react';
import { useAttemptDetail } from '../../hooks/useAttempts';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const AttemptSubmittedPage: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  const { data: attempt, isLoading } = useAttemptDetail(attemptId);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-slate-500">
        <LoadingSpinner size="lg" />
        <p className="mt-3 text-sm">Đang tải kết quả nộp bài...</p>
      </div>
    );
  }

  const submittedAtFormatted = attempt?.submittedAt
    ? new Date(attempt.submittedAt).toLocaleString('vi-VN', {
        dateStyle: 'medium',
        timeStyle: 'medium',
      })
    : new Date().toLocaleString('vi-VN');

  return (
    <div className="max-w-xl mx-auto py-12 px-4 sm:px-6">
      <Card className="p-8 text-center bg-white border-slate-200 shadow-sm">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mb-5 border border-emerald-100 shadow-xs animate-in zoom-in-75">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Nộp bài thi thành công!
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Bài làm của bạn đã được hệ thống QuizForge ghi nhận và khóa an toàn.
        </p>

        {attempt && (
          <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-100 text-left space-y-2.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
              <span className="text-slate-500">Bài kiểm tra:</span>
              <span className="font-bold text-slate-800 text-sm">{attempt.title}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                Lượt làm bài:
              </span>
              <span className="font-semibold text-slate-700">Lượt #{attempt.attemptNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Thời điểm nộp bài:
              </span>
              <span className="font-semibold text-slate-700">{submittedAtFormatted}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-slate-400" />
                Số câu hỏi trong đề:
              </span>
              <span className="font-semibold text-slate-700">{attempt.questions.length} câu</span>
            </div>
          </div>
        )}

        <div className="mt-6 p-3.5 rounded-lg bg-primary-50/60 border border-primary-100 flex items-start gap-2.5 text-left">
          <ShieldCheck className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
          <p className="text-xs text-primary-900 leading-relaxed">
            Kết quả bài làm và điểm số sẽ được công bố theo chính sách phát hành kết quả của bài
            thi. Bạn có thể theo dõi tiến độ chấm thi trong mục Lịch sử làm bài.
          </p>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => navigate('/attempts')}
          >
            <FileCheck className="w-4 h-4 mr-2" />
            Xem lịch sử làm bài
          </Button>
          <Button variant="primary" className="w-full sm:w-auto" onClick={() => navigate('/')}>
            <Home className="w-4 h-4 mr-2" />
            Về trang chủ
          </Button>
        </div>
      </Card>
    </div>
  );
};
