import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAdmin, type AuthedRequest } from '../middleware/auth';
import { audit } from '../services/audit';

export const adminLotRoutes = Router();
adminLotRoutes.use(requireAdmin);

// GET /api/admin/lots?projectId=&status=&block=&q= — lista completa (incluye
// datos privados: ownerName/ownerPhone/notes). El admin es quien SÍ debe verlos.
adminLotRoutes.get('/', async (req, res) => {
  try {
    const { projectId, status, block, q } = req.query;
    const where = {
      ...(projectId ? { projectId: String(projectId) } : {}),
      ...(status ? { status: status as never } : {}),
      ...(block ? { block: String(block) } : {}),
      ...(q
        ? {
            OR: [
              { code: { contains: String(q), mode: 'insensitive' as const } },
              { cadastralCode: { contains: String(q), mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
    const lots = await prisma.lot.findMany({
      where,
      orderBy: [{ block: 'asc' }, { code: 'asc' }],
    });
    res.json(lots);
  } catch (err) {
    console.error('GET /api/admin/lots', err);
    res.status(500).json({ error: 'Error al obtener los lotes' });
  }
});

// PUT /api/admin/lots/:id — editar estado, precio, datos comerciales y privados.
adminLotRoutes.put('/:id', async (req: AuthedRequest, res) => {
  try {
    const data = { ...req.body };
    delete data.id;
    delete data.projectId; // un lote no cambia de proyecto por edición
    delete data.createdAt;
    delete data.updatedAt;
    const lot = await prisma.lot.update({ where: { id: req.params.id }, data });
    await audit(req.staff?.staffId, 'update', 'lot', lot.id, { code: lot.code, status: lot.status });
    res.json(lot);
  } catch (err) {
    console.error('PUT /api/admin/lots/:id', err);
    res.status(400).json({ error: 'Error al actualizar el lote' });
  }
});
