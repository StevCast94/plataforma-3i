import { prisma } from '../prisma';

// Puntaje de calidad de un proyecto (0-100) y checklist legal (paso 6).
// El puntaje ordena la portada y le dice al desarrollador qué le falta.

export const CHECKLIST = ['deed', 'liens', 'municipal', 'boundaries'] as const;
export type Checklist = Partial<Record<(typeof CHECKLIST)[number], boolean>>;

export const CHECKLIST_LABEL: Record<(typeof CHECKLIST)[number], string> = {
  deed: 'Escritura inscrita',
  liens: 'Certificado de gravámenes',
  municipal: 'Aprobación municipal de la lotización',
  boundaries: 'Linderos coinciden con el plano',
};

export const isChecklistComplete = (v: unknown) => {
  const c = (v ?? {}) as Checklist;
  return CHECKLIST.every((k) => c[k] === true);
};

interface QualityInput {
  coverImage: string | null;
  images: string[];
  description: string;
  subtitle: string | null;
  textEn: unknown;
  location: string | null;
  mapLat: number | null;
  mapLng: number | null;
  developerId: string | null;
  verifiedAt: Date | null;
  lotsTotal: number;
  lotsPriced: number;
  panoramas: number;
  documents: number;
}

export interface QualityItem {
  key: string;
  label: string;
  points: number;
  max: number;
  tip?: string;
}

export function computeQuality(p: QualityInput): { score: number; items: QualityItem[] } {
  const ratio = (n: number, d: number) => (d > 0 ? Math.min(1, n / d) : 0);
  const raw = (p.textEn ?? {}) as { subtitle?: string; description?: string };
  const en = { subtitle: (raw.subtitle ?? '').trim(), description: (raw.description ?? '').trim() };
  const items: QualityItem[] = [
    { key: 'cover', label: 'Imagen de portada', max: 10, points: p.coverImage ? 10 : 0, tip: 'Sube una portada horizontal de buena calidad.' },
    { key: 'gallery', label: 'Galería (6 fotos o más)', max: 10, points: Math.round(10 * ratio(p.images.length, 6)), tip: 'Agrega fotos del terreno, accesos y alrededores.' },
    { key: 'description', label: 'Descripción completa (300+ caracteres)', max: 10, points: Math.round(10 * ratio(p.description.trim().length, 300)), tip: 'Cuenta ubicación, servicios, accesos y formas de pago.' },
    { key: 'basics', label: 'Subtítulo y ubicación', max: 5, points: (p.subtitle ? 2 : 0) + (p.location ? 3 : 0) },
    { key: 'map', label: 'Coordenadas en el mapa', max: 5, points: p.mapLat != null && p.mapLng != null ? 5 : 0, tip: 'Indica latitud y longitud del proyecto.' },
    { key: 'lots', label: 'Plano de lotes cargado', max: 10, points: p.lotsTotal > 0 ? 10 : 0, tip: 'Envíanos el plano (DWG/KMZ) para cargar el mapa interactivo.' },
    { key: 'prices', label: 'Precios en todos los lotes', max: 15, points: Math.round(15 * ratio(p.lotsPriced, p.lotsTotal)), tip: 'Completa el precio de cada lote disponible.' },
    { key: 'pano', label: 'Recorrido 360° (3 vistas o más)', max: 10, points: Math.round(10 * ratio(p.panoramas, 3)), tip: 'Sube panorámicas tomadas con el celular.' },
    {
      key: 'english',
      label: 'Versión en inglés',
      max: 10,
      // Los proyectos propios de Grupo 3i se traducen en el sitio.
      points: !p.developerId ? 10 : (en.description.length >= 80 ? 7 : 0) + (en.subtitle || !p.subtitle ? 3 : 0),
      tip: 'Escribe la descripción y el subtítulo en inglés para el comprador extranjero.',
    },
    {
      key: 'verified',
      label: 'Verificado por Grupo 3i',
      max: 15,
      // Los proyectos propios de Grupo 3i cuentan como verificados.
      points: !p.developerId || p.verifiedAt ? 15 : 0,
      tip: p.documents ? 'Documentos en revisión por Grupo 3i.' : 'Sube escritura, gravámenes y aprobación municipal.',
    },
  ];
  return { score: items.reduce((a, i) => a + i.points, 0), items };
}

/** Calcula el puntaje de varios proyectos con pocas consultas. */
export async function qualityFor(projectIds: string[]) {
  if (!projectIds.length) return new Map<string, ReturnType<typeof computeQuality>>();
  const [projects, lots, priced, panos, docs] = await Promise.all([
    prisma.project.findMany({
      where: { id: { in: projectIds } },
      select: { id: true, coverImage: true, images: true, description: true, subtitle: true, textEn: true, location: true, mapLat: true, mapLng: true, developerId: true, verifiedAt: true },
    }),
    prisma.lot.groupBy({ by: ['projectId'], where: { projectId: { in: projectIds }, kind: 'LOT' }, _count: true }),
    prisma.lot.groupBy({ by: ['projectId'], where: { projectId: { in: projectIds }, kind: 'LOT', price: { not: null } }, _count: true }),
    prisma.panorama.groupBy({ by: ['projectId'], where: { projectId: { in: projectIds }, active: true }, _count: true }),
    prisma.projectDocument.groupBy({ by: ['projectId'], where: { projectId: { in: projectIds } }, _count: true }),
  ]);
  const c = (rows: { projectId: string; _count: number }[], id: string) => rows.find((r) => r.projectId === id)?._count ?? 0;
  return new Map(
    projects.map((p) => [
      p.id,
      computeQuality({
        ...p,
        lotsTotal: c(lots, p.id),
        lotsPriced: c(priced, p.id),
        panoramas: c(panos, p.id),
        documents: c(docs, p.id),
      }),
    ]),
  );
}
