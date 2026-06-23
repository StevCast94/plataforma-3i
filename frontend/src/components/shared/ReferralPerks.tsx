import { IconMedallion, IconPlane } from '@/components/icons/TravelIcons';

// ============================================================
// Copy de marketing del programa de referidos (doble incentivo).
// variant 'buyer'  → en la ficha de producto INMOBILIARIO (lo ve el visitante).
// variant 'member' → en las herramientas del socio (cómo gana al compartir).
// ============================================================

export function ReferralPerks({ variant }: { variant: 'buyer' | 'member' }) {
  if (variant === 'buyer') {
    return (
      <div className="rounded-2xl bg-primary p-5 text-white ring-1 ring-secondary/30">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex-none text-secondary">
            <IconPlane className="h-6 w-6" />
          </span>
          <div>
            <p className="font-semibold text-secondary">¿Llegaste por el enlace de un socio?</p>
            <p className="mt-1 text-sm text-white/80">
              Al comprar este producto inmobiliario recibes <strong>gratis tu membresía del Club
              de Viajes 3i</strong> y subes automáticamente a <strong>Elite</strong>. La membresía
              de regalo aplica solo a la compra de productos inmobiliarios.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-light p-5 ring-1 ring-secondary/30">
      <div className="flex items-center gap-2">
        <span className="text-secondary"><IconMedallion className="h-7 w-7" /></span>
        <h3 className="font-serif text-lg font-bold text-primary">Doble incentivo</h3>
      </div>
      <ul className="mt-3 space-y-2 text-sm text-primary/80">
        <li className="flex gap-2">
          <span className="text-secondary">✦</span>
          <span>
            <strong>Tu invitado gana:</strong> membresía de viajes <strong>gratis</strong> cuando
            compra un producto <strong>inmobiliario</strong> con tu enlace (y sube a Elite).
          </span>
        </li>
        <li className="flex gap-2">
          <span className="text-secondary">✦</span>
          <span>
            <strong>Tú ganas:</strong> tu comisión por cada venta y, al llegar a{' '}
            <strong>5 referidos que compren inmobiliario</strong>, asciendes a <strong>Elite</strong>{' '}
            con tu membresía de viajes <strong>gratis</strong>.
          </span>
        </li>
      </ul>
    </div>
  );
}
