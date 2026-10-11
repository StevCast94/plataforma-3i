ALTER TABLE "Project" ADD COLUMN "customDomain" TEXT, ADD COLUMN "mapPaidUntil" TIMESTAMP(3), ADD COLUMN "showcase" BOOLEAN NOT NULL DEFAULT true;
CREATE UNIQUE INDEX "Project_customDomain_key" ON "Project"("customDomain");
