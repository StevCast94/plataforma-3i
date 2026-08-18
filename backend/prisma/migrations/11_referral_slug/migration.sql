-- AlterTable
-- La tabla ReferralMember se vació en un reseteo previo al lanzamiento, así
-- que agregar una columna única NOT NULL es segura sin backfill.
ALTER TABLE "ReferralMember" ADD COLUMN "referralSlug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ReferralMember_referralSlug_key" ON "ReferralMember"("referralSlug");
