import { PageHeader } from '@/components/layout/PageHeader';
import { ProductCard } from '@/components/shared/ProductCard';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { useProducts } from '@/hooks/useProducts';

export default function ShopPage() {
  const { data, loading, error } = useProducts();

  return (
    <>
      <PageHeader
        title="Tienda"
        subtitle="Membresías, propiedades fraccionadas y oportunidades de inversión."
        image="/images/secciones/header-tienda.jpg"
      />
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {error && <p className="text-center text-red-600">{error}</p>}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
            : (data ?? []).map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
        {!loading && (data?.length ?? 0) === 0 && (
          <p className="text-center text-brand-gray">No hay productos disponibles aún.</p>
        )}
      </section>
    </>
  );
}
