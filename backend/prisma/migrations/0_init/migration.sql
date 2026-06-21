-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('TRAVEL_MEMBERSHIP', 'FRACTIONAL_PROPERTY', 'TRADITIONAL_PROPERTY', 'LAND');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('PREMIERE', 'ELITE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "EliteBy" AS ENUM ('PURCHASE', 'REFERRALS');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('PENDING', 'CONFIRMED', 'LIQUIDATED', 'PAID', 'REVERSED');

-- CreateEnum
CREATE TYPE "TravelProductKind" AS ENUM ('HOTEL', 'FLIGHT', 'ACTIVITY', 'CAR', 'PACKAGE');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('QUOTED', 'PENDING_PAYMENT', 'PAID', 'CONFIRMED', 'CANCELLED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "MembershipSource" AS ENUM ('PURCHASE', 'REWARD', 'FRACTIONAL', 'STAFF');

-- CreateTable
CREATE TABLE "SiteContent" (
    "id" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactSubmission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT NOT NULL,
    "source" TEXT,
    "referralCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "coverImage" TEXT,
    "images" TEXT[],
    "features" JSONB,
    "priceFrom" DOUBLE PRECISION,
    "priceLabel" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ProductType" NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "promoPrice" DOUBLE PRECISION,
    "description" TEXT NOT NULL,
    "features" JSONB,
    "images" TEXT[],
    "projectId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductInquiry" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT,
    "referralCode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "docId" TEXT NOT NULL,
    "docType" TEXT NOT NULL DEFAULT 'cedula',
    "status" "MemberStatus" NOT NULL DEFAULT 'PREMIERE',
    "referralCode" TEXT NOT NULL,
    "referrerId" TEXT,
    "walletBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalReferrals" INTEGER NOT NULL DEFAULT 0,
    "lastReferralAt" TIMESTAMP(3),
    "inactiveSince" TIMESTAMP(3),
    "eliteSince" TIMESTAMP(3),
    "eliteBy" "EliteBy",
    "referralsCountToElite" INTEGER NOT NULL DEFAULT 0,
    "membershipAwarded" BOOLEAN NOT NULL DEFAULT false,
    "bankInfo" JSONB,
    "payoutMethod" TEXT,
    "payoutEmail" TEXT,
    "kycVerified" BOOLEAN NOT NULL DEFAULT false,
    "kycVerifiedAt" TIMESTAMP(3),
    "bio" TEXT,
    "avatarUrl" TEXT,
    "location" TEXT,
    "interests" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referredId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "attributionMethod" TEXT NOT NULL DEFAULT 'link',
    "cookieId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firstPurchaseAt" TIMESTAMP(3),

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralLink" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "fullUrl" TEXT NOT NULL,
    "shortUrl" TEXT,
    "qrCodeUrl" TEXT,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commission" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "referralId" TEXT,
    "purchaseId" TEXT,
    "productId" TEXT,
    "transactionId" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "amount" DOUBLE PRECISION NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'percentage',
    "status" "CommissionStatus" NOT NULL DEFAULT 'PENDING',
    "holdUntil" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Commission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" TEXT NOT NULL,
    "reference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffUser" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "referralCode" TEXT,
    "referrerId" TEXT,
    "notes" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "staffId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialPost" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "images" TEXT[],
    "linkUrl" TEXT,
    "linkPreview" JSONB,
    "groupId" TEXT,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialComment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialReaction" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "coverImage" TEXT,
    "privacy" TEXT NOT NULL DEFAULT 'public',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialGroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialEvent" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "coverImage" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialEventAttendee" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'going',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialEventAttendee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DirectMessage" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DirectMessage_pkey" PRIMARY KEY ("id")
);

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
CREATE UNIQUE INDEX "SiteContent_section_key_key" ON "SiteContent"("section", "key");

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralMember_userId_key" ON "ReferralMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralMember_email_key" ON "ReferralMember"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralMember_docId_key" ON "ReferralMember"("docId");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralMember_referralCode_key" ON "ReferralMember"("referralCode");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralLink_code_key" ON "ReferralLink"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StaffUser_username_key" ON "StaffUser"("username");

-- CreateIndex
CREATE INDEX "SocialPost_groupId_idx" ON "SocialPost"("groupId");

-- CreateIndex
CREATE INDEX "SocialPost_userId_idx" ON "SocialPost"("userId");

-- CreateIndex
CREATE INDEX "SocialPost_createdAt_idx" ON "SocialPost"("createdAt");

-- CreateIndex
CREATE INDEX "SocialComment_postId_idx" ON "SocialComment"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "SocialReaction_postId_userId_key" ON "SocialReaction"("postId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "SocialGroup_slug_key" ON "SocialGroup"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "SocialGroupMember_groupId_userId_key" ON "SocialGroupMember"("groupId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "SocialEventAttendee_eventId_userId_key" ON "SocialEventAttendee"("eventId", "userId");

-- CreateIndex
CREATE INDEX "DirectMessage_senderId_receiverId_idx" ON "DirectMessage"("senderId", "receiverId");

-- CreateIndex
CREATE INDEX "DirectMessage_receiverId_senderId_idx" ON "DirectMessage"("receiverId", "senderId");

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
ALTER TABLE "Product" ADD CONSTRAINT "Product_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductInquiry" ADD CONSTRAINT "ProductInquiry_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralMember" ADD CONSTRAINT "ReferralMember_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "ReferralMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "ReferralMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referredId_fkey" FOREIGN KEY ("referredId") REFERENCES "ReferralMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralLink" ADD CONSTRAINT "ReferralLink_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "ReferralMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "ReferralMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "Referral"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "ReferralMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "ReferralMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "ReferralMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "SocialGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialComment" ADD CONSTRAINT "SocialComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "SocialPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialComment" ADD CONSTRAINT "SocialComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "SocialComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialReaction" ADD CONSTRAINT "SocialReaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "SocialPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialGroupMember" ADD CONSTRAINT "SocialGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "SocialGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialEvent" ADD CONSTRAINT "SocialEvent_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "SocialGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialEventAttendee" ADD CONSTRAINT "SocialEventAttendee_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "SocialEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelMembership" ADD CONSTRAINT "TravelMembership_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "ReferralMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelBooking" ADD CONSTRAINT "TravelBooking_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "ReferralMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelBooking" ADD CONSTRAINT "TravelBooking_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "TravelItinerary"("id") ON DELETE SET NULL ON UPDATE CASCADE;

