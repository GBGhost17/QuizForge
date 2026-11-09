import { z } from 'zod';
import { DifficultyEnum, QuestionTypeEnum } from './question-bank';

export const MarkdownImportParseSchema = z.object({
  content: z
    .string({ required_error: 'Nội dung Markdown không được để trống' })
    .min(1, 'Nội dung Markdown không được để trống')
    .max(2 * 1024 * 1024, 'Kích thước tệp Markdown vượt quá giới hạn tối đa (2MB)'),
});

export type MarkdownImportParseInput = z.infer<typeof MarkdownImportParseSchema>;

export const MarkdownFrontmatterSchema = z.object({
  title: z.string().trim().max(200, 'Tiêu đề không được vượt quá 200 ký tự').optional(),
  description: z.string().trim().max(2000, 'Mô tả không được vượt quá 2000 ký tự').optional(),
  subject: z.string().trim().max(100, 'Chủ đề môn học không được vượt quá 100 ký tự').optional(),
  tags: z.array(z.string().trim().max(50)).optional(),
});

export type MarkdownFrontmatterInput = z.infer<typeof MarkdownFrontmatterSchema>;

export const ParsedOptionSchema = z.object({
  text: z.string().trim().min(1, 'Nội dung đáp án không được để trống'),
  isCorrect: z.boolean(),
  explanation: z.string().trim().nullable().optional(),
  order: z.number().int().min(0).optional(),
});

export const ParsedRubricSchema = z
  .object({
    modelAnswer: z.string().trim().optional(),
    acceptedAnswers: z.array(z.string().trim()).optional(),
    criteria: z
      .array(
        z.object({
          description: z.string().trim().min(1, 'Mô tả tiêu chí không được để trống'),
          points: z.number().positive('Điểm tiêu chí phải lớn hơn 0'),
        }),
      )
      .optional(),
  })
  .nullable()
  .optional();

export const ParsedQuestionSchema = z.object({
  type: QuestionTypeEnum,
  prompt: z
    .string({ required_error: 'Nội dung câu hỏi không được để trống' })
    .trim()
    .min(1, 'Nội dung câu hỏi không được để trống')
    .max(10000, 'Nội dung câu hỏi không được vượt quá 10,000 ký tự'),
  topic: z.string().trim().max(100, 'Chủ đề không được vượt quá 100 ký tự').nullable().optional(),
  tags: z.array(z.string().trim().max(50)).optional(),
  options: z.array(ParsedOptionSchema).optional(),
  rubric: ParsedRubricSchema,
  explanation: z.string().trim().nullable().optional(),
  defaultPoints: z.number().positive('Điểm mặc định phải lớn hơn 0').default(1.0),
  difficulty: DifficultyEnum.default('MEDIUM'),
  rawSourceLine: z.number().int().positive(),
});

export type ParsedQuestionItem = z.infer<typeof ParsedQuestionSchema>;

export const MarkdownImportCommitSchema = z.object({
  bankId: z
    .string({ required_error: 'Mã ngân hàng câu hỏi không được để trống' })
    .min(1, 'Mã ngân hàng câu hỏi không được để trống'),
  questions: z
    .array(ParsedQuestionSchema)
    .min(1, 'Danh sách câu hỏi cần nhập phải có ít nhất 1 câu hỏi'),
});

export type MarkdownImportCommitInput = z.infer<typeof MarkdownImportCommitSchema>;
