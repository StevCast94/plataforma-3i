import { PageHeader } from '@/components/layout/PageHeader';
import { CTASection } from '@/components/shared/CTASection';
import { useSectionContent } from '@/hooks/useSiteContent';

const pillars = [
  {
    title: 'Inversión accesible',
    body: 'Democratizamos la inversión inmobiliaria con propiedades fraccionadas desde $5,000.',
    image: '/images/secciones/pilar-inversion.jpg',
  },
  {
    title: 'Proyectos premium',
    body: 'Desarrollos de alto nivel como Ibiza Condohotel y Montañita View.',
    image: '/images/secciones/pilar-proyectos.jpg',
  },
  {
    title: 'Experiencias',
    body: 'Membresías de viaje y acceso VIP a amenidades exclusivas.',
    image: '/images/secciones/pilar-experiencias.jpg',
  },
];

export default function AboutPage() {
  const { data } = useSectionContent('about');

  return (
    <>
      <PageHeader
        title={data?.title ?? 'Sobre Grupo 3i'}
        subtitle="Inversión inmobiliaria inteligente."
        image="/images/secciones/header-nosotros.jpg"
      />

      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <p className="text-lg leading-relaxed text-primary/80">
          {data?.body ??
            'Somos un grupo inmobiliario enfocado en democratizar la inversión a través de propiedades fraccionadas, membresías de viaje y proyectos de alto nivel en Ecuador.'}
        </p>
      </section>

      {/* Nuestra historia */}
      <section className="mx-auto max-w-6xl px-4 pb-4 sm:px-6">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <img
            src="/images/secciones/nosotros-historia.jpg"
            alt="Construcción de uno de nuestros proyectos en la costa"
            className="aspect-[4/3] w-full rounded-2xl object-cover shadow-lg"
          />
          <div>
            <h2 className="text-3xl text-primary sm:text-4xl">Nuestra historia</h2>
            <p className="mt-4 text-brand-gray">
              Empezamos con una convicción simple: la inversión inmobiliaria de alto nivel no
              debería estar reservada para unos pocos. Fraccionamos proyectos premium en la costa
              ecuatoriana para que más personas puedan construir patrimonio real, con la misma
              calidad y transparencia que exigiríamos para nuestra propia inversión.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-light">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-3">
          {pillars.map((p) => (
            <div key={p.title} className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <img src={p.image} alt="" className="h-40 w-full object-cover" />
              <div className="p-8">
                <h3 className="text-xl text-primary">{p.title}</h3>
                <p className="mt-3 text-sm text-brand-gray">{p.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <CTASection
        title="¿Listo para invertir con nosotros?"
        subtitle="Conversemos sobre la oportunidad ideal para ti."
        ctaText="Contáctanos"
        ctaTo="/contacto"
        image="/images/secciones/cta-invertir.jpg"
      />
    </>
  );
}
