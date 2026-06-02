import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useProduct, useProducts } from '@/hooks/useProducts';
import { Seo } from '@/components/shared/Seo';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { ImageGallery } from '@/components/shared/ImageGallery';
import { PriceDisplay } from '@/components/shared/PriceDisplay';
import { ContactForm } from '@/components/shared/ContactForm';
import { ROICalculator } from '@/components/shared/ROICalculator';
import { ProductCard } from '@/components/shared/ProductCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { DetailSkeleton } from '@/components/shared/LoadingSkeleton';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { cld } from '@/lib/cloudinary';
import type { Product } from '@shared/types';

const typeLabels: Record<string, string> = {
  TRAVEL_MEMBERSHIP: 'Membresía',
  FRACTIONAL_PROPERTY: 'Propiedad Fraccionada',
  TRADITIONAL_PROPERTY: 'Propiedad',
  LAND: 'Terreno',
};

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { data: product, loading, error } = useProduct(slug);
  const { data: allProducts } = useProducts();
  const [open, setOpen] = useState(false);

  if (loading) return <DetailSkeleton />;
  if (error) return <ErrorState message={error} onRetry={() => location.reload()} />;
  if (!product)
    return (
      <EmptyState
        title="Producto no encontrado"
        message="Es posible que ya no esté disponible."
        ctaText="Volver a la tienda"
        ctaTo="/tienda"
        icon="🛍️"
      />
    );

  const features = Array.isArray(product.features) ? product.features : [];
  const gallery = product.images?.length ? product.images : [];
  const inquiryEndpoint = `/products/${product.id}/inquiry`;
  const related = (allProducts ?? [])
    .filter((p) => p.id !== product.id)
    .slice(0, 3);

  return (
    <>
      <Seo title={product.name} description={product.description} image={gallery[0]} />

      {/* 1. HERO SPLIT */}
      <section className="bg-light">
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'Inicio', to: '/' },
              { label: 'Tienda', to: '/tienda' },
              { label: product.name },
            ]}
          />
        </div>
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-5 lg:px-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-3"
          >
            <div className="overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-black/5">
              <img
                src={cld(gallery[0], { width: 1200 })}
                alt={product.name}
                className="h-[26rem] w-full object-cover sm:h-[32rem]"
              />
            </div>
          </motion.div>

          <div className="lg:col-span-2">
            <Badge>{typeLabels[product.type] ?? product.type}</Badge>
            <h1 className="mt-3 text-4xl font-bold text-primary">{product.name}</h1>
            <div className="mt-4">
              <PriceDisplay price={product.price} promoPrice={product.promoPrice} />
            </div>
            <p className="mt-5 leading-relaxed text-primary/80">{product.description}</p>

            {features.length > 0 && (
              <ul className="mt-6 space-y-2">
                {features.slice(0, 5).map((f) => (
                  <li key={f} className="flex items-start gap-3 text-primary/90">
                    <span className="mt-0.5 text-secondary">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            )}

            <Button size="lg" className="mt-8 w-full sm:w-auto" onClick={() => setOpen(true)}>
              Solicitar información
            </Button>
          </div>
        </div>
      </section>

      {/* 2 / 3. CONTENIDO SEGÚN TIPO */}
      {product.type === 'TRAVEL_MEMBERSHIP' ? (
        <MembershipSections product={product} features={features} />
      ) : (
        <PropertySections product={product} />
      )}

      {/* 4. GALERÍA */}
      {gallery.length > 1 && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-center text-3xl font-bold text-primary">Galería</h2>
          <ImageGallery images={gallery} alt={product.name} />
        </section>
      )}

      {/* 5. RELACIONADOS */}
      {related.length > 0 && (
        <section className="bg-light">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <h2 className="mb-8 text-2xl font-bold text-primary">También te puede interesar</h2>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={`Solicitar: ${product.name}`}>
        <ContactForm
          endpoint={inquiryEndpoint}
          withMessage
          inlineSuccess={false}
          onSuccess={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}

/* ============ MEMBRESÍA ============ */

function Countdown() {
  // Cuenta regresiva al fin del mes en curso (precio de lanzamiento).
  const target = (() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).getTime();
  })();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = Math.max(target - now, 0);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  const cells = [
    { v: days, l: 'días' },
    { v: hours, l: 'hrs' },
    { v: mins, l: 'min' },
    { v: secs, l: 'seg' },
  ];

  return (
    <div className="flex justify-center gap-3">
      {cells.map((c) => (
        <div key={c.l} className="w-16 rounded-xl bg-white/10 py-3 text-center">
          <p className="font-serif text-2xl font-bold">{String(c.v).padStart(2, '0')}</p>
          <p className="text-xs uppercase tracking-wider text-white/60">{c.l}</p>
        </div>
      ))}
    </div>
  );
}

const testimonials = [
  { name: 'María L.', text: 'Ahorré más del 60% en mi viaje a Cancún. La membresía se pagó sola.' },
  { name: 'Jorge P.', text: 'El certificado vacacional anual es increíble. Ya lo usé dos veces.' },
  { name: 'Andrea V.', text: 'Atención de primera y descuentos reales en hoteles top.' },
];

function MembershipSections({
  product,
  features,
}: {
  product: Product;
  features: string[];
}) {
  return (
    <>
      {product.promoPrice && (
        <section className="bg-primary text-white">
          <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6">
            <Badge variant="gold" className="mb-4">Precio de lanzamiento</Badge>
            <h2 className="text-2xl font-bold sm:text-3xl">
              Aprovecha el precio especial antes de que suba
            </h2>
            <p className="mt-2 text-white/70">La oferta termina en:</p>
            <div className="mt-6">
              <Countdown />
            </div>
          </div>
        </section>
      )}

      {features.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="mb-10 text-center text-3xl font-bold text-primary sm:text-4xl">
            Beneficios
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f}
                className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5"
              >
                <span className="text-2xl text-secondary">✦</span>
                <p className="mt-3 font-medium text-primary">{f}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Testimonios placeholder */}
      <section className="bg-light">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="mb-10 text-center text-3xl font-bold text-primary">
            Lo que dicen nuestros miembros
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <figure
                key={t.name}
                className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5"
              >
                <blockquote className="text-primary/80">“{t.text}”</blockquote>
                <figcaption className="mt-4 text-sm font-semibold text-accent">
                  — {t.name}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

/* ============ PROPIEDADES ============ */

function PropertySections({ product }: { product: Product }) {
  return (
    <>
      {product.project && (
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <Link
            to={`/proyectos/${product.project.slug}`}
            className="flex items-center gap-5 rounded-2xl bg-light p-5 transition hover:shadow-md"
          >
            {product.project.coverImage && (
              <img
                src={cld(product.project.coverImage, { width: 240 })}
                alt={product.project.name}
                className="h-24 w-32 flex-none rounded-xl object-cover"
              />
            )}
            <div>
              <p className="text-xs uppercase tracking-wider text-brand-gray">
                Parte del proyecto
              </p>
              <p className="text-xl font-bold text-primary">{product.project.name}</p>
              {product.project.location && (
                <p className="text-sm text-brand-gray">{product.project.location}</p>
              )}
              <span className="mt-1 inline-block text-sm font-medium text-accent">
                Ver proyecto →
              </span>
            </div>
          </Link>
        </section>
      )}

      <ROICalculator fractionPrice={product.promoPrice ?? product.price} />
    </>
  );
}
