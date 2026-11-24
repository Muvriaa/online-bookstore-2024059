# Quickstart: Future Catalog Verification

**Status: Not executed / Not verified.** This guide is for the separately approved implementation phase. No migration, seed, test suite, SQL mutation or server is run by writing it. Expected outcomes below are not observed results.

See [plan and traceability](plan.md), [model](data-model.md), [API contract](contracts/api.md) and [approved spec](spec.md). Run commands from the repository root. Never use --remote or deploy. Do not modify existing configuration or delete/reset data to make these steps work.

## Prerequisites

- Approved implementation tasks, implemented migrations/0001_catalog.sql and sql/seed.sql, feature tests and installed project dependencies.
- Existing wrangler.jsonc DB binding/bookstore-db and local Wrangler available. If dependencies/tool APIs/configuration block execution, record the blocker and obtain permission for necessary changes; do not rewrite configuration in this planning scope.
- A new dedicated persisted directory beneath the repository. Example below must not already exist. If it exists, select another unused name, rather than removing it. Use the SAME path for seed/API/restart checks. The SQL-only disposable and extreme-ID states below are explicit exceptions; never point the Worker at them. Automated plugin tests use separate isolated DB state and apply migrations in their test setup; they must not assume this CLI seed is present.
- Future destructive lifecycle checks are confined to disposable test fixtures in this explicitly dedicated state; never use personal/remote data or clear the reference seed.

## Future Local Setup Commands

These are future instructions, not commands executed during planning:

~~~sh
STATE="$PWD/.wrangler/catalog-validation-001"
if test -e "$STATE"; then
  printf '%s
' 'STOP: choose a new unused local validation path; do not reset it.'
else
  printf '%s
' 'Fresh path selected; proceed only after implementation approval.'
fi
# Stop here if that path existed. Do not continue automatically.
npx wrangler d1 migrations apply bookstore-db --local --persist-to "$STATE"
npx wrangler d1 execute bookstore-db --local --persist-to "$STATE" --file sql/seed.sql
npx wrangler d1 execute bookstore-db --local --persist-to "$STATE" --command "SELECT * FROM categories ORDER BY id; SELECT * FROM books ORDER BY id;"
~~~

Expected: three exact categories and all six complete sample rows matching data/books.sample.json (including descriptions). Categories inserted first, IDs 1–3 and 1–6 preserved. Seed conflicts must fail visibly, never silently skip/replace. Do not rerun seed on a populated state. If execution fails partway, preserve evidence and investigate; do not reset or assume the whole file rolled back.

## Future Automated Checks

~~~sh
npx vitest run
npm run typecheck
~~~

Expected: real health assertion retained with unchanged payload; obsolete “has not implemented the catalog API yet” / GET books 404 test replaced by successful catalog coverage, not merely deleted without replacement. Tests exercise actual D1 constraints as well as validation units. Typecheck must pass using the current strict ES2022 setup. Capture real exit codes/output; an unavailable tool or plugin failure is blocked/failing, not passing.

Test coverage must include:

- Both full CRUD lifecycles and retrieval after deletion; immutable/generated IDs; permitted category reassignment; nonunique category names/title/author; description default and preserved whitespace.
- Each JSON/null/type/unknown/empty-update/ID/media-type error, all contract statuses, sanitized unexpected DB errors, unsupported methods, missing resources and conflicts.
- Text min/max/one-beyond boundaries measured in code points, astral characters, combining sequences, every JS whitespace character at both ends, NUL in all text/q, numeric bounds/fractions/strings/booleans and safe ID boundaries.
- Failed multi-field PATCH leaves every field unchanged; FK/ISBN conflict paths; reads leave snapshots unchanged.
- Six books once across pages; total independent of page; empty catalog; zero stock visible; huge exact offsets; supported duplicate query parameters and invalid pagination.
- Search SQL/smith, trimmed q, description-only exclusion, literal quotes/%/_, match in both fields once, ASCII-only case behavior, update/delete reflected in later searches.
- Real DB constraints and nonreuse tests, independent from API-only tests. Mock failure injection may verify 500 handling but cannot substitute for actual D1 integrity evidence.

## Future API Smoke Checks and Persistence

Start the implemented Worker using the same local state (loopback only):

~~~sh
npx wrangler dev --local --ip 127.0.0.1 --persist-to "$STATE"
~~~

In another terminal at the repository root:

~~~sh
curl -i 'http://127.0.0.1:8787/api/health'
curl -i 'http://127.0.0.1:8787/api/books?page_size=2&page=1'
curl -i 'http://127.0.0.1:8787/api/books?page_size=2&page=2'
curl -i 'http://127.0.0.1:8787/api/books?page_size=2&page=3'
curl -i 'http://127.0.0.1:8787/api/books?page_size=2&page=4'
curl -i 'http://127.0.0.1:8787/api/books?q=%20sql%20'
curl -i 'http://127.0.0.1:8787/api/books?q=smith'
curl -i 'http://127.0.0.1:8787/api/books?q=normalization'
curl -i 'http://127.0.0.1:8787/api/books?page=9007199254740991&page_size=100'
~~~

Expected IDs/statuses are in the contract. Stop only that local dev process normally, restart it with the same --persist-to path, and reread all rows. Expected: all records and IDs unchanged (SC-006). Do not stop/restart the OpenClaw Gateway or seed again. Capture before/after full-row snapshots, not only row counts.

## T030 Case Construction and Evidence Ledger

Before mutations, T030 constructs the complete case inventory here: assign a unique case ID to every statement below, expand the field/constraint coverage described below into individual INSERT/UPDATE cases in this guide, and validate preconditions, single intended fault, expected outcome and snapshot query against [the model](data-model.md). T031 executes negatives; T032 executes successful boundaries and nonreuse. Setup inserts are separately recorded prerequisites, not evidence of a negative case passing. All cases currently **Not verified**.

Use a new unused repository-local SQL-only path (for example .wrangler/catalog-sql-001), apply the implemented migration and seed exactly once using the setup commands with that path as STATE. Retain the original T029 path for API/restart checks. Never reuse/reset an existing directory. This keeps even unexpectedly successful invalid writes away from the reference API state. Stop affected dependent cases on unexpected results; preserve the state and evidence rather than repairing it. The extreme-ID cases use a third fresh state below.

For EACH case (including setup, runtime probes and positive writes), append a record under the ledger at the end of this guide containing: case ID/task/FR, state path and tool version, exact SQL/CLI command, expected outcome, real stdout/stderr, immediate command exit status, complete ordered categories/books and sequence snapshots before and after, comparison and pass/fail/blocked result. Capture mutation status before the after-snapshot command replaces it (for example run the one command in an if/else and assign rc=$? in its failure branch); keep snapshot command statuses too. Do not label an expected failure a pass without both its actual constraint error and unchanged full rows. For positive cases, compare exact inserted/changed fields and only the expected sequence advancement; counts alone are insufficient. SQL text uses char(0), never literal NUL bytes in files or shell arguments.

## Future Direct SQL: Schema and Runtime Assumptions

Use one local command per investigation, preserving failures. Define this convenience function in the future validation shell only:

~~~sh
sql() { npx wrangler d1 execute bookstore-db --local --persist-to "$STATE" --command "$1"; }
sql "PRAGMA foreign_keys; PRAGMA foreign_key_list(books); PRAGMA table_info(categories); PRAGMA table_info(books); PRAGMA index_list(books); SELECT type,name,sql FROM sqlite_schema WHERE tbl_name IN ('books','categories') ORDER BY type,name;"
sql "SELECT lower('SQL') AS ascii_lower, lower('Ä') AS non_ascii_lower, instr(lower('SQL for Beginners'),lower('sql')) AS literal_position, length('😀') AS astral_length, length('é') AS combining_length, length('a'||char(0)||'b') AS nul_length, instr('a'||char(0)||'b',char(0)) AS nul_position;"
sql "SELECT * FROM categories ORDER BY id; SELECT * FROM books ORDER BY id; SELECT name,seq FROM sqlite_sequence WHERE name IN ('books','categories') ORDER BY name;"
~~~

Expected: foreign_keys=1, category FK with RESTRICT update/delete, category index plus ISBN uniqueness, required defaults/CHECKs/AUTOINCREMENT and both ID triggers visible in schema. Expected lower values sql and Ä; astral length 1, combining length 2; NUL length 1 and position 2 demonstrate why the separate NUL check is mandatory. These runtime assumptions must be tested rather than treated as evidence from documentation. Never turn foreign keys off.

## Future Direct SQL: Negative Writes and Snapshot Invariance

T031 additional explicit cases below run in the fresh seeded SQL-only state. For the unused-category case, first record the setup insert and SELECT, confirm exactly one matching category and zero referencing books, and confirm target ID 101 is absent. Its failure must be the immutable-ID trigger, not FK restriction or a duplicate target. PK duplicate cases use otherwise valid fields and a new book ISBN, isolating PK rejection.

~~~sh
# Setup for N-unused-category; record separately.
sql "INSERT INTO categories(name) VALUES ('Unused trigger fixture');"
sql "SELECT c.*, (SELECT count(*) FROM books b WHERE b.category_id=c.id) AS references_count FROM categories c WHERE name='Unused trigger fixture'; SELECT * FROM categories WHERE id=101;"
# N-category-pk / N-book-pk: expected primary-key rejection, unchanged rows.
sql "INSERT INTO categories(id,name) VALUES (1,'Duplicate PK fixture');"
sql "INSERT INTO books(id,category_id,isbn,title,author,price_cents,stock) VALUES (1,1,'9780000000080','Duplicate PK fixture','Verifier',0,0);"
# N-unused-category: expected trigger rejection independently of FK.
sql "UPDATE categories SET id=101 WHERE name='Unused trigger fixture';"
# N-book-id-zero / N-book-id-negative / N-book-id-unsafe: expected rejection.
sql "INSERT INTO books(id,category_id,isbn,title,author,price_cents,stock) VALUES (0,1,'9780000000081','ID boundary','Verifier',0,0);"
sql "INSERT INTO books(id,category_id,isbn,title,author,price_cents,stock) VALUES (-1,1,'9780000000082','ID boundary','Verifier',0,0);"
sql "INSERT INTO books(id,category_id,isbn,title,author,price_cents,stock) VALUES (9007199254740992,1,'9780000000083','ID boundary','Verifier',0,0);"
~~~

Omitted or SQL NULL INTEGER PRIMARY KEY AUTOINCREMENT inputs generate IDs for both tables: they are NOT database null-rejection cases. Required-field null-rejection cases cover Category.name and all required non-PK Book fields (including explicitly NULL description despite its omission default). API POST/PATCH must separately reject every supplied id property, including JSON null; SQL generation behavior is not an API exception.

Before and after EACH invalid statement below, run the full ordered categories/books SELECT and compare every value. Each invalid statement is expected to fail and leave all rows unchanged; catch/log each command failure separately so later checks still run. Do not join negative mutations into one script whose first failure hides the remaining checks.

~~~sh
sql "INSERT INTO categories(name) VALUES (NULL);"
sql "INSERT INTO categories(name) VALUES ('');"
sql "INSERT INTO categories(name) VALUES (char(9)||'Untrimmed');"
sql "INSERT INTO categories(name) VALUES ('x'||char(0)||'hidden');"
sql "INSERT INTO categories(id,name) VALUES (0,'Invalid identity');"
sql "INSERT INTO categories(id,name) VALUES (9007199254740992,'Unsafe identity');"
sql "INSERT INTO books(category_id,isbn,title,author,price_cents,stock) VALUES (999999,'9780000000090','Fixture','Author',1,1);"
sql "INSERT INTO books(category_id,isbn,title,author,price_cents,stock) VALUES (1,'9780000000011','Duplicate ISBN','Author',1,1);"
sql "INSERT INTO books(category_id,isbn,title,author,price_cents,stock) VALUES (1,'9780000000091','Fixture','Author',-1,1);"
sql "UPDATE books SET title='Must not persist', category_id=999999 WHERE id=1;"
sql "UPDATE books SET title='Must not persist', isbn='9780000000012' WHERE id=1;"
sql "UPDATE books SET stock=2147483648 WHERE id=1;"
sql "UPDATE books SET price_cents=1.5 WHERE id=1;"
sql "UPDATE books SET stock='not-an-integer' WHERE id=1;"
sql "UPDATE books SET isbn='１２３４５６７８９０１２３' WHERE id=1;"
sql "UPDATE books SET isbn='123456789012' WHERE id=1;"
sql "UPDATE books SET description='safe'||char(0)||'hidden' WHERE id=1;"
sql "UPDATE books SET author=NULL WHERE id=1;"
sql "UPDATE books SET id=101 WHERE id=1;"
sql "UPDATE categories SET id=101 WHERE id=1;"
sql "DELETE FROM categories WHERE id=1;"
~~~

Also execute parameterized equivalents in real tests covering both INSERT and UPDATE for every required field and constraint, not just these representative commands. Validate an unused category's ID trigger too, so FK restriction cannot mask a missing trigger. SQL affinity may accept '1' as valid stored integer or 1.0 as integer: do not falsely expect every original SQL numeric string/integral-real literal to fail. Corresponding JSON strings/floats that are not integer values must still be handled according to API type rules.

For direct SQL overlength failures (101 category, 201 title/author, 2001 description):

~~~sh
sql "WITH RECURSIVE s(v) AS (VALUES('x') UNION ALL SELECT v||'x' FROM s WHERE length(v)<101) INSERT INTO categories(name) SELECT v FROM s WHERE length(v)=101;"
sql "WITH RECURSIVE s(v) AS (VALUES('x') UNION ALL SELECT v||'x' FROM s WHERE length(v)<201) UPDATE books SET title=(SELECT v FROM s WHERE length(v)=201) WHERE id=1;"
sql "WITH RECURSIVE s(v) AS (VALUES('x') UNION ALL SELECT v||'x' FROM s WHERE length(v)<201) UPDATE books SET author=(SELECT v FROM s WHERE length(v)=201) WHERE id=1;"
sql "WITH RECURSIVE s(v) AS (VALUES('x') UNION ALL SELECT v||'x' FROM s WHERE length(v)<2001) UPDATE books SET description=(SELECT v FROM s WHERE length(v)=2001) WHERE id=1;"
~~~

If a runtime recursion limit prevents the fixture construction, that is not proof of the column constraint: use a bound long string in a real D1 test instead. Test exact allowed maximums and minimums as successful operations on separate disposable fixtures, including 0 and 2147483647 for both numeric fields, empty description, and positive safe IDs where valid. Test negative and too-large values for both numeric fields, fractional/unsafe FK values, nulls, untrimmed strings with the full W set, NUL hidden after the apparent maximum, and duplicate names allowed. Keep reference sample rows intact; never use snapshot restoration via REPLACE.

## T032 Successful Text, Numeric and Generated-ID Boundaries

Execute each statement separately with the same per-case evidence procedure. These SQL-only fixtures do not change the API seed state. Expected: all inserts succeed, exact code-point lengths and numeric values persist, and duplicate names/title/author remain allowed. P-min and P-null also distinguish omitted versus SQL NULL generated IDs in both entities; record actual generated IDs, not connection-local last_insert_rowid assumptions. ISBNs are distinct 13 ASCII digits. The maximum-text construction uses printable x (no embedded NUL or recursive-depth dependency).

~~~sh
# P-category-min: omitted ID, one code point.
sql "INSERT INTO categories(name) VALUES ('x');"
# P-category-null: SQL NULL ID generates; duplicate name allowed.
sql "INSERT INTO categories(id,name) VALUES (NULL,'x');"
# P-category-text-max: 100 code points.
sql "INSERT INTO categories(name) VALUES (replace(hex(zeroblob(50)),'0','x'));"
# P-book-min: omitted ID, one-code-point title/author, empty default description, numeric minima.
sql "INSERT INTO books(category_id,isbn,title,author,price_cents,stock) VALUES (1,'9780000000084','x','x',0,0);"
# P-book-null: SQL NULL ID generates; duplicate title/author and explicit empty description allowed.
sql "INSERT INTO books(id,category_id,isbn,title,author,description,price_cents,stock) VALUES (NULL,1,'9780000000085','x','x','',0,0);"
# P-book-max: title/author 200, description 2000, both numeric maxima.
sql "INSERT INTO books(category_id,isbn,title,author,description,price_cents,stock) VALUES (1,'9780000000086',replace(hex(zeroblob(100)),'0','x'),replace(hex(zeroblob(100)),'0','x'),replace(hex(zeroblob(1000)),'0','x'),2147483647,2147483647);"
sql "SELECT id,length(name) AS name_points FROM categories ORDER BY id; SELECT id,isbn,length(title) AS title_points,length(author) AS author_points,length(description) AS description_points,price_cents,stock FROM books ORDER BY id;"
~~~

### Extreme safe-ID boundaries — separate state only

Explicit IDs here are disposable schema probes, not API creation or authorization to reuse deleted IDs. Select a third NEW unused repository-local STATE (for example .wrangler/catalog-extreme-001), apply migrations only, and do NOT seed it. Run the same schema/FK checks and before/after snapshots. Save the ordinary SQL-state path first and restore it afterwards for nonreuse checks. Never start the Worker or test ordinary generation/nonreuse in the extreme state: even a successful high-ID insert advances AUTOINCREMENT. Do not delete/reset that state or edit sqlite_sequence.

~~~sh
# P-category-id-min / P-book-id-min: fresh tables allow ID 1.
sql "INSERT INTO categories(id,name) VALUES (1,'Safe ID minimum');"
sql "INSERT INTO books(id,category_id,isbn,title,author,price_cents,stock) VALUES (1,1,'9780000000087','Safe ID minimum','Verifier',0,0);"
# P-category-id-max / P-book-id-max: expected exact maximum safe IDs and FK succeed.
sql "INSERT INTO categories(id,name) VALUES (9007199254740991,'Safe ID maximum');"
sql "INSERT INTO books(id,category_id,isbn,title,author,price_cents,stock) VALUES (9007199254740991,9007199254740991,'9780000000088','Safe ID maximum','Verifier',2147483647,2147483647);"
# Cast avoids trusting a tool's numeric rendering alone; retain full snapshots too.
sql "SELECT CAST(id AS TEXT) AS exact_id,name FROM categories ORDER BY id; SELECT CAST(id AS TEXT) AS exact_id,CAST(category_id AS TEXT) AS exact_category_id,isbn FROM books ORDER BY id;"
~~~

Expected exact maximum text: 9007199254740991 for both IDs and the book's category_id. Actual outputs/results: **Not verified**. Return STATE to the ordinary SQL-only path before continuing.

## Future Direct SQL: Generated ID Nonreuse

In dedicated validation state, create two separate disposable categories with generated IDs, record their IDs from ordered SELECT (do not assume across-command last_insert_rowid state), and create a disposable book referring to one. Record all fields/IDs. Delete only the disposable book and recreate a new book with an omitted id and distinct ISBN. Expected: new ID greater than the deleted highest generated book ID. Delete only an unused highest generated disposable category, create another with omitted id, and expect a greater ID. Repeated category names are permitted and can be checked here. Use actual captured IDs in future commands, not blindly assumed numbers:

~~~sh
sql "INSERT INTO categories(name) VALUES ('Nonreuse fixture'); SELECT id,name FROM categories ORDER BY id;"
sql "INSERT INTO books(category_id,isbn,title,author,price_cents,stock) VALUES (1,'9780000000099','Nonreuse fixture','Verifier',0,0); SELECT id,isbn FROM books ORDER BY id;"
# After inspecting and recording the generated IDs, execute DELETE ... WHERE id=<recorded disposable ID>,
# then repeat a plain INSERT without id and SELECT to compare. Never delete a seed row.
~~~

Verify SQL-only fixture persistence by reopening that same local state with Wrangler and rereading rows; do not point the Worker at it. Worker restart acceptance uses the original T029 API state as described above. Do not explicitly reinsert deleted IDs or modify sqlite_sequence: old-ID reuse by direct SQL is unauthorized, not a feature guarantee to test by introducing an ID-history ledger.

## Final Future Integrity Checks and Evidence

~~~sh
sql "PRAGMA foreign_key_check; PRAGMA integrity_check;"
~~~

Expected: no foreign_key_check rows and integrity_check returns ok. Record actual outputs, commands, exit codes, state path, test/tool versions where available and FR/SC comparisons. Mark each acceptance criterion passing/failing/blocked/unexecuted separately. SC-007 needs both actual health/feature test results and relevant local SQL evidence. This guide does not claim completion of any success criterion.

## Per-case Execution Ledger (T030–T032)

T030 expands one record per case here before execution; no aggregated pass substitutes for individual evidence.

| Case ID / task / FR | State / tool version | Exact command / expected outcome | Actual stdout + stderr / exit status | Before snapshot / after snapshot (including statuses) | Comparison / result |
|---|---|---|---|---|---|
| All documented cases; expand individually in T030 | Not recorded | Expected only, as above | Not executed | Not captured | **Not verified** |

For long output, use a case-labelled fenced block immediately below its record in this guide. Record real evidence only during separately approved execution; documentation review is not SQL validation evidence.
