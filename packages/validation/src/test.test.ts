import { describe, it, expect } from 'vitest';
import {
  CreateTestSchema,
  UpdateTestSchema,
  AddQuestionToTestSchema,
  AddQuestionsBatchSchema,
  ReorderQuestionsSchema,
  PublishTestSchema,
  TestQuerySchema,
} from './test';

describe('Test Validation Schemas (Stage S07)', () => {
  describe('CreateTestSchema', () => {
    it('validates minimal valid test creation', () => {
      const res = CreateTestSchema.safeParse({
        title: 'Đề kiểm tra 1 tiết Toán Đại số',
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.title).toBe('Đề kiểm tra 1 tiết Toán Đại số');
        expect(res.data.mode).toBe('ASSIGNMENT');
        expect(res.data.maxAttempts).toBe(1);
        expect(res.data.shuffleQuestions).toBe(false);
        expect(res.data.shuffleOptions).toBe(false);
        expect(res.data.releaseMode).toBe('ON_FINALIZATION');
      }
    });

    it('validates test with all configurations', () => {
      const res = CreateTestSchema.safeParse({
        title: 'Thi thử THPT Quốc Gia',
        description: 'Đề kiểm tra thử định kỳ lần 1',
        instructions: 'Học sinh làm bài trong 45 phút, không sử dụng tài liệu',
        mode: 'PRACTICE',
        timeLimitMinutes: 45,
        maxAttempts: 3,
        shuffleQuestions: true,
        shuffleOptions: true,
        releaseMode: 'AFTER_ALL_GRADED',
        passScore: 5.0,
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.timeLimitMinutes).toBe(45);
        expect(res.data.passScore).toBe(5.0);
      }
    });

    it('rejects empty title', () => {
      const res = CreateTestSchema.safeParse({ title: '   ' });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.errors[0]?.message).toMatch(/không được để trống/);
      }
    });

    it('rejects negative or invalid time limit', () => {
      const res = CreateTestSchema.safeParse({
        title: 'Đề thi',
        timeLimitMinutes: -5,
      });
      expect(res.success).toBe(false);
    });

    it('rejects maxAttempts greater than 100', () => {
      const res = CreateTestSchema.safeParse({
        title: 'Đề thi',
        maxAttempts: 150,
      });
      expect(res.success).toBe(false);
    });
  });

  describe('UpdateTestSchema', () => {
    it('allows partial updates and status transition', () => {
      const res = UpdateTestSchema.safeParse({
        title: 'Tiêu đề cập nhật',
        status: 'PUBLISHED',
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.status).toBe('PUBLISHED');
      }
    });
  });

  describe('AddQuestionToTestSchema & Batch', () => {
    it('validates adding a single question with custom points', () => {
      const res = AddQuestionToTestSchema.safeParse({
        questionId: '550e8400-e29b-41d4-a716-446655440000',
        points: 2.5,
        order: 0,
      });
      expect(res.success).toBe(true);
    });

    it('validates batch adding question IDs', () => {
      const res = AddQuestionsBatchSchema.safeParse({
        questionIds: [
          '550e8400-e29b-41d4-a716-446655440000',
          '550e8400-e29b-41d4-a716-446655440001',
        ],
        defaultPoints: 1.5,
      });
      expect(res.success).toBe(true);
    });

    it('rejects batch adding with empty list', () => {
      const res = AddQuestionsBatchSchema.safeParse({
        questionIds: [],
      });
      expect(res.success).toBe(false);
    });
  });

  describe('ReorderQuestionsSchema', () => {
    it('validates reordering list of snapshots', () => {
      const res = ReorderQuestionsSchema.safeParse({
        items: [
          { snapshotId: '550e8400-e29b-41d4-a716-446655440000', order: 0, points: 1.0 },
          { snapshotId: '550e8400-e29b-41d4-a716-446655440001', order: 1, points: 2.0 },
        ],
      });
      expect(res.success).toBe(true);
    });
  });

  describe('PublishTestSchema', () => {
    it('validates publishing test with 6-char alphanumeric joinCode', () => {
      const res = PublishTestSchema.safeParse({
        sessionTitle: 'Kỳ thi Học kỳ 1',
        joinCode: 'QF8X9Z',
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.joinCode).toBe('QF8X9Z');
      }
    });

    it('rejects invalid joinCode format', () => {
      const res = PublishTestSchema.safeParse({
        joinCode: 'SHORT', // only 5 chars
      });
      expect(res.success).toBe(false);
    });
  });

  describe('TestQuerySchema', () => {
    it('parses pagination defaults', () => {
      const res = TestQuerySchema.safeParse({});
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.page).toBe(1);
        expect(res.data.limit).toBe(10);
      }
    });
  });
});
