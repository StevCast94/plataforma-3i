-- CreateTable
CREATE TABLE "Panorama" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "tiles" JSONB NOT NULL,
    "northYaw" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "altitude" DOUBLE PRECISION,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Panorama_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Panorama_projectId_idx" ON "Panorama"("projectId");
ALTER TABLE "Panorama" ADD CONSTRAINT "Panorama_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
