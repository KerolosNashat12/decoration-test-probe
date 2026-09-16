# Deploying Super Admin to Vercel

Everything on Vercel, as decided: the React frontend as a static/SPA
project, and the NestJS backend as a Vercel serverless function
(`services/super-admin/backend/api/index.ts`), talking to a managed
Postgres database. This is a monorepo, so **backend and frontend are two
separate Vercel projects**, each pointed at its own subfolder.

## 1. Database — Neon Postgres (via Vercel Marketplace)

Vercel's own "Vercel Postgres" product now runs on Neon under the hood, so
the fastest path is provisioning it from inside Vercel:

1. In the Vercel dashboard: **Storage → Create Database → Neon (Serverless
   Postgres)**. Region: pick one close to Egypt (e.g. Frankfurt).
2. This gives you a `DATABASE_URL` (pooled, for the running app) and
   usually a second direct/unpooled URL — grab both from the database's
   **.env.local** tab.
3. Once, from a machine with network access to that database (any machine
   works — Neon is reachable over the internet, not firewalled to Vercel):
   ```bash
   cd services/super-admin/backend
   DATABASE_URL="<the direct/unpooled URL>" npx prisma migrate deploy
   DATABASE_URL="<the direct/unpooled URL>" npx prisma db seed
   ```
   This creates the schema and the first Super Admin login
   (`admin@decoration.local` / `ChangeMe123!` — **change this password
   after first sign-in**, or set `ADMIN_EMAIL`/`ADMIN_PASSWORD` before
   seeding).

If you'd rather use a different Postgres host (Supabase, Railway, your own),
that's fine too — anything that hands you a `postgresql://` connection
string works; just run the same `migrate deploy` / `db seed` once against
it.

## 2. Backend project (Vercel)

Create a new Vercel project from the GitHub repo, but set:

- **Root Directory:** `services/super-admin/backend`
- **Framework Preset:** Other
- **Build Command:** (leave default — `vercel.json` in that folder already
  routes everything to `api/index.ts`, built by the `@vercel/node` runtime)
- **Install Command:** default (`npm install`) — this also runs
  `postinstall: prisma generate` automatically

**Environment variables** (Project Settings → Environment Variables):

| Key | Value |
| --- | --- |
| `DATABASE_URL` | the pooled Neon connection string from step 1 |
| `JWT_SECRET` | a long random string (`openssl rand -base64 48`) |
| `CORS_ORIGIN` | the frontend's Vercel URL once you have it (comma-separated if more than one, e.g. a custom domain too) |

Deploy. The live API will be at `https://<backend-project>.vercel.app/api/...`
— sanity-check with:
```bash
curl -X POST https://<backend-project>.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@decoration.local","password":"ChangeMe123!"}'
```

## 3. Frontend project (Vercel)

Create a second Vercel project from the same repo:

- **Root Directory:** `services/super-admin/frontend`
- **Framework Preset:** Vite (auto-detected)
- **Build Command / Output Directory:** defaults are correct
  (`vercel.json` in that folder adds the SPA rewrite so client-side routes
  like `/dashboard` don't 404 on refresh)

**Environment variable:**

| Key | Value |
| --- | --- |
| `VITE_API_BASE_URL` | `https://<backend-project>.vercel.app/api` |

Deploy. You'll get a live link like `https://<frontend-project>.vercel.app`.

## 4. Close the loop

Once the frontend has its real URL, go back to the **backend** project's
`CORS_ORIGIN` env var, set it to that URL, and redeploy the backend (Vercel
→ Deployments → Redeploy) so the browser isn't blocked by CORS.

## Notes / limitations of this setup

- **Cold starts:** the backend is a serverless function, not an always-on
  server — the first request after idle time will be slower (Nest app
  bootstrap), then fast while the lambda stays warm.
- **Migrations aren't automatic on deploy.** Vercel doesn't run
  `prisma migrate deploy` for you; run it manually (step 1) whenever the
  schema changes, before or right after deploying the code that needs it.
- **Prisma binary target:** `schema.prisma` now includes
  `binaryTargets = ["native", "rhel-openssl-3.0.x"]` so Prisma's query
  engine has a binary that matches Vercel's Node runtime, in addition to
  the one used for local dev.
- Local development is unaffected — `npm run start:dev` /
  `npm run dev` still work exactly as before; `api/index.ts` is only used
  on Vercel.
