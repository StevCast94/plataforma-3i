ALTER TABLE "DeveloperUser" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'OWNER';
ALTER TABLE "ProjectLead" ADD COLUMN "assignedToId" TEXT;
ALTER TABLE "ProjectLead" ADD CONSTRAINT "ProjectLead_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "DeveloperUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "ProjectLead_assignedToId_idx" ON "ProjectLead"("assignedToId");
ALTER TABLE "LeadTask" ADD COLUMN "notifiedAt" TIMESTAMP(3);

CREATE TABLE "DeveloperPushSubscription" (
    "id" TEXT NOT NULL,
    "developerUserId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeveloperPushSubscription_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DeveloperPushSubscription_endpoint_key" ON "DeveloperPushSubscription"("endpoint");
CREATE INDEX "DeveloperPushSubscription_developerUserId_idx" ON "DeveloperPushSubscription"("developerUserId");
ALTER TABLE "DeveloperPushSubscription" ADD CONSTRAINT "DeveloperPushSubscription_developerUserId_fkey" FOREIGN KEY ("developerUserId") REFERENCES "DeveloperUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
