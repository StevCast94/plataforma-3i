import { Sparkle } from 'lucide-react';
import { useLang } from '@/hooks/useLang';
import { IconMedallion, IconPlane, IconSparkle } from '@/components/icons/TravelIcons';

// ============================================================
// Copy de marketing del programa de referidos (doble incentivo).
// variant 'buyer'  → en la ficha de producto INMOBILIARIO (lo ve el visitante).
// variant 'member' → en las herramientas del socio (cómo gana al compartir).
// ============================================================

export function ReferralPerks({ variant }: { variant: 'buyer' | 'member' }) {
  const { t } = useLang();
  if (variant === 'buyer') {
    return (
      <div className="rounded-2xl bg-primary p-5 text-white ring-1 ring-secondary/30">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex-none text-secondary">
            <IconPlane className="h-6 w-6" />
          </span>
          <div>
            <p className="font-semibold text-secondary">{t('¿Llegaste por el enlace de un socio?')}</p>
            <p className="mt-1 text-sm text-white/80">
              {t(
                'Al comprar este producto inmobiliario pasas automáticamente al nivel Elite de Refiere y gana: ganas el doble de comisión cuando recomiendes a otros.',
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-light p-5 ring-1 ring-secondary/30">
      <div className="flex items-center gap-2">
        <IconMedallion className="h-7 w-7">
          <IconSparkle className="h-4 w-4" />
        </IconMedallion>
        <h3 className="font-serif text-lg font-bold text-primary">{t('Doble incentivo')}</h3>
      </div>
      <ul className="mt-3 space-y-2 text-sm text-primary/80">
        <li className="flex gap-2">
          <Sparkle className="mt-0.5 h-4 w-4 flex-none text-secondary" strokeWidth={1.6} />
          <span>
            <strong>{t('Tu invitado gana:')}</strong>{' '}
            {t('pasa a Elite cuando compra un producto inmobiliario con tu enlace.')}
          </span>
        </li>
        <li className="flex gap-2">
          <Sparkle className="mt-0.5 h-4 w-4 flex-none text-secondary" strokeWidth={1.6} />
          <span>
            <strong>{t('Tú ganas:')}</strong>{' '}
            {t('tu comisión por cada venta y, con tu primer referido, pasas a Elite.')}
          </span>
        </li>
      </ul>
    </div>
  );
}
