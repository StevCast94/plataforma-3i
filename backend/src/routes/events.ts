import { Router } from 'express';
import crypto from 'crypto';
import { prisma } from '../prisma';
import { ensureProvisionalMember } from '../services/preRegister';
import { publicBaseUrl } from '../lib/publicUrl';
import { requireAdmin } from '../middleware/auth';

// ============================================================
// ACTIVACIÓN EN EVENTOS — "Comparte y Grupo 3i te invita un trago"
// El invitado escanea el QR, deja nombre y WhatsApp y queda como socio
// pre-registrado con su enlace de referidor activo. Por cada red donde
// comparte (estado de WhatsApp, historia de Instagram, Facebook) recibe una
// bebida, con un máximo de 2. El bartender canjea desde el teléfono del invitado.
// ============================================================

export const EVENTS: Record<string, { title: string; place: string; endsAt: string }> = {
  'halloween-cubata': {
    title: 'Halloween · Cubata',
    place: 'Lobby de Montañita View',
    endsAt: '2026-10-11T12:00:00Z', // domingo 7:00 Ecuador
  },
};
export const CURRENT_EVENT = 'halloween-cubata';
const CHANNELS = ['whatsapp', 'instagram', 'facebook'] as const;
const MAX_DRINKS = 2;
/** Dominio de los correos provisionales de invitados sin email (se reemplaza al activar la cuenta). */
export const GUEST_EMAIL_DOMAIN = 'invitado.grupo3i.com';

const digits = (s: string) => s.replace(/\D/g, '');

export const eventRoutes = Router();

async function guestBySecret(secret: unknown) {
  if (typeof secret !== 'string' || secret.length < 20) return null;
  return prisma.eventGuest.findUnique({
    where: { secret },
    include: { member: { select: { fullName: true, referralSlug: true } }, drinks: { orderBy: { createdAt: 'asc' } } },
  });
}

function view(g: NonNullable<Awaited<ReturnType<typeof guestBySecret>>>) {
  return {
    name: g.member.fullName,
    firstName: g.member.fullName.split(' ')[0],
    link: `${publicBaseUrl()}/r/${g.member.referralSlug}?c=montanita`,
    drinks: g.drinks.map((d) => ({ id: d.id, channel: d.channel, code: d.code, redeemedAt: d.redeemedAt })),
    maxDrinks: MAX_DRINKS,
  };
}

// GET /api/events/current — datos del evento en curso
eventRoutes.get('/current', (_req, res) => {
  const ev = EVENTS[CURRENT_EVENT];
  res.json({ id: CURRENT_EVENT, ...ev, active: Date.now() < Date.parse(ev.endsAt) });
});

// POST /api/events/:event/join { name, phone, consent } — crea o recupera al invitado
eventRoutes.post('/:event/join', async (req, res) => {
  try {
    const ev = EVENTS[req.params.event];
    if (!ev) {
      res.status(404).json({ error: 'Evento no encontrado' });
      return;
    }
    const name = String(req.body?.name ?? '').trim();
    const phone = String(req.body?.phone ?? '').trim();
    if (name.length < 2 || digits(phone).length < 9 || !req.body?.consent) {
      res.status(400).json({ error: 'Escribe tu nombre y tu WhatsApp, y acepta el uso de tus datos.' });
      return;
    }
    // Un socio por número de WhatsApp: si ya existe (socio o invitado), se reutiliza.
    const all = await prisma.referralMember.findMany({ where: { phone: { not: null } }, select: { id: true, phone: true } });
    const found = all.find((m) => digits(m.phone ?? '') === digits(phone));
    const memberId =
      found?.id ??
      (
        await ensureProvisionalMember({
          fullName: name,
          email: `wa${digits(phone)}@${GUEST_EMAIL_DOMAIN}`,
          phone,
        })
      ).memberId;
    let guest = await prisma.eventGuest.findUnique({ where: { event_memberId: { event: req.params.event, memberId } } });
    if (!guest)
      guest = await prisma.eventGuest.create({
        data: { event: req.params.event, memberId, secret: crypto.randomBytes(24).toString('hex') },
      });
    const full = await guestBySecret(guest.secret);
    res.json({ secret: guest.secret, ...view(full!) });
  } catch (err) {
    console.error('POST /api/events/join', err);
    res.status(500).json({ error: 'No pudimos registrarte. Inténtalo de nuevo.' });
  }
});

// GET /api/events/me?secret= — estado del invitado (al volver a abrir la página)
eventRoutes.get('/me', async (req, res) => {
  const g = await guestBySecret(req.query.secret);
  if (!g) {
    res.status(404).json({ error: 'No encontrado' });
    return;
  }
  res.json(view(g));
});

// POST /api/events/drink { secret, channel } — compartió en una red: gana su bebida
eventRoutes.post('/drink', async (req, res) => {
  const g = await guestBySecret(req.body?.secret);
  const channel = String(req.body?.channel ?? '');
  if (!g || !(CHANNELS as readonly string[]).includes(channel)) {
    res.status(400).json({ error: 'Solicitud inválida' });
    return;
  }
  const ev = EVENTS[g.event];
  if (ev && Date.now() > Date.parse(ev.endsAt)) {
    res.status(410).json({ error: 'La promoción de este evento ya terminó.' });
    return;
  }
  if (!g.drinks.some((d) => d.channel === channel)) {
    if (g.drinks.length >= MAX_DRINKS) {
      res.status(409).json({ error: `Ya tienes tus ${MAX_DRINKS} bebidas. ¡Gracias por compartir!` });
      return;
    }
    await prisma.eventDrink.create({
      data: { guestId: g.id, channel, code: String(crypto.randomInt(1000, 9999)) },
    });
  }
  res.json(view((await guestBySecret(g.secret))!));
});

// POST /api/events/redeem { secret, drinkId } — el bartender canjea en el teléfono del invitado
eventRoutes.post('/redeem', async (req, res) => {
  const g = await guestBySecret(req.body?.secret);
  const d = g?.drinks.find((x) => x.id === req.body?.drinkId);
  if (!g || !d) {
    res.status(400).json({ error: 'Bebida no encontrada' });
    return;
  }
  if (!d.redeemedAt) await prisma.eventDrink.update({ where: { id: d.id }, data: { redeemedAt: new Date() } });
  res.json(view((await guestBySecret(g.secret))!));
});

// GET /api/events/:event/stats — panel del admin
eventRoutes.get('/:event/stats', requireAdmin, async (req, res) => {
  const guests = await prisma.eventGuest.findMany({
    where: { event: req.params.event },
    include: {
      drinks: true,
      member: {
        select: {
          fullName: true,
          phone: true,
          claimed: true,
          referralCode: true,
          referralSlug: true,
          totalReferrals: true,
          links: { select: { clicks: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  const drinks = guests.flatMap((g) => g.drinks);
  res.json({
    guests: guests.length,
    drinksEarned: drinks.length,
    drinksRedeemed: drinks.filter((d) => d.redeemedAt).length,
    byChannel: Object.fromEntries(CHANNELS.map((c) => [c, drinks.filter((d) => d.channel === c).length])),
    clicks: guests.reduce((n, g) => n + g.member.links.reduce((a, l) => a + l.clicks, 0), 0),
    rows: guests.map((g) => ({
      name: g.member.fullName,
      phone: g.member.phone,
      claimed: g.member.claimed,
      referrals: g.member.totalReferrals,
      clicks: g.member.links.reduce((a, l) => a + l.clicks, 0),
      drinks: g.drinks.map((d) => ({ channel: d.channel, redeemed: !!d.redeemedAt })),
      createdAt: g.createdAt,
    })),
  });
});
