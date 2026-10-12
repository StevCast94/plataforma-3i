// Tipos de proyecto que pueden publicar las desarrolladoras (categorías al estilo de los
// portales de la región). Fase 1: solo el mensaje y el formulario de alta. En la Fase 2
// cada proyecto y cada unidad tendrán su tipo en la base de datos.
// El inglés de cada etiqueta vive en lib/en.ts.

export const PROPERTY_TYPES = [
  { id: 'lotes', label: 'Lotes' },
  { id: 'casas', label: 'Casas' },
  { id: 'departamentos', label: 'Departamentos' },
  { id: 'suites', label: 'Suites' },
  { id: 'locales', label: 'Locales comerciales' },
  { id: 'oficinas', label: 'Oficinas' },
  { id: 'bodegas', label: 'Bodegas y galpones' },
  { id: 'macrolotes', label: 'Macrolotes' },
] as const;

export type PropertyTypeId = (typeof PROPERTY_TYPES)[number]['id'];
