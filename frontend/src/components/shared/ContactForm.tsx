import { useState, type FormEvent } from 'react';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { getReferralCode } from '@/hooks/useReferral';
import { useToast } from './Toast';

interface ContactFormProps {
  source?: string;
  /** Si se define, envía a este endpoint en vez de /contact (ej. inquiry de producto). */
  endpoint?: string;
  withMessage?: boolean;
  /** Callback tras envío exitoso (ej. cerrar modal). */
  onSuccess?: () => void;
  /** Muestra el card de éxito embebido (false si lo maneja el padre vía toast). */
  inlineSuccess?: boolean;
  /** Campos extra para el payload (ej. { intent: 'purchase' }). */
  extra?: Record<string, unknown>;
  /** Texto del botón de envío. */
  submitLabel?: string;
}

interface Errors {
  name?: string;
  email?: string;
  message?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ContactForm({
  source = 'landing',
  endpoint = '/contact',
  withMessage = true,
  onSuccess,
  inlineSuccess = true,
  extra,
  submitLabel,
}: ContactFormProps) {
  const { toast } = useToast();
  const isContact = endpoint === '/contact';
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const referralCode = getReferralCode();

  function validate(data: Record<string, string>): Errors {
    const e: Errors = {};
    if (!data.name.trim()) e.name = 'Ingresa tu nombre';
    if (!data.email.trim()) e.email = 'Ingresa tu email';
    else if (!EMAIL_RE.test(data.email)) e.email = 'Email inválido';
    if (isContact && withMessage && !data.message.trim())
      e.message = 'Cuéntanos qué necesitas';
    return e;
  }

  async function handleSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const form = ev.currentTarget;
    const fd = new FormData(form);
    const data = {
      name: String(fd.get('name') ?? ''),
      email: String(fd.get('email') ?? ''),
      phone: String(fd.get('phone') ?? ''),
      message: String(fd.get('message') ?? ''),
    };

    const v = validate(data);
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    setSending(true);
    try {
      await api.post(endpoint, {
        ...data,
        ...(isContact ? { source } : {}),
        ...(referralCode ? { referralCode } : {}),
        ...(extra ?? {}),
      });
      toast('¡Listo! Un asesor te contactará pronto.', 'success');
      form.reset();
      setDone(true);
      onSuccess?.();
    } catch (err) {
      toast((err as Error).message || 'No se pudo enviar. Intenta de nuevo.', 'error');
    } finally {
      setSending(false);
    }
  }

  if (done && inlineSuccess) {
    return (
      <div className="rounded-2xl bg-light p-8 text-center">
        <h3 className="text-2xl text-primary">¡Gracias! 🎉</h3>
        <p className="mt-2 text-brand-gray">
          Hemos recibido tu mensaje. Un asesor te contactará pronto.
        </p>
        <Button variant="outline" className="mt-5" onClick={() => setDone(false)}>
          Enviar otro
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {referralCode && (
        <div className="flex items-center gap-2">
          <Badge variant="gold">Referido</Badge>
          <span className="text-sm text-brand-gray">
            Código aplicado: <strong className="text-primary">{referralCode}</strong>
          </span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Input name="name" label="Nombre" placeholder="Tu nombre" />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>
        <div>
          <Input
            name="email"
            type="email"
            label="Email"
            placeholder="tucorreo@ejemplo.com"
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>
      </div>

      <Input name="phone" label="Teléfono (opcional)" placeholder="+593 ..." />

      {withMessage && (
        <div>
          <Textarea
            name="message"
            label="Mensaje"
            placeholder="Cuéntanos en qué estás interesado…"
          />
          {errors.message && (
            <p className="mt-1 text-sm text-red-600">{errors.message}</p>
          )}
        </div>
      )}

      <Button type="submit" size="lg" disabled={sending} className="w-full">
        {sending ? 'Enviando…' : (submitLabel ?? 'Enviar')}
      </Button>
    </form>
  );
}
