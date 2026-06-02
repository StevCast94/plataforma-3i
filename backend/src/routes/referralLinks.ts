import { Router } from 'express';
import crypto from 'crypto';
import { prisma } from '../prisma';
import { recordClick } from '../services/referralTracking';
import { ATTRIBUTION_WINDOW_DAYS } from '../lib/referralRules';

export const referralLinkRoutes = Router();

const COOKIE = 'g3i_ref';

// POST /api/referral-links/click — registra click y setea cookie de atribución first-click
referralLinkRoutes.post('/click', async (req, res) => {
  try {
    const { code } = req.body ?? {};
    if (!code) {
      res.status(400).json({ error: 'code requerido' });
      return;
    }

    const ok = await recordClick(String(code));
    if (!ok) {
      res.status(404).json({ error: 'Enlace no encontrado' });
      return;
    }

    // First-click: solo seteamos la cookie si no existe una previa.
    const existing = req.cookies?.[COOKIE];
    if (!existing) {
      const cookieId = crypto.randomUUID();
      res.cookie(COOKIE, JSON.stringify({ code: String(code), cookieId }), {
        maxAge: ATTRIBUTION_WINDOW_DAYS * 24 * 60 * 60 * 1000,
        httpOnly: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
      res.json({ ok: true, attributed: String(code), cookieId });
      return;
    }

    res.json({ ok: true, attributed: JSON.parse(existing).code });
  } catch (err) {
    console.error('POST /api/referral-links/click', err);
    res.status(500).json({ error: 'Error al registrar click' });
  }
});

// GET /api/referral-links/:code — info pública del enlace
referralLinkRoutes.get('/:code', async (req, res) => {
  const link = await prisma.referralLink.findUnique({
    where: { code: req.params.code },
    select: {
      code: true,
      fullUrl: true,
      clicks: true,
      conversions: true,
      status: true,
      member: { select: { fullName: true } },
    },
  });
  if (!link) {
    res.status(404).json({ error: 'Enlace no encontrado' });
    return;
  }
  res.json({
    code: link.code,
    fullUrl: link.fullUrl,
    clicks: link.clicks,
    conversions: link.conversions,
    status: link.status,
    referrerFirstName: link.member.fullName.split(' ')[0],
  });
});
