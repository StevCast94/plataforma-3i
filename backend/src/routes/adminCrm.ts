import { Router } from 'express';
import { requireAdmin } from '../middleware/auth';
import type { DeveloperRequest } from '../middleware/authDeveloper';
import { crmRoutes } from './crmShared';

// CRM de Grupo 3i para sus proyectos propios (Montañita View, Ibiza): las mismas
// rutas que el portal de desarrolladores, con alcance developerId = null.
export const adminCrmRoutes = Router();
adminCrmRoutes.use(requireAdmin, (req: DeveloperRequest, _res, next) => {
  req.developerId = null as unknown as string; // proyectos propios
  req.developerRole = 'OWNER';
  req.developerUserId = undefined;
  next();
});
adminCrmRoutes.use(crmRoutes);
