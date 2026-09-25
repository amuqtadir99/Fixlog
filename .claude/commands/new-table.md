---
description: Add a new user-owned table with RLS, types, validation and tests
argument-hint: <table_name> <short purpose>
---

Add a new table `$1` for: $ARGUMENTS

Follow CLAUDE.md "Rules" exactly:

1. `npm run db:new add_$1` and write the SQL: `user_id text not null default public.requesting_user_id()`,
   check constraints on every text column, indexes on `(user_id, …)`, `enable` + `force row level security`,
   owner policies for select/insert/update/delete, `prevent_owner_change` trigger, `enforce_same_owner`
   trigger (extend the function) if it references a parent, add to the `supabase_realtime` publication.
2. Extend `supabase/tests/rls_test.sql` so user B cannot read/write user A's rows.
3. Add the TS type in `src/lib/types.ts`, Zod schema in `src/lib/validation.ts` (+ unit test),
   query in `src/server/queries.ts`, actions in `src/server/actions/`.
4. Run `npm run check` and `npm run test:db`; update docs/ARCHITECTURE.md data model.
