import { Helmet } from 'react-helmet-async';
import { cld } from '@/lib/cloudinary';

interface SeoProps {
  title: string;
  description?: string | null;
  image?: string | null;
  /** Páginas privadas (propuestas exclusivas): fuera de buscadores. */
  noindex?: boolean;
}

const SUFFIX = ' | Grupo 3i';

export function Seo({ title, description, image, noindex }: SeoProps) {
  const fullTitle = title.includes('Grupo 3i') ? title : title + SUFFIX;
  const desc = (description ?? '').slice(0, 160);
  const ogImage = image ? cld(image, { width: 1200 }) : undefined;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {desc && <meta name="description" content={desc} />}
      <meta property="og:title" content={fullTitle} />
      {desc && <meta property="og:description" content={desc} />}
      {ogImage && <meta property="og:image" content={ogImage} />}
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
    </Helmet>
  );
}
