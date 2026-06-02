import { PageHeader } from '@/components/layout/PageHeader';
import { CTASection } from '@/components/shared/CTASection';
import { useSectionContent } from '@/hooks/useSiteContent';

const pillars = [
  {
    title: 'Inversión accesible',
    body: 'Democratizamos la inversión inmobiliaria con propiedades fraccionadas desde $5,000.',
  },
  {
    title: 'Proyectos premium',
    body: 'Desarrollos de alto nivel como Ibiza Condohotel y Montañita View.',
  },
  {
    title: 'Experiencias',
    body: 'Membresías de viaje y acceso VIP a amenidades exclusivas.',
  },
];

export default function AboutPage() {
  const { data } = useSectionContent('about');

  return (
    <>
      <PageHeader
        title={data?.title ?? 'Sobre Grupo 3i'}
        subtitle="Inversión inmobiliaria inteligente."
      />

      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <p className="text-lg leading-relaxed text-primary/80">
          {data?.body ??
            'Somos un grupo inmobiliario enfocado en democratizar la inversión a través de propiedades fraccionadas, membresías de viaje y proyectos de alto nivel en Ecuador.'}
        </p>
      </section>

      <section className="bg-light">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-3">
          {pillars.map((p) => (
            <div key={p.title} className="rounded-2xl bg-white p-8 shadow-sm">
              <h3 className="text-xl text-primary">{p.title}</h3>
              <p className="mt-3 text-sm text-brand-gray">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <CTASection
        title="¿Listo para invertir con nosotros?"
        subtitle="Conversemos sobre la oportunidad ideal para ti."
        ctaText="Contáctanos"
        ctaTo="/contacto"
      />
    </>
  );
}
