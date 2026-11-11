import { z } from 'zod';

export const QuestionTypeEnum = z.enum([
  'SINGLE_CHOICE',
  'MULTIPLE_CHOICE',
  'TRUE_FALSE',
  'SHORT_ANSWER',
  'ESSAY',
]);

export const DifficultyEnum = z.enum(['EASY', 'MEDIUM', 'HARD']);

// ---------------------------------------------------------
// QUESTION BANK SCHEMAS
// ---------------------------------------------------------

export const CreateQuestionBankSchema = z.object({
  title: z
    .string({ required_error: 'Tiêu đề ngân hàng câu hỏi không được để trống' })
    .trim()
    .min(1, 'Tiêu đề ngân hàng câu hỏi không được để trống')
    .max(200, 'Tiêu đề không được vượt quá 200 ký tự'),
  description: z.string().trim().max(2000, 'Mô tả không được vượt quá 2000 ký tự').optional(),
});

export type CreateQuestionBankInput = z.infer<typeof CreateQuestionBankSchema>;

export const UpdateQuestionBankSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Tiêu đề ngân hàng câu hỏi không được để trống')
    .max(200, 'Tiêu đề không được vượt quá 200 ký tự')
    .optional(),
  description: z.string().trim().max(2000, 'Mô tả không được vượt quá 2000 ký tự').optional(),
  isArchived: z.boolean().optional(),
});

export type UpdateQuestionBankInput = z.infer<typeof UpdateQuestionBankSchema>;

export const QuestionBankQuerySchema = z.object({
  q: z.string().trim().optional(),
  isArchived: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .or(z.boolean())
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export type QuestionBankQueryInput = z.infer<typeof QuestionBankQuerySchema>;

// ---------------------------------------------------------
// QUESTION OPTION & RUBRIC SCHEMAS
// ---------------------------------------------------------

export const QuestionOptionSchema = z.object({
  id: z.string().optional(),
  text: z
    .string({ required_error: 'Nội dung lựa chọn không được để trống' })
    .trim()
    .min(1, 'Nội dung lựa chọn không được để trống'),
  isCorrect: z.boolean().default(false),
  explanation: z.string().trim().optional().nullable(),
  order: z.number().int().min(0).default(0),
});

export type QuestionOptionInput = z.infer<typeof QuestionOptionSchema>;

export const RubricCriterionSchema = z.object({
  description: z.string().trim().min(1, 'Mô tả tiêu chí không được để trống'),
  points: z.number().positive('Điểm tiêu chí phải lớn hơn 0'),
});

export const QuestionRubricSchema = z.object({
  criteria: z.array(RubricCriterionSchema).optional(),
  modelAnswer: z.string().trim().optional(),
  acceptedAnswers: z
    .array(z.string().trim().min(1, 'Câu trả lời mẫu không được để trống'))
    .optional(),
  caseSensitive: z.boolean().default(false),
});

export type QuestionRubricInput = z.infer<typeof QuestionRubricSchema>;

// ---------------------------------------------------------
// QUESTION VALIDATION & REFINEMENTS
// ---------------------------------------------------------

const RawQuestionSchema = z.object({
  prompt: z
    .string({ required_error: 'Nội dung câu hỏi không được để trống' })
    .trim()
    .min(1, 'Nội dung câu hỏi không được để trống'),
  type: QuestionTypeEnum,
  difficulty: DifficultyEnum.default('MEDIUM'),
  defaultPoints: z.coerce.number().positive('Điểm câu hỏi phải lớn hơn 0').default(1.0),
  topic: z.string().trim().max(100, 'Chủ đề không quá 100 ký tự').optional().nullable(),
  tags: z.array(z.string().trim()).default([]),
  explanation: z.string().trim().optional().nullable(),
  rubric: QuestionRubricSchema.optional().nullable(),
  options: z.array(QuestionOptionSchema).default([]),
});

/**
 * Validates question options and rubric based on the question type.
 */
export const validateQuestionByType = (
  data: z.infer<typeof RawQuestionSchema>,
  ctx: z.RefinementCtx,
): void => {
  const { type, options, rubric } = data;

  if (type === 'SINGLE_CHOICE') {
    if (!options || options.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['options'],
        message: 'Câu hỏi một lựa chọn phải có ít nhất 2 đáp án',
      });
      return;
    }
    const correctCount = options.filter((o) => o.isCorrect).length;
    if (correctCount !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['options'],
        message: 'Câu hỏi một lựa chọn phải có chính xác 1 đáp án đúng',
      });
    }
  } else if (type === 'MULTIPLE_CHOICE') {
    if (!options || options.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['options'],
        message: 'Câu hỏi nhiều lựa chọn phải có ít nhất 2 đáp án',
      });
      return;
    }
    const correctCount = options.filter((o) => o.isCorrect).length;
    if (correctCount < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['options'],
        message: 'Câu hỏi nhiều lựa chọn phải có ít nhất 1 đáp án đúng',
      });
    }
  } else if (type === 'TRUE_FALSE') {
    if (!options || options.length !== 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['options'],
        message: 'Câu hỏi đúng/sai phải có chính xác 2 lựa chọn (Đúng và Sai)',
      });
      return;
    }
    const correctCount = options.filter((o) => o.isCorrect).length;
    if (correctCount !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['options'],
        message: 'Câu hỏi đúng/sai phải có chính xác 1 đáp án đúng',
      });
    }
  } else if (type === 'SHORT_ANSWER') {
    const hasCorrectOption =
      options && options.some((o) => o.isCorrect && o.text.trim().length > 0);
    const hasAcceptedRubric = rubric?.acceptedAnswers && rubric.acceptedAnswers.length > 0;
    if (!hasCorrectOption && !hasAcceptedRubric) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['options'],
        message: 'Câu hỏi trả lời ngắn phải có ít nhất 1 đáp án được chấp nhận',
      });
    }
  }
};

export const CreateQuestionSchema = RawQuestionSchema.superRefine(validateQuestionByType);
export type CreateQuestionInput = z.infer<typeof CreateQuestionSchema>;

export const UpdateQuestionSchema = RawQuestionSchema.partial()
  .extend({
    isArchived: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    // If type and options are provided in update, validate consistency
    if (data.type && data.options) {
      validateQuestionByType(data as z.infer<typeof RawQuestionSchema>, ctx);
    }
  });

export type UpdateQuestionInput = z.infer<typeof UpdateQuestionSchema>;

export const QuestionQuerySchema = z.object({
  q: z.string().trim().optional(),
  type: QuestionTypeEnum.optional(),
  difficulty: DifficultyEnum.optional(),
  topic: z.string().trim().optional(),
  isArchived: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .or(z.boolean())
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type QuestionQueryInput = z.infer<typeof QuestionQuerySchema>;

export const DuplicateCheckItemSchema = z.object({
  prompt: z.string().trim().min(1, 'Nội dung câu hỏi không được để trống'),
  type: QuestionTypeEnum.optional(),
  options: z
    .array(
      z.object({
        text: z.string(),
        isCorrect: z.boolean().optional(),
      }),
    )
    .optional(),
});

export const CheckDuplicatesSchema = z.object({
  questions: z
    .array(DuplicateCheckItemSchema)
    .min(1, 'Danh sách câu hỏi cần kiểm tra không được rỗng'),
  threshold: z.number().min(0.1).max(1.0).optional().default(0.85),
});

export type CheckDuplicatesInput = z.infer<typeof CheckDuplicatesSchema>;
