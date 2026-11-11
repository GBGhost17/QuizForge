import React, { useEffect, useState } from 'react';
import { AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { CreateQuestionSchema } from '@quizforge/validation';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Alert, AlertDescription } from '../ui/alert';
import { MarkdownMathPreview } from '../common/MarkdownMathPreview';
import { useCheckDuplicates } from '../../hooks/useQuestions';
import type {
  CreateQuestionDto,
  Difficulty,
  DuplicateMatch,
  Question,
  QuestionType,
} from '@quizforge/shared-types';

interface QuestionEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateQuestionDto) => Promise<void>;
  questionToEdit?: Question | null;
  isLoading?: boolean;
  bankId?: string;
}

export function QuestionEditorModal({
  isOpen,
  onClose,
  onSubmit,
  questionToEdit,
  isLoading,
  bankId,
}: QuestionEditorModalProps) {
  const [prompt, setPrompt] = useState('');
  const [type, setType] = useState<QuestionType>('SINGLE_CHOICE');
  const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
  const [defaultPoints, setDefaultPoints] = useState(1.0);
  const [topic, setTopic] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [explanation, setExplanation] = useState('');

  // Duplicate detection state
  const [duplicateWarning, setDuplicateWarning] = useState<DuplicateMatch | null>(null);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const checkDuplicatesMutation = useCheckDuplicates();

  // Options for choices
  const [options, setOptions] = useState<
    Array<{ text: string; isCorrect: boolean; explanation?: string }>
  >([
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ]);

  // Short answer accepted variants
  const [acceptedAnswers, setAcceptedAnswers] = useState<string[]>(['']);

  // Essay rubric
  const [modelAnswer, setModelAnswer] = useState('');
  const [criteria, setCriteria] = useState<Array<{ description: string; points: number }>>([]);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (questionToEdit) {
      setPrompt(questionToEdit.prompt);
      setType(questionToEdit.type);
      setDifficulty(questionToEdit.difficulty);
      setDefaultPoints(questionToEdit.defaultPoints);
      setTopic(questionToEdit.topic || '');
      setTagsInput(questionToEdit.tags?.join(', ') || '');
      setExplanation(questionToEdit.explanation || '');

      if (questionToEdit.type === 'TRUE_FALSE') {
        const correctOpt = questionToEdit.options.find((o) => o.isCorrect)?.text || 'Đúng';
        setOptions([
          { text: 'Đúng', isCorrect: correctOpt === 'Đúng' },
          { text: 'Sai', isCorrect: correctOpt === 'Sai' },
        ]);
      } else if (questionToEdit.type === 'SHORT_ANSWER') {
        const variants = questionToEdit.rubric?.acceptedAnswers ||
          questionToEdit.options.map((o) => o.text) || [''];
        setAcceptedAnswers(variants.length ? variants : ['']);
      } else if (questionToEdit.type === 'ESSAY') {
        setModelAnswer(questionToEdit.rubric?.modelAnswer || '');
        setCriteria(questionToEdit.rubric?.criteria || []);
      } else {
        setOptions(
          questionToEdit.options.length
            ? questionToEdit.options.map((o) => ({
                text: o.text,
                isCorrect: o.isCorrect,
                explanation: o.explanation || undefined,
              }))
            : [
                { text: '', isCorrect: true },
                { text: '', isCorrect: false },
              ],
        );
      }
    } else {
      // Defaults for brand new question
      setPrompt('');
      setType('SINGLE_CHOICE');
      setDifficulty('MEDIUM');
      setDefaultPoints(1.0);
      setTopic('');
      setTagsInput('');
      setExplanation('');
      setOptions([
        { text: '', isCorrect: true },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ]);
      setAcceptedAnswers(['']);
      setModelAnswer('');
      setCriteria([]);
    }
    setError(null);
    setDuplicateWarning(null);
  }, [questionToEdit, isOpen]);

  // When type changes, configure initial options
  const handleTypeChange = (newType: QuestionType) => {
    setType(newType);
    if (newType === 'TRUE_FALSE') {
      setOptions([
        { text: 'Đúng', isCorrect: true },
        { text: 'Sai', isCorrect: false },
      ]);
    } else if (newType === 'SHORT_ANSWER') {
      if (acceptedAnswers.length === 0 || !acceptedAnswers[0]) {
        setAcceptedAnswers(['']);
      }
    } else if (newType === 'SINGLE_CHOICE' || newType === 'MULTIPLE_CHOICE') {
      if (options.length < 2) {
        setOptions([
          { text: '', isCorrect: true },
          { text: '', isCorrect: false },
        ]);
      }
    }
  };

  if (!isOpen) return null;

  const handleAddOption = () => {
    setOptions([...options, { text: '', isCorrect: false }]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, idx) => idx !== index));
  };

  const handleOptionTextChange = (index: number, text: string) => {
    const updated = [...options];
    if (updated[index]) {
      updated[index].text = text;
      setOptions(updated);
    }
  };

  const handleSingleChoiceCorrect = (index: number) => {
    setOptions(
      options.map((opt, idx) => ({
        ...opt,
        isCorrect: idx === index,
      })),
    );
  };

  const handleMultipleChoiceCorrect = (index: number) => {
    const updated = [...options];
    if (updated[index]) {
      updated[index].isCorrect = !updated[index].isCorrect;
      setOptions(updated);
    }
  };

  const handleAddAcceptedAnswer = () => {
    setAcceptedAnswers([...acceptedAnswers, '']);
  };

  const handleRemoveAcceptedAnswer = (index: number) => {
    if (acceptedAnswers.length <= 1) return;
    setAcceptedAnswers(acceptedAnswers.filter((_, idx) => idx !== index));
  };

  const handleAcceptedAnswerChange = (index: number, val: string) => {
    const updated = [...acceptedAnswers];
    updated[index] = val;
    setAcceptedAnswers(updated);
  };

  const handleAddCriterion = () => {
    setCriteria([...criteria, { description: '', points: 1.0 }]);
  };

  const handleRemoveCriterion = (index: number) => {
    setCriteria(criteria.filter((_, idx) => idx !== index));
  };

  const handleCriterionChange = (
    index: number,
    field: 'description' | 'points',
    val: string | number,
  ) => {
    const updated = [...criteria];
    if (updated[index]) {
      if (field === 'points') {
        updated[index].points = Number(val) || 0;
      } else {
        updated[index].description = String(val);
      }
      setCriteria(updated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    let finalOptions: Array<{ text: string; isCorrect: boolean; explanation?: string }> = [];
    let rubric: CreateQuestionDto['rubric'] = undefined;

    if (type === 'SINGLE_CHOICE' || type === 'MULTIPLE_CHOICE' || type === 'TRUE_FALSE') {
      finalOptions = options.map((opt, idx) => ({
        ...opt,
        order: idx,
      }));
    } else if (type === 'SHORT_ANSWER') {
      const validAnswers = acceptedAnswers.map((a) => a.trim()).filter(Boolean);
      finalOptions = validAnswers.map((ans, idx) => ({
        text: ans,
        isCorrect: true,
        order: idx,
      }));
      rubric = {
        acceptedAnswers: validAnswers,
      };
    } else if (type === 'ESSAY') {
      finalOptions = [];
      rubric = {
        modelAnswer: modelAnswer.trim() || undefined,
        criteria: criteria.filter((c) => c.description.trim().length > 0),
      };
    }

    const payload: CreateQuestionDto = {
      prompt,
      type,
      difficulty,
      defaultPoints,
      topic: topic.trim() || undefined,
      tags,
      explanation: explanation.trim() || undefined,
      options: finalOptions,
      rubric,
    };

    // Client-side Zod validation
    const validationResult = CreateQuestionSchema.safeParse(payload);
    if (!validationResult.success) {
      setError(validationResult.error.errors[0]?.message || 'Dữ liệu câu hỏi chưa hợp lệ');
      return;
    }

    // Check for duplicates when creating a new question in a specific bank
    if (bankId && !questionToEdit && !duplicateWarning) {
      setIsCheckingDuplicates(true);
      try {
        const checkRes = await checkDuplicatesMutation.mutateAsync({
          bankId,
          dto: {
            questions: [
              {
                prompt: payload.prompt,
                type: payload.type,
                options: payload.options?.map((opt) => ({
                  text: opt.text,
                  isCorrect: opt.isCorrect,
                })),
              },
            ],
          },
        });

        if (checkRes.hasDuplicates && checkRes.duplicates.length > 0 && checkRes.duplicates[0]) {
          setDuplicateWarning(checkRes.duplicates[0]);
          setIsCheckingDuplicates(false);
          return;
        }
      } catch {
        // Fallback: Proceed with submit if duplicate check endpoint errors out
      } finally {
        setIsCheckingDuplicates(false);
      }
    }

    try {
      await onSubmit(payload);
      onClose();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Có lỗi xảy ra khi lưu câu hỏi';
      setError(message);
    }
  };

  const handleDismissWarningAndSubmit = async () => {
    setDuplicateWarning(null);
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    let finalOptions: Array<{
      text: string;
      isCorrect: boolean;
      explanation?: string;
      order?: number;
    }> = [];
    let rubric: CreateQuestionDto['rubric'] = undefined;

    if (type === 'SINGLE_CHOICE' || type === 'MULTIPLE_CHOICE' || type === 'TRUE_FALSE') {
      finalOptions = options.map((opt, idx) => ({
        ...opt,
        order: idx,
      }));
    } else if (type === 'SHORT_ANSWER') {
      const validAnswers = acceptedAnswers.map((a) => a.trim()).filter(Boolean);
      finalOptions = validAnswers.map((ans, idx) => ({
        text: ans,
        isCorrect: true,
        order: idx,
      }));
      rubric = {
        acceptedAnswers: validAnswers,
      };
    } else if (type === 'ESSAY') {
      finalOptions = [];
      rubric = {
        modelAnswer: modelAnswer.trim() || undefined,
        criteria: criteria.filter((c) => c.description.trim().length > 0),
      };
    }

    const payload: CreateQuestionDto = {
      prompt,
      type,
      difficulty,
      defaultPoints,
      topic: topic.trim() || undefined,
      tags,
      explanation: explanation.trim() || undefined,
      options: finalOptions,
      rubric,
    };

    try {
      await onSubmit(payload);
      onClose();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Có lỗi xảy ra khi lưu câu hỏi';
      setError(message);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="question-modal-title"
    >
      <div className="w-full max-w-3xl my-8 rounded-2xl bg-white p-6 shadow-xl transition-all max-h-[90vh] flex flex-col">
        <div className="border-b border-slate-100 pb-4">
          <h2 id="question-modal-title" className="text-xl font-bold text-slate-900">
            {questionToEdit ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi mới'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Thiết lập nội dung câu hỏi, loại câu hỏi, đáp án và lời giải chi tiết.
          </p>
        </div>

        {error && (
          <Alert variant="error" className="mt-4 shrink-0">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Duplicate warning notification with side-by-side comparison */}
        {duplicateWarning && (
          <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50/90 p-4 dark:border-amber-900/60 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 space-y-3 shrink-0">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-amber-950 dark:text-amber-100">
                    Phát hiện câu hỏi có tỉ lệ trùng lặp cao
                  </h3>
                  <Badge
                    variant="outline"
                    className="text-xs bg-amber-100 text-amber-800 border-amber-300 font-semibold"
                  >
                    Độ tương đồng: {Math.round(duplicateWarning.similarity * 100)}%
                  </Badge>
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
                  Nội dung câu hỏi bạn vừa nhập tương đồng cao với một câu hỏi đã có sẵn trong ngân
                  hàng này. Vui lòng đối chiếu kỹ:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg bg-white/90 p-3 border border-amber-200 dark:bg-slate-900/80 dark:border-slate-800 space-y-1.5">
                <span className="font-semibold text-indigo-700 dark:text-indigo-400 block text-[11px]">
                  Câu hỏi bạn đang soạn:
                </span>
                <div className="text-slate-900 dark:text-white font-medium">
                  <MarkdownMathPreview content={prompt} />
                </div>
              </div>
              <div className="rounded-lg bg-white/90 p-3 border border-amber-200 dark:bg-slate-900/80 dark:border-slate-800 space-y-1.5">
                <span className="font-semibold text-emerald-700 dark:text-emerald-400 block text-[11px]">
                  Câu hỏi đã có sẵn trong ngân hàng:
                </span>
                <div className="text-slate-900 dark:text-white font-medium">
                  <MarkdownMathPreview content={duplicateWarning.existingQuestionPrompt} />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-amber-200/60 dark:border-amber-900/40">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDuplicateWarning(null)}
                className="text-xs border-amber-300 hover:bg-amber-100"
              >
                Loại bỏ & Chỉnh sửa lại nội dung
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleDismissWarningAndSubmit}
                className="text-xs bg-amber-600 hover:bg-amber-700 text-white"
                isLoading={isLoading}
              >
                Bỏ qua cảnh báo & Vẫn lưu câu này
              </Button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto pr-2 flex-1">
          {/* Question Type & Difficulty */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="q-type" className="block text-sm font-medium text-slate-700 mb-1">
                Loại câu hỏi
              </label>
              <select
                id="q-type"
                value={type}
                onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-600"
              >
                <option value="SINGLE_CHOICE">Trắc nghiệm 1 đáp án đúng</option>
                <option value="MULTIPLE_CHOICE">Trắc nghiệm nhiều đáp án đúng</option>
                <option value="TRUE_FALSE">Đúng / Sai</option>
                <option value="SHORT_ANSWER">Trả lời ngắn</option>
                <option value="ESSAY">Tự luận</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="q-difficulty"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Độ khó
              </label>
              <select
                id="q-difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-600"
              >
                <option value="EASY">Dễ</option>
                <option value="MEDIUM">Trung bình</option>
                <option value="HARD">Khó</option>
              </select>
            </div>
          </div>

          {/* Prompt */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="q-prompt" className="block text-sm font-medium text-slate-700">
                Nội dung câu hỏi (hỗ trợ KaTeX / Markdown) <span className="text-rose-500">*</span>
              </label>
              {prompt && (
                <span className="text-xs text-indigo-600 font-medium">Hỗ trợ KaTeX & Markdown</span>
              )}
            </div>
            <textarea
              id="q-prompt"
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-600 font-mono"
              placeholder="Nhập nội dung câu hỏi (sử dụng $...$ hoặc $$...$$ cho công thức toán)..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              required
            />
            {prompt.trim() && (
              <div className="rounded-lg border border-indigo-100 bg-indigo-50/30 p-2.5 text-xs text-slate-800">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600 block mb-1">
                  Xem trước hiển thị:
                </span>
                <MarkdownMathPreview content={prompt} />
              </div>
            )}
          </div>

          {/* Type-Specific Options Manager */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-slate-800">
              {type === 'SINGLE_CHOICE' && 'Các lựa chọn đáp án (Chọn 1 đáp án đúng)'}
              {type === 'MULTIPLE_CHOICE' &&
                'Các lựa chọn đáp án (Chọn một hoặc nhiều đáp án đúng)'}
              {type === 'TRUE_FALSE' && 'Xác định đáp án đúng cho câu hỏi Đúng / Sai'}
              {type === 'SHORT_ANSWER' &&
                'Các đáp án được chấp nhận (không phân biệt chữ hoa/thường)'}
              {type === 'ESSAY' && 'Tiêu chí chấm điểm và câu trả lời mẫu'}
            </h3>

            {/* SINGLE_CHOICE & MULTIPLE_CHOICE */}
            {(type === 'SINGLE_CHOICE' || type === 'MULTIPLE_CHOICE') && (
              <div className="space-y-2">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <input
                      type={type === 'SINGLE_CHOICE' ? 'radio' : 'checkbox'}
                      name="correct-option"
                      checked={opt.isCorrect}
                      onChange={() =>
                        type === 'SINGLE_CHOICE'
                          ? handleSingleChoiceCorrect(idx)
                          : handleMultipleChoiceCorrect(idx)
                      }
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      title={opt.isCorrect ? 'Đáp án đúng' : 'Đánh dấu đáp án đúng'}
                      aria-label={`Lựa chọn ${idx + 1} đúng`}
                    />
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                      placeholder={`Lựa chọn ${String.fromCharCode(65 + idx)}...`}
                      className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-indigo-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-600"
                      required
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="Xóa lựa chọn"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddOption}
                  className="mt-2 flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" /> Thêm lựa chọn
                </Button>
              </div>
            )}

            {/* TRUE_FALSE */}
            {type === 'TRUE_FALSE' && (
              <div className="flex gap-6 py-2">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-sm text-slate-700">
                  <input
                    type="radio"
                    name="tf-correct"
                    checked={options[0]?.isCorrect}
                    onChange={() => handleSingleChoiceCorrect(0)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  Đúng
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-medium text-sm text-slate-700">
                  <input
                    type="radio"
                    name="tf-correct"
                    checked={options[1]?.isCorrect}
                    onChange={() => handleSingleChoiceCorrect(1)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  Sai
                </label>
              </div>
            )}

            {/* SHORT_ANSWER */}
            {type === 'SHORT_ANSWER' && (
              <div className="space-y-2">
                {acceptedAnswers.map((ans, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-400 w-6">#{idx + 1}</span>
                    <input
                      type="text"
                      value={ans}
                      onChange={(e) => handleAcceptedAnswerChange(idx, e.target.value)}
                      placeholder="Nhập biến thể câu trả lời đúng (ví dụ: H2O, nước)..."
                      className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-indigo-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-600"
                      required
                    />
                    {acceptedAnswers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAcceptedAnswer(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddAcceptedAnswer}
                  className="mt-2 flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" /> Thêm biến thể đáp án
                </Button>
              </div>
            )}

            {/* ESSAY */}
            {type === 'ESSAY' && (
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="model-answer"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Câu trả lời mẫu / Gợi ý làm bài (Tùy chọn)
                  </label>
                  <textarea
                    id="model-answer"
                    rows={3}
                    value={modelAnswer}
                    onChange={(e) => setModelAnswer(e.target.value)}
                    placeholder="Gợi ý các ý chính hoặc bài giải mẫu..."
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-700">
                      Tiêu chí chấm điểm (Rubric)
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleAddCriterion}
                      className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 p-0 h-auto"
                    >
                      <Plus className="h-3.5 w-3.5" /> Thêm tiêu chí
                    </Button>
                  </div>

                  {criteria.map((crit, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={crit.description}
                        onChange={(e) => handleCriterionChange(idx, 'description', e.target.value)}
                        placeholder="Mô tả tiêu chí..."
                        className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-indigo-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-600"
                      />
                      <input
                        type="number"
                        step="0.05"
                        min="0.05"
                        value={crit.points}
                        onChange={(e) => handleCriterionChange(idx, 'points', e.target.value)}
                        placeholder="Điểm"
                        className="w-20 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 focus:border-indigo-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-600"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveCriterion(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Topic & Tags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              id="q-topic"
              label="Chủ đề / Bài học"
              placeholder="Ví dụ: Đại số, Lịch sử thế giới..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
            <Input
              id="q-tags"
              label="Thẻ phân loại (ngăn cách bằng dấu phẩy)"
              placeholder="toan-12, thpt-qg, tich-phan"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </div>

          {/* Explanation */}
          <div className="space-y-1">
            <label htmlFor="q-explanation" className="block text-sm font-medium text-slate-700">
              Lời giải chi tiết / Giải thích (Tùy chọn)
            </label>
            <textarea
              id="q-explanation"
              rows={2}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-600 font-mono"
              placeholder="Hiển thị cho học sinh sau khi hoàn thành bài thi hoặc trong chế độ luyện tập (hỗ trợ KaTeX)..."
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
            />
            {explanation.trim() && (
              <div className="rounded-lg border border-amber-200/60 bg-amber-50/40 p-2.5 text-xs text-slate-800">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 block mb-1">
                  Xem trước lời giải:
                </span>
                <MarkdownMathPreview content={explanation} />
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading || isCheckingDuplicates}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading || isCheckingDuplicates}
              disabled={isLoading || isCheckingDuplicates}
            >
              {isCheckingDuplicates
                ? 'Đang kiểm tra trùng...'
                : questionToEdit
                  ? 'Lưu câu hỏi'
                  : 'Tạo câu hỏi'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
