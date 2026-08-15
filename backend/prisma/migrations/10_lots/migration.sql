-- CreateEnum
CREATE TYPE "LotStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'SOLD', 'NOT_FOR_SALE');

-- CreateEnum
CREATE TYPE "LotKind" AS ENUM ('LOT', 'AMENITY', 'GREEN_AREA', 'ROAD', 'BLOCK');

-- CreateTable
CREATE TABLE "Lot" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "block" TEXT,
    "kind" "LotKind" NOT NULL DEFAULT 'LOT',
    "status" "LotStatus" NOT NULL DEFAULT 'AVAILABLE',
    "geometry" JSONB NOT NULL,
    "centroidLat" DOUBLE PRECISION NOT NULL,
    "centroidLng" DOUBLE PRECISION NOT NULL,
    "areaM2" DOUBLE PRECISION,
    "frontM" DOUBLE PRECISION,
    "depthM" DOUBLE PRECISION,
    "price" DOUBLE PRECISION,
    "pricePerM2" DOUBLE PRECISION,
    "cadastralCode" TEXT,
    "ownerName" TEXT,
    "ownerPhone" TEXT,
    "reservedUntil" TIMESTAMP(3),
    "name" TEXT,
    "description" TEXT,
    "images" TEXT[],
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Lot_projectId_status_idx" ON "Lot"("projectId", "status");

-- CreateIndex
CREATE INDEX "Lot_projectId_kind_idx" ON "Lot"("projectId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "Lot_projectId_code_key" ON "Lot"("projectId", "code");

-- AddForeignKey
ALTER TABLE "Lot" ADD CONSTRAINT "Lot_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
