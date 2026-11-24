---
description: "Proposed implementation tasks for Catalog and Search"
---

# Tasks: Catalog and Search

**Feature**: 001-catalog-search
**Status**: Draft — awaiting student approval before implementation.
**Input**: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/api.md](contracts/api.md), [quickstart.md](quickstart.md), [constitution](../../.specify/memory/constitution.md).
**Tests**: Required by the approved specification. All execution and acceptance evidence is **Not verified**. Drafting this list runs no tests, SQL, migration, seed, or server.
**Organization**: Setup → foundations → US1 categories → US2 books → US3 browsing → US4 search → cross-cutting verification. All stories are P1.

## Format and Path Conventions

Each checklist line has an ID, optional [P], story label within story phases, and repository-relative paths. [P] means independent file ownership after stated prerequisites; no implementation tasks are marked parallel because they share modules. All paths below are repository-relative unless linked from this feature directory.

Approval authorizes only these tasks within existing write permissions: src/, migrations/, tests/, sql/seed.sql and approved feature documentation. Do not alter protected files, package/configuration files, dependencies, agent context, or requirements. Stop and request permission if existing tooling cannot support the plan. Keep existing work; no commit, remote execution, deployment, public CRUD, destructive reset, seed overwrite, REPLACE, or sequence reset. Destructive lifecycle checks concern only explicitly approved disposable fixtures in isolated local state.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish a safe, compatible implementation/test boundary without configuration changes.

- [ ] T001 Inspect current changes and installed test-plugin migration/D1 APIs against specs/001-catalog-search/plan.md, package.json, vitest.config.ts and wrangler.jsonc; record ownership, usable APIs and any blockers in specs/001-catalog-search/quickstart.md without changing configuration.
- [ ] T002 Create reusable actual-D1 test setup, migration loading, isolated fixtures and full ordered row-snapshot helpers in tests/helpers/catalog.ts using T001's verified APIs; keep CLI persisted state separate, avoid global resets and document fixture ownership.

**Checkpoint**: D1 test harness can exercise real constraints; missing tooling is a blocker, never permission to mock all persistence.

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared schema and request/error foundations; complete before story implementation.

### Tests first

- [ ] T003 [P] Write schema tests in tests/catalog-db.test.ts using tests/helpers/catalog.ts: actual D1 INSERT/UPDATE checks for every field's required/type/value rules (NOT NULL rejection excludes generated PK input: omitted/SQL NULL id generates; API-supplied id including null is rejected), PK/FK/UNIQUE/CHECK, defaults, allowed duplicate names/title/author, all JS trim characters, excluded non-trim characters, astral/combining boundaries and NUL; test both immutable-ID triggers including an unused category, highest-generated-ID deletion/nonreuse, safe ID bounds and unchanged snapshots after each failed statement, respecting SQLite affinity.
- [ ] T004 [P] Write shared boundary tests in tests/catalog-validation.test.ts for JSON media type/shape/parsing, field whitelists, original types/null, safe path IDs, Unicode code-point/trim/NUL semantics, integer boundaries, supported repeated queries, exact huge offsets and error envelopes from specs/001-catalog-search/contracts/api.md; isolate simultaneous faults rather than invent precedence.

### Implementation

- [ ] T005 Add schema, category-reference index and immutable-ID triggers in migrations/0001_catalog.sql; implement all stored constraints from data-model.md Category.id, data-model.md Category.name, data-model.md Book.id, data-model.md Book.category_id, data-model.md Book.isbn, data-model.md Book.title, data-model.md Book.author, data-model.md Book.description, data-model.md Book.price_cents and data-model.md Book.stock; preserve AUTOINCREMENT and RESTRICT semantics, no historical-ID ledger.
- [ ] T006 Define entities, joined-book output and minimal compatible DB binding interfaces in src/catalog/types.ts, citing data-model.md Category.id, data-model.md Category.name, data-model.md Book.id, data-model.md Book.category_id, data-model.md Book.isbn, data-model.md Book.title, data-model.md Book.author, data-model.md Book.description, data-model.md Book.price_cents and data-model.md Book.stock; keep category_name derived, not stored or writable.
- [ ] T007 Implement shared JSON/object/whitelist, text and safe path-ID validators in src/catalog/validation.ts plus public error construction/classification in src/catalog/errors.ts per specs/001-catalog-search/contracts/api.md; path identity follows data-model.md Category.id and data-model.md Book.id; sanitize unexpected failures, preserve field attribution and distinguish conflicts from 500.

**Checkpoint**: Run foundational tests after approval; schema checks pass and unimplemented story tests may still fail. No story implementation before this foundation.

## Phase 3: User Story 1 — Manage Categories (P1; MVP)

**Goal**: Complete category CRUD with stable identities and restricted deletion.
**Independent test**: Category lifecycle without books; separately insert a direct-D1 book fixture to prove referenced deletion is rejected without requiring US2 endpoints.

### Tests first

- [ ] T008 [P] [US1] Add D1-backed category API tests in tests/catalog.test.ts for US1 acceptance 1–6, exact representations/statuses, duplicate names allowed, list ordering/count/paging, missing/invalid IDs, generated IDs/nonreuse, supplied IDs/unknown fields, empty/identical PATCH, malformed bodies/media types/methods and unchanged snapshots on rejection; include direct-D1 referenced-book fixture.
- [ ] T009 [P] [US1] Extend category field/query boundary cases in tests/catalog-validation.test.ts for missing/null/wrong-type/blank/name lengths, full JS trim set, astral/combining strings and NUL; test category collection pagination defaults, bounds, duplicate supported parameters and huge safe page inputs per specs/001-catalog-search/contracts/api.md.

### Implementation

- [ ] T010 [US1] Implement category POST/PATCH validation and shared exact pagination parsing/BigInt offset handling in src/catalog/validation.ts; apply data-model.md Category.name and data-model.md Category.id, reject supplied identities and preserve identical-value PATCH validity.
- [ ] T011 [US1] Implement bound category create/get/list/single-statement PATCH/delete queries in src/catalog/db.ts; enforce data-model.md Category.id and data-model.md Category.name, return generated identity, count before bounded offset, order IDs, map missing rows and restricted-delete conflicts without read-merge-write.
- [ ] T012 [US1] Add category route/method dispatch in src/catalog/routes.ts and wire src/index.ts to DB-bound catalog handling; produce contract status/envelopes, preserve root/health/unrelated fallback exactly, and run US1 tests to confirm all six acceptance scenarios.

**Checkpoint**: Categories are an independently demonstrable local MVP; no claim that the complete catalog feature is done.

## Phase 4: User Story 2 — Manage Books (P1)

**Goal**: Book CRUD with validated fields, category reassignment, ISBN conflicts and atomic updates.
**Independent test**: Use direct-D1 category fixtures; complete book lifecycle without relying on category HTTP creation. Browse/search deletion assertions remain integration obligations for US3/US4.

### Tests first

- [ ] T013 [P] [US2] Add D1-backed book CRUD tests in tests/catalog.test.ts for US2 acceptance 1–8: generated/stable/nonreused IDs, all stored/output fields and joined category name, omitted-field preservation, reassignment, missing-category/duplicate-ISBN create and PATCH conflicts, deletion/404, full failed-write snapshots, defaults and nonunique title/author; add later list/search-absence assertions before their implementation.
- [ ] T014 [P] [US2] Extend tests/catalog-validation.test.ts for each book POST/PATCH field's required/null/original-type/length/range constraints, ASCII-only ISBN without checksum/trim, text code points/JS trim/NUL, preserved description whitespace, zero/max numerics, safe category_id, unknown/category_name/id fields and empty updates.

### Implementation

- [ ] T015 [US2] Implement book create/partial-update validation in src/catalog/validation.ts using data-model.md Book.category_id, data-model.md Book.isbn, data-model.md Book.title, data-model.md Book.author, data-model.md Book.description, data-model.md Book.price_cents and data-model.md Book.stock; reject supplied identity per data-model.md Book.id, default description only on create and preserve omitted PATCH fields.
- [ ] T016 [US2] Implement parameterized book create/get/joined-output/PATCH/delete in src/catalog/db.ts using data-model.md Book.id, data-model.md Book.category_id, data-model.md Book.isbn, data-model.md Book.title, data-model.md Book.author, data-model.md Book.description, data-model.md Book.price_cents and data-model.md Book.stock; use one whitelisted UPDATE, authoritative constraint-conflict handling, immutable identity and missing-row detection.
- [ ] T017 [US2] Implement book POST and item GET/PATCH/DELETE dispatch in src/catalog/routes.ts and conflict mapping in src/catalog/errors.ts per specs/001-catalog-search/contracts/api.md; verify every CRUD status, bodyless 204, sanitized failures and partial-update invariance with the US2 tests.

**Checkpoint**: Book CRUD passes independently; downstream browse/search deletion assertions are explicitly pending, not passing.

## Phase 5: User Story 3 — Browse the Catalog (P1)

**Goal**: Exact seeded catalog, complete joined representations, read-only ordered paging and persistence.
**Independent test**: Load fixed D1 fixtures, compare exact returned IDs/fields across all pages, and separately restart the local Worker against the same persisted state.

### Tests first

- [ ] T018 [P] [US3] Add browsing tests in tests/catalog.test.ts for US3 acceptance 1–4 and US2 deletion absence: six exact rows once across pages, complete category joins and rename reflection, totals/defaults/beyond-last pages, empty catalog, zero stock, huge exact offsets, invalid/repeated pagination and unchanged snapshots after reads.
- [ ] T019 [P] [US3] Add fresh-state seed tests in tests/catalog-db.test.ts comparing every column against data/books.sample.json and the categories in specs/001-catalog-search/data-model.md; verify post-seed generated IDs advance beyond fixture IDs and seed conflicts fail visibly without overwrite, without assuming whole-file rollback.

### Implementation

- [ ] T020 [US3] Write plain category-first reference inserts in sql/seed.sql, copying all six books and descriptions verbatim from data/books.sample.json; follow data-model.md Category.id, data-model.md Category.name, data-model.md Book.id, data-model.md Book.category_id, data-model.md Book.isbn, data-model.md Book.title, data-model.md Book.author, data-model.md Book.description, data-model.md Book.price_cents and data-model.md Book.stock and its fresh-state seed contract; never upsert/ignore/reset.
- [ ] T021 [US3] Implement joined book collection count/items queries in src/catalog/db.ts and GET /api/books composition in src/catalog/routes.ts using specs/001-catalog-search/contracts/api.md; use ID order, identical count/item scope, exact bounded offsets, complete representations and no stock filter or writes; verify browsing tests.

**Checkpoint**: Automated browsing/seed checks pass; restart acceptance US3.5 is reserved for T034's real persistence evidence.

## Phase 6: User Story 4 — Search Title and Author (P1)

**Goal**: Literal ASCII-case-insensitive title/author substring search with exact result IDs.
**Independent test**: Fixed isolated D1 fixtures, including punctuation, dual-field matches and non-ASCII characters; compare exact IDs and totals, not only result counts.

### Tests first

- [ ] T022 [P] [US4] Add D1-backed search tests in tests/catalog.test.ts for US4 acceptance 1–7: SQL/smith/trimmed q, title OR author once, description-only exclusion, no match, literal quotes/%/_/SQL-looking strings, ASCII-only folding/non-ASCII exactness, paging/count equality and successful update/deletion visibility; verify search reads preserve snapshots.
- [ ] T023 [P] [US4] Add q validation tests in tests/catalog-validation.test.ts for omitted versus supplied blank, exact code-point boundaries, astral/combining text, JS trim/NUL and repeated supported query parameters per specs/001-catalog-search/contracts/api.md; do not invent unsupported-query rejection policy.

### Implementation

- [ ] T024 [US4] Implement q parsing in src/catalog/validation.ts and pass validated search arguments through src/catalog/routes.ts per specs/001-catalog-search/contracts/api.md; preserve browse behavior when q is omitted.
- [ ] T025 [US4] Add bound instr/lower title-OR-author predicates to both count/items in src/catalog/db.ts per specs/001-catalog-search/research.md R4; exclude description, preserve literal punctuation and unique rows, and verify exact-ID search plus update/delete integration tests against real D1.

**Checkpoint**: All story API assertions are green; only full cross-cutting/local SQL/persistence evidence and student review remain.

## Phase 7: Polish & Cross-Cutting Verification

**Purpose**: Close error/regression coverage and gather actual evidence, not assumed results.

- [ ] T026 Extend tests/worker.test.ts to retain exact health, root and unrelated-route regressions and replace only obsolete catalog-404 coverage with a D1-backed successful collection check using tests/helpers/catalog.ts.
- [ ] T027 Complete cross-route error tests in tests/catalog.test.ts for contract 400/404/409/405/415/500 codes/fields and safe messages, including reads/counts/writes with controlled failure injection and unchanged actual-D1 snapshots for rejected writes; failure injection supplements, never replaces real constraint tests.
- [ ] T028 Run npx vitest run and npm run typecheck from repository root; record commands, versions, actual outputs/exit codes and criterion-level pass/fail/blocked status in specs/001-catalog-search/quickstart.md; no configuration workaround or unapproved scope expansion.
- [ ] T029 Follow specs/001-catalog-search/quickstart.md to choose a new unused repository-local persisted state, apply migrations/0001_catalog.sql and sql/seed.sql with Wrangler --local only, and compare full categories/books rows with data/books.sample.json; preserve failures and partial seed evidence, never reset or rerun into populated state.
- [ ] T030 Construct and validate the per-case SQL inventory and evidence slots in specs/001-catalog-search/quickstart.md before T031–T032, including both duplicate PKs, unused-category trigger, both entities' safe-ID and successful text/numeric boundaries; isolate extreme IDs in separate fresh disposable state. Execute direct Wrangler local schema/runtime checks from that guide: PK/FK/UNIQUE/NOT NULL/CHECK/defaults/index/AUTOINCREMENT/both triggers, foreign_keys enabled, Unicode lengths/NUL/ASCII-only lower; capture real output, not schema-text inference alone.
- [ ] T031 Execute each negative INSERT/UPDATE and referenced-category DELETE in specs/001-catalog-search/quickstart.md independently with Wrangler d1 execute --local; cover duplicate PKs for both entities, FK/ISBN/required non-PK/type/text/value/safe-ID violations (including Book.id), both ID triggers including an unused category, and failed multi-field writes; compare full ordered snapshots before/after every failure and retain individual errors/exit codes.
- [ ] T032 Execute direct local successful boundary fixtures and highest-generated-ID delete/recreate nonreuse checks for both entities from specs/001-catalog-search/quickstart.md; capture generated IDs for omitted and SQL NULL PK input, permitted duplicate names, exact text minima/maxima for both entities and zero/max numerics; run maximum safe-ID cases only in separate extreme-ID state, distinguish affinity from JSON typing, and mutate/delete only approved disposable fixtures, never seed rows or sqlite_sequence.
- [ ] T033 Run loopback-only HTTP smoke scenarios from specs/001-catalog-search/quickstart.md against T029's same persisted state; compare health, all six seed IDs/fields across pages and known search IDs, accounting explicitly for any separate disposable SQL fixtures rather than silently assuming total remains six.
- [ ] T034 Capture full row/ID snapshots, restart only the local Worker with the same persisted path, compare every value, then run PRAGMA foreign_key_check and PRAGMA integrity_check via Wrangler --local; record US3.5/SC-006 evidence in specs/001-catalog-search/quickstart.md without reseeding.
- [ ] T035 Run speckit-converge against specs/001-catalog-search/spec.md, plan.md and tasks.md before Review; preserve pending work as proposed tasks requiring approval, identify requirement gaps as proposed CHG items without editing protected change/review files or silently changing requirements.
- [ ] T036 Present specs/001-catalog-search/tasks.md coverage, changed-file scope, actual commands/output, failures/blockers/unexecuted criteria and convergence findings for student code/evidence approval; do not mark feature complete until approved, modify docs/reviews.md or docs/reflection.md, or commit.

## Dependencies & Execution Order

A task starts only after its explicit prerequisite set below; each grouped arrow means sequential execution unless a brace marks independent tasks. Tests are written and their relevant failures observed before corresponding implementation. Missing tooling is a blocker, not a meaningful red test. Later-story assertions may remain red until that story is implemented.

| Group | Dependency chain |
|---|---|
| Setup | Approval → T001 → T002 |
| Foundations | T002 → {T003, T004} → T005 → T006 → T007 |
| US1 | T007 → {T008, T009} → T010 → T011 → T012 |
| US2 | T012 → {T013, T014} → T015 → T016 → T017 |
| US3 | T017 → {T018, T019} → T020 → T021 |
| US4 | T021 → {T022, T023} → T024 → T025 |
| Verification | T025 → T026 → T027 → T028 → T029 → T030 → T031 → T032 → T033 → T034 → T035 → T036 |

Logical independence is provided by direct-D1 fixtures: US1 referenced deletion does not require US2 APIs; US2 does not require US1 HTTP creation; US3/US4 can use fixed fixtures without CRUD calls. The chosen implementation schedule is nevertheless serial across stories because routes.ts, db.ts, validation.ts and shared test files have one writer at a time. T013's browse/search assertions close at T021/T025; US3 restart closes at T034.

## Parallel Examples

Only these pairs may write concurrently after their shared prerequisite; execute shared-state tests serially unless the installed harness proves isolation. No parallel shared-module edits.

- Foundation after T002: T003 writes tests/catalog-db.test.ts; T004 writes tests/catalog-validation.test.ts.
- US1 after T007: T008 writes tests/catalog.test.ts; T009 writes tests/catalog-validation.test.ts.
- US2 after T012: T013 writes tests/catalog.test.ts; T014 writes tests/catalog-validation.test.ts.
- US3 after T017: T018 writes tests/catalog.test.ts; T019 writes tests/catalog-db.test.ts.
- US4 after T021: T022 writes tests/catalog.test.ts; T023 writes tests/catalog-validation.test.ts.

## Acceptance and Requirement Coverage Matrix

AS numbers refer to the numbered acceptance scenarios in spec.md. Entries are planned coverage, not execution claims.

| Story acceptance | Implementing tasks | Test/evidence tasks |
|---|---|---|
| US1 AS1–4, AS6 | T005–T007, T010–T012 | T003–T004, T008–T009, T028 |
| US1 AS5 | T005, T011–T012 | T003, T008, T031 |
| US2 AS1–4 | T005–T007, T015–T017 | T013–T014, T028 |
| US2 AS5–6, AS8 | T005, T015–T017 | T003, T013–T014, T027–T028, T031 |
| US2 AS7 | T016–T017, T021, T025 | T013, T018, T022, T028 |
| US3 AS1–4 | T020–T021 | T018–T019, T028–T029, T033 |
| US3 AS5 | T005, T016, T020–T021 | T029, T034 |
| US4 AS1–7 | T024–T025 | T022–T023, T028, T030, T033 |

| Requirement | Implementation / verification tasks | Success criteria |
|---|---|---|
| FR-001 persistence/relationship | T005–T006, T011, T016, T020–T021; T003, T029–T034 | SC-001, SC-005, SC-006 |
| FR-002 CRUD | T010–T012, T015–T017, T021; T008, T013, T018, T027–T028 | SC-001, SC-004 |
| FR-003 identity/updates | T005–T007, T010–T011, T015–T017; T003–T004, T008, T013–T014, T019, T031–T032 | SC-001, SC-004, SC-005, SC-006 |
| FR-004 book fields | T005–T007, T015–T016; T003–T004, T013–T014, T031–T032 | SC-004, SC-005 |
| FR-005 category fields | T005–T007, T010–T011; T003, T008–T009, T031–T032 | SC-001, SC-004 |
| FR-006 integrity/atomicity | T005, T011, T016–T017; T003, T008, T013, T027, T030–T032, T034 | SC-005 |
| FR-007 literal search | T024–T025; T022–T023, T030, T033 | SC-003 |
| FR-008 queries/paging | T010–T011, T021, T024–T025; T004, T009, T018, T022–T023, T033 | SC-002, SC-004 |
| FR-009 errors | T007, T012, T017, T021, T024–T025; T004, T008–T009, T013–T014, T018, T022–T023, T027–T028 | SC-004, SC-007 |
| FR-010 read-only/compatibility | T011–T012, T016, T021, T025; T018, T022, T026, T033–T034 | SC-006, SC-007 |

SC-001: T008/T013/T028. SC-002: T018/T019/T029/T033. SC-003: T022/T033. SC-004: T004/T008/T009/T013/T014/T018/T023/T027/T028. SC-005: T003/T013/T027/T031/T034. SC-006: T034. SC-007: T028–T034 plus T035–T036 review. No success criterion is satisfied by task generation.

## Implementation Strategy and Counts

1. Wait for explicit task approval; then use speckit-implement within the approved scope.
2. Complete setup/foundations and US1; demonstrate the category-only MVP locally, including restricted deletion via fixture. Run speckit-converge before any interim Review as well as final Review.
3. Add US2, US3, then US4; prove each independent criterion and retain earlier regressions. No deployment step.
4. Complete actual Vitest/typecheck, direct local SQL, persistence evidence and convergence; present remaining work rather than expanding scope without approval.

**36 tasks**: Setup 2; foundations 5; US1 5; US2 5; US3 4; US4 4; cross-cutting verification 11. **10 [P] tasks in 5 disjoint-file pairs**. All 26 story acceptance scenarios, FR-001–FR-010 and SC-001–SC-007 are mapped. All 10 constrained stored fields have explicit data-model.md Entity.field citations in implementation tasks.

## Notes

No before_tasks/after_tasks hooks are registered: .specify/extensions.yml is absent. Setup used the existing core template with feature persistence disabled; no setup metadata change was needed. No specification changes, implementation, tests, SQL, commit or completion approval are implied by this draft.
