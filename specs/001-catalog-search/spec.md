# Feature Specification: Catalog and Search

**Feature Directory**: specs/001-catalog-search
**Feature Branch**: Not created; specification directory is independent of branch.
**Created**: 2026-11-23
**Status**: Approved for planning
**Approved**: 2026-11-23 — student approved the revised specification with recommended decisions.
**Governance**: Approved constitution v1.0.0
**Input**: CORE-01: Book Catalog with D1, CRUD, and a relational model, as clarified by the student. Backend CRUD for books/categories, browsing, basic title/author search, validation, and relational integrity. No visual administration interface.

## User Scenarios & Testing

### User Story 1 — Manage categories (Priority: P1)

As a catalog maintainer, I want to create, retrieve, update, and delete categories through the backend API so that books can be organized consistently.

**Why this priority**: Categories establish the relational foundation for books.
**Independent Test**: Complete a category lifecycle without creating any books.

**Acceptance Scenarios**:
1. Creating a valid category returns HTTP 201 with a generated, stable ID.
2. Listing categories and retrieving that category return HTTP 200 with its stored values.
3. Updating its name returns HTTP 200; its ID remains unchanged.
4. Deleting an unused category returns HTTP 204; subsequent retrieval returns HTTP 404.
5. Deleting a category referenced by a book returns HTTP 409, preserving both records.
6. Blank or invalid category names return HTTP 400 without changing stored data.

### User Story 2 — Manage books (Priority: P1)

As a catalog maintainer, I want backend CRUD operations for books so that the catalog can be maintained without editing application code.

**Why this priority**: CRUD is required by CORE-01 and enables catalog maintenance.
**Independent Test**: Create a category fixture, then create, retrieve, update, and delete a book.

**Acceptance Scenarios**:
1. Creating a valid book referencing an existing category returns HTTP 201 with a generated ID.
2. Retrieving the book returns HTTP 200 and its stored fields.
3. Updating selected fields returns HTTP 200, preserves its ID, and leaves omitted fields unchanged.
4. Reassigning the book to another existing category succeeds.
5. Creating or updating a book with a nonexistent category returns HTTP 409.
6. Creating or updating a book to use another book’s ISBN returns HTTP 409.
7. Deleting a book returns HTTP 204; subsequent retrieval returns HTTP 404, and it no longer appears in catalog or search results.
8. A rejected update leaves all previously stored fields unchanged.

### User Story 3 — Browse the catalog (Priority: P1)

As a shopper, I want to browse stored books so that I can discover books for a later purchase.

**Why this priority**: Browsing provides the basic catalog discovery journey.
**Independent Test**: Browse a known dataset and compare returned IDs and values.

**Acceptance Scenarios**:
1. With the six sample books loaded, all six are accessible exactly once across pages of an unchanged catalog.
2. Results expose book ID, category ID/name, ISBN, title, author, description, price in integer cents, and stock.
3. An empty catalog returns HTTP 200 with an empty list.
4. Zero-stock books remain visible.
5. Stored records and IDs survive an application restart.

### User Story 4 — Search title and author (Priority: P1)

As a shopper, I want basic title/author search so that I can find relevant books quickly.

**Why this priority**: Search is the requested targeted discovery capability.
**Independent Test**: Run known queries against fixed fixtures and compare exact result IDs.

**Acceptance Scenarios**:
1. SQL finds “SQL for Beginners”; smith finds the book by “A. Smith.”
2. A query of “  sql  ” returns the same results as SQL.
3. A literal substring match in title or author includes the book once, even if both fields match.
4. A description-only match does not include the book.
5. No matches returns HTTP 200 with an empty list.
6. Quotes, %, and _ are literal input, not executable SQL or wildcard instructions.
7. A successful title/author update is reflected in subsequent searches.

### Edge Cases

Verification must cover malformed JSON, missing fields, explicit nulls, wrong types, blank strings, invalid IDs, duplicate ISBNs, missing categories, referenced-category deletion, empty updates, query boundaries, pagination boundaries, and database failures.

## Requirements

### Functional Requirements

- **FR-001 — Persistence and relational model**: Books and categories MUST persist in D1. Each book MUST reference exactly one existing category; a category MAY contain multiple books.
- **FR-002 — Backend CRUD surface**: /api/books supports create and list; /api/books/{id} supports retrieve, partial update, and delete. /api/categories supports create and list; /api/categories/{id} supports retrieve, partial update, and delete. Creation uses POST, reads GET, partial updates PATCH, and deletion DELETE. PUT/full replacement is outside this first version.
- **FR-003 — Identity and updates**: IDs MUST be generated by the system, positive integers, unique, immutable, and not reused after deletion. Requests attempting to supply or change IDs MUST be rejected. PATCH MUST contain at least one recognized mutable field; unknown fields MUST be rejected.
- **FR-004 — Book validation**: title and author are required strings, 1–200 Unicode code points after trimming. isbn is a required unique string of exactly 13 ASCII digits, without checksum verification for fictional course data. category_id is a required positive integer referencing an existing category. price_cents and stock are required integers from 0 through 2,147,483,647; numeric strings and fractions are rejected. description is an optional string of at most 2,000 Unicode code points, defaulting to an empty string on creation. Explicit null values are rejected for these fields. Titles and authors need not be unique.
- **FR-005 — Category validation**: Category names MUST be strings containing 1–100 Unicode code points after trimming. Names need not be unique; category IDs establish identity.
- **FR-006 — Integrity and atomicity**: Primary keys, foreign keys, ISBN uniqueness, required fields, and applicable value constraints MUST be enforced in the database as well as through API validation. Failed writes MUST leave existing data unchanged. Referenced-category deletion MUST be restricted, not cascaded.
- **FR-007 — Basic search**: A single q parameter MUST match literal substrings in title OR author. Matching is ASCII case-insensitive; other characters match exactly. Basic SQL search is sufficient; FTS5 and full-text ranking are excluded.
- **FR-008 — Query validation and pagination**: Omitted q means browse; supplied q must contain 1–100 Unicode code points after trimming. Blank, oversized, or repeated supported query parameters return HTTP 400. Both collection endpoints use page and page_size, defaulting to 1 and 20; maximum page size is 100. Pagination values must be positive integers; invalid values return HTTP 400. Results use ID-ascending order. Pages beyond available results return an empty list. Collection responses include items, page, page size, and total matching count.
- **FR-009 — Errors**: HTTP 400 for malformed JSON, invalid IDs, and field/query validation errors; HTTP 404 for a well-formed ID identifying a missing resource; HTTP 409 for duplicate ISBN, missing referenced category, or referenced-category deletion; HTTP 405 for an unsupported method on a recognized endpoint; HTTP 415 for a write request body not supplied as JSON; HTTP 500 for unexpected database/service failure. Errors MUST expose a stable code and readable message, plus the relevant field for validation errors. They MUST NOT expose SQL, stack traces, credentials, or internal database details. Failures MUST NOT masquerade as successful empty results.
- **FR-010 — Compatibility**: Reads MUST NOT change catalog data. Existing health behaviour MUST remain intact. Stable book IDs and relational constraints MUST support future references without implementing future features now.

### Key Entities

- **Category**: ID, name; parent of zero or more books.
- **Book**: ID, category reference, ISBN, title, author, description, price in cents, stock.

Customers, orders, purchases, courses, and course-book relationships are not entities implemented by this feature.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Both entity types pass complete create/read/update/delete lifecycle tests.
- **SC-002**: All six reference books are browsable without omissions or duplicates in an unchanged dataset.
- **SC-003**: Every search fixture produces exactly the expected IDs.
- **SC-004**: All invalid-input and conflict cases produce their specified status and error category.
- **SC-005**: Invalid writes produce zero partial updates or orphaned relationships.
- **SC-006**: Persisted records survive restart with unchanged IDs.
- **SC-007**: Existing health tests and all feature acceptance tests pass with actual recorded evidence.

Verification requires real npx vitest run execution and local D1 SQL checks, including direct attempts to violate relational constraints. Results are currently **Not verified**.

## Clarifications

### Session 2026-11-23 — approved before planning

1. **Trimming and storage (FR-004/005/007/008)**: Use JavaScript `String.prototype.trim()` semantics for title, author, category name, and q. Store title, author, and category name trimmed; preserve description whitespace. Length limits count Unicode code points, not UTF-16 code units.
2. **NUL (FR-004/005/006/008)**: Reject U+0000 in text fields and query text, including description, so database text-length checks cannot be bypassed by an embedded NUL.
3. **Safe integers and large pages (FR-003/004/008)**: IDs (including category_id) and pagination values must be positive JavaScript safe integers (at most 9,007,199,254,740,991); the existing page_size maximum of 100 still applies. Calculate offsets exactly, including products beyond the safe-integer range, and return an empty page when the offset is beyond the matching results.
4. **Enforcement boundary (FR-003/006)**: The database enforces stored-value integrity. Original JSON types and generated-ID-only creation are enforced by the API; SQLite affinity cannot establish the original JSON type. Automatically generated IDs are not reused after deletion. Explicit direct-SQL reuse of a deleted ID is unauthorized, not an additional database historical-ID ledger requirement.

## Assumptions

### Approved Decisions

1. This phase is a local-only classroom implementation, with no publicly exposed unauthenticated mutation endpoints. If remote-accessible CRUD is required, authentication/authorization requirements must be specified before implementation.
2. PATCH-only updates, restricted category deletion, unique ISBNs without checksum validation, non-unique category names, and the explicit field limits above are approved.
3. The matching and pagination rules above are approved. Sample category names are: ID 1 “Databases,” ID 2 “Artificial Intelligence,” ID 3 “Programming.”

### Scope Boundaries

Included: API-focused CRUD for books/categories, D1 persistence, relational integrity, catalog browsing, basic search, validation, and tests.

Excluded: visual storefront/admin interfaces; customers, orders, purchases, payments, shipping; courses and the University Textbook Store extension; FTS5, full-text ranking, semantic search; remote deployment or remote migrations by the agent.

### Sources and Dependencies

- .specify/memory/constitution.md: approved governance v1.0.0.
- skills/bookstore-sdd/SKILL.md: course development workflow.
- README.md: repository course guidance.
- data/books.sample.json: six fictional reference books, not evidence of existing D1 records.
- Student clarification on 2026-11-23: CORE-01 requires D1, CRUD, and a relational model.
- Original lesson documents named in README.md were not available among inspected sources; full alignment with those originals is **Not verified**.

Approval covers this specification and the decisions above, not implementation. Planning and task generation precede separate student approval of implementation tasks.
