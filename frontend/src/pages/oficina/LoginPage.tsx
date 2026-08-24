import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Seo } from '@/components/shared/Seo';
import { Isotipo } from '@/components/brand/Isotipo';
import { useAuth } from '@/hooks/useAuth';
import { useSectionContent } from '@/hooks/useSiteContent';
import { useToast } from '@/components/shared/Toast';
import { api } from '@/lib/api';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: contact } = useSectionContent('contact');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSending, setForgotSending] = useState(false);

  async function submitForgot() {
    if (!forgotEmail.trim()) return;
    setForgotSending(true);
    try {
      await api.post('/members/support-request', {
        type: 'password_reset',
        email: forgotEmail.trim(),
        message: 'Solicitud de recuperación de contraseña desde el login.',
      });
    } catch {
      // Best-effort: aunque falle el registro, igual abrimos WhatsApp para no dejar al socio sin salida.
    } finally {
      setForgotSending(false);
    }
    const digits = (contact?.whatsapp ?? '').replace(/\D/g, '');
    if (digits) {
      const msg = `Hola, olvidé mi contraseña de la Oficina Virtual. Mi correo es: ${forgotEmail.trim()}. ¿Me ayudan a recuperarla?`;
      window.open(`https://wa.me/${digits}?text=${encodeURIComponent(msg)}`, '_blank');
    }
    toast('Solicitud enviada. Un asesor te contactará por WhatsApp.', 'success');
    setForgotOpen(false);
    setForgotEmail('');
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await login(String(fd.get('email')), String(fd.get('password')));
      navigate('/oficina/dashboard');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-light px-4">
      <Seo title="Iniciar sesión — Oficina Virtual" />
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <Link to="/" className="flex flex-col items-center gap-3 text-center">
          <Isotipo animation="ascenso" className="h-14 w-auto" title="Grupo 3i" />
          <img src="/images/logotipo.svg" alt="Grupo 3i" className="h-6 w-auto" />
        </Link>
        <h1 className="mt-7 text-center text-3xl text-primary">Bienvenido de vuelta</h1>
        <p className="mt-1 text-center text-sm text-brand-gray">Ingresa a tu oficina virtual.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input name="email" type="email" label="Email" placeholder="tucorreo@ejemplo.com" required />
          <Input name="password" type="password" label="Contraseña" placeholder="••••••••" required />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="button"
            onClick={() => setForgotOpen(true)}
            className="text-sm text-accent hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </button>
          <Button type="submit" size="lg" disabled={loading} className="w-full">
            {loading ? 'Ingresando…' : 'Ingresar'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-brand-gray">
          ¿No tienes cuenta?{' '}
          <Link to="/oficina/registro" className="font-semibold text-accent hover:underline">
            Regístrate gratis
          </Link>
        </p>
      </div>

      <Modal open={forgotOpen} onClose={() => setForgotOpen(false)} title="Recuperar contraseña">
        <div className="space-y-4">
          <p className="text-sm text-brand-gray">
            Escríbenos tu correo y te contactaremos por WhatsApp para verificar tu identidad y
            restablecer tu contraseña.
          </p>
          <Input
            label="Email de tu cuenta"
            type="email"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            placeholder="tucorreo@ejemplo.com"
          />
          <Button
            className="w-full"
            disabled={forgotSending || !forgotEmail.trim()}
            onClick={submitForgot}
          >
            {forgotSending ? 'Enviando…' : 'Solicitar por WhatsApp'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
