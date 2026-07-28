import { useState } from 'react';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { WhatsAppButton } from '@/components/admin/WhatsAppButton';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAdminGet } from '@/hooks/useAdminAPI';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { adminApi } from '@/lib/adminApi';
import { useToast } from '@/components/shared/Toast';

interface SupportRequest {
  id: string;
  type: string;
  memberId: string | null;
  member: { fullName: string; referralCode: string } | null;
  name: string | null;
  email: string;
  phone: string | null;
  message: string | null;
  status: 'pending' | 'resolved';
  createdAt: string;
}

const TYPE_LABEL: Record<string, string> = {
  password_reset: 'Recuperar contraseña',
  other: 'Otro',
};

export default function AdminSupportPage() {
  const { toast } = useToast();
  const { isSuperadmin } = useAdminAuth();
  const [status, setStatus] = useState('pending');
  const { data, loading, reload } = useAdminGet<SupportRequest[]>(
    `/admin/support-requests?${new URLSearchParams(status ? { status } : {})}`,
  );
  const [resetting, setResetting] = useState<SupportRequest | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function setResolved(r: SupportRequest, resolved: boolean) {
    try {
      await adminApi.patch(`/admin/support-requests/${r.id}`, { status: resolved ? 'resolved' : 'pending' });
      toast(resolved ? 'Marcada como resuelta' : 'Marcada como pendiente', 'success');
      reload();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }

  async function resetPassword() {
    if (!resetting?.memberId || newPassword.length < 6) return;
    setBusy(true);
    try {
      await adminApi.put(`/admin/members/${resetting.memberId}/reset-password`, { newPassword });
      toast('Contraseña reseteada', 'success');
      await setResolved(resetting, true);
      setResetting(null);
      setNewPassword('');
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  const cols: Column<SupportRequest>[] = [
    {
      header: 'Solicitante',
      cell: (r) => (
        <div>
          <p className="font-medium text-primary">{r.name || r.member?.fullName || r.email}</p>
          <p className="text-xs text-brand-gray">{r.email}</p>
          {r.member && (
            <p className="text-xs text-accent">Socio · {r.member.referralCode}</p>
          )}
          {r.phone && (
            <div className="mt-1.5">
              <WhatsAppButton
                phone={r.phone}
                name={r.name || r.member?.fullName}
                message={`Hola, te escribimos de Grupo 3i por tu solicitud de ${TYPE_LABEL[r.type] ?? 'soporte'}. ¿En qué te ayudamos?`}
              />
            </div>
          )}
        </div>
      ),
    },
    { header: 'Tipo', cell: (r) => TYPE_LABEL[r.type] ?? r.type },
    { header: 'Mensaje', cell: (r) => <span className="text-sm text-brand-gray">{r.message || '—'}</span> },
    { header: 'Fecha', cell: (r) => new Date(r.createdAt).toLocaleString('es-EC') },
    {
      header: '',
      cell: (r) => (
        <div className="flex gap-2">
          {r.type === 'password_reset' && r.memberId && isSuperadmin && (
            <Button size="sm" onClick={() => setResetting(r)}>Resetear contraseña</Button>
          )}
          {r.status === 'pending' ? (
            <Button size="sm" variant="outline" onClick={() => setResolved(r, true)}>Marcar resuelto</Button>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setResolved(r, false)}>Reabrir</Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-primary">Soporte</h1>

      <div className="flex flex-wrap gap-2">
        {[
          { key: 'pending', label: 'Pendientes' },
          { key: 'resolved', label: 'Resueltas' },
          { key: '', label: 'Todas' },
        ].map((f) => (
          <button
            key={f.key || 'all'}
            onClick={() => setStatus(f.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${status === f.key ? 'bg-primary text-white' : 'bg-light text-brand-gray'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <DataTable columns={cols} rows={data ?? []} keyOf={(r) => r.id} loading={loading} empty="Sin solicitudes." />

      <Modal open={!!resetting} onClose={() => setResetting(null)} title="Resetear contraseña">
        {resetting && (
          <div className="space-y-4">
            <p className="text-sm text-brand-gray">
              Nueva contraseña para <strong className="text-primary">{resetting.member?.fullName ?? resetting.email}</strong>.
              Compártela por un canal seguro (ej. el mismo WhatsApp de arriba).
            </p>
            <Input
              label="Nueva contraseña"
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setResetting(null)} disabled={busy}>Cancelar</Button>
              <Button onClick={resetPassword} disabled={busy || newPassword.length < 6}>
                {busy ? 'Guardando…' : 'Resetear'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
