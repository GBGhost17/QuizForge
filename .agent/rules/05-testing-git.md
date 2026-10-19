---
trigger: always_on
description: 'Testing practices, Playwright E2E, conventional commits, and CI check requirements.'
---

# Rule: Tests, Git, and Change Management

- Every feature PR must include relevant unit and integration tests; core workflows need Playwright E2E.
- Markdown parser: valid/invalid fixture tests and line-number diagnostics.
- Grading: deterministic edge cases, rounding, partial-credit policy, and release gating.
- Attempt engine: duplicate submit, timeout, reconnect, ownership and concurrent requests.
- CI checks: install --frozen-lockfile, lint, typecheck, test, build; add DB integration when ready.
- Small conventional commits; branches `feat/Sxx-topic`, `fix/topic`, `docs/topic`.
- Never commit directly to default branch unless user explicitly authorizes it.
- Never report green CI or successful deployment without evidence.
