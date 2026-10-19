# QuizForge — Incremental Development Roadmap

Each stage must result in a reviewable pull request. Dependencies are explicit. P0 = MVP; P1 = extension; P2 = optional.

| ID | Priority | Stage | Depends on | Deliverable / acceptance gate |
|---|---|---|---|---|
| S00 | P0 | Discovery and decisions | none | Review specification; record assumptions, open decisions, initial threat model |
| S01 | P0 | Repository bootstrap | S00 | pnpm workspace; web/api compile; CI; lint/format; env examples; health endpoint; README commands |
| S02 | P0 | Database foundation | S01 | Prisma schema and migration; PostgreSQL Compose; seed strategy; integration test DB |
| S03 | P0 | Authentication and permissions | S02 | Register/login/logout/reset flow; hashed passwords; creator/participant permissions; auth tests |
| S04 | P0 | UI shell and design system | S01,S03 | Responsive navigation, auth screens, empty/loading/error states, keyboard support |
| S05 | P0 | Question Bank CRUD | S02,S03,S04 | Five question types; validation; search/filter; ownership enforcement; API/UI tests |
| S06 | P0 | Markdown import | S05 | Strict format, parse/preview, line-specific errors, transactional import, fixture tests |
| S07 | P0 | Test builder and publishing | S05 | Draft configuration, immutable published snapshots, randomization policy, join code/link |
| S08 | P0 | Student attempt engine | S07 | Join/access policy, start, autosave, resume, timer, submit-once, server-side checks |
| S09 | P0 | Grading and result release | S08 | Objective grading, essay rubric/manual review, score states, release policy |
| S10 | P0 | History and MVP hardening | S09 | Teacher/student history, security tests, E2E golden path, deployment guide |
| S11 | P1 | Analytics and leaderboard | S10 | Accurate aggregates, finalized-score ranking, privacy controls |
| S12 | P1 | Live rooms and QR | S10 | Socket authentication, server-authoritative room state, reconnect, QR, load tests |
| S13 | P1 | Self-practice | S10 | Personal practice, retry wrong answers, explanations, progress history |
| S14 | P2 | AI-assisted grading | S09 | Opt-in suggestion-only grading, rubric evidence, human approval, audit log |
| S15 | P2 | Document-to-question AI | S06 | Extraction pipeline, AI generation, schema validation, human review |

## Stage execution template
For each stage, the agent must: (1) read relevant specification/rules; (2) inspect existing code; (3) propose a narrow implementation plan; (4) implement minimal changes; (5) run relevant tests/typecheck/lint; (6) document results and limitations; (7) open a PR rather than merging autonomously.

## Example 12-week allocation (adjust to team capacity)
- Weeks 1–2: S00–S04
- Weeks 3–4: S05–S06
- Weeks 5–6: S07–S08
- Weeks 7–8: S09–S10 (MVP milestone)
- Weeks 9–10: S11–S12
- Weeks 11–12: S13, hardening, demo, documentation. S14–S15 only if core is stable.

## Global acceptance gates
- All required checks pass in CI; no secrets committed.
- Every mutating endpoint enforces authentication/authorization and validates input.
- Server controls time limits, score calculation, attempts, and answer-key visibility.
- Existing published tests and attempt history remain immutable after question edits.
- Critical flows include unit/integration/E2E coverage and clear error handling.
- Accessibility: keyboard navigation, labels, focus states, semantic HTML, readable contrast.

## First executable vertical slice
Create an authenticated teacher → create one single-choice question → publish an assignment → student joins → submits → teacher/student view authorized finalized result. Then generalize to other question types and Markdown import.
