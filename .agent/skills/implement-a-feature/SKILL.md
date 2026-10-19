---
name: implement-a-feature
description: Guide for scoping, implementing, testing, and opening pull requests for a new feature slice in QuizForge.
---

# Implement a Feature Skill

## Step-by-Step Procedure

1. **Requirement Mapping**: Identify stage and requirement IDs from roadmap/spec.
2. **Context Inspection**: Inspect existing module/API/UI/schema and tests; document dependencies.
3. **Planning**: Write a brief acceptance checklist and negative/security cases.
4. **Vertical Slice Implementation**: Implement database → backend → shared contracts → frontend in minimal slices.
5. **Testing & Docs**: Add unit, integration, and UI tests; update API docs.
6. **Validation**: Run lint/typecheck/tests/build, capture actual results.
7. **PR Preparation**: Open PR with change summary, screenshots where useful, migration notes, risks, and rollback plan.

## Exit Criteria

Acceptance checks and relevant CI pass; no unapproved scope expansion.
