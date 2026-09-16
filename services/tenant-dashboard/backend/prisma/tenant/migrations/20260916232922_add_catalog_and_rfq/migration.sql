-- CreateEnum
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
