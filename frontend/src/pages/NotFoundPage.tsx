import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
      <p className="font-serif text-7xl font-bold text-secondary">404</p>
      <h1 className="mt-4 text-3xl text-primary">Página no encontrada</h1>
      <p className="mt-3 text-brand-gray">
        La página que buscas no existe o fue movida.
      </p>
      <Link to="/" className="mt-8 inline-block">
        <Button>Volver al inicio</Button>
      </Link>
    </div>
  );
}
