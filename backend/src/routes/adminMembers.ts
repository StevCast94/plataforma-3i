import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAdmin, type AuthedRequest } from '../middleware/auth';
import { audit } from '../services/audit';
import { notify } from '../services/notifications';
import { upgradeToElite } from '../services/tierService';

export const adminMemberRoutes = Router();
adminMemberRoutes.use(requireAdmin);

const listSelect = {
  id: true,
  fullName: true,
  email: true,
  status: true,
  kycVerified: true,
  totalReferrals: true,
  totalEarned: true,
  createdAt: true,
} as const;

// GET /api/admin/members — filtros, búsqueda, paginación
adminMemberRoutes.get('/', async (req, res) => {
  const { status, kyc, q } = req.query;
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Number(req.query.pageSize) || 25);

  const where = {
    ...(status ? { status: status as never } : {}),
    ...(kyc === 'true' ? { kycVerified: true } : kyc === 'false' ? { kycVerified: false } : {}),
    ...(q
      ? {
          OR: [
            { fullName: { contains: String(q), mode: 'insensitive' as const } },
            { email: { contains: String(q), mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.referralMember.findMany({
      where,
      select: listSelect,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.referralMember.count({ where }),
  ]);

  res.json({ items, total, page, pageSize });
});

// GET /api/admin/members/:id — detalle
adminMemberRoutes.get('/:id', async (req, res) => {
  const member = await prisma.referralMember.findUnique({
    where: { id: req.params.id },
    include: {
      sentReferrals: { include: { referred: { select: { fullName: true, status: true } } } },
      commissions: { orderBy: { createdAt: 'desc' }, take: 20 },
      payouts: { orderBy: { createdAt: 'desc' }, take: 20 },
      travelMemberships: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!member) {
    res.status(404).json({ error: 'Miembro no encontrado' });
    return;
  }
  const now = new Date();
  const travelAccess = member.travelMemberships.some(
    (m) => m.active && (!m.expiresAt || m.expiresAt > now),
  );
  const { passwordHash: _ph, ...safe } = member;
  res.json({ ...safe, travelAccess });
});

// PUT /api/admin/members/:id/kyc — aprobar/rechazar
adminMemberRoutes.put('/:id/kyc', async (req: AuthedRequest, res) => {
  try {
    const { approve, reason } = req.body ?? {};
    const member = await prisma.referralMember.update({
      where: { id: req.params.id },
      data: {
        kycVerified: !!approve,
        kycVerifiedAt: approve ? new Date() : null,
      },
      select: { id: true, kycVerified: true },
    });
    await audit(req.staff?.staffId, approve ? 'confirm' : 'reject', 'member', req.params.id, {
      kyc: !!approve,
      reason,
    });
    await notify(
      req.params.id,
      'new_referral',
      approve ? 'KYC aprobado ✅' : 'KYC rechazado',
      approve
        ? 'Tu identidad fue verificada. Ya puedes operar con normalidad.'
        : `Tu verificación fue rechazada. ${reason ?? ''}`.trim(),
    );
    res.json(member);
  } catch (err) {
    console.error('PUT /api/admin/members/:id/kyc', err);
    res.status(400).json({ error: 'Error al actualizar KYC' });
  }
});

// PUT /api/admin/members/:id/status — suspender/reactivar
adminMemberRoutes.put('/:id/status', async (req: AuthedRequest, res) => {
  try {
    const { status } = req.body ?? {};
    if (!['PREMIERE', 'ELITE', 'SUSPENDED'].includes(status)) {
      res.status(400).json({ error: 'Estado inválido' });
      return;
    }
    const member = await prisma.referralMember.update({
      where: { id: req.params.id },
      data: { status },
      select: { id: true, status: true },
    });
    await audit(req.staff?.staffId, 'update', 'member', req.params.id, { status });
    res.json(member);
  } catch (err) {
    console.error('PUT /api/admin/members/:id/status', err);
    res.status(400).json({ error: 'Error al cambiar estado' });
  }
});

// ============================================================
// FASE 5 — Membresía del Club de Viajes (otorgable como premio/incentivo).
// ============================================================

const TRAVEL_SOURCES = ['PURCHASE', 'REWARD', 'FRACTIONAL', 'STAFF'] as const;

// POST /api/admin/members/:id/travel-membership — otorgar acceso al club de viajes.
// Por defecto source=REWARD (premio, gratis, sin comisión). Deja una sola
// membresía activa (desactiva las previas) y notifica al socio.
adminMemberRoutes.post('/:id/travel-membership', async (req: AuthedRequest, res) => {
  try {
    const { source, tier, note, expiresAt } = req.body ?? {};
    const src = TRAVEL_SOURCES.includes(source) ? source : 'REWARD';
    const member = await prisma.referralMember.findUnique({
      where: { id: req.params.id },
      select: { id: true },
    });
    if (!member) {
      res.status(404).json({ error: 'Miembro no encontrado' });
      return;
    }

    const membership = await prisma.$transaction(async (tx) => {
      // Regalar/otorgar membresía sube al socio a ELITE (lo ya ganado queda tal cual).
      await upgradeToElite(tx, member.id, 'membresía de viajes otorgada');
      await tx.travelMembership.updateMany({
        where: { memberId: member.id, active: true },
        data: { active: false },
      });
      return tx.travelMembership.create({
        data: {
          memberId: member.id,
          source: src,
          tier: tier ? String(tier) : 'standard',
          note: note ? String(note) : null,
          grantedBy: req.staff?.staffId ?? null,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        },
      });
    });

    await audit(req.staff?.staffId, 'create', 'travel_membership', member.id, { source: src, tier });
    await notify(
      member.id,
      'new_referral',
      '¡Bienvenido al Club de Viajes 3i! ✈️',
      'Se activó tu membresía del club de viajes. Ya puedes ver precios de socio al buscar hoteles.',
    );
    res.status(201).json(membership);
  } catch (err) {
    console.error('POST /api/admin/members/:id/travel-membership', err);
    res.status(400).json({ error: 'Error al otorgar la membresía de viajes' });
  }
});

// DELETE /api/admin/members/:id/travel-membership — revocar acceso (desactiva todas).
adminMemberRoutes.delete('/:id/travel-membership', async (req: AuthedRequest, res) => {
  try {
    const result = await prisma.travelMembership.updateMany({
      where: { memberId: req.params.id, active: true },
      data: { active: false },
    });
    await audit(req.staff?.staffId, 'delete', 'travel_membership', req.params.id, {
      revoked: result.count,
    });
    res.json({ ok: true, revoked: result.count });
  } catch (err) {
    console.error('DELETE /api/admin/members/:id/travel-membership', err);
    res.status(400).json({ error: 'Error al revocar la membresía de viajes' });
  }
});
