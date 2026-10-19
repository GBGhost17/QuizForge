---
trigger: always_on
description: 'Architecture boundaries, pnpm workspace layout, NestJS modules, and Prisma database access rules.'
---

# Rule: Architecture and Boundaries

- Use pnpm workspace with `apps/web`, `apps/api`, `packages/shared-types`, `packages/validation`.
- Backend is a NestJS modular monolith; modules own controllers, services, DTOs, tests.
- Database access is server-only through Prisma; UI never accesses database directly.
- Share stable public contracts only; do not import backend internals into frontend.
- API versioning under `/api/v1`; consistent typed errors and pagination.
- Avoid circular dependencies, hidden cross-module mutations, and premature abstractions.
- Use database transactions for publishing, submission, grading finalization.
- Architecture changes require an entry in `docs/DECISIONS.md`.
