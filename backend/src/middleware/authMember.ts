import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';

// Autenticación JWT simple para miembros del programa de referidos (Fase 2).
// El payload del token contiene { memberId, email }. En Fase 3 → Supabase Auth.

export interface MemberRequest extends Request {
  memberId?: string;
}

const SECRET = () => process.env.JWT_SECRET ?? 'dev-secret-cambiar-en-produccion';

export function signMemberToken(memberId: string, email: string): string {
  return jwt.sign({ memberId, email }, SECRET(), { expiresIn: '3650d' });
}

/**
 * Auth opcional: si hay un token válido de miembro, setea req.memberId; si no,
 * continúa igual (sin error). Útil para endpoints públicos que muestran estado
 * personalizado (ej. si el usuario ya reaccionó a un post).
 */
export function optionalMember(
  req: MemberRequest,
  _res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(header.slice(7), SECRET()) as { memberId?: string };
      if (payload.memberId) req.memberId = payload.memberId;
    } catch {
      /* token inválido → seguir como visitante */
    }
  }
  next();
}

export async function authMember(
  req: MemberRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }

  try {
    const payload = jwt.verify(header.slice(7), SECRET()) as { memberId: string };
    // Verificar que el miembro siga existiendo y no esté suspendido.
    const member = await prisma.referralMember.findUnique({
      where: { id: payload.memberId },
      select: { id: true, status: true },
    });
    if (!member) {
      res.status(401).json({ error: 'Miembro no encontrado' });
      return;
    }
    if (member.status === 'SUSPENDED') {
      res.status(403).json({ error: 'Cuenta suspendida' });
      return;
    }
    req.memberId = member.id;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
