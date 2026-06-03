import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAdminGet } from '@/hooks/useAdminAPI';
import { adminApi } from '@/lib/adminApi';
import { useToast } from '@/components/shared/Toast';
import { formatCurrency } from '@/lib/utils';
import { statusLabel } from '@/lib/referral';
import { COMMISSION_BADGE } from '@/lib/referral';
import type { ReferralMember, Commission, Payout, CommissionStatus } from '@shared/types';

interface MemberDetail extends ReferralMember {
  sentReferrals: { id: string; referred: { fullName: string; status: string } }[];
  commissions: Commission[];
  payouts: Payout[];
}

export function AdminMemberDetail({
  memberId,
  onClose,
  onChanged,
}: {
  memberId: string | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { toast } = useToast();
  const { data, loading, reload } = useAdminGet<MemberDetail>(
    memberId ? `/admin/members/${memberId}` : null,
  );
  const [busy, setBusy] = useState(false);

  async function setKyc(approve: boolean) {
    if (!memberId) return;
    const reason = approve ? undefined : prompt('Motivo del rechazo (opcional):') ?? undefined;
    setBusy(true);
    try {
      await adminApi.put(`/admin/members/${memberId}/kyc`, { approve, reason });
      toast(approve ? 'KYC aprobado' : 'KYC rechazado', 'success');
      reload();
      onChanged();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(status: string) {
    if (!memberId) return;
    setBusy(true);
    try {
      await adminApi.put(`/admin/members/${memberId}/status`, { status });
      toast('Estado actualizado', 'success');
      reload();
      onChanged();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={!!memberId} onClose={onClose} title={data?.fullName ?? 'Miembro'}>
      {loading && <p className="text-brand-gray">Cargando…</p>}
      {data && (
        <div className="max-h-[70vh] space-y-5 overflow-y-auto pr-1">
          <div className="flex flex-wrap gap-2">
            <Badge variant={data.status === 'ELITE' ? 'gold' : 'light'}>{statusLabel(data.status)}</Badge>
            <Badge variant={data.kycVerified ? 'gold' : 'light'}>
              {data.kycVerified ? 'KYC verificado' : 'KYC pendiente'}
            </Badge>
          </div>

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <Field label="Email" value={data.email} />
            <Field label="Teléfono" value={data.phone ?? '—'} />
            <Field label="Documento" value={`${data.docType}: ${data.docId}`} />
            <Field label="Código" value={data.referralCode} />
            <Field label="Total ganado" value={formatCurrency(data.totalEarned)} />
            <Field label="Saldo" value={formatCurrency(data.walletBalance)} />
            <Field label="Referidos" value={`${data.totalReferrals}`} />
          </dl>

          {/* Red mini */}
          <Section title={`Red directa (${data.sentReferrals.length})`}>
            {data.sentReferrals.length === 0 ? (
              <p className="text-sm text-brand-gray">Sin referidos.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {data.sentReferrals.slice(0, 10).map((r) => (
                  <li key={r.id} className="flex justify-between">
                    <span className="text-primary">{r.referred.fullName}</span>
                    <span className="text-xs text-brand-gray">{r.referred.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* Comisiones */}
          <Section title={`Comisiones (${data.commissions.length})`}>
            <ul className="space-y-1 text-sm">
              {data.commissions.slice(0, 8).map((c) => (
                <li key={c.id} className="flex items-center justify-between">
                  <span>{formatCurrency(c.amount)}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${COMMISSION_BADGE[c.status as CommissionStatus].className}`}>
                    {COMMISSION_BADGE[c.status as CommissionStatus].label}
                  </span>
                </li>
              ))}
              {data.commissions.length === 0 && <li className="text-brand-gray">Sin comisiones.</li>}
            </ul>
          </Section>

          {/* Acciones */}
          <div className="flex flex-wrap gap-2 border-t border-black/5 pt-4">
            {!data.kycVerified ? (
              <Button size="sm" onClick={() => setKyc(true)} disabled={busy}>Aprobar KYC</Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setKyc(false)} disabled={busy}>Revocar KYC</Button>
            )}
            {data.status !== 'SUSPENDED' ? (
              <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setStatus('SUSPENDED')} disabled={busy}>
                Suspender
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setStatus('PREMIERE')} disabled={busy}>
                Reactivar
              </Button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-brand-gray">{label}</dt>
      <dd className="mt-0.5 font-medium text-primary">{value}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold text-primary">{title}</h4>
      {children}
    </div>
  );
}
