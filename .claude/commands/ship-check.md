---
description: Pre-merge verification — everything CI will run, plus a security pass on the diff
---

1. Run `npm run format:check`, `npm run check` and `npm run build` (use the placeholder env from
   `.github/workflows/ci.yml`). If `supabase/` changed and a Postgres is available, `npm run test:db`.
2. Review `git diff main...HEAD` against SECURITY.md: server-side Zod validation for new inputs, RLS for
   new tables, no service-role usage outside the webhook, no secrets, no raw DB errors returned,
   no `dangerouslySetInnerHTML`, CSP still strict.
3. Confirm docs (REQUIREMENTS/ARCHITECTURE/README) reflect behaviour changes.
   Report failures with file:line and fix them before declaring ready.
