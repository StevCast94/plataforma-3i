import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { cld } from '@/lib/cloudinary';
import { langFromPath, localizePath, stripLang } from '@/lib/i18n';

interface SeoProps {
  title: string;
  description?: string | null;
  image?: string | null;
  /** Páginas privadas (propuestas exclusivas): fuera de buscadores. */
  noindex?: boolean;
}

const SUFFIX = ' | Grupo 3i';
const ORIGIN = 'https://grupo3i.com';

export function Seo({ title, description, image, noindex }: SeoProps) {
  const { pathname } = useLocation();
  const lang = langFromPath(pathname);
  const bare = stripLang(pathname);
  const esUrl = ORIGIN + bare;
  const enUrl = ORIGIN + localizePath(bare, 'en');
  // Solo hay versión inglesa si la ruta está entre las traducidas.
  const hasEn = enUrl !== esUrl;

  const fullTitle = title.includes('Grupo 3i') ? title : title + SUFFIX;
  const desc = (description ?? '').slice(0, 160);
  const ogImage = image ? cld(image, { width: 1200 }) : undefined;

  return (
    <Helmet>
      <html lang={lang} />
      <title>{fullTitle}</title>
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {desc && <meta name="description" content={desc} />}
      <link rel="canonical" href={ORIGIN + pathname} />
      {/* Le dice a Google que son la misma página en dos idiomas, no contenido duplicado. */}
      {hasEn && !noindex && <link rel="alternate" hrefLang="es" href={esUrl} />}
      {hasEn && !noindex && <link rel="alternate" hrefLang="en" href={enUrl} />}
      {hasEn && !noindex && <link rel="alternate" hrefLang="x-default" href={esUrl} />}
      <meta property="og:title" content={fullTitle} />
      {desc && <meta property="og:description" content={desc} />}
      {ogImage && <meta property="og:image" content={ogImage} />}
      <meta property="og:locale" content={lang === 'en' ? 'en_US' : 'es_EC'} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
    </Helmet>
  );
}
