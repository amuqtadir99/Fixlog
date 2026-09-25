---
description: Add an item type (and its suggested maintenance tasks) to the catalog
argument-hint: <category_id> <type label>
---

Add "$2" to category `$1` in `src/lib/catalog.ts` with a snake_case id (^[a-z_]{2,40}$, unique within the
category) and 1–5 realistic suggested tasks (title, interval, priority) based on manufacturer guidance.
Run `npx vitest run tests/unit/catalog.test.ts`. No DB migration is needed — the catalog is code.
