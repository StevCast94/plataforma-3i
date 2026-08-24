import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PriceDisplay } from '@/components/shared/PriceDisplay';
import { useSectionContent } from '@/hooks/useSiteContent';
import { useProducts } from '@/hooks/useProducts';

export default function ClubPage() {
  const { data: club } = useSectionContent('club');
  const { data: products } = useProducts();

  const membership = (products ?? []).find((p) => p.type === 'TRAVEL_MEMBERSHIP');
  const features = Array.isArray(membership?.features) ? membership.features : [];

  return (
    <>
      {/* HERO CLUB */}
      <section className="relative isolate overflow-hidden bg-primary text-white">
        <img
          src="/images/secciones/hero-club.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 -z-10 h-full w-full object-cover opacity-80"
        />
        <div className="absolute inset-0 -z-10 bg-primary/70" />
        <div className="relative mx-auto max-w-5xl px-4 py-24 text-center sm:px-6">
          <img src="/images/isotipo-light.svg" alt="Grupo 3i" className="mx-auto mb-5 h-14 w-auto" />
          <Badge variant="solid" className="mb-5">Club 3i</Badge>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold sm:text-6xl"
          >
            {club?.title ?? 'Únete al Club 3i'}
          </motion.h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/80">
            {club?.subtitle ??
              'Viaja por el mundo con descuentos de hasta 70% y accede a beneficios exclusivos.'}
          </p>
          <div className="mt-8">
            <Link to="/club/viajes">
              <Button size="lg">Explorar viajes</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* MEMBRESÍA */}
      {membership && (
        <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
          <div className="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-black/5">
            <div className="bg-light p-8 text-center">
              <h2 className="text-3xl text-primary">{membership.name}</h2>
              <div className="mt-4 flex justify-center">
                <PriceDisplay price={membership.price} promoPrice={membership.promoPrice} />
              </div>
              {membership.promoPrice && (
                <p className="mt-2 text-sm font-medium text-accent">
                  Precio de lanzamiento por tiempo limitado
                </p>
              )}
            </div>

            <div className="p-8">
              <ul className="grid gap-3 sm:grid-cols-2">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-primary/90">
                    <span className="mt-1 text-secondary">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-10 text-center">
                <Link to={`/tienda/${membership.slug}`}>
                  <Button size="lg">Quiero mi membresía</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {!membership && (
        <section className="mx-auto max-w-3xl px-4 py-20 text-center">
          <p className="text-brand-gray">
            Pronto tendrás disponible la información de la membresía.
          </p>
          <Link to="/contacto" className="mt-6 inline-block">
            <Button variant="outline">Déjanos tus datos</Button>
          </Link>
        </section>
      )}
    </>
  );
}
