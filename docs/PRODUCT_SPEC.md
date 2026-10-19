# QuizForge — Master Product & Technical Specification

**Version:** 1.0  
**Status:** Implementation baseline, subject to documented ADRs  
**Priority key:** P0 MVP, P1 extension, P2 optional  
**Normative language:** MUST = required; SHOULD = recommended; MAY = optional.

## 1. Product goals
Build an approachable, responsive web application for creating, distributing, completing, grading, and analyzing assessments. Optimize for teacher efficiency, student clarity, reliable scoring, and low-cost deployment. A single user account MAY be both a creator and a participant; access rights depend on resource ownership and participation.

## 2. Personas and roles
- Creator/Teacher: creates question banks, tests, assignments, reviews essays, releases results, views analytics.
- Participant/Student: joins assessments, submits answers, sees permitted feedback/history, practices independently.
- Self-learner: authors private banks/tests and completes self-practice.
- Administrator (P1): moderation and operational oversight, without default access to confidential answers.
- Guest participant (P1): joins only if creator enables guests; identity and attempt policy require explicit design.

## 3. Functional requirements
### FR-A: Authentication and accounts (P0)
- Email/password registration and login; secure password hashing (Argon2id preferred).
- Email verification and password reset via single-use, short-lived tokens. If email provider is unavailable locally, provide a safe development-only delivery adapter; never pretend an email was sent.
- Logout, session revocation, rate limiting, profile editing, password change.
- Permissions checked on every server resource; never trust client-provided role or ownership.
- Optional OAuth (P1).

### FR-B: Question Bank (P0)
- CRUD banks and questions, ownership, tagging, topic, difficulty, default points, explanation.
- Types: SINGLE_CHOICE, MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER, ESSAY.
- Single choice: exactly one correct option; multiple: one or more correct options; T/F: boolean; short answer: accepted normalized variants or manual review; essay: rubric and model answer optional.
- Support Markdown in prompts and explanations, rendered with sanitization and no executable HTML.
- Search, filter, pagination; archive/soft delete if referenced by tests.
- Do not leak correct answers to participants before permitted release.

### FR-C: Markdown import (P0)
- Upload `.md` UTF-8 within configurable size limit; never execute embedded content.
- Parse a strict, documented authoring convention. Frontmatter contains title, duration, subject and flags; questions start with `## Qn`, `type`, `points`, and type-specific answer fields.
- Show preview, duplicate warnings, and actionable line-level errors; allow user to correct before commit.
- Import is transactional; malformed input does not partially persist without explicit user confirmation.
- Parser MUST be deterministic and separately unit-tested. Arbitrary PDF/DOCX ingestion and LLM conversion are P2.

### FR-D: Test builder (P0)
- Draft tests with title, description, instructions, selected questions, point overrides, availability window, time limit, attempt limit, access policy, and result release mode.
- Configurable question shuffle and option shuffle; persist each attempt's assigned order.
- Publish creates an immutable TestVersion with question and answer-key snapshots; source-bank edits do not alter historical attempts.
- Share with URL and short code; QR code P1.
- Modes: ASSIGNMENT P0, PRACTICE P1, LIVE P1.
- Test lifecycle: DRAFT → PUBLISHED → CLOSED → ARCHIVED. Versioned republishing creates a new version.

### FR-E: Attempts (P0)
- Join by link/code, verify availability, access and attempt policy, and begin attempt.
- Render one or more questions with clear progress, navigation, and time remaining.
- Autosave answers, allow resume where policy permits, tolerate network interruptions.
- Server time is authoritative; expiry and duplicate submission handled atomically and idempotently.
- Statuses: IN_PROGRESS → SUBMITTED → (AUTO_GRADED / PENDING_REVIEW) → FINALIZED → RELEASED.
- Finalization and release are distinct; immediate release only after required grading is finalized.
- Prevent answer-key exposure via API responses, source maps, preloaded state, and analytics.

### FR-F: Grading (P0)
- Objective types graded deterministically on server; multiple-answer partial credit policy explicitly configurable (default exact match).
- Short answers: normalize whitespace/case with locale-aware caution; teacher can provide aliases or review manually.
- Essays: manual rubric grading, feedback, audit trail, override history.
- Release policy: ON_FINALIZATION, AFTER_ALL_GRADED, MANUAL. No premature release.
- AI-assisted essay scoring P2: opt-in, suggestion only, explain rubric evidence, human approval, no automatic final grades.

### FR-G: Results and history (P0)
- Student views only own attempts and results released by policy; teacher views attempts for owned tests.
- Show total/max points, per-question feedback where allowed, status, timestamps, history.
- Rankings P1 use finalized eligible scores, documented tie rules, and configurable privacy.

### FR-H: Live quiz (P1)
- Host creates room; students join with code/QR; synchronized question advancement and server timer.
- Socket authentication, authorization, reconnect/resync, heartbeat, disconnect tolerance, room capacity and abuse controls.
- Leaderboard updates only from eligible finalized scores and configured privacy rules.

### FR-I: Practice (P1)
- Private practice sessions, repeat wrong answers, immediate explanations, topic-based progress.
- Practice results never alter official graded assessment scores.

### FR-J: Analytics (P1)
- Participation, completion rate, score distribution, per-question accuracy, average/median, topic-level weaknesses.
- Avoid misleading statistics for tiny cohorts; aggregate only authorized, eligible attempts.
- CSV export optional P1; AI recommendations P2.

### FR-K: AI and document generation (P2)
- Optional document extraction → question generation → schema validation → teacher review → bank import.
- Optional local model (e.g. Ollama) behind adapter, not required for the app to function.
- Never send student personal data to external model providers without appropriate notice, controls, and authorization.

## 4. Screens and UX
Public: landing, register, login, password reset, join by code/link.
Creator: home, workspace, question banks, question editor, import preview, test builder, test detail, submissions/grading, analytics.
Participant: home, join test, instructions, test-taking, submission receipt, results, history, practice.
Shared: profile, settings, account security.
UX requirements: mobile-first; consistent component library; meaningful empty/loading/error/success states; keyboard accessibility; accessible labels and focus; confirmation for destructive actions; draft persistence; progress indicators; visible autosave state; clear grading status; avoid exposing hidden answers.

## 5. Domain and data model
Entities: User, Session/RefreshToken, PasswordResetToken, QuestionBank, Question, QuestionOption, Test, TestVersion, TestQuestionSnapshot, TestSession, Attempt, AttemptQuestionOrder, Answer, Grade, GradingAudit, ImportJob, Invitation/JoinCode. Add Rubric as entity or versioned JSON.
- User 1:N QuestionBank, Test, Attempt.
- QuestionBank 1:N Question.
- Test 1:N TestVersion; TestVersion 1:N immutable TestQuestionSnapshot.
- TestVersion 1:N TestSession; TestSession 1:N Attempt.
- Attempt 1:N Answer; Answer 0..1 Grade (plus audit history).
- Use UUID identifiers; database constraints, unique indexes, foreign keys, transaction boundaries.
- Store attempt option mapping to ensure shuffled option IDs remain stable.
- Separate private answer keys from student-facing serialization.
- Prefer UTC timestamps in storage; display user-local times.

## 6. API baseline
`/api/v1/auth/*`, `/users/me`, `/question-banks`, `/questions`, `/imports/markdown`, `/tests`, `/tests/:id/publish`, `/sessions/:id/join`, `/attempts`, `/attempts/:id/answers`, `/attempts/:id/submit`, `/answers/:id/grade`, `/results`, `/analytics`.
- REST with consistent response/error format, pagination, request validation, and OpenAPI docs.
- Authenticated mutations require ownership/participation checks.
- Submission endpoints use idempotency/transactional guards.
- Live events P1: `room:join`, `room:state`, `quiz:start`, `question:show`, `participant:status`, `quiz:end`, `leaderboard:update`.

## 7. Non-functional requirements
- Security: HTTPS in production, secret management, CSRF mitigation appropriate to auth approach, CORS allowlist, rate limits, file upload limits, HTML sanitization, server-side authorization, no answer leakage.
- Reliability: recoverable autosave, idempotent submit, database transactions, migrations, backups and restore documentation.
- Performance: paginated queries, indexes for joins/attempts, no unbounded analytics queries, reasonable mobile loading.
- Accessibility: target WCAG 2.2 AA where practical; keyboard and screen reader usability.
- Observability: structured logs with request IDs, health/readiness endpoint, no password/token/answer contents in logs.
- Maintainability: strict TypeScript, modular boundaries, schema validation, tests, ADRs, clear env configuration.
- Privacy: data minimization, teacher-visible leaderboard settings, deletion/retention strategy before production.

## 8. Testing and acceptance scenarios
1. Creator signs up and logs in; cannot edit another creator's bank.
2. Import valid Markdown, preview, commit; malformed input reports correct line and imports nothing.
3. Publish test, edit source question, verify published snapshot unchanged.
4. Student joins with code, answers autosave, refreshes, resumes, submits exactly once.
5. Objective score is computed server-side; essay waits for teacher review.
6. Results remain hidden until configured release conditions are met.
7. Student cannot retrieve other students' attempts or private answer keys.
8. Expired attempt cannot accept late changes; reconnect returns authoritative state.
9. Basic mobile and keyboard flow works; CI runs lint/typecheck/unit/integration/E2E smoke.

## 9. Open decisions (must be recorded before relevant implementation)
- Whether anonymous guests are allowed and how identity/attempt limits work.
- Email provider and deployment target.
- Short-answer matching rules for Vietnamese and English.
- Time limit policy on disconnect, tab closing, and deadline overlap.
- Whether test publication supports new versions while sessions are active.
- Partial credit, penalties, and tie-breaking defaults.
- Retention/deletion requirements and academic privacy expectations.
- Exact Markdown grammar and parser error taxonomy.

## 10. Out of scope for P0
AI as a hard dependency; high-stakes anti-cheating claims; webcam proctoring; payment plans; multi-tenant institution billing; microservices; complex adaptive testing; synchronous live rooms.
