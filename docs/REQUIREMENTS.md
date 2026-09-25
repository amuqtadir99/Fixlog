# FixLog — Requirements

> "When did I last service/fix this?"

FixLog keeps the maintenance history of anything a person owns (home systems,
appliances, vehicles, electronics, personal belongings) and turns that history
into a live dashboard of what needs attention next.

## 1. Personas

| Persona                 | Need                                                                                                              |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Home owner**          | Track HVAC filters, water heater flushes, gutter cleaning, smoke-detector tests; see at a glance what is overdue. |
| **Car owner**           | Remember oil changes, tyre rotations, inspections, registration renewals and what they cost.                      |
| **Renter / individual** | Track laptops, bikes, watches, shoes, appliances they own; keep receipts/notes and warranty dates.                |

## 2. Glossary

| Term                             | Meaning                                                                                                  |
| -------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Item** (`assets` table)        | A thing the user owns and maintains — "Kitchen fridge", "2019 Honda Civic".                              |
| **Category / Type**              | Two-level catalog used to pick an item (e.g. `vehicle` → `car`). Drives suggested tasks.                 |
| **Task** (`maintenance_tasks`)   | A recurring or one-off maintenance job for an item with a due date, priority and status.                 |
| **Service log** (`service_logs`) | An immutable-ish record that work was done: date, who, cost, notes. The _history_.                       |
| **Comment** (`task_comments`)    | Free-text note thread against a task.                                                                    |
| **Urgency**                      | Derived, never stored: `overdue`, `due_soon` (≤ 7 days), `upcoming` (≤ 30 days), `later`, `unscheduled`. |

## 3. Functional requirements

### 3.1 Authentication & account (Clerk)

- FR-1 Sign up / sign in with email, social providers (configured in Clerk dashboard) and MFA.
- FR-2 All app routes (`/dashboard`, `/items`, `/tasks`, `/calendar`, `/history`) require a signed-in user; unauthenticated users are redirected to sign in.
- FR-3 When a Clerk user is deleted, all of their FixLog data is deleted (webhook, GDPR "right to erasure").

### 3.2 Items

- FR-4 Create an item by choosing from **10+ categories and 65+ types** (Home systems, Appliances, Vehicles, Electronics, Outdoor & garden, Safety, Plumbing, Electrical, Personal belongings, Health & fitness, Other).
- FR-5 Item fields: name, category, type, location/room, brand, model, serial number, purchase date, warranty expiry, notes.
- FR-6 On creation, the user is offered **suggested maintenance tasks** for that type (e.g. Car → oil change every 6 months) and ticks the ones to create.
- FR-7 Edit, archive and delete items. Deleting cascades to tasks, logs and comments.
- FR-8 List/filter items by category and search by name.

### 3.3 Maintenance tasks

- FR-9 Create a task for an item: title, description, recurrence (none / every _N_ days|weeks|months|years), next due date, priority (`low|medium|high|critical`).
- FR-10 Status is selectable: `pending`, `in_progress`, `waiting_parts`, `scheduled_pro` (booked a professional), `on_hold`, `done`.
- FR-11 **Mark as done** in one action: writes a service log (date, cost, provider, notes), sets `last_completed_on` and — for recurring tasks — rolls `next_due_on` forward by the interval and resets status to `pending`.
- FR-12 Comment thread per task (add / delete own comments).
- FR-13 List and filter tasks by status, priority, urgency and category.

### 3.4 Service history

- FR-14 Record ad-hoc service logs against an item (with or without a task).
- FR-15 Timeline of all service logs; per-item history on item page.
- FR-16 Export history as CSV (spreadsheet-safe, formula-injection neutralised).

### 3.5 Dashboard ("live")

- FR-17 KPI tiles: overdue, due in 7 days, due in 30 days, items tracked, spend this year.
- FR-18 **Home health score** (0–100) derived from overdue/due-soon ratio.
- FR-19 "Needs attention" list (overdue + due soon) with inline status change and mark-done.
- FR-20 Breakdown of open tasks by category; recent activity feed.
- FR-21 Dashboard updates live when data changes in another tab/device (Supabase Realtime → router refresh), with graceful fallback when Realtime is unavailable.

### 3.6 Calendar

- FR-22 Month calendar showing tasks on their due dates, colour-coded by urgency; navigate months; click-through to task.
- FR-23 Download all upcoming tasks as an `.ics` file to import into Google/Apple/Outlook calendar.

## 4. Non-functional requirements

| ID                  | Requirement                                                                                                                                                                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| NFR-1 Security      | OWASP Top-10 mitigations; Row Level Security on every table; server-side validation of every input (Zod); strict nonce-based CSP; HSTS; no secrets in client bundle; signed webhooks; rate limiting on mutations. See [`SECURITY.md`](../SECURITY.md). |
| NFR-2 Privacy       | Users can only ever read/write their own rows (enforced in Postgres, not only in app code). Data erased on account deletion.                                                                                                                           |
| NFR-3 Performance   | Server Components by default; minimal client JS; indexed queries on `(user_id, next_due_on)`; LCP < 2.5 s on 4G.                                                                                                                                       |
| NFR-4 Scalability   | Stateless serverless compute (Vercel Functions) + managed Postgres (Supabase, connection pooling via PostgREST). No in-process state required for correctness.                                                                                         |
| NFR-5 Accessibility | WCAG 2.2 AA: semantic HTML, labelled form controls, focus rings, colour is never the only signal.                                                                                                                                                      |
| NFR-6 Responsive    | Works from 360 px phones to desktop; dark mode via `prefers-color-scheme`.                                                                                                                                                                             |
| NFR-7 Quality       | TypeScript strict; ESLint; unit tests for domain logic; CI must pass before merge.                                                                                                                                                                     |
| NFR-8 Operability   | `/api/health` endpoint; structured server logs; zero-downtime deploys on Vercel; DB migrations versioned in `supabase/migrations`.                                                                                                                     |
| NFR-9 Cost          | Runs on free tiers of Vercel, Supabase and Clerk. All code/infra OSS or free.                                                                                                                                                                          |

## 5. Out of scope (v1)

- Shared households / multi-user items (planned: Clerk Organizations + `org_id` column).
- File/receipt uploads (planned: Supabase Storage with RLS).
- Push/email reminders (planned: Vercel Cron + Resend).
- Native mobile apps.

## 6. Acceptance checklist

- [ ] New user can sign up, add "Car → 2019 Civic" with suggested tasks, and see them on dashboard + calendar.
- [ ] Marking an oil change done creates a history entry and moves the next due date 6 months ahead.
- [ ] Changing status and adding comments on a task persists and appears on refresh in another tab.
- [ ] A second user cannot read the first user's rows via the Supabase REST API with their own token.
- [ ] CI (lint, typecheck, unit tests, build, CodeQL, secret scan) is green; merging to `main` deploys to production and updates the `live` branch.
