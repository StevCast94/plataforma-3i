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
