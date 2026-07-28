import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAdmin, requireSuperadmin, type AuthedRequest } from '../middleware/auth';
import { audit } from '../services/audit';
import { notify } from '../services/notifications';
import { upgradeToElite } from '../services/tierService';
import { deleteMemberCompletely } from '../services/memberDeletion';
import { resolveReferrer } from '../services/referralTracking';

export const adminMemberRoutes = Router();
adminMemberRoutes.use(requireAdmin);

const listSelect = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  referralCode: true,
  status: true,
  kycVerified: true,
  totalReferrals: true,
  totalEarned: true,
  createdAt: true,
  referrer: { select: { fullName: true, referralCode: true } },
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

// PUT /api/admin/members/:id/referrer — reasignar el referidor (upline) de un socio.
// body: { referralCode: string | null }  (null = dejarlo sin referidor)
// Reconstruye las filas Referral de nivel 1 y 2 del socio. NO recalcula comisiones
// ya generadas (para eso, editar la compra correspondiente y regenerar).
adminMemberRoutes.put('/:id/referrer', requireSuperadmin, async (req: AuthedRequest, res) => {
  try {
    const { referralCode } = req.body ?? {};
    const memberId = req.params.id;

    const member = await prisma.referralMember.findUnique({
      where: { id: memberId },
      select: { id: true, fullName: true, referrerId: true },
    });
    if (!member) {
      res.status(404).json({ error: 'Miembro no encontrado' });
      return;
    }

    let newReferrer: { id: string; referrerId: string | null } | null = null;
    if (referralCode) {
      const found = await resolveReferrer(String(referralCode).trim());
      if (!found) {
        res.status(404).json({ error: 'Código de referido no encontrado' });
        return;
      }
      if (found.id === memberId) {
        res.status(400).json({ error: 'Un socio no puede ser su propio referidor' });
        return;
      }
      // Evitar ciclos: el nuevo referidor no puede estar debajo de este socio.
      let cursor: string | null = found.referrerId;
      for (let i = 0; i < 50 && cursor; i++) {
        if (cursor === memberId) {
          res.status(400).json({ error: 'Esa asignación crearía un ciclo en la red' });
          return;
        }
        const up: { referrerId: string | null } | null = await prisma.referralMember.findUnique({
          where: { id: cursor },
          select: { referrerId: true },
        });
        cursor = up?.referrerId ?? null;
      }
      newReferrer = found;
    }

    await prisma.$transaction(async (tx) => {
      // Quitar del contador al referidor anterior.
      if (member.referrerId) {
        await tx.referralMember.update({
          where: { id: member.referrerId },
          data: { totalReferrals: { decrement: 1 } },
        });
      }

      // Borrar las filas Referral donde este socio es el REFERIDO (niveles 1 y 2).
      // Las comisiones vinculadas quedan con referralId null (no se borran).
      const old = await tx.referral.findMany({
        where: { referredId: memberId },
        select: { id: true },
      });
      if (old.length > 0) {
        const ids = old.map((r) => r.id);
        await tx.commission.updateMany({
          where: { referralId: { in: ids } },
          data: { referralId: null },
        });
        await tx.referral.deleteMany({ where: { id: { in: ids } } });
      }

      await tx.referralMember.update({
        where: { id: memberId },
        data: { referrerId: newReferrer?.id ?? null },
      });

      if (newReferrer) {
        await tx.referral.create({
          data: {
            referrerId: newReferrer.id,
            referredId: memberId,
            level: 1,
            attributionMethod: 'manual',
            status: 'active',
          },
        });
        if (newReferrer.referrerId) {
          await tx.referral.create({
            data: {
              referrerId: newReferrer.referrerId,
              referredId: memberId,
              level: 2,
              attributionMethod: 'manual',
              status: 'active',
            },
          });
        }
        await tx.referralMember.update({
          where: { id: newReferrer.id },
          data: {
            totalReferrals: { increment: 1 },
            lastReferralAt: new Date(),
            inactiveSince: null,
          },
        });
      }
    });

    await audit(req.staff?.staffId, 'update', 'member', memberId, {
      action: 'reassign_referrer',
      from: member.referrerId,
      to: newReferrer?.id ?? null,
      referralCode: referralCode ?? null,
    });

    const updated = await prisma.referralMember.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        referrerId: true,
        referrer: { select: { fullName: true, referralCode: true } },
      },
    });
    res.json(updated);
  } catch (err) {
    console.error('PUT /api/admin/members/:id/referrer', err);
    res.status(400).json({ error: (err as Error).message || 'Error al reasignar el referidor' });
  }
});

// DELETE /api/admin/members/:id — eliminar COMPLETAMENTE (solo superadmin).
// Uso: corregir un registro mal hecho en pruebas, para que la persona pueda
// volver a registrarse desde el link de su referidor correcto. Bloqueado si
// tiene comisiones ya pagadas/liquidadas (usar Suspender en ese caso).
adminMemberRoutes.delete('/:id', requireSuperadmin, async (req: AuthedRequest, res) => {
  try {
    const member = await prisma.referralMember.findUnique({
      where: { id: req.params.id },
      select: { fullName: true, email: true },
    });
    if (!member) {
      res.status(404).json({ error: 'Miembro no encontrado' });
      return;
    }
    const result = await deleteMemberCompletely(req.params.id);
    if (!result.deleted) {
      res.status(409).json({ error: result.reason });
      return;
    }
    await audit(req.staff?.staffId, 'delete', 'member', req.params.id, {
      fullName: member.fullName,
      email: member.email,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/admin/members/:id', err);
    res.status(400).json({ error: 'Error al eliminar el miembro' });
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
