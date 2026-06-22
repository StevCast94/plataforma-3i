import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAdmin, type AuthedRequest } from '../middleware/auth';
import { audit } from '../services/audit';
import { notify } from '../services/notifications';

// ============================================================
// GESTIÓN ADMIN DE RETIROS (PAYOUTS)
// Cierra el ciclo del dinero: el socio solicita (POST /payouts/request,
// que ya descuenta del wallet), y aquí el admin lo procesa.
// Estados: pending → processing → paid | failed.
// failed devuelve el monto al wallet del socio.
// ============================================================

export const adminPayoutRoutes = Router();
adminPayoutRoutes.use(requireAdmin);

// GET /api/admin/payouts?status=
adminPayoutRoutes.get('/', async (req, res) => {
  try {
    const { status } = req.query as Record<string, string | undefined>;
    const payouts = await prisma.payout.findMany({
      where: { ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 300,
      include: {
        member: { select: { fullName: true, email: true, payoutMethod: true, payoutEmail: true } },
      },
    });
    res.json(payouts);
  } catch (err) {
    console.error('GET /api/admin/payouts', err);
    res.status(500).json({ error: 'Error al listar retiros' });
  }
});

// PATCH /api/admin/payouts/:id — cambiar estado
// body: { status: 'processing'|'paid'|'failed', reference?: string }
adminPayoutRoutes.patch('/:id', async (req: AuthedRequest, res) => {
  try {
    const { status, reference } = req.body ?? {};
    if (!['processing', 'paid', 'failed'].includes(status)) {
      res.status(400).json({ error: 'Estado inválido' });
      return;
    }

    const payout = await prisma.payout.findUnique({ where: { id: req.params.id } });
    if (!payout) {
      res.status(404).json({ error: 'Retiro no encontrado' });
      return;
    }
    if (payout.status === 'paid') {
      res.status(400).json({ error: 'El retiro ya fue pagado' });
      return;
    }
    if (payout.status === 'failed') {
      res.status(400).json({ error: 'El retiro ya fue marcado como fallido' });
      return;
    }

    const updated = await prisma.$transaction(async (tx) => {
      // failed → devolver el monto al wallet (se había descontado al solicitar).
      if (status === 'failed') {
        await tx.referralMember.update({
          where: { id: payout.memberId },
          data: { walletBalance: { increment: payout.amount } },
        });
      }
      return tx.payout.update({
        where: { id: payout.id },
        data: {
          status,
          ...(reference ? { reference: String(reference) } : {}),
          ...(status === 'paid' ? { paidAt: new Date() } : {}),
        },
      });
    });

    await audit(req.staff?.staffId, 'update', 'payout', payout.id, { status, reference });

    const messages: Record<string, { title: string; body: string }> = {
      processing: { title: 'Retiro en proceso ⏳', body: `Tu retiro de $${payout.amount.toFixed(2)} está siendo procesado.` },
      paid: { title: 'Retiro pagado ✅', body: `Pagamos tu retiro de $${payout.amount.toFixed(2)}.${reference ? ` Ref: ${reference}` : ''}` },
      failed: { title: 'Retiro fallido', body: `Tu retiro de $${payout.amount.toFixed(2)} no pudo procesarse. El monto fue devuelto a tu saldo.` },
    };
    await notify(payout.memberId, 'payout_processed', messages[status].title, messages[status].body);

    res.json(updated);
  } catch (err) {
    console.error('PATCH /api/admin/payouts/:id', err);
    res.status(400).json({ error: 'Error al actualizar el retiro' });
  }
});
