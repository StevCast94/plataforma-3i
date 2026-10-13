import { TRAVEL_ENABLED } from './lib/features';
import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { startScheduler } from './services/scheduler';
import { syncAllStaffCrmUsers } from './services/internalTeam';
import { backfillContactLeads } from './services/webInbox';
import { contentRoutes } from './routes/content';
import { contactRoutes } from './routes/contact';
import { serviceRoutes } from './routes/services';
import { adminServiceRoutes } from './routes/adminServices';
import { projectRoutes } from './routes/projects';
import { productRoutes } from './routes/products';
import { purchaseRoutes } from './routes/purchases';
import { memberRoutes } from './routes/members';
import { referralRoutes } from './routes/referrals';
import { referralLinkRoutes } from './routes/referralLinks';
import { commissionRoutes } from './routes/commissions';
import { payoutRoutes } from './routes/payouts';
import { notificationRoutes } from './routes/notifications';
import { adminAuthRoutes } from './routes/adminAuth';
import { adminStatsRoutes } from './routes/adminStats';
import { adminProductRoutes } from './routes/adminProducts';
import { adminProjectRoutes } from './routes/adminProjects';
import { adminLotRoutes } from './routes/adminLots';
import { adminPanoramaRoutes } from './routes/adminPanoramas';
import { adminDeveloperRoutes } from './routes/adminDevelopers';
import { adminCrmRoutes } from './routes/adminCrm';
import { developerRoutes } from './routes/developer';
import { eventRoutes } from './routes/events';
import { bosqueRoutes } from './routes/bosque';
import { adminBosqueRoutes } from './routes/adminBosque';
import { adminMemberRoutes } from './routes/adminMembers';
import { adminCommissionRoutes } from './routes/adminCommissions';
import { adminLeadRoutes } from './routes/adminLeads';
import { adminMarketingRoutes } from './routes/adminMarketing';
import { adminPayoutRoutes } from './routes/adminPayouts';
import { adminPurchaseRoutes } from './routes/adminPurchases';
import { adminReportRoutes } from './routes/adminReports';
import { adminSettingsRoutes } from './routes/adminSettings';
import { adminSupportRoutes } from './routes/adminSupport';
import { communityPostRoutes, communityCommentRoutes } from './routes/communityPosts';
import { communityGroupRoutes } from './routes/communityGroups';
import { communityEventRoutes } from './routes/communityEvents';
import { communityMemberRoutes } from './routes/communityMembers';
import { communityMessageRoutes } from './routes/communityMessages';
import { metricsRoutes } from './routes/metrics';
import { travelRoutes } from './routes/travel';
import { adminTravelRoutes } from './routes/adminTravel';
import { referralApiRoutes, referralRedirect } from './routes/referral';
import { sitemapHandler, searchConsoleFile } from './lib/sitemap';
import { landingOgHandler, lotOgHandler, pageOgHandler, PAGE_OG_PATHS, projectOgHandler } from './lib/ogProject';
import { lotOgImage } from './lib/lotOgImage';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json({ limit: '12mb' })); // 12mb para uploads base64 de imágenes
app.use(cookieParser());

// Health check (útil para Railway)
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// API routes
app.use('/api/metrics', metricsRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/products', productRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/bosque', bosqueRoutes);

// Fase 2 — Programa de referidos (oficina virtual)
app.use('/api/members', memberRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/referral-links', referralLinkRoutes);
app.use('/api/commissions', commissionRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/notifications', notificationRoutes);

// Fase 3 — Panel de administración (staff)
app.use('/api/admin', adminAuthRoutes);
app.use('/api/admin/stats', adminStatsRoutes);
app.use('/api/admin/products', adminProductRoutes);
app.use('/api/admin/projects', adminProjectRoutes);
app.use('/api/admin/lots', adminLotRoutes);
app.use('/api/admin/services', adminServiceRoutes);
app.use('/api/admin/panoramas', adminPanoramaRoutes);
app.use('/api/admin/developers', adminDeveloperRoutes);
app.use('/api/admin/crm', adminCrmRoutes);
app.use('/api/developer', developerRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/admin/bosque', adminBosqueRoutes);
app.use('/api/admin/members', adminMemberRoutes);
app.use('/api/admin/commissions', adminCommissionRoutes);
app.use('/api/admin/leads', adminLeadRoutes);
app.use('/api/admin/marketing', adminMarketingRoutes);
app.use('/api/admin/payouts', adminPayoutRoutes);
app.use('/api/admin/purchases', adminPurchaseRoutes);
app.use('/api/admin/report', adminReportRoutes);
app.use('/api/admin', adminSettingsRoutes);
app.use('/api/admin/support-requests', adminSupportRoutes);

// Fase 4 — Red social de la comunidad
app.use('/api/community/posts', communityPostRoutes);
app.use('/api/community/comments', communityCommentRoutes);
app.use('/api/community/groups', communityGroupRoutes);
app.use('/api/community/events', communityEventRoutes);
app.use('/api/community/members', communityMemberRoutes);
app.use('/api/community/messages', communityMessageRoutes);

// Fase 5 — Motor de Viajes (Club de Viajes 3i)
app.use('/api/travel', travelRoutes);
app.use('/api/admin/travel', adminTravelRoutes);

// Atribución de referidos (cookie persistente)
app.use('/api/referral', referralApiRoutes);

// Cualquier /api/* no encontrada -> 404 JSON (no cae al SPA fallback)
// Imagen de vista previa de la ficha de un lote (tarjeta de WhatsApp/Facebook).
app.get('/api/og/lot/:slug/:file', async (req, res) => {
  try {
    const code = decodeURIComponent(String(req.params.file)).replace(/.jpg$/i, '').toUpperCase();
    const img = await lotOgImage(String(req.params.slug), code);
    if (!img) {
      res.status(404).end();
      return;
    }
    res.set('Cache-Control', 'public, max-age=86400').type('image/jpeg').send(img);
  } catch (err) {
    console.error('GET /api/og/lot', err);
    res.status(500).end();
  }
});

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

// SEO: una sola versión de cada página. www → dominio principal y sin barra final
// (301), y etiqueta canónica en el HTML que leen los buscadores (no ejecutan JS).
const CANONICAL_ORIGIN = 'https://grupo3i.com';
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  const host = String(req.headers.host ?? '').toLowerCase();
  if (host === 'www.grupo3i.com') {
    res.redirect(301, CANONICAL_ORIGIN + req.originalUrl);
    return;
  }
  if (host !== 'grupo3i.com' || req.path.startsWith('/api') || /\.[a-z0-9]+$/i.test(req.path)) return next();
  if (req.path.length > 1 && req.path.endsWith('/')) {
    const q = req.originalUrl.slice(req.path.length);
    res.redirect(301, req.path.replace(/\/+$/, '') + q);
    return;
  }
  const tag = `<link rel="canonical" href="${CANONICAL_ORIGIN}${req.path}" data-ssr="1" />`;
  const inject = (html: string) => (html.includes('rel="canonical"') ? html : html.replace('</head>', `  ${tag}\n  </head>`));
  const send = res.send.bind(res);
  res.send = (body?: unknown) => send(typeof body === 'string' && body.includes('</head>') ? inject(body) : body);
  const sendFile = res.sendFile.bind(res) as (p: string, ...rest: unknown[]) => void;
  (res as unknown as { sendFile: (p: string, ...rest: unknown[]) => void }).sendFile = (p: string, ...rest: unknown[]) => {
    if (p.endsWith('index.html')) {
      res.type('html');
      send(inject(fs.readFileSync(p, 'utf8')));
      return;
    }
    sendFile(p, ...rest);
  };
  next();
});

// Enlaces de referido: /r/CÓDIGO?to=/tienda/slug → cookie + click + redirect al SPA
app.get('/r/:code', referralRedirect);

// SEO: mapa del sitio y verificación de Google Search Console.
app.get('/sitemap.xml', sitemapHandler);
app.get(/^\/google[a-z0-9]+\.html$/, (req, res, next) => {
  req.params.file = req.path.slice(1);
  searchConsoleFile(req, res, next);
});

// Servir el frontend estático (build de Vite commiteado en frontend/dist)
const frontendPath = path.join(__dirname, '../../frontend/dist');
const hasBuild = fs.existsSync(path.join(frontendPath, 'index.html'));

if (hasBuild) {
  // index: false → la portada pasa por el manejador de tarjetas sociales (ver PAGE_OG).
  app.use(express.static(frontendPath, { index: false }));

  // Un archivo de una versión anterior (pestaña abierta antes de publicar) debe dar 404,
  // no el index.html: si no, el navegador lo intenta ejecutar y la pantalla queda en blanco.
  app.use('/assets', (_req, res) => {
    res.status(404).type('text/plain').send('Not found');
  });

  // Tarjeta social por proyecto: WhatsApp y Facebook no ejecutan JS, así que las
  // meta tags se escriben en el HTML antes de enviarlo (ver lib/ogProject.ts).
  app.get(['/proyectos/:slug', '/en/proyectos/:slug'], projectOgHandler(frontendPath));
  app.get(['/l/:slug', '/en/l/:slug'], landingOgHandler(frontendPath));
  // Antes la ficha vivía en /solar/: los enlaces ya compartidos redirigen para siempre a /lote/.
  // Club de Viajes oculto (lib/features.ts): los enlaces viejos llevan a Refiere y gana.
  if (!TRAVEL_ENABLED) {
    app.get(['/club', '/club/*', '/en/club', '/en/club/*', '/tienda/membresia-viajes-club-3i', '/en/tienda/membresia-viajes-club-3i'], (req, res) => {
      res.redirect(301, req.path.startsWith('/en/') ? '/en/oficina' : '/oficina');
    });
  }
  app.get(['/proyectos/:slug/solar/:code', '/en/proyectos/:slug/solar/:code'], (req, res) => {
    res.redirect(301, req.originalUrl.replace('/solar/', '/lote/'));
  });
  app.get(['/proyectos/:slug/lote/:code', '/en/proyectos/:slug/lote/:code'], lotOgHandler(frontendPath));
  app.get(PAGE_OG_PATHS, pageOgHandler(frontendPath));

  // SPA fallback -> todas las rutas no-API devuelven index.html
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
} else {
  console.warn(
    '⚠️  frontend/dist no encontrado. Ejecuta "cd frontend && npm run build".',
  );
}

// Equipo interno en el CRM y bandeja única (idempotentes).
syncAllStaffCrmUsers()
  .then(backfillContactLeads)
  .catch((e) => console.error('[crm] arranque', e));

app.listen(PORT, () => {
  console.log(`🚀 Plataforma 3i corriendo en puerto ${PORT}`);
  startScheduler();
});
