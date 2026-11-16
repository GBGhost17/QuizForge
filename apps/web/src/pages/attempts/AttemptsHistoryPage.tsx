import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ExternalLink, FileText, History, RotateCcw, Search } from 'lucide-react';
import { useUserAttempts } from '../../hooks/useAttempts';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import type { AttemptStatus } from '@quizforge/shared-types';

export const AttemptsHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: attempts, isLoading, error } = useUserAttempts();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAttempts = (attempts || []).filter((att) =>
    att.testTitle.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-primary-600 font-semibold text-xs uppercase tracking-wider mb-1">
            <History className="w-4 h-4" />
            Lịch sử học tập
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Lịch sử bài làm của bạn
          </h1>
          <p className="mt-1 text-slate-500 text-sm">
            Theo dõi tất cả các bài thi bạn đã tham gia và tiến độ chấm điểm.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => navigate('/join')}>
          Vào phòng thi mới
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm bài thi..."
            className="pl-9 h-10 text-sm"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center text-slate-500">
          <LoadingSpinner size="lg" />
          <p className="mt-3 text-sm">Đang tải lịch sử làm bài...</p>
        </div>
      ) : error ? (
        <Card className="p-8 text-center text-rose-600 bg-rose-50/50 border-rose-200">
          <p className="text-sm font-medium">
            Không thể tải danh sách bài làm. Vui lòng thử lại sau.
          </p>
        </Card>
      ) : filteredAttempts.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-slate-200 bg-slate-50/50">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">Chưa có bài làm nào</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm
              ? 'Không tìm thấy bài làm phù hợp với từ khóa tìm kiếm.'
              : 'Bạn chưa tham gia bất kỳ bài thi nào. Hãy nhập mã phòng thi để bắt đầu làm bài!'}
          </p>
          {!searchTerm && (
            <Button variant="primary" size="sm" className="mt-4" onClick={() => navigate('/join')}>
              Vào phòng thi ngay
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAttempts.map((att) => {
            const startedDate = new Date(att.startedAt).toLocaleString('vi-VN', {
              dateStyle: 'short',
              timeStyle: 'short',
            });

            return (
              <Card
                key={att.id}
                className="p-5 bg-white border-slate-200 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-slate-900 truncate">{att.testTitle}</h3>
                    {getStatusBadge(att.status)}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                      Lượt thi #{att.attemptNumber}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Bắt đầu: {startedDate}
                    </span>
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      Điểm:{' '}
                      {att.score !== null
                        ? `${att.score}/${att.totalPoints}`
                        : `Thang ${att.totalPoints}đ`}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {att.status === 'IN_PROGRESS' ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/take-test/${att.id}`)}
                    >
                      Tiếp tục làm bài
                      <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/attempts/${att.id}/submitted`)}
                    >
                      Xem chi tiết
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

function getStatusBadge(status: AttemptStatus) {
  switch (status) {
    case 'IN_PROGRESS':
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
          Đang làm dở
        </Badge>
      );
    case 'SUBMITTED':
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
          Đã nộp bài
        </Badge>
      );
    case 'AUTO_GRADED':
    case 'PENDING_REVIEW':
      return (
        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
          Đang chấm điểm
        </Badge>
      );
    case 'FINALIZED':
    case 'RELEASED':
      return (
        <Badge
          variant="outline"
          className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs"
        >
          Đã có kết quả
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-xs">
          {status}
        </Badge>
      );
  }
}
