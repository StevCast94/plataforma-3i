import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { contentRoutes } from './routes/content';
import { contactRoutes } from './routes/contact';
import { projectRoutes } from './routes/projects';
import { productRoutes } from './routes/products';
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
import { adminMemberRoutes } from './routes/adminMembers';
import { adminCommissionRoutes } from './routes/adminCommissions';
import { adminPurchaseRoutes } from './routes/adminPurchases';
import { adminReportRoutes } from './routes/adminReports';
import { adminSettingsRoutes } from './routes/adminSettings';

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
app.use('/api/content', contentRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/products', productRoutes);

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
app.use('/api/admin/members', adminMemberRoutes);
app.use('/api/admin/commissions', adminCommissionRoutes);
app.use('/api/admin/purchases', adminPurchaseRoutes);
app.use('/api/admin/report', adminReportRoutes);
app.use('/api/admin', adminSettingsRoutes);

// Cualquier /api/* no encontrada -> 404 JSON (no cae al SPA fallback)
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

// Servir el frontend estático (build de Vite commiteado en frontend/dist)
const frontendPath = path.join(__dirname, '../../frontend/dist');
const hasBuild = fs.existsSync(path.join(frontendPath, 'index.html'));

if (hasBuild) {
  app.use(express.static(frontendPath));

  // SPA fallback -> todas las rutas no-API devuelven index.html
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
} else {
  console.warn(
    '⚠️  frontend/dist no encontrado. Ejecuta "cd frontend && npm run build".',
  );
}

app.listen(PORT, () => {
  console.log(`🚀 Plataforma 3i corriendo en puerto ${PORT}`);
});
