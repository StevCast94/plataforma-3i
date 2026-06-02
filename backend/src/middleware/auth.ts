import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Middleware de autenticación para staff admin (JWT propio).
// En Fase 0 protege los endpoints de escritura (PUT content, CRUD projects/products).
// Los endpoints de lectura y los formularios públicos (contact, inquiry) quedan abiertos.

export interface AuthedRequest extends Request {
  admin?: { id: string; email?: string };
}

export function requireAdmin(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No autorizado' });
    return;
  }

  const token = header.slice('Bearer '.length);
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ error: 'JWT_SECRET no configurado' });
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as { id: string; email?: string };
    req.admin = { id: payload.id, email: payload.email };
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
