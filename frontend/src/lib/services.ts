// Servicios integrales de Grupo 3i (mismos ids que backend/src/lib/serviceCatalog.ts).
// Textos en los dos idiomas aquí mismo: es contenido comercial cerrado, como la propuesta.

export type ServiceId =
  | 'topografia' | 'georreferenciacion' | 'planos' | 'fraccionamiento'
  | 'compraventa' | 'notariales' | 'municipales'
  | 'publicacion' | 'recorridos-360' | 'crm-mapa'
  | 'landing' | 'campanas' | 'audiovisual' | 'grafico'
  | 'agroturismo' | 'residencial' | 'forestal' | 'agricultura';

type L = { es: string; en: string };

export interface ServiceArea {
  id: string;
  icon: 'map' | 'stamp' | 'store' | 'megaphone' | 'sprout';
  title: L;
  body: L;
  items: { id: ServiceId; name: L }[];
}

export const SERVICE_AREAS: ServiceArea[] = [
  {
    id: 'territorio',
    icon: 'map',
    title: { es: 'Territorio', en: 'Land & surveying' },
    body: {
      es: 'Medimos y dibujamos tu terreno con precisión, listo para aprobar, fraccionar y vender.',
      en: 'We measure and map your land precisely, ready for approvals, subdivision and sale.',
    },
    items: [
      { id: 'topografia', name: { es: 'Topografía', en: 'Topographic surveys' } },
      { id: 'georreferenciacion', name: { es: 'Levantamientos georreferenciados', en: 'Geo-referenced surveys' } },
      { id: 'planos', name: { es: 'Planos', en: 'Site plans and drawings' } },
      { id: 'fraccionamiento', name: { es: 'Fraccionamientos y lotizaciones', en: 'Subdivisions' } },
    ],
  },
  {
    id: 'tramites',
    icon: 'stamp',
    title: { es: 'Trámites', en: 'Permits & paperwork' },
    body: {
      es: 'Te acompañamos en notaría, municipio y registro, y ves en línea en qué etapa va cada trámite.',
      en: 'We handle the notary, municipality and property registry for you — and you can track every step online.',
    },
    items: [
      { id: 'compraventa', name: { es: 'Asesoría en compraventas', en: 'Purchase and sale advisory' } },
      { id: 'notariales', name: { es: 'Trámites notariales y de registro', en: 'Notary and registry filings' } },
      { id: 'municipales', name: { es: 'Trámites municipales', en: 'Municipal permits' } },
    ],
  },
  {
    id: 'comercializacion',
    icon: 'store',
    title: { es: 'Comercialización', en: 'Sales' },
    body: {
      es: 'Publicamos y vendemos tu proyecto con nuestra plataforma, nuestro equipo y la red de referidores.',
      en: 'We list and sell your project through our platform, our team and our referral network.',
    },
    items: [
      { id: 'publicacion', name: { es: 'Publicación y venta en la plataforma', en: 'Listing and sales on our platform' } },
      { id: 'recorridos-360', name: { es: 'Recorridos 360° de proyectos, terrenos, suites y departamentos', en: '360° tours of projects, land, suites and condos' } },
      { id: 'crm-mapa', name: { es: 'CRM y mapa interactivo para tu equipo', en: 'CRM and interactive map for your team' } },
    ],
  },
  {
    id: 'marketing',
    icon: 'megaphone',
    title: { es: 'Marketing', en: 'Marketing' },
    body: {
      es: 'Contamos tu proyecto con piezas que venden y medimos qué anuncio trae cada cliente.',
      en: 'We tell your project’s story with creative that sells — and track which ad brought in every buyer.',
    },
    items: [
      { id: 'landing', name: { es: 'Páginas de aterrizaje', en: 'Landing pages' } },
      { id: 'campanas', name: { es: 'Campañas en Google, Meta y TikTok', en: 'Google, Meta and TikTok campaigns' } },
      { id: 'audiovisual', name: { es: 'Producción audiovisual y dron', en: 'Video and drone production' } },
      { id: 'grafico', name: { es: 'Diseño gráfico', en: 'Graphic design' } },
    ],
  },
  {
    id: 'desarrollo',
    icon: 'sprout',
    title: { es: 'Desarrollo de proyectos', en: 'Project development' },
    body: {
      es: 'Convertimos un terreno en un proyecto: desde el diagnóstico hasta el plan maestro y su ejecución.',
      en: 'We turn a piece of land into a project — from the first assessment to the master plan and beyond.',
    },
    items: [
      { id: 'agroturismo', name: { es: 'Agroturismo', en: 'Agritourism' } },
      { id: 'residencial', name: { es: 'Proyectos residenciales', en: 'Residential projects' } },
      { id: 'forestal', name: { es: 'Proyectos forestales', en: 'Forestry projects' } },
      { id: 'agricultura', name: { es: 'Agricultura', en: 'Agriculture' } },
    ],
  },
];

export const ALL_SERVICES = SERVICE_AREAS.flatMap((a) => a.items);
export const serviceName = (id: string, lang: 'es' | 'en' = 'es') => ALL_SERVICES.find((s) => s.id === id)?.name[lang] ?? id;

export const SERVICES_STEPS: L[][] = [
  [{ es: 'Nos cuentas qué necesitas', en: 'Tell us what you need' }, { es: 'Por el formulario o por WhatsApp.', en: 'Through the form or on WhatsApp.' }],
  [{ es: 'Propuesta privada', en: 'A private proposal' }, { es: 'Alcance, plazos y valores, por escrito. La aceptas en línea.', en: 'Scope, timeline and pricing in writing. Accept it online.' }],
  [{ es: 'Expediente con seguimiento', en: 'A case you can track' }, { es: 'Un enlace privado te muestra cada etapa, lo que falta y quién lo tiene.', en: 'A private link shows every step, what’s pending and who has it.' }],
  [{ es: 'Entrega', en: 'Delivery' }, { es: 'Planos, escrituras, piezas o tu proyecto publicado.', en: 'Plans, deeds, creative or your project live.' }],
];
