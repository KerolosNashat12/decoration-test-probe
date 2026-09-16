# Architecture

Decoration is a finishing-materials marketplace connecting Egyptian
finishing/fit-out contractors (buyers) with material suppliers (tenants) —
tiles, paint, sanitary ware, electrical fixtures, hardware, and carpentry.

Full product concept, market research, and build order:
see the "Finishing Materials Marketplace — Concept" doc.

## Services (microservices, one repo)

Each platform is its own service with its **own isolated database** — no
service reads another service's database directly. Cross-service data needs
go through an API call, never a shared table.

**Every platform's frontend is bilingual (English / Arabic), decided as a
cross-cutting requirement rather than left to each service.** Super Admin
and Tenant Dashboard both ship this today; the Public Website is expected
to as well when Phase 3 starts. See "Bilingual (English / Arabic)" below
for how it's implemented.

| Service | Status | Backend | Frontend | Database |
| --- | --- | --- | --- | --- |
| `services/super-admin` | **Built (Phase 1)** | NestJS | React (Vite + Ant Design) | `super_admin_db` |
| `services/tenant-dashboard` | **In progress (Phase 2)** | NestJS | React (Vite + Ant Design) | `tenant_dashboard_control` + one DB per tenant |
| `services/public-website` | Not started (Phase 3) | NestJS | React | `public_website_db` |

## Super Admin service (built)

Owns the **tenant registry only**: which suppliers exist, their approval
status, and the admin users who manage them. It does not hold any tenant's
operational data (catalog, pricing, RFQ responses) — that will live in the
Tenant Dashboard service once built.

- `services/super-admin/backend` — NestJS + PostgreSQL (via Prisma), JWT
  auth for admin users, role-based (`SUPER_ADMIN` / `REVIEWER`).
- `services/super-admin/frontend` — React admin panel (Ant Design):
  sign in, review tenant applications (approve/reject), manage tenants
  directly (add / suspend / reactivate).

Data model (`services/super-admin/backend/prisma/schema.prisma`):

- `AdminUser` — who can log into Super Admin.
- `TenantApplication` — a self-serve "request to join" submitted from the
  public website (`POST /api/tenant-applications`, no auth required —
  intentionally open). Lands as `PENDING` in the review queue.
- `Tenant` — the approved supplier registry. Created either by Super Admin
  directly, or by approving a `TenantApplication` (both paths end up here).

## Tenant Dashboard service (in progress)

Each approved tenant's own login and operational data. Two Prisma schemas,
because it owns two different kinds of database:

- `services/tenant-dashboard/backend/prisma/control/schema.prisma` — the
  **control database** (`tenant_dashboard_control`), one physical database
  for the whole service. Holds `TenantAccount` (id = the Super Admin
  `Tenant.id`, email, passwordHash, dbName, isActive) — the lookup table a
  login by email needs before it knows which per-tenant database to talk
  to.
- `services/tenant-dashboard/backend/prisma/tenant/schema.prisma` — the
  **per-tenant schema**, applied to a fresh database for every tenant by
  the provisioning flow below. Holds `Profile` (the tenant's own shop
  info, editable by them) today; catalog/RFQ models land here as Phase 2
  continues.

`src/tenant-db/tenant-prisma.factory.ts` builds a `PrismaClient` pointed at
one tenant's database on demand (connection string built from
`TENANT_DB_URL_TEMPLATE` + that tenant's `dbName`), used per-request once a
tenant is authenticated — nothing in this service holds one giant Prisma
client spanning every tenant's data.

Frontend (`services/tenant-dashboard/frontend`) reuses the same stack and
visual theme as the Super Admin frontend for consistency: tenant login,
protected shell, and a profile page today; catalog/RFQ screens are the
next slice of Phase 2, not built yet.

## Multi-tenant isolation — decided

Two different things both got called "isolation" while scoping this, worth
keeping distinct:

1. **Service-level database isolation** (settled): each service — Super
   Admin, Tenant Dashboard, Public Website — gets its own database. This is
   what's built today for Super Admin (`super_admin_db`).
2. **Tenant-to-tenant data isolation within the Tenant Dashboard service**
   — **decided: database-per-tenant.** Each approved tenant gets its own
   physical PostgreSQL database, rather than one shared `tenant_db` with
   row-level `tenantId` scoping. This is the stronger isolation guarantee,
   at the cost of heavier operations (migrations and backups multiply per
   tenant). The provisioning flow that creates one is designed below and
   built as of Phase 2.

## Provisioning flow (Phase 2, built)

Cross-service, per the rule above: Super Admin never touches the Tenant
Dashboard's databases directly. It calls the Tenant Dashboard backend's
**internal API**, which owns provisioning.

1. Super Admin approves a `TenantApplication` (or an admin clicks
   "Provision dashboard access" on an existing `Tenant` that doesn't have
   one yet — the retry path, see step 5).
2. Super Admin's backend calls
   `POST {TENANT_DASHBOARD_API_URL}/internal/provision-tenant` with a
   shared-secret header (`X-Internal-Secret`, value in
   `TENANT_DASHBOARD_INTERNAL_SECRET` on both services — this is
   service-to-service, never called from a browser, so it doesn't go
   through CORS or the tenant's own JWT auth). Body: the tenant's id, name,
   contact name, email, phone.
3. The Tenant Dashboard backend's `ProvisioningService`:
   - Picks a database name (`tenant_<uuid, sanitized>`).
   - Connects to the Postgres server with an **admin connection**
     (`PROVISION_DB_ADMIN_URL` — a superuser/owner connection string to the
     `postgres` maintenance database, separate from `DATABASE_URL`) and
     runs `CREATE DATABASE`.
   - Runs the tenant-schema Prisma migrations against the freshly created
     database (`prisma migrate deploy --schema=prisma/tenant/schema.prisma`,
     invoked with `DATABASE_URL` overridden to the new tenant database —
     see the caveat below).
   - Generates a random temporary password, hashes it, and writes a
     `TenantAccount` row to its own **control database**
     (`tenant_dashboard_control`) — the row that lets a login by email find
     the right per-tenant database before a per-tenant connection exists.
   - Seeds a `Profile` row inside the new tenant database with the basic
     shop info passed in, so the tenant's own dashboard has something to
     show on first login.
   - Returns `{ email, temporaryPassword, dbName }` — the plaintext
     password is returned exactly once, over this internal call, and never
     stored anywhere in plaintext.
4. Super Admin's backend stores nothing from that response except marking
   the `Tenant.dashboardUserEmail` field (already in the schema) and shows
   the generated password to the reviewing admin once, in the approval
   response, the same one-time-reveal pattern already used for admin-user
   creation. It's the admin's job to relay it to the tenant.
5. **Provisioning is decoupled from approval succeeding.** If the Tenant
   Dashboard is unreachable or provisioning throws, the `Tenant` row still
   gets created/approved in Super Admin (that's the source of truth for
   "is this a real tenant") — it's just left with `dashboardUserEmail:
   null`, and the Tenants list surfaces a "Provision dashboard access"
   action for it so an admin can retry once the issue is fixed. Approval
   never rolls back because a downstream service had a bad moment.
6. Provisioning is **idempotent** on `tenantId`: calling it again for a
   tenant that already has a `TenantAccount` returns a 409 rather than
   creating a second database, so a retry after a partial failure (e.g. the
   HTTP response was lost but the database was actually created) doesn't
   double-provision. (Not yet handling the narrower case of "database created,
   but the control-DB write failed" — that needs a reconciliation job, noted
   as a follow-up rather than solved here.)
7. **Suspend/reactivate stays in sync too.** Suspending or reactivating a
   tenant in Super Admin calls
   `PATCH {TENANT_DASHBOARD_API_URL}/internal/tenant-accounts/:tenantId/active`
   (same shared-secret guard) right after updating the `Tenant` row, so a
   suspended tenant is actually locked out of their Tenant Dashboard login
   (`TenantAccount.isActive`), not just shown as suspended in the registry.
   Same fail-soft contract as provisioning: if the Tenant Dashboard is
   unreachable, suspend/reactivate still succeeds in Super Admin — this was
   caught and fixed during Phase 2 verification (a suspended tenant could
   otherwise still sign in, since the two `isActive`-equivalent flags live
   in different databases with nothing keeping them in sync automatically).

**Caveat — this provisioning step assumes a long-running Node process**,
not a serverless function: it shells out to run a migration and needs a
direct admin connection to create a database. That's fine for local dev and
for a traditional always-on host. It is very likely **not** how this ends
up running against Vercel + a managed Postgres provider (Neon, etc.) in
production — those either don't expose a superuser `CREATE DATABASE`
connection at all, or make it slow/rate-limited, and a Vercel serverless
function has a short execution limit and a read-only filesystem, both
hostile to "shell out to prisma migrate deploy." The realistic production
shape is a small always-on provisioning worker (or a queue + worker) that
does exactly what `ProvisioningService` does here, fronted by the same
internal API contract — worth revisiting when Tenant Dashboard is ready to
deploy, but not a blocker for building the feature and proving the flow
against real Postgres locally now.

## Tech stack

- **Backend:** Node.js, NestJS, TypeScript, Prisma ORM, PostgreSQL, JWT auth.
- **Frontend:** React, TypeScript, Vite, Ant Design, React Router, Axios.
- Chosen for consistency with a NestJS + PostgreSQL backend stack already
  proven on another active project, and because NestJS's module system maps
  cleanly onto separate, independently deployable services.

## Visual design

The Super Admin frontend's colors and component styling (dark navy/indigo
theme, pill-shaped nav, card styling) are adapted from the NEATLAB Admin
Dashboard UI Design Kit (Figma Community), reskinned onto our own feature
set. The palette lives in `services/super-admin/frontend/src/theme.ts` and
is applied globally via Ant Design's `ConfigProvider`. Colors were extracted
by pixel-sampling the kit's screenshots (the live Figma design-context tool
needed an active desktop-app selection that wasn't available this session),
so treat `theme.ts` as a close approximation, not an exact token export —
worth re-syncing from Figma variables directly if the kit is opened locally.

## Bilingual (English / Arabic)

Decided project-wide, not per-service: every frontend supports English and
Arabic with full right-to-left layout for Arabic, switchable at runtime.
Both frontends built so far (`super-admin`, `tenant-dashboard`) implement
this the same way, so it's documented once here rather than per service:

- **`i18next` + `react-i18next`** for translation strings — each frontend
  has its own `src/i18n/en.json` / `src/i18n/ar.json` resource files and an
  `src/i18n/index.ts` that initializes i18next and persists the chosen
  language to `localStorage` (a distinct key per frontend, so an admin's
  language choice and a tenant's are independent).
- **RTL comes from Ant Design itself**, not manual CSS: the root component
  (`src/main.tsx` in each frontend) reads the active language and passes
  `direction="rtl"` + the `ar_EG` locale import to Ant Design's
  `ConfigProvider` when Arabic is active, and sets `document.documentElement
  .dir`/`.lang` to match. This flips layout, spacing, and icon placement
  consistently across every Ant Design component for free, rather than
  hand-mirroring each page.
- **Cairo** (Google Font) is loaded alongside Public Sans in both
  frontends' `index.html`, since Public Sans alone lacks Arabic glyphs.
  `theme.ts`'s font stack in each frontend lists both.
- A small `LanguageSwitcher` component (EN / ع toggle) sits in the header
  of both frontends' layouts and the login pages; switching is instant, no
  page reload, no separate build per language.
- Verified visually, not just assumed: both frontends were screenshotted in
  both languages (via Playwright) during development, confirming RTL
  mirroring actually renders correctly rather than just compiling.

New services (Public Website, Phase 3) should follow the same pattern from
the start rather than retrofitting it later.

## Why not reuse M&M's stack directly

M&M Accessories ERP (`mm-accessories-erp`) is Node + Express + SQLite,
offline-first, built for one shop trading from one physical location. Its
product/catalog data model and UI patterns are worth carrying over once the
Tenant Dashboard service is built — the persistence and hosting layer isn't:
this system is multi-tenant and web-hosted, which needs a shared server-side
database (PostgreSQL), not a local file per installation.
