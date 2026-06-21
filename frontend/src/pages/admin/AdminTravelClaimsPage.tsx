import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useAdminGet } from '@/hooks/useAdminAPI';
import { adminApi } from '@/lib/adminApi';
import { useToast } from '@/components/shared/Toast';
import { formatCurrency } from '@/lib/utils';
import { IconShield } from '@/components/icons/TravelIcons';
import type { TravelGuaranteeClaim } from '@shared/types';

// ============================================================
// FASE 5 V4 — Admin: resolución de garantías de mejor precio.
// ============================================================

const money = (cents: number) => formatCurrency(cents / 100, { withCents: true });

const CLAIM_BADGE: Record<string, string> = {
  open: 'bg-amber-50 text-amber-700',
  approved: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
  paid: 'bg-blue-50 text-blue-700',
};

export default function AdminTravelClaimsPage() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<string>('open');
  const { data, loading, reload } = useAdminGet<TravelGuaranteeClaim[]>(
    `/admin/travel/guarantee${filter ? `?status=${filter}` : ''}`,
  );
  const [busy, setBusy] = useState<string | null>(null);

  async function resolve(id: string, status: 'approved' | 'rejected') {
    const resolution = prompt(
      status === 'approved' ? 'Nota de aprobación (opcional):' : 'Motivo del rechazo (opcional):',
    ) ?? undefined;
    setBusy(id);
    try {
      await adminApi.put(`/admin/travel/guarantee/${id}`, { status, resolution });
      toast(status === 'approved' ? 'Reclamo aprobado' : 'Reclamo rechazado', 'success');
      reload();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-primary">
          <IconShield className="h-6 w-6 text-accent" />
          Garantías de precio
        </h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
        >
          <option value="open">Abiertos</option>
          <option value="approved">Aprobados</option>
          <option value="rejected">Rechazados</option>
          <option value="">Todos</option>
        </select>
      </div>

      {loading && <p className="text-brand-gray">Cargando…</p>}
      {!loading && data && data.length === 0 && (
        <p className="rounded-xl bg-white p-6 text-center text-brand-gray ring-1 ring-black/5">
          No hay reclamos {filter ? `(${filter})` : ''}.
        </p>
      )}

      <div className="space-y-3">
        {(data ?? []).map((c) => {
          const diff = c.ourCents - c.claimedCents;
          return (
            <div key={c.id} className="rounded-xl bg-white p-5 ring-1 ring-black/5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 text-sm">
                  <p>
                    Nuestro precio <strong>{money(c.ourCents)}</strong> · rival{' '}
                    <strong>{money(c.claimedCents)}</strong>{' '}
                    {diff > 0 ? (
                      <span className="text-red-600">(rival {money(diff)} más barato)</span>
                    ) : (
                      <span className="text-green-700">(no es más barato)</span>
                    )}
                  </p>
                  <a href={c.competitorUrl} target="_blank" rel="noreferrer" className="text-accent underline break-all">
                    {c.competitorUrl}
                  </a>
                  {c.evidenceUrl && (
                    <a href={c.evidenceUrl} target="_blank" rel="noreferrer" className="ml-3 text-xs text-accent underline">
                      ver evidencia
                    </a>
                  )}
                  {c.resolution && <p className="mt-1 text-xs text-brand-gray">“{c.resolution}”</p>}
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${CLAIM_BADGE[c.status] ?? 'bg-light'}`}>
                  {c.status}
                </span>
              </div>

              {c.status === 'open' && (
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={() => resolve(c.id, 'approved')} disabled={busy === c.id}>
                    Aprobar
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-600" onClick={() => resolve(c.id, 'rejected')} disabled={busy === c.id}>
                    Rechazar
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
