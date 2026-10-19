# Architecture Decision Log

Use one section per decision: `ADR-### — Title`, Status, Context, Decision, Consequences, Alternatives.

## ADR-001 — TypeScript modular monolith
**Status:** Proposed. **Decision:** pnpm monorepo, React/Vite frontend, NestJS API, PostgreSQL/Prisma persistence. **Rationale:** Small-team maintainability, shared types, and future module extraction if needed.

## ADR-002 — Immutable published assessments
**Status:** Proposed. **Decision:** Publishing creates versioned question snapshots; attempts bind to one version. **Rationale:** Prevent history corruption and ensure grading reproducibility.

## ADR-003 — AI is optional
**Status:** Proposed. **Decision:** Deterministic Markdown parsing and manual grading are the MVP baseline; AI behind optional adapters. **Rationale:** Cost, predictability, privacy, and offline operability.

## Open ADRs
Authentication transport (cookies vs token), email delivery, guest identity, exact import grammar, hosting, timeouts, data retention.

## ADR-004 — S01 toolchain choices
**Status:** Proposed. **Context:** S01 needs a concrete, minimal scaffold. **Decision:** Node 22 LTS; pnpm 10; ESLint 9 flat config + Prettier; Vite + React 19 + Tailwind CSS v4; NestJS 11 + Swagger; Prisma 6 (`prisma-client-js`) with PostgreSQL 16 via Docker Compose; Vitest (web, validation), Jest/Supertest (api), Playwright (smoke, not yet in CI). Shared packages are consumed as TypeScript source (no build output) until the API needs them at runtime (S03). **Consequences:** Dependency versions are caret ranges chosen without network access and MUST be verified at first install; commit the generated lockfile. **Alternatives:** Prisma 7 (config model differs), compiled shared packages (extra build ordering).
