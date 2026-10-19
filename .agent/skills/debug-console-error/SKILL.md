---
name: debug-console-error
description: Analyze, diagnose, and resolve runtime console errors, stack traces, and uncaught exceptions across frontend (browser console) and backend (Node.js/NestJS terminal logs) in QuizForge.
---

# Debug & Fix Console Errors Skill

## Step-by-Step Resolution Procedure

1. **Log Extraction & Root Cause Analysis**:
   - Determine origin: Frontend (`apps/web`) vs Backend (`apps/api`).
   - Parse error trace to identify target file, line number, and exception type (e.g., Prisma error codes, Hydration errors, CORS errors, Null reference).
2. **Invariant & Safety Boundary Check**:
   - Verify error details do not expose raw server credentials, hidden answer keys, or internal rubrics.
   - Ensure Prisma exceptions are caught server-side and transformed into typed NestJS HTTP exceptions.
3. **Minimal Fix Implementation**:
   - Apply strict null checks or Zod boundary validations rather than unsafe type assertions.
   - Maintain pure function behavior in parsing and grading utilities.
4. **Verification & Regression Testing**:
   - Re-test reproduction scenario to verify resolution.
   - Execute project validation checks (`pnpm typecheck` and `pnpm test`).
   - Add a unit/integration test case to prevent regression.

## Exit Criteria

- Console error is completely resolved without silent exception swallowing.
- `pnpm typecheck` and `pnpm test` pass cleanly.
- No security boundaries or answer-key protection rules are violated.
