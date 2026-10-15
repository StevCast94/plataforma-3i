import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UserCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useLang } from '@/hooks/useLang';

// Si alguien con la sesión de su oficina abierta en este dispositivo abre un
// enlace de referido (?ref=…, también tras /r/:code), le avisamos: ya tiene
// cuenta, el enlace es para personas nuevas, y le ofrecemos ir a su oficina.
// Una vez por código y por sesión del navegador.
const SEEN = 'g3i_ref_session_notice';

export function RefSessionNotice() {
  const { member } = useAuth();
  const { search, pathname } = useLocation();
  const navigate = useNavigate();
  const { t } = useLang();
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    const ref = new URLSearchParams(search).get('ref')?.trim();
    if (!ref || !member || pathname.startsWith('/oficina/') && !pathname.startsWith('/oficina/registro')) return;
    try {
      const seen = JSON.parse(sessionStorage.getItem(SEEN) ?? '[]') as string[];
      if (seen.includes(ref)) return;
      sessionStorage.setItem(SEEN, JSON.stringify([...seen, ref]));
    } catch { /* sin almacenamiento: se muestra igual */ }
    setCode(ref);
  }, [search, member, pathname]);

  if (!code || !member) return null;
  const own = [member.referralCode, member.referralSlug].some((c) => c && c.toUpperCase() === code.toUpperCase());
  const first = member.fullName?.split(' ')[0] ?? '';

  return (
    <Modal open onClose={() => setCode(null)} title={t('Ya tienes una cuenta')}>
      <div className="flex gap-3">
        <UserCheck className="h-8 w-8 flex-none text-accent" aria-hidden />
        <div className="space-y-2 text-sm text-primary">
          <p>
            {t('Hola, {n}. En este dispositivo ya tienes una cuenta y la sesión iniciada en tu oficina virtual.', { n: first })}
          </p>
          <p className="text-brand-gray">
            {own
              ? t('Este es tu propio enlace de referido: compártelo con personas nuevas para que se registren con él.')
              : t('Los enlaces de referido son para personas que aún no tienen cuenta, así que no necesitas registrarte otra vez.')}
          </p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <Button variant="ghost" onClick={() => setCode(null)}>{t('Seguir navegando')}</Button>
        <Button onClick={() => { setCode(null); navigate('/oficina/dashboard'); }}>
          {t('Ir a mi oficina virtual')}
        </Button>
      </div>
    </Modal>
  );
}
