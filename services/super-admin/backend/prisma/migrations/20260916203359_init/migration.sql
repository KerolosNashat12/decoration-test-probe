-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "TenantCategory" AS ENUM ('TILES_CERAMICS', 'PAINT_COATINGS', 'SANITARY_WARE', 'ELECTRICAL_FIXTURES', 'HARDWARE', 'CARPENTRY_WOOD');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'REVIEWER');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "whatsapp" TEXT,
    "email" TEXT,
    "district" TEXT,
    "categories" "TenantCategory"[],
    "status" "TenantStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "dashboardUserEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_applications" (
    "id" TEXT NOT NULL,
    "shopName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "whatsapp" TEXT,
    "email" TEXT,
    "district" TEXT,
    "categories" "TenantCategory"[],
    "message" TEXT,
    "status" "TenantStatus" NOT NULL DEFAULT 'PENDING',
    "tenantId" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "rejectionReason" TEXT,

    CONSTRAINT "tenant_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'REVIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_dashboardUserEmail_key" ON "tenants"("dashboardUserEmail");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_applications_tenantId_key" ON "tenant_applications"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- AddForeignKey
ALTER TABLE "tenant_applications" ADD CONSTRAINT "tenant_applications_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
