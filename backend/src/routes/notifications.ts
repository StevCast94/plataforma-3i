import { Router } from 'express';
import { prisma } from '../prisma';
import { authMember, type MemberRequest } from '../middleware/authMember';

export const notificationRoutes = Router();

// GET /api/notifications — notificaciones del miembro
notificationRoutes.get('/', authMember, async (req: MemberRequest, res) => {
  const items = await prisma.notification.findMany({
    where: { memberId: req.memberId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  const unread = items.filter((n) => !n.read).length;
  res.json({ items, unread });
});

// PUT /api/notifications/:id/read — marcar como leída
notificationRoutes.put('/:id/read', authMember, async (req: MemberRequest, res) => {
  await prisma.notification.updateMany({
    where: { id: req.params.id, memberId: req.memberId },
    data: { read: true },
  });
  res.json({ ok: true });
});

// PUT /api/notifications/read-all — marcar todas como leídas
notificationRoutes.put('/read-all', authMember, async (req: MemberRequest, res) => {
  await prisma.notification.updateMany({
    where: { memberId: req.memberId, read: false },
    data: { read: true },
  });
  res.json({ ok: true });
});
