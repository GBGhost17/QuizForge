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

### [2026-11-06] Stage S03 - Google OAuth 2.0 Integration

- **Branch**: `feat/S03-auth-and-permissions`
- **Changes**:
  - `apps/api/prisma/schema.prisma` & `20261106193500_add_google_oauth`: Added `googleId` (String?, @unique) and made `passwordHash` optional on `User` model.
  - `apps/api/src/modules/auth/strategies/google.strategy.ts`: Implemented `GoogleStrategy` extracting profile data and integrating with `AuthService`.
  - `apps/api/src/modules/auth/guards/google-auth.guard.ts`: AuthGuard for Google OAuth flow.
  - `apps/api/src/modules/auth/auth.service.ts`: Implemented `validateOrCreateGoogleUser` supporting account linking, new account creation, and seamless token generation.
  - `apps/api/src/modules/auth/auth.controller.ts`: Added `GET /api/v1/auth/google` and `GET /api/v1/auth/google/callback` redirecting tokens to frontend.
  - `apps/web/src/pages/auth/GoogleCallbackPage.tsx`: Created OAuth callback page extracting tokens, persisting in `auth.store.ts`, and navigating home.
  - `apps/web/src/pages/auth/LoginPage.tsx` & `RegisterPage.tsx`: Added "Đăng nhập với Google" / "Đăng ký với Google" button with OAuth redirection and error handling.
  - `apps/web/src/app/router.tsx`: Registered `/auth/callback` route.
- **Validation**:
  - `pnpm format:check` — PASSED.
  - `pnpm lint` — PASSED (0 errors, 0 warnings).
  - `pnpm typecheck` — PASSED (all 4 packages/apps).
  - `pnpm build` — PASSED (Vite + NestJS API).
  - `pnpm --filter @quizforge/web test` — 43/43 unit & integration tests PASSED.
  - `pnpm --filter @quizforge/api test src/` — 43/43 unit tests PASSED.
  - Total: 100 tests passing cleanly across workspace.
- **Next Step**: Review and merge Google OAuth vertical slice into main branch, then proceed to Stage S05 (Question Bank CRUD).

### [2026-11-06] Stage S03/S04 - Auth Hardening: HttpOnly Cookie Storage & URL Token Protection
- **Branch**: `feat/S05-question-bank-crud`
- **Changes**:
  - `apps/api`: Integrated `cookie-parser`, configured `refreshToken` strictly via `HttpOnly`, `SameSite=Lax`, secure cookie on login, register, refresh, and Google OAuth callback.
  - `apps/api`: Removed `refreshToken` query parameter exposure from Google OAuth redirect URL. Removed development `resetToken` leak from forgot password response.
  - `apps/web`: Completely eliminated `localStorage` persistence for auth tokens (`quizforge_refresh_token`). Kept `accessToken` strictly in-memory (Zustand state).
  - `apps/web`: Configured `apiClient` with `withCredentials: true` and automatic cookie-based token rotation on 401. Updated `GoogleCallbackPage` to prevent infinite re-render loops and safely exchange session state.
  - Updated all unit and integration tests across `apps/api` and `apps/web` to validate HttpOnly cookie propagation and in-memory token lifecycle.
- **Validation**:
  - `pnpm format:check` — PASSED.
  - `pnpm lint` — PASSED (0 errors, 0 warnings).
  - `pnpm typecheck` — PASSED across all workspace packages and apps.
  - Unit tests: 43/43 PASSED in `apps/api`, 42/42 PASSED in `apps/web`.
  - `pnpm build` — PASSED across all apps.
- **Next Step**: Proceed with Step 1 of Stage S05 (Question Bank & Question CRUD: contracts and Zod schemas in `packages/shared-types` and `packages/validation`).
