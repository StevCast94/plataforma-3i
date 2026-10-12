// Tipos de proyecto que pueden publicar las desarrolladoras (categorías al estilo de los
// portales de la región). Cada proyecto guarda los suyos en `propertyTypes` y cada unidad
// del inventario el suyo en `unitType` (mismos ids). El inglés vive en lib/en.ts.

export const PROPERTY_TYPES = [
  { id: 'lotes', label: 'Lotes', unit: 'Lote', built: false },
  { id: 'casas', label: 'Casas', unit: 'Casa', built: true },
  { id: 'departamentos', label: 'Departamentos', unit: 'Departamento', built: true },
  { id: 'suites', label: 'Suites', unit: 'Suite', built: true },
  { id: 'locales', label: 'Locales comerciales', unit: 'Local', built: true },
  { id: 'oficinas', label: 'Oficinas', unit: 'Oficina', built: true },
  { id: 'bodegas', label: 'Bodegas y galpones', unit: 'Bodega', built: true },
  { id: 'macrolotes', label: 'Macrolotes', unit: 'Macrolote', built: false },
] as const;

export type PropertyTypeId = (typeof PROPERTY_TYPES)[number]['id'];

export const typeInfo = (id?: string | null) => PROPERTY_TYPES.find((p) => p.id === id) ?? PROPERTY_TYPES[0];

/** Nombre de una unidad sin traducir: «Lote A-12», «Departamento 4B». Pasar por t() la palabra. */
export const unitWord = (unitType?: string | null) => typeInfo(unitType).unit;

/** Tiene construcción: muestra dormitorios, baños y área construida. */
export const isBuilt = (unitType?: string | null) => typeInfo(unitType).built;
