import { Link, useLang } from '@/hooks/useLang';
import { Button } from '@/components/ui/Button';

export default function NotFoundPage() {
  const { t } = useLang();
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
      <p className="font-serif text-7xl font-bold text-secondary">404</p>
      <h1 className="mt-4 text-3xl text-primary">{t('Página no encontrada')}</h1>
      <p className="mt-3 text-brand-gray">
        {t('La página que buscas no existe o fue movida.')}
      </p>
      <Link to="/" className="mt-8 inline-block">
        <Button>{t('Volver al inicio')}</Button>
      </Link>
    </div>
  );
}
