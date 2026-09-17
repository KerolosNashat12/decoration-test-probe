// Tenant-schema migration SQL, embedded as source rather than read from
// prisma/tenant/migrations/*/migration.sql at runtime.
//
// Why embedded instead of shelled out to the Prisma CLI: see the removed
// `runTenantMigrations()` that used to call
// `execFileSync('npx', ['prisma', 'migrate', 'deploy', ...])` — on Vercel
// that failed every time with `ENOENT ... mkdir '/home/sbx_user1051'`,
// because a serverless function's filesystem is read-only and npx has
// nowhere to write its cache/home directory (confirmed in Runtime Logs
// after the diagnostic logging in api/index.ts made the real error
// visible, per ARCHITECTURE.md's documented "Caveat" on this flow).
// Embedding the SQL as a plain module means esbuild bundles it like any
// other source file — no CLI invocation, no filesystem writes, so it runs
// fine inside a short-lived serverless function.
//
// Keep this in lockstep with prisma/tenant/migrations/: whenever a new
// migration is added there with `prisma migrate dev`, copy its
// migration.sql content here too, in order, as a new array entry. The name
// must match the migration folder name exactly, since applyTenantMigrations()
// uses it (and a checksum of the SQL) to record the migration in
// `_prisma_migrations`, in the same shape `prisma migrate deploy` would —
// so `prisma migrate status` run manually against a tenant database later
// (e.g. from a dev machine) sees these as already applied instead of
// trying to redo them.
export interface TenantMigration {
  name: string;
  sql: string;
}

export const TENANT_MIGRATIONS: TenantMigration[] = [
  {
    name: '20260916225407_init',
    sql: `-- CreateEnum
CREATE TYPE "TenantCategory" AS ENUM ('TILES_CERAMICS', 'PAINT_COATINGS', 'SANITARY_WARE', 'ELECTRICAL_FIXTURES', 'HARDWARE', 'CARPENTRY_WOOD');

-- CreateTable
CREATE TABLE "profile" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "whatsapp" TEXT,
    "email" TEXT,
    "district" TEXT,
    "categories" "TenantCategory"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profile_tenantId_key" ON "profile"("tenantId");
`,
  },
  {
    name: '20260916232922_add_catalog_and_rfq',
    sql: `-- CreateEnum
CREATE TYPE "RfqStatus" AS ENUM ('NEW', 'RESPONDED', 'DECLINED', 'EXPIRED');

-- CreateTable
CREATE TABLE "product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "TenantCategory" NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "photoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfq" (
    "id" TEXT NOT NULL,
    "buyerName" TEXT NOT NULL,
    "buyerPhone" TEXT NOT NULL,
    "category" "TenantCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" TEXT,
    "deadlineAt" TIMESTAMP(3),
    "status" "RfqStatus" NOT NULL DEFAULT 'NEW',
    "isTest" BOOLEAN NOT NULL DEFAULT false,
    "declineReason" TEXT,
    "declinedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rfq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfq_response" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "productId" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "priceUnit" TEXT NOT NULL,
    "availabilityNote" TEXT,
    "message" TEXT,
    "respondedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rfq_response_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rfq_response_rfqId_key" ON "rfq_response"("rfqId");

-- AddForeignKey
ALTER TABLE "rfq_response" ADD CONSTRAINT "rfq_response_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "rfq"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_response" ADD CONSTRAINT "rfq_response_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
`,
  },
];
