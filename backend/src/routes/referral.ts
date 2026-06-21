import { Router, type Request, type Response } from 'express';
import { prisma } from '../prisma';
import { asyncHandler } from '../lib/asyncHandler';
import { resolveReferrer, recordClick } from '../services/referralTracking';

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

/** GET /r/:code?to=/tienda/slug → cuenta click, setea cookie y redirige al SPA. */
export const referralRedirect = asyncHandler(async (req: Request, res: Response) => {
  const code = String(req.params.code ?? '').trim();
  const ref = await resolveReferrer(code).catch(() => null);
  if (ref) {
    setRefCookieIfAbsent(req, res, code);
    await recordClick(code).catch(() => {});
  }
  // Sanitizar destino: solo rutas internas relativas (evita open-redirect).
  let to = String(req.query.to ?? '/');
  if (!to.startsWith('/') || to.startsWith('//')) to = '/';
  res.redirect(302, `/#${to}`);
});

export const referralApiRoutes = Router();

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
