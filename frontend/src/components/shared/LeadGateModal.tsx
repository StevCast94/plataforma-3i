import { useState, type FormEvent } from 'react';
import { PrivacyNote } from '@/components/shared/PrivacyNote';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PhoneField } from '@/components/shared/PhoneField';
import { useLang } from '@/hooks/useLang';
import { submitProjectLead } from '@/lib/projectTracking';

// Antes de abrir el WhatsApp del desarrollador se piden nombre y número: el
// contacto queda registrado con su origen (referidor / plataforma) y fecha.

const SAVED = 'g3i_lead_contact';

function saved(): { name: string; phone: string } | null {
  try {
    return JSON.parse(localStorage.getItem(SAVED) ?? 'null');
  } catch {
    return null;
  }
}

interface Props {
  open: boolean;
  onClose: () => void;
  slug: string;
  lotCode?: string;
  message: string;
  embed?: boolean;
}

export function LeadGateModal({ open, onClose, slug, lotCode, message, embed }: Props) {
  const { t } = useLang();
  const prev = saved();
  const [name, setName] = useState(prev?.name ?? '');
  const [phone, setPhone] = useState(prev?.phone ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [href, setHref] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!name.trim() || phone.replace(/\D/g, '').length < 8) {
      setError(t('Escribe tu nombre y tu WhatsApp con código de país.'));
      return;
    }
    setBusy(true);
    try {
      const r = await submitProjectLead(slug, { name, phone, lotCode, channel: 'whatsapp', message, embed });
      try {
        localStorage.setItem(SAVED, JSON.stringify({ name, phone }));
      } catch {
        /* sin almacenamiento */
      }
      const digits = (r.whatsapp ?? '').replace(/\D/g, '');
      const url = digits ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : null;
      setHref(url);
      // Intento directo; si el navegador lo bloquea queda el botón visible.
      if (url) window.open(url, '_blank', 'noopener');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t('Habla con un asesor')}>
      {href ? (
        <div className="space-y-4 text-center">
          <p className="text-sm text-brand-gray">{t('¡Listo! Te atenderemos por WhatsApp.')}</p>
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            onClick={onClose}
            className="inline-flex w-full items-center justify-center rounded-lg bg-[#25D366] px-4 py-3 font-medium text-white hover:bg-[#1eb855]"
          >
            {t('Abrir WhatsApp')}
          </a>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <p className="text-sm text-brand-gray">{t('Déjanos tus datos y abrimos el chat con el asesor del proyecto.')}</p>
          <Input label={t('Nombre')} value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          <PhoneField label="WhatsApp" required defaultValue={prev?.phone || '+593 '} onChange={setPhone} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" size="lg" disabled={busy} className="w-full">
            {busy ? t('Enviando…') : t('Continuar a WhatsApp')}
          </Button>
          <PrivacyNote className="mt-2" />
        </form>
      )}
    </Modal>
  );
}
