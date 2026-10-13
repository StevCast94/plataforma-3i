-- Registro de la aceptación de términos, privacidad y reglamento al crear la cuenta.
ALTER TABLE "ReferralMember" ADD COLUMN "termsAcceptedAt" TIMESTAMP(3);
ALTER TABLE "ReferralMember" ADD COLUMN "termsVersion" TEXT;
