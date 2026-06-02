import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAdmin } from '../middleware/auth';

export const contentRoutes = Router();

// GET /api/content              -> todo el contenido agrupado por sección
// GET /api/content?section=hero -> solo esa sección
contentRoutes.get('/', async (req, res) => {
  try {
    const section = req.query.section as string | undefined;
    const rows = await prisma.siteContent.findMany({
      where: section ? { section } : undefined,
    });

    // Agrupar en { section: { key: value } }
    const grouped: Record<string, Record<string, string>> = {};
    for (const row of rows) {
      grouped[row.section] ??= {};
      grouped[row.section][row.key] = row.value;
    }

    res.json(section ? grouped[section] ?? {} : grouped);
  } catch (err) {
    console.error('GET /api/content', err);
    res.status(500).json({ error: 'Error al obtener contenido' });
  }
});

// PUT /api/content  (admin) -> upsert de un valor
// body: { section, key, value }
contentRoutes.put('/', requireAdmin, async (req, res) => {
  try {
    const { section, key, value } = req.body ?? {};
    if (!section || !key || typeof value !== 'string') {
      res.status(400).json({ error: 'section, key y value son requeridos' });
      return;
    }

    const row = await prisma.siteContent.upsert({
      where: { section_key: { section, key } },
      create: { section, key, value },
      update: { value },
    });

    res.json(row);
  } catch (err) {
    console.error('PUT /api/content', err);
    res.status(500).json({ error: 'Error al guardar contenido' });
  }
});
