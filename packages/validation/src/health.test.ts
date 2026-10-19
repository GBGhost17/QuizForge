import { describe, expect, it } from 'vitest';
import { HealthResponseSchema } from './health';

describe('HealthResponseSchema', () => {
  it('accepts a valid health payload', () => {
    const result = HealthResponseSchema.safeParse({
      status: 'ok',
      service: 'quizforge-api',
      version: '0.0.0',
      timestamp: '2026-01-01T00:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an unexpected status', () => {
    const result = HealthResponseSchema.safeParse({
      status: 'down',
      service: 'quizforge-api',
      version: '0.0.0',
      timestamp: '2026-01-01T00:00:00.000Z',
    });
    expect(result.success).toBe(false);
  });
});
