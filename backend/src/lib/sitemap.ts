import type { Request, Response } from 'express';
import { prisma } from '../prisma';

// sitemap.xml para Google: páginas públicas, proyectos de la vitrina y sus
// solares disponibles, cada uno con su versión en inglés (/en/...).

const BASE = 'https://grupo3i.com';
const PAGES = [
  '/', '/proyectos', '/club', '/sobre-nosotros', '/contacto', '/oficina',
  '/publica-tu-proyecto', '/publica-tu-proyecto/propuesta', '/publica-tu-proyecto/manual', '/publica-tu-proyecto/galeria',
];

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function entry(path: string, lastmod?: Date, priority = 0.5) {
  const es = `${BASE}${path}`;
  const en = `${BASE}/en${path === '/' ? '' : path}`;
  const alt =
    `<xhtml:link rel="alternate" hreflang="es" href="${esc(es)}"/>` +
    `<xhtml:link rel="alternate" hreflang="en" href="${esc(en)}"/>`;
  const mod = lastmod ? `<lastmod>${lastmod.toISOString().slice(0, 10)}</lastmod>` : '';
  return [es, en].map((loc) => `<url><loc>${esc(loc)}</loc>${mod}<priority>${priority}</priority>${alt}</url>`).join('');
}

export async function sitemapHandler(_req: Request, res: Response) {
  try {
    const projects = await prisma.project.findMany({
      where: { showcase: true, active: true, publishStatus: 'PUBLISHED' },
      select: {
        slug: true, updatedAt: true,
        lots: { where: { active: true, kind: 'LOT', status: { in: ['AVAILABLE', 'RESERVED'] } }, select: { code: true, updatedAt: true } },
      },
    });
    const urls = [
      ...PAGES.map((p) => entry(p, undefined, p === '/' ? 1 : 0.6)),
      ...projects.flatMap((p) => [
        entry(`/proyectos/${p.slug}`, p.updatedAt, 0.9),
        ...p.lots.map((l) => entry(`/proyectos/${p.slug}/solar/${encodeURIComponent(l.code)}`, l.updatedAt, 0.5)),
      ]),
    ];
    res
      .type('application/xml')
      .set('Cache-Control', 'public, max-age=3600')
      .send(
        `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls.join('')}</urlset>`,
      );
  } catch (err) {
    console.error('GET /sitemap.xml', err);
    res.status(500).send('error');
  }
}

/** Archivo de verificación de Google Search Console (método «archivo HTML»). */
export async function searchConsoleFile(req: Request, res: Response, next: () => void) {
  const row = await prisma.siteContent
    .findUnique({ where: { section_key: { section: 'tracking', key: 'search_console_file' } } })
    .catch(() => null);
  const file = row?.value.trim();
  if (file && req.params.file === file) {
    res.type('text/html').send(`google-site-verification: ${file}`);
    return;
  }
  next();
}
