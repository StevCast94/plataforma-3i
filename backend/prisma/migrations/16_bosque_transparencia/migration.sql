-- CreateTable
CREATE TABLE "BosqueExpense" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "receiptUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BosqueExpense_pkey" PRIMARY KEY ("id")
);


-- AlterTable
ALTER TABLE "TreeAdoption" ADD COLUMN "anonymous" BOOLEAN NOT NULL DEFAULT false;
