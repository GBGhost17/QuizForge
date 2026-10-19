import { resolve } from 'node:path';
import { z } from 'zod';

const EnvSchema = z.object({
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  CORS_ORIGIN: z.string().min(1).default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1).optional(),
});

export type Env = z.infer<typeof EnvSchema>;

/**
 * Loads the repo-root `.env` for local development when present (Node's built-in loader),
 * then validates the environment. In CI/production, variables come from the real environment.
 */
export function loadEnv(): Env {
  try {
    process.loadEnvFile(resolve(process.cwd(), '../../.env'));
  } catch {
    // No local .env file: rely on the process environment.
  }
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid environment configuration: ${parsed.error.message}`);
  }
  return parsed.data;
}
