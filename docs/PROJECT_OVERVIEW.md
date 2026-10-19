# QuizForge — Project Overview

> Status: Planning / repository bootstrap. Version: 1.0. This document is the entry point for human contributors and coding agents.

## Vision
QuizForge is a responsive, accessible, full-stack assessment platform for teachers, students, and independent learners. Users can author questions manually or import a documented Markdown format; assemble reusable tests; distribute them through links, codes, and eventually QR codes; take assessments; grade answers; and inspect progress and analytics. Live synchronized quiz rooms and AI assistance are phased additions.

## Start here (agents)
1. Read `docs/PRODUCT_SPEC.md` for requirements and business rules.
2. Read `docs/ROADMAP.md` for stages, scope, and acceptance gates.
3. Read `AGENTS.md` and applicable `agent/rules/*.md` before editing code.
4. Read `agent/skills/README.md` and invoke the relevant skill checklist for the task.
5. Use `docs/DECISIONS.md` to record architecture decisions and unresolved questions.
6. Follow `prompts/CLAUDE_GITHUB_BOOTSTRAP.md` only for repository bootstrap.

## Technology baseline
- Monorepo: pnpm workspaces, Node.js 22 LTS baseline (verify current support at implementation time).
- Web: React, TypeScript, Vite, React Router, TanStack Query, Tailwind CSS, shadcn/ui, React Hook Form, Zod.
- API: NestJS, TypeScript, REST, Socket.IO for phase 2.
- Persistence: PostgreSQL, Prisma ORM.
- Testing: Vitest, Jest/Supertest, Playwright.
- Local development: Docker Compose for PostgreSQL; `.env.example` without secrets.
- CI: GitHub Actions (lint, typecheck, tests, build).

## MVP definition
A creator can register, create or import questions, configure and publish a versioned assignment, share a join code or link, accept a student's attempt, automatically grade objective items, manually grade essays, and release results according to policy. Access control and persistence must work end-to-end.

## Explicit non-goals for initial MVP
No required AI service, no microservices, no payments, no proctoring guarantees, no adaptive engine, no live synchronized gameplay, and no full PDF/DOCX-to-question generation.

## Target repository layout
```text
quizforge/
  apps/
    web/
    api/
  packages/
    shared-types/
    validation/
  docs/
  agent/
    rules/
    skills/
  prompts/
  .github/workflows/
  docker-compose.yml
  pnpm-workspace.yaml
  package.json
  .env.example
  AGENTS.md
  README.md
```

## Implementation order
Bootstrap → Auth → Question Bank → Markdown Import → Test Builder → Attempts → Grading → History → Security/E2E → Live/Analytics → Optional AI.

## Completion standard
A feature is complete only when validation, authorization, tests, error states, documentation, and the acceptance criteria are satisfied. Do not claim commands ran unless tool output confirms it.
