import { describe, expect, it } from 'vitest';
import { JoinCodeSchema, SaveAnswerItemSchema, SaveAnswersBatchSchema } from './attempt';

describe('Attempt Validation Schemas', () => {
  describe('JoinCodeSchema', () => {
    it('accepts valid 6-char alphanumeric uppercase codes', () => {
      expect(JoinCodeSchema.parse('ABC123')).toBe('ABC123');
      expect(JoinCodeSchema.parse('XYZ789')).toBe('XYZ789');
    });

    it('transforms lowercase and trims whitespace', () => {
      expect(JoinCodeSchema.parse(' abc123 ')).toBe('ABC123');
      expect(JoinCodeSchema.parse('xyz999')).toBe('XYZ999');
    });

    it('rejects codes with invalid length or special characters', () => {
      expect(() => JoinCodeSchema.parse('ABC12')).toThrow();
      expect(() => JoinCodeSchema.parse('ABC1234')).toThrow();
      expect(() => JoinCodeSchema.parse('ABC-12')).toThrow();
      expect(() => JoinCodeSchema.parse('ABC@12')).toThrow();
    });
  });

  describe('SaveAnswerItemSchema', () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174000';

    it('validates a valid answer item with options', () => {
      const parsed = SaveAnswerItemSchema.parse({
        snapshotId: validUuid,
        selectedOptionIds: ['opt-1', 'opt-2'],
      });
      expect(parsed.snapshotId).toBe(validUuid);
      expect(parsed.selectedOptionIds).toEqual(['opt-1', 'opt-2']);
    });

    it('validates a valid text answer', () => {
      const parsed = SaveAnswerItemSchema.parse({
        snapshotId: validUuid,
        textAnswer: 'Đây là câu trả lời ngắn',
      });
      expect(parsed.textAnswer).toBe('Đây là câu trả lời ngắn');
    });

    it('rejects invalid snapshotId uuid', () => {
      expect(() =>
        SaveAnswerItemSchema.parse({
          snapshotId: 'not-a-uuid',
        }),
      ).toThrow();
    });
  });

  describe('SaveAnswersBatchSchema', () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174000';

    it('accepts a valid batch of answers', () => {
      const parsed = SaveAnswersBatchSchema.parse({
        answers: [{ snapshotId: validUuid, selectedOptionIds: ['opt-1'] }],
      });
      expect(parsed.answers).toHaveLength(1);
    });

    it('rejects empty answers array', () => {
      expect(() =>
        SaveAnswersBatchSchema.parse({
          answers: [],
        }),
      ).toThrow();
    });
  });
});
