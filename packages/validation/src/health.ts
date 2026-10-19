import { z } from 'zod';
import type { HealthResponse } from '@quizforge/shared-types';

/** Runtime validation for the health contract; the annotation keeps it in sync with the type. */
export const HealthResponseSchema: z.ZodType<HealthResponse> = z.object({
  status: z.literal('ok'),
  service: z.string().min(1),
  version: z.string().min(1),
  timestamp: z.string().min(1),
});
