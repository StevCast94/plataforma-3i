import { Link, useLang } from '@/hooks/useLang';

/** Línea bajo los formularios: qué se acepta al enviar y dónde leerlo. */
export function PrivacyNote({ account = false, className = '' }: { account?: boolean; className?: string }) {
  const { t } = useLang();
  return (
    <p className={`text-center text-[11px] leading-snug text-brand-gray ${className}`}>
      {account ? t('Al crear tu cuenta aceptas los') : t('Al enviar aceptas los')}{' '}
      <Link to="/terminos" className="underline">{t('términos')}</Link> {t('y la')}{' '}
      <Link to="/privacidad" className="underline">{t('política de privacidad')}</Link>.
    </p>
  );
}
