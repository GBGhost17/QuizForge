---
name: next-stage-planner
description: Reads the active stage (S00–S15) from the docs/ROADMAP.md, evaluates completion status, checks definition of done (DoD), and determines the exact next action or stage to proceed in QuizForge.
---

# Next Stage Planner Skill

## Step-by-Step Execution Procedure

1. **Stage Context Discovery**: Inspect `docs/ROADMAP.md` and active workspace status to identify current stage (S00–S15) and requirements.
2. **Verification against DoD**: Run validation checks (`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`) and verify tests/ADR documentation.
3. **Next Action Decision Logic**:
   - **If Incomplete**: Identify missing slices and formulate immediate execution steps without scope creep.
   - **If Complete**: Record evidence, declare stage completion, and transition to stage `S(xx+1)`.
4. **Report Output**: Output decision using standard reporting format (`Stage`, `Current Status`, `Validation Evidence`, `Decided Next Step`).

## Exit Criteria

- Unambiguous next-step decision formulated.
- Zero scope expansion beyond active stage boundaries.
