import { useState, type FormEvent } from 'react';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

interface ContactFormProps {
  source?: string;
  /** Si se define, envía a este endpoint en vez de /contact (ej. inquiry de producto). */
  endpoint?: string;
  withMessage?: boolean;
}

type Status = 'idle' | 'sending' | 'ok' | 'error';

export function ContactForm({
  source = 'landing',
  endpoint = '/contact',
  withMessage = true,
}: ContactFormProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    setError('');

    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload: Record<string, string> = {
      name: String(fd.get('name') ?? ''),
      email: String(fd.get('email') ?? ''),
      phone: String(fd.get('phone') ?? ''),
      message: String(fd.get('message') ?? ''),
    };
    if (endpoint === '/contact') payload.source = source;

    try {
      await api.post(endpoint, payload);
      setStatus('ok');
      form.reset();
    } catch (err) {
      setStatus('error');
      setError((err as Error).message);
    }
  }

  if (status === 'ok') {
    return (
      <div className="rounded-2xl bg-light p-8 text-center">
        <h3 className="text-2xl text-primary">¡Gracias! 🎉</h3>
        <p className="mt-2 text-brand-gray">
          Hemos recibido tu mensaje. Un asesor te contactará pronto.
        </p>
        <Button
          variant="outline"
          className="mt-5"
          onClick={() => setStatus('idle')}
        >
          Enviar otro
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input name="name" label="Nombre" placeholder="Tu nombre" required />
        <Input
          name="email"
          type="email"
          label="Email"
          placeholder="tucorreo@ejemplo.com"
          required
        />
      </div>
      <Input name="phone" label="Teléfono (opcional)" placeholder="+593 ..." />
      {withMessage && (
        <Textarea
          name="message"
          label="Mensaje"
          placeholder="Cuéntanos en qué estás interesado…"
          required={endpoint === '/contact'}
        />
      )}

      {status === 'error' && (
        <p className="text-sm text-red-600">{error || 'Algo salió mal. Intenta de nuevo.'}</p>
      )}

      <Button type="submit" size="lg" disabled={status === 'sending'} className="w-full">
        {status === 'sending' ? 'Enviando…' : 'Enviar'}
      </Button>
    </form>
  );
}
