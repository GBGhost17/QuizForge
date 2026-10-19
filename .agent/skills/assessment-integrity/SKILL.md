---
name: assessment-integrity
description: Procedures for handling test publication, attempts, grading engine, and historical attempt immutability.
---

# Assessment Integrity Skill

## Step-by-Step Procedure

1. **Invariants Verification**: List invariants: immutable snapshots, server-only keys, persisted shuffle order, server time, submit once.
2. **State Modeling**: Model state transitions and forbidden transitions explicitly.
3. **Test-First Concurrency**: Write concurrency and authorization tests before implementing mutations.
4. **Transactional Safety**: Use transactions and uniqueness constraints for publish/submit/finalize.
5. **Release Policy Enforcer**: Confirm release policy hides both scores and answer details until allowed.
6. **Snapshot Protection**: Verify source question edits do not alter historical attempts.

## Exit Criteria

Tests cover duplicate, late, unauthorized, interrupted, and concurrent actions.
