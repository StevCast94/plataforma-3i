import { Router, type Request, type Response } from 'express';
import { prisma } from '../prisma';
import { asyncHandler } from '../lib/asyncHandler';
import { resolveReferrer, recordClick } from '../services/referralTracking';
import { loadCampaigns } from '../lib/ogCampaigns';
import { isSocialCrawler, publicOrigin, renderOgCard } from '../lib/ogCard';

// ============================================================
// Atribución de referidos ROBUSTA y persistente.
// - Cookie first-party `g3i_ref` (90 días, httpOnly, first-touch): sobrevive a
//   cierres de pestaña y a que el ?ref se pierda al compartir el enlace.
// - /r/:code → redirección que setea la cookie + cuenta el click (enlaces que
//   los miembros comparten apuntando a CUALQUIER página: home, producto…).
// - Los endpoints de leads (contacto, inquiry, registro) usan refFromRequest()
//   para tomar el código del body O de la cookie como respaldo autoritativo.
// ============================================================

export const REF_COOKIE = 'g3i_ref';
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

/** Toma el código de referido del body (referralCode | ref) o de la cookie. */
export function refFromRequest(req: Request): string | null {
  const b = req.body ?? {};
  const fromBody = b.referralCode ?? b.ref;
  if (fromBody && String(fromBody).trim()) return String(fromBody).trim();
  const c = (req as Request & { cookies?: Record<string, string> }).cookies?.[REF_COOKIE];
  return c ? String(c).trim() : null;
}

/** Setea la cookie de referido solo si NO existe (first-touch gana). */
function setRefCookieIfAbsent(req: Request, res: Response, code: string): boolean {
  const existing = (req as Request & { cookies?: Record<string, string> }).cookies?.[REF_COOKIE];
  if (existing) return false;
  res.cookie(REF_COOKIE, code, {
    maxAge: NINETY_DAYS_MS,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
  return true;
}

/**
 * Destino por defecto de un enlace de referido "pelado" (/r/:code sin ?to=).
 * Un enlace de referido significa "únete a través de mí", así que aterriza en el
 * FORMULARIO DE REGISTRO, no en la home. Para compartir cualquier otra página se
 * usa ?to=/ruta explícito (lo hace Herramientas > "Comparte cualquier página").
 */
const DEFAULT_REF_DESTINATION = '/oficina/registro';

/** Sanitiza un destino: solo rutas internas relativas (evita open-redirect). */
function safeDestination(raw: unknown, fallback: string): string {
  const to = String(raw ?? fallback);
  if (!to.startsWith('/') || to.startsWith('//')) return fallback;
  return to;
}

/**
 * GET /r/:code?to=/tienda/slug&c=inversion
 *
 * - Crawler social (WhatsApp y compañía): responde HTML con las meta tags de
 *   la campaña `c` para que la vista previa del enlace sea una tarjeta de
 *   presentación real. NO cuenta click ni setea cookie: el bot no es visitante.
 * - Humano: comportamiento de siempre — cookie de referido + click + redirect.
 */
export const referralRedirect = asyncHandler(async (req: Request, res: Response) => {
  const code = String(req.params.code ?? '').trim();
  const ref = await resolveReferrer(code).catch(() => null);

  const campaignKey = String(req.query.c ?? '').trim();
  const campaigns = await loadCampaigns();
  const campaign = campaigns[campaignKey];

  // El destino explícito (?to=) manda; si no, el de la campaña; si no, registro.
  const fallbackTo = campaign?.to ?? DEFAULT_REF_DESTINATION;
  const to = safeDestination(req.query.to, fallbackTo);

  if (campaign && isSocialCrawler(req)) {
    const origin = publicOrigin(req);
    const member = ref
      ? await prisma.referralMember
          .findUnique({ where: { id: ref.id }, select: { fullName: true } })
          .catch(() => null)
      : null;

    res.set('Cache-Control', 'public, max-age=3600');
    res.type('html').send(
      renderOgCard({
        campaign,
        referrerName: member?.fullName.split(' ')[0] ?? null,
        canonicalUrl: `${origin}${req.originalUrl}`,
        redirectTo: `${origin}/#${to}`,
        origin,
      }),
    );
    return;
  }

  if (ref) {
    setRefCookieIfAbsent(req, res, code);
    await recordClick(code).catch(() => {});
  }
  res.redirect(302, `/#${to}`);
});

export const referralApiRoutes = Router();

// GET /api/referral/campaigns — plantillas + tarjetas para Herramientas.
referralApiRoutes.get(
  '/campaigns',
  asyncHandler(async (_req: Request, res: Response) => {
    const campaigns = await loadCampaigns();
    res.json(
      Object.entries(campaigns).map(([key, c]) => ({ key, ...c })),
    );
  }),
);

// POST /api/referral/track { code } — para aterrizajes con ?ref= directo (setea cookie).
referralApiRoutes.post(
  '/track',
  asyncHandler(async (req: Request, res: Response) => {
    const code = String(req.body?.code ?? '').trim();
    if (!code) {
      res.status(400).json({ error: 'code requerido' });
      return;
    }
    const ref = await resolveReferrer(code);
    if (!ref) {
      res.status(404).json({ error: 'Código inválido' });
      return;
    }
    const firstTouch = setRefCookieIfAbsent(req, res, code);
    await recordClick(code).catch(() => {});
    res.json({ ok: true, firstTouch });
  }),
);

// GET /api/referral/current — quién refiere al visitante (para el banner "te refiere X").
referralApiRoutes.get(
  '/current',
  asyncHandler(async (req: Request, res: Response) => {
    const code = (req as Request & { cookies?: Record<string, string> }).cookies?.[REF_COOKIE];
    if (!code) {
      res.json({ code: null });
      return;
    }
    const ref = await resolveReferrer(String(code));
    if (!ref) {
      res.json({ code: null });
      return;
    }
    const member = await prisma.referralMember.findUnique({
      where: { id: ref.id },
      select: { fullName: true, referralCode: true },
    });
    if (!member) {
      res.json({ code: null });
      return;
    }
    res.json({ code: member.referralCode, firstName: member.fullName.split(' ')[0] });
  }),
);
