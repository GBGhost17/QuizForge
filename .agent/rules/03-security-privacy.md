---
trigger: always_on
description: 'Security, privacy, password hashing, score calculation, and assessment integrity rules.'
---

# Rule: Security, Privacy, and Assessment Integrity

- Authenticate and authorize every protected API and WebSocket action; ownership is server-derived.
- Never send answer keys, model answers, or private rubrics before authorized release.
- Hash passwords with Argon2id or equivalently robust KDF; store reset tokens hashed, expiring, single-use.
- Enforce rate limits, upload MIME/extension/size constraints, Markdown HTML sanitization, CORS/CSRF policy.
- Do not log secrets, passwords, student answer contents, or sensitive tokens.
- Enforce server-authoritative timers, attempt limits, score calculations, and atomic submit-once semantics.
- Use parameterized database access; prevent IDOR via ownership checks.
- Minimize personal data and document retention/export/deletion policies.
- Require explicit human approval for destructive migrations and production changes.
