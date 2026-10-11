-- Equipo de Grupo 3i: datos del usuario y su cuenta del CRM (proyectos propios).
ALTER TABLE "StaffUser" ADD COLUMN "fullName" TEXT;
ALTER TABLE "StaffUser" ADD COLUMN "whatsapp" TEXT;
ALTER TABLE "StaffUser" ADD COLUMN "lastLoginAt" TIMESTAMP(3);
ALTER TABLE "StaffUser" ADD COLUMN "crmUserId" TEXT;
CREATE UNIQUE INDEX "StaffUser_crmUserId_key" ON "StaffUser"("crmUserId");
ALTER TABLE "StaffUser" ADD CONSTRAINT "StaffUser_crmUserId_fkey" FOREIGN KEY ("crmUserId") REFERENCES "DeveloperUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Formulario web → contacto del CRM (bandeja unificada).
ALTER TABLE "ContactSubmission" ADD COLUMN "leadId" TEXT;
ALTER TABLE "ContactSubmission" ADD COLUMN "archivedAt" TIMESTAMP(3);

-- Desarrolladora interna: agrupa las cuentas CRM del equipo de Grupo 3i para
-- repartir los contactos de los proyectos propios. No publica ni inicia sesión.
INSERT INTO "Developer" ("id", "name", "status", "onboardingPaid", "notes", "createdAt", "updatedAt")
VALUES ('grupo3i-interno', 'Grupo 3i (equipo interno)', 'ACTIVE', true, 'Interna: cuentas CRM del equipo de Grupo 3i. No borrar.', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;
