ALTER TABLE "ProjectLead" ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[], ADD COLUMN "budget" DOUBLE PRECISION, ADD COLUMN "lastContactAt" TIMESTAMP(3);

CREATE TABLE "LeadActivity" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "body" TEXT,
    "meta" JSONB,
    "actor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LeadActivity_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "LeadActivity_leadId_createdAt_idx" ON "LeadActivity"("leadId", "createdAt");
ALTER TABLE "LeadActivity" ADD CONSTRAINT "LeadActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "ProjectLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "LeadTask" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "doneAt" TIMESTAMP(3),
    "auto" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LeadTask_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "LeadTask_leadId_idx" ON "LeadTask"("leadId");
CREATE INDEX "LeadTask_dueAt_doneAt_idx" ON "LeadTask"("dueAt", "doneAt");
ALTER TABLE "LeadTask" ADD CONSTRAINT "LeadTask_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "ProjectLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "WhatsAppTemplate" (
    "id" TEXT NOT NULL,
    "developerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WhatsAppTemplate_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "WhatsAppTemplate_developerId_idx" ON "WhatsAppTemplate"("developerId");
ALTER TABLE "WhatsAppTemplate" ADD CONSTRAINT "WhatsAppTemplate_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "Developer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
