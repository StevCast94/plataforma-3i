import type { ReactNode } from 'react';
import { Seo } from '@/components/shared/Seo';

// Plantilla común de las páginas legales (privacidad y términos).

export interface LegalSection {
  title: string;
  body: ReactNode[];
}

export interface LegalText {
  seoTitle: string;
  seoDesc: string;
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}

export function LegalDoc({ doc }: { doc: LegalText }) {
  return (
    <div className="bg-light">
      <Seo title={doc.seoTitle} description={doc.seoDesc} />
      <header className="bg-primary text-white">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <h1 className="font-serif text-3xl font-bold sm:text-4xl">{doc.title}</h1>
          <p className="mt-2 text-white/70">{doc.updated}</p>
        </div>
      </header>
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <p className="text-lg leading-relaxed text-primary/80">{doc.intro}</p>
        {doc.sections.map((s) => (
          <section key={s.title} className="mt-10">
            <h2 className="font-serif text-xl font-bold text-primary">{s.title}</h2>
            <div className="mt-3 space-y-3 leading-relaxed text-primary/80">
              {s.body.map((b, i) => (
                <div key={i}>{b}</div>
              ))}
            </div>
          </section>
        ))}
      </article>
    </div>
  );
}

export function List({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  );
}
