import { Injectable } from '@nestjs/common';
import type {
  Difficulty,
  ImportDiagnostic,
  MarkdownImportResult,
  ParsedQuestion,
  QuestionType,
} from '@quizforge/shared-types';
import { MarkdownFrontmatterSchema } from '@quizforge/validation';

interface AstNode {
  type: string;
  depth?: number;
  value?: string;
  lang?: string;
  url?: string;
  checked?: boolean | null;
  position?: {
    start: {
      line: number;
      column?: number;
    };
    end?: {
      line: number;
      column?: number;
    };
  };
  children?: AstNode[];
}

interface MarkdownProcessor {
  parse: (content: string) => AstNode;
}

interface ParsedOption {
  text: string;
  isCorrect: boolean;
  explanation?: string | null;
  order: number;
}

interface QuestionMetadata {
  type: string;
  difficulty: string;
  points: number;
  topic: string | null;
  tags: string[];
  explanation: string | null;
  acceptedAnswers: string[];
  modelAnswer: string | null;
  criteria: Array<{ description: string; points: number }>;
  rubric?: string;
  answer?: string;
}

@Injectable()
export class MarkdownParserService {
  private processorPromise: Promise<MarkdownProcessor> | null = null;

  /**
   * Lazily initializes and caches the unified/remark pipeline.
   */
  private async getProcessor(): Promise<MarkdownProcessor> {
    if (!this.processorPromise) {
      this.processorPromise = (async () => {
        const { unified } = await import('unified');
        const remarkParse = (await import('remark-parse')).default;
        const remarkMath = (await import('remark-math')).default;

        return unified().use(remarkParse).use(remarkMath) as unknown as MarkdownProcessor;
      })();
    }
    return this.processorPromise;
  }

  /**
   * Parses raw markdown text into structured question bank items with line-level diagnostics.
   */
  async parse(content: string): Promise<MarkdownImportResult> {
    const diagnostics: ImportDiagnostic[] = [];
    const questions: ParsedQuestion[] = [];
    let title: string | undefined;
    let description: string | undefined;
    let subject: string | undefined;
    let tags: string[] | undefined;

    if (!content || !content.trim()) {
      diagnostics.push({
        line: 1,
        severity: 'ERROR',
        message: 'Tệp Markdown rỗng, không chứa nội dung.',
        remediation: 'Thêm nội dung và câu hỏi theo định dạng QuizForge.',
      });
      return {
        questions: [],
        diagnostics,
        totalQuestions: 0,
        validQuestionsCount: 0,
        hasErrors: true,
      };
    }

    // Security check: Detect malicious executable HTML or scripts
    this.scanSecurityVulnerabilities(content, diagnostics);

    // 1. Process Frontmatter (YAML) if present at start
    let markdownBody = content;
    const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
    if (frontmatterMatch) {
      const rawYaml = frontmatterMatch[1] || '';
      const frontmatterLines = frontmatterMatch[0].split(/\r?\n/).length - 1;
      const frontmatterData = await this.parseFrontmatterText(rawYaml, 1, diagnostics);
      if (frontmatterData) {
        title = frontmatterData.title;
        description = frontmatterData.description;
        subject = frontmatterData.subject;
        tags = frontmatterData.tags;
      }
      // Replace frontmatter with equivalent newlines to keep exact line numbering!
      const emptyLines = '\n'.repeat(frontmatterLines);
      markdownBody = emptyLines + content.slice(frontmatterMatch[0].length);
    }

    const processor = await this.getProcessor();
    const tree = processor.parse(markdownBody);

    let currentQuestionNodes: AstNode[] = [];
    let currentHeadingNode: AstNode | null = null;
    let questionIndex = 0;

    for (const node of tree.children || []) {
      // Identify Question Headings (Level 2: ## Q1: ... or ## ...)
      if (node.type === 'heading' && node.depth === 2) {
        if (currentHeadingNode) {
          questionIndex++;
          this.processQuestionBlock(
            currentHeadingNode,
            currentQuestionNodes,
            questionIndex,
            questions,
            diagnostics,
          );
        }
        currentHeadingNode = node;
        currentQuestionNodes = [];
        continue;
      }

      // Accumulate nodes for the current question
      if (currentHeadingNode) {
        currentQuestionNodes.push(node);
      }
    }

    // Process the final question block if present
    if (currentHeadingNode) {
      questionIndex++;
      this.processQuestionBlock(
        currentHeadingNode,
        currentQuestionNodes,
        questionIndex,
        questions,
        diagnostics,
      );
    }

    // Check if any questions were found
    if (questionIndex === 0) {
      diagnostics.push({
        line: 1,
        severity: 'ERROR',
        message: 'Không tìm thấy câu hỏi nào trong tệp Markdown.',
        remediation:
          'Mỗi câu hỏi phải bắt đầu bằng tiêu đề cấp 2 (ví dụ: "## Q1: Nội dung câu hỏi").',
      });
    }

    const hasErrors = diagnostics.some((d) => d.severity === 'ERROR');

    return {
      title,
      description,
      subject,
      tags,
      questions,
      diagnostics,
      totalQuestions: questionIndex,
      validQuestionsCount: questions.length,
      hasErrors,
    };
  }

  /**
   * Scans content for dangerous HTML/JavaScript injection.
   */
  private scanSecurityVulnerabilities(content: string, diagnostics: ImportDiagnostic[]): void {
    const lines = content.split(/\r?\n/);
    const dangerousPatterns = [
      {
        regex: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        msg: 'Phát hiện thẻ <script>',
      },
      { regex: /on\w+\s*=/gi, msg: 'Phát hiện thuộc tính sự kiện HTML (onload, onerror,...)' },
      { regex: /javascript:\s*/gi, msg: 'Phát hiện đường dẫn javascript: không an toàn' },
    ];

    lines.forEach((lineText, idx) => {
      const lineNum = idx + 1;
      for (const pattern of dangerousPatterns) {
        if (pattern.regex.test(lineText)) {
          diagnostics.push({
            line: lineNum,
            severity: 'ERROR',
            message: `${pattern.msg}. Markdown không được chứa mã thực thi nguy hiểm.`,
            remediation: 'Xóa các thẻ mã độc hoặc thẻ script ra khỏi nội dung câu hỏi.',
          });
        }
      }
    });
  }

  /**
   * Parses raw YAML frontmatter text safely.
   */
  private async parseFrontmatterText(
    rawYaml: string,
    line: number,
    diagnostics: ImportDiagnostic[],
  ): Promise<{ title?: string; description?: string; subject?: string; tags?: string[] } | null> {
    try {
      const yaml = await import('yaml');
      const raw = yaml.parse(rawYaml);
      if (!raw || typeof raw !== 'object') {
        return null;
      }

      const validated = MarkdownFrontmatterSchema.safeParse(raw);
      if (!validated.success) {
        diagnostics.push({
          line,
          severity: 'WARNING',
          message: `Lỗi Frontmatter: ${validated.error.errors[0]?.message}`,
          remediation: 'Kiểm tra lại định dạng YAML trong khối ---',
        });
        return null;
      }

      return validated.data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      diagnostics.push({
        line,
        severity: 'WARNING',
        message: `Không thể phân tích cú pháp YAML Frontmatter: ${message}`,
        remediation: 'Đảm bảo cú pháp YAML hợp lệ giữa hai dòng "---".',
      });
      return null;
    }
  }

  /**
   * Processes a single question block delimited by an h2 heading.
   */
  private processQuestionBlock(
    headingNode: AstNode,
    bodyNodes: AstNode[],
    questionIndex: number,
    questions: ParsedQuestion[],
    diagnostics: ImportDiagnostic[],
  ): void {
    const headingLine = headingNode.position?.start?.line ?? 1;
    const headingText = this.extractTextFromNode(headingNode).trim();

    // Clean up title (remove "Q1:", "Q1.", "Câu 1:", "Câu 1.")
    const promptPrefixRegex = /^(?:Q\d+[:.]|Câu\s*\d+[:.])\s*/i;
    const promptTitle = headingText.replace(promptPrefixRegex, '').trim();

    const metadata: QuestionMetadata = {
      type: 'SINGLE_CHOICE',
      difficulty: 'MEDIUM',
      points: 1.0,
      topic: null,
      tags: [],
      explanation: null,
      acceptedAnswers: [],
      modelAnswer: null,
      criteria: [],
    };

    const promptParagraphs: string[] = [];
    const options: Array<{
      text: string;
      isCorrect: boolean;
      explanation?: string | null;
      order: number;
    }> = [];

    // Traverse body nodes
    for (const bodyNode of bodyNodes) {
      // 1. Blockquote can be metadata or explanation or prompt
      if (bodyNode.type === 'blockquote') {
        this.extractMetadataFromBlockquote(bodyNode, metadata, promptParagraphs);
        continue;
      }

      // 2. Lists contain choice options
      if (bodyNode.type === 'list') {
        this.extractOptionsFromList(bodyNode, options);
        continue;
      }

      // 3. Math block ($$ ... $$)
      if (bodyNode.type === 'math') {
        promptParagraphs.push(`$$${bodyNode.value}$$`);
        continue;
      }

      // 4. Code block
      if (bodyNode.type === 'code') {
        const lang = bodyNode.lang || '';
        promptParagraphs.push(`\`\`\`${lang}\n${bodyNode.value}\n\`\`\``);
        continue;
      }

      // 5. Paragraph
      if (bodyNode.type === 'paragraph') {
        const text = this.extractTextFromNode(bodyNode).trim();
        // Check if paragraph is single-line metadata like "Type: MULTIPLE_CHOICE"
        if (this.isMetadataLine(text)) {
          this.parseMetadataLine(text, metadata);
        } else {
          promptParagraphs.push(text);
        }
      }
    }

    // Build the full prompt: if promptTitle has content, combine with paragraphs
    let fullPrompt = promptTitle;
    if (promptParagraphs.length > 0) {
      if (fullPrompt) {
        fullPrompt = `${fullPrompt}\n\n${promptParagraphs.join('\n\n')}`;
      } else {
        fullPrompt = promptParagraphs.join('\n\n');
      }
    }
    fullPrompt = fullPrompt.trim();

    // Validate prompt
    if (!fullPrompt) {
      diagnostics.push({
        line: headingLine,
        severity: 'ERROR',
        message: `Câu hỏi số ${questionIndex} không có nội dung đề bài.`,
        remediation: 'Thêm nội dung đề bài vào sau tiêu đề "##".',
        questionIndex,
      });
      return;
    }

    // Validate type
    const validTypes: QuestionType[] = [
      'SINGLE_CHOICE',
      'MULTIPLE_CHOICE',
      'TRUE_FALSE',
      'SHORT_ANSWER',
      'ESSAY',
    ];
    const questionType = (metadata.type || 'SINGLE_CHOICE').toUpperCase() as QuestionType;
    if (!validTypes.includes(questionType)) {
      diagnostics.push({
        line: headingLine,
        severity: 'ERROR',
        message: `Loại câu hỏi "${metadata.type}" không hợp lệ.`,
        remediation:
          'Chọn 1 trong 5 loại: SINGLE_CHOICE, MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER, ESSAY.',
        questionIndex,
      });
      return;
    }

    // Validate difficulty
    const validDifficulties: Difficulty[] = ['EASY', 'MEDIUM', 'HARD'];
    const difficulty = (metadata.difficulty || 'MEDIUM').toUpperCase() as Difficulty;
    const finalDifficulty = validDifficulties.includes(difficulty) ? difficulty : 'MEDIUM';

    // Type-specific validation
    let hasTypeError = false;

    if (questionType === 'SINGLE_CHOICE') {
      if (options.length < 2) {
        diagnostics.push({
          line: headingLine,
          severity: 'ERROR',
          message: `Câu hỏi trắc nghiệm một lựa chọn cần ít nhất 2 phương án. Hiện có: ${options.length}.`,
          remediation: 'Thêm phương án lựa chọn bằng danh sách "- [ ]" hoặc "- [x]".',
          questionIndex,
        });
        hasTypeError = true;
      }
      const correctCount = options.filter((o) => o.isCorrect).length;
      if (correctCount !== 1) {
        diagnostics.push({
          line: headingLine,
          severity: 'ERROR',
          message: `Câu hỏi SINGLE_CHOICE phải có chính xác 1 đáp án đúng ([x]). Hiện có: ${correctCount} đáp án đúng.`,
          remediation: 'Đánh dấu duy nhất 1 phương án đúng bằng ký hiệu "- [x] ...".',
          questionIndex,
        });
        hasTypeError = true;
      }
    } else if (questionType === 'MULTIPLE_CHOICE') {
      if (options.length < 2) {
        diagnostics.push({
          line: headingLine,
          severity: 'ERROR',
          message: `Câu hỏi trắc nghiệm nhiều lựa chọn cần ít nhất 2 phương án. Hiện có: ${options.length}.`,
          remediation: 'Thêm các phương án lựa chọn bằng "- [ ]" hoặc "- [x]".',
          questionIndex,
        });
        hasTypeError = true;
      }
      const correctCount = options.filter((o) => o.isCorrect).length;
      if (correctCount < 1) {
        diagnostics.push({
          line: headingLine,
          severity: 'ERROR',
          message: `Câu hỏi MULTIPLE_CHOICE phải có ít nhất 1 đáp án đúng ([x]).`,
          remediation: 'Đánh dấu ít nhất 1 phương án đúng bằng ký hiệu "- [x] ...".',
          questionIndex,
        });
        hasTypeError = true;
      }
    } else if (questionType === 'TRUE_FALSE') {
      // If no options provided, synthesize from answer metadata if present
      if (options.length === 0 && metadata.answer !== undefined) {
        const isTrue =
          String(metadata.answer).toLowerCase() === 'true' ||
          String(metadata.answer).toLowerCase() === 'đúng' ||
          String(metadata.answer) === '1';
        options.push(
          { text: 'Đúng', isCorrect: isTrue, order: 0 },
          { text: 'Sai', isCorrect: !isTrue, order: 1 },
        );
      } else if (options.length !== 2) {
        diagnostics.push({
          line: headingLine,
          severity: 'ERROR',
          message: `Câu hỏi Đúng/Sai cần chính xác 2 phương án (Đúng và Sai). Hiện có: ${options.length}.`,
          remediation:
            'Định nghĩa 2 phương án: "- [x] Đúng" và "- [ ] Sai", hoặc dùng "> answer: true".',
          questionIndex,
        });
        hasTypeError = true;
      } else {
        const correctCount = options.filter((o) => o.isCorrect).length;
        if (correctCount !== 1) {
          diagnostics.push({
            line: headingLine,
            severity: 'ERROR',
            message: `Câu hỏi Đúng/Sai phải có chính xác 1 phương án đúng.`,
            remediation: 'Đánh dấu duy nhất một phương án bằng "- [x]".',
            questionIndex,
          });
          hasTypeError = true;
        }
      }
    } else if (questionType === 'SHORT_ANSWER') {
      // Extract from acceptedAnswers metadata or options
      let answers: string[] = metadata.acceptedAnswers || [];
      if (answers.length === 0 && options.length > 0) {
        answers = options.map((o) => o.text);
      }
      if (answers.length === 0 && metadata.answer) {
        answers = String(metadata.answer)
          .split(/[,;\n]/)
          .map((s) => s.trim())
          .filter(Boolean);
      }
      if (answers.length === 0) {
        diagnostics.push({
          line: headingLine,
          severity: 'ERROR',
          message: `Câu hỏi điền ngắn (SHORT_ANSWER) phải có ít nhất 1 đáp án chấp nhận.`,
          remediation: 'Thêm "> acceptedAnswers: [đáp án 1, đáp án 2]" hoặc "- [x] đáp án".',
          questionIndex,
        });
        hasTypeError = true;
      } else {
        metadata.acceptedAnswers = answers;
      }
    } else if (questionType === 'ESSAY') {
      // Rubric and model answer are optional but recommended
      if (!metadata.rubric && !metadata.modelAnswer) {
        diagnostics.push({
          line: headingLine,
          severity: 'INFO',
          message: `Câu hỏi tự luận chưa có hướng dẫn chấm hoặc lời giải mẫu.`,
          remediation:
            'Khuyến nghị thêm "> rubric: ..." hoặc "> modelAnswer: ..." để hỗ trợ chấm thi.',
          questionIndex,
        });
      }
    }

    if (hasTypeError) {
      return;
    }

    // Build Rubric structure if relevant
    let rubricObj: ParsedQuestion['rubric'] = null;
    if (questionType === 'ESSAY') {
      rubricObj = {
        modelAnswer: metadata.modelAnswer || undefined,
        criteria: metadata.criteria?.length ? metadata.criteria : undefined,
      };
    } else if (questionType === 'SHORT_ANSWER') {
      rubricObj = {
        acceptedAnswers: metadata.acceptedAnswers || [],
      };
    }

    questions.push({
      type: questionType,
      prompt: fullPrompt,
      topic: metadata.topic || null,
      tags: Array.isArray(metadata.tags) ? metadata.tags : [],
      options: options.length > 0 ? options : undefined,
      rubric: rubricObj,
      explanation: metadata.explanation || null,
      defaultPoints: Number(metadata.points) > 0 ? Number(metadata.points) : 1.0,
      difficulty: finalDifficulty,
      rawSourceLine: headingLine,
    });
  }

  /**
   * Extracts choices and options from remark list node.
   */
  private extractOptionsFromList(listNode: AstNode, options: ParsedOption[]): void {
    let order = options.length;
    for (const item of listNode.children || []) {
      if (item.type !== 'listItem') continue;

      let isCorrect = item.checked === true;
      let rawText = this.extractTextFromNode(item).trim();

      // Support manual bracket markers: [x] or [ ] or (*) or ( )
      const checkedRegex = /^\[x\]\s*/i;
      const uncheckedRegex = /^\[\s*\]\s*/i;
      const parenCheckedRegex = /^\(\*\)\s*/i;
      const parenUncheckedRegex = /^\(\s*\)\s*/i;

      if (checkedRegex.test(rawText)) {
        isCorrect = true;
        rawText = rawText.replace(checkedRegex, '');
      } else if (uncheckedRegex.test(rawText)) {
        isCorrect = false;
        rawText = rawText.replace(uncheckedRegex, '');
      } else if (parenCheckedRegex.test(rawText)) {
        isCorrect = true;
        rawText = rawText.replace(parenCheckedRegex, '');
      } else if (parenUncheckedRegex.test(rawText)) {
        isCorrect = false;
        rawText = rawText.replace(parenUncheckedRegex, '');
      }

      // Check for inline explanation: "Option text // Explanation"
      let explanation: string | null = null;
      if (rawText.includes('//')) {
        const parts = rawText.split('//');
        rawText = parts[0]?.trim() || '';
        explanation = parts.slice(1).join('//').trim();
      }

      if (rawText) {
        options.push({
          text: rawText,
          isCorrect,
          explanation: explanation || null,
          order: order++,
        });
      }
    }
  }

  /**
   * Extracts metadata attributes from blockquote nodes.
   */
  private extractMetadataFromBlockquote(
    blockquoteNode: AstNode,
    metadata: QuestionMetadata,
    promptParagraphs: string[],
  ): void {
    const text = this.extractTextFromNode(blockquoteNode).trim();
    const lines = text.split(/\r?\n/);
    let isPureMetadata = false;
    let currentMetadataKey: string | null = null;

    for (const line of lines) {
      const trimmed = line.replace(/^>\s*/, '').trim();
      if (this.isMetadataLine(trimmed)) {
        this.parseMetadataLine(trimmed, metadata);
        isPureMetadata = true;
        const clean = trimmed.replace(/^\*{1,2}|\*{1,2}$/g, '').trim();
        const match = clean.match(/^([a-z]+)\s*:/i);
        currentMetadataKey = match ? match[1]?.toLowerCase() || null : null;
      } else if (currentMetadataKey && isPureMetadata && trimmed) {
        if (currentMetadataKey === 'explanation' && metadata.explanation) {
          metadata.explanation += '\n' + trimmed;
        } else if (currentMetadataKey === 'modelanswer' && metadata.modelAnswer) {
          metadata.modelAnswer += '\n' + trimmed;
        } else if (currentMetadataKey === 'rubric' && metadata.rubric) {
          metadata.rubric += '\n' + trimmed;
        }
      }
    }

    if (!isPureMetadata && text) {
      // It's a standard quote intended as prompt body
      promptParagraphs.push(`> ${text}`);
    }
  }

  /**
   * Tests if a line matches key: value metadata patterns.
   */
  private isMetadataLine(line: string): boolean {
    const clean = line.replace(/^\*{1,2}|\*{1,2}$/g, '').trim();
    const match = clean.match(
      /^(type|difficulty|points|defaultpoints|topic|tags|explanation|rubric|modelanswer|acceptedanswers|answer)\s*:\s*(.+)$/i,
    );
    return Boolean(match);
  }

  /**
   * Parses a single metadata line into the metadata dictionary.
   */
  private parseMetadataLine(line: string, metadata: QuestionMetadata): void {
    const clean = line.replace(/^\*{1,2}|\*{1,2}$/g, '').trim();
    const match = clean.match(
      /^(type|difficulty|points|defaultpoints|topic|tags|explanation|rubric|modelanswer|acceptedanswers|answer)\s*:\s*(.+)$/i,
    );
    if (!match) return;

    const key = match[1]?.toLowerCase() ?? '';
    const val = match[2]?.trim() ?? '';

    switch (key) {
      case 'type':
        metadata.type = val;
        break;
      case 'difficulty':
        metadata.difficulty = val;
        break;
      case 'points':
      case 'defaultpoints':
        metadata.points = parseFloat(val) || 1.0;
        break;
      case 'topic':
        metadata.topic = val;
        break;
      case 'tags':
        metadata.tags = val
          .replace(/[[\]]/g, '')
          .split(/[,;]/)
          .map((t) => t.trim())
          .filter(Boolean);
        break;
      case 'explanation':
        metadata.explanation = val;
        break;
      case 'rubric':
        metadata.rubric = val;
        break;
      case 'modelanswer':
        metadata.modelAnswer = val;
        break;
      case 'acceptedanswers':
        metadata.acceptedAnswers = val
          .replace(/[[\]]/g, '')
          .split(/[,;]/)
          .map((t) => t.trim().replace(/^['"]|['"]$/g, ''))
          .filter(Boolean);
        break;
      case 'answer':
        metadata.answer = val;
        break;
    }
  }

  /**
   * Helper extracting recursive markdown text from MDAST node preserving rich formatting and math.
   */
  private extractTextFromNode(node: AstNode): string {
    if (!node) return '';
    if (node.type === 'text') return node.value || '';
    if (node.type === 'break') return '\n';
    if (node.type === 'inlineMath') return `$${node.value}$`;
    if (node.type === 'math') return `$$${node.value}$$`;
    if (node.type === 'inlineCode') return `\`${node.value}\``;
    if (node.type === 'code') {
      const lang = node.lang ? node.lang : '';
      return `\`\`\`${lang}\n${node.value || ''}\n\`\`\``;
    }
    if (node.type === 'strong') {
      const inner = Array.isArray(node.children)
        ? node.children.map((child: AstNode) => this.extractTextFromNode(child)).join('')
        : node.value || '';
      return `**${inner}**`;
    }
    if (node.type === 'emphasis') {
      const inner = Array.isArray(node.children)
        ? node.children.map((child: AstNode) => this.extractTextFromNode(child)).join('')
        : node.value || '';
      return `*${inner}*`;
    }
    if (node.type === 'delete') {
      const inner = Array.isArray(node.children)
        ? node.children.map((child: AstNode) => this.extractTextFromNode(child)).join('')
        : node.value || '';
      return `~~${inner}~~`;
    }
    if (node.type === 'link') {
      const text = Array.isArray(node.children)
        ? node.children.map((child: AstNode) => this.extractTextFromNode(child)).join('')
        : node.value || '';
      return `[${text}](${node.url || ''})`;
    }

    if (Array.isArray(node.children)) {
      return node.children.map((child: AstNode) => this.extractTextFromNode(child)).join('');
    }
    return node.value || '';
  }
}
