import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAdmin, type AuthedRequest } from '../middleware/auth';
import { audit } from '../services/audit';
import { giftTreeForLot } from '../lib/bosque';
import { unitFields, newUnit } from '../lib/units';

export const adminLotRoutes = Router();
adminLotRoutes.use(requireAdmin);

// GET /api/admin/lots?projectId=&status=&block=&q= — lista completa (incluye
// datos privados: ownerName/ownerPhone/notes). El admin es quien SÍ debe verlos.
adminLotRoutes.get('/', async (req, res) => {
  try {
    const { projectId, status, block, q, unitType } = req.query;
    const where = {
      ...(projectId ? { projectId: String(projectId) } : {}),
      ...(status ? { status: status as never } : {}),
      ...(block ? { block: String(block) } : {}),
      ...(unitType ? { unitType: String(unitType) } : {}),
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

// POST /api/admin/lots — nueva unidad sin plano (casa, departamento, local…).
adminLotRoutes.post('/', async (req: AuthedRequest, res) => {
  try {
    const projectId = String(req.body?.projectId ?? '');
    if (!(await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } }))) {
      res.status(404).json({ error: 'Proyecto no encontrado' });
      return;
    }
    const lot = await prisma.lot.create({ data: { projectId, ...newUnit(req.body ?? {}) } as never });
    await audit(req.staff?.staffId, 'create', 'lot', lot.id, { code: lot.code });
    res.status(201).json(lot);
  } catch (err) {
    const msg = (err as { code?: string }).code === 'P2002' ? 'Ya existe una unidad con ese código' : (err as Error).message;
    res.status(400).json({ error: msg });
  }
});

// DELETE /api/admin/lots/:id — solo unidades sin plano y sin venta (las del plano se reimportan).
adminLotRoutes.delete('/:id', async (req: AuthedRequest, res) => {
  const lot = await prisma.lot.findUnique({ where: { id: req.params.id } });
  if (!lot || lot.geometry !== null || lot.status === 'SOLD') {
    res.status(400).json({ error: 'Solo se pueden borrar unidades sin plano que no estén vendidas' });
    return;
  }
  await prisma.lot.delete({ where: { id: lot.id } });
  await audit(req.staff?.staffId, 'delete', 'lot', lot.id, { code: lot.code });
  res.json({ ok: true });
});

// PUT /api/admin/lots/:id — editar estado, precio, datos comerciales y privados.
adminLotRoutes.put('/:id', async (req: AuthedRequest, res) => {
  try {
    const data = { ...req.body };
    delete data.id;
    delete data.projectId; // un lote no cambia de proyecto por edición
    delete data.createdAt;
    delete data.updatedAt;
    delete data.geometry; // la geometría solo llega por importación desde GEO 3i
    Object.assign(data, unitFields(req.body ?? {}));
    const lot = await prisma.lot.update({ where: { id: req.params.id }, data });
    await audit(req.staff?.staffId, 'update', 'lot', lot.id, { code: lot.code, status: lot.status });
    // Cada lote vendido de Montañita View trae 1 árbol del Bosque a nombre del comprador.
    if (lot.status === 'SOLD' && lot.kind === 'LOT' && lot.code !== 'LOBBY') {
      await giftTreeForLot(lot).catch((e) => console.error('giftTreeForLot', e));
    }
    res.json(lot);
  } catch (err) {
    console.error('PUT /api/admin/lots/:id', err);
    res.status(400).json({ error: 'Error al actualizar el lote' });
  }
});
