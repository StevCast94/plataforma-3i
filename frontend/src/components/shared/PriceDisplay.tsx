import { formatCurrency } from '@/lib/utils';

interface PriceDisplayProps {
  price: number;
  promoPrice?: number | null;
  label?: string | null;
}

export function PriceDisplay({ price, promoPrice, label }: PriceDisplayProps) {
  if (label) {
    return <span className="text-lg font-semibold text-accent">{label}</span>;
  }

  if (promoPrice != null && promoPrice < price) {
    return (
      <span className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-accent">
          {formatCurrency(promoPrice)}
        </span>
        <span className="text-base text-brand-gray line-through">
          {formatCurrency(price)}
        </span>
      </span>
    );
  }

  return (
    <span className="text-2xl font-bold text-primary">{formatCurrency(price)}</span>
  );
}
