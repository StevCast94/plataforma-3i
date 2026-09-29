import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import QRCode from 'qrcode';
import { TreeDeciduous } from 'lucide-react';
import { WhatsAppCTA } from '@/components/shared/WhatsAppCTA';
import { BOSQUE_NAME, bosqueGet, bosquePath, bosqueUrl, fechaLarga, type PublicAdoption } from '@/lib/bosque';

/**
 * Estado de una adopción y, una vez confirmada, su certificado imprimible.
 * El QR lleva a la página del árbol (o de la adopción si son varios).
 */
export default function BosqueCertificatePage() {
  const { code = '' } = useParams();
  const [a, setA] = useState<PublicAdoption | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    bosqueGet<PublicAdoption>(`/adoption/${encodeURIComponent(code)}`)
      .then(setA)
      .catch((e: Error) => setError(e.message));
  }, [code]);

  const target = a ? (a.trees.length === 1 ? bosqueUrl(`/arbol/${a.trees[0].code}`) : bosqueUrl(`/certificado/${a.code}`)) : null;
  useEffect(() => {
    if (!target) return;
    QRCode.toDataURL(target, { margin: 1, width: 360, color: { dark: '#12301f', light: '#ffffff' } }).then(setQr);
  }, [target]);

  if (error)
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <p className="font-bosque text-3xl font-semibold text-bosque">No encontramos esa adopción</p>
        <p className="mt-3 text-bosque-dark/70">Revisa el código {code.toUpperCase()}.</p>
      </div>
    );
  if (!a) return <div className="min-h-[60vh]" />;

  if (a.status === 'pending')
    return (
      <div className="mx-auto max-w-xl px-4 py-20">
        <Helmet><title>{`${a.code} · ${BOSQUE_NAME}`}</title></Helmet>
        <p className="font-mono text-sm tracking-widest text-bosque/70">{a.code}</p>
        <h1 className="mt-2 font-bosque text-4xl font-semibold text-bosque">Tu adopción está reservada</h1>
        <p className="mt-4 leading-relaxed text-bosque-dark/80">
          Registramos {a.quantity} {a.species?.name ?? 'árbol'} a nombre de <strong>{a.dedication}</strong>. En cuanto se
          confirme el pago, esta página se convierte en tu certificado y te asignamos tu árbol.
        </p>
        <WhatsAppCTA message={`Hola, quiero pagar mi adopción ${a.code} en ${BOSQUE_NAME}.`} className="mt-8">
          Coordinar pago por WhatsApp
        </WhatsAppCTA>
      </div>
    );

  const speciesName = a.species?.name ?? (a.trees[0]?.species || 'Árbol nativo');

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 print:max-w-none print:p-0">
      <Helmet><title>{`Certificado ${a.code} · ${BOSQUE_NAME}`}</title></Helmet>

      <article className="relative overflow-hidden rounded-3xl border-[10px] border-bosque bg-white p-8 text-center shadow-xl sm:p-14 print:rounded-none print:shadow-none">
        <TreeDeciduous className="mx-auto h-12 w-12 text-guayacan" strokeWidth={1.4} />
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.35em] text-bosque/70">{BOSQUE_NAME}</p>
        <h1 className="mt-3 font-bosque text-4xl font-semibold text-bosque sm:text-5xl">Certificado de adopción</h1>
        <p className="mt-8 text-bosque-dark/70">Se certifica que</p>
        <p className="mt-2 font-bosque text-3xl font-semibold text-bosque-dark sm:text-4xl">{a.dedication}</p>
        <p className="mx-auto mt-5 max-w-xl leading-relaxed text-bosque-dark/80">
          {a.quantity === 1
            ? `es padrino de un ${speciesName.toLowerCase()}`
            : `es padrino de ${a.quantity} árboles de ${speciesName.toLowerCase()}`}{' '}
          en el bosque de conservación de Manglaralto, Santa Elena, Ecuador.
          {a.source === 'solar' && a.lotCode ? ` Árbol incluido con el solar ${a.lotCode} de Montañita View.` : ''}{' '}
          {a.quantity === 1 ? 'Este árbol nunca será talado.' : 'Estos árboles nunca serán talados.'}
        </p>

        {a.trees.length > 0 ? (
          <p className="mt-6 font-mono text-sm tracking-wider text-bosque">{a.trees.map((t) => t.code).join(' · ')}</p>
        ) : (
          <p className="mt-6 text-sm text-bosque-dark/60">Árbol en vivero: se asigna su código y ubicación al sembrarse.</p>
        )}

        <div className="mt-10 flex flex-col items-center justify-between gap-6 border-t border-bosque/15 pt-8 sm:flex-row sm:text-left">
          <div className="text-sm text-bosque-dark/70">
            <p>
              Código de adopción: <span className="font-mono font-semibold text-bosque">{a.code}</span>
            </p>
            <p className="mt-1">Fecha: {fechaLarga(a.confirmedAt ?? a.createdAt)}</p>
            <p className="mt-4 font-semibold text-bosque-dark">Ing. Génesis Baquerizo</p>
            <p>Gestión técnica del bosque</p>
          </div>
          {qr && (
            <div className="text-center">
              <img src={qr} alt="Código QR del árbol" className="h-32 w-32" />
              <p className="mt-1 text-[11px] text-bosque-dark/60">Escanea para ver tu árbol</p>
            </div>
          )}
        </div>
      </article>

      <div className="mt-8 flex flex-wrap justify-center gap-4 print:hidden">
        <button onClick={() => window.print()} className="rounded-full bg-bosque px-6 py-3 text-sm font-semibold text-white hover:bg-bosque-dark">
          Imprimir o guardar en PDF
        </button>
        {a.trees.map((t) => (
          <Link key={t.code} to={bosquePath(`/arbol/${t.code}`)} className="rounded-full border border-bosque/30 px-6 py-3 text-sm font-semibold text-bosque hover:bg-white">
            Ver {t.code}
          </Link>
        ))}
      </div>
    </div>
  );
}
