---
trigger: always_on
description: 'TypeScript strictness, naming conventions, Zod validation, error handling, and testing standards.'
---

# Rule: Code Quality

- TypeScript strict mode; avoid `any`, unsafe casts, and non-null assertions without rationale.
- Name domain types explicitly; prefer discriminated unions for question/answer variants.
- Use Zod at shared input boundaries where appropriate; NestJS validates all DTOs.
- Keep functions cohesive; prefer pure grading/parser functions.
- Handle errors with actionable messages; never swallow exceptions.
- Use ESLint + Prettier; add tests for bug fixes.
- Follow established package conventions and avoid unrequested mass reformatting.
- Comments explain decisions and invariants, not obvious syntax.
