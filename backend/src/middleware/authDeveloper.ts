import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';

// Autenticación del portal de desarrolladores (/desarrollador). JWT propio,
// SEPARADO del de staff y del de miembros: un desarrollador solo ve sus proyectos.
// Roles: OWNER (dueño: todo) y SELLER (vendedor: solo el CRM y sus contactos).

export interface DeveloperRequest extends Request {
  developerUserId?: string;
  developerId?: string;
  developerRole?: 'OWNER' | 'SELLER';
}

const SECRET = () => process.env.JWT_SECRET ?? 'dev-secret-cambiar-en-produccion';

export function signDeveloperToken(developerUserId: string, developerId: string): string {
  return jwt.sign({ developerUserId, developerId }, SECRET(), { expiresIn: '30d' });
}

/** Lo que un vendedor puede usar: su sesión, el CRM, sus contactos y avisos. */
function sellerAllowed(method: string, path: string): boolean {
  // Plantillas: el vendedor las usa, pero solo el dueño las crea o borra.
  if (path.startsWith('/crm/templates')) return method === 'GET';
  if (path === '/me' || path === '/password' || path.startsWith('/crm/') || path.startsWith('/push/')) return true;
  if (path === '/leads' || path.startsWith('/leads/')) return true;
  if (method === 'GET' && path === '/projects') return true;
  // Registrar un contacto propio en un proyecto del desarrollador.
  return method === 'POST' && /^\/projects\/[^/]+\/leads$/.test(path);
}

/** Filtro de contactos: el vendedor solo ve los que tiene asignados. */
export function leadWhere(req: DeveloperRequest) {
  return {
    project: { developerId: req.developerId },
    ...(req.developerRole === 'SELLER' ? { assignedToId: req.developerUserId } : {}),
  };
}

export async function requireDeveloper(req: DeveloperRequest, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No autorizado' });
    return;
  }
  try {
    const payload = jwt.verify(header.slice(7), SECRET()) as { developerUserId?: string };
    if (!payload.developerUserId) {
      res.status(401).json({ error: 'Token no es de desarrollador' });
      return;
    }
    const user = await prisma.developerUser.findUnique({
      where: { id: payload.developerUserId },
      select: { id: true, active: true, role: true, developerId: true, developer: { select: { status: true } } },
    });
    if (!user || !user.active || user.developerId === 'grupo3i-interno' || user.developer.status === 'SUSPENDED') {
      res.status(401).json({ error: 'Acceso desactivado' });
      return;
    }
    req.developerUserId = user.id;
    req.developerId = user.developerId;
    req.developerRole = user.role === 'SELLER' ? 'SELLER' : 'OWNER';
    if (req.developerRole === 'SELLER' && !sellerAllowed(req.method, req.path)) {
      res.status(403).json({ error: 'Tu usuario de vendedor solo tiene acceso al CRM' });
      return;
    }
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
