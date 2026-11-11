import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FileCode,
  Sparkles,
  HelpCircle,
  Check,
  CheckSquare,
  Square,
  Layers,
  Copy,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { MarkdownMathPreview } from '../../components/common/MarkdownMathPreview';
import { useQuestionBank } from '../../hooks/useQuestionBanks';
import { useMarkdownImport } from '../../hooks/useMarkdownImport';
import { GeneratePromptModal } from '../../components/import/GeneratePromptModal';
import { SelectTargetBankModal } from '../../components/import/SelectTargetBankModal';
import type { ParsedQuestion, ImportDiagnostic } from '@quizforge/shared-types';

export const SAMPLE_MARKDOWN_TEMPLATE = `---
title: Ngân hàng mẫu Kiểm tra Kiến thức
description: Bộ câu hỏi kiểm tra đầy đủ 5 dạng chuẩn QuizForge
subject: Khoa học máy tính
tags: [lap-trinh, toan-hoc, thiet-ke]
---

## Q1: Phương trình bậc nhất
> type: SINGLE_CHOICE
> difficulty: EASY
> points: 1.0
> topic: Đại số

Nghiệm của phương trình sau là bao nhiêu?
$$2x - 6 = 0$$

- [ ] $x = 1$
- [x] $x = 3$ // Lời giải: $2x = 6 \\Rightarrow x = 3$
- [ ] $x = -3$
- [ ] $x = 6$

## Q2: Phân loại số nguyên tố
> type: MULTIPLE_CHOICE
> difficulty: MEDIUM
> points: 2.0

Chọn các số nguyên tố trong các số sau:

- [x] 2
- [x] 3
- [ ] 4
- [x] 5
- [ ] 6

## Q3: Định lý Pythagoras
> type: TRUE_FALSE
> difficulty: EASY
> points: 1.0

Trong tam giác vuông có hai cạnh góc vuông $a, b$ và cạnh huyền $c$, ta luôn có hệ thức $a^2 + b^2 = c^2$.

- [x] Đúng
- [ ] Sai

## Q4: Giới hạn cơ bản
> type: SHORT_ANSWER
> difficulty: MEDIUM
> points: 2.0
> acceptedAnswers: ["0", "không"]

Tính giá trị của giới hạn sau:
$$\\lim_{x \\to \\infty} \\frac{1}{x^2}$$

## Q5: Khái niệm Đa hình trong OOP
> type: ESSAY
> difficulty: HARD
> points: 5.0
> rubric: Giải thích tính đa hình (2đ), ví dụ minh họa override/overload (3đ)
> modelAnswer: Tính đa hình cho phép các đối tượng thuộc các lớp khác nhau phản ứng khác nhau với cùng một thông điệp.

Trình bày ngắn gọn khái niệm Đa hình (Polymorphism) trong lập trình hướng đối tượng.
`;

export function MarkdownImportPage() {
  const { id: bankId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: bank, isLoading: isBankLoading } = useQuestionBank(bankId || '');
  const { parse, isParsing, parseResult, commit, isCommitting } = useMarkdownImport();

  const [content, setContent] = useState('');
  const [showDifficulty, setShowDifficulty] = useState(true);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [isSelectBankModalOpen, setIsSelectBankModalOpen] = useState(false);
  const [commitSuccessMessage, setCommitSuccessMessage] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [hasCopiedAllErrors, setHasCopiedAllErrors] = useState(false);
  const [copiedDiagIndex, setCopiedDiagIndex] = useState<number | null>(null);

  // Trigger preview parse
  const handleParse = async (markdownText: string = content) => {
    setGlobalError(null);
    try {
      await parse({ content: markdownText });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Lỗi phân tích cú pháp';
      setGlobalError(errorMsg);
    }
  };

  // Upload .md file from user disk
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files.length > 0 ? e.target.files[0] : null;
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setContent(text);
        handleParse(text);
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  // Helper executing commit to a specific bank ID
  const executeCommit = async (targetId: string) => {
    if (!parseResult || parseResult.hasErrors || parseResult.questions.length === 0) {
      return;
    }

    setGlobalError(null);
    const result = await commit({
      bankId: targetId,
      questions: parseResult.questions,
    });

    setCommitSuccessMessage(result.message);
    setTimeout(() => {
      navigate(`/question-banks/${targetId}`);
    }, 1500);
  };

  // Helper formatting a single diagnostic item into text
  const formatSingleDiagnostic = (diag: ImportDiagnostic): string => {
    let text = `Dòng ${diag.line} [${diag.severity}]: ${diag.message}`;
    if (diag.remediation) {
      text += `\n👉 Hướng khắc phục: ${diag.remediation}`;
    }
    return text;
  };

  // Copy all diagnostics to clipboard
  const handleCopyAllDiagnostics = async () => {
    const diags = parseResult?.diagnostics || [];
    if (diags.length === 0) return;

    const errorCount = diags.filter((d) => d.severity === 'ERROR').length;
    const warningCount = diags.filter((d) => d.severity === 'WARNING').length;
    const header = `[QuizForge - Chẩn đoán cú pháp Markdown]\nTổng cộng: ${errorCount} lỗi, ${warningCount} cảnh báo\n`;

    const items = diags
      .map((diag, idx) => {
        let itemStr = `${idx + 1}. Dòng ${diag.line} [${diag.severity}]: ${diag.message}`;
        if (diag.remediation) {
          itemStr += `\n   👉 Hướng khắc phục: ${diag.remediation}`;
        }
        return itemStr;
      })
      .join('\n\n');

    const fullText = `${header}\n${items}\n\n* Vui lòng chỉnh sửa lại bộ câu hỏi Markdown theo đúng hướng khắc phục trên.*`;

    try {
      await navigator.clipboard.writeText(fullText);
      setHasCopiedAllErrors(true);
      setTimeout(() => setHasCopiedAllErrors(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Copy a single diagnostic item to clipboard
  const handleCopySingleDiagnostic = async (index: number, diag: ImportDiagnostic) => {
    const text = formatSingleDiagnostic(diag);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedDiagIndex(index);
      setTimeout(() => setCopiedDiagIndex(null), 2000);
    } catch {
      // Fallback
    }
  };

  // Commit valid questions to database
  const handleCommit = async () => {
    if (!parseResult || parseResult.hasErrors || parseResult.questions.length === 0) {
      return;
    }

    // If navigated from sidebar without a pre-selected bank ID, open modal to select/create a bank!
    if (!bankId) {
      setIsSelectBankModalOpen(true);
      return;
    }

    // Otherwise commit directly to existing bankId
    try {
      await executeCommit(bankId);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Có lỗi xảy ra khi lưu vào cơ sở dữ liệu';
      setGlobalError(errorMsg);
    }
  };

  if (isBankLoading) {
    return <LoadingSpinner fullPage label="Đang tải thông tin ngân hàng..." />;
  }

  const diagnostics = parseResult?.diagnostics || [];
  const errors = diagnostics.filter((d) => d.severity === 'ERROR');
  const warnings = diagnostics.filter((d) => d.severity === 'WARNING');
  const questions = parseResult?.questions || [];
  const canCommit = !parseResult?.hasErrors && questions.length > 0 && !isCommitting;

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Nhập câu hỏi từ Markdown
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Ngân hàng đích:{' '}
            {bank ? (
              <>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {bank.title}
                </span>{' '}
                ({bank._count?.questions || 0} câu hiện tại)
              </>
            ) : (
              <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                Chưa chọn (sẽ chọn ngân hàng khi lưu)
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".md,.markdown,text/markdown"
              className="sr-only"
              onChange={handleFileUpload}
            />
            <span
              className="inline-flex items-center justify-center font-medium transition-colors cursor-pointer border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 h-8 px-2 sm:px-3 text-xs rounded-md shadow-xs"
              title="Tải tệp .md"
              aria-label="Tải tệp .md"
            >
              <Upload className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Tải tệp .md</span>
            </span>
          </label>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPromptModalOpen(true)}
            className="border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100 dark:border-indigo-800 dark:text-indigo-300 dark:bg-indigo-950/40 px-2 sm:px-3"
            title="Tạo Prompt AI"
            aria-label="Tạo Prompt AI"
          >
            <Sparkles className="h-4 w-4 sm:mr-2 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">Tạo Prompt AI</span>
          </Button>

          <Button
            onClick={handleCommit}
            disabled={!canCommit}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm px-2.5 sm:px-3 text-xs sm:text-sm"
            title="Nhập vào ngân hàng"
          >
            {isCommitting ? (
              <LoadingSpinner size="sm" className="sm:mr-2" />
            ) : (
              <Check className="h-4 w-4 sm:mr-2" />
            )}
            <span className="hidden sm:inline">
              Nhập {questions.length > 0 ? `${questions.length} câu ` : ''}vào ngân hàng
            </span>
            <span className="sm:hidden">
              Nhập {questions.length > 0 ? `(${questions.length})` : ''}
            </span>
          </Button>
        </div>
      </div>

      {commitSuccessMessage && (
        <Alert className="bg-emerald-50 border-emerald-200 text-emerald-800">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <AlertTitle className="font-semibold">Thành công!</AlertTitle>
          <AlertDescription>{commitSuccessMessage} Đang chuyển hướng...</AlertDescription>
        </Alert>
      )}

      {globalError && (
        <Alert variant="error">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>{globalError}</AlertDescription>
        </Alert>
      )}

      {/* Main Dual-Pane Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* LEFT PANE: Editor & Diagnostics */}
        <div className="flex flex-col space-y-4">
          <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
            <CardHeader className="py-3 px-4 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileCode className="h-4 w-4 text-indigo-600" />
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Trình soạn thảo Markdown
                </span>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleParse()}
                disabled={isParsing || !content.trim()}
                title="Phân tích & Xem trước"
                aria-label="Phân tích & Xem trước"
              >
                {isParsing ? <LoadingSpinner size="sm" className="mr-1.5" /> : null}
                <span className="hidden sm:inline">Phân tích & Xem trước</span>
                <span className="sm:hidden">Phân tích</span>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Dán hoặc nhập nội dung Markdown tại đây..."
                rows={22}
                className="w-full p-4 font-mono text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-b-lg resize-y leading-relaxed"
                spellCheck={false}
              />
            </CardContent>
          </Card>

          {/* Diagnostics Report */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
            <CardHeader className="py-3 px-4 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
              <div className="flex items-center space-x-2">
                <Layers className="h-4 w-4 text-indigo-600" />
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Chẩn đoán cú pháp (Diagnostics)
                </span>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                {errors.length > 0 ? (
                  <Badge variant="destructive" className="px-2 py-0.5">
                    {errors.length} lỗi
                  </Badge>
                ) : (
                  <Badge variant="default" className="bg-emerald-600 text-white px-2 py-0.5">
                    0 lỗi
                  </Badge>
                )}
                {warnings.length > 0 && (
                  <Badge
                    variant="outline"
                    className="text-amber-700 bg-amber-50 border-amber-200 px-2 py-0.5"
                  >
                    {warnings.length} cảnh báo
                  </Badge>
                )}
                {diagnostics.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyAllDiagnostics}
                    className="h-6 px-2 text-[11px] flex items-center gap-1 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border-slate-200 dark:border-slate-700 cursor-pointer"
                    title="Sao chép toàn bộ lỗi & hướng dẫn khắc phục"
                  >
                    {hasCopiedAllErrors ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          Đã chép
                        </span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Sao chép tất cả lỗi</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4 max-h-60 overflow-y-auto space-y-2.5">
              {diagnostics.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-500">
                  Nhấn "Phân tích & Xem trước" để kiểm tra tính hợp lệ của cú pháp Markdown.
                </div>
              ) : (
                diagnostics.map((diag, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border text-xs flex flex-col space-y-1 relative group ${
                      diag.severity === 'ERROR'
                        ? 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-200'
                        : diag.severity === 'WARNING'
                          ? 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-200'
                          : 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950/40 dark:border-blue-900/60 dark:text-blue-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold gap-2">
                      <div className="flex items-center space-x-1.5 min-w-0">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">
                          Dòng {diag.line}: {diag.message}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopySingleDiagnostic(index, diag)}
                          aria-label="Sao chép chi tiết lỗi này"
                          className="flex items-center gap-1 p-1 px-1.5 rounded text-[11px] font-normal hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-slate-600 dark:text-slate-300 cursor-pointer"
                          title="Sao chép chi tiết lỗi này"
                        >
                          {copiedDiagIndex === index ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                              <span className="text-emerald-600 dark:text-emerald-400 text-[10px]">
                                Đã chép
                              </span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span className="text-[10px] hidden sm:inline">Sao chép</span>
                            </>
                          )}
                        </button>
                        <Badge variant="outline" className="text-[10px] uppercase font-mono px-1.5">
                          {diag.severity}
                        </Badge>
                      </div>
                    </div>
                    {diag.remediation && (
                      <p className="text-[11px] opacity-90 pl-5">
                        👉 Hướng khắc phục: {diag.remediation}
                      </p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT PANE: Rendered Preview & Math Cards */}
        <div className="flex flex-col space-y-4">
          <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
            <CardHeader className="py-3 px-4 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Xem trước câu hỏi ({questions.length} câu hợp lệ)
                </CardTitle>
                {parseResult?.title && (
                  <p className="text-xs text-indigo-600 font-medium">
                    {parseResult.title} {parseResult.subject ? `• ${parseResult.subject}` : ''}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-600 dark:text-slate-400 select-none">
                  <input
                    type="checkbox"
                    checked={showDifficulty}
                    onChange={(e) => setShowDifficulty(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Hiện nhãn độ khó</span>
                </label>
                {parseResult && (
                  <Badge
                    variant={parseResult.hasErrors ? 'destructive' : 'default'}
                    className={!parseResult.hasErrors ? 'bg-emerald-600 text-white' : ''}
                  >
                    {parseResult.hasErrors ? 'Có lỗi cú pháp' : 'Hợp lệ'}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4 max-h-[750px] overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-950/20">
              {questions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
                  <HelpCircle className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Chưa có câu hỏi hợp lệ nào được phân tích
                  </p>
                  <p className="text-xs text-slate-400 max-w-sm">
                    Nhập nội dung theo cú pháp Markdown ở khung bên trái hoặc nhấn nút "Mẫu chuẩn"
                    để xem ví dụ.
                  </p>
                </div>
              ) : (
                <>
                  {/* AI Content Verification Advisory */}
                  <div
                    data-testid="ai-verification-alert"
                    className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 shadow-2xs"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs">
                      <p className="font-semibold text-amber-950 dark:text-amber-100 flex items-center gap-1.5">
                        <span>Lưu ý kiểm duyệt nội dung do AI tạo</span>
                        <Badge
                          variant="outline"
                          className="text-[10px] py-0 px-1.5 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 font-normal bg-amber-100/50 dark:bg-amber-900/30"
                        >
                          Khuyến nghị
                        </Badge>
                      </p>
                      <p className="leading-relaxed text-amber-800 dark:text-amber-300">
                        Nội dung do mô hình AI sinh ra có thể phát sinh sai sót, nhầm lẫn đáp án
                        hoặc công thức. Thầy/Cô vui lòng rà soát kỹ lại đề bài, phương án đúng và
                        lời giải chi tiết trước khi nhập vào ngân hàng và phát hành đề thi.
                      </p>
                    </div>
                  </div>

                  {questions.map((q, idx) => (
                    <QuestionPreviewCard
                      key={idx}
                      question={q}
                      index={idx + 1}
                      showDifficulty={showDifficulty}
                    />
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <GeneratePromptModal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        bankTitle={bank?.title}
        onApplyDemoTemplate={(template) => {
          setContent(template);
          handleParse(template);
        }}
      />

      <SelectTargetBankModal
        isOpen={isSelectBankModalOpen}
        onClose={() => setIsSelectBankModalOpen(false)}
        onSelectAndCommit={executeCommit}
        defaultTitle={parseResult?.title || ''}
        defaultDescription={parseResult?.description || ''}
        questionsCount={questions.length}
        isCommitting={isCommitting}
      />
    </div>
  );
}

/**
 * Question Card previewing KaTeX math formulas and option choices.
 */
function QuestionPreviewCard({
  question: q,
  index,
  showDifficulty = true,
}: {
  question: ParsedQuestion;
  index: number;
  showDifficulty?: boolean;
}) {
  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'EASY':
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            Dễ
          </Badge>
        );
      case 'HARD':
        return (
          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
            Khó
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            Trung bình
          </Badge>
        );
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'SINGLE_CHOICE':
        return 'Trắc nghiệm 1 đáp án';
      case 'MULTIPLE_CHOICE':
        return 'Nhiều đáp án đúng';
      case 'TRUE_FALSE':
        return 'Đúng / Sai';
      case 'SHORT_ANSWER':
        return 'Điền đáp án ngắn';
      case 'ESSAY':
        return 'Tự luận';
      default:
        return type;
    }
  };

  return (
    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-300 transition-colors">
      <CardHeader className="py-3 px-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold">
              {index}
            </span>
            <Badge variant="outline" className="font-semibold text-slate-700 dark:text-slate-300">
              {getTypeLabel(q.type)}
            </Badge>
            {showDifficulty && getDifficultyBadge(q.difficulty)}
            {q.topic && (
              <Badge
                variant="secondary"
                className="text-[10px] py-0 px-1.5 font-normal text-slate-600 dark:text-slate-300"
              >
                {q.topic}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
              Dòng {q.rawSourceLine}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {/* Render Prompt with KaTeX */}
        <MarkdownMathPreview content={q.prompt} />

        {/* Render Choice Options */}
        {q.options && q.options.length > 0 && (
          <div className="mt-3 space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-3">
            {q.options.map((opt, optIdx) => (
              <div
                key={optIdx}
                className={`flex items-start space-x-2.5 p-2 rounded-md text-xs transition-colors ${
                  opt.isCorrect
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/50 font-medium'
                    : 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {opt.isCorrect ? (
                    <CheckSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Square className="h-4 w-4 text-slate-400" />
                  )}
                </div>
                <div className="flex-1">
                  <MarkdownMathPreview content={opt.text} />
                  {opt.explanation && (
                    <div className="mt-1.5 text-[11px] text-emerald-800 dark:text-emerald-300 italic border-t border-emerald-100/60 dark:border-emerald-900/40 pt-1">
                      <span className="font-semibold not-italic mr-1">💡 Lời giải:</span>
                      <MarkdownMathPreview
                        content={opt.explanation}
                        className="text-[11px] inline"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Short Answer Variants */}
        {q.type === 'SHORT_ANSWER' && q.rubric?.acceptedAnswers && (
          <div className="mt-2 p-2.5 rounded bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-xs">
            <span className="font-semibold text-indigo-900 dark:text-indigo-200 block mb-1">
              Đáp án chấp nhận:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {q.rubric.acceptedAnswers.map((ans, aIdx) => (
                <Badge
                  key={aIdx}
                  variant="secondary"
                  className="bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-indigo-200"
                >
                  {ans}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Essay Rubric */}
        {q.type === 'ESSAY' && (q.rubric?.modelAnswer || q.rubric?.criteria) && (
          <div className="mt-2 p-2.5 rounded bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 text-xs space-y-2">
            {q.rubric.modelAnswer && (
              <div>
                <span className="font-semibold text-amber-900 dark:text-amber-200 block mb-1">
                  Lời giải mẫu:
                </span>
                <MarkdownMathPreview content={q.rubric.modelAnswer} className="text-xs" />
              </div>
            )}
            {q.rubric.criteria && q.rubric.criteria.length > 0 && (
              <div className="pt-1 border-t border-amber-200/40 dark:border-amber-900/40">
                <span className="font-semibold text-amber-900 dark:text-amber-200">Tiêu chí: </span>
                <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
                  {q.rubric.criteria.map((c, cIdx) => (
                    <li key={cIdx} className="text-slate-600 dark:text-slate-400">
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
          <div className="mt-2.5 text-xs text-slate-700 dark:text-slate-300 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 p-2.5 rounded-lg space-y-1">
            <span className="font-semibold text-amber-900 dark:text-amber-200 block text-[11px]">
              💡 Lời giải chi tiết:
            </span>
            <MarkdownMathPreview content={q.explanation} className="text-xs" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
