# Research: Catalog and Search

Authority: [approved spec](spec.md). Context: [plan](plan.md), existing src/index.ts, tests/worker.test.ts, package.json, wrangler.jsonc, vitest.config.ts and tsconfig.json. This is design research, not executed runtime evidence. All runtime propositions below await the real checks in [quickstart](quickstart.md).

## R1 — Extend the existing Worker

**Decision**: TypeScript Worker with existing DB binding; small routes/validation/db/errors modules and entity types.
**Rationale**: minimal change to the inspected health-only starter; straightforward testability and parameter binding.
**Alternatives considered**: framework/router package, ORM, separate backend/UI rejected as unnecessary scope. No runtime dependency upgrade or configuration rewrite is assumed.
**Pending verification**: installed Cloudflare test-plugin DB/migration APIs and D1 typings under current tsconfig. Existing version ranges are not proof of installed APIs. Preserve the real health assertion and replace only the obsolete catalog-404 expectation with catalog coverage.

## R2 — Relational schema and immutable identity

**Decision**: positive safe INTEGER PRIMARY KEY AUTOINCREMENT IDs, FK RESTRICT both directions, category_id index, unique ISBN, required fields, CHECKs, ID-change triggers.
**Rationale**: stable generated identity and stored-value constraints satisfy FR-001/003/006. AUTOINCREMENT prevents automatic reuse of committed deleted IDs, including the former largest ID; it is not a prohibition on privileged explicit old-ID inserts. API never accepts supplied IDs; seed is the authorized explicit-ID fixture exception on fresh state. Never use REPLACE or manipulate sqlite_sequence.
**Alternatives considered**: plain INTEGER PRIMARY KEY can reuse deleted highest IDs; UUID changes approved numeric identity; tombstone ledger is unnecessary under the approved enforcement boundary. API-only constraints do not protect direct SQL.
**Pending verification**: actual D1 FK enforcement, triggers, sqlite_sequence behavior and precision checks; do not disable foreign keys.

## R3 — Text normalization and SQL checks

**Decision**: JS trim for names/title/author/q, Unicode code-point counting, description preserved; reject NUL. Database requires normalized stored title/author/name via trim(value, explicit JS whitespace characters) equality and lengths; see exact set in [data model](data-model.md).
**Rationale**: SQLite's default trim strips only ordinary spaces, not all JS whitespace. SQLite length(TEXT) stops at U+0000, so independent instr(value,char(0)) = 0 is required, including description. JS string.length counts UTF-16 units, so use code-point iteration.
**Alternatives considered**: default SQL trim, byte-length or UTF-16 limits rejected as inconsistent. Trimming description would change approved behavior. No Unicode normalization or extra bans are added.
**Pending verification**: all whitespace boundary code points, astral characters, combining sequences and NUL against real D1. SQLite TEXT/INTEGER affinity may convert original input types: SQL checks establish stored type, API enforces original JSON type; do not claim SQL can reject every original numeric string.

## R4 — Literal search

**Decision**: parameterized instr(lower(title),lower(?)) OR equivalent author condition; use identical filter for count and items, order IDs ascending.
**Rationale**: literal %, _ and quotes without wildcard escaping; one row even if both fields match. Description excluded.
**Alternatives considered**: LIKE requires escape handling; FTS5/ranking and application-side filtering exceed the design.
**Pending verification**: SQLite built-in lower is assumed ASCII-only; verify lower('SQL') = 'sql' and non-ASCII cases such as 'Ä' remaining unchanged in the actual runtime. If runtime folds additional characters, stop and adapt the implementation to the approved ASCII-only rule, not the spec to the runtime.

## R5 — Exact pagination

**Decision**: validate positive safe-integer IDs/page/page_size, enforce page_size <= 100, compute offset with BigInt, compare against total before binding to SQL.
**Rationale**: safe individual operands do not imply a safe product. A valid very large page must return empty, not overflow or become 400/500. Return ordinary JSON numbers for the safe inputs, not BigInt.
**Alternatives considered**: floating-point offset can lose precision; a smaller arbitrary page cap would add an unapproved business restriction; cursor pagination changes the approved interface.
**Pending verification**: page 9007199254740991 with page_size 100 and exact empty-page/count behavior; repeated supported query parameters and invalid integer inputs.

## R6 — Atomic writes and errors

**Decision**: fixed-whitelist dynamic SET list and bound values in one PATCH statement, database-enforced conflicts, stable sanitized public error envelope.
**Rationale**: one failed constraint aborts the entire statement; omitted fields remain untouched. Classification must distinguish a missing record from an unexpected DB failure.
**Alternatives considered**: one UPDATE per field allows partial writes; read-merge-write risks lost updates; REPLACE changes identity/relationships. Preflight existence checks alone cannot establish integrity under races.
**Pending verification**: installed D1 error representation and constraint classification; trigger/UNIQUE/FK failure snapshots; no leakage of raw error strings. Bind every data value; column names only come from internal whitelist.

## R7 — Seeds and verification isolation

**Decision**: future sql/seed.sql copies all six records from data/books.sample.json exactly, including IDs; categories 1 Databases, 2 Artificial Intelligence, 3 Programming first. Use fresh dedicated repository-local persisted D1 state, failing on conflicts.
**Rationale**: reproducible SC-002/003/006 evidence without destroying existing state.
**Alternatives considered**: reset/delete, insert-or-ignore, upsert and REPLACE conceal conflicts or destroy data. Loading sample JSON at request time is not persistence.
**Pending verification**: local migration/seed execution and full-row comparison, restart persistence and automated generated ID advancement past explicit fixtures. Tests use separate isolated plugin DB state, not the CLI's dedicated persisted store. A partially failed seed is investigated, never automatically cleared; use a newly approved fresh state for another attempt.

## Resolution Status

No unresolved design question remains from the four approved clarifications. Runtime assumptions are explicit test obligations, not passing results. No tests, SQL mutations, migrations, seed execution or deployment were performed during planning.
