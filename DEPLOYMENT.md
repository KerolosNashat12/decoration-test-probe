# Deploying Super Admin to Vercel

This covers the **Super Admin service only** — the one service currently
deployable as-is. Tenant Dashboard (Phase 2) is built and works locally
(see the "Running the Tenant Dashboard service locally" section of
`README.md`) but its provisioning step isn't Vercel-serverless-compatible
yet; see "Tenant Dashboard: not yet deployed to Vercel" at the bottom of
this file before attempting it.

Everything on Vercel, as decided: the React frontend as a static/SPA
project, and the NestJS backend as a Vercel serverless function
(`services/super-admin/backend/api/index.ts`), talking to a managed
Postgres database. This is a monorepo, so **backend and frontend are two
separate Vercel projects**, each pointed at its own subfolder.

Migrations and the first admin login are both automatic on deploy — see
"How the database gets set up" below — so there's no manual database step
between creating the Vercel projects and having a working live app.

## 1. Get a Postgres database

Any Postgres host works — the fastest is a free Neon database:

- **Via Neon directly:** sign up at [neon.tech](https://neon.tech), create
  a project, copy the connection string it gives you (`postgresql://...`).
  Takes about a minute, no Vercel account needed for this step.
- **Via Vercel's dashboard:** Storage → Create Database → Neon (Serverless
  Postgres) — same result, one click if you're already in Vercel.

Either way, you end up with one `DATABASE_URL` value. Keep it handy for
step 2.

## 2. Backend project (Vercel)

Create a new Vercel project from the GitHub repo (or `vercel --prod` from
`services/super-admin/backend` if deploying without GitHub), with:

- **Root Directory:** `services/super-admin/backend`
- **Framework Preset:** Other
- Build/Install commands: leave the defaults — `vercel.json` in that folder
  routes everything to `api/index.ts`, and `package.json`'s
  `vercel-build` script (`prisma migrate deploy && prisma generate`) applies
  the schema to your database automatically on every deploy.

**Environment variables** (Project Settings → Environment Variables):

| Key | Value |
| --- | --- |
| `DATABASE_URL` | the connection string from step 1 |
| `JWT_SECRET` | a long random string (`openssl rand -base64 48`) |
| `CORS_ORIGIN` | the frontend's Vercel URL once you have it from step 3 (comma-separated if more than one) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | optional — override the default seeded login (`admin@decoration.local` / `ChangeMe123!`) |

Deploy. The live API is at `https://<backend-project>.vercel.app/api/...` —
sanity-check with:
```bash
curl -X POST https://<backend-project>.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@decoration.local","password":"ChangeMe123!"}'
```
A successful login on the very first deploy confirms both the migration and
the auto-seed worked — **change that password from the Admin Users page
right after.**

## 3. Frontend project (Vercel)

Create a second Vercel project from the same repo:

- **Root Directory:** `services/super-admin/frontend`
- **Framework Preset:** Vite (auto-detected)
- Build Command / Output Directory: defaults are correct (`vercel.json`
  adds the SPA rewrite so client-side routes like `/dashboard` don't 404 on
  refresh)

**Environment variable:**

| Key | Value |
| --- | --- |
| `VITE_API_BASE_URL` | `https://<backend-project>.vercel.app/api` |

Deploy. You'll get a live link like `https://<frontend-project>.vercel.app`.

## 4. Close the loop

Back on the **backend** project, set `CORS_ORIGIN` to the frontend's real
URL and redeploy (Vercel → Deployments → Redeploy), so the browser isn't
blocked by CORS.

## How the database gets set up (no manual step)

Two things used to require someone to run commands against the live
database by hand — both are now automatic:

1. **Schema migrations** — `package.json`'s `vercel-build` script runs
   `prisma migrate deploy` as part of every Vercel build, before the app
   goes live. Runs on Vercel's own infrastructure, so it works even though
   this project's own dev sandbox can't reach an external database directly.
2. **First admin login** — `PrismaService` checks on every boot whether any
   admin user exists; if the database is brand new, it seeds the default
   Super Admin login itself (same credentials the local `prisma db seed`
   script creates, or your `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars if set).
   Verified end-to-end against a genuinely empty database before this was
   written up: fresh migrate deploy → cold boot → auto-seed fires → login
   succeeds.

## Notes / limitations of this setup

- **Cold starts:** the backend is a serverless function, not an always-on
  server — the first request after idle time is slower (Nest app
  bootstrap), then fast while the lambda stays warm.
- **Prisma binary target:** `schema.prisma` includes
  `binaryTargets = ["native", "rhel-openssl-3.0.x"]` so Prisma's query
  engine has a binary that matches Vercel's Node runtime, in addition to
  the one used for local dev.
- Local development is unaffected — `npm run start:dev` / `npm run dev`
  still work exactly as before; `api/index.ts` is only used on Vercel.

## Tenant Dashboard: not yet deployed to Vercel

The Tenant Dashboard backend's provisioning flow (creating a new tenant's
Postgres database and running its migrations) shells out to
`prisma migrate deploy` and needs a direct superuser/admin Postgres
connection at request time — both are a poor fit for a Vercel serverless
function (short execution limit, read-only filesystem, and most managed
Postgres providers don't expose an ad-hoc `CREATE DATABASE` connection to
a serverless caller the way this needs). Full reasoning is in the
"Provisioning flow" section of `ARCHITECTURE.md`.

The realistic production shape is a small always-on provisioning worker
(or a queue + worker) behind the same internal API contract
(`POST /internal/provision-tenant`) that `ProvisioningService` already
implements — the rest of the Tenant Dashboard backend (tenant login,
profile) has no such constraint and could deploy as a normal serverless
function once that split happens. Worth revisiting when this service is
ready to go live; not a blocker for continuing to build Phase 2 against
real Postgres locally in the meantime.
