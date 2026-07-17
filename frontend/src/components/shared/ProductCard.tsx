import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PriceDisplay } from './PriceDisplay';
import { cld } from '@/lib/cloudinary';
import type { Product } from '@shared/types';

const typeLabels: Record<string, string> = {
  TRAVEL_MEMBERSHIP: 'Membresía',
  FRACTIONAL_PROPERTY: 'Fraccionada',
  TRADITIONAL_PROPERTY: 'Propiedad',
  LAND: 'Terreno',
};

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link to={`/tienda/${product.slug}`}>
      <Card className="group flex h-full flex-col">
        <div className="relative h-52 overflow-hidden">
          <img
            src={cld(product.images?.[0], { width: 800 })}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <Badge className="absolute left-4 top-4">
            {typeLabels[product.type] ?? product.type}
          </Badge>
        </div>
        <div className="flex flex-1 flex-col p-6">
          <h3 className="text-xl text-primary">{product.name}</h3>
          <p className="mt-2 line-clamp-2 flex-1 text-sm text-brand-gray">
            {product.description}
          </p>
          <div className="mt-4">
            <PriceDisplay price={product.price} promoPrice={product.promoPrice} compact />
          </div>
        </div>
      </Card>
    </Link>
  );
}
