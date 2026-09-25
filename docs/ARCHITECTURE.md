# FixLog — Architecture

## 1. Stack

| Layer      | Choice                                                                                | Why                                                                                            |
| ---------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Framework  | **Next.js 16 (App Router, Turbopack)**                                                | React Server Components + Server Actions give a typed backend with no separate API server.     |
| UI         | React 19, **Tailwind CSS v4**, lucide-react icons                                     | Fast, tiny runtime, responsive by default, dark mode.                                          |
| Backend    | Next.js **Server Actions** + **Route Handlers** on Vercel Functions (Node.js runtime) | Stateless, auto-scaling, open source.                                                          |
| Database   | **Supabase Postgres** (PostgREST + Realtime)                                          | Open-source Postgres, Row Level Security, realtime change feed.                                |
| Auth       | **Clerk** (Core 3) via Supabase _third-party auth_                                    | Clerk session JWT is accepted directly by Supabase; RLS reads `auth.jwt()->>'sub'`.            |
| Validation | **Zod 4**                                                                             | Single schema for server-side validation and TS types.                                         |
| Hosting    | **Vercel**                                                                            | Preview deploy per PR, production on `main`.                                                   |
| CI/CD      | GitHub Actions                                                                        | Lint, typecheck, test, build, CodeQL, gitleaks, dependency review, deploy, `live` branch sync. |

## 2. Request flow

```
Browser ──HTTPS──▶ Vercel Edge ──▶ src/proxy.ts (clerkMiddleware)
                                   │  • verifies Clerk session
                                   │  • protects app routes
                                   │  • sets strict nonce CSP + security headers
                                   ▼
                    Server Component / Server Action (Node.js)
                                   │  auth() → userId + session JWT
                                   │  zod-validate input, rate-limit mutations
                                   ▼
                    Supabase client (per request, accessToken = Clerk JWT)
                                   │
                                   ▼
                    Postgres + RLS: user_id = auth.jwt()->>'sub'
```

The browser only talks to Supabase for **Realtime** (subscribe-only, same Clerk
JWT, same RLS). All reads/writes go through the Next.js server.

## 3. Source layout

```
src/
  proxy.ts                 Clerk middleware + CSP (Next 16 "proxy" convention)
  app/
    layout.tsx             ClerkProvider, fonts, metadata
    page.tsx               Marketing landing page
    sign-in/, sign-up/     Clerk hosted components
    (app)/                 Authenticated shell (sidebar + topbar)
      dashboard/           KPIs, health score, attention list, activity
      items/               list, new (catalog wizard), [id] detail
      tasks/               list with filters, [id] detail (status, comments, done)
      calendar/            month grid + .ics export
      history/             service log timeline + CSV export
    api/
      health/              liveness probe
      export/history/      CSV download
      export/calendar/     .ics download
      webhooks/clerk/      user.deleted → erase data (svix-verified)
  components/              UI primitives (ui/) and feature components
  lib/
    catalog.ts             categories, types, suggested task templates
    domain.ts              urgency, next-due calculation, health score (pure, unit-tested)
    validation.ts          zod schemas for every mutation
    env.ts                 validated environment variables
    supabase/server.ts     per-request authed client (server-only)
    supabase/admin.ts      service-role client for webhooks only (server-only)
    supabase/browser.ts    realtime client
    rate-limit.ts          Upstash (if configured) or in-memory sliding window
    csv.ts, ics.ts         safe exporters
  server/
    queries.ts             read models used by pages
    actions/*.ts           "use server" mutations
supabase/
  migrations/              versioned SQL (schema, RLS, indexes, triggers)
  seed.sql                 optional local demo data
```

## 4. Data model

```
assets (items) 1───* maintenance_tasks 1───* task_comments
     │                     │
     └──────────*  service_logs  *───────┘ (task_id nullable)
```

Every table has `user_id text not null default auth.jwt()->>'sub'` and RLS
policies `using/with check (user_id = (select auth.jwt()->>'sub'))`. Foreign keys
are composite-safe: triggers verify a child row's parent belongs to the same
user so a crafted request cannot attach data to someone else's item.

Derived values (urgency, health score) are computed in `lib/domain.ts` — never
stored — so they are always consistent with "today" in the user's timezone
(read from a `tz` cookie, fallback UTC).

## 5. Key decisions (ADR summary)

1. **Server Actions over a separate REST API** — fewer moving parts, end-to-end types, built-in CSRF protection (Origin check) in Next.js.
2. **RLS as the security boundary** — application bugs cannot leak other users' data; the service-role key is used only in the Clerk webhook.
3. **Clerk ↔ Supabase native integration** (not JWT templates, deprecated) — no shared JWT secret.
4. **Computed urgency** instead of a stored `overdue` status — avoids cron jobs and stale state.
5. **No heavy UI kit / calendar library** — small bespoke components keep the bundle small and CSP simple.
6. **`live` branch** mirrors what is deployed to production; updated automatically by CI after a successful production deploy.
