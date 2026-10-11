ALTER TABLE "WhatsAppTemplate" ALTER COLUMN "developerId" DROP NOT NULL;
ALTER TABLE "ProjectLead" ADD COLUMN "lostReason" TEXT;
ALTER TABLE "Project" ADD COLUMN "captureLeads" BOOLEAN NOT NULL DEFAULT false;
