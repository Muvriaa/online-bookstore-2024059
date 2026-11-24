# Catalog API Contract

Authority: [approved spec](../spec.md); storage rules: [data model](../data-model.md). This contract chooses wire names/envelopes for the approved API, without adding business features. Local-only classroom use; do not expose unauthenticated mutations publicly.

## Representations

JSON success bodies use these exact property names:

- Category: {"id":1,"name":"Databases"}
- Book: {"id":1,"category_id":1,"category_name":"Databases","isbn":"9780000000011","title":"SQL for Beginners","author":"A. Smith","description":"Learn relational databases and SQL fundamentals with practical exercises.","price_cents":1999,"stock":3}
- Collection: {"items":[],"page":1,"page_size":20,"total":0}; items are complete Category or Book representations as appropriate. total counts matching records before pagination, not page length. Single-resource/create/PATCH responses are the representation directly, without an extra data wrapper.
- 204: empty body (not JSON null).

IDs and numeric fields are JSON numbers, text fields are JSON strings. category_name is read-only derived output; it is not an accepted input field.

## Route / Method Matrix

| Path | Method | Success |
|---|---|---|
| /api/categories | GET | 200 category collection |
| /api/categories | POST | 201 created category |
| /api/categories/{id} | GET | 200 category |
| /api/categories/{id} | PATCH | 200 updated category |
| /api/categories/{id} | DELETE | 204 |
| /api/books | GET | 200 book collection, optionally searched |
| /api/books | POST | 201 created book |
| /api/books/{id} | GET | 200 book |
| /api/books/{id} | PATCH | 200 updated book |
| /api/books/{id} | DELETE | 204 |

Unsupported methods on these recognized endpoints return 405, including PUT. Well-formed but missing entity IDs return 404 for GET/PATCH/DELETE. Malformed IDs return 400, not a missing-resource success. Preserve GET /api/health exactly: 200 {"status":"ok","service":"online-bookstore","phase":"starter"}. Preserve the existing root response and unrelated-route fallback; do not silently broaden this feature into a global router rewrite. Existing unknown-route fallback remains 404 {"error":"Not Found"}; the structured envelope below applies to catalog endpoints.

## Input and Validation

POST/PATCH bodies must be JSON objects, not arrays, primitives or null. Use application/json media type (parameters such as charset are allowed); malformed JSON is 400 and a body not supplied as JSON is 415. DELETE has no required request body. Explicit null is invalid for all fields. Reject unknown fields, including id and category_name; do not ignore them.

Category POST requires name. Category PATCH requires at least one recognized mutable field (name). Book POST requires category_id, isbn, title, author, price_cents, stock; description is optional and defaults to ''. Book PATCH accepts any nonempty subset of those seven fields; omission preserves the prior stored value. Empty updates and unknown-only updates return 400. IDs are never supplied on creation or changed by PATCH.

| Input | Validation |
|---|---|
| name | string, JS-trim and store, 1–100 Unicode code points |
| title, author | strings, JS-trim and store, 1–200 code points |
| isbn | string, exactly 13 ASCII digits; no trimming or checksum; unique |
| description | string, at most 2000 code points, preserve all whitespace |
| category_id | JSON number, positive safe integer, existing category |
| price_cents, stock | JSON numbers, integers 0..2147483647; reject numeric strings, booleans and fractions |
| path id | positive integer value <= 9007199254740991, parsed without precision loss |

Reject U+0000 in every text input/query. Other characters receive only the explicitly approved validation. Duplicate title/author/category name is allowed. Zero stock is valid and visible. Existing-category and ISBN conflicts are 409, not field-format errors.

## Collections and Search

Both collections support page and page_size exactly once each: positive safe integers; defaults 1 and 20; maximum page_size 100. Integer parsing must reject empty values, fractions, signs denoting negative numbers, nonnumeric strings, nonfinite values and unsafe integers rather than truncate/coerce them. Validate the full integer representation; do not accept numeric prefixes via parseInt. No extra small maximum page is allowed.

GET /api/books additionally supports a single q. Omitted q browses; supplied q is JS-trimmed, NUL-free and 1–100 code points. Empty/blank/oversized q and repeated supported parameters return 400. Search title OR author, ASCII case-insensitive; non-ASCII characters match exactly. Literal quotes, %, _ and SQL-looking strings are data, not syntax/wildcards. A row matching both fields appears once; description-only matches do not appear. No category filter or category-name search is specified. Unsupported query parameters acquire no new validation policy in this plan; do not invent a new rejection requirement for them.

Results are ID ascending. Count and item predicates are identical. Compute offset exactly even if (page - 1) * page_size exceeds Number.MAX_SAFE_INTEGER. If offset >= total, return 200 with empty items and the requested page/page_size and actual total. An empty catalog/no matches has total 0. Never substitute empty success for DB failure.

## Catalog Error Envelope

Exact shape: {"error":{"code":"VALIDATION_ERROR","message":"Readable explanation","field":"title"}}.

code and message are always strings. field is included for field/query/ID validation errors; omit it for non-field errors. Use the offending request property, q/page/page_size, id for path identity, or body for invalid top-level JSON shape/empty update. Messages are readable and nonempty but their prose is not a stable enumeration; do not expose SQL, stack traces, credentials, table details or raw D1 messages.

| HTTP | Stable code | Circumstance | field |
|---|---|---|---|
| 400 | INVALID_JSON | JSON media type with malformed JSON | omitted |
| 400 | VALIDATION_ERROR | field/query/body validation, missing/unknown fields, supplied IDs, invalid path ID | relevant field or body |
| 404 | NOT_FOUND | valid ID, missing catalog resource | omitted |
| 409 | DUPLICATE_ISBN | create/update ISBN already used by another book | omitted |
| 409 | CATEGORY_NOT_FOUND | create/update references nonexistent category | omitted |
| 409 | CATEGORY_IN_USE | delete referenced category | omitted |
| 405 | METHOD_NOT_ALLOWED | method unsupported on recognized catalog endpoint | omitted |
| 415 | UNSUPPORTED_MEDIA_TYPE | POST/PATCH body not supplied as JSON | omitted |
| 500 | INTERNAL_ERROR | unexpected database/service failure | omitted |

All existing approved statuses are retained. For requests with multiple simultaneous faults the spec does not establish a total error-precedence order; tests should isolate each condition, not invent an additional business requirement. Invalid writes and conflicts leave stored records unchanged. A valid PATCH with identical values is still a valid partial update, not an empty request.

## Acceptance Examples (expected, not executed)

On exact seed state, q=SQL and q=%20sql%20 both return ID [1]; q=smith returns [1]. Description-only q=normalization returns [] even though book 2's description contains it. page_size=2 across pages 1–3 returns [1,2], [3,4], [5,6], all with total 6; page 4 returns [] with total 6. page=9007199254740991&page_size=100 returns [] with total 6, not overflow. Additional isolated fixtures prove quotes/%/_, matching both fields once, non-ASCII exactness, zero stock, post-update search and post-delete absence.
