import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';

// Middleware de autenticación para staff admin (JWT propio, SEPARADO del de miembros).
// Protege endpoints de escritura (content/projects/products) y todo /api/admin/*.

export interface StaffPayload {
  staffId: string;
  username: string;
  role: string;
}

export interface AuthedRequest extends Request {
  staff?: StaffPayload;
}

function secret(): string {
  return process.env.JWT_SECRET ?? 'dev-secret-cambiar-en-produccion';
}

/** Firma un token de staff. */
export function signStaffToken(payload: StaffPayload): string {
  return jwt.sign(payload, secret(), { expiresIn: '12h' });
}

// Permisos por rol. superadmin y admin acceden a todo (lo exclusivo de superadmin
// lo controla requireSuperadmin). El resto, solo a estas rutas; `read` = solo GET.
// Coincidencia por segmento completo: '/api/admin/me' NO debe dejar pasar '/api/admin/members'.
type Rule = { path: string; read?: boolean };
const ROLE_ACCESS: Record<string, Rule[]> = {
  // Gestora del Bosque: solo su módulo. Nunca ve ventas, socios ni comisiones.
  bosque: [{ path: '/api/admin/bosque' }, { path: '/api/admin/me' }, { path: '/api/admin/seed-images' }],
  // Asesor de ventas: su CRM y los proyectos (lotes, precios, 360°) para consultar.
  advisor: [
    { path: '/api/admin/me' },
    { path: '/api/admin/crm' },
    { path: '/api/admin/services' },
    { path: '/api/admin/projects', read: true },
    { path: '/api/admin/lots', read: true },
    { path: '/api/admin/panoramas', read: true },
  ],
  // Contenido: proyectos, lotes, 360°, productos y textos del sitio.
  content: [
    { path: '/api/admin/me' },
    { path: '/api/admin/projects' },
    { path: '/api/admin/lots' },
    { path: '/api/admin/panoramas' },
    { path: '/api/admin/products' },
    { path: '/api/admin/seed-images' },
    { path: '/api/content' },
    { path: '/api/projects' },
    { path: '/api/products' },
  ],
};
function roleAllowed(role: string, method: string, url: string): boolean {
  const rules = ROLE_ACCESS[role];
  if (!rules) return true;
  const path = url.split('?')[0];
  return rules.some((r) => (path === r.path || path.startsWith(r.path + '/')) && (!r.read || method === 'GET'));
}

/** Requiere un staff autenticado y activo. */
export async function requireAdmin(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No autorizado' });
    return;
  }

  try {
    const payload = jwt.verify(header.slice(7), secret()) as Partial<StaffPayload>;
    if (!payload.staffId) {
      res.status(401).json({ error: 'Token no es de staff' });
      return;
    }
    const staff = await prisma.staffUser.findUnique({
      where: { id: payload.staffId },
      select: { id: true, username: true, role: true, active: true },
    });
    if (!staff || !staff.active) {
      res.status(401).json({ error: 'Staff no autorizado' });
      return;
    }
    req.staff = { staffId: staff.id, username: staff.username, role: staff.role };
    if (!roleAllowed(staff.role, req.method, req.originalUrl)) {
      res.status(403).json({
        error: staff.role === 'bosque' ? 'Tu usuario solo tiene acceso al módulo del Bosque' : 'Tu usuario no tiene acceso a esta sección',
      });
      return;
    }
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

/** Requiere rol superadmin (además de estar autenticado). */
export function requireSuperadmin(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): void {
  if (req.staff?.role !== 'superadmin') {
    res.status(403).json({ error: 'Requiere permisos de superadmin' });
    return;
  }
  next();
}
