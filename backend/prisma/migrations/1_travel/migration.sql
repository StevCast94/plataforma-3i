-- CreateEnum
CREATE TYPE "TravelProductKind" AS ENUM ('HOTEL', 'FLIGHT', 'ACTIVITY', 'CAR', 'PACKAGE');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('QUOTED', 'PENDING_PAYMENT', 'PAID', 'CONFIRMED', 'CANCELLED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "MembershipSource" AS ENUM ('PURCHASE', 'REWARD', 'FRACTIONAL', 'STAFF');

-- CreateTable
CREATE TABLE "TravelMembership" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'standard',
    "source" "MembershipSource" NOT NULL DEFAULT 'REWARD',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "grantedBy" TEXT,
    "purchaseId" TEXT,
    "note" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TravelMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TravelOfferCache" (
    "id" TEXT NOT NULL,
    "supplier" TEXT NOT NULL,
    "kind" "TravelProductKind" NOT NULL,
    "searchHash" TEXT NOT NULL,
    "rateKey" TEXT NOT NULL,
    "netCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "payload" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TravelOfferCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarkupRule" (
    "id" TEXT NOT NULL,
    "kind" "TravelProductKind" NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'global',
    "scopeValue" TEXT,
    "percent" DOUBLE PRECISION NOT NULL DEFAULT 0.15,
    "minCents" INTEGER NOT NULL DEFAULT 250,
    "memberPercent" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarkupRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TravelBooking" (
    "id" TEXT NOT NULL,
    "kind" "TravelProductKind" NOT NULL,
    "supplier" TEXT NOT NULL,
    "supplierRef" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'QUOTED',
    "memberId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT,
    "netCents" INTEGER NOT NULL,
    "markupCents" INTEGER NOT NULL,
    "taxesCents" INTEGER NOT NULL DEFAULT 0,
    "totalCents" INTEGER NOT NULL,
    "ownerPayoutCents" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "referralCode" TEXT,
    "referrerId" TEXT,
    "details" JSONB NOT NULL,
    "paymentRef" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "itineraryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TravelBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TravelItinerary" (
    "id" TEXT NOT NULL,
    "memberId" TEXT,
    "title" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "destination" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "totalCents" INTEGER NOT NULL DEFAULT 0,
    "items" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TravelItinerary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceGuaranteeClaim" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT,
    "memberId" TEXT,
    "competitorUrl" TEXT NOT NULL,
    "evidenceUrl" TEXT,
    "claimedCents" INTEGER NOT NULL,
    "ourCents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceGuaranteeClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TravelMembership_memberId_idx" ON "TravelMembership"("memberId");

-- CreateIndex
CREATE INDEX "TravelMembership_purchaseId_idx" ON "TravelMembership"("purchaseId");

-- CreateIndex
CREATE INDEX "TravelOfferCache_searchHash_idx" ON "TravelOfferCache"("searchHash");

-- CreateIndex
CREATE INDEX "TravelOfferCache_expiresAt_idx" ON "TravelOfferCache"("expiresAt");

-- CreateIndex
CREATE INDEX "TravelBooking_memberId_idx" ON "TravelBooking"("memberId");

-- CreateIndex
CREATE INDEX "TravelBooking_status_idx" ON "TravelBooking"("status");

-- AddForeignKey
ALTER TABLE "TravelMembership" ADD CONSTRAINT "TravelMembership_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "ReferralMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelBooking" ADD CONSTRAINT "TravelBooking_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "ReferralMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelBooking" ADD CONSTRAINT "TravelBooking_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "TravelItinerary"("id") ON DELETE SET NULL ON UPDATE CASCADE;

