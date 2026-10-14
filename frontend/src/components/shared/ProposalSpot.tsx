import type { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';
import { Link, useLang } from '@/hooks/useLang';

// «Aquí va…»: en las fichas armadas como propuesta para una desarrolladora
// (brochureContent.proposal = true) marca dónde irá cada herramienta que aún
// no está cargada (mapa interactivo, recorrido virtual…), con un ejemplo real.
export const isProposal = (content: unknown) => Boolean((content as { proposal?: boolean } | null)?.proposal);

export function ProposalSpot({ title, body, example, exampleTo, image, children }: {
  title: string; body: string; example?: string; exampleTo?: string; image?: string; children?: ReactNode;
}) {
  const { t } = useLang();
  return (
    <div className="rounded-2xl border-2 border-dashed border-accent/60 bg-accent/5 p-5 sm:p-6 print:hidden">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
        <Sparkles className="h-4 w-4" aria-hidden /> {t('Propuesta · aquí irá')}
      </p>
      <div className={`mt-3 grid items-center gap-5 ${image ? 'md:grid-cols-[1fr_1.2fr]' : ''}`}>
        <div>
          <p className="font-serif text-2xl font-bold text-primary">{t(title)}</p>
          <p className="mt-2 text-sm text-brand-gray">{t(body)}</p>
          {example && exampleTo && (
            <Link to={exampleTo} target="_blank" className="mt-4 inline-block text-sm font-semibold text-accent underline-offset-4 hover:underline">
              {t(example)} →
            </Link>
          )}
          {children}
        </div>
        {image && <img src={image} alt="" loading="lazy" className="w-full rounded-xl shadow-md ring-1 ring-black/10" />}
      </div>
    </div>
  );
}
