CREATE TYPE "DeveloperSaleStatus" AS ENUM ('DECLARED', 'CONFIRMED', 'REJECTED', 'CANCELLED');

CREATE TABLE "DeveloperSale" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "lotCode" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "paymentType" TEXT NOT NULL,
    "feeRate" DOUBLE PRECISION NOT NULL,
    "receiptUrl" TEXT,
    "notes" TEXT,
    "status" "DeveloperSaleStatus" NOT NULL DEFAULT 'DECLARED',
    "reviewNote" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DeveloperSale_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "DeveloperSale_projectId_idx" ON "DeveloperSale"("projectId");
ALTER TABLE "DeveloperSale" ADD CONSTRAINT "DeveloperSale_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DeveloperSale" ADD CONSTRAINT "DeveloperSale_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "ProjectLead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "SaleInstallment" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "feeAmount" DOUBLE PRECISION NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL,
    "receiptUrl" TEXT,
    "collectedAt" TIMESTAMP(3),
    "voided" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SaleInstallment_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "SaleInstallment" ADD CONSTRAINT "SaleInstallment_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "DeveloperSale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Commission" ADD COLUMN "installmentId" TEXT, ADD COLUMN "description" TEXT;
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_installmentId_fkey" FOREIGN KEY ("installmentId") REFERENCES "SaleInstallment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
