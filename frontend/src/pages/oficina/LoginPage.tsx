import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Seo } from '@/components/shared/Seo';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
        <Link to="/oficina" className="font-serif text-2xl font-bold text-primary">
          Grupo<span className="text-secondary"> 3i</span>
        </Link>
        <h1 className="mt-6 text-3xl text-primary">Bienvenido de vuelta</h1>
        <p className="mt-1 text-sm text-brand-gray">Ingresa a tu oficina virtual.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input name="email" type="email" label="Email" placeholder="tucorreo@ejemplo.com" required />
          <Input name="password" type="password" label="Contraseña" placeholder="••••••••" required />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="button" className="text-sm text-accent hover:underline">
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
    </div>
  );
}
