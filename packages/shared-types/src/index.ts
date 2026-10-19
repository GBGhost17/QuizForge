/**
 * Public contracts shared by web and api. Keep this package free of backend
 * internals (see agent/rules/01-architecture.md).
 */

/** Response of GET /api/v1/health (liveness). */
export interface HealthResponse {
  status: 'ok';
  service: string;
  version: string;
  timestamp: string;
}

/** Consistent error envelope for all API errors (extended in later stages). */
export interface ApiErrorResponse {
  statusCode: number;
  error: string;
  message: string;
}
