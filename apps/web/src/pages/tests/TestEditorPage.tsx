import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUp,
  Check,
  CheckCircle,
  Eye,
  Plus,
  Save,
  Send,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  useAddQuestionsBatch,
  usePublishTest,
  useRemoveQuestionFromTest,
  useReorderQuestions,
  useTest,
  useUpdateTest,
} from '../../hooks/useTests';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { QuestionPickerModal } from '../../components/tests/QuestionPickerModal';
import { MarkdownMathPreview } from '../../components/common/MarkdownMathPreview';
import type { QuestionOption, ResultReleaseMode, TestMode } from '@quizforge/shared-types';

export function TestEditorPage() {
  const { id: testId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: test, isLoading, error } = useTest(testId);
  const version = test?.versions?.[0];
  const snapshots = version?.questionSnapshots || [];

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [mode, setMode] = useState<TestMode>('ASSIGNMENT');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number | undefined>(undefined);
  const [maxAttempts, setMaxAttempts] = useState<number>(1);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [releaseMode, setReleaseMode] = useState<ResultReleaseMode>('ON_FINALIZATION');
  const [passScore, setPassScore] = useState<number | undefined>(undefined);

  // Snapshot points inline edit state
  const [pointsMap, setPointsMap] = useState<Record<string, number>>({});

  // Modals
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Mutations
  const updateMutation = useUpdateTest();
  const addBatchMutation = useAddQuestionsBatch();
  const removeQuestionMutation = useRemoveQuestionFromTest();
  const reorderMutation = useReorderQuestions();
  const publishMutation = usePublishTest();

  // Đồng bộ state khi tải dữ liệu đề thi
  useEffect(() => {
    if (test && version) {
      setTitle(test.title || '');
      setDescription(test.description || '');
      setInstructions(test.instructions || '');
      setMode(test.mode || 'ASSIGNMENT');
      setTimeLimitMinutes(version.timeLimitMinutes ?? undefined);
      setMaxAttempts(version.maxAttempts ?? 1);
      setShuffleQuestions(version.shuffleQuestions ?? false);
      setShuffleOptions(version.shuffleOptions ?? false);
      setReleaseMode(version.releaseMode || 'ON_FINALIZATION');
      setPassScore(version.passScore ?? undefined);

      const pMap: Record<string, number> = {};
      version.questionSnapshots?.forEach((s) => {
        pMap[s.id] = s.points;
      });
      setPointsMap(pMap);
    }
  }, [test, version]);

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
        <p className="mt-2 text-sm">Đề thi không tồn tại hoặc bạn không có quyền truy cập.</p>
        <Button onClick={() => navigate('/tests')} className="mt-4">
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  const isPublished = test.status === 'PUBLISHED';

  const handleSaveConfig = async () => {
    try {
      await updateMutation.mutateAsync({
        id: test.id,
        dto: {
          title: title.trim(),
          description: description.trim() || undefined,
          instructions: instructions.trim() || undefined,
          mode,
          timeLimitMinutes: timeLimitMinutes ? Number(timeLimitMinutes) : undefined,
          maxAttempts: Number(maxAttempts) || 1,
          shuffleQuestions,
          shuffleOptions,
          releaseMode,
          passScore: passScore !== undefined ? Number(passScore) : undefined,
        },
      });
      setSaveSuccessMessage('Đã lưu cấu hình đề thi thành công');
      setTimeout(() => setSaveSuccessMessage(null), 3000);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      alert(
        errorObj?.response?.data?.message || errorObj?.message || 'Có lỗi xảy ra khi lưu cấu hình',
      );
    }
  };

  const handleAddQuestionsFromBank = async (questionIds: string[], defaultPoints: number) => {
    await addBatchMutation.mutateAsync({
      testId: test.id,
      dto: { questionIds, defaultPoints },
    });
  };

  const handleRemoveQuestion = async (snapshotId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa câu hỏi này khỏi đề thi không?')) return;
    await removeQuestionMutation.mutateAsync({
      testId: test.id,
      snapshotId,
    });
  };

  const handleMoveQuestion = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= snapshots.length) return;

    const newSnapshots = [...snapshots];
    const current = newSnapshots[index];
    const target = newSnapshots[targetIndex];

    if (!current || !target) return;

    newSnapshots[index] = target;
    newSnapshots[targetIndex] = current;

    const items = newSnapshots.map((s, idx) => ({
      snapshotId: s.id,
      order: idx + 1,
      points: pointsMap[s.id] ?? s.points,
    }));

    await reorderMutation.mutateAsync({
      testId: test.id,
      dto: { items },
    });
  };

  const handlePointChange = (snapshotId: string, val: number) => {
    setPointsMap((prev) => ({ ...prev, [snapshotId]: val }));
  };

  const handleSavePoints = async () => {
    const items = snapshots.map((s, idx) => ({
      snapshotId: s.id,
      order: idx + 1,
      points: pointsMap[s.id] ?? s.points,
    }));

    await reorderMutation.mutateAsync({
      testId: test.id,
      dto: { items },
    });
    setSaveSuccessMessage('Đã cập nhật điểm số các câu hỏi');
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  const handlePublish = async () => {
    if (snapshots.length === 0) {
      alert('Đề thi phải có ít nhất 1 câu hỏi để xuất bản');
      return;
    }

    try {
      await publishMutation.mutateAsync({ testId: test.id });
      setIsPublishModalOpen(false);
      navigate(`/tests/${test.id}`);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      alert(errorObj?.response?.data?.message || errorObj?.message || 'Có lỗi xảy ra khi xuất bản');
    }
  };

  const currentTotalPoints = snapshots.reduce((acc, s) => acc + (pointsMap[s.id] ?? s.points), 0);

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white line-clamp-1">
              {title || 'Soạn đề thi'}
            </h1>
            <Badge variant={isPublished ? 'success' : 'secondary'}>
              {isPublished ? 'Đã xuất bản' : 'Bản nháp'}
            </Badge>
          </div>
          <p className="text-xs text-slate-500">
            Tổng số {snapshots.length} câu hỏi • Tổng điểm: {currentTotalPoints.toFixed(1)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/tests/${test.id}`)}
            className="flex items-center gap-1.5"
          >
            <Eye className="h-4 w-4" /> Xem trước
          </Button>

          {!isPublished && (
            <Button
              size="sm"
              onClick={() => setIsPublishModalOpen(true)}
              disabled={snapshots.length === 0}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Send className="h-4 w-4" /> Xuất bản đề thi
            </Button>
          )}
        </div>
      </div>

      {saveSuccessMessage && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
          <CheckCircle className="h-4 w-4" /> {saveSuccessMessage}
        </div>
      )}

      {isPublished && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
          <strong>Lưu ý:</strong> Đề thi này đã được xuất bản (PUBLISHED). Để bảo toàn tính toàn vẹn
          (Assessment Integrity), các câu hỏi snapshot và cấu hình cốt lõi đã được khóa.
        </div>
      )}

      {/* Main Grid: Config (Left) + Questions List (Right) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Test Configuration */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Cấu hình đề thi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="cfg-title">Tiêu đề đề thi *</Label>
                <Input
                  id="cfg-title"
                  value={title}
                  disabled={isPublished}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="cfg-desc">Mô tả</Label>
                <textarea
                  id="cfg-desc"
                  value={description}
                  disabled={isPublished}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <Label htmlFor="cfg-instructions">Hướng dẫn làm bài</Label>
                <textarea
                  id="cfg-instructions"
                  value={instructions}
                  disabled={isPublished}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={3}
                  placeholder="VD: Không được mở tab mới trong quá trình làm bài..."
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="cfg-time">Thời gian (phút)</Label>
                  <Input
                    id="cfg-time"
                    type="number"
                    min={1}
                    max={1440}
                    disabled={isPublished}
                    value={timeLimitMinutes ?? ''}
                    onChange={(e) =>
                      setTimeLimitMinutes(e.target.value ? Number(e.target.value) : undefined)
                    }
                    placeholder="Không hạn"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="cfg-attempts">Số lần làm</Label>
                  <Input
                    id="cfg-attempts"
                    type="number"
                    min={1}
                    max={100}
                    disabled={isPublished}
                    value={maxAttempts}
                    onChange={(e) => setMaxAttempts(Number(e.target.value) || 1)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="cfg-release">Công bố kết quả</Label>
                <select
                  id="cfg-release"
                  value={releaseMode}
                  disabled={isPublished}
                  onChange={(e) => setReleaseMode(e.target.value as ResultReleaseMode)}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="ON_FINALIZATION">Ngay khi nộp bài (ON_FINALIZATION)</option>
                  <option value="AFTER_ALL_GRADED">
                    Sau khi chấm xong tất cả (AFTER_ALL_GRADED)
                  </option>
                  <option value="MANUAL">Chỉ khi người soạn công bố thủ công (MANUAL)</option>
                </select>
              </div>

              <div className="space-y-2 pt-2 border-t dark:border-slate-800">
                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={shuffleQuestions}
                    disabled={isPublished}
                    onChange={(e) => setShuffleQuestions(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Xáo trộn câu hỏi ngẫu nhiên
                </label>

                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={shuffleOptions}
                    disabled={isPublished}
                    onChange={(e) => setShuffleOptions(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Xáo trộn các đáp án A/B/C/D
                </label>
              </div>

              {!isPublished && (
                <Button
                  type="button"
                  onClick={handleSaveConfig}
                  disabled={updateMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 mt-4"
                >
                  <Save className="h-4 w-4" />
                  {updateMutation.isPending ? 'Đang lưu...' : 'Lưu cấu hình'}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Question Snapshots List */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Danh sách câu hỏi trong đề ({snapshots.length})
              </h2>
              <p className="text-xs text-slate-500">
                Thứ tự hiển thị và điểm số tương ứng của từng câu hỏi
              </p>
            </div>

            {!isPublished && (
              <div className="flex items-center gap-2">
                {snapshots.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSavePoints}
                    disabled={reorderMutation.isPending}
                    className="text-xs"
                  >
                    Lưu điểm số
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => setIsPickerOpen(true)}
                  className="flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" /> Thêm câu hỏi từ ngân hàng
                </Button>
              </div>
            )}
          </div>

          {snapshots.length === 0 ? (
            <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
              <Sparkles className="h-10 w-10 text-indigo-400" />
              <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-white">
                Chưa có câu hỏi nào trong đề thi
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                Hãy bấm nút "Thêm câu hỏi từ ngân hàng" để chọn các câu hỏi từ thư viện ngân hàng
                của bạn.
              </p>
              {!isPublished && (
                <Button onClick={() => setIsPickerOpen(true)} className="mt-4">
                  <Plus className="mr-1 h-4 w-4" /> Thêm câu hỏi ngay
                </Button>
              )}
            </Card>
          ) : (
            <div className="space-y-3">
              {snapshots.map((snap, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === snapshots.length - 1;
                const options = Array.isArray(snap.options) ? snap.options : [];

                return (
                  <Card key={snap.id} className="overflow-hidden">
                    <div className="flex items-start justify-between border-b bg-slate-50/60 p-3 dark:bg-slate-800/40">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                          {snap.order}
                        </span>
                        <Badge variant="outline">{snap.type}</Badge>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                          <span>Điểm:</span>
                          <Input
                            type="number"
                            step="0.1"
                            min="0.1"
                            max="100"
                            disabled={isPublished}
                            value={pointsMap[snap.id] ?? snap.points}
                            onChange={(e) =>
                              handlePointChange(snap.id, Number(e.target.value) || 0)
                            }
                            className="h-7 w-16 px-1.5 text-center text-xs"
                          />
                        </div>

                        {!isPublished && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isFirst || reorderMutation.isPending}
                              onClick={() => handleMoveQuestion(idx, 'up')}
                              className="h-7 w-7 p-0"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isLast || reorderMutation.isPending}
                              onClick={() => handleMoveQuestion(idx, 'down')}
                              className="h-7 w-7 p-0"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveQuestion(snap.id)}
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <CardContent className="p-4 space-y-3">
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
                                className={`flex items-start gap-2 rounded-md border p-2 text-xs ${
                                  opt.isCorrect
                                    ? 'border-emerald-300 bg-emerald-50/70 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300'
                                    : 'border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                                }`}
                              >
                                <span className="font-bold shrink-0">{optLetter}.</span>
                                <div className="flex-1 min-w-0">
                                  <MarkdownMathPreview content={opt.text} />
                                </div>
                                {opt.isCorrect && (
                                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Question Picker Modal */}
      <QuestionPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onAddQuestions={handleAddQuestionsFromBank}
        existingQuestionIds={snapshots
          .map((s) => s.questionId)
          .filter((id): id is string => Boolean(id))}
        isLoading={addBatchMutation.isPending}
      />

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
            <div className="mt-4 rounded-lg bg-indigo-50 p-3 text-xs text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300">
              Tổng số: <strong>{snapshots.length}</strong> câu • Tổng điểm:{' '}
              <strong>{currentTotalPoints.toFixed(1)}</strong>
            </div>

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
    </div>
  );
}
