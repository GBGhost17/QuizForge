---
name: review-and-release
description: Validating PRs, executing security checks, verifying CI outputs, and preparing deployment releases.
---

# Review and Release Skill

## Step-by-Step Procedure

1. **Scope Audit**: Review scope against stage acceptance and ADRs.
2. **Security Check**: Check auth, ownership, answer-key leakage, input validation, secrets, migrations.
3. **Verification**: Run formatting, lint, typecheck, unit/integration/E2E, build; record exact outputs.
4. **UX Review**: Check responsive UX, keyboard flows, loading/error states.
5. **Operational Audit**: Review migration rollback, backup, env docs, observability and performance risks.
6. **Release Summary**: Prepare PR/release notes with verified results and outstanding issues.

## Exit Criteria

Reviewer approval and explicitly authorized merge/deployment.
