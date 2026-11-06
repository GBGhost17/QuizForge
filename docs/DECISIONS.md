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

## ADR-005 — Authentication transport and token rotation strategy
**Status:** Accepted.
**Context:** S03 requires secure authentication with server-side revocation, session management, and low latency for API queries.
**Decision:**
- Passwords hashed using Argon2id (`argon2@0.41.1`) with 64 MB memory cost, 3 iterations, and 4 degrees of parallelism.
- Stateless short-lived JWT Access Tokens (default 15 minutes) transported via standard `Authorization: Bearer <token>` HTTP header.
- Stateful long-lived Refresh Tokens (default 7 days) generated as cryptographically secure 32-byte random hex strings, stored strictly as SHA-256 hashes in the PostgreSQL `refresh_tokens` table.
- Automatic single-use Token Rotation: refreshing an access token revokes the old refresh token and creates a new one in an atomic database transaction. Token replay detection immediately blocks reuse of revoked tokens.
- Explicit Logout marks refresh tokens as revoked (`revokedAt = now`).
- Password reset uses single-use SHA-256 hashed tokens with 1-hour expiration. Successful password reset revokes all active refresh tokens for that account.
**Consequences:** Frontend clients must store and transmit access tokens in headers and handle automatic refresh upon 401. Database query is required only during refresh, profile validation, or token revocation.
**Alternatives:** HttpOnly cookies (higher CSRF surface, tricky with cross-origin or native apps), database-only sessions (requires DB lookup on every single request).

