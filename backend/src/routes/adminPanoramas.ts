import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAdmin, type AuthedRequest } from '../middleware/auth';
import { audit } from '../services/audit';

// ============================================================
// Vistas 360° de un proyecto. Los mosaicos se cortan en el navegador del
// admin y se suben uno a uno a Cloudinary (/api/admin/seed-images); aquí solo
// se guarda la ficha con sus URLs, ubicación y orientación.
// ============================================================

export const adminPanoramaRoutes = Router();
adminPanoramaRoutes.use(requireAdmin);

const num = (v: unknown) => (v === null || v === '' || v === undefined ? null : Number.isFinite(Number(v)) ? Number(v) : null);

/** { baseUrl, levels: [{ width, cols, rows, tiles: string[] (fila por fila) }] } */
function validTiles(t: unknown): boolean {
  const x = t as { baseUrl?: unknown; levels?: { width?: number; cols?: number; rows?: number; tiles?: unknown[] }[] };
  return Boolean(
    x &&
      typeof x.baseUrl === 'string' &&
      Array.isArray(x.levels) &&
      x.levels.length > 0 &&
      x.levels.every((l) => l.width && l.cols && l.rows && Array.isArray(l.tiles) && l.tiles.length === l.cols * l.rows),
  );
}

adminPanoramaRoutes.get('/', async (req, res) => {
  const projectId = String(req.query.projectId ?? '');
  const rows = await prisma.panorama.findMany({
    where: projectId ? { projectId } : {},
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });
  res.json(rows);
});

adminPanoramaRoutes.post('/', async (req: AuthedRequest, res) => {
  try {
    const { projectId, title, description, lat, lng, tiles, northYaw, altitude } = req.body ?? {};
    if (!projectId || !title || !validTiles(tiles)) {
      res.status(400).json({ error: 'Proyecto, título y mosaicos son requeridos' });
      return;
    }
    const count = await prisma.panorama.count({ where: { projectId } });
    const p = await prisma.panorama.create({
      data: {
        projectId,
        title: String(title),
        description: description ? String(description) : null,
        lat: num(lat),
        lng: num(lng),
        tiles,
        northYaw: num(northYaw) ?? 0,
        altitude: num(altitude),
        sortOrder: count,
      },
    });
    await audit(req.staff?.staffId, 'create', 'panorama', p.id, { title: p.title });
    res.json(p);
  } catch (err) {
    console.error('POST /api/admin/panoramas', err);
    res.status(500).json({ error: 'Error al guardar la vista 360°' });
  }
});

adminPanoramaRoutes.patch('/:id', async (req: AuthedRequest, res) => {
  try {
    const b = req.body ?? {};
    const data: Record<string, unknown> = {};
    if (b.title !== undefined) data.title = String(b.title);
    if (b.description !== undefined) data.description = b.description ? String(b.description) : null;
    if (b.lat !== undefined) data.lat = num(b.lat);
    if (b.lng !== undefined) data.lng = num(b.lng);
    if (b.northYaw !== undefined) data.northYaw = num(b.northYaw) ?? 0;
    if (b.altitude !== undefined) data.altitude = num(b.altitude);
    if (b.sortOrder !== undefined) data.sortOrder = Number(b.sortOrder) || 0;
    if (b.active !== undefined) data.active = Boolean(b.active);
    if (b.tiles !== undefined) {
      if (!validTiles(b.tiles)) {
        res.status(400).json({ error: 'Mosaicos inválidos' });
        return;
      }
      data.tiles = b.tiles;
    }
    const p = await prisma.panorama.update({ where: { id: req.params.id }, data });
    await audit(req.staff?.staffId, 'update', 'panorama', p.id, data);
    res.json(p);
  } catch (err) {
    console.error('PATCH /api/admin/panoramas', err);
    res.status(500).json({ error: 'Error al actualizar la vista 360°' });
  }
});

adminPanoramaRoutes.delete('/:id', async (req: AuthedRequest, res) => {
  try {
    await prisma.panorama.delete({ where: { id: req.params.id } });
    await audit(req.staff?.staffId, 'delete', 'panorama', req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/admin/panoramas', err);
    res.status(500).json({ error: 'Error al eliminar la vista 360°' });
  }
});
