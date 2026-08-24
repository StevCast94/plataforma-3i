import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Seo } from '@/components/shared/Seo';
import { useAdminAuth } from '@/hooks/useAdminAuth';

export default function AdminLoginPage() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await login(String(fd.get('username')), String(fd.get('password')));
      navigate('/admin');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary px-4">
      <Seo title="Admin — Grupo 3i" />
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
        <Link to="/" className="font-serif text-2xl font-bold text-primary">
          Grupo<span className="text-secondary"> 3i</span>
        </Link>
        <p className="mt-1 text-xs uppercase tracking-widest text-brand-gray">Panel de administración</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input name="username" label="Usuario" placeholder="usuario" required autoFocus />
          <Input name="password" type="password" label="Contraseña" placeholder="••••••••" required />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" size="lg" disabled={loading} className="w-full">
            {loading ? 'Ingresando…' : 'Ingresar'}
          </Button>
        </form>
      </div>
    </div>
  );
}
