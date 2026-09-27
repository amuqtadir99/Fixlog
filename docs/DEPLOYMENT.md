# Deployment & CI/CD

```
PR ──▶ CI (format · lint · typecheck · unit · build · audit · DB/RLS · gitleaks · CodeQL · dep-review)
   └─▶ Vercel preview (Vercel Git integration)

merge to main ──▶ Vercel production (Vercel Git integration)
              └─▶ Actions: CI ──▶ supabase db push ──▶ fast-forward `live` branch
```

`live` points to the last `main` commit that passed CI and had its migrations applied.

> **Deploys come from Vercel's Git integration.** If you'd rather have Actions deploy only after CI
> passes, set the repository variable `DEPLOY_WITH_ACTIONS=true`, add `VERCEL_TOKEN`, `VERCEL_ORG_ID`
> and `VERCEL_PROJECT_ID` secrets, and turn off Git deployments in Vercel (_Settings → Git_).
> Check what's live at `/api/health` → `commit`.

## Try it first: demo mode (no Clerk)

To explore the app before setting up sign-in:

1. In Vercel → _Settings → Environment Variables_ set `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY`), `SUPABASE_SECRET_KEY`
   (or `SUPABASE_SERVICE_ROLE_KEY`) and **`DEMO_MODE=true`**. Leave the Clerk keys unset.
2. Apply the database schema (below, step 1.4). Without it every page fails to load data.
3. Redeploy. Open `/api/health`: it should say `"authMode":"demo"` and `"database":"ok"`.

Everyone who opens the site shares one demo account, so treat the data as public. Adding the Clerk keys
later switches to real accounts automatically (demo data stays under the `demo_user` id and is never shown to
real users). Without Clerk keys _and_ without `DEMO_MODE=true`, the site shows a setup page listing what's
missing instead of an error.

## One-time setup

### 1. Supabase

1. Create a project at <https://supabase.com> (free tier).
2. _Authentication → Sign In / Providers → Third-party auth → Add Clerk_, paste your Clerk domain.
3. _Project Settings → API keys_: copy the URL, **publishable** key and **secret** key.
4. Apply schema, either:
   - **CLI:** `npx supabase link --project-ref <ref>` then `npx supabase db push` (CI does this on every
     merge once the Supabase GitHub secrets exist), or
   - **Dashboard:** _SQL Editor → New query_, paste each file from `supabase/migrations/` **in filename
     order**, and run it.

   Check with `https://<your-domain>/api/health` → `"database":"ok"` (needs the secret key set).

### 2. Clerk

1. Create an application at <https://dashboard.clerk.com>; enable email + any social providers.
2. Open <https://dashboard.clerk.com/setup/supabase> and **activate the Supabase integration**
   (adds the `role: authenticated` claim to session tokens).
3. _Webhooks → Add endpoint_ `https://<domain>/api/webhooks/clerk`, event `user.deleted`; copy the signing secret.

### 2b. Email reminders (Resend)

1. Create an account at <https://resend.com> → _API Keys_ → create a key with _Sending access_.
2. _Domains_ → add your domain and its DNS records (SPF/DKIM) until it shows **Verified**.
   (Skip this to test: without `EMAIL_FROM`, the test sender `onboarding@resend.dev` only delivers to the
   email address of your Resend account.)
3. In Vercel set `RESEND_API_KEY`, `EMAIL_FROM` (e.g. `FixLog <reminders@your-domain.com>`), a long random
   `CRON_SECRET` (`openssl rand -hex 32`) and `SUPABASE_SECRET_KEY`. Optionally set `APP_URL` if you use a
   custom domain.
4. Redeploy. `vercel.json` registers a daily cron (08:00 UTC) that calls `/api/cron/reminders`.
5. In the app open **Settings**, enter an address, save, click the confirmation link in your inbox, then
   **Send a test email**.

Clerk-verified addresses are trusted immediately. Any other address must be confirmed by link before FixLog
emails it. Reminders are disabled in demo mode.

### 3. Vercel

1. Import the GitHub repo in Vercel (framework: Next.js). Vercel deploys every push: previews for PRs and
   production for `main`.
2. Add environment variables (Production + Preview) from `.env.example`.
3. Create a token (_Account settings → Tokens_). Run `npx vercel link` locally to get `orgId`/`projectId`
   from `.vercel/project.json`.

### 4. GitHub repository secrets

_Settings → Secrets and variables → Actions_:

| Secret                                               | From                                          |
| ---------------------------------------------------- | --------------------------------------------- |
| `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | Vercel                                        |
| `SUPABASE_ACCESS_TOKEN`                              | supabase.com → Account → Access tokens        |
| `SUPABASE_PROJECT_ID`                                | project ref (in the dashboard URL)            |
| `SUPABASE_DB_PASSWORD`                               | the database password set at project creation |

Until these exist, deploy jobs skip with a notice instead of failing.

### 5. Branch protection (recommended)

Protect `main` (require PR, the _CI_ and _CodeQL_ checks, 1 review) and `live` (restrict pushes to
GitHub Actions).

## Local development

```bash
cp .env.example .env.local   # fill in values
npm ci
npm run dev                  # http://localhost:3000
```

Local database (optional, Docker): `CLERK_DOMAIN=<your>.clerk.accounts.dev npx supabase start`, then use the
printed local URL/keys.
