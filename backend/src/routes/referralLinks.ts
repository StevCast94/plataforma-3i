import { Router } from 'express';
import { prisma } from '../prisma';

export const referralLinkRoutes = Router();

// NOTA: existió aquí un POST /click que seteaba la cookie `g3i_ref` en formato
// JSON ({code, cookieId}), en conflicto con el formato de texto plano que usa
// routes/referral.ts para la MISMA cookie. Nunca se llamó desde el frontend
// (código muerto), pero de haberse activado habría roto la atribución de
// comisiones. Se eliminó: routes/referral.ts es la única fuente de verdad
// para la cookie de atribución.

// GET /api/referral-links/:code — info pública del enlace (código o slug)
referralLinkRoutes.get('/:code', async (req, res) => {
  const link = await prisma.referralLink.findUnique({
    where: { code: req.params.code },
    select: {
      code: true,
      clicks: true,
      conversions: true,
      status: true,
      member: { select: { fullName: true, referralSlug: true } },
    },
  });
  if (!link) {
    res.status(404).json({ error: 'Enlace no encontrado' });
    return;
  }
  res.json({
    code: link.code,
    referralSlug: link.member.referralSlug,
    clicks: link.clicks,
    conversions: link.conversions,
    status: link.status,
    referrerFirstName: link.member.fullName.split(' ')[0],
  });
});
