import { z } from 'zod';

export const TestModeSchema = z.enum(['ASSIGNMENT', 'PRACTICE', 'LIVE']);

export const TestStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED']);

export const ResultReleaseModeSchema = z.enum(['ON_FINALIZATION', 'AFTER_ALL_GRADED', 'MANUAL']);

export const SessionStatusSchema = z.enum(['UPCOMING', 'ACTIVE', 'ENDED']);

export const CreateTestSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Tiêu đề bài thi không được để trống')
    .max(255, 'Tiêu đề không được vượt quá 255 ký tự'),
  description: z.string().trim().max(2000, 'Mô tả không được vượt quá 2000 ký tự').optional(),
  instructions: z.string().trim().max(5000, 'Hướng dẫn không được vượt quá 5000 ký tự').optional(),
  mode: TestModeSchema.default('ASSIGNMENT'),
  timeLimitMinutes: z
    .number()
    .int('Thời gian làm bài phải là số nguyên phút')
    .min(1, 'Thời gian làm bài tối thiểu là 1 phút')
    .max(1440, 'Thời gian làm bài tối đa là 24 giờ (1440 phút)')
    .nullable()
    .optional(),
  maxAttempts: z
    .number()
    .int('Số lần làm bài phải là số nguyên')
    .min(1, 'Số lần làm bài tối thiểu là 1')
    .max(100, 'Số lần làm bài tối đa là 100')
    .default(1),
  shuffleQuestions: z.boolean().default(false),
  shuffleOptions: z.boolean().default(false),
  releaseMode: ResultReleaseModeSchema.default('ON_FINALIZATION'),
  passScore: z.number().min(0, 'Điểm đạt không được nhỏ hơn 0').nullable().optional(),
});

export const UpdateTestSchema = CreateTestSchema.partial().extend({
  status: TestStatusSchema.optional(),
});

export const AddQuestionToTestSchema = z.object({
  questionId: z.string().uuid('ID câu hỏi không hợp lệ'),
  points: z
    .number()
    .min(0.01, 'Điểm câu hỏi tối thiểu là 0.01')
    .max(100, 'Điểm câu hỏi tối đa là 100')
    .default(1.0),
  order: z.number().int().min(0).optional(),
});

export const AddQuestionsBatchSchema = z.object({
  questionIds: z
    .array(z.string().uuid('ID câu hỏi không hợp lệ'))
    .min(1, 'Phải chọn ít nhất một câu hỏi')
    .max(200, 'Không được thêm quá 200 câu hỏi cùng lúc'),
  defaultPoints: z
    .number()
    .min(0.01, 'Điểm câu hỏi tối thiểu là 0.01')
    .max(100, 'Điểm câu hỏi tối đa là 100')
    .default(1.0)
    .optional(),
});

export const ReorderQuestionsSchema = z.object({
  items: z
    .array(
      z.object({
        snapshotId: z.string().uuid('ID snapshot không hợp lệ'),
        order: z.number().int().min(0, 'Thứ tự không được âm'),
        points: z
          .number()
          .min(0.01, 'Điểm câu hỏi tối thiểu là 0.01')
          .max(100, 'Điểm câu hỏi tối đa là 100')
          .optional(),
      }),
    )
    .min(1, 'Danh sách sắp xếp không được để trống'),
});

export const PublishTestSchema = z.object({
  sessionTitle: z
    .string()
    .trim()
    .max(255, 'Tiêu đề phiên thi không được vượt quá 255 ký tự')
    .optional(),
  startsAt: z
    .string()
    .datetime({ message: 'Thời gian bắt đầu không hợp lệ' })
    .nullable()
    .optional(),
  endsAt: z.string().datetime({ message: 'Thời gian kết thúc không hợp lệ' }).nullable().optional(),
  joinCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{6}$/, 'Mã tham gia phải gồm đúng 6 ký tự chữ in hoa hoặc chữ số')
    .optional(),
});

export const TestQuerySchema = z.object({
  q: z.string().trim().optional(),
  status: TestStatusSchema.optional(),
  mode: TestModeSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});
