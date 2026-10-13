import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Link, useLang } from '@/hooks/useLang';
import { Seo } from '@/components/shared/Seo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BrandLoader } from '@/components/brand/Isotipo';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

// /propuesta-servicios/:token — propuesta privada de servicios. El cliente la revisa y la
// acepta escribiendo su nombre; al aceptarla se abre su expediente con seguimiento en línea.

interface Quote {
  number: number;
  title: string;
  clientName: string;
  items: { description: string; qty: number; unit?: string; unitPrice: number }[];
  taxRate: number;
  subtotal: number;
  total: number;
  milestones: { label: string; pct: number }[] | null;
  terms: string | null;
  validUntil: string | null;
  status: 'VIEWED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  acceptedAt: string | null;
  acceptedBy: string | null;
  caseToken: string | null;
  createdAt: string;
}

const TX = {
  es: {
    kicker: 'Propuesta de servicios',
    for: 'Para',
    date: 'Fecha',
    valid: 'Válida hasta',
    cols: ['Detalle', 'Cant.', 'Valor unitario', 'Total'],
    subtotal: 'Subtotal',
    tax: (p: number) => `IVA ${p} %`,
    total: 'Total',
    plan: 'Forma de pago',
    terms: 'Condiciones',
    acceptTitle: 'Aceptar la propuesta',
    acceptSub: 'Escribe tu nombre completo. Al aceptar, abrimos tu expediente y te compartimos el enlace para seguir cada etapa.',
    name: 'Nombre completo',
    accept: 'Acepto la propuesta',
    accepting: 'Aceptando…',
    accepted: (n: string, d: string) => `Aceptada por ${n} el ${d}.`,
    track: 'Ver el seguimiento de mi trámite',
    expired: 'Esta propuesta venció. Escríbenos y te enviamos una actualizada.',
    rejected: 'Esta propuesta ya no está vigente.',
    notFound: 'No encontramos esta propuesta.',
    print: 'Descargar en PDF',
  },
  en: {
    kicker: 'Services proposal',
    for: 'Prepared for',
    date: 'Date',
    valid: 'Valid until',
    cols: ['Description', 'Qty', 'Unit price', 'Total'],
    subtotal: 'Subtotal',
    tax: (p: number) => `VAT ${p}%`,
    total: 'Total',
    plan: 'Payment schedule',
    terms: 'Terms',
    acceptTitle: 'Accept this proposal',
    acceptSub: 'Type your full name. Once you accept, we open your case and send you a link to follow every step.',
    name: 'Full name',
    accept: 'I accept this proposal',
    accepting: 'Accepting…',
    accepted: (n: string, d: string) => `Accepted by ${n} on ${d}.`,
    track: 'Track my case',
    expired: 'This proposal has expired. Message us and we’ll send you an updated one.',
    rejected: 'This proposal is no longer valid.',
    notFound: 'We couldn’t find this proposal.',
    print: 'Download as PDF',
  },
};

export default function ServiceQuotePage() {
  const { token = '' } = useParams();
  const { lang } = useLang();
  const tx = TX[lang];
  const [q, setQ] = useState<Quote | null | undefined>(undefined);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = () => api.get<Quote>(`/services/quote/${token}`).then(setQ).catch(() => setQ(null));
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fmtDate = (d: string) => new Date(d).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-EC', { day: 'numeric', month: 'long', year: 'numeric' });

  async function accept() {
    setBusy(true);
    setError('');
    try {
      await api.post(`/services/quote/${token}/accept`, { name });
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (q === undefined) return <BrandLoader className="min-h-[60vh]" />;
  if (q === null) return <p className="mx-auto max-w-xl px-4 py-24 text-center text-brand-gray">{tx.notFound}</p>;

  return (
    <div className="bg-light print:bg-white">
      <Seo title={`${tx.kicker} · ${q.title}`} noindex />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 print:p-0">
        <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8 print:shadow-none">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{tx.kicker} · N.º {q.number}</p>
              <h1 className="mt-1 font-serif text-3xl font-bold text-primary">{q.title}</h1>
            </div>
            <p className="font-serif text-xl font-bold text-primary">
              Grupo<span className="text-secondary"> 3i</span>
            </p>
          </div>
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
            <div><dt className="text-brand-gray">{tx.for}</dt><dd className="font-medium text-primary">{q.clientName}</dd></div>
            <div><dt className="text-brand-gray">{tx.date}</dt><dd className="font-medium text-primary">{fmtDate(q.createdAt)}</dd></div>
            {q.validUntil && <div><dt className="text-brand-gray">{tx.valid}</dt><dd className="font-medium text-primary">{fmtDate(q.validUntil)}</dd></div>}
          </dl>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-black/10 text-xs uppercase tracking-wide text-brand-gray">
                <tr>
                  <th className="py-2 pr-3">{tx.cols[0]}</th>
                  <th className="py-2 pr-3 text-right">{tx.cols[1]}</th>
                  <th className="py-2 pr-3 text-right">{tx.cols[2]}</th>
                  <th className="py-2 text-right">{tx.cols[3]}</th>
                </tr>
              </thead>
              <tbody>
                {q.items.map((i, k) => (
                  <tr key={k} className="border-b border-black/5">
                    <td className="py-2 pr-3 text-primary">{i.description}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{i.qty}{i.unit ? ` ${i.unit}` : ''}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{formatCurrency(i.unitPrice)}</td>
                    <td className="py-2 text-right tabular-nums">{formatCurrency(i.qty * i.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="text-sm">
                <tr><td colSpan={3} className="pt-3 text-right text-brand-gray">{tx.subtotal}</td><td className="pt-3 text-right tabular-nums">{formatCurrency(q.subtotal)}</td></tr>
                {q.taxRate > 0 && <tr><td colSpan={3} className="text-right text-brand-gray">{tx.tax(Math.round(q.taxRate * 100))}</td><td className="text-right tabular-nums">{formatCurrency(q.total - q.subtotal)}</td></tr>}
                <tr className="font-serif text-xl font-bold text-primary"><td colSpan={3} className="pt-2 text-right">{tx.total}</td><td className="pt-2 text-right tabular-nums">{formatCurrency(q.total)}</td></tr>
              </tfoot>
            </table>
          </div>

          {q.milestones?.length ? (
            <div className="mt-6">
              <p className="font-semibold text-primary">{tx.plan}</p>
              <ul className="mt-2 space-y-1 text-sm">
                {q.milestones.map((m, k) => (
                  <li key={k} className="flex justify-between gap-3 border-b border-black/5 py-1">
                    <span>{m.label} ({m.pct} %)</span>
                    <span className="tabular-nums">{formatCurrency((q.total * m.pct) / 100)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {q.terms && (
            <div className="mt-6">
              <p className="font-semibold text-primary">{tx.terms}</p>
              <p className="mt-1 whitespace-pre-line text-sm text-brand-gray">{q.terms}</p>
            </div>
          )}

          <div className="mt-8 border-t border-black/10 pt-6 print:hidden">
            {q.status === 'ACCEPTED' ? (
              <div className="rounded-xl bg-green-50 p-4 text-sm text-green-800">
                <p>✓ {tx.accepted(q.acceptedBy ?? '', q.acceptedAt ? fmtDate(q.acceptedAt) : '')}</p>
                {q.caseToken && (
                  <Link to={`/seguimiento/${q.caseToken}`} className="mt-2 inline-block font-semibold underline">
                    {tx.track} →
                  </Link>
                )}
              </div>
            ) : q.status === 'EXPIRED' ? (
              <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">{tx.expired}</p>
            ) : q.status === 'REJECTED' ? (
              <p className="rounded-xl bg-light p-4 text-sm text-brand-gray">{tx.rejected}</p>
            ) : (
              <>
                <p className="font-serif text-xl font-bold text-primary">{tx.acceptTitle}</p>
                <p className="mt-1 text-sm text-brand-gray">{tx.acceptSub}</p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <Input label={tx.name} value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <Button onClick={accept} disabled={busy || name.trim().length < 5}>{busy ? tx.accepting : tx.accept}</Button>
                </div>
                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
              </>
            )}
            <button type="button" onClick={() => window.print()} className="mt-4 text-sm font-medium text-accent underline">
              {tx.print}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
