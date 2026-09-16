-- CreateEnum
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
