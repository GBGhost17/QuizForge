import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle,
  FilePlus2,
  FolderPlus,
  GraduationCap,
  KeyRound,
  Sparkles,
  Upload,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useUIStore } from '../stores/ui.store';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { EmptyState } from '../components/common/EmptyState';
import { Badge } from '../components/ui/badge';

export function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const { activeRole } = useUIStore();
  const [joinCode, setJoinCode] = useState('');
  const navigate = useNavigate();

  const handleJoinTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim()) {
      navigate(`/join?code=${encodeURIComponent(joinCode.trim().toUpperCase())}`);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Header */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 p-6 sm:p-8 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-indigo-200">
                {activeRole === 'creator' ? 'Bàn làm việc Giáo viên' : 'Góc học tập Học sinh'}
              </span>
              <Badge variant="secondary" className="bg-white/20 text-white border-none text-[11px]">
                {activeRole === 'creator' ? 'Creator' : 'Participant'}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Xin chào, {isAuthenticated && user ? user.name : 'bạn'}! 👋
            </h1>
            <p className="text-sm sm:text-base text-indigo-100 max-w-xl">
              {activeRole === 'creator'
                ? 'Quản lý ngân hàng câu hỏi, biên soạn đề thi chuẩn và chấm bài nhanh chóng.'
                : 'Tham gia các bài kiểm tra trực tuyến, xem kết quả và tự luyện tập nâng cao kiến thức.'}
            </p>
          </div>

          {!isAuthenticated && (
            <div className="flex items-center space-x-2 shrink-0">
              <Link to="/login">
                <Button variant="secondary" size="md">
                  Đăng nhập
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-white text-indigo-700 hover:bg-indigo-50" size="md">
                  Đăng ký miễn phí
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mode-Specific Content */}
      {activeRole === 'creator' ? (
        <div className="space-y-6">
          {/* Quick Actions for Creator */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="hover:border-indigo-300 transition-colors cursor-pointer group">
              <CardHeader className="p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 mb-2 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <FolderPlus className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">Ngân hàng câu hỏi</CardTitle>
                <CardDescription className="text-xs">
                  Tạo và phân loại câu hỏi theo chủ đề, độ khó
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:border-indigo-300 transition-colors cursor-pointer group">
              <CardHeader className="p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 mb-2 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <FilePlus2 className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">Tạo đề thi mới</CardTitle>
                <CardDescription className="text-xs">
                  Biên soạn đề thi trắc nghiệm, tự luận với snapshot bất biến
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:border-indigo-300 transition-colors cursor-pointer group">
              <CardHeader className="p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 mb-2 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Upload className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">Import Markdown</CardTitle>
                <CardDescription className="text-xs">
                  Nhập nhanh hàng chục câu hỏi từ tệp văn bản .md
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Empty State for Question Banks */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">Đề thi của bạn</h2>
            <EmptyState
              title="Chưa có bài thi nào được khởi tạo"
              description="Hãy bắt đầu tạo ngân hàng câu hỏi hoặc soạn một đề kiểm tra đầu tiên để gửi cho học sinh của bạn."
              actionText="Tạo ngân hàng câu hỏi đầu tiên"
              onAction={() => navigate('/question-banks')}
              icon={<BookOpen className="h-6 w-6 text-indigo-600" />}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Join Test Box for Participant */}
          <Card className="border-indigo-100 bg-gradient-to-b from-white to-indigo-50/30 shadow-xs">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <KeyRound className="h-5 w-5 text-indigo-600" />
                <span>Tham gia bài thi ngay</span>
              </CardTitle>
              <CardDescription>
                Nhập mã tham gia gồm 6-8 ký tự do giáo viên cung cấp để vào phòng thi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoinTest} className="flex flex-col sm:flex-row gap-3 max-w-md">
                <Input
                  placeholder="Ví dụ: QUIZ101"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="font-mono uppercase tracking-wider text-base font-semibold"
                />
                <Button type="submit" variant="primary" size="md" className="shrink-0">
                  Vào thi
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Quick Actions for Participant */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="hover:border-indigo-300 transition-colors cursor-pointer group">
              <CardHeader className="p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-2 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">Lịch sử bài nộp</CardTitle>
                <CardDescription className="text-xs">
                  Xem điểm số, đáp án và nhận xét bài thi đã hoàn thành
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:border-indigo-300 transition-colors cursor-pointer group">
              <CardHeader className="p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 mb-2 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <Sparkles className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">Chế độ tự luyện tập</CardTitle>
                <CardDescription className="text-xs">
                  Luyện làm lại các câu sai và xem giải thích chi tiết
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Empty State for Participant Attempts */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">Bài thi gần đây</h2>
            <EmptyState
              title="Bạn chưa tham gia bài thi nào"
              description="Khi bạn nhập mã tham gia và hoàn thành bài kiểm tra, lịch sử và điểm số của bạn sẽ được lưu tại đây."
              icon={<GraduationCap className="h-6 w-6 text-indigo-600" />}
            />
          </div>
        </div>
      )}
    </div>
  );
}
