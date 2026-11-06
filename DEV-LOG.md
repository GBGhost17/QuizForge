# Developer Activity Log (DEV-LOG)

This file tracks incremental feature implementations, stage progressions (S00–S15), and technical milestones in QuizForge.

### [2026-11-06] Stage S04 - UI Shell and Design System

- **Branch**: `feat/S04-ui-shell` (Merged into `main`)
- **Changes**:
  - `apps/web/src/lib/api-client.ts`: Axios client with Bearer request interceptor and 401 response interceptor for automatic token rotation and concurrency queue.
  - `apps/web/src/stores/auth.store.ts`: Zustand store managing in-memory Access Token and persistent Refresh Token helpers.
  - `apps/web/src/hooks/useAuth.ts`: TanStack Query integration managing server state (`/auth/me`), login, register, and logout mutations.
  - `apps/web/src/components/ui/`: Built 6 accessible UI Primitives (`Button`, `Input`, `Label`, `Card`, `Badge`, `Alert`) with Tailwind CSS v4 and Lucide icons.
  - `apps/web/src/components/layout/`: Implemented responsive `Navbar`, role-adaptive `Sidebar` (Creator vs Participant modes), mobile drawer, `MainLayout` with skip-to-content anchor, and `ErrorBoundary`.
  - `apps/web/src/pages/auth/`: Built `LoginPage`, `RegisterPage`, `ForgotPasswordPage`, `ResetPasswordPage` validated by `@quizforge/validation` Zod schemas.
  - `apps/web/src/components/auth/`: Route guards (`ProtectedRoute`, `PublicOnlyRoute`), `PlaceholderPage` for upcoming stages, and `router.tsx` wiring.
  - `apps/web/e2e/smoke.spec.ts`: Updated Playwright smoke test covering UI shell branding and navigation to login.
- **Validation**:
  - `pnpm format:check` — PASSED.
  - `pnpm lint` — PASSED (0 errors, 0 warnings).
  - `pnpm typecheck` — PASSED (all 4 packages/apps).
  - `pnpm build` — PASSED (Vite + NestJS API).
  - `pnpm --filter @quizforge/web test` — 38/38 unit & integration tests PASSED.
  - `pnpm --filter @quizforge/api test src/` — 36/36 unit tests PASSED.
  - Total: 88 unit and integration tests passing cleanly across workspace.
- **Next Step**: Create branch `feat/S05-question-bank-crud` and implement Stage S05 (Question Bank CRUD with 5 question types, validation schemas, ownership enforcement, and UI bank views).
