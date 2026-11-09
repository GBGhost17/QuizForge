import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  Clock,
  Copy,
  Edit3,
  ExternalLink,
  FileCheck,
  FileText,
  Filter,
  Plus,
  QrCode,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useCreateTest, useDeleteTest, useTests } from '../../hooks/useTests';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { CreateTestModal } from '../../components/tests/CreateTestModal';
import { QRCodeModal } from '../../components/tests/QRCodeModal';
import type { CreateTestDto, Test, TestStatus } from '@quizforge/shared-types';

export function TestsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TestStatus | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [deletingTest, setDeletingTest] = useState<Test | null>(null);
  const [qrModalData, setQrModalData] = useState<{ title: string; joinCode: string } | null>(null);

  const { data, isLoading } = useTests({
    q: searchTerm || undefined,
    status: statusFilter,
    page,
    limit: 12,
  });

  const createMutation = useCreateTest();
  const deleteMutation = useDeleteTest();

  const handleCreate = async (values: CreateTestDto) => {
    const created = await createMutation.mutateAsync(values);
    setIsCreateModalOpen(false);
    navigate(`/tests/${created.id}/edit`);
  };

  const handleDelete = async () => {
    if (!deletingTest) return;
    await deleteMutation.mutateAsync(deletingTest.id);
    setDeletingTest(null);
  };

  const handleCopyJoinCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const tests = data?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Quản lý Đề thi & Xuất bản
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Tạo đề thi mới, chọn câu hỏi từ ngân hàng cá nhân, đóng băng snapshot và cấp mã phòng
            thi.
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" /> Tạo đề thi mới
        </Button>
      </div>

      {/* Toolbar: Filter & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tiêu đề đề thi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={statusFilter || ''}
            onChange={(e) => setStatusFilter((e.target.value as TestStatus) || undefined)}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="DRAFT">Bản nháp (DRAFT)</option>
            <option value="PUBLISHED">Đã xuất bản (PUBLISHED)</option>
            <option value="CLOSED">Đã đóng (CLOSED)</option>
            <option value="ARCHIVED">Lưu trữ (ARCHIVED)</option>
          </select>
        </div>
      </div>

      {/* Test List */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center text-sm text-slate-400">
          Đang tải danh sách đề thi...
        </div>
      ) : tests.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
          <FileText className="h-12 w-12 text-slate-400" />
          <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-white">
            Chưa có đề thi nào
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Bắt đầu tạo đề thi đầu tiên bằng cách chọn câu hỏi từ ngân hàng câu hỏi của bạn.
          </p>
          <Button onClick={() => setIsCreateModalOpen(true)} className="mt-4">
            Tạo đề thi mới
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tests.map((test) => {
            const version = test.versions?.[0];
            const session = version?.sessions?.[0];
            const isDraft = test.status === 'DRAFT';
            const isPublished = test.status === 'PUBLISHED';
            const isClosed = test.status === 'CLOSED';
            const questionsCount = version?.questionSnapshots?.length ?? 0;
            const totalPoints = version?.totalPoints ?? 0;

            return (
              <Card
                key={test.id}
                className="flex flex-col justify-between transition-shadow hover:shadow-md"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle
                      className="cursor-pointer text-lg font-bold text-slate-900 hover:text-indigo-600 line-clamp-1 dark:text-white dark:hover:text-indigo-400"
                      onClick={() => navigate(`/tests/${test.id}`)}
                    >
                      {test.title}
                    </CardTitle>
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
                        ? 'Đã xuất bản'
                        : isClosed
                          ? 'Đã đóng'
                          : isDraft
                            ? 'Bản nháp'
                            : test.status}
                    </Badge>
                  </div>
                  {test.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 dark:text-slate-400">
                      {test.description}
                    </p>
                  )}
                </CardHeader>

                <CardContent className="space-y-3 pb-3 text-xs text-slate-600 dark:text-slate-300">
                  <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/60">
                    <div className="flex items-center gap-1.5">
                      <FileCheck className="h-4 w-4 text-indigo-500" />
                      <span>
                        <strong>{questionsCount}</strong> câu hỏi
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      <span>
                        <strong>{totalPoints}</strong> điểm
                      </span>
                    </div>
                    {version?.timeLimitMinutes && (
                      <div className="flex items-center gap-1.5 col-span-2">
                        <Clock className="h-4 w-4 text-emerald-500" />
                        <span>
                          Thời gian: <strong>{version.timeLimitMinutes}</strong> phút
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Join code display if published */}
                  {isPublished && session?.joinCode && (
                    <div className="flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50/70 p-2 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-emerald-700 dark:text-emerald-400">
                          Mã phòng thi
                        </span>
                        <div className="font-mono text-base font-bold tracking-wider text-emerald-900 dark:text-emerald-200">
                          {session.joinCode}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (session.joinCode) {
                              setQrModalData({ title: test.title, joinCode: session.joinCode });
                            }
                          }}
                          className="h-8 px-2 text-indigo-700 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
                        >
                          <span className="flex items-center gap-1 text-xs">
                            <QrCode className="h-3.5 w-3.5" /> Mã QR
                          </span>
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (session.joinCode) {
                              handleCopyJoinCode(session.joinCode);
                            }
                          }}
                          className="h-8 px-2 text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-900/40"
                        >
                          {copiedCode === session.joinCode ? (
                            <span className="flex items-center gap-1 text-xs">
                              <Check className="h-3.5 w-3.5 text-emerald-600" /> Đã chép
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs">
                              <Copy className="h-3.5 w-3.5" /> Chép mã
                            </span>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="flex items-center justify-between border-t pt-3 dark:border-slate-800">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/tests/${test.id}`)}
                      className="text-xs"
                    >
                      <ExternalLink className="mr-1 h-3.5 w-3.5" /> Chi tiết
                    </Button>
                    {isDraft && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/tests/${test.id}/edit`)}
                        className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                      >
                        <Edit3 className="mr-1 h-3.5 w-3.5" /> Soạn đề
                      </Button>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeletingTest(test)}
                    className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {data && data.meta.totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Trang trước
          </Button>
          <span className="flex items-center px-3 text-sm text-slate-600 dark:text-slate-400">
            Trang {page} / {data.meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))}
            disabled={page === data.meta.totalPages}
          >
            Trang sau
          </Button>
        </div>
      )}

      {/* Create Modal */}
      <CreateTestModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
        isLoading={createMutation.isPending}
      />

      {/* QR Code Modal */}
      {qrModalData && (
        <QRCodeModal
          isOpen={Boolean(qrModalData)}
          onClose={() => setQrModalData(null)}
          testTitle={qrModalData.title}
          joinCode={qrModalData.joinCode}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Xác nhận xóa đề thi
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Bạn có chắc chắn muốn xóa đề thi <strong>"{deletingTest.title}"</strong> không? Hành
              động này không thể hoàn tác.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDeletingTest(null)}
                disabled={deleteMutation.isPending}
              >
                Hủy
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Đang xóa...' : 'Xác nhận xóa'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
