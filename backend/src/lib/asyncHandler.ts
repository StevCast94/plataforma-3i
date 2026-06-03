import type { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Envuelve un handler async para que cualquier excepción (ej. error de BD) se
 * capture y responda 500 en vez de provocar un unhandledRejection que tumbe el
 * proceso. Express 4 no captura rechazos de promesas automáticamente.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      console.error(`${req.method} ${req.originalUrl}`, err);
      if (!res.headersSent) res.status(500).json({ error: 'Error interno del servidor' });
    });
  };
}
