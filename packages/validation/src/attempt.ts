import { z } from 'zod';

export const JoinCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{6}$/, 'Mã phòng phải gồm đúng 6 ký tự chữ hoa hoặc chữ số (A-Z, 0-9)');

export const SaveAnswerItemSchema = z.object({
  snapshotId: z.string().uuid('ID câu hỏi không hợp lệ'),
  selectedOptionIds: z.array(z.string().trim()).optional(),
  textAnswer: z.string().max(10000, 'Câu trả lời không được vượt quá 10,000 ký tự').optional(),
});

export const SaveAnswersBatchSchema = z.object({
  answers: z
    .array(SaveAnswerItemSchema)
    .min(1, 'Danh sách câu trả lời cần lưu không được trống')
    .max(200, 'Số lượng câu trả lời lưu trong một lần không được vượt quá 200'),
});

export type JoinCodeInput = z.infer<typeof JoinCodeSchema>;
export type SaveAnswerItemInput = z.infer<typeof SaveAnswerItemSchema>;
export type SaveAnswersBatchInput = z.infer<typeof SaveAnswersBatchSchema>;
