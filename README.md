# Decoration

Finishing-materials marketplace for the Egyptian fit-out/finishing trade.
See `ARCHITECTURE.md` for the service layout and the open multi-tenant
isolation decision.

## One-time setup (run once, in this folder)

This folder isn't a git repo yet and dependencies aren't installed — both
need to happen once, locally:

```bash
# 1. Turn this folder into a git repo with dev + main branches
git init
git checkout -b main
git add .
git commit -m "Initial Super Admin service scaffold"
git checkout -b dev

# 2. Install dependencies for the Super Admin service
cd services/super-admin/backend && npm install && cd ../../..
cd services/super-admin/frontend && npm install && cd ../../..
```

Work day to day on `dev`; merge to `main` when it's ready to deploy for
clients — matching the branch split already agreed.

## Running the Super Admin service locally

You'll need a local PostgreSQL instance running (any recent version).

**Backend:**

```bash
cd services/super-admin/backend
cp .env.example .env
# edit .env: set DATABASE_URL to your local Postgres, set a real JWT_SECRET
npx prisma migrate dev --name init
npx prisma db seed          # creates the first Super Admin login
npm run start:dev           # http://localhost:3001/api
```

Default seeded login (change the password after first sign-in, or set
`ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars before seeding):
`admin@decoration.local` / `ChangeMe123!`

**Frontend:**

```bash
cd services/super-admin/frontend
cp .env.example .env
npm run dev                 # http://localhost:5173
```

Both were verified end-to-end before handoff: backend build, a real Postgres
migration, and the full API flow (public application submit → admin login →
approve → tenant appears in the registry → admin adds a tenant directly).

## What's built (Phase 1 — Super Admin)

- Admin login (JWT, role-based: `SUPER_ADMIN` / `REVIEWER`).
- Public tenant application intake (`POST /api/tenant-applications`, no
  auth — this is the public website's "request to join" form landing in
  Super Admin's review queue).
- Review queue: approve (creates the Tenant record) or reject, with a
  reason kept internally.
- Tenant registry: Super Admin can also add a tenant directly, and
  suspend/reactivate an existing one.
- Dashboard overview page: tenant/application stat cards, tenants-by-category
  breakdown, recent applications.
- Admin user management (Super Admin-only): create admin/reviewer accounts,
  change roles, activate/deactivate accounts (self-deactivation blocked).
- Dark navy/indigo visual redesign matching the NEATLAB Admin Dashboard UI
  kit (see "Visual design" in `ARCHITECTURE.md`), applied across all pages.

## What's next (not built yet)

- Phase 2: Tenant Dashboard service (its own database, own login per
  tenant) — catalog with pricing, and RFQ reply flow.
- Phase 3: Public website — RFQ search/creation, the room/wall visualizer.
- The tenant-to-tenant isolation decision in `ARCHITECTURE.md` needs an
  answer before Phase 2 starts.
