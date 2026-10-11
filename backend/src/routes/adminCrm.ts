import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAdmin, type AuthedRequest } from '../middleware/auth';
import type { DeveloperRequest } from '../middleware/authDeveloper';
import { vapidPublicKey } from '../services/push';
import { crmRoutes } from './crmShared';

// CRM de Grupo 3i para sus proyectos propios (Montañita View, Ibiza): las mismas
// rutas que el portal de desarrolladores, con alcance developerId = null.
export const adminCrmRoutes = Router();
adminCrmRoutes.use(requireAdmin);

// Avisos push del equipo: contactos nuevos y tareas por vencer de los proyectos propios.
adminCrmRoutes.get('/push/key', (_req, res) => {
  res.json({ key: vapidPublicKey() || null });
});

adminCrmRoutes.post('/push/subscribe', async (req: AuthedRequest, res) => {
  const { endpoint, keys } = req.body ?? {};
  if (typeof endpoint !== 'string' || !keys?.p256dh || !keys?.auth || !req.staff) {
    res.status(400).json({ error: 'Suscripción inválida' });
    return;
  }
  await prisma.staffPushSubscription.upsert({
    where: { endpoint },
    create: { endpoint, p256dh: keys.p256dh, auth: keys.auth, staffId: req.staff.staffId },
    update: { p256dh: keys.p256dh, auth: keys.auth, staffId: req.staff.staffId },
  });
  res.json({ ok: true });
});

adminCrmRoutes.use((req: DeveloperRequest, _res, next) => {
  req.developerId = null as unknown as string; // proyectos propios
  req.developerRole = 'OWNER';
  req.developerUserId = undefined;
  next();
});
adminCrmRoutes.use(crmRoutes);
