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

### [2026-11-06] Stage S05 - Question Bank CRUD & Session Persistence on Page Refresh (F5)

- **Branch**: `feat/S05-question-bank-crud`
- **Changes**:
  - `packages/shared-types`: Added contracts for `QuestionType` (5 types: SINGLE_CHOICE, MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER, ESSAY), `Difficulty`, `QuestionOption`, `Question`, `QuestionBank`, query and pagination DTOs.
  - `packages/validation`: Built dual CJS/ESM package (`dist/cjs` + `dist/esm`), schemas (`CreateQuestionBankSchema`, `CreateQuestionSchema`, etc.) with discriminated type validations and 19 unit tests.
  - `apps/api`: Built `QuestionBanksModule` and `QuestionsModule` with transactional operations, strict owner authorization, pagination, keyword search, filter, and immutable soft-delete guards (preserving published test snapshots). 28 unit tests pass.
  - `apps/web`: Created TanStack Query hooks (`useQuestionBanks`, `useQuestions`), `QuestionBanksPage` cards grid, `QuestionBankDetailPage` with filters and previews, `QuestionBankModal`, and `QuestionEditorModal` supporting all 5 question types.
  - `apps/web`: Fixed F5 auto-logout issue by implementing `AuthInitializer` in `apps/web/src/app/providers.tsx` which performs silent token refresh on app startup via HttpOnly cookie.
  - `apps/web`: Updated `ProtectedRoute` and `PublicOnlyRoute` to wait for session initialization (`isInitialized: true`) before performing redirects, preventing accidental logouts on page reload.
  - `apps/web`: Added `ProtectedRoute.test.tsx` (3 tests) and updated `auth.store.test.ts` to thoroughly verify session initialization and route guard behaviors.
  - `apps/web/vite.config.ts` & `apps/api/src/main.ts`: Bound API server to `0.0.0.0:3000` and updated Vite proxy to `http://127.0.0.1:3000` to prevent Windows IPv6 (`::1`) connection refused errors.
  - `packages/validation/package.json`: Pointed package `types` directly to `./src/index.ts` so TypeScript consumers can resolve types instantly in clean environments without requiring pre-built `dist/`.
  - `apps/api/src/modules/questions/questions.service.ts`: Added explicit parameter types for options mapping, eliminating `noImplicitAny` errors.
  - `.github/workflows/ci.yml`: Added `Build Shared Packages` step right after `pnpm install` to guarantee shared library distribution files exist for tests.
- **Validation**:
  - `pnpm format:check` — PASSED (Prettier).
  - `pnpm lint` — PASSED (0 errors, 0 warnings).
  - `pnpm typecheck` — PASSED (verified cleanly even after deleting `packages/validation/dist`).
  - Unit tests: 155/155 PASSED (33 in validation, 71 in api, 51 in web).
  - `pnpm build` — PASSED (Vite + NestJS API).
- **Next Step**: Commit and push changes to `feat/S05-question-bank-crud`, verify green CI on GitHub, merge into `main`, and advance to Stage S06 (Markdown import pipeline).

### [2026-11-08] Stage S06 - Markdown Import Pipeline with KaTeX Math and Line Diagnostics

- **Branch**: `feat/S06-markdown-import`
- **Changes**:
  - `packages/shared-types`: Added contracts for `MarkdownDiagnosticSeverity`, `ImportDiagnostic`, `ParsedQuestion`, `MarkdownImportResult`, `MarkdownImportParseDto`, `MarkdownImportCommitDto`.
  - `packages/validation`: Created Zod schemas `MarkdownImportParseSchema`, `MarkdownFrontmatterSchema`, `ParsedQuestionSchema`, `MarkdownImportCommitSchema` with 8 unit tests.
  - `apps/api`: Built `ImportsModule` featuring `MarkdownParserService` with unified/remark AST-based parser, multi-question chunking (`##`), frontmatter extraction, metadata parsing, support for 5 question types (SINGLE_CHOICE, MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER, ESSAY), line-level diagnostics, and security scanning (`<script>`, event handlers, `javascript:`).
  - `apps/api`: Implemented `ImportsController` exposing `POST /api/v1/imports/markdown/parse` (preview) and `POST /api/v1/imports/markdown/commit` (transactional Prisma persistence with bank ownership verification). Added 12 unit tests and 4 markdown test fixtures.
  - `apps/web`: Created `MarkdownMathPreview` component integrating KaTeX math formatting (`$...$` and `$$...$$`) with sanitized markdown, `useMarkdownImport` TanStack Query mutation hooks, and dual-pane `MarkdownImportPage` featuring sample template, real-time preview, line error badges, and transactional commit CTA.
  - `apps/web`: Registered `/question-banks/:id/import` route and updated `QuestionBankDetailPage` with direct navigation and math equation rendering.
- **Validation**:
  - `pnpm format:check` — PASSED (Prettier).
  - `pnpm lint` — PASSED (0 errors, 0 warnings across all workspaces).
  - `pnpm typecheck` — PASSED (all packages/apps).
  - Unit tests: 184/184 tests PASSED (41 in validation, 83 in api, 60 in web).
  - `pnpm build` — PASSED (Vite + NestJS API).
- **Next Step**: Review and merge `feat/S06-markdown-import` into `main`, then proceed to Stage S07: Test Builder and Publishing.

### [2026-11-08] Stage S06 - AI Prompt Generator, Bank Selector Modal & AI Verification Banner

- **Branch**: `feat/S06-markdown-import`
- **Changes**:
  - `apps/web/src/components/import/GeneratePromptModal.tsx`: Created modal for customizable AI prompt generation (subject, question count, question types, difficulty, score scale, auto points-per-question calculation with 0.05 step increments, advisory warnings for high question counts, and 1-click copy).
  - `apps/web/src/components/import/SelectTargetBankModal.tsx`: Created modal when importing questions from sidebar `/import` without pre-selected bank ID, enabling selection of existing banks or creating new bank on the fly.
  - `apps/web/src/pages/import/MarkdownImportPage.tsx`: Integrated `GeneratePromptModal` and `SelectTargetBankModal`, added difficulty label toggle checkbox, and added an optimized AI content verification advisory banner reminding educators to review AI-generated questions and formula formatting before importing.
  - `apps/web/src/pages/import/MarkdownImportPage.test.tsx`: Added 5 unit/integration tests covering AI prompt generator, bank selection modal, score step calculations, and AI verification banner.
- **Validation**:
  - `pnpm format:check` — PASSED (Prettier).
  - `pnpm lint` — PASSED (0 errors, 0 warnings).
  - `pnpm typecheck` — PASSED (all 4 workspace projects).
  - `pnpm --filter @quizforge/web test --run` — PASSED (65/65 tests across 11 suites).
- **Next Step**: Await user command or proceed to Stage S07: Test Builder and Publishing.

### [2026-11-08] Stage S06 - Markdown Error Diagnostic Copy Features

- **Branch**: `feat/S06-markdown-import`
- **Changes**:
  - `apps/web/src/pages/import/MarkdownImportPage.tsx`: Added comprehensive error copying capabilities in the Diagnostics Report card:
    - "Sao chép tất cả lỗi" button in the card header, compiling an AI-ready summary of all syntax errors and warnings with line numbers and remediation tips.
    - Individual copy button on each diagnostic card with accessible `aria-label`, tooltip, and animated state (`Đã chép` checkmark feedback).
  - `apps/web/src/pages/import/MarkdownImportPage.test.tsx`: Added unit test covering single diagnostic and batch diagnostics clipboard copy interactions.
- **Validation**:
  - `pnpm format:check` — PASSED (Prettier).
  - `pnpm lint` — PASSED (0 errors, 0 warnings).
  - `pnpm typecheck` — PASSED (all 4 workspace projects).
  - `pnpm --filter @quizforge/web test --run` — PASSED (66/66 web tests passed).
  - `pnpm --filter @quizforge/api test -- src/` — PASSED (83/83 unit tests passed).
- **Next Step**: Await user instructions.

### [2026-11-08] Stage S06 - KaTeX Math & Markdown Rich Text Rendering in Explanations & Prompts

- **Branch**: `feat/S06-markdown-import`
- **Changes**:
  - `apps/web/src/components/common/MarkdownMathPreview.tsx`: Added `whitespace-pre-line` newline preserving behavior and custom `strong`/`em` element renderers for natural multi-line step-by-step mathematical solutions.
  - `apps/web/src/pages/import/MarkdownImportPage.tsx`: Wrapped question explanations, option explanations, and essay model answers with `<MarkdownMathPreview />` instead of raw text interpolation.
  - `apps/web/src/pages/question-banks/QuestionBankDetailPage.tsx`: Upgraded explanation cards and essay model answers to render formatted KaTeX equations and markdown rich text.
  - `apps/api/src/modules/imports/markdown-parser.service.ts`: Improved `extractTextFromNode` to preserve markdown formatting tokens (`**bold**`, `*italic*`, `~~strike~~`, newlines `\n` from breaks), and enabled multi-line continuation for metadata fields in blockquotes (such as detailed multi-line mathematical explanations).
  - Test suites: Added test cases in `MarkdownMathPreview.test.tsx` and `markdown-parser.service.spec.ts` verifying rendering of complex multi-line algebra derivations and LaTeX set notations.
- **Validation**:
  - `pnpm format:check` — PASSED (Prettier).
  - `pnpm lint` — PASSED (0 errors, 0 warnings).
  - `pnpm typecheck` — PASSED (all workspace projects).
  - `pnpm --filter @quizforge/web test --run` — PASSED (67/67 web tests).
  - `pnpm --filter @quizforge/api test -- src/` — PASSED (84/84 api unit tests).
- **Next Step**: Await user instructions or proceed to Stage S07.

### [2026-11-08] Stage S06 - Markdown Import Pipeline with KaTeX Math and Line Diagnostics

- **Branch**: `feat/S06-markdown-import`
- **Changes**:
  - `packages/shared-types`: Added contracts for `MarkdownDiagnosticSeverity`, `ImportDiagnostic`, `ParsedQuestion`, `MarkdownImportResult`, `MarkdownImportParseDto`, `MarkdownImportCommitDto`.
  - `packages/validation`: Created Zod schemas `MarkdownImportParseSchema`, `MarkdownFrontmatterSchema`, `ParsedQuestionSchema`, `MarkdownImportCommitSchema` with 8 unit tests.
  - `apps/api`: Built `ImportsModule` featuring `MarkdownParserService` with unified/remark AST-based parser, multi-question chunking (`##`), frontmatter extraction, metadata parsing, support for 5 question types (SINGLE_CHOICE, MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER, ESSAY), line-level diagnostics, and security scanning (`<script>`, event handlers, `javascript:`).
  - `apps/api`: Implemented `ImportsController` exposing `POST /api/v1/imports/markdown/parse` (preview) and `POST /api/v1/imports/markdown/commit` (transactional Prisma persistence with bank ownership verification). Added 12 unit tests and 4 markdown test fixtures.
  - `apps/web`: Created `MarkdownMathPreview` component integrating KaTeX math formatting (`$...$` and `$$...$$`) with sanitized markdown, `useMarkdownImport` TanStack Query mutation hooks, and dual-pane `MarkdownImportPage` featuring sample template, real-time preview, line error badges, and transactional commit CTA.
  - `apps/web`: Registered `/question-banks/:id/import` route and updated `QuestionBankDetailPage` with direct navigation and math equation rendering.
- **Validation**:
  - `pnpm format:check` — PASSED (Prettier).
  - `pnpm lint` — PASSED (0 errors, 0 warnings across all workspaces).
  - `pnpm typecheck` — PASSED (all packages/apps).
  - Unit tests: 184/184 tests PASSED (41 in validation, 83 in api, 60 in web).
  - `pnpm build` — PASSED (Vite + NestJS API).
- **Next Step**: Review and merge `feat/S06-markdown-import` into `main`, then proceed to Stage S07: Test Builder and Publishing.

### [2026-11-08] Stage S06 - AI Prompt Generator, Bank Selector Modal & AI Verification Banner

- **Branch**: `feat/S06-markdown-import`
- **Changes**:
  - `apps/web/src/components/import/GeneratePromptModal.tsx`: Created modal for customizable AI prompt generation (subject, question count, question types, difficulty, score scale, auto points-per-question calculation with 0.05 step increments, advisory warnings for high question counts, and 1-click copy).
  - `apps/web/src/components/import/SelectTargetBankModal.tsx`: Created modal when importing questions from sidebar `/import` without pre-selected bank ID, enabling selection of existing banks or creating new bank on the fly.
  - `apps/web/src/pages/import/MarkdownImportPage.tsx`: Integrated `GeneratePromptModal` and `SelectTargetBankModal`, added difficulty label toggle checkbox, and added an optimized AI content verification advisory banner reminding educators to review AI-generated questions and formula formatting before importing.
  - `apps/web/src/pages/import/MarkdownImportPage.test.tsx`: Added 5 unit/integration tests covering AI prompt generator, bank selection modal, score step calculations, and AI verification banner.
- **Validation**:
  - `pnpm format:check` — PASSED (Prettier).
  - `pnpm lint` — PASSED (0 errors, 0 warnings).
  - `pnpm typecheck` — PASSED (all 4 workspace projects).
  - `pnpm --filter @quizforge/web test --run` — PASSED (65/65 tests across 11 suites).
- **Next Step**: Await user command or proceed to Stage S07: Test Builder and Publishing.

### [2026-11-08] Stage S06 - Markdown Error Diagnostic Copy Features

- **Branch**: `feat/S06-markdown-import`
- **Changes**:
  - `apps/web/src/pages/import/MarkdownImportPage.tsx`: Added comprehensive error copying capabilities in the Diagnostics Report card:
    - "Sao chép tất cả lỗi" button in the card header, compiling an AI-ready summary of all syntax errors and warnings with line numbers and remediation tips.
    - Individual copy button on each diagnostic card with accessible `aria-label`, tooltip, and animated state (`Đã chép` checkmark feedback).
  - `apps/web/src/pages/import/MarkdownImportPage.test.tsx`: Added unit test covering single diagnostic and batch diagnostics clipboard copy interactions.
- **Validation**:
  - `pnpm format:check` — PASSED (Prettier).
  - `pnpm lint` — PASSED (0 errors, 0 warnings).
  - `pnpm typecheck` — PASSED (all 4 workspace projects).
  - `pnpm --filter @quizforge/web test --run` — PASSED (66/66 web tests passed).
  - `pnpm --filter @quizforge/api test -- src/` — PASSED (83/83 unit tests passed).
- **Next Step**: Await user instructions.

### [2026-11-08] Stage S06 - KaTeX Math & Markdown Rich Text Rendering in Explanations & Prompts

- **Branch**: `feat/S06-markdown-import`
- **Changes**:
  - `apps/web/src/components/common/MarkdownMathPreview.tsx`: Added `whitespace-pre-line` newline preserving behavior and custom `strong`/`em` element renderers for natural multi-line step-by-step mathematical solutions.
  - `apps/web/src/pages/import/MarkdownImportPage.tsx`: Wrapped question explanations, option explanations, and essay model answers with `<MarkdownMathPreview />` instead of raw text interpolation.
  - `apps/web/src/pages/question-banks/QuestionBankDetailPage.tsx`: Upgraded explanation cards and essay model answers to render formatted KaTeX equations and markdown rich text.
  - `apps/api/src/modules/imports/markdown-parser.service.ts`: Improved `extractTextFromNode` to preserve markdown formatting tokens (`**bold**`, `*italic*`, `~~strike~~`, newlines `\n` from breaks), and enabled multi-line continuation for metadata fields in blockquotes (such as detailed multi-line mathematical explanations).
  - Test suites: Added test cases in `MarkdownMathPreview.test.tsx` and `markdown-parser.service.spec.ts` verifying rendering of complex multi-line algebra derivations and LaTeX set notations.
- **Validation**:
  - `pnpm format:check` — PASSED (Prettier).
  - `pnpm lint` — PASSED (0 errors, 0 warnings).
  - `pnpm typecheck` — PASSED (all workspace projects).
  - `pnpm --filter @quizforge/web test --run` — PASSED (67/67 web tests).
  - `pnpm --filter @quizforge/api test -- src/` — PASSED (84/84 api unit tests).
- **Next Step**: Await user instructions or proceed to Stage S07.
