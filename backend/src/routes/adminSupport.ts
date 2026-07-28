import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAdmin, type AuthedRequest } from '../middleware/auth';
import { audit } from '../services/audit';

export const adminSupportRoutes = Router();
adminSupportRoutes.use(requireAdmin);

// GET /api/admin/support-requests — filtro por estado
// (memberId no tiene FK en Prisma — se resuelve el nombre a mano, mismo patrón
// que la Comunidad, para no forzar un vínculo si el socio fue borrado/reset).
adminSupportRoutes.get('/', async (req, res) => {
  const { status } = req.query;
  const requests = await prisma.supportRequest.findMany({
    where: status ? { status: String(status) } : {},
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  const memberIds = [...new Set(requests.map((r) => r.memberId).filter((id): id is string => !!id))];
  const members = memberIds.length
    ? await prisma.referralMember.findMany({
        where: { id: { in: memberIds } },
        select: { id: true, fullName: true, referralCode: true },
      })
    : [];
  const byId = new Map(members.map((m) => [m.id, m]));
  res.json(requests.map((r) => ({ ...r, member: r.memberId ? (byId.get(r.memberId) ?? null) : null })));
});

// PATCH /api/admin/support-requests/:id — marcar resuelto/pendiente
adminSupportRoutes.patch('/:id', async (req: AuthedRequest, res) => {
  try {
    const { status } = req.body ?? {};
    if (!['pending', 'resolved'].includes(status)) {
      res.status(400).json({ error: 'Estado inválido' });
      return;
    }
    const request = await prisma.supportRequest.update({
      where: { id: req.params.id },
      data: { status, resolvedAt: status === 'resolved' ? new Date() : null },
    });
    await audit(req.staff?.staffId, 'update', 'support_request', req.params.id, { status });
    res.json(request);
  } catch (err) {
    console.error('PATCH /api/admin/support-requests/:id', err);
    res.status(400).json({ error: 'Error al actualizar la solicitud' });
  }
});
