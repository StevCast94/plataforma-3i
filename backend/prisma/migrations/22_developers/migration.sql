CREATE TYPE "PublishStatus" AS ENUM ('DRAFT', 'REVIEW', 'PUBLISHED', 'PAUSED');
CREATE TYPE "DeveloperStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');

CREATE TABLE "Developer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "ruc" TEXT,
    "contactName" TEXT,
    "email" TEXT,
    "whatsapp" TEXT,
    "status" "DeveloperStatus" NOT NULL DEFAULT 'PENDING',
    "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.08,
    "ownLeadRate" DOUBLE PRECISION NOT NULL DEFAULT 0.02,
    "onboardingFee" DOUBLE PRECISION NOT NULL DEFAULT 300,
    "onboardingPaid" BOOLEAN NOT NULL DEFAULT false,
    "featuredUntil" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Developer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DeveloperUser" (
    "id" TEXT NOT NULL,
    "developerId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeveloperUser_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DeveloperUser_email_key" ON "DeveloperUser"("email");
ALTER TABLE "DeveloperUser" ADD CONSTRAINT "DeveloperUser_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "Developer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Project" ADD COLUMN "developerId" TEXT,
ADD COLUMN "publishStatus" "PublishStatus" NOT NULL DEFAULT 'PUBLISHED',
ADD COLUMN "reviewNote" TEXT,
ADD COLUMN "commissionRate" DOUBLE PRECISION;
ALTER TABLE "Project" ADD CONSTRAINT "Project_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "Developer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Project_developerId_idx" ON "Project"("developerId");
