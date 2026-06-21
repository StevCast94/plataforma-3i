-- AlterEnum
ALTER TYPE "MemberStatus" ADD VALUE 'PENDING';

-- AlterTable
ALTER TABLE "ReferralMember" ADD COLUMN     "claimed" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "referredByCode" TEXT,
ALTER COLUMN "passwordHash" DROP NOT NULL,
ALTER COLUMN "docId" DROP NOT NULL;

