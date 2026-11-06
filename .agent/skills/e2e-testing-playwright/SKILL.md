---
name: e2e-testing-playwright
description: Standard workflow for creating, executing, and debugging Playwright E2E tests for core student, teacher, and assessment flows in QuizForge.
---

# Playwright E2E Testing Skill

Use this skill when implementing new end-to-end tests for quiz attempts, live submission, or authentication flows[cite: 6, 10].

## Step-by-Step Execution Procedure

1. **Identify Critical User Journey**:
   - Target specific paths like student attempt submission, server-authoritative timers, or markdown imports.
2. **Locate E2E Directory**:
   - Place test files in the appropriate testing directory (e.g., `apps/web/e2e/*.spec.ts`)[cite: 10].
3. **Implement Robust Selectors**:
   - Prefer user-visible locators (`getByRole`, `getByText`, `getByTestId`).
   - Avoid brittle CSS paths or fixed arbitrary timeouts.
4. **Execution & Debugging**:
   - Run tests headlessly for CI compliance:
     ```bash
     pnpm --filter web test:e2e
     ```
   - If a test fails, instruct the user to check the Playwright trace viewer or run in UI mode.
5. **Security & State Verification**:
   - Verify that UI elements do not expose hidden answer keys in the DOM before grade release.

## Exit Criteria

- All Playwright E2E tests pass without flakiness.
- Core assessment workflows are verified end-to-end.
