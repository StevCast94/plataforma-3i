import { Share2, FileText } from 'lucide-react';
import type { PublicLot } from '@shared/types';
import { useAuth } from '@/hooks/useAuth';
import { Link, useLang } from '@/hooks/useLang';
import { useToast } from '@/components/shared/Toast';

/** Dirección pública de la ficha de un solar. */
export function lotPath(projectSlug: string, code: string): string {
  return `/proyectos/${projectSlug}/solar/${encodeURIComponent(code)}`;
}

/**
 * Enlace para compartir la ficha de un solar. Si quien comparte es socio con
 * sesión iniciada, el enlace lleva su código: la venta queda atribuida a él.
 */
export function useLotShareUrl(projectSlug: string, code: string): string {
  const { path } = useLang();
  const { member } = useAuth();
  const url = new URL(path(lotPath(projectSlug, code)), window.location.origin);
  if (member?.referralCode) url.searchParams.set('ref', member.referralCode);
  return url.toString();
}

export function ShareLot({
  lot,
  projectName,
  projectSlug,
  showFullSheet = true,
  className = '',
}: {
  lot: PublicLot;
  projectName: string;
  projectSlug: string;
  /** Oculta "Ver ficha completa" cuando ya se está en ella. */
  showFullSheet?: boolean;
  className?: string;
}) {
  const { t } = useLang();
  const { toast } = useToast();
  const { member } = useAuth();
  const url = useLotShareUrl(projectSlug, lot.code);

  async function share() {
    const title = `${t('Solar')} ${lot.code} · ${projectName}`;
    // Menú nativo del teléfono (WhatsApp, Telegram…) cuando existe.
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (e) {
        if ((e as Error).name === 'AbortError') return; // lo cerró el usuario
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast(t('Enlace copiado: pégalo donde quieras compartirlo'), 'success');
    } catch {
      window.prompt(t('Copia este enlace'), url);
    }
  }

  return (
    <div className={className}>
      <div className={`grid gap-2 ${showFullSheet ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <button
          type="button"
          onClick={share}
          className="flex items-center justify-center gap-2 rounded-lg border border-black/15 bg-white px-3 py-2.5 text-sm font-semibold text-primary hover:bg-light"
        >
          <Share2 className="h-4 w-4" />
          {t('Compartir ficha')}
        </button>
        {showFullSheet && (
          <Link
            to={lotPath(projectSlug, lot.code)}
            className="flex items-center justify-center gap-2 rounded-lg border border-black/15 bg-white px-3 py-2.5 text-sm font-semibold text-primary hover:bg-light"
          >
            <FileText className="h-4 w-4" />
            {t('Ficha completa')}
          </Link>
        )}
      </div>
      {member?.referralCode && (
        <p className="mt-1.5 text-center text-[11px] text-brand-gray">
          {t('El enlace lleva tu código de socio {code}.', { code: member.referralCode })}
        </p>
      )}
    </div>
  );
}
