-- Fase 3: plan de pagos por proyecto y tipologías de unidades.
ALTER TABLE "Project" ADD COLUMN "paymentPlan" JSONB;
ALTER TABLE "Lot" ADD COLUMN "typology" TEXT;

-- Montañita View conserva su plan: 30 % de entrada y 24 cuotas sin intereses.
UPDATE "Project" SET "paymentPlan" = '{"downPct":30,"installments":24,"interestFree":true}' WHERE "slug" = 'montanita-view';
