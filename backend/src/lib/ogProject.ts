import fs from 'fs';
import path from 'path';
import type { Request, Response } from 'express';
import { prisma } from '../prisma';
import { publicBaseUrl } from './publicUrl';

/**
 * Tarjeta social de la página de un proyecto (/proyectos/:slug).
 *
 * WhatsApp y Facebook NO ejecutan JavaScript: leen el HTML tal cual sale del
 * servidor, así que las meta tags que pone react-helmet dentro del SPA no les
 * llegan. Aquí se reescriben sobre el index.html antes de enviarlo, con la
 * imagen y el texto de cada proyecto. El HTML sigue siendo el mismo documento
 * del SPA, así que un visitante real no nota nada.
 */

/** Imagen y texto propios por proyecto. Sin entrada, se usa la portada y la descripción del proyecto. */
const OVERRIDES: Record<string, { title: string; description: string; image: string }> = {
  'montanita-view': {
    title: 'Montañita View — mapa interactivo de solares',
    description:
      'Explora los 89 solares disponibles en el mapa satelital: toca cualquiera y mira su precio, su cuota mensual, su clave catastral, sus linderos y su frente a la calle. Manglaralto, Ruta del Spondylus, desde $100/m².',
    image: '/images/og/montanita-view-mapa.jpg',
  },
};

const esc = (s: string) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Primer párrafo de la descripción del proyecto, recortado para la tarjeta. */
function summarize(text: string | null, max = 200): string {
  const first = (text ?? '').split('\n').map((l) => l.trim()).filter(Boolean)[0] ?? '';
  return first.length > max ? `${first.slice(0, max - 1).trimEnd()}…` : first;
}

/**
 * Sustituye el valor de una meta por property/name. `\s+` cubre también las que
 * el formateador parte en varias líneas; si la meta no existe, devuelve el HTML igual.
 */
function setMeta(html: string, attr: 'property' | 'name', key: string, value: string): string {
  const re = new RegExp(`(<meta\\s+${attr}="${key}"\\s+content=")[^"]*(")`, 'i');
  return html.replace(re, `$1${esc(value)}$2`);
}

export function projectOgHandler(frontendPath: string) {
  const indexPath = path.join(frontendPath, 'index.html');

  return async (req: Request, res: Response) => {
    try {
      const slug = String(req.params.slug ?? '');
      const project = await prisma.project.findUnique({
        where: { slug },
        select: { name: true, description: true, coverImage: true, active: true },
      });
      if (!project) {
        res.sendFile(indexPath);
        return;
      }
      const origin = publicBaseUrl();
      const ov = OVERRIDES[slug];
      const title = ov?.title ?? `${project.name} — Grupo 3i`;
      const description = ov?.description ?? summarize(project.description);
      const rawImage = ov?.image ?? project.coverImage ?? '/images/og-cover.png';
      const image = /^https?:\/\//i.test(rawImage) ? rawImage : `${origin}${rawImage}`;
      const url = `${origin}/proyectos/${slug}`;

      let html = fs.readFileSync(indexPath, 'utf8');
      html = html.replace(/<title>[^<]*<\/title>/i, `<title>${esc(title)}</title>`);
      html = setMeta(html, 'name', 'description', description);
      html = setMeta(html, 'property', 'og:url', url);
      html = setMeta(html, 'property', 'og:title', title);
      html = setMeta(html, 'property', 'og:description', description);
      html = setMeta(html, 'property', 'og:image', image);
      html = setMeta(html, 'property', 'og:image:alt', title);
      html = setMeta(html, 'name', 'twitter:title', title);
      html = setMeta(html, 'name', 'twitter:description', description);
      html = setMeta(html, 'name', 'twitter:image', image);
      res.type('html').send(html);
    } catch (err) {
      console.error('GET /proyectos/:slug (tarjeta social)', err);
      res.sendFile(indexPath);
    }
  };
}
