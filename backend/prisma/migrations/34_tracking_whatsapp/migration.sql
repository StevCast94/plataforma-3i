-- Origen de campaña de cada contacto (utm_*, gclid, fbclid, ttclid) y WhatsApp por asesor.
ALTER TABLE "ProjectLead" ADD COLUMN "utm" JSONB;
ALTER TABLE "DeveloperUser" ADD COLUMN "whatsapp" TEXT;

-- Identificadores de medición (se completan en Admin → Configuración → tracking).
INSERT INTO "SiteContent" ("id", "section", "key", "value", "updatedAt") VALUES
  (gen_random_uuid(), 'tracking', 'ga4_id', '', NOW()),
  (gen_random_uuid(), 'tracking', 'google_ads_id', '', NOW()),
  (gen_random_uuid(), 'tracking', 'google_ads_lead_label', '', NOW()),
  (gen_random_uuid(), 'tracking', 'meta_pixel_id', '', NOW()),
  (gen_random_uuid(), 'tracking', 'tiktok_pixel_id', '', NOW()),
  (gen_random_uuid(), 'tracking', 'search_console_file', '', NOW())
ON CONFLICT ("section", "key") DO NOTHING;
