import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';

// Autenticación del portal de desarrolladores (/desarrollador). JWT propio,
// SEPARADO del de staff y del de miembros: un desarrollador solo ve sus proyectos.

export interface DeveloperRequest extends Request {
  developerUserId?: string;
  developerId?: string;
}

const SECRET = () => process.env.JWT_SECRET ?? 'dev-secret-cambiar-en-produccion';

export function signDeveloperToken(developerUserId: string, developerId: string): string {
  return jwt.sign({ developerUserId, developerId }, SECRET(), { expiresIn: '30d' });
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
      select: { id: true, active: true, developerId: true, developer: { select: { status: true } } },
    });
    if (!user || !user.active || user.developer.status === 'SUSPENDED') {
      res.status(401).json({ error: 'Acceso desactivado' });
      return;
    }
    req.developerUserId = user.id;
    req.developerId = user.developerId;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
