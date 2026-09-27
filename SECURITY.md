# Security

## Reporting a vulnerability

Please **do not open a public issue**. Use GitHub's _Report a vulnerability_ (Security → Advisories) on
this repository. We aim to acknowledge within 72 hours.

## Threat model & controls

| Threat (OWASP 2021/2025)                  | Control in FixLog                                                                                                                                                                                                                                                                                             | Where                                                |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **A01 Broken access control / IDOR**      | Postgres Row Level Security on every table (`user_id = auth.jwt()->>'sub'`), `FORCE ROW LEVEL SECURITY`, `anon` has no grants, ownership immutable, same-owner triggers stop attaching rows to another user's parent (FKs bypass RLS). Tested in CI.                                                          | `supabase/migrations`, `supabase/tests/rls_test.sql` |
| Unauthenticated access                    | `clerkMiddleware` + `auth.protect()` on app routes; every query/action calls `auth()`; API routes return 401.                                                                                                                                                                                                 | `src/proxy.ts`, `src/lib/supabase/server.ts`         |
| **A02 Cryptographic failures**            | TLS only (HSTS preload, `upgrade-insecure-requests` on Vercel). No passwords stored — Clerk handles credentials/MFA. Secrets only in Vercel/GitHub encrypted env.                                                                                                                                             | `next.config.ts`                                     |
| **A03 Injection (SQL/XSS)**               | Parameterised PostgREST queries; `complete_task` uses typed params with `search_path=''`. React escaping, no `dangerouslySetInnerHTML`. Strict nonce CSP with `strict-dynamic`, `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'`. CSV exports neutralise formula injection; ICS text escaped. | `src/lib/csv.ts`, `src/lib/ics.ts`, `src/proxy.ts`   |
| **A04 Insecure design / mass assignment** | Every Server Action parses input with Zod; objects strip unknown keys so `user_id`/`id` can never be set by the client; length caps mirrored in DB `check` constraints.                                                                                                                                       | `src/lib/validation.ts`                              |
| CSRF                                      | Server Actions only accept POST with Origin = Host (Next.js built-in); Clerk session cookies are `SameSite=Lax`; `form-action 'self'`.                                                                                                                                                                        | framework                                            |
| **A05 Security misconfiguration**         | `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, strict `Referrer-Policy`, restrictive `Permissions-Policy`, COOP, `poweredByHeader: false`. Server Action body limit 256 KB.                                                                                                                      | `next.config.ts`                                     |
| **A06 Vulnerable components**             | Dependabot (grouped), `npm audit --omit=dev --audit-level=high` and dependency-review gate PRs, CodeQL `security-extended` weekly + on PRs.                                                                                                                                                                   | `.github/`                                           |
| **A07 Auth failures**                     | Clerk (bot protection, MFA, session rotation, breached-password checks). No custom auth code.                                                                                                                                                                                                                 | Clerk dashboard                                      |
| **A08 Integrity failures**                | Clerk webhooks verified with svix signatures; lockfile committed and `npm ci` in CI; secret scanning with gitleaks.                                                                                                                                                                                           | `src/app/api/webhooks/clerk`                         |
| **A09 Logging**                           | Server logs DB error codes, never user content or tokens; users see generic messages + error digest.                                                                                                                                                                                                          | `src/server/actions/guard.ts`                        |
| **A10 SSRF**                              | The server makes no user-controlled outbound requests.                                                                                                                                                                                                                                                        | —                                                    |
| Abuse / DoS                               | Per-user sliding-window rate limit on all mutations and exports (Upstash Redis when configured). Row caps on list queries. Vercel Firewall/DDoS.                                                                                                                                                              | `src/lib/rate-limit.ts`                              |
| Privacy / erasure                         | `user.deleted` webhook erases all rows for that user. Service-role key used only there.                                                                                                                                                                                                                       | `src/app/api/webhooks/clerk/route.ts`                |

## Email reminders

- Only confirmed addresses are emailed. An address counts as confirmed if Clerk has verified it for that
  user, or after the user clicks a single-use link valid for 24 hours. The token is 256 bits and only its
  SHA-256 hash is stored. Changing the address resets confirmation (DB trigger).
- Column-level grants: users can write only their preferences. Confirmation state, tokens and send times are
  written by the server. RLS tests prove a user can't mark their own address confirmed.
- User-triggered emails (confirmation, test) are limited to 5 per user per hour.
- The cron endpoint is protected by `CRON_SECRET` (constant-time compare) and fails closed when it's unset.
- All user text in emails is HTML-escaped (unit tested). Every email has an unsubscribe link and RFC 8058
  one-click `List-Unsubscribe` headers. Unsubscribe works only by POST, so link scanners can't trigger it.
- Email features are off in demo mode. `RESEND_API_KEY` is server-only and never logged.

## Demo mode

`DEMO_MODE=true` (honoured only when Clerk keys are absent) disables sign-in for evaluation: all visitors act
as the single `demo_user` through the service-role client. RLS is bypassed in this mode, so every query and
mutation in `src/server/` also filters/sets `user_id` explicitly and "mark done" checks ownership first.
Without Clerk keys and without the flag the app fails closed (setup page, APIs return 401). Never run a
production deployment with real users in demo mode.

## Operational checklist (production)

- [ ] `DEMO_MODE` unset (and Clerk keys present).
- [ ] Clerk: production instance, allowed origins set, bot protection on, MFA available.
- [ ] Clerk webhook → `/api/webhooks/clerk` with `user.deleted`; `CLERK_WEBHOOK_SIGNING_SECRET` set.
- [ ] Supabase: Clerk added under _Authentication → Third-party auth_; Data API only exposes `public`.
- [ ] `SUPABASE_SECRET_KEY` only in Vercel **production/preview server** env — never `NEXT_PUBLIC_`.
- [ ] `CRON_SECRET` set (long random); `EMAIL_FROM` on a Resend-verified domain.
- [ ] Upstash Redis env vars set for distributed rate limiting.
- [ ] GitHub: branch protection on `main` (require CI + review), secret scanning & push protection on.
