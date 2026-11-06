---
name: api-contract-sync
description: Ensures end-to-end type safety and contract synchronization across NestJS DTOs, shared-types package, Zod validation schemas, and React frontend clients.
---

# API Contract Synchronization Skill

Use this skill when adding or modifying API endpoints, request/response DTOs, or shared domain interfaces in the QuizForge monorepo[cite: 6, 10].

## Step-by-Step Execution Procedure

1. **Contract Definition in Shared Packages**:
   - Define domain interfaces inside `packages/shared-types/src/`.
   - Export public types cleanly from the package entry point (`index.ts`)[cite: 10].
2. **Boundary Validation Schemas**:
   - Define Zod schemas in `packages/validation/src/` for input boundary parsing and API payloads[cite: 10].
3. **Backend NestJS DTO Integration**:
   - Implement NestJS DTOs using `@nestjs/swagger` and `zod` matching shared contracts in `apps/api/src/`[cite: 10].
   - Ensure answer keys or hidden rubrics are never included in student-facing response DTOs.
4. **Frontend API Client Update**:
   - Update API fetchers and TanStack Query hooks in `apps/web/` to consume the updated shared types[cite: 10].
5. **Workspace Verification**:
   - Run workspace build and type checking to ensure no cross-app type errors:
   ```bash
   pnpm --filter shared-types build
   pnpm --filter validation build
   pnpm typecheck
   ```

## Exit Criteria

- Zero type mismatches between API DTOs and Frontend state.

- Public contracts exported without leaking backend internals.
