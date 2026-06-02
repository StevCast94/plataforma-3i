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
  const badge = COMMISSION_BADGE[commission.status];
  return (
    <tr
      onClick={onClick}
      className="cursor-pointer border-b border-black/5 hover:bg-light/60"
    >
      <td className="px-4 py-3 text-sm text-brand-gray">
        {new Date(commission.createdAt).toLocaleDateString('es-EC')}
      </td>
      <td className="px-4 py-3 text-sm text-primary">
        {commission.referral?.referred.fullName ?? '—'}
      </td>
      <td className="px-4 py-3 text-sm text-brand-gray">
        {commission.product?.name ?? '—'}
      </td>
      <td className="px-4 py-3 text-sm">Nivel {commission.referral?.level ?? '—'}</td>
      <td className="px-4 py-3 text-sm font-semibold text-primary">
        {formatCurrency(commission.amount)}
      </td>
      <td className="px-4 py-3 text-sm text-brand-gray">
        {commission.type === 'fixed' ? 'Fijo' : `${(commission.rate * 100).toFixed(0)}%`}
      </td>
      <td className="px-4 py-3">
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badge.className}`}>
          {badge.label}
        </span>
      </td>
    </tr>
  );
}
