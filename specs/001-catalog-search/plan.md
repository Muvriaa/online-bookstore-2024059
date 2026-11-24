# Implementation Plan: Catalog and Search

**Branch**: actual Git branch `main`; feature identifier `001-catalog-search` (no feature branch created) | **Date**: 2026-11-23 | **Spec**: [approved spec](spec.md)

**Input**: specs/001-catalog-search/spec.md, including four approved clarifications of 2026-11-23. Planning only; no implementation or test evidence is claimed.

## Summary

Add backend book/category CRUD, D1 relational persistence, ID-ordered browsing and literal ASCII-case-insensitive title/author search to the existing Worker. Use small routing, validation, database and error modules, prepared statements and database constraints. No ORM, UI, FTS, customers, orders, courses or other future entities.

## Technical Context

**Language/Version**: TypeScript ^5.7.0 in package.json, strict ES2022 target; actual installed version not asserted.
**Primary Dependencies**: existing Wrangler ^4.0.0, Vitest ^4.1.0, @cloudflare/vitest-plugin ^1.0.0; standard Worker Request/Response and configured DB binding. No new runtime dependency planned.
**Storage**: Cloudflare D1 (SQLite semantics), existing bookstore-db / DB configuration in wrangler.jsonc.
**Testing**: real npx vitest run through current Cloudflare plugin; local Wrangler SQL; npm run typecheck. All are future checks, currently Not verified.
**Target Platform**: local Cloudflare Worker runtime; compatibility_date 2026-11-19.
**Project Type**: API web service, one existing Worker.
**Performance Goals**: none approved; no latency, throughput or dataset-size target invented.
**Constraints**: local-only classroom mutations; no publicly exposed unauthenticated CRUD, remote deployment, remote migration, destructive reset, REPLACE writes, or protected/configuration file changes in this planning pass.
**Scale/Scope**: two entities, six reference books, three seed categories; page default 20, max 100. No production scale promise.

## Constitution Check

[Constitution v1.0.0](../../.specify/memory/constitution.md). Pre-research and post-design gates:

| Gate | Pre-research | Post-design |
|---|---|---|
| I Approved spec as sole requirements source | PASS: spec and four explicitly approved clarifications read | PASS: FR/SC traceability below; contract details realize requirements, not new business scope |
| II Student approval, small feature | PASS: planning authorized | PASS: no tasks.md or implementation; future tasks require separate approval |
| III Real verification, honest evidence | PASS: no results invented | PASS: runnable future guide; runtime assumptions labeled Not verified |
| IV Data integrity first | PASS: constraints and atomicity are requirements | PASS: PK/FK/UNIQUE/CHECK/triggers, direct SQL and unchanged-snapshot verification designed |
| V Single writer | PASS: initial git status clean; assigned feature directory ownership | PASS: edits only assigned specs subtree; existing metadata unchanged |
| VI Separate requirements/code/wiki | PASS: approved spec is authority | PASS: no code/wiki/raw-source edits |
| Security and boundaries | PASS: repository-only, no secrets needed | PASS: local-only validation instructions; no deployments or external writes |

Design gates pass, not implementation acceptance. Any runtime incompatibility revealing an unapproved rule blocks affected work pending clarification rather than silently changing this design.

## Project Structure

### Documentation (this feature)

- [spec.md](spec.md): requirements and approved clarification record.
- [plan.md](plan.md): this plan.
- [research.md](research.md): decisions, alternatives and verification risks.
- [data-model.md](data-model.md): stored-value constraints and seed contract.
- [contracts/api.md](contracts/api.md): wire contract.
- [quickstart.md](quickstart.md): future validation procedure.
- tasks.md: later speckit-tasks output; intentionally not created now.

### Source Code (repository root; planned, not created)

	src/index.ts                existing entry; preserve health/root behavior
	src/catalog/routes.ts       route/method dispatch and response composition
	src/catalog/validation.ts   JSON, fields, text, ID and query validation
	src/catalog/db.ts           parameterized queries and row mapping
	src/catalog/errors.ts       stable public error envelopes
	src/catalog/types.ts        entity and minimal DB binding types
	migrations/0001_catalog.sql schema, constraints, category index, ID triggers
	sql/seed.sql                exact reference fixture; categories first
	tests/worker.test.ts        retain health, replace obsolete catalog-404 assertion
	tests/catalog.test.ts       CRUD and API acceptance
	tests/catalog-db.test.ts    actual D1 constraint checks
	tests/catalog-validation.test.ts boundary validation

**Structure Decision**: extend the single Worker, not a parallel backend. Current src/index.ts only implements health/root/404; current tests include health and a temporary catalog-404 expectation. The existing wrangler.jsonc DB binding and vitest.config.ts plugin remain the foundation. Do not rewrite configuration merely to introduce the feature. With tsconfig types: [], prefer narrowly scoped DB interfaces in src or already available compatible declarations; verify by typecheck rather than assuming a global D1Database type. Apply migrations in test setup against isolated test DB state using plugin-supported APIs verified in the installed version. Any needed out-of-scope configuration change requires permission first.

## Execution Design

1. Validate method/path, JSON media type and body, field whitelist and original JSON types before writes; trim only approved fields and count code points.
2. Generate IDs only in DB. Insert or delete once; PATCH builds SET columns from a fixed whitelist and binds all values in one atomic UPDATE. Never read-merge-write or REPLACE. Constraints remain authoritative for conflicts, including races.
3. Select books joined to categories for category_name. Search predicate is instr(lower(b.title), lower(?)) > 0 OR instr(lower(b.author), lower(?)) > 0, with the same bound q in both positions. Count and items use identical filters; items ORDER BY b.id ASC. No LIKE wildcards or description search.
4. Compute offset with BigInt(page - 1) * BigInt(page_size), preserving exact parsed integers. Count first; if offset >= total, return empty items without binding an oversized offset. Otherwise convert the bounded offset safely for D1. Do not introduce a smaller page maximum.
5. Map known constraint conflicts to 409, unexpected DB failures to sanitized 500; missing-resource mutations return 404. Failed PATCH cannot partially update fields. Reads never write. Consistency guarantee for paging is the spec's unchanged-dataset condition, not an invented cross-request snapshot guarantee.
6. Build future seed only for a fresh dedicated local state. Plain category inserts precede six exact book inserts, explicit reference IDs retained. Conflicts fail visibly; no upsert/ignore/replace/reset. Verify actual local batch/seed behavior rather than assuming shell-level atomicity of a whole file.

## Traceability and Verification Coverage

| Requirement | Design location | Future evidence / success criteria |
|---|---|---|
| FR-001 | data-model; DB binding and joins | D1 rows, FK checks, restart; SC-001/005/006 |
| FR-002 | API route matrix; routes module | Both complete CRUD lifecycles; SC-001/004 |
| FR-003 | AUTOINCREMENT, ID triggers, whitelist and safe IDs | supplied/changed IDs rejected, generated deletion nonreuse; SC-001/004/005/006 |
| FR-004 | book field checks in model/contract | null/type/length/ISBN/numeric boundaries, defaults; SC-004/005 |
| FR-005 | category name model/contract | trimmed names, code points, duplicate names allowed; SC-001/004 |
| FR-006 | FK RESTRICT, UNIQUE/CHECK, atomic PATCH | direct invalid inserts/updates, snapshot unchanged; SC-005 |
| FR-007 | literal instr/lower predicate | exact SQL/smith IDs, description exclusion, quotes/%/_, dual match once; SC-003 |
| FR-008 | query parser, BigInt offset, matching count | all six once, ordered pages, duplicates/boundaries/huge page; SC-002/004 |
| FR-009 | error contract | 400/404/409/405/415/500 assertions; no leaks/false empty success; SC-004/007 |
| FR-010 | unchanged health/root, read-only queries | retain health test, read snapshots, restart; SC-006/007 |

SC-001–SC-007 all require actual future execution and recorded evidence; none is satisfied by this document alone.

## Phase Outputs and Workflow

Phase 0: research decisions resolved from approved design and inspected repository; runtime checks remain explicit verification work, not unanswered business requirements. Phase 1: model, contract and quickstart complete. setup-plan.sh was inspected, then run after copying the core template into the allowed plan path: this avoided its external mktemp branch. It resolved this feature and did not change feature.json. No extensions.yml exists, so neither before_plan nor after_plan hooks are registered. No agent-context/config update is authorized or needed.

Next: generate tasks separately, show them to the student, and obtain approval before implementation. No commit in this pass.

## Complexity Tracking

No constitution violations or complexity exceptions. Direct D1 and four small responsibility modules are sufficient; no ORM, framework, historical-ID ledger or search service.
