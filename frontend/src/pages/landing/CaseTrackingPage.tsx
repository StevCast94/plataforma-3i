import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, Circle, CircleDot, FileText, Upload } from 'lucide-react';
import { useLang } from '@/hooks/useLang';
import { Seo } from '@/components/shared/Seo';
import { BrandLoader } from '@/components/brand/Isotipo';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { fileToDataUri, MAX_DOC_BYTES } from '@/lib/fileToDataUri';

// /seguimiento/:token — el cliente sigue su expediente: etapas, lo que falta, documentos y pagos.

interface Step {
  id: string;
  order: number;
  title: string;
  description: string | null;
  party: 'team' | 'client' | 'institution';
  institution: string | null;
  requirements: string[];
  status: 'PENDING' | 'ACTIVE' | 'DONE' | 'SKIPPED';
  dueDate: string | null;
  doneAt: string | null;
}
interface CaseView {
  number: number;
  title: string;
  clientName: string;
  status: 'ACTIVE' | 'ON_HOLD' | 'DONE' | 'CANCELLED';
  dueDate: string | null;
  steps: Step[];
  documents: { id: string; name: string; uploadedBy: string; createdAt: string }[];
  events: { text: string; createdAt: string }[];
  payments: { label: string; amount: number; dueDate: string | null; paidAt: string | null }[];
}

const TX = {
  es: {
    kicker: 'Seguimiento de tu trámite',
    hello: (n: string) => `Hola, ${n}`,
    status: { ACTIVE: 'En curso', ON_HOLD: 'En pausa', DONE: 'Terminado', CANCELLED: 'Cancelado' },
    progress: (d: number, t: number) => `${d} de ${t} etapas cumplidas`,
    eta: 'Fecha estimada de entrega',
    steps: 'Etapas',
    who: { team: 'Grupo 3i', client: 'Te toca a ti', institution: '' },
    youParty: 'Tú',
    due: 'Plazo estimado',
    done: 'Cumplida',
    needs: 'Necesitamos',
    docs: 'Documentos',
    noDocs: 'Todavía no hay documentos.',
    you: 'Subido por ti',
    upload: 'Subir un documento (PDF o foto)',
    uploading: 'Subiendo…',
    uploaded: 'Recibimos tu documento. ¡Gracias!',
    tooBig: 'El archivo pesa más de 8 MB.',
    docName: 'Nombre del documento',
    forStep: 'Etapa (opcional)',
    payments: 'Pagos',
    paid: 'Pagado',
    pending: 'Pendiente',
    history: 'Novedades',
    notFound: 'No encontramos este expediente. Pide a tu asesor un enlace nuevo.',
  },
  en: {
    kicker: 'Your case status',
    hello: (n: string) => `Hi, ${n}`,
    status: { ACTIVE: 'In progress', ON_HOLD: 'On hold', DONE: 'Complete', CANCELLED: 'Cancelled' },
    progress: (d: number, t: number) => `${d} of ${t} steps complete`,
    eta: 'Estimated completion',
    steps: 'Steps',
    who: { team: 'Grupo 3i', client: 'Your turn', institution: '' },
    youParty: 'You',
    due: 'Target date',
    done: 'Done',
    needs: 'We need',
    docs: 'Documents',
    noDocs: 'No documents yet.',
    you: 'Uploaded by you',
    upload: 'Upload a document (PDF or photo)',
    uploading: 'Uploading…',
    uploaded: 'We got your document. Thank you!',
    tooBig: 'The file is larger than 8 MB.',
    docName: 'Document name',
    forStep: 'Step (optional)',
    payments: 'Payments',
    paid: 'Paid',
    pending: 'Pending',
    history: 'Updates',
    notFound: 'We couldn’t find this case. Ask your agent for a new link.',
  },
};

export default function CaseTrackingPage() {
  const { token = '' } = useParams();
  const { lang } = useLang();
  const tx = TX[lang];
  const [c, setC] = useState<CaseView | null | undefined>(undefined);
  const [docName, setDocName] = useState('');
  const [stepId, setStepId] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => api.get<CaseView>(`/services/case/${token}`).then(setC).catch(() => setC(null));
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fmt = (d: string) => new Date(d).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-EC', { day: 'numeric', month: 'short', year: 'numeric' });

  async function upload(file: File) {
    setMsg('');
    if (file.size > MAX_DOC_BYTES) {
      setMsg(tx.tooBig);
      return;
    }
    setBusy(true);
    try {
      await api.post(`/services/case/${token}/documents`, { dataUri: await fileToDataUri(file), name: docName.trim() || file.name, stepId: stepId || undefined });
      setMsg(tx.uploaded);
      setDocName('');
      await load();
    } catch (err) {
      setMsg((err as Error).message);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  if (c === undefined) return <BrandLoader className="min-h-[60vh]" />;
  if (c === null) return <p className="mx-auto max-w-xl px-4 py-24 text-center text-brand-gray">{tx.notFound}</p>;

  const done = c.steps.filter((s) => s.status === 'DONE' || s.status === 'SKIPPED').length;
  const pct = c.steps.length ? Math.round((done / c.steps.length) * 100) : 0;
  const clientSteps = c.steps.filter((s) => s.party === 'client' && s.status !== 'DONE' && s.status !== 'SKIPPED');

  return (
    <div className="bg-light">
      <Seo title={`${tx.kicker} · ${c.title}`} noindex />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6">
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{tx.kicker} · N.º {c.number}</p>
          <h1 className="mt-1 font-serif text-3xl font-bold text-primary">{c.title}</h1>
          <p className="mt-1 text-brand-gray">{tx.hello(c.clientName)}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full bg-primary px-3 py-1 font-semibold text-white">{tx.status[c.status]}</span>
            <span className="text-brand-gray">{tx.progress(done, c.steps.length)}</span>
            {c.dueDate && c.status === 'ACTIVE' && <span className="text-brand-gray">· {tx.eta}: {fmt(c.dueDate)}</span>}
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-light" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-secondary" style={{ width: `${pct}%` }} />
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-serif text-2xl font-bold text-primary">{tx.steps}</h2>
          <ol className="mt-4 space-y-4">
            {c.steps.map((s) => {
              const isDone = s.status === 'DONE' || s.status === 'SKIPPED';
              const active = s.status === 'ACTIVE';
              const Icon = isDone ? CheckCircle2 : active ? CircleDot : Circle;
              const who = s.party === 'institution' ? s.institution ?? '' : s.party === 'client' && isDone ? tx.youParty : tx.who[s.party];
              return (
                <li key={s.id} className={`flex gap-3 ${!isDone && !active ? 'opacity-60' : ''}`}>
                  <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${isDone ? 'text-green-600' : active ? 'text-secondary' : 'text-brand-gray'}`} />
                  <div className={`min-w-0 flex-1 ${active ? 'rounded-xl bg-secondary/10 p-3' : ''}`}>
                    <p className={`font-medium ${s.status === 'SKIPPED' ? 'line-through' : ''} text-primary`}>{s.title}</p>
                    <p className="text-xs text-brand-gray">
                      {who}
                      {isDone && s.doneAt ? ` · ${tx.done} ${fmt(s.doneAt)}` : ''}
                      {active && s.dueDate ? ` · ${tx.due}: ${fmt(s.dueDate)}` : ''}
                    </p>
                    {s.description && <p className="mt-1 whitespace-pre-line text-sm text-brand-gray">{s.description}</p>}
                    {!isDone && s.party === 'client' && s.requirements.length > 0 && (
                      <div className="mt-2 text-sm">
                        <p className="font-medium text-primary">{tx.needs}:</p>
                        <ul className="ml-4 list-disc text-brand-gray">
                          {s.requirements.map((r) => <li key={r}>{r}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-serif text-2xl font-bold text-primary">{tx.docs}</h2>
          {c.documents.length === 0 ? (
            <p className="mt-2 text-sm text-brand-gray">{tx.noDocs}</p>
          ) : (
            <ul className="mt-3 divide-y divide-black/5">
              {c.documents.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <a href={`/api/services/case/${token}/documents/${d.id}`} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-2 font-medium text-accent hover:underline">
                    <FileText className="h-4 w-4 shrink-0" />
                    <span className="truncate">{d.name}</span>
                  </a>
                  <span className="shrink-0 text-xs text-brand-gray">{d.uploadedBy === 'client' ? `${tx.you} · ` : ''}{fmt(d.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
          {c.status !== 'CANCELLED' && c.status !== 'DONE' && (
            <div className="mt-4 rounded-xl bg-light p-4">
              <p className="text-sm font-semibold text-primary">{tx.upload}</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <input value={docName} onChange={(e) => setDocName(e.target.value)} placeholder={tx.docName} className="rounded-lg border border-black/15 px-3 py-2 text-sm" />
                <select value={stepId} onChange={(e) => setStepId(e.target.value)} className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm">
                  <option value="">{tx.forStep}</option>
                  {(clientSteps.length ? clientSteps : c.steps).map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
              </div>
              <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:brightness-110">
                <Upload className="h-4 w-4" />
                {busy ? tx.uploading : tx.upload.split(' (')[0]}
                <input ref={fileRef} type="file" accept="application/pdf,image/png,image/jpeg,image/webp" className="sr-only" disabled={busy} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
              </label>
              {msg && <p className="mt-2 text-sm text-primary">{msg}</p>}
            </div>
          )}
        </section>

        {c.payments.length > 0 && (
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="font-serif text-2xl font-bold text-primary">{tx.payments}</h2>
            <ul className="mt-3 divide-y divide-black/5 text-sm">
              {c.payments.map((p, i) => (
                <li key={i} className="flex items-center justify-between gap-3 py-2">
                  <span>{p.label}{p.dueDate && !p.paidAt ? ` · ${fmt(p.dueDate)}` : ''}</span>
                  <span className="flex items-center gap-3">
                    <span className="tabular-nums">{formatCurrency(p.amount)}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.paidAt ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-900'}`}>{p.paidAt ? tx.paid : tx.pending}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {c.events.length > 0 && (
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="font-serif text-2xl font-bold text-primary">{tx.history}</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {c.events.map((e, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-24 shrink-0 text-xs text-brand-gray">{fmt(e.createdAt)}</span>
                  <span className="text-primary">{e.text}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
