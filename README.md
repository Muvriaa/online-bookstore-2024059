# Week 15 — Online Bookstore Starter Template

**Course:** Database Theory and Application  
**Project:** Online Bookstore Capstone  
**Runtime:** Cloudflare Workers (TypeScript)  
**Purpose:** Lab 0 setup, followed by Agile Specification-Driven Development with OpenClaw and GitHub Spec Kit.

> This ZIP is a newly prepared classroom starter scaffold based on the Week 15 capstone
> lesson and the November 17 Lab 0 specification. It is **not** a download of an
> existing instructor-owned GitHub repository.

## Deliberate scope

This template includes only:
- A minimal Cloudflare Worker (`src/index.ts`) with a health endpoint.
- `vitest.config.ts` and baseline Worker tests.
- A GitHub Actions CI workflow.
- Six **fictional** sample book records from the Week 15 teaching example in `data/books.sample.json`.
- Minimal TypeScript, Wrangler, and npm configuration.

It intentionally contains **NO database schema**, no migrations, no `sql/seed.sql`,
no catalog/search/order APIs, no Spec Kit-generated skills, and no prewritten
feature specifications. Those are students' deliverables beginning in Lab 1.
Do not confuse the sample JSON records with records already loaded into D1.

## 1. Requirements

- Node.js 22 or later (current LTS recommended)
- npm
- Git and a GitHub account
- A Cloudflare account (for Lab 0 D1 setup)
- Python 3.11+, uv, OpenClaw, Telegram, Obsidian (for the full capstone)

## 2. Run locally

```bash
npm install
npm run dev
```

In another terminal:

```bash
curl http://localhost:8787/api/health
```

Expected JSON shape (illustrative):

```json
{"status":"ok","service":"online-bookstore","phase":"starter"}
```

Other business API routes intentionally return HTTP 404 until students implement
and verify them through Spec Kit.

## 3. Run tests and checks

```bash
npm test
npm run typecheck
```

The Vitest integration uses `@cloudflare/vitest-plugin`, the current name of
`@cloudflare/vitest-pool-workers` (renamed in August 2026). The lab plan may
still refer to the older package name.

The CI workflow runs these same checks on push and pull requests.
The workflow uses `npm install` because the starter archive does not bundle
`node_modules` or a generated `package-lock.json`. After the first install,
commit the generated lockfile and optionally update CI to `npm ci`.

## 4. Create your own GitHub repository

1. Extract the ZIP file.
2. Create a GitHub repository named `online-bookstore-<student-id>`.
3. Initialize the extracted directory as a Git repository and push the files.
4. Confirm that `README.md`, `src/`, `tests/`, and `.github/workflows/ci.yml` appear.

Example:

```bash
cd week15-online-bookstore-starter-template
git init -b main
git add .
git commit -m "Initial Week 15 starter template"
git remote add origin https://github.com/YOUR_USERNAME/online-bookstore-YOUR_ID.git
git push -u origin main
```

For a reusable class template, create a separate GitHub repository and enable
**Settings → General → Template repository**. Students can then select
**Use this template → Create a new repository**.

## 5. Add GitHub Spec Kit in Lab 0

From the repository root:

```bash
uv tool install specify-cli
specify --help
specify init --here --integration generic \
  --integration-options="--commands-dir .agents/skills --skills"
```

Verify generated Skills with `ls .agents/skills`, then commit the shared Spec Kit
files. Verify the exact integration syntax with `specify init --help` for the
installed version.

## 6. Set up D1 in Lab 0 (without writing a schema)

```bash
npx wrangler login
npx wrangler d1 create bookstore-db
```

Replace the empty `d1_databases` array in `wrangler.jsonc` with your actual database binding:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "bookstore-db",
    "database_id": "YOUR_ACTUAL_DATABASE_ID"
  }
]
```

Then check local SQL access:

```bash
npx wrangler d1 execute bookstore-db --local --command "SELECT 1"
```

**Do not create the DB schema in Lab 0.** The six common relational tables
(categories, books, customers, orders, order_items, order_events) and their
constraints are designed and implemented in Lab 1.

## 7. Sample data

`data/books.sample.json` contains six fictional titles, authors, and prices
(in integer cents) adapted from the Week 15 lab example. It is reference data,
not an executable SQL seed. Students should design `sql/seed.sql` after their
approved D1 schema exists.

## 8. Security and student approvals

- Never commit `.dev.vars`, API keys, Telegram bot tokens, or private OpenClaw memory.
- Do not call `wrangler deploy` or run remote migrations from the agent without
  student approval and manual execution.
- Require human approval before specifications and implementation change.
- Record real tests; never fabricate output.

## Original lesson sources

- `20261029_DT_Week 15(3).md` — Week 15 Online Bookstore capstone lesson.
- `20261117_DT_Online Bookstore Capstone(1).pdf` — Agile SDD with OpenClaw + Spec Kit.
- `Pasted text(20261119-070622).txt` — Lab 0 instructions.

No instructor's original starter repository URL was provided in these files.
