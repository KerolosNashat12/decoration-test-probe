# Decoration

Finishing-materials marketplace for the Egyptian fit-out/finishing trade.
Both services built so far — Super Admin (Phase 1) and Tenant Dashboard
(Phase 2, in progress) — ship bilingual (English/Arabic, full RTL) from
the start. See `ARCHITECTURE.md` for the service layout and the
multi-tenant isolation decision, and `DEPLOYMENT.md` for deploying to
Vercel with a live link.

## One-time setup (run once, in this folder)

This is already a git repo (`main` + `dev` branches). Install dependencies
once, locally:

```bash
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

## Running the Tenant Dashboard service locally (Phase 2)

Each approved tenant gets their **own PostgreSQL database** (see
"Multi-tenant isolation" in `ARCHITECTURE.md`), so this service talks to
Postgres three different ways: its own control database, a superuser
connection used only to create new tenant databases, and a per-tenant
connection built on demand. Local dev needs two databases to exist up
front — the rest (one database per tenant) are created automatically by
the provisioning flow.

```bash
# 1. Create the two databases this service owns directly
psql -U postgres -c "CREATE DATABASE tenant_dashboard_control;"
# (no need to create per-tenant databases yourself — provisioning does that)

cd services/tenant-dashboard/backend
cp .env.example .env
# edit .env if your local Postgres user/password/port differ from the
# defaults — see the comments in .env.example for what each of the three
# connection strings is for
npm install
npm run prisma:control:migrate   # applies the control-DB schema (TenantAccount)
npm run start:dev                # http://localhost:3002/api
```

```bash
cd services/tenant-dashboard/frontend
cp .env.example .env
npm install
npm run dev                      # http://localhost:5174
```

**Connecting the two services:** Super Admin's backend calls Tenant
Dashboard's internal API to provision a tenant right after an application
is approved (or when an admin clicks "Provision dashboard access" on an
existing tenant). For that to work locally, set matching values in both
`.env` files:

- `services/super-admin/backend/.env`: `TENANT_DASHBOARD_API_URL` (defaults
  to `http://localhost:3002/api`) and `TENANT_DASHBOARD_INTERNAL_SECRET`.
- `services/tenant-dashboard/backend/.env`: `TENANT_DASHBOARD_INTERNAL_SECRET`
  — **must be the same string** as above.

With both backends running and that secret matched, approving a tenant
application (or clicking "Provision dashboard access") creates a real
Postgres database for that tenant, runs its migrations, and returns a
one-time temporary password shown to the admin in the UI — the tenant logs
into `http://localhost:5174` with that email/password.

If the Tenant Dashboard backend isn't running or the secret isn't set,
approval still succeeds in Super Admin — provisioning is decoupled from
approval on purpose (see "Provisioning flow" in `ARCHITECTURE.md`) — the
tenant is just left without dashboard access until provisioned later.

This provisioning step (creating a database + running migrations by
shelling out to Prisma) assumes a long-running Node process. It works as
written for local dev and a traditional always-on host; it is **not**
Vercel-serverless-compatible as-is — see the caveat in `ARCHITECTURE.md`
before deploying this service.

Running all four processes locally at once, in four terminals:

| Service | Command | URL |
| --- | --- | --- |
| Super Admin backend | `cd services/super-admin/backend && npm run start:dev` | http://localhost:3001/api |
| Super Admin frontend | `cd services/super-admin/frontend && npm run dev` | http://localhost:5173 |
| Tenant Dashboard backend | `cd services/tenant-dashboard/backend && npm run start:dev` | http://localhost:3002/api |
| Tenant Dashboard frontend | `cd services/tenant-dashboard/frontend && npm run dev` | http://localhost:5174 |

## Bilingual: English / Arabic

Both frontends (Super Admin and Tenant Dashboard) ship with full English
and Arabic UI, switchable at runtime from a language toggle in the header
(no reload, no separate build) — every service in this project is expected
to support both languages going forward, including the Public Website when
Phase 3 starts.

- Built with `i18next` / `react-i18next`; all UI strings live in
  `src/i18n/en.json` and `src/i18n/ar.json` in each frontend.
- Arabic renders fully right-to-left: layout mirroring (nav, forms, table
  columns, icons) comes from Ant Design's native `direction="rtl"` support
  plus its `ar_EG` locale, applied globally through `ConfigProvider` — not
  a manual CSS flip.
- The Cairo font is loaded alongside Public Sans for correct Arabic glyph
  rendering.
- The chosen language persists per browser (`localStorage`) and is
  independent per frontend (an admin's language choice doesn't affect a
  tenant's, and vice versa).

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

## What's built so far (Phase 2 — Tenant Dashboard, in progress)

- Database-per-tenant isolation: each approved tenant gets its own physical
  Postgres database (decision + design in `ARCHITECTURE.md`).
- Provisioning, triggered from Super Admin: creates the tenant's database,
  runs its migrations, seeds a starter profile, and generates a one-time
  temporary login — wired into both the approval flow and a manual retry
  action on an existing tenant.
- Tenant login (JWT) and a profile page (shop info, contact details,
  categories) — the tenant's own dashboard, separate from Super Admin.
- Same visual theme and bilingual EN/AR support as Super Admin, for
  consistency across services.
- Catalog with pricing and the RFQ reply flow are next — the nav already
  has placeholders for them, marked "Coming soon."

## What's next (not built yet)

- Finish Phase 2: catalog with pricing, and the RFQ reply flow, on the
  Tenant Dashboard.
- A production-viable (non-serverless) provisioning worker — the current
  provisioning step shells out to Prisma and needs a direct admin Postgres
  connection, which doesn't fit a Vercel serverless function (see the
  caveat in `ARCHITECTURE.md`).
- Phase 3: Public website — RFQ search/creation, the room/wall visualizer,
  also bilingual EN/AR from the start.
