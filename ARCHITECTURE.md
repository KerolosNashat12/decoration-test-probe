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

| Service | Status | Backend | Frontend | Database |
| --- | --- | --- | --- | --- |
| `services/super-admin` | **Built (Phase 1)** | NestJS | React (Vite + Ant Design) | `super_admin_db` |
| `services/tenant-dashboard` | Not started (Phase 2) | NestJS | React | `tenant_db` |
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

## Multi-tenant isolation — decided

Two different things both got called "isolation" while scoping this, worth
keeping distinct:

1. **Service-level database isolation** (settled): each service — Super
   Admin, Tenant Dashboard, Public Website — gets its own database. This is
   what's built today for Super Admin (`super_admin_db`).
2. **Tenant-to-tenant data isolation within the Tenant Dashboard service**
   — **decided: database-per-tenant.** Each approved tenant gets its own
   physical PostgreSQL database once the Tenant Dashboard service is built,
   rather than one shared `tenant_db` with row-level `tenantId` scoping.
   This is the stronger isolation guarantee, at the cost of heavier
   operations (migrations and backups multiply per tenant — the Tenant
   Dashboard service will need automated per-tenant migration tooling and a
   provisioning step that creates a new database when Super Admin approves
   a tenant). Worth designing that provisioning flow explicitly when Phase 2
   starts, rather than bolting it on after tenants already exist.

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

## Why not reuse M&M's stack directly

M&M Accessories ERP (`mm-accessories-erp`) is Node + Express + SQLite,
offline-first, built for one shop trading from one physical location. Its
product/catalog data model and UI patterns are worth carrying over once the
Tenant Dashboard service is built — the persistence and hosting layer isn't:
this system is multi-tenant and web-hosted, which needs a shared server-side
database (PostgreSQL), not a local file per installation.
