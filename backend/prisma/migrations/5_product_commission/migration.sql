-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "commissionFixedElite" DOUBLE PRECISION,
ADD COLUMN     "commissionFixedPremiere" DOUBLE PRECISION,
ADD COLUMN     "commissionType" TEXT NOT NULL DEFAULT 'percentage';
