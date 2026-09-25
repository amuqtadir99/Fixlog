# Deployment & CI/CD

```
PR ──▶ CI (format · lint · typecheck · unit · build · audit · DB/RLS · gitleaks · CodeQL · dep-review)
   └─▶ Vercel preview deploy (URL in job summary)

merge to main ──▶ CI ──▶ supabase db push ──▶ Vercel production ──▶ /api/health smoke test
                                                                 └─▶ fast-forward `live` branch
```

`live` always points to the commit running in production — use it for hotfix diffs and rollbacks
(`vercel rollback` or re-run _Deploy_ on an older commit via _workflow_dispatch_).

## One-time setup

### 1. Supabase

1. Create a project at <https://supabase.com> (free tier).
2. _Authentication → Sign In / Providers → Third-party auth → Add Clerk_, paste your Clerk domain.
3. _Project Settings → API keys_: copy the URL, **publishable** key and **secret** key.
4. Apply schema: `npx supabase link --project-ref <ref>` then `npx supabase db push` (CI does this on every merge).

### 2. Clerk

1. Create an application at <https://dashboard.clerk.com>; enable email + any social providers.
2. Open <https://dashboard.clerk.com/setup/supabase> and **activate the Supabase integration**
   (adds the `role: authenticated` claim to session tokens).
3. _Webhooks → Add endpoint_ `https://<domain>/api/webhooks/clerk`, event `user.deleted`; copy the signing secret.

### 3. Vercel

1. Import the GitHub repo in Vercel (framework: Next.js). `vercel.json` disables Vercel's own Git
   deployments because GitHub Actions deploys after CI passes. (Prefer Vercel's Git integration? Delete the
   `git` block from `vercel.json` and remove the preview/production jobs from `deploy.yml`.)
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
