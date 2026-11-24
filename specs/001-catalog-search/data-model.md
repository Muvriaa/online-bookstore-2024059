# Data Model: Catalog and Search

Authority: [spec](spec.md), FR-001–006 and approved clarifications. Related: [API](contracts/api.md), [research](research.md), [validation guide](quickstart.md). This is a schema design, not an applied migration.

## Entities and Relationships

Category 1 → 0..many Books; each Book → exactly one Category. No future entities, junction tables, soft-delete states, or derived stock rules are introduced.

### Category

| Field | Storage and constraints |
|---|---|
| id | INTEGER PRIMARY KEY AUTOINCREMENT; CHECK typeof(id) = 'integer' AND id BETWEEN 1 AND 9007199254740991 |
| name | TEXT NOT NULL; stored type text, NUL-free, JS-trim-normalized, 1–100 Unicode code points; not unique |

### Book

| Field | Storage and constraints |
|---|---|
| id | INTEGER PRIMARY KEY AUTOINCREMENT; same positive safe-integer CHECK as Category |
| category_id | INTEGER NOT NULL; typeof = 'integer', 1..9007199254740991; REFERENCES categories(id) ON DELETE RESTRICT ON UPDATE RESTRICT |
| isbn | TEXT NOT NULL UNIQUE; typeof = 'text', NUL-free, length = 13, no character outside ASCII 0–9; no checksum check |
| title | TEXT NOT NULL; stored type text, NUL-free, JS-trim-normalized, 1–200 code points; nonunique |
| author | TEXT NOT NULL; same constraints as title; nonunique |
| description | TEXT NOT NULL DEFAULT ''; stored type text, NUL-free, length <= 2000 code points, whitespace preserved |
| price_cents | INTEGER NOT NULL; CHECK typeof(price_cents) = 'integer' AND price_cents BETWEEN 0 AND 2147483647 |
| stock | INTEGER NOT NULL; CHECK typeof(stock) = 'integer' AND stock BETWEEN 0 AND 2147483647 |

Index books(category_id) for relationship lookups and deletion checks. The primary keys and unique ISBN supply their own indexes/identity mechanism; no speculative search index or FTS table.

## Constraint Expressions and Text Semantics

For each text column x, use typeof(x) = 'text' and instr(x, char(0)) = 0 in addition to NOT NULL and the appropriate length(x) bound. For ISBN, length(isbn) = 13 AND isbn NOT GLOB '*[^0-9]*' ensures exactly ASCII digits when combined with NUL rejection. Do not use a Unicode digit class or checksum validator; do not trim ISBN.

For title, author and category name, require x = trim(x, W) with binary equality and length(x) within the stated bounds. W is the explicit character set corresponding to JS String.prototype.trim():

- U+0009, U+000A, U+000B, U+000C, U+000D
- U+0020, U+00A0, U+1680
- U+2000 through U+200A inclusive
- U+2028, U+2029, U+202F, U+205F, U+3000, U+FEFF

Express W using SQLite char(9,10,11,12,13,32,160,5760,8192,8193,8194,8195,8196,8197,8198,8199,8200,8201,8202,8232,8233,8239,8287,12288,65279), not SQLite's one-argument trim. U+0085, U+180E and U+200B are not JS trim whitespace; do not silently remove them or forbid them. Internal whitespace is preserved. The database rejects unnormalized stored values, while the API normalizes before writing.

JS validation counts code points by iteration (for example Array.from(text).length), not UTF-16 string.length. SQLite length(TEXT) is expected to count code points, but stops at the first U+0000: the independent NUL check is essential, not redundant. Verify astral and combining-character boundary fixtures in real D1. No normalization to NFC/NFD, grapheme counting or additional Unicode restrictions is approved. Description is not trimmed and may be empty or whitespace-only.

SQLite affinity may convert numeric strings or integral real literals to integer storage, and numbers to text storage. These constraints guarantee stored values, not the original JSON type. The API must reject wrong original JSON types, booleans, nulls and fractions before binding. Direct SQL verification must distinguish coercion that leaves valid storage from genuinely invalid stored values.

## Identity and Lifecycle

Create category/book through API without id; DB generates it. For SQLite INTEGER PRIMARY KEY AUTOINCREMENT, both an omitted id and an explicit SQL NULL id request generation; neither stores a NULL primary key. Database NOT NULL rejection cases therefore target required non-PK fields, not generated PK input. This SQL behavior does not permit API clients to supply id: POST and PATCH reject any id property, including id: null (and unchanged IDs), before SQL binding. Plain seed inserts are the explicit-ID application-data creation described here; isolated disposable direct-SQL boundary probes in the validation guide are not API creation or permission to reuse deleted IDs. Add one BEFORE UPDATE OF id trigger per entity, aborting when NEW.id != OLD.id. Same-ID assignment does not change identity, but the API rejects any supplied id field regardless. FK ON UPDATE RESTRICT also prevents referenced category identity changes, while triggers protect all entity identities even when unreferenced.

PATCH changes only provided mutable fields in one bound UPDATE statement; any failed constraint leaves every field unchanged. Reassigning a book to an existing category is allowed. Deleting a book is allowed; deleting a category is allowed only when no books reference it. No cascade. No INSERT OR REPLACE, REPLACE, ignore-on-conflict, or identity-changing upsert.

AUTOINCREMENT preserves nonreuse for automatically generated IDs after deletion; seed IDs advance the sequence, so the next generated book ID is greater than 6 and category ID greater than 3 on the fresh fixture. Do not reset sqlite_sequence. Explicit direct SQL insertion of a deleted ID is unauthorized, not prevented by AUTOINCREMENT; no historical-ID ledger is promised. Safe-ID upper bounds apply to storage and API; generated values outside the bound must fail rather than produce a rounded JSON ID.

## Seed Contract (future sql/seed.sql)

Use a new dedicated local persisted state only; insert categories first:

| id | name |
|---|---|
| 1 | Databases |
| 2 | Artificial Intelligence |
| 3 | Programming |

Then plain INSERT all six exact records from [data/books.sample.json](../../data/books.sample.json), preserving every field and reference ID:

| id | category_id | isbn | title | author | price_cents | stock |
|---|---|---|---|---|---|---|
| 1 | 1 | 9780000000011 | SQL for Beginners | A. Smith | 1999 | 3 |
| 2 | 1 | 9780000000012 | Database Design | B. Lee | 2499 | 2 |
| 3 | 2 | 9780000000013 | Introduction to AI | C. Kim | 2299 | 5 |
| 4 | 2 | 9780000000014 | Practical RAG | D. Chen | 2999 | 4 |
| 5 | 3 | 9780000000015 | TypeScript Projects | E. Brown | 2099 | 5 |
| 6 | 1 | 9780000000016 | Distributed Data Systems | F. Park | 3499 | 1 |

Descriptions must be copied verbatim from the JSON, not reconstructed from this summary. Conflicts fail; never overwrite or clear existing state. A failed seed requires investigation/new fresh-state selection, not destructive cleanup.

## Read Model

Book responses add category_name from an inner join with the authoritative category. This is not another stored book column; renaming a category is reflected in future book reads. Stock zero remains visible. Count and item filters match exactly and order by book/category id ascending. No category-name search/filter is added.

All schema, precision, length, FK and nonreuse behavior remains **Not verified** until implementation and real local tests.
