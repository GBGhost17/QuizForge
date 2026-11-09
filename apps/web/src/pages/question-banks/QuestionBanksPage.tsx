import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, BookOpen, FolderOpen, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import {
  useCreateQuestionBank,
  useDeleteQuestionBank,
  useQuestionBanks,
  useUpdateQuestionBank,
} from '../../hooks/useQuestionBanks';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { QuestionBankModal } from '../../components/question-banks/QuestionBankModal';
import type { QuestionBank } from '@quizforge/shared-types';

export function QuestionBanksPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isArchivedFilter, setIsArchivedFilter] = useState<boolean | undefined>(false);
  const [page, setPage] = useState(1);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<QuestionBank | null>(null);
  const [deletingBank, setDeletingBank] = useState<QuestionBank | null>(null);

  const { data, isLoading } = useQuestionBanks({
    q: searchTerm || undefined,
    isArchived: isArchivedFilter,
    page,
    limit: 9,
  });

  const createMutation = useCreateQuestionBank();
  const updateMutation = useUpdateQuestionBank();
  const deleteMutation = useDeleteQuestionBank();

  const handleCreateOrUpdate = async (values: { title: string; description?: string }) => {
    if (editingBank) {
      await updateMutation.mutateAsync({
        id: editingBank.id,
        dto: values,
      });
    } else {
      await createMutation.mutateAsync(values);
    }
  };

  const handleDelete = async () => {
    if (!deletingBank) return;
    await deleteMutation.mutateAsync(deletingBank.id);
    setDeletingBank(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Ngân hàng câu hỏi</h1>
          <p className="mt-1 text-sm text-slate-500">
            Quản lý, phân loại và biên tập kho câu hỏi độc lập dùng để tạo đề thi.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditingBank(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 self-start sm:self-auto"
          title="Tạo ngân hàng mới"
          aria-label="Tạo ngân hàng mới"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Tạo ngân hàng mới</span>
          <span className="sm:hidden">Tạo mới</span>
        </Button>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tiêu đề hoặc mô tả..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={isArchivedFilter === false ? 'primary' : 'outline'}
            size="sm"
            onClick={() => {
              setIsArchivedFilter(false);
              setPage(1);
            }}
          >
            Đang hoạt động
          </Button>
          <Button
            type="button"
            variant={isArchivedFilter === true ? 'primary' : 'outline'}
            size="sm"
            onClick={() => {
              setIsArchivedFilter(true);
              setPage(1);
            }}
          >
            Đã lưu trữ
          </Button>
        </div>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <LoadingSpinner label="Đang tải danh sách ngân hàng câu hỏi..." />
      ) : !data?.data || data.data.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="Chưa có ngân hàng câu hỏi nào"
          description={
            searchTerm
              ? 'Không tìm thấy ngân hàng câu hỏi phù hợp với từ khóa tìm kiếm.'
              : 'Hãy bắt đầu tạo ngân hàng câu hỏi đầu tiên để lưu trữ các câu hỏi trắc nghiệm và tự luận.'
          }
          action={
            searchTerm ? (
              <Button variant="outline" onClick={() => setSearchTerm('')}>
                Xóa bộ lọc
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={() => {
                  setEditingBank(null);
                  setIsModalOpen(true);
                }}
              >
                Tạo ngân hàng ngay
              </Button>
            )
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.data.map((bank) => (
              <Card
                key={bank.id}
                className="flex flex-col justify-between hover:shadow-md transition-shadow border-slate-200"
              >
                <CardHeader className="space-y-1.5 pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-lg font-bold text-slate-900 line-clamp-1">
                      {bank.title}
                    </CardTitle>
                    {bank.isArchived && (
                      <Badge variant="outline" className="text-amber-700 bg-amber-50 shrink-0">
                        <Archive className="h-3 w-3 mr-1 inline" /> Đã lưu trữ
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    Tạo ngày: {new Date(bank.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                </CardHeader>

                <CardContent className="py-2 flex-1">
                  <p className="text-sm text-slate-600 line-clamp-2 min-h-10">
                    {bank.description || 'Chưa có mô tả chi tiết cho ngân hàng này.'}
                  </p>

                  <div className="mt-4 flex items-center gap-2">
                    <Badge variant="secondary" className="flex items-center gap-1.5 py-1">
                      <BookOpen className="h-3.5 w-3.5" />
                      <span>{bank._count?.questions ?? 0} câu hỏi</span>
                    </Badge>
                  </div>
                </CardContent>

                <CardFooter className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/question-banks/${bank.id}`)}
                    className="flex-1 mr-2 font-medium"
                    title="Xem danh sách câu hỏi"
                    aria-label={`Xem câu hỏi ${bank.title}`}
                  >
                    <BookOpen className="h-4 w-4 sm:mr-1.5" />
                    <span className="hidden sm:inline">Xem câu hỏi</span>
                    <span className="sm:hidden">Chi tiết</span>
                  </Button>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingBank(bank);
                        setIsModalOpen(true);
                      }}
                      title="Chỉnh sửa thông tin"
                      aria-label={`Sửa ${bank.title}`}
                    >
                      <Pencil className="h-4 w-4 text-slate-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingBank(bank)}
                      title="Xóa ngân hàng"
                      aria-label={`Xóa ${bank.title}`}
                    >
                      <Trash2 className="h-4 w-4 text-rose-500" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {data.meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Trang trước
              </Button>
              <span className="text-sm text-slate-600 font-medium px-2">
                Trang {data.meta.page} / {data.meta.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))}
                disabled={page >= data.meta.totalPages}
              >
                Trang sau
              </Button>
            </div>
          )}
        </>
      )}

      {/* Modal: Create / Edit Question Bank */}
      <QuestionBankModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        bankToEdit={editingBank}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Modal: Delete Confirmation */}
      {deletingBank && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Xác nhận xóa ngân hàng câu hỏi</h3>
            <p className="mt-2 text-sm text-slate-600">
              Bạn có chắc chắn muốn xóa ngân hàng{' '}
              <span className="font-semibold text-slate-900">"{deletingBank.title}"</span>? Nếu các
              câu hỏi đã được sử dụng trong các đề thi đã phát hành, hệ thống sẽ tự động chuyển sang
              trạng thái lưu trữ (archive) để bảo toàn tính toàn vẹn dữ liệu.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDeletingBank(null)}
                disabled={deleteMutation.isPending}
              >
                Hủy bỏ
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                isLoading={deleteMutation.isPending}
              >
                Đồng ý xóa
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
