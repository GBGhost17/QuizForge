import React, { useState } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  X,
  FileCode,
  BookOpen,
  Sliders,
  HelpCircle,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';

export interface PromptConfig {
  subject: string;
  questionCount: number;
  questionType: string;
  difficulty: string;
  scope: string;
  includeExplanation: boolean;
  includeKaTeX: boolean;
}

export function buildQuizForgeAIPrompt(config: PromptConfig): string {
  const {
    subject,
    questionCount,
    questionType,
    difficulty,
    scope,
    includeExplanation,
    includeKaTeX,
  } = config;

  let difficultyDesc = '';
  switch (difficulty) {
    case 'EASY':
      difficultyDesc = 'Dễ (mức độ nhận biết và thông hiểu cơ bản)';
      break;
    case 'MEDIUM':
      difficultyDesc = 'Trung bình (mức độ vận dụng kiến thức)';
      break;
    case 'HARD':
      difficultyDesc = 'Khó (mức độ vận dụng cao, phân loại học sinh giỏi)';
      break;
    default:
      difficultyDesc = 'Hỗn hợp phân hóa: 40% Dễ, 40% Trung bình, 20% Khó';
  }

  let typeDesc = '';
  switch (questionType) {
    case 'SINGLE_CHOICE':
      typeDesc =
        '100% Trắc nghiệm một lựa chọn (SINGLE_CHOICE, 4 phương án, duy nhất 1 đáp án đúng)';
      break;
    case 'MULTIPLE_CHOICE':
      typeDesc = '100% Trắc nghiệm nhiều lựa chọn (MULTIPLE_CHOICE, có 2 hoặc nhiều đáp án đúng)';
      break;
    case 'TRUE_FALSE':
      typeDesc = '100% Câu hỏi Đúng / Sai (TRUE_FALSE, kiểm tra nhận định mệnh đề)';
      break;
    case 'SHORT_ANSWER':
      typeDesc = '100% Trả lời ngắn / Điền đáp số (SHORT_ANSWER, cung cấp acceptedAnswers)';
      break;
    case 'ESSAY':
      typeDesc =
        '100% Câu hỏi tự luận (ESSAY, cung cấp rubric tiêu chí chấm và modelAnswer bài giải mẫu)';
      break;
    case 'MIXED_OBJECTIVE':
      typeDesc =
        'Hỗn hợp các dạng trắc nghiệm khách quan: SINGLE_CHOICE, MULTIPLE_CHOICE, TRUE_FALSE và SHORT_ANSWER';
      break;
    default:
      typeDesc =
        'Đa dạng kết hợp tất cả các loại: SINGLE_CHOICE, MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER và ESSAY';
  }

  return `Bạn là một chuyên gia giáo dục và biên soạn đề kiểm tra chuẩn hóa chất lượng cao. Nhiệm vụ của bạn là soạn một bộ câu hỏi chuẩn theo đúng các yêu cầu và quy chuẩn định dạng kỹ thuật dưới đây để nhập trực tiếp vào hệ thống thi trắc nghiệm QuizForge.

### 1. THÔNG TIN YÊU CẦU:
- **Môn học / Chủ đề**: ${subject || 'Kiến thức tổng hợp'}
- **Số lượng câu hỏi**: ${questionCount} câu ${questionCount > 20 ? `(Lưu ý: Hãy đảm bảo sinh đủ từ Q1 đến Q${questionCount}, không ngắt quãng giữa chừng)` : ''}
- **Dạng câu hỏi**: ${typeDesc}
- **Độ khó**: ${difficultyDesc}
${scope ? `- **Phạm vi kiến thức & Yêu cầu trọng tâm**: ${scope}` : ''}
${includeExplanation ? '- **Lời giải**: Bắt buộc có phần giải thích chi tiết cho từng câu hỏi.' : ''}
${includeKaTeX ? '- **Công thức Toán / Khoa học**: Mọi công thức Toán/Lý/Hóa hoặc ký hiệu khoa học PHẢI viết bằng cú pháp KaTeX/LaTeX ($...$ cho inline và $$...$$ cho khối công thức riêng).' : ''}

---

### 2. QUY CHUẨN ĐỊNH DẠNG MARKDOWN QUIZFORGE BẮT BUỘC:

Hệ thống QuizForge sử dụng trình phân tích cú pháp AST tự động. Hãy tuân thủ cấu trúc sau:

\`\`\`markdown
---
title: "${subject || 'Đề kiểm tra'}"
description: "Bộ câu hỏi tạo tự động bởi AI"
subject: "${subject || 'Chung'}"
tags: [on-tap, kiem-tra]
---

## Q1: [Nội dung câu hỏi ngắn gọn hoặc tiêu đề]
> type: SINGLE_CHOICE
> difficulty: EASY
> topic: ${subject || 'Chủ đề 1'}
> explanation: Lời giải thích vì sao đáp án này đúng

Nội dung câu hỏi chi tiết. Nếu có công thức toán học thì dùng $x^2 + 2x = 0$ hoặc:
$$\\int_{0}^{1} x dx$$

- [x] Phương án đúng // Giải thích ngắn (tùy chọn)
- [ ] Phương án sai A
- [ ] Phương án sai B
- [ ] Phương án sai C

## Q2: [Câu hỏi nhiều lựa chọn nếu có]
> type: MULTIPLE_CHOICE
> difficulty: MEDIUM
> explanation: Giải thích các phương án đúng

Chọn các mệnh đề chính xác:
- [x] Mệnh đề đúng thứ nhất
- [x] Mệnh đề đúng thứ hai
- [ ] Mệnh đề sai

## Q3: [Câu hỏi Đúng / Sai]
> type: TRUE_FALSE
> difficulty: EASY
> explanation: Giải thích tính đúng sai của nhận định

Nhận định: Số nguyên tố chẵn duy nhất là số 2.
- [x] Đúng
- [ ] Sai

## Q4: [Câu hỏi điền đáp án ngắn]
> type: SHORT_ANSWER
> difficulty: MEDIUM
> acceptedAnswers: [4, 4.0, bốn]
> explanation: Căn bậc hai số học của 16 là 4.

Tính căn bậc hai số học của 16.

## Q5: [Câu hỏi tự luận]
> type: ESSAY
> difficulty: HARD
> rubric: Tiêu chí 1: nêu đúng định nghĩa; Tiêu chí 2: cho ví dụ minh họa
> modelAnswer: Trình bày chi tiết bài giải mẫu hoàn chỉnh tại đây...

Trình bày nội dung và phương pháp giải quyết vấn đề...
\`\`\`

---

### 3. YÊU CẦU ĐẦU RA (RẤT QUAN TRỌNG):
- CHỈ TRẢ VỀ DUY NHẤT một khối mã Markdown bên trong cặp dấu \`\`\`markdown và \`\`\`.
- TUYỆT ĐỐI KHÔNG viết thêm bất kỳ lời chào hỏi, mở đầu, hay kết luận nào ngoài khối mã Markdown.
- Đảm bảo câu hỏi có tính thực tế, phương án nhiễu hợp lý, không mơ hồ, đáp án chính xác 100%.`;
}

interface GeneratePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankTitle?: string;
  onApplyDemoTemplate?: (template: string) => void;
}

export function GeneratePromptModal({
  isOpen,
  onClose,
  bankTitle = '',
  onApplyDemoTemplate,
}: GeneratePromptModalProps) {
  const [subject, setSubject] = useState(bankTitle || 'Toán học THPT');
  const [questionCount, setQuestionCount] = useState(10);
  const [questionType, setQuestionType] = useState('ALL');
  const [difficulty, setDifficulty] = useState('BALANCED');
  const [scope, setScope] = useState('');
  const [includeExplanation, setIncludeExplanation] = useState(true);
  const [includeKaTeX, setIncludeKaTeX] = useState(true);

  const [activeTab, setActiveTab] = useState<'CONFIG' | 'PROMPT'>('CONFIG');
  const [copied, setCopied] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState('');

  if (!isOpen) return null;

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const prompt = buildQuizForgeAIPrompt({
      subject,
      questionCount,
      questionType,
      difficulty,
      scope,
      includeExplanation,
      includeKaTeX,
    });
    setGeneratedPrompt(prompt);
    setActiveTab('PROMPT');
  };

  const handleCopy = async () => {
    if (!generatedPrompt) return;
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleLoadDemo = () => {
    if (onApplyDemoTemplate) {
      // Construct a lightweight demo conforming to the current configuration
      const demo = `---
title: "${subject || 'Đề thi trắc nghiệm mẫu'}"
description: "Bộ câu hỏi mẫu theo chuẩn QuizForge"
subject: "${subject || 'Chung'}"
tags: [on-tap, de-mau]
---

## Q1: Phương trình bậc hai
> type: SINGLE_CHOICE
> difficulty: EASY
> topic: ${subject || 'Đại số'}
> explanation: Phương trình $x^2 - 4 = 0 \\Leftrightarrow x = \\pm 2$.

Nghiệm của phương trình $x^2 - 4 = 0$ là:
- [x] $x = \\pm 2$
- [ ] $x = 2$
- [ ] $x = -2$
- [ ] Vô nghiệm

## Q2: Mệnh đề toán học
> type: TRUE_FALSE
> difficulty: EASY
> explanation: Số 2 là số nguyên tố chẵn duy nhất.

Số 2 là số nguyên tố chẵn duy nhất.
- [x] Đúng
- [ ] Sai
`;
      onApplyDemoTemplate(demo);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="prompt-modal-title"
    >
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 transition-all flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 rounded-xl">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2
                id="prompt-modal-title"
                className="text-lg font-bold text-slate-900 dark:text-white"
              >
                Tạo Prompt AI sinh đề Markdown
              </h2>
              <p className="text-xs text-slate-500">
                Nhập thông số đề bài để sinh prompt chuẩn hóa cho ChatGPT, Claude, Gemini hoặc
                DeepSeek.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-5 pt-2 gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('CONFIG')}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'CONFIG'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            1. Cấu hình thông số đề
          </button>
          <button
            onClick={() => {
              if (generatedPrompt) setActiveTab('PROMPT');
            }}
            disabled={!generatedPrompt}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'PROMPT'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : !generatedPrompt
                  ? 'border-transparent text-slate-300 cursor-not-allowed'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            2. Prompt đã sinh{' '}
            {generatedPrompt && <Badge className="text-[10px] py-0 px-1">Sẵn sàng</Badge>}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'CONFIG' ? (
            <form id="prompt-config-form" onSubmit={handleGenerate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  id="prompt-subject"
                  label="Môn học / Chủ đề đề thi"
                  placeholder="Ví dụ: Toán Giải Tích 12, Lịch Sử 9..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />

                <div className="space-y-1">
                  <Input
                    id="prompt-count"
                    type="number"
                    min={1}
                    max={100}
                    label="Số lượng câu hỏi"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(parseInt(e.target.value, 10) || 1)}
                    required
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Khuyến nghị:{' '}
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      10 – 20 câu/lần
                    </span>{' '}
                    để AI sinh hoàn chỉnh và chính xác nhất.
                  </p>
                </div>
              </div>

              {/* Warning when question count is high */}
              {questionCount > 20 && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-amber-950 dark:text-amber-100">
                      Lưu ý khi tạo số lượng lớn ({questionCount} câu):
                    </p>
                    <p className="leading-relaxed text-amber-800 dark:text-amber-200">
                      Các mô hình AI (ChatGPT, Claude, Gemini) có giới hạn độ dài phản hồi trong một
                      lượt trả lời (token limit). Khi yêu cầu quá nhiều câu hỏi cùng lúc, AI có thể
                      bị ngắt quãng giữa chừng, bỏ sót phương án hoặc sinh thiếu câu so với yêu cầu.
                    </p>
                    <p className="font-medium text-amber-900 dark:text-amber-100">
                      💡 <strong>Mẹo tối ưu:</strong> Bạn nên chia nhỏ thành các đợt{' '}
                      <strong>15 – 20 câu/lần</strong> để đảm bảo AI sinh đầy đủ lời giải, công thức
                      KaTeX chuẩn xác và không bị lỗi cú pháp.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label
                    htmlFor="prompt-type"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Loại câu hỏi
                  </label>
                  <select
                    id="prompt-type"
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-indigo-600 focus:outline-hidden"
                  >
                    <option value="ALL">Đa dạng (Tất cả 5 dạng)</option>
                    <option value="MIXED_OBJECTIVE">Trắc nghiệm tổng hợp (4 dạng)</option>
                    <option value="SINGLE_CHOICE">100% Trắc nghiệm 1 đáp án</option>
                    <option value="MULTIPLE_CHOICE">100% Nhiều đáp án đúng</option>
                    <option value="TRUE_FALSE">100% Đúng / Sai</option>
                    <option value="SHORT_ANSWER">100% Trả lời ngắn</option>
                    <option value="ESSAY">100% Tự luận</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="prompt-difficulty"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Mức độ khó
                  </label>
                  <select
                    id="prompt-difficulty"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-indigo-600 focus:outline-hidden"
                  >
                    <option value="BALANCED">Cân bằng (40% Dễ, 40% Vừa, 20% Khó)</option>
                    <option value="EASY">Dễ (Nhận biết / Cơ bản)</option>
                    <option value="MEDIUM">Trung bình (Vận dụng)</option>
                    <option value="HARD">Khó (Vận dụng cao / Phân loại)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="prompt-scope"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Phạm vi kiến thức & Yêu cầu trọng tâm (Tùy chọn)
                </label>
                <textarea
                  id="prompt-scope"
                  rows={3}
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  placeholder="Ví dụ: Đạo hàm hàm đa thức, bảng biến thiên, cực trị; có ít nhất 2 câu hỏi dạng đồ thị; sử dụng ký hiệu Toán học KaTeX chuẩn..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-600 focus:outline-hidden"
                />
              </div>

              <div className="flex flex-wrap gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300 select-none">
                  <input
                    type="checkbox"
                    checked={includeExplanation}
                    onChange={(e) => setIncludeExplanation(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Yêu cầu lời giải chi tiết (explanation)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300 select-none">
                  <input
                    type="checkbox"
                    checked={includeKaTeX}
                    onChange={(e) => setIncludeKaTeX(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Quy chuẩn công thức KaTeX ($...$ và $$...$$)</span>
                </label>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>Sao chép prompt dưới đây và dán vào ChatGPT / Claude / Gemini:</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopy}
                  className="h-8 text-xs font-semibold"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                      Đã sao chép!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 mr-1" />
                      Sao chép Prompt
                    </>
                  )}
                </Button>
              </div>

              <div className="relative">
                <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono max-h-96 overflow-y-auto whitespace-pre-wrap leading-relaxed select-all">
                  {generatedPrompt}
                </pre>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  Sau khi AI sinh xong câu trả lời, bạn chỉ cần sao chép toàn bộ khối mã Markdown và
                  dán vào khung soạn thảo ở màn hình bên trái để hệ thống tự động phân tích và nhập
                  đề!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            {onApplyDemoTemplate && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleLoadDemo}
                className="text-xs text-slate-600 hover:text-slate-900"
              >
                <FileText className="w-3.5 h-3.5 mr-1 text-slate-500" />
                Dán nhanh mẫu demo
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'PROMPT' ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('CONFIG')}
                >
                  Điều chỉnh thông số
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleCopy}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-1.5" />
                      Đã sao chép!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1.5" />
                      Sao chép Prompt
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="outline" size="sm" onClick={onClose}>
                  Đóng
                </Button>
                <Button
                  form="prompt-config-form"
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Sparkles className="w-4 h-4 mr-1.5 text-amber-300" />
                  Sinh Prompt AI
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
