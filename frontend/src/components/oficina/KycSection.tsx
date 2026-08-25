import { useState } from 'react';
import { ShieldCheck, ShieldAlert, Clock, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { useToast } from '@/components/shared/Toast';
import type { ReferralMember, KycStatus } from '@shared/types';

function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface SlotState {
  file: File | null;
  preview: string | null;
}

const EMPTY_SLOT: SlotState = { file: null, preview: null };

/**
 * Verificación de identidad (KYC). Vive en Pagos porque el requisito real es
 * "no se puede retirar sin verificar" (el backend lo exige en
 * POST /payouts/request), pero el botón para INICIARLA está siempre visible
 * aquí sin importar el estado — nunca escondido detrás de otra acción.
 *
 * Las 3 fotos se capturan en el navegador y se mandan en UN solo POST a
 * /members/kyc/submit; el backend las sube como recursos autenticados de
 * Cloudinary (nunca URLs públicas — ver kycStorage.ts).
 */
export function KycSection({
  member,
  onUpdated,
}: {
  member: ReferralMember;
  onUpdated: () => void;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [front, setFront] = useState<SlotState>(EMPTY_SLOT);
  const [back, setBack] = useState<SlotState>(EMPTY_SLOT);
  const [selfie, setSelfie] = useState<SlotState>(EMPTY_SLOT);
  const [submitting, setSubmitting] = useState(false);

  const status: KycStatus = member.kycStatus ?? (member.kycVerified ? 'APPROVED' : 'NOT_SUBMITTED');
  const ready = !!(front.file && back.file && selfie.file);

  function pick(slot: (s: SlotState) => void) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      slot({ file, preview: URL.createObjectURL(file) });
    };
  }

  async function submit() {
    if (!front.file || !back.file || !selfie.file) return;
    setSubmitting(true);
    try {
      const [frontDataUri, backDataUri, selfieDataUri] = await Promise.all([
        fileToDataUri(front.file),
        fileToDataUri(back.file),
        fileToDataUri(selfie.file),
      ]);
      await api.post('/members/kyc/submit', { frontDataUri, backDataUri, selfieDataUri });
      toast('Verificación enviada. Te avisaremos cuando la revisemos.', 'success');
      setFront(EMPTY_SLOT);
      setBack(EMPTY_SLOT);
      setSelfie(EMPTY_SLOT);
      setOpen(false);
      onUpdated();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl text-primary">Verificación de identidad</h2>
          <p className="mt-1 text-sm text-brand-gray">
            Necesaria para poder solicitar retiros de tus comisiones.
          </p>
        </div>
        <StatusBadge status={status} />
      </div>

      {status === 'PENDING' && (
        <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          Recibimos tus documentos el{' '}
          {member.kycSubmittedAt ? new Date(member.kycSubmittedAt).toLocaleDateString('es-EC') : ''}. Te
          avisamos apenas los revisemos — normalmente toma menos de 48 horas.
        </p>
      )}

      {status === 'REJECTED' && member.kycRejectReason && (
        <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">
          Tu verificación anterior fue rechazada: {member.kycRejectReason}
        </p>
      )}

      {status === 'APPROVED' && (
        <p className="mt-4 rounded-xl bg-green-50 p-3 text-sm text-green-800">
          Tu identidad está verificada. Ya puedes solicitar retiros.
        </p>
      )}

      {/* El botón para iniciar/reintentar SIEMPRE está disponible, salvo
          mientras hay una solicitud en revisión o ya aprobada. */}
      {status !== 'PENDING' && status !== 'APPROVED' && !open && (
        <Button size="sm" className="mt-4" onClick={() => setOpen(true)}>
          {status === 'REJECTED' ? 'Volver a enviar documentos' : 'Verificar mi identidad'}
        </Button>
      )}

      {open && (
        <div className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <PhotoSlot
              label="Cédula o pasaporte — frente"
              slot={front}
              onChange={pick(setFront)}
              capture="environment"
            />
            <PhotoSlot
              label="Cédula o pasaporte — reverso"
              slot={back}
              onChange={pick(setBack)}
              capture="environment"
            />
            <PhotoSlot label="Selfie sosteniendo el documento" slot={selfie} onChange={pick(setSelfie)} capture="user" />
          </div>
          <p className="text-xs text-brand-gray">
            Que se lean bien los datos y la foto, sin reflejos ni recortes. La selfie debe mostrar tu
            cara y el documento a la vez.
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button size="sm" onClick={submit} disabled={!ready || submitting}>
              {submitting ? 'Enviando…' : 'Enviar para revisión'}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

function PhotoSlot({
  label,
  slot,
  onChange,
  capture,
}: {
  label: string;
  slot: SlotState;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  capture: 'environment' | 'user';
}) {
  return (
    <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-black/15 bg-light p-4 text-center hover:border-secondary">
      {slot.preview ? (
        <img src={slot.preview} alt="" className="h-24 w-full rounded-lg object-cover" />
      ) : (
        <Upload className="h-6 w-6 text-brand-gray" strokeWidth={1.6} />
      )}
      <span className="text-xs font-medium text-primary">{label}</span>
      <input
        type="file"
        accept="image/*"
        capture={capture}
        className="hidden"
        onChange={onChange}
      />
    </label>
  );
}

function StatusBadge({ status }: { status: KycStatus }) {
  const map: Record<KycStatus, { label: string; icon: typeof ShieldCheck; className: string }> = {
    APPROVED: { label: 'Verificado', icon: ShieldCheck, className: 'bg-green-100 text-green-700' },
    PENDING: { label: 'En revisión', icon: Clock, className: 'bg-amber-100 text-amber-700' },
    REJECTED: { label: 'Rechazado', icon: ShieldAlert, className: 'bg-red-100 text-red-700' },
    NOT_SUBMITTED: { label: 'Sin verificar', icon: ShieldAlert, className: 'bg-gray-100 text-gray-600' },
  };
  const s = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${s.className}`}>
      <s.icon className="h-3.5 w-3.5" strokeWidth={2} />
      {s.label}
    </span>
  );
}
