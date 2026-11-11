import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  HelpCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { useQuestionBank } from '../../hooks/useQuestionBanks';
import {
  useCreateQuestion,
  useDeleteQuestion,
  useQuestions,
  useUpdateQuestion,
} from '../../hooks/useQuestions';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { MarkdownMathPreview } from '../../components/common/MarkdownMathPreview';
import { QuestionEditorModal } from '../../components/questions/QuestionEditorModal';
import type {
  CreateQuestionDto,
  Difficulty,
  Question,
  QuestionType,
} from '@quizforge/shared-types';

export function QuestionBankDetailPage() {
  const { id: bankId } = useParams<{ id: string }>();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<QuestionType | undefined>(undefined);
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | undefined>(undefined);
  const [showDifficulty, setShowDifficulty] = useState(true);
  const [page, setPage] = useState(1);

  // Modals
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deletingQuestion, setDeletingQuestion] = useState<Question | null>(null);

  const { data: bank, isLoading: isBankLoading } = useQuestionBank(bankId);

  const { data: questionsData, isLoading: isQuestionsLoading } = useQuestions(bankId, {
    q: searchTerm || undefined,
    type: typeFilter,
    difficulty: difficultyFilter,
    page,
    limit: 15,
  });

  const createQuestionMutation = useCreateQuestion(bankId || '');
  const updateQuestionMutation = useUpdateQuestion(bankId || '');
  const deleteQuestionMutation = useDeleteQuestion(bankId || '');

  const handleSaveQuestion = async (payload: CreateQuestionDto) => {
    if (editingQuestion) {
      await updateQuestionMutation.mutateAsync({
        id: editingQuestion.id,
        dto: payload,
      });
    } else {
      await createQuestionMutation.mutateAsync(payload);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!deletingQuestion) return;
    await deleteQuestionMutation.mutateAsync(deletingQuestion.id);
    setDeletingQuestion(null);
  };

  const getQuestionTypeLabel = (type: QuestionType): string => {
    switch (type) {
      case 'SINGLE_CHOICE':
        return '1 đáp án đúng';
      case 'MULTIPLE_CHOICE':
        return 'Nhiều đáp án';
      case 'TRUE_FALSE':
        return 'Đúng / Sai';
      case 'SHORT_ANSWER':
        return 'Trả lời ngắn';
      case 'ESSAY':
        return 'Tự luận';
      default:
        return type;
    }
  };

  const getDifficultyBadge = (difficulty: Difficulty) => {
    switch (difficulty) {
      case 'EASY':
        return (
          <Badge
            data-testid="difficulty-badge"
            variant="secondary"
            className="bg-emerald-50 text-emerald-700"
          >
            Dễ
          </Badge>
        );
      case 'MEDIUM':
        return (
          <Badge
            data-testid="difficulty-badge"
            variant="secondary"
            className="bg-amber-50 text-amber-700"
          >
            Trung bình
          </Badge>
        );
      case 'HARD':
        return (
          <Badge data-testid="difficulty-badge" variant="destructive">
            Khó
          </Badge>
        );
      default:
        return null;
    }
  };

  if (isBankLoading) {
    return <LoadingSpinner fullPage label="Đang tải ngân hàng câu hỏi..." />;
  }

  if (!bank) {
    return (
      <div className="space-y-4">
        <Link
          to="/question-banks"
          className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại danh sách ngân hàng
        </Link>
        <EmptyState
          icon={HelpCircle}
          title="Không tìm thấy ngân hàng câu hỏi"
          description="Ngân hàng câu hỏi không tồn tại hoặc bạn không có quyền truy cập."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link to="/question-banks" className="hover:text-slate-900 transition-colors">
          Ngân hàng câu hỏi
        </Link>
        <span>/</span>
        <span className="font-medium text-slate-900 truncate max-w-xs">{bank.title}</span>
      </div>

      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{bank.title}</h1>
            <p className="text-sm text-slate-600">
              {bank.description || 'Chưa có mô tả cho ngân hàng câu hỏi này.'}
            </p>
            <div className="flex items-center gap-2 pt-2">
              <Badge variant="secondary">Tổng số: {questionsData?.meta.total ?? 0} câu hỏi</Badge>
              {bank.isArchived && <Badge variant="outline">Đã lưu trữ</Badge>}
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <Link to={`/question-banks/${bank.id}/import`}>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5"
                title="Import Markdown"
                aria-label="Import Markdown"
              >
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Import Markdown</span>
              </Button>
            </Link>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingQuestion(null);
                setIsEditorOpen(true);
              }}
              className="flex items-center gap-1.5"
              title="Thêm câu hỏi"
              aria-label="Thêm câu hỏi"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Thêm câu hỏi</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm nội dung câu hỏi..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-600"
            />
          </div>

          <div>
            <select
              value={typeFilter || ''}
              onChange={(e) => {
                setTypeFilter((e.target.value as QuestionType) || undefined);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-600"
            >
              <option value="">Tất cả loại câu hỏi</option>
              <option value="SINGLE_CHOICE">Trắc nghiệm 1 đáp án</option>
              <option value="MULTIPLE_CHOICE">Trắc nghiệm nhiều đáp án</option>
              <option value="TRUE_FALSE">Đúng / Sai</option>
              <option value="SHORT_ANSWER">Trả lời ngắn</option>
              <option value="ESSAY">Tự luận</option>
            </select>
          </div>

          <div>
            <select
              value={difficultyFilter || ''}
              onChange={(e) => {
                setDifficultyFilter((e.target.value as Difficulty) || undefined);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-600"
            >
              <option value="">Tất cả độ khó</option>
              <option value="EASY">Dễ</option>
              <option value="MEDIUM">Trung bình</option>
              <option value="HARD">Khó</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end px-1">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-600 hover:text-slate-900 select-none">
            <input
              type="checkbox"
              checked={showDifficulty}
              onChange={(e) => setShowDifficulty(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Hiện nhãn độ khó</span>
          </label>
        </div>
      </div>

      {/* Questions List */}
      {isQuestionsLoading ? (
        <LoadingSpinner label="Đang tải danh sách câu hỏi..." />
      ) : !questionsData?.data || questionsData.data.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Chưa có câu hỏi nào"
          description={
            searchTerm || typeFilter || difficultyFilter
              ? 'Không tìm thấy câu hỏi phù hợp với bộ lọc hiện tại.'
              : 'Ngân hàng này chưa có câu hỏi. Nhấn "Thêm câu hỏi" để tạo câu hỏi đầu tiên hoặc tải lên từ tệp Markdown.'
          }
          action={
            <Button
              variant="primary"
              onClick={() => {
                setEditingQuestion(null);
                setIsEditorOpen(true);
              }}
            >
              Thêm câu hỏi ngay
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {questionsData.data.map((q, idx) => (
            <Card key={q.id} className="border-slate-200 overflow-hidden">
              <CardHeader className="py-3 px-5 bg-slate-50/70 border-b border-slate-100 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-500">
                    Câu {(page - 1) * 15 + idx + 1}
                  </span>
                  <Badge variant="outline">{getQuestionTypeLabel(q.type)}</Badge>
                  {showDifficulty && getDifficultyBadge(q.difficulty)}
                  {q.topic && (
                    <span className="text-xs font-medium text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {q.topic}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingQuestion(q);
                      setIsEditorOpen(true);
                    }}
                    title="Chỉnh sửa câu hỏi"
                  >
                    <Pencil className="h-4 w-4 text-slate-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeletingQuestion(q)}
                    title="Xóa câu hỏi"
                  >
                    <Trash2 className="h-4 w-4 text-rose-500" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-5 space-y-4">
                {/* Prompt */}
                <div className="text-base font-medium text-slate-900">
                  <MarkdownMathPreview content={q.prompt} />
                </div>

                {/* Options Presentation */}
                {(q.type === 'SINGLE_CHOICE' ||
                  q.type === 'MULTIPLE_CHOICE' ||
                  q.type === 'TRUE_FALSE') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                    {q.options.map((opt, oIdx) => (
                      <div
                        key={opt.id || oIdx}
                        className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-sm ${
                          opt.isCorrect
                            ? 'border-emerald-300 bg-emerald-50/60 font-medium text-emerald-900'
                            : 'border-slate-200 bg-white text-slate-700'
                        }`}
                      >
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            opt.isCorrect
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span className="flex-1">
                          <MarkdownMathPreview content={opt.text} />
                        </span>
                        {opt.isCorrect && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Short Answer Variants */}
                {q.type === 'SHORT_ANSWER' && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs space-y-1">
                    <span className="font-semibold text-slate-700">Đáp án chấp nhận:</span>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {(q.rubric?.acceptedAnswers || q.options.map((o) => o.text)).map(
                        (ans, aIdx) => (
                          <span
                            key={aIdx}
                            className="bg-white px-2 py-1 rounded border border-slate-300 font-mono text-emerald-700 font-semibold"
                          >
                            {ans}
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                )}

                {/* Essay Model Answer & Rubric */}
                {q.type === 'ESSAY' && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2 text-xs">
                    {q.rubric?.modelAnswer && (
                      <div>
                        <span className="font-semibold text-slate-700 block mb-1">
                          Gợi ý / Đáp án mẫu:
                        </span>
                        <MarkdownMathPreview content={q.rubric.modelAnswer} className="text-xs" />
                      </div>
                    )}
                    {q.rubric?.criteria && q.rubric.criteria.length > 0 && (
                      <div className="pt-1 border-t border-slate-200">
                        <span className="font-semibold text-slate-700">
                          Tiêu chí chấm (Rubric):
                        </span>
                        <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-600">
                          {q.rubric.criteria.map((c, cIdx) => (
                            <li key={cIdx}>
                              {c.description}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Explanation */}
                {q.explanation && (
                  <div className="text-xs text-slate-700 bg-amber-50/50 rounded-lg p-2.5 border border-amber-200/50 space-y-1">
                    <span className="font-semibold text-amber-800 block">Lời giải chi tiết:</span>
                    <MarkdownMathPreview content={q.explanation} className="text-xs" />
                  </div>
                )}

                {/* Tags */}
                {q.tags && q.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {q.tags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          {questionsData.meta.totalPages > 1 && (
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
                Trang {questionsData.meta.page} / {questionsData.meta.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(questionsData.meta.totalPages, p + 1))}
                disabled={page >= questionsData.meta.totalPages}
              >
                Trang sau
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Modal: Question Editor */}
      <QuestionEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSubmit={handleSaveQuestion}
        questionToEdit={editingQuestion}
        isLoading={createQuestionMutation.isPending || updateQuestionMutation.isPending}
      />

      {/* Modal: Delete Confirmation */}
      {deletingQuestion && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Xác nhận xóa câu hỏi</h3>
            <p className="mt-2 text-sm text-slate-600">
              Bạn có chắc chắn muốn xóa câu hỏi này? Nếu câu hỏi đã nằm trong đề thi đã phát hành,
              hệ thống sẽ lưu trữ câu hỏi để không ảnh hưởng đến lịch sử bài làm của thí sinh.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDeletingQuestion(null)}
                disabled={deleteQuestionMutation.isPending}
              >
                Hủy bỏ
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteQuestion}
                isLoading={deleteQuestionMutation.isPending}
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
