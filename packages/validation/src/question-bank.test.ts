import { describe, it, expect } from 'vitest';
import {
  CreateQuestionBankSchema,
  QuestionBankQuerySchema,
  CreateQuestionSchema,
} from './question-bank';

describe('Question Bank Validation Schemas', () => {
  describe('CreateQuestionBankSchema', () => {
    it('accepts valid question bank input', () => {
      const result = CreateQuestionBankSchema.safeParse({
        title: 'Toán học 12',
        description: 'Ngân hàng đề thi THPT Quốc gia môn Toán',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Toán học 12');
        expect(result.data.description).toBe('Ngân hàng đề thi THPT Quốc gia môn Toán');
      }
    });

    it('rejects empty title', () => {
      const result = CreateQuestionBankSchema.safeParse({
        title: '   ',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toMatch(/không được để trống/i);
      }
    });

    it('rejects title longer than 200 characters', () => {
      const result = CreateQuestionBankSchema.safeParse({
        title: 'A'.repeat(201),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toMatch(/không được vượt quá 200 ký tự/i);
      }
    });
  });

  describe('QuestionBankQuerySchema', () => {
    it('applies defaults for pagination', () => {
      const result = QuestionBankQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(10);
      }
    });

    it('coerces string boolean for isArchived', () => {
      const result = QuestionBankQuerySchema.safeParse({
        isArchived: 'true',
        page: '2',
        limit: '25',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isArchived).toBe(true);
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(25);
      }
    });
  });

  describe('CreateQuestionSchema - 5 Question Types', () => {
    describe('SINGLE_CHOICE', () => {
      it('validates single choice with exactly 1 correct option', () => {
        const result = CreateQuestionSchema.safeParse({
          prompt: 'Thủ đô của Việt Nam là gì?',
          type: 'SINGLE_CHOICE',
          difficulty: 'EASY',
          defaultPoints: 1.0,
          options: [
            { text: 'Hà Nội', isCorrect: true },
            { text: 'Đà Nẵng', isCorrect: false },
            { text: 'TP. Hồ Chí Minh', isCorrect: false },
          ],
        });
        expect(result.success).toBe(true);
      });

      it('rejects single choice with less than 2 options', () => {
        const result = CreateQuestionSchema.safeParse({
          prompt: 'Thủ đô của Việt Nam là gì?',
          type: 'SINGLE_CHOICE',
          options: [{ text: 'Hà Nội', isCorrect: true }],
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toMatch(/phải có ít nhất 2 đáp án/i);
        }
      });

      it('rejects single choice with 0 correct options', () => {
        const result = CreateQuestionSchema.safeParse({
          prompt: 'Thủ đô của Việt Nam là gì?',
          type: 'SINGLE_CHOICE',
          options: [
            { text: 'Hà Nội', isCorrect: false },
            { text: 'Đà Nẵng', isCorrect: false },
          ],
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toMatch(/phải có chính xác 1 đáp án đúng/i);
        }
      });

      it('rejects single choice with more than 1 correct option', () => {
        const result = CreateQuestionSchema.safeParse({
          prompt: 'Thủ đô của Việt Nam là gì?',
          type: 'SINGLE_CHOICE',
          options: [
            { text: 'Hà Nội', isCorrect: true },
            { text: 'Đà Nẵng', isCorrect: true },
          ],
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toMatch(/phải có chính xác 1 đáp án đúng/i);
        }
      });
    });

    describe('MULTIPLE_CHOICE', () => {
      it('validates multiple choice with at least 1 correct option', () => {
        const result = CreateQuestionSchema.safeParse({
          prompt: 'Các số nguyên tố chẵn là?',
          type: 'MULTIPLE_CHOICE',
          options: [
            { text: '2', isCorrect: true },
            { text: '4', isCorrect: false },
            { text: '6', isCorrect: false },
          ],
        });
        expect(result.success).toBe(true);
      });

      it('validates multiple choice with multiple correct options', () => {
        const result = CreateQuestionSchema.safeParse({
          prompt: 'Những thành phố trực thuộc Trung ương của Việt Nam?',
          type: 'MULTIPLE_CHOICE',
          options: [
            { text: 'Hà Nội', isCorrect: true },
            { text: 'Hải Phòng', isCorrect: true },
            { text: 'Nha Trang', isCorrect: false },
            { text: 'Đà Nẵng', isCorrect: true },
          ],
        });
        expect(result.success).toBe(true);
      });

      it('rejects multiple choice with 0 correct options', () => {
        const result = CreateQuestionSchema.safeParse({
          prompt: 'Những thành phố trực thuộc Trung ương?',
          type: 'MULTIPLE_CHOICE',
          options: [
            { text: 'Nha Trang', isCorrect: false },
            { text: 'Đà Lạt', isCorrect: false },
          ],
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toMatch(/phải có ít nhất 1 đáp án đúng/i);
        }
      });
    });

    describe('TRUE_FALSE', () => {
      it('validates true/false question with exactly 2 options and 1 correct', () => {
        const result = CreateQuestionSchema.safeParse({
          prompt: 'Mặt Trời quay quanh Trái Đất.',
          type: 'TRUE_FALSE',
          options: [
            { text: 'Đúng', isCorrect: false },
            { text: 'Sai', isCorrect: true },
          ],
        });
        expect(result.success).toBe(true);
      });

      it('rejects true/false with more than 2 options', () => {
        const result = CreateQuestionSchema.safeParse({
          prompt: 'Mặt Trời quay quanh Trái Đất.',
          type: 'TRUE_FALSE',
          options: [
            { text: 'Đúng', isCorrect: false },
            { text: 'Sai', isCorrect: true },
            { text: 'Không chắc', isCorrect: false },
          ],
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toMatch(/phải có chính xác 2 lựa chọn/i);
        }
      });
    });

    describe('SHORT_ANSWER', () => {
      it('validates short answer with accepted options', () => {
        const result = CreateQuestionSchema.safeParse({
          prompt: 'Công thức phân tử của nước là gì?',
          type: 'SHORT_ANSWER',
          options: [
            { text: 'H2O', isCorrect: true },
            { text: 'h2o', isCorrect: true },
          ],
        });
        expect(result.success).toBe(true);
      });

      it('validates short answer with accepted answers in rubric', () => {
        const result = CreateQuestionSchema.safeParse({
          prompt: 'Công thức phân tử của nước là gì?',
          type: 'SHORT_ANSWER',
          rubric: {
            acceptedAnswers: ['H2O', 'H₂O', 'h2o'],
          },
        });
        expect(result.success).toBe(true);
      });

      it('rejects short answer without any accepted answers', () => {
        const result = CreateQuestionSchema.safeParse({
          prompt: 'Công thức phân tử của nước là gì?',
          type: 'SHORT_ANSWER',
          options: [],
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toMatch(
            /phải có ít nhất 1 đáp án được chấp nhận/i,
          );
        }
      });
    });

    describe('ESSAY', () => {
      it('validates essay question with prompt, defaultPoints, and optional rubric', () => {
        const result = CreateQuestionSchema.safeParse({
          prompt: 'Hãy phân tích vẻ đẹp của bài thơ Tây Tiến.',
          type: 'ESSAY',
          defaultPoints: 5.0,
          rubric: {
            modelAnswer: 'Bài làm cần làm rõ vẻ đẹp bi tráng của đoàn binh Tây Tiến...',
            criteria: [
              { description: 'Mở bài và nêu được vấn đề', points: 0.5 },
              { description: 'Phân tích hình tượng người lính', points: 3.5 },
              { description: 'Kết luận và đánh giá nghệ thuật', points: 1.0 },
            ],
          },
        });
        expect(result.success).toBe(true);
      });

      it('validates minimal essay question without rubric', () => {
        const result = CreateQuestionSchema.safeParse({
          prompt: 'Trình bày quan điểm của bạn về chuyển đổi số.',
          type: 'ESSAY',
          defaultPoints: 2.0,
        });
        expect(result.success).toBe(true);
      });
    });
  });
});
