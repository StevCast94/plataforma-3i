import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { useAdminGet } from '@/hooks/useAdminAPI';
import { adminApi } from '@/lib/adminApi';
import { useToast } from '@/components/shared/Toast';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { formatCurrency } from '@/lib/utils';
import { statusLabel } from '@/lib/referral';
import { COMMISSION_BADGE } from '@/lib/referral';
import type {
  ReferralMember,
  Commission,
  Payout,
  CommissionStatus,
  TravelMembershipInfo,
  KycDocuments,
} from '@shared/types';

interface MemberDetail extends ReferralMember {
  sentReferrals: { id: string; referred: { fullName: string; status: string } }[];
  commissions: Commission[];
  payouts: Payout[];
  travelMemberships: TravelMembershipInfo[];
  travelAccess: boolean;
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
  const { isSuperadmin } = useAdminAuth();
  const { data, loading, reload } = useAdminGet<MemberDetail>(
    memberId ? `/admin/members/${memberId}` : null,
  );
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [editingReferrer, setEditingReferrer] = useState(false);
  const [newReferrerCode, setNewReferrerCode] = useState('');
  const [kycDocs, setKycDocs] = useState<KycDocuments | null>(null);
  const [loadingKycDocs, setLoadingKycDocs] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  async function openKycDocs() {
    if (!memberId) return;
    setKycDocs({ status: 'PENDING', submittedAt: null, rejectReason: null, front: null, back: null, selfie: null });
    setLoadingKycDocs(true);
    try {
      const docs = await adminApi.get<KycDocuments>(`/admin/members/${memberId}/kyc-documents`);
      setKycDocs(docs);
    } catch (err) {
      toast((err as Error).message, 'error');
      setKycDocs(null);
    } finally {
      setLoadingKycDocs(false);
    }
  }

  async function saveReferrer() {
    if (!memberId) return;
    setBusy(true);
    try {
      await adminApi.put(`/admin/members/${memberId}/referrer`, {
        referralCode: newReferrerCode.trim() || null,
      });
      toast('Referidor reasignado', 'success');
      setEditingReferrer(false);
      setNewReferrerCode('');
      reload();
      onChanged();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function setKyc(approve: boolean, reason?: string) {
    if (!memberId) return;
    setBusy(true);
    try {
      await adminApi.put(`/admin/members/${memberId}/kyc`, { approve, reason });
      toast(approve ? 'KYC aprobado' : 'KYC rechazado', 'success');
      setKycDocs(null);
      setRejectReason('');
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

  async function setTravel(grant: boolean) {
    if (!memberId) return;
    setBusy(true);
    try {
      if (grant) await adminApi.post(`/admin/members/${memberId}/travel-membership`, { source: 'REWARD' });
      else await adminApi.del(`/admin/members/${memberId}/travel-membership`);
      toast(grant ? 'Membresía de viajes otorgada' : 'Membresía de viajes revocada', 'success');
      reload();
      onChanged();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function deleteMember() {
    if (!memberId) return;
    setBusy(true);
    try {
      await adminApi.del(`/admin/members/${memberId}`);
      toast('Miembro eliminado. Ya puede volver a registrarse con el mismo email.', 'success');
      setConfirmingDelete(false);
      onChanged();
      onClose();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
    <Modal open={!!memberId} onClose={onClose} title={data?.fullName ?? 'Miembro'}>
      {loading && <p className="text-brand-gray">Cargando…</p>}
      {data && (
        <div className="max-h-[70vh] space-y-5 overflow-y-auto pr-1">
          <div className="flex flex-wrap gap-2">
            <Badge variant={data.status === 'ELITE' ? 'gold' : 'light'}>{statusLabel(data.status)}</Badge>
            <Badge variant={data.kycVerified ? 'gold' : 'light'}>
              {{
                APPROVED: 'KYC verificado',
                PENDING: 'KYC en revisión',
                REJECTED: 'KYC rechazado',
                NOT_SUBMITTED: 'KYC sin enviar',
              }[data.kycStatus ?? (data.kycVerified ? 'APPROVED' : 'NOT_SUBMITTED')]}
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

          {/* Club de Viajes */}
          <Section title="Club de Viajes 3i">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={data.travelAccess ? 'gold' : 'light'}>
                {data.travelAccess ? 'Socio activo ✈️' : 'Sin membresía'}
              </Badge>
              {data.travelAccess ? (
                <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setTravel(false)} disabled={busy}>
                  Revocar
                </Button>
              ) : (
                <Button size="sm" onClick={() => setTravel(true)} disabled={busy}>
                  Otorgar membresía (premio)
                </Button>
              )}
            </div>
            {data.travelMemberships.length > 0 && (
              <ul className="mt-2 space-y-1 text-xs text-brand-gray">
                {data.travelMemberships.slice(0, 4).map((m) => (
                  <li key={m.id} className="flex justify-between">
                    <span>{m.source} · {m.tier}{m.active ? '' : ' (inactiva)'}</span>
                    <span>{new Date(m.createdAt).toLocaleDateString('es-EC')}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* Referidor (upline) — reasignable por superadmin */}
          {isSuperadmin && (
            <div className="rounded-xl border border-black/10 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-wider text-brand-gray">Referidor</p>
                  <p className="font-medium text-primary">
                    {data.referrer
                      ? `${data.referrer.fullName} (${data.referrer.referralCode})`
                      : 'Sin referidor'}
                  </p>
                </div>
                {!editingReferrer && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setNewReferrerCode(data.referrer?.referralCode ?? '');
                      setEditingReferrer(true);
                    }}
                    disabled={busy}
                  >
                    Reasignar
                  </Button>
                )}
              </div>

              {editingReferrer && (
                <div className="mt-3 space-y-2">
                  <input
                    value={newReferrerCode}
                    onChange={(e) => setNewReferrerCode(e.target.value)}
                    placeholder="Código del nuevo referidor (vacío = sin referidor)"
                    className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
                  />
                  <p className="text-xs text-brand-gray">
                    Reconstruye los niveles 1 y 2 de este socio. No recalcula comisiones ya
                    generadas — para eso, edita la compra y regenera sus comisiones.
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveReferrer} disabled={busy}>
                      Guardar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingReferrer(false)}
                      disabled={busy}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Acciones */}
          <div className="flex flex-wrap gap-2 border-t border-black/5 pt-4">
            {!data.kycVerified ? (
              <Button size="sm" onClick={openKycDocs} disabled={busy}>
                Ver verificación KYC
              </Button>
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
            {isSuperadmin && (
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto text-red-600"
                onClick={() => setConfirmingDelete(true)}
                disabled={busy}
              >
                🗑️ Eliminar completamente
              </Button>
            )}
          </div>
        </div>
      )}
    </Modal>

    <Modal open={!!kycDocs} onClose={() => { setKycDocs(null); setRejectReason(''); }} title="Verificación de identidad">
      {loadingKycDocs && <p className="text-brand-gray">Cargando documentos…</p>}
      {kycDocs && !loadingKycDocs && (
        <div className="space-y-4">
          {kycDocs.rejectReason && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              Rechazo anterior: {kycDocs.rejectReason}
            </p>
          )}
          {!kycDocs.front && !kycDocs.back && !kycDocs.selfie ? (
            <p className="text-sm text-brand-gray">Este socio todavía no envió documentos.</p>
          ) : (
            <div className="space-y-3">
              <KycDocPreview label="Cédula/pasaporte — frente" url={kycDocs.front} />
              <KycDocPreview label="Cédula/pasaporte — reverso" url={kycDocs.back} />
              <KycDocPreview label="Selfie con el documento" url={kycDocs.selfie} />
              <p className="text-xs text-brand-gray">
                Los enlaces de las imágenes expiran en 10 minutos por seguridad — si no cargan, cierra
                y vuelve a abrir este panel.
              </p>
            </div>
          )}

          {(kycDocs.front || kycDocs.back || kycDocs.selfie) && (
            <div className="space-y-2 border-t border-black/5 pt-4">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Motivo del rechazo (opcional, se le muestra al socio)"
                rows={2}
                className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => setKyc(true)} disabled={busy}>
                  Aprobar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600"
                  onClick={() => setKyc(false, rejectReason.trim() || undefined)}
                  disabled={busy}
                >
                  Rechazar
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>

    <ConfirmModal
      open={confirmingDelete}
      title="Eliminar miembro completamente"
      message={
        <>
          Esto borra <strong>permanentemente</strong> la cuenta de{' '}
          <strong>{data?.fullName}</strong> ({data?.email}) y todos sus referidos, links,
          notificaciones y comisiones propias pendientes. Sus ventas ya confirmadas se
          conservan (sin atribución). Su email quedará libre para volver a registrarse.
          <br />
          <br />
          Se bloqueará si tiene comisiones ya <strong>pagadas o liquidadas</strong> — en ese
          caso usa "Suspender" en su lugar.
        </>
      }
      confirmLabel="Eliminar definitivamente"
      danger
      loading={busy}
      onConfirm={deleteMember}
      onClose={() => setConfirmingDelete(false)}
    />
    </>
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

function KycDocPreview({ label, url }: { label: string; url: string | null }) {
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="block">
      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-brand-gray">{label}</p>
      <img src={url} alt={label} className="max-h-64 w-full rounded-lg object-contain ring-1 ring-black/10" />
    </a>
  );
}
