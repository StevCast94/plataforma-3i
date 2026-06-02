import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProduct } from '@/hooks/useProducts';
import { ImageGallery } from '@/components/shared/ImageGallery';
import { PriceDisplay } from '@/components/shared/PriceDisplay';
import { ContactForm } from '@/components/shared/ContactForm';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { data: product, loading, error } = useProduct(slug);
  const [open, setOpen] = useState(false);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="mt-6 h-8 w-1/2" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-3xl text-primary">Producto no encontrado</h1>
        <Link to="/tienda" className="mt-6 inline-block">
          <Button variant="outline">Volver a la tienda</Button>
        </Link>
      </div>
    );
  }

  const features = Array.isArray(product.features) ? product.features : [];
  const gallery = product.images?.length ? product.images : [];

  return (
    <article className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-2">
        {gallery.length > 0 && <ImageGallery images={gallery} alt={product.name} />}

        <div>
          <h1 className="text-4xl font-bold text-primary">{product.name}</h1>
          <div className="mt-4">
            <PriceDisplay price={product.price} promoPrice={product.promoPrice} />
          </div>
          <p className="mt-6 leading-relaxed text-primary/80">{product.description}</p>

          {features.length > 0 && (
            <ul className="mt-7 space-y-2">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-3 text-primary/90">
                  <span className="mt-1 text-secondary">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          )}

          <Button size="lg" className="mt-9" onClick={() => setOpen(true)}>
            Solicitar información
          </Button>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={`Solicitar info: ${product.name}`}>
        <ContactForm endpoint={`/products/${product.id}/inquiry`} />
      </Modal>
    </article>
  );
}
