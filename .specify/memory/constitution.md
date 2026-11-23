<!--
Sync Impact Report
Version: unratified template -> 1.0.0 (initial adoption).
Replaced placeholder principles with approved principles I-VI.
Added: Security and Repository Boundaries; Development Workflow and Review Gates;
project-specific Governance. Removed: template examples and placeholders.
Follow-up TODOs: none. Templates and commands were not modified.
Temporary review report: remove before committing the constitution.
-->

# Online Bookstore Capstone Constitution

## Core Principles

### I. Approved Specifications Are the Source of Truth
Student-approved `specs/<feature>/spec.md` files MUST be the sole source of feature requirements. Plans, tasks, code, and tests MUST trace back to them.

Proposals, conversations, and Wiki notes MUST NOT silently become requirements. Missing or ambiguous behaviour MUST be raised as questions.

### II. Student Approval and Small Features
Development MUST proceed one small feature at a time using GitHub Spec Kit.

New specifications and specification changes MUST be presented as proposed diffs and written only after explicit student approval. Implementation MUST begin only after the student approves the corresponding tasks. Approval of one feature MUST NOT authorize unrelated work.

### III. Real Verification and Honest Evidence
Each implemented feature MUST be checked using real tests with `npx vitest run` and relevant local SQL verification using `wrangler d1 execute --local`.

Results MUST be compared with approved acceptance criteria. Reports MUST distinguish passing, failing, blocked, and unexecuted checks.

Test results, SQL output, and completion claims MUST NEVER be invented. Missing evidence MUST be marked **Not verified**.

### IV. Data Integrity First
Approved data rules MUST be enforced through appropriate primary keys, foreign keys, uniqueness, nullability, validation, and transaction boundaries.

Tests MUST verify valid operations and rejection of invalid data, including duplicate relationships and orphan references where applicable. Multi-step operations MUST preserve consistency on failure.

Specific constraints MUST come from approved specifications, not assumptions.

### V. Single-Writer Ownership
Each writable file MUST have one designated writer at a time. Parallel workers MUST use non-overlapping write scopes; reviewers MUST remain read-only unless ownership is explicitly transferred.

Before editing, the writer MUST inspect current changes and preserve existing work. Conflicting edits MUST be resolved explicitly, never overwritten silently.

### VI. Separate Requirements, Implementation, and Knowledge
Specifications define requirements; code implements them; the LLM-Wiki records sourced knowledge.

Wiki operations MUST write only under `docs/llm-wiki/wiki/`. Raw sources MUST remain read-only. Wiki work MUST NOT modify specifications, application code, migrations, tests, or `docs/*.md`.

Every technical Wiki claim MUST cite its source path. Ingestion MUST update the index and append to the operation log. Contradictions and stale statements MUST be reported, not resolved by silently changing requirements.

## Security and Repository Boundaries

- All changes MUST remain inside this repository; commands MUST run from its root.
- Development MUST follow `AGENTS.md` and `skills/bookstore-sdd/SKILL.md`; Wiki work MUST also follow `docs/llm-wiki/WIKI-RULES.md`.
- Secrets, `.dev.vars`, API tokens, and real payment information MUST NOT be printed, committed, or embedded in artifacts.
- The agent MUST NOT run remote deployment or remote D1 migrations. The student performs those operations manually.
- Files or data MUST NOT be deleted without explicit approval.
- Existing protected paths and write restrictions MUST remain in force. Task approval MUST NOT implicitly broaden write permissions.

## Development Workflow and Review Gates

1. Identify one feature and read its existing specification, if present.
2. Use `speckit-specify` and clarification as needed; obtain approval before writing requirements.
3. Run `speckit-plan`, then `speckit-tasks`; show the task list and wait for approval.
4. Use `speckit-implement` only for approved tasks.
5. Run real tests and relevant local SQL checks; compare evidence against acceptance criteria.
6. If verification reveals a missing requirement, stop affected implementation and propose a `CHG-xxx` specification change for approval. Follow the course change-record procedure without bypassing write restrictions.
7. Run `speckit-converge` before each Review. Newly identified work remains subject to approval.
8. Report changed files, commands, actual results, and unmet criteria.

A feature is complete only when the student approves its specification, code, and test evidence.

## Governance

This constitution governs project development alongside the course rules; it does not override their safety or write restrictions. Conflicts MUST be raised before action.

Amendments MUST include a proposed diff, rationale, affected artifacts, and explicit student approval before writing. Every feature review MUST check constitutional compliance.

Versioning MUST follow:
- **MAJOR:** incompatible principle changes or removals.
- **MINOR:** new principles or materially expanded guidance.
- **PATCH:** clarifications without changed obligations.

**Version**: 1.0.0 | **Ratified**: 2026-11-23 | **Last Amended**: 2026-11-23
