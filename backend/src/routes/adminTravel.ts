import { Router } from 'express';
import { requireAdmin, type AuthedRequest } from '../middleware/auth';
import { audit } from '../services/audit';
import { listClaims, resolveClaim } from '../travel/guaranteeService';

// ============================================================
// FASE 5 V4 — Admin del Motor de Viajes: resolución de garantías de precio.
// ============================================================

export const adminTravelRoutes = Router();
adminTravelRoutes.use(requireAdmin);

// GET /api/admin/travel/guarantee?status=open
adminTravelRoutes.get('/guarantee', async (req, res) => {
  try {
    const status = req.query.status ? String(req.query.status) : undefined;
    res.json(await listClaims(status));
  } catch (err) {
    console.error('GET /api/admin/travel/guarantee', err);
    res.status(500).json({ error: 'Error al obtener reclamos' });
  }
});

// PUT /api/admin/travel/guarantee/:id — aprobar/rechazar
adminTravelRoutes.put('/guarantee/:id', async (req: AuthedRequest, res) => {
  try {
    const { status, resolution } = req.body ?? {};
    if (status !== 'approved' && status !== 'rejected') {
      res.status(400).json({ error: 'status debe ser approved o rejected' });
      return;
    }
    const claim = await resolveClaim(req.params.id, status, resolution);
    await audit(req.staff?.staffId, status === 'approved' ? 'confirm' : 'reject', 'guarantee_claim', req.params.id, {
      status,
    });
    res.json(claim);
  } catch (err) {
    console.error('PUT /api/admin/travel/guarantee/:id', err);
    res.status(400).json({ error: 'Error al resolver el reclamo' });
  }
});
