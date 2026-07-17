import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface PriceDisplayProps {
  price: number;
  promoPrice?: number | null;
  label?: string | null;
  /** Fila compacta (cards de listado, resúmenes) — sin etiqueta, número más chico. */
  compact?: boolean;
}

export function PriceDisplay({ price, promoPrice, label, compact }: PriceDisplayProps) {
  if (label) {
    return (
      <span className="block">
        {!compact && (
          <span className="block text-xs font-semibold uppercase tracking-[0.15em] text-brand-gray">
            Precio
          </span>
        )}
        <span className={cn('font-serif font-bold text-accent', compact ? 'text-lg' : 'text-2xl')}>
          {label}
        </span>
      </span>
    );
  }

  if (promoPrice != null && promoPrice < price) {
    return (
      <span className="block">
        {!compact && (
          <span className="block text-xs font-semibold uppercase tracking-[0.15em] text-brand-gray">
            Precio de lanzamiento
          </span>
        )}
        <span className="flex items-baseline gap-2">
          <span
            className={cn(
              'font-serif font-bold text-accent',
              compact ? 'text-xl' : 'text-4xl',
            )}
          >
            {formatCurrency(promoPrice)}
          </span>
          <span className={cn('text-brand-gray line-through', compact ? 'text-sm' : 'text-base')}>
            {formatCurrency(price)}
          </span>
        </span>
      </span>
    );
  }

  return (
    <span className="block">
      {!compact && (
        <span className="block text-xs font-semibold uppercase tracking-[0.15em] text-brand-gray">
          Precio
        </span>
      )}
      <span
        className={cn('font-serif font-bold text-primary', compact ? 'text-xl' : 'text-4xl')}
      >
        {formatCurrency(price)}
      </span>
    </span>
  );
}
