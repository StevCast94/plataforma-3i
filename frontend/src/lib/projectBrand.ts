/** Logos de marca propios de cada proyecto (si tiene). light = sobre fotos oscuras. */
const BRANDS: Record<string, { light: string; dark: string }> = {
  'ibiza-condohotel': {
    light: '/images/proyectos/ibiza/logo-light.svg',
    dark: '/images/proyectos/ibiza/logo.svg',
  },
};

export function projectBrand(slug?: string | null) {
  return slug ? BRANDS[slug] : undefined;
}
