import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAdmin, type AuthedRequest } from '../middleware/auth';
import type { DeveloperRequest } from '../middleware/authDeveloper';
import { sendPushToStaff, vapidPublicKey } from '../services/push';
import { logActivity } from '../services/crm';
import { contactToLead } from '../services/webInbox';
import { INTERNAL_DEV_ID, staffIdsForCrmUsers, syncStaffCrmUser } from '../services/internalTeam';
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

// Alcance: proyectos propios (developerId = null). El asesor (rol advisor) entra como
// vendedor y solo ve sus contactos; admin y superadmin ven todo.
adminCrmRoutes.use(async (req: AuthedRequest & DeveloperRequest, res, next) => {
  const staff = await prisma.staffUser.findUnique({ where: { id: req.staff!.staffId }, select: { role: true, crmUserId: true } });
  const crmUserId = staff?.crmUserId ?? (await syncStaffCrmUser(req.staff!.staffId));
  req.developerId = null as unknown as string;
  req.developerRole = staff?.role === 'advisor' ? 'SELLER' : 'OWNER';
  req.developerUserId = crmUserId ?? undefined;
  if (req.developerRole === 'SELLER' && !crmUserId) {
    res.status(403).json({ error: 'Tu usuario no tiene cuenta en el CRM' });
    return;
  }
  next();
});

// ---------- Consultas web: formularios que no entraron solos al CRM ----------
// GET /api/admin/crm/inbox
adminCrmRoutes.get('/inbox', async (req: AuthedRequest & DeveloperRequest, res) => {
  if (req.developerRole !== 'OWNER') {
    res.json([]);
    return;
  }
  const rows = await prisma.contactSubmission.findMany({
    where: { leadId: null, archivedAt: null },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json(rows);
});

// POST /api/admin/crm/inbox/:id {action: 'lead', projectId} | {action: 'archive'}
adminCrmRoutes.post('/inbox/:id', async (req: AuthedRequest & DeveloperRequest, res) => {
  if (req.developerRole !== 'OWNER') {
    res.status(403).json({ error: 'Solo un administrador puede gestionar las consultas web' });
    return;
  }
  if (req.body?.action === 'archive') {
    await prisma.contactSubmission.update({ where: { id: req.params.id }, data: { archivedAt: new Date() } });
    res.json({ ok: true });
    return;
  }
  const projectId = String(req.body?.projectId ?? '');
  const project = await prisma.project.findFirst({ where: { id: projectId, developerId: null }, select: { id: true } });
  if (!project) {
    res.status(400).json({ error: 'Elige un proyecto propio' });
    return;
  }
  const leadId = await contactToLead(req.params.id, { projectId: project.id });
  if (!leadId) {
    res.status(400).json({ error: 'La consulta no tiene un WhatsApp válido; respóndela por correo y archívala' });
    return;
  }
  res.json({ ok: true, leadId });
});

// GET /api/admin/crm/team — el equipo que recibe contactos (filtro y reasignación del CRM)
adminCrmRoutes.get('/team', async (_req, res) => {
  const users = await prisma.developerUser.findMany({
    where: { developerId: INTERNAL_DEV_ID },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true, email: true, name: true, role: true, active: true, lastLoginAt: true, whatsapp: true,
      _count: { select: { leads: { where: { status: { notIn: ['WON', 'LOST'] } } }, pushSubs: true } },
    },
  });
  res.json(users);
});

// POST /api/admin/crm/crm/leads/:id/assign {userId|null} — reasignar (admin/superadmin)
adminCrmRoutes.post('/crm/leads/:id/assign', async (req: AuthedRequest & DeveloperRequest, res) => {
  if (req.developerRole !== 'OWNER') {
    res.status(403).json({ error: 'Solo un administrador puede reasignar' });
    return;
  }
  const lead = await prisma.projectLead.findFirst({ where: { id: req.params.id, project: { developerId: null } } });
  const userId = req.body?.userId ? String(req.body.userId) : null;
  const user = userId ? await prisma.developerUser.findFirst({ where: { id: userId, developerId: INTERNAL_DEV_ID, active: true } }) : null;
  if (!lead || (userId && !user)) {
    res.status(404).json({ error: 'Contacto o asesor no encontrado' });
    return;
  }
  await prisma.projectLead.update({ where: { id: lead.id }, data: { assignedToId: userId } });
  await logActivity(lead.id, 'assign', req.staff!.username, user ? `Asignado a ${user.name ?? user.email}` : 'Sin asignar');
  if (user) await sendPushToStaff({ title: '📥 Te asignaron un contacto', body: lead.name, link: '/admin/crm' }, await staffIdsForCrmUsers([user.id]));
  res.json({ ok: true });
});
adminCrmRoutes.use(crmRoutes);
