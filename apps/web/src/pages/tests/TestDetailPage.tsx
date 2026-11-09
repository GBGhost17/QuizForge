import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Ban,
  Check,
  CheckCircle,
  Clock,
  Copy,
  Edit3,
  FileCheck,
  HelpCircle,
  Lock,
  QrCode,
  Send,
  Share2,
  Sparkles,
  Users,
} from 'lucide-react';
import { useCloseTest, usePublishTest, useTest } from '../../hooks/useTests';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { MarkdownMathPreview } from '../../components/common/MarkdownMathPreview';
import { QRCodeModal } from '../../components/tests/QRCodeModal';
import type { QuestionOption } from '@quizforge/shared-types';

export function TestDetailPage() {
  const { id: testId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: test, isLoading, error } = useTest(testId);
  const version = test?.versions?.[0];
  const session = version?.sessions?.[0];
  const snapshots = version?.questionSnapshots || [];

  const [copiedType, setCopiedType] = useState<'code' | 'link' | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  const publishMutation = usePublishTest();
  const closeMutation = useCloseTest();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">
        Đang tải thông tin đề thi...
      </div>
    );
  }

  if (error || !test || !version) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-600 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
        <h2 className="text-lg font-bold">Không tìm thấy đề thi</h2>
        <p className="mt-2 text-sm">Đề thi không tồn tại hoặc bạn không có quyền xem.</p>
        <Button onClick={() => navigate('/tests')} className="mt-4">
          Quay lại danh sách đề thi
        </Button>
      </div>
    );
  }

  const isPublished = test.status === 'PUBLISHED';
  const isDraft = test.status === 'DRAFT';
  const isClosed = test.status === 'CLOSED';

  const handleCopyCode = () => {
    if (!session?.joinCode) return;
    navigator.clipboard.writeText(session.joinCode);
    setCopiedType('code');
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleCopyLink = () => {
    if (!session?.joinCode) return;
    const link = `${window.location.origin}/join?code=${session.joinCode}`;
    navigator.clipboard.writeText(link);
    setCopiedType('link');
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handlePublish = async () => {
    if (snapshots.length === 0) {
      alert('Đề thi phải có ít nhất 1 câu hỏi để xuất bản');
      return;
    }

    try {
      await publishMutation.mutateAsync({ testId: test.id });
      setIsPublishModalOpen(false);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      alert(errorObj?.response?.data?.message || errorObj?.message || 'Có lỗi xảy ra khi xuất bản');
    }
  };

  const handleCloseTest = async () => {
    try {
      await closeMutation.mutateAsync(test.id);
      setIsCloseModalOpen(false);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      alert(
        errorObj?.response?.data?.message || errorObj?.message || 'Có lỗi xảy ra khi đóng đề thi',
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header - Bỏ nút back thừa, giữ tiêu đề và hành động cốt lõi */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{test.title}</h1>
            <Badge
              variant={
                isPublished
                  ? 'success'
                  : isClosed
                    ? 'destructive'
                    : isDraft
                      ? 'secondary'
                      : 'outline'
              }
            >
              {isPublished
                ? 'Đang mở (Đã xuất bản)'
                : isClosed
                  ? 'Đã đóng'
                  : isDraft
                    ? 'Bản nháp'
                    : test.status}
            </Badge>
          </div>
          {test.description && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{test.description}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isDraft && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/tests/${test.id}/edit`)}
                className="flex items-center gap-1.5"
              >
                <Edit3 className="h-4 w-4" /> Soạn đề
              </Button>
              <Button
                size="sm"
                onClick={() => setIsPublishModalOpen(true)}
                disabled={snapshots.length === 0}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Send className="h-4 w-4" /> Xuất bản
              </Button>
            </>
          )}

          {isPublished && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsQRModalOpen(true)}
                className="flex items-center gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950/30"
              >
                <QrCode className="h-4 w-4" /> Tạo mã QR
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsCloseModalOpen(true)}
                className="flex items-center gap-1.5"
              >
                <Ban className="h-4 w-4" /> Đóng bài kiểm tra
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Closed Test Notice */}
      {isClosed && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
          <div>
            <strong>Bài kiểm tra đã đóng:</strong> Người ra đề đã kết thúc bài thi này. Thí sinh
            không thể vào phòng hoặc nộp bài nữa.
          </div>
        </div>
      )}

      {/* Join Code Callout if Published */}
      {isPublished && session?.joinCode && (
        <Card className="border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50 shadow-sm dark:border-emerald-900 dark:from-emerald-950/30 dark:to-teal-950/20">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  <CheckCircle className="h-4 w-4 text-emerald-600" /> Đề thi đang mở • Mã phòng thi
                  chính thức
                </span>
                <div className="flex items-center gap-3">
                  <div className="font-mono text-3xl font-extrabold tracking-widest text-emerald-950 dark:text-emerald-100">
                    {session.joinCode}
                  </div>
                  <Badge variant="outline" className="border-emerald-500 text-emerald-700">
                    {session.status}
                  </Badge>
                </div>
                <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80">
                  Cung cấp mã này hoặc gửi mã QR cho học sinh/thí sinh để vào làm bài.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  onClick={() => setIsQRModalOpen(true)}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <QrCode className="h-4 w-4" /> Tạo mã QR
                </Button>

                <Button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {copiedType === 'code' ? (
                    <>
                      <Check className="h-4 w-4" /> Đã chép mã
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" /> Sao chép mã
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 border-emerald-300 bg-white hover:bg-emerald-50 dark:border-emerald-800 dark:bg-slate-900"
                >
                  {copiedType === 'link' ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-600" /> Đã chép link
                    </>
                  ) : (
                    <>
                      <Share2 className="h-4 w-4" /> Sao chép link vào thi
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Meta Specs Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <FileCheck className="h-4 w-4 text-indigo-500" /> Tổng số câu hỏi
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
            {snapshots.length} câu
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <Sparkles className="h-4 w-4 text-amber-500" /> Tổng điểm
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
            {version.totalPoints.toFixed(1)} điểm
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <Clock className="h-4 w-4 text-emerald-500" /> Thời gian làm bài
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
            {version.timeLimitMinutes ? `${version.timeLimitMinutes} phút` : 'Không giới hạn'}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <Users className="h-4 w-4 text-sky-500" /> Lượt làm tối đa
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
            {version.maxAttempts} lần
          </div>
        </Card>
      </div>

      {/* Instructions & Guidelines if available */}
      {test.instructions && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Hướng dẫn làm bài
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 dark:text-slate-300">
            <MarkdownMathPreview content={test.instructions} />
          </CardContent>
        </Card>
      )}

      {/* Snapshot Questions List (Bản hiển thị KaTeX + Markdown đẹp) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Nội dung câu hỏi ({snapshots.length})
          </h2>
          {(isPublished || isClosed) && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Lock className="h-3.5 w-3.5 text-amber-500" /> Snapshot đã đóng băng bất biến
            </span>
          )}
        </div>

        {snapshots.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-400">
            Chưa có câu hỏi nào trong đề thi này.
          </div>
        ) : (
          <div className="space-y-4">
            {snapshots.map((snap) => {
              const options = Array.isArray(snap.options) ? snap.options : [];

              return (
                <Card key={snap.id}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2 bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                        {snap.order}
                      </span>
                      <Badge variant="outline">{snap.type}</Badge>
                    </div>
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      {snap.points} điểm
                    </span>
                  </CardHeader>

                  <CardContent className="p-4 space-y-3">
                    {/* Render KaTeX + Markdown công thức toán đẹp mắt */}
                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                      <MarkdownMathPreview content={snap.prompt} />
                    </div>

                    {options.length > 0 && (
                      <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-2">
                        {(options as QuestionOption[]).map((opt, optIdx: number) => {
                          const optLetter = String.fromCharCode(65 + optIdx);
                          return (
                            <div
                              key={opt.id || optIdx}
                              className={`flex items-start gap-2 rounded-md border p-2.5 text-xs ${
                                opt.isCorrect
                                  ? 'border-emerald-300 bg-emerald-50/70 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 font-medium'
                                  : 'border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                              }`}
                            >
                              <span className="font-bold shrink-0">{optLetter}.</span>
                              <div className="flex-1 min-w-0">
                                <MarkdownMathPreview content={opt.text} />
                              </div>
                              {opt.isCorrect && (
                                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {snap.explanation && (
                      <div className="rounded-md bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-300 flex items-start gap-2">
                        <HelpCircle className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <strong className="text-indigo-600 dark:text-indigo-400">
                            Giải thích chi tiết:
                          </strong>
                          <div className="mt-1">
                            <MarkdownMathPreview content={snap.explanation} />
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {session?.joinCode && (
        <QRCodeModal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          testTitle={test.title}
          joinCode={session.joinCode}
        />
      )}

      {/* Publish Confirmation Modal */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Xác nhận Xuất bản Đề thi
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Khi xuất bản, hệ thống sẽ{' '}
              <strong>đóng băng toàn bộ {snapshots.length} câu hỏi</strong> vào bản ghi snapshot bất
              biến và sinh mã phòng thi (Join Code) 6 ký tự để thí sinh tham gia.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsPublishModalOpen(false)}
                disabled={publishMutation.isPending}
              >
                Hủy
              </Button>
              <Button
                onClick={handlePublish}
                disabled={publishMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {publishMutation.isPending ? 'Đang xuất bản...' : 'Xác nhận xuất bản'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Close Test Confirmation Modal */}
      {isCloseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Xác nhận Đóng Bài kiểm tra
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Bạn có chắc chắn muốn <strong>kết thúc và đóng bài kiểm tra</strong> này không? Thí
              sinh sẽ không thể vào phòng thi hoặc nộp bài sau khi đóng.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsCloseModalOpen(false)}
                disabled={closeMutation.isPending}
              >
                Hủy
              </Button>
              <Button
                variant="destructive"
                onClick={handleCloseTest}
                disabled={closeMutation.isPending}
              >
                {closeMutation.isPending ? 'Đang đóng...' : 'Xác nhận đóng đề thi'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
