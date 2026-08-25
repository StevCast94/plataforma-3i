-- Máquina de estados de verificación KYC + documentos (recursos autenticados
-- de Cloudinary, nunca URLs públicas).
CREATE TYPE "KycStatus" AS ENUM ('NOT_SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED');

ALTER TABLE "ReferralMember" ADD COLUMN "kycStatus" "KycStatus" NOT NULL DEFAULT 'NOT_SUBMITTED';
ALTER TABLE "ReferralMember" ADD COLUMN "kycSubmittedAt" TIMESTAMP(3);
ALTER TABLE "ReferralMember" ADD COLUMN "kycRejectReason" TEXT;
ALTER TABLE "ReferralMember" ADD COLUMN "kycDocFrontId" TEXT;
ALTER TABLE "ReferralMember" ADD COLUMN "kycDocBackId" TEXT;
ALTER TABLE "ReferralMember" ADD COLUMN "kycSelfieId" TEXT;

-- Backfill: quien ya estaba verificado antes de este cambio queda consistente
-- con el nuevo estado (nunca hubo documentos suyos que migrar, por eso los
-- campos de documento quedan null — se trató de verificaciones manuales).
UPDATE "ReferralMember" SET "kycStatus" = 'APPROVED' WHERE "kycVerified" = true;
