## Summary

<!-- What does this change and why? Link the requirement (docs/REQUIREMENTS.md FR-/NFR-) if relevant. -->

## Changes

-

## Test plan

- [ ] `npm run check` (lint, typecheck, unit tests)
- [ ] `npm run test:db` if migrations or RLS changed
- [ ] Manually verified in preview deployment

## Security checklist

- [ ] New inputs validated with Zod on the server
- [ ] New tables have RLS enabled + owner policies (and a test in `supabase/tests/rls_test.sql`)
- [ ] No secrets or service-role usage outside `src/lib/supabase/admin.ts`
