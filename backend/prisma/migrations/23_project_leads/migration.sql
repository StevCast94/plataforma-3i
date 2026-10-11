CREATE TYPE "LeadSource" AS ENUM ('REFERRAL', 'PLATFORM', 'DEVELOPER');
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'VISIT', 'NEGOTIATION', 'WON', 'LOST');

CREATE TABLE "ProjectLead" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "lotCode" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "phoneDigits" TEXT NOT NULL,
    "email" TEXT,
    "message" TEXT,
    "source" "LeadSource" NOT NULL,
    "channel" TEXT NOT NULL,
    "referralCode" TEXT,
    "memberId" TEXT,
    "visitorId" TEXT,
    "lang" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProjectLead_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ProjectLead_projectId_phoneDigits_idx" ON "ProjectLead"("projectId", "phoneDigits");
CREATE INDEX "ProjectLead_projectId_createdAt_idx" ON "ProjectLead"("projectId", "createdAt");
ALTER TABLE "ProjectLead" ADD CONSTRAINT "ProjectLead_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ProjectEvent" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "lotCode" TEXT,
    "visitorId" TEXT,
    "refCode" TEXT,
    "lang" TEXT,
    "device" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ProjectEvent_projectId_createdAt_idx" ON "ProjectEvent"("projectId", "createdAt");
CREATE INDEX "ProjectEvent_projectId_type_idx" ON "ProjectEvent"("projectId", "type");
ALTER TABLE "ProjectEvent" ADD CONSTRAINT "ProjectEvent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
