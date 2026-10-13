// Catálogo de servicios integrales y plantillas de trámite (docs/PLAN-SERVICIOS-INTEGRALES.md).
// Los textos públicos de cada servicio viven en frontend/src/lib/services.ts (mismos ids).
// Las etapas de cada plantilla son un punto de partida: el equipo las ajusta en cada expediente.

export const SERVICE_IDS = [
  // Territorio
  'topografia', 'georreferenciacion', 'planos', 'fraccionamiento',
  // Trámites
  'compraventa', 'notariales', 'municipales',
  // Comercialización
  'publicacion', 'recorridos-360', 'crm-mapa',
  // Marketing
  'landing', 'campanas', 'audiovisual', 'grafico',
  // Desarrollo de proyectos
  'agroturismo', 'residencial', 'forestal', 'agricultura',
] as const;

export type ServiceId = (typeof SERVICE_IDS)[number];

export const SERVICE_NAMES: Record<ServiceId, string> = {
  topografia: 'Topografía',
  georreferenciacion: 'Levantamiento georreferenciado',
  planos: 'Planos',
  fraccionamiento: 'Fraccionamiento o lotización',
  compraventa: 'Asesoría en compraventas',
  notariales: 'Trámites notariales y de registro',
  municipales: 'Trámites municipales',
  publicacion: 'Publicación y venta en la plataforma',
  'recorridos-360': 'Recorridos 360°',
  'crm-mapa': 'CRM y mapa interactivo',
  landing: 'Páginas de aterrizaje',
  campanas: 'Campañas de marketing',
  audiovisual: 'Producción audiovisual',
  grafico: 'Diseño gráfico',
  agroturismo: 'Proyecto de agroturismo',
  residencial: 'Proyecto residencial',
  forestal: 'Proyecto forestal',
  agricultura: 'Proyecto agrícola',
};

export const cleanServices = (v: unknown): ServiceId[] =>
  Array.isArray(v) ? [...new Set(v.map(String).filter((s): s is ServiceId => SERVICE_IDS.includes(s as ServiceId)))] : [];

export type Party = 'team' | 'client' | 'institution';
export interface TemplateStep {
  title: string;
  titleEn: string;
  party: Party;
  institution?: string;
  dueDays?: number;
  requirements?: string[];
}
export interface CaseTemplate {
  id: string;
  name: string;
  services: ServiceId[];
  steps: TemplateStep[];
}

const s = (title: string, titleEn: string, party: Party, dueDays?: number, extra: Partial<TemplateStep> = {}): TemplateStep => ({ title, titleEn, party, dueDays, ...extra });

export const CASE_TEMPLATES: CaseTemplate[] = [
  {
    id: 'topografia',
    name: 'Levantamiento topográfico y planos',
    services: ['topografia', 'georreferenciacion', 'planos'],
    steps: [
      s('Documentos del predio', 'Property documents', 'client', 3, { requirements: ['Escritura o título', 'Pago del predio al día', 'Cédula del propietario'] }),
      s('Visita y levantamiento en campo (GPS / dron)', 'Site visit and field survey (GPS / drone)', 'team', 7),
      s('Procesamiento y dibujo', 'Processing and drafting', 'team', 7),
      s('Revisión del plano con el cliente', 'Plan review with the client', 'client', 3),
      s('Plano firmado y entrega digital', 'Signed plan and digital delivery', 'team', 3),
    ],
  },
  {
    id: 'fraccionamiento',
    name: 'Fraccionamiento o lotización',
    services: ['fraccionamiento'],
    steps: [
      s('Documentos del predio', 'Property documents', 'client', 5, { requirements: ['Escritura inscrita', 'Certificado de gravámenes', 'Pago del predio al día', 'Cédula del propietario'] }),
      s('Levantamiento topográfico georreferenciado', 'Geo-referenced survey', 'team', 10),
      s('Anteproyecto de lotización', 'Preliminary subdivision plan', 'team', 15),
      s('Informe de regulación municipal', 'Municipal zoning report', 'institution', 15, { institution: 'Municipio' }),
      s('Proyecto definitivo y aprobación municipal', 'Final plan and municipal approval', 'institution', 45, { institution: 'Municipio' }),
      s('Protocolización en notaría', 'Notarization', 'institution', 10, { institution: 'Notaría' }),
      s('Inscripción en el Registro de la Propiedad', 'Property Registry filing', 'institution', 20, { institution: 'Registro de la Propiedad' }),
      s('Claves catastrales por lote', 'Cadastral codes for each lot', 'institution', 20, { institution: 'Catastro municipal' }),
      s('Entrega del expediente y carga del inventario', 'Case file delivery and inventory upload', 'team', 5),
    ],
  },
  {
    id: 'compraventa',
    name: 'Compraventa (notaría y registro)',
    services: ['compraventa', 'notariales'],
    steps: [
      s('Documentos de comprador y vendedor', 'Buyer and seller documents', 'client', 3, { requirements: ['Cédulas y certificados de votación', 'Escritura del vendedor', 'Pago del predio al día'] }),
      s('Certificado de gravámenes', 'Lien certificate', 'institution', 5, { institution: 'Registro de la Propiedad' }),
      s('Pago de alcabala y plusvalía', 'Transfer taxes', 'institution', 5, { institution: 'Municipio' }),
      s('Minuta', 'Draft deed', 'team', 3),
      s('Firma de la escritura', 'Deed signing', 'institution', 5, { institution: 'Notaría' }),
      s('Inscripción en el Registro de la Propiedad', 'Property Registry filing', 'institution', 15, { institution: 'Registro de la Propiedad' }),
      s('Actualización del catastro', 'Cadastre update', 'institution', 10, { institution: 'Catastro municipal' }),
      s('Entrega de la escritura inscrita', 'Delivery of the registered deed', 'team', 2),
    ],
  },
  {
    id: 'municipal',
    name: 'Trámite municipal',
    services: ['municipales'],
    steps: [
      s('Documentos del trámite', 'Paperwork', 'client', 3, { requirements: ['Escritura', 'Pago del predio al día', 'Cédula del propietario'] }),
      s('Preparación de la solicitud y planos', 'Application and plans', 'team', 7),
      s('Ingreso al municipio', 'Filing with the municipality', 'team', 2),
      s('Inspección y revisión municipal', 'Municipal inspection and review', 'institution', 30, { institution: 'Municipio' }),
      s('Pago de tasas', 'Fees', 'client', 3),
      s('Entrega del documento aprobado', 'Approved document delivered', 'team', 3),
    ],
  },
  {
    id: 'publicacion',
    name: 'Publicación y venta en la plataforma',
    services: ['publicacion', 'recorridos-360', 'crm-mapa'],
    steps: [
      s('Información del proyecto e inventario', 'Project details and inventory', 'client', 5, { requirements: ['Fotos y planos', 'Lista de unidades con precios', 'Documentos legales para la verificación'] }),
      s('Verificación legal', 'Legal vetting', 'team', 7),
      s('Recorridos 360° y fotos', '360° tours and photos', 'team', 7),
      s('Carga del proyecto en español e inglés', 'Listing set up in Spanish and English', 'team', 5),
      s('Revisión y aprobación del cliente', 'Client review and sign-off', 'client', 3),
      s('Publicación y capacitación del equipo de ventas', 'Launch and sales team training', 'team', 3),
    ],
  },
  {
    id: 'marketing',
    name: 'Campaña de marketing',
    services: ['landing', 'campanas', 'grafico'],
    steps: [
      s('Brief y objetivos', 'Brief and goals', 'client', 3),
      s('Página de aterrizaje y piezas gráficas', 'Landing page and creative', 'team', 10),
      s('Aprobación del cliente', 'Client approval', 'client', 3),
      s('Publicación de la campaña', 'Campaign launch', 'team', 2),
      s('Reporte de resultados', 'Results report', 'team', 30),
    ],
  },
  {
    id: 'audiovisual',
    name: 'Producción audiovisual',
    services: ['audiovisual'],
    steps: [
      s('Brief y guion', 'Brief and script', 'team', 5),
      s('Aprobación del guion', 'Script approval', 'client', 3),
      s('Rodaje y vuelo de dron', 'Shoot and drone flight', 'team', 7),
      s('Edición', 'Editing', 'team', 10),
      s('Revisión del cliente', 'Client review', 'client', 3),
      s('Entrega final', 'Final delivery', 'team', 3),
    ],
  },
  {
    id: 'desarrollo',
    name: 'Desarrollo de proyecto (agroturismo, residencial, forestal o agrícola)',
    services: ['agroturismo', 'residencial', 'forestal', 'agricultura'],
    steps: [
      s('Diagnóstico del terreno', 'Site assessment', 'team', 10),
      s('Concepto del proyecto', 'Project concept', 'team', 15),
      s('Estudios técnicos y permisos necesarios', 'Technical studies and required permits', 'team', 30),
      s('Plan maestro', 'Master plan', 'team', 20),
      s('Presupuesto y cronograma', 'Budget and schedule', 'team', 10),
      s('Aprobación del cliente', 'Client approval', 'client', 5),
      s('Acompañamiento de la ejecución', 'Implementation support', 'team', 90),
    ],
  },
  {
    id: 'generico',
    name: 'Servicio a la medida',
    services: [],
    steps: [
      s('Inicio y documentos', 'Kick-off and documents', 'client', 3),
      s('Ejecución', 'Execution', 'team', 15),
      s('Revisión del cliente', 'Client review', 'client', 3),
      s('Entrega', 'Delivery', 'team', 3),
    ],
  },
];

export const templateById = (id?: string | null) => CASE_TEMPLATES.find((t) => t.id === id) ?? CASE_TEMPLATES[CASE_TEMPLATES.length - 1];

/** Plantilla sugerida para un servicio. */
export const templateForService = (sid: string) => CASE_TEMPLATES.find((t) => t.services.includes(sid as ServiceId)) ?? templateById('generico');
