import { describe, expect, it } from 'vitest';
import {
  MarkdownFrontmatterSchema,
  MarkdownImportCommitSchema,
  MarkdownImportParseSchema,
  ParsedQuestionSchema,
} from './markdown-import';

describe('Markdown Import Validation Schemas', () => {
  describe('MarkdownImportParseSchema', () => {
    it('accepts valid non-empty markdown string', () => {
      const result = MarkdownImportParseSchema.safeParse({
        content: '# Test Quiz\n## Q1: Hello\n- [x] Yes\n- [ ] No',
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty markdown content', () => {
      const result = MarkdownImportParseSchema.safeParse({ content: '' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toContain('không được để trống');
      }
    });
  });

  describe('MarkdownFrontmatterSchema', () => {
    it('accepts valid frontmatter fields', () => {
      const result = MarkdownFrontmatterSchema.safeParse({
        title: 'Midterm Exam',
        description: 'Computer Science fundamentals',
        subject: 'IT',
        tags: ['cs', 'programming'],
      });
      expect(result.success).toBe(true);
    });

    it('rejects overly long title', () => {
      const result = MarkdownFrontmatterSchema.safeParse({
        title: 'a'.repeat(201),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('ParsedQuestionSchema', () => {
    it('validates single choice question item', () => {
      const result = ParsedQuestionSchema.safeParse({
        type: 'SINGLE_CHOICE',
        prompt: 'What is 2 + 2?',
        difficulty: 'EASY',
        defaultPoints: 1,
        rawSourceLine: 10,
        options: [
          { text: '3', isCorrect: false },
          { text: '4', isCorrect: true },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('validates essay question with rubric', () => {
      const result = ParsedQuestionSchema.safeParse({
        type: 'ESSAY',
        prompt: 'Explain polymorphism.',
        difficulty: 'HARD',
        defaultPoints: 5,
        rawSourceLine: 25,
        rubric: {
          modelAnswer: 'Polymorphism allows...',
          criteria: [{ description: 'Clarity', points: 2.5 }],
        },
      });
      expect(result.success).toBe(true);
    });

    it('rejects negative default points', () => {
      const result = ParsedQuestionSchema.safeParse({
        type: 'TRUE_FALSE',
        prompt: 'Is sky blue?',
        defaultPoints: -1,
        rawSourceLine: 5,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('MarkdownImportCommitSchema', () => {
    it('rejects commit payload with 0 questions', () => {
      const result = MarkdownImportCommitSchema.safeParse({
        bankId: 'bank-123',
        questions: [],
      });
      expect(result.success).toBe(false);
    });
  });
});
