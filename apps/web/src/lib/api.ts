import type { HealthResponse } from '@quizforge/shared-types';
import { HealthResponseSchema } from '@quizforge/validation';

/** Fetches API liveness and validates the payload at the boundary. */
export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch('/api/v1/health');
  if (!res.ok) {
    throw new Error(`Health check failed with status ${res.status}`);
  }
  return HealthResponseSchema.parse(await res.json());
}
