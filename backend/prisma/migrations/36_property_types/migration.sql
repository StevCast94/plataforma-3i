-- Fase 2: todo tipo de proyecto inmobiliario. Un «Lot» pasa a ser cualquier unidad del inventario.
ALTER TABLE "Project" ADD COLUMN "propertyTypes" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Lot" ADD COLUMN "unitType" TEXT NOT NULL DEFAULT 'lotes';
ALTER TABLE "Lot" ADD COLUMN "builtM2" DOUBLE PRECISION;
ALTER TABLE "Lot" ADD COLUMN "bedrooms" INTEGER;
ALTER TABLE "Lot" ADD COLUMN "bathrooms" DOUBLE PRECISION;
ALTER TABLE "Lot" ADD COLUMN "parking" INTEGER;
ALTER TABLE "Lot" ADD COLUMN "floor" TEXT;
ALTER TABLE "Lot" ALTER COLUMN "geometry" DROP NOT NULL;
ALTER TABLE "Lot" ALTER COLUMN "centroidLat" DROP NOT NULL;
ALTER TABLE "Lot" ALTER COLUMN "centroidLng" DROP NOT NULL;

-- Tipos de los proyectos existentes.
UPDATE "Project" SET "propertyTypes" = ARRAY['lotes'] WHERE EXISTS (SELECT 1 FROM "Lot" l WHERE l."projectId" = "Project"."id");
UPDATE "Project" SET "propertyTypes" = ARRAY['suites'] WHERE "slug" = 'ibiza-condohotel';
