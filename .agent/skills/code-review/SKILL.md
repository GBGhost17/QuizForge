---
name: code-review
description: Conducts comprehensive code reviews on pull requests and code changes for security, integrity, architecture boundaries, type safety, and test coverage in QuizForge.
---

# Code Review Skill

Use this skill when reviewing pull requests (PRs), validating code commits, or assessing code quality against QuizForge's architecture rules and security policies.

## Review Checklist & Invariants

### 1. Architecture & Boundaries (`.agents/rules/architecture-and-boundaries.md`)

- [ ] **Workspace Boundaries**: All packages follow `apps/web`, `apps/api`, `packages/shared-types`, `packages/validation`.
- [ ] **Backend Isolation**: Modules own their controllers, services, DTOs, and unit tests. No backend internal logic is imported directly into the frontend.
- [ ] **Data Access**: Database queries are executed server-side via Prisma only. The UI never accesses the database directly.
- [ ] **Public Contracts**: Only stable public types/contracts from `packages/shared-types` are shared across workspace apps.
- [ ] **API Standards**: Endpoints are versioned under `/api/v1` with consistent typed error formats and pagination.
- [ ] **Transactions**: DB transactions are applied for publish, submit, and grade finalization operations.
- [ ] **ADR Logged**: Any structural or architectural changes include an entry in `docs/DECISIONS.md`.

### 2. Code Quality & Type Safety (`.agents/rules/code-quality.md`)

- [ ] **Strict TypeScript**: Strict mode is enabled. No explicit `any`, unsafe casts, or non-null assertions (`!`) without explicit justification.
- [ ] **Domain Types**: Explicit domain types with discriminated unions are used for question and answer variants.
- [ ] **Input Validation**: Zod is applied at shared boundaries; NestJS DTOs validate incoming API inputs.
- [ ] **Pure Functions**: Grading, parsing, and scoring logic are isolated into pure functions.
- [ ] **Error Handling**: Exceptions provide actionable error messages and are never swallowed silently.

### 3. Security & Assessment Integrity (`.agents/rules/security-and-integrity.md`)

- [ ] **Answer Key Protection**: Answer keys, model answers, and private rubrics are NEVER sent to unauthorized clients or preloaded on student-facing pages.
- [ ] **Authentication & Ownership**: All protected endpoints/WebSocket actions verify server-derived ownership to prevent IDOR vulnerabilities.
- [ ] **Server Timers & Grading**: Timers, attempt limits, and score calculations are strictly server-authoritative.
- [ ] **Sensitive Data & Logging**: Passwords, student submitted answers, or secrets are never logged in plain text.
- [ ] **Uploads & HTML**: File uploads and Markdown HTML input are strictly sanitized and validated for MIME/size restrictions.

### 4. Tests, Git & CI Checks (`.agents/rules/tests-and-git.md`)

- [ ] **Automated Tests**: PR includes unit/integration tests for new features/fixes. Core flows have Playwright E2E tests.
- [ ] **Attempt & Edge Cases**: Tests cover duplicate submits, timeouts, reconnects, ownership checks, and concurrent requests.
- [ ] **Commit Hygiene**: Branch uses standard naming (`feat/Sxx-topic`, `fix/topic`, `docs/topic`) and Conventional Commits.
- [ ] **No Default Push**: Code is on a feature branch, not committed directly to the default branch without explicit user authorization.

## Step-by-Step Execution Procedure

1. **Diff Audit**: Scan changed files against the active stage requirement (S00–S15).
2. **Boundary & Dependency Check**: Check for circular dependencies or cross-module leaks.
3. **Security Invariant Verification**: Run a static check to ensure no answer keys or internal rubrics leak to frontend DTOs.
4. **Validation Test Execution**: Run linter, type-checker, and automated tests (`pnpm lint`, `pnpm typecheck`, `pnpm test`).
5. **Report Generation**: Output structured feedback following the QuizForge standard reporting format.

## Exit Criteria

- No security or answer-leak violations detected.
- Lint, typecheck, and unit/integration tests pass cleanly with actual execution evidence.
- Detailed review report generated with clear blocking/non-blocking feedback.
