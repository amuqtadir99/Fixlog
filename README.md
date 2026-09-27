# FixLog 🔧

**When did I last service/fix this?** FixLog keeps the maintenance history of everything you own — home
systems, appliances, vehicles, electronics, safety gear and personal belongings — and turns it into a live
dashboard of what needs attention next.

- **65+ item types in 11 categories** with ready-made maintenance plans (oil change every 6 months, HVAC
  filter every 3, smoke alarm test monthly…)
- **Live dashboard**: overdue / this week / this month, home health score, open work by category, spend trend
- **Calendar** month view + `.ics` export to Google/Apple/Outlook
- **Statuses** (pending, in progress, waiting for parts, pro booked, on hold, done) and **comments** per task
- **One-click “mark done”** logs cost, provider, odometer/notes and reschedules recurring tasks
- **Service history** timeline with CSV export
- **Email reminders** via Resend: daily or weekly digest to a confirmed address you choose
- **Guided onboarding** (getting-started steps, one-click sample data, Help page)
- Dark mode, mobile-first, accessible

## Stack

Next.js 16 (App Router, Server Actions, Turbopack) · React 19 · Tailwind CSS 4 · Supabase Postgres (RLS +
Realtime) · Clerk auth · Zod · Vitest · GitHub Actions · Vercel.

## Quick start

```bash
cp .env.example .env.local   # Clerk + Supabase keys
npm ci
npx supabase link --project-ref <ref> && npx supabase db push
npm run dev
```

## Scripts

|                   |                                                          |
| ----------------- | -------------------------------------------------------- |
| `npm run dev`     | dev server                                               |
| `npm run check`   | lint + typecheck + unit tests                            |
| `npm run build`   | production build                                         |
| `npm run test:db` | apply migrations to a scratch Postgres and run RLS tests |
| `npm run format`  | prettier                                                 |

## Docs

- [Requirements](docs/REQUIREMENTS.md) — personas, functional & non-functional requirements
- [Architecture](docs/ARCHITECTURE.md) — request flow, data model, decisions
- [Deployment & CI/CD](docs/DEPLOYMENT.md) — Supabase, Clerk, Vercel, GitHub secrets, `live` branch
- [Security](SECURITY.md) — threat model and controls
- [CLAUDE.md](CLAUDE.md) — conventions for AI-assisted development
