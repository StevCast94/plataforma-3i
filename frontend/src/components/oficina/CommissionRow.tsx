import { formatCurrency } from '@/lib/utils';
import { COMMISSION_BADGE } from '@/lib/referral';
import type { Commission } from '@shared/types';

export function CommissionRow({
  commission,
  onClick,
}: {
  commission: Commission;
  onClick?: () => void;
}) {
  // Con respaldo a propósito: si el backend llega a mandar un estado que el
  // front todavía no conoce, antes `badge` quedaba undefined y el `.className`
  // de abajo tumbaba TODA la página de comisiones en blanco.
  const badge = COMMISSION_BADGE[commission.status] ?? {
    label: commission.status,
    className: 'bg-gray-200 text-gray-700',
  };
  return (
    <tr
      onClick={onClick}
      className="cursor-pointer border-b border-black/5 hover:bg-light/60"
    >
      <td className="px-2 py-3 sm:px-4 text-sm text-brand-gray">
        {new Date(commission.createdAt).toLocaleDateString('es-EC')}
      </td>
      <td className="px-2 py-3 sm:px-4 text-sm text-primary">
        {commission.referral?.referred.fullName ?? commission.purchase?.customerName ?? '—'}
      </td>
      {/* Ocultas en móvil — ver comentario de las cabeceras en CommissionsPage. */}
      <td className="hidden px-2 py-3 sm:px-4 text-sm text-brand-gray sm:table-cell">
        {commission.product?.name ?? '—'}
      </td>
      <td className="hidden px-2 py-3 sm:px-4 text-sm sm:table-cell">Nivel {commission.level}</td>
      <td className="px-2 py-3 sm:px-4 text-sm font-semibold text-primary">
        {formatCurrency(commission.amount)}
      </td>
      <td className="hidden px-2 py-3 sm:px-4 text-sm text-brand-gray sm:table-cell">
        {commission.type === 'fixed' ? 'Fijo' : `${(commission.rate * 100).toFixed(0)}%`}
      </td>
      <td className="px-2 py-3 sm:px-4">
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badge.className}`}>
          {badge.label}
        </span>
      </td>
    </tr>
  );
}
