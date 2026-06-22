import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAdmin, type AuthedRequest } from '../middleware/auth';
import { audit } from '../services/audit';

// ============================================================
// LEADS (CRM básico) — solicitudes de información, visitas, meets y contactos.
// Unifica ProductInquiry (con intención: info/whatsapp/visit/meet/purchase)
// y ContactSubmission (formulario de contacto general) en una sola bandeja.
// ============================================================

export const adminLeadRoutes = Router();
adminLeadRoutes.use(requireAdmin);

const VALID_STATUS = ['pending', 'contacted', 'closed'];

// GET /api/admin/leads — bandeja unificada (filtros: ?intent= &status= &kind=)
adminLeadRoutes.get('/', async (req, res) => {
  try {
    const { intent, status, kind, advisor } = req.query as Record<string, string | undefined>;

    const wantInquiries = !kind || kind === 'product';
    const wantContacts = (!kind || kind === 'contact') && !advisor;

    const [inquiries, contacts] = await Promise.all([
      wantInquiries
        ? prisma.productInquiry.findMany({
            where: {
              ...(intent ? { intent } : {}),
              ...(status ? { status } : {}),
              ...(advisor ? { assignedToId: advisor === 'none' ? null : advisor } : {}),
            },
            orderBy: { createdAt: 'desc' },
            take: 300,
            include: {
              product: { select: { name: true, slug: true } },
              assignedTo: { select: { id: true, username: true } },
            },
          })
        : Promise.resolve([]),
      wantContacts && !intent
        ? prisma.contactSubmission.findMany({
            orderBy: { createdAt: 'desc' },
            take: 300,
          })
        : Promise.resolve([]),
    ]);

    const rows = [
      ...inquiries.map((i) => ({
        id: i.id,
        kind: 'product' as const,
        name: i.name,
        email: i.email,
        phone: i.phone,
        message: i.message,
        intent: i.intent ?? 'info',
        productName: i.product?.name ?? null,
        productSlug: i.product?.slug ?? null,
        source: null as string | null,
        referralCode: i.referralCode,
        status: i.status,
        assignedTo: i.assignedTo ?? null,
        createdAt: i.createdAt,
      })),
      ...contacts.map((c) => ({
        id: c.id,
        kind: 'contact' as const,
        name: c.name,
        email: c.email,
        phone: c.phone,
        message: c.message,
        intent: 'info',
        productName: null,
        productSlug: null,
        source: c.source,
        referralCode: c.referralCode,
        status: 'pending',
        assignedTo: null,
        createdAt: c.createdAt,
      })),
    ].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

    res.json(rows);
  } catch (err) {
    console.error('GET /api/admin/leads', err);
    res.status(500).json({ error: 'Error al listar leads' });
  }
});

// GET /api/admin/leads/stats — conteos rápidos para el dashboard
adminLeadRoutes.get('/stats', async (_req, res) => {
  try {
    const [byIntent, pending, contacts] = await Promise.all([
      prisma.productInquiry.groupBy({ by: ['intent'], _count: true }),
      prisma.productInquiry.count({ where: { status: 'pending' } }),
      prisma.contactSubmission.count(),
    ]);
    res.json({
      byIntent: Object.fromEntries(byIntent.map((g) => [g.intent ?? 'info', g._count])),
      pendingInquiries: pending,
      contactSubmissions: contacts,
    });
  } catch (err) {
    console.error('GET /api/admin/leads/stats', err);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// GET /api/admin/leads/advisors — asesores activos (para el selector de reasignación)
adminLeadRoutes.get('/advisors', async (_req, res) => {
  try {
    const advisors = await prisma.staffUser.findMany({
      where: { role: 'advisor', active: true },
      select: { id: true, username: true },
      orderBy: { username: 'asc' },
    });
    res.json(advisors);
  } catch (err) {
    console.error('GET /api/admin/leads/advisors', err);
    res.status(500).json({ error: 'Error al listar asesores' });
  }
});

// PATCH /api/admin/leads/:id — cambiar estado y/o reasignar asesor
// body: { status?: 'pending'|'contacted'|'closed', assignedToId?: string|null }
adminLeadRoutes.patch('/:id', async (req: AuthedRequest, res) => {
  try {
    const { status, assignedToId } = req.body ?? {};
    const data: { status?: string; assignedToId?: string | null } = {};

    if (status !== undefined) {
      if (!VALID_STATUS.includes(status)) {
        res.status(400).json({ error: 'Estado inválido' });
        return;
      }
      data.status = status;
    }
    if (assignedToId !== undefined) {
      data.assignedToId = assignedToId ? String(assignedToId) : null;
    }
    if (Object.keys(data).length === 0) {
      res.status(400).json({ error: 'Nada que actualizar' });
      return;
    }

    const updated = await prisma.productInquiry.update({
      where: { id: req.params.id },
      data,
      select: { id: true, status: true, assignedToId: true },
    });
    await audit(req.staff?.staffId, 'update', 'lead', req.params.id, data);
    res.json(updated);
  } catch (err) {
    console.error('PATCH /api/admin/leads/:id', err);
    res.status(400).json({ error: 'Error al actualizar el lead' });
  }
});
