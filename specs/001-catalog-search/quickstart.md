# Quickstart: Future Catalog Verification

**Status: Not executed / Not verified.** This guide is for the separately approved implementation phase. No migration, seed, test suite, SQL mutation or server is run by writing it. Expected outcomes below are not observed results.

See [plan and traceability](plan.md), [model](data-model.md), [API contract](contracts/api.md) and [approved spec](spec.md). Run commands from the repository root. Never use --remote or deploy. Do not modify existing configuration or delete/reset data to make these steps work.

## Prerequisites

- Approved implementation tasks, implemented migrations/0001_catalog.sql and sql/seed.sql, feature tests and installed project dependencies.
- Existing wrangler.jsonc DB binding/bookstore-db and local Wrangler available. If dependencies/tool APIs/configuration block execution, record the blocker and obtain permission for necessary changes; do not rewrite configuration in this planning scope.
- A new dedicated persisted directory beneath the repository. Example below must not already exist. If it exists, select another unused name, rather than removing it. Use the SAME path for every CLI command and Worker restart. Automated plugin tests use separate isolated DB state and apply migrations in their test setup; they must not assume this CLI seed is present.
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

## Future Direct SQL: Generated ID Nonreuse

In dedicated validation state, create two separate disposable categories with generated IDs, record their IDs from ordered SELECT (do not assume across-command last_insert_rowid state), and create a disposable book referring to one. Record all fields/IDs. Delete only the disposable book and recreate a new book with an omitted id and distinct ISBN. Expected: new ID greater than the deleted highest generated book ID. Delete only an unused highest generated disposable category, create another with omitted id, and expect a greater ID. Repeated category names are permitted and can be checked here. Use actual captured IDs in future commands, not blindly assumed numbers:

~~~sh
sql "INSERT INTO categories(name) VALUES ('Nonreuse fixture'); SELECT id,name FROM categories ORDER BY id;"
sql "INSERT INTO books(category_id,isbn,title,author,price_cents,stock) VALUES (1,'9780000000099','Nonreuse fixture','Verifier',0,0); SELECT id,isbn FROM books ORDER BY id;"
# After inspecting and recording the generated IDs, execute DELETE ... WHERE id=<recorded disposable ID>,
# then repeat a plain INSERT without id and SELECT to compare. Never delete a seed row.
~~~

Restart the local Worker/state and verify new IDs and remaining records persist. Do not explicitly reinsert deleted IDs or modify sqlite_sequence: old-ID reuse by direct SQL is unauthorized, not a feature guarantee to test by introducing an ID-history ledger.

## Final Future Integrity Checks and Evidence

~~~sh
sql "PRAGMA foreign_key_check; PRAGMA integrity_check;"
~~~

Expected: no foreign_key_check rows and integrity_check returns ok. Record actual outputs, commands, exit codes, state path, test/tool versions where available and FR/SC comparisons. Mark each acceptance criterion passing/failing/blocked/unexecuted separately. SC-007 needs both actual health/feature test results and relevant local SQL evidence. This guide does not claim completion of any success criterion.
