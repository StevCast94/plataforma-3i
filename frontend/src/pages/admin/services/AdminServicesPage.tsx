import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/shared/Toast';
import { useAdminGet } from '@/hooks/useAdminAPI';
import { adminApi } from '@/lib/adminApi';
import { formatCurrency } from '@/lib/utils';
import { QuoteEditor } from './QuoteEditor';
import {
  CASE_STATUS, QUOTE_STATUS, REQUEST_STATUS, fmtDate, staffName,
  type CaseRow, type Catalog, type Quote, type ServiceRequest, type Staff,
} from './types';

// Servicios integrales: solicitudes → propuestas → expedientes, más indicadores.
type Tab = 'requests' | 'quotes' | 'cases' | 'metrics';
const TABS: [Tab, string][] = [['requests', 'Solicitudes'], ['quotes', 'Propuestas'], ['cases', 'Expedientes'], ['metrics', 'Indicadores']];

const pill = (cls: string, text: string) => <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>{text}</span>;
const th = 'px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-brand-gray';
const td = 'px-3 py-2 align-top text-sm';

export default function AdminServicesPage() {
  const [tab, setTab] = useState<Tab>('requests');
  const { data: catalog } = useAdminGet<Catalog>('/admin/services/catalog');
  const { data: staff } = useAdminGet<Staff[]>('/admin/services/staff');
  const svcName = (id: string) => catalog?.services.find((s) => s.id === id)?.name ?? id;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-primary">Servicios integrales</h1>
        <p className="text-sm text-brand-gray">Solicitudes de clientes, propuestas privadas y el seguimiento de cada trámite.</p>
      </div>
      <div className="flex flex-wrap gap-2" role="tablist">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${tab === id ? 'bg-primary text-white' : 'bg-white text-primary ring-1 ring-black/10 hover:bg-light'}`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'requests' && <Requests catalog={catalog} staff={staff} svcName={svcName} />}
      {tab === 'quotes' && <Quotes catalog={catalog} />}
      {tab === 'cases' && <Cases catalog={catalog} staff={staff} />}
      {tab === 'metrics' && <Metrics staff={staff} />}
    </div>
  );
}

// ---------------- Solicitudes ----------------
function Requests({ catalog, staff, svcName }: { catalog: Catalog | null; staff: Staff[] | null; svcName: (id: string) => string }) {
  const { toast } = useToast();
  const [status, setStatus] = useState('');
  const { data, loading, reload } = useAdminGet<ServiceRequest[]>(`/admin/services/requests${status ? `?status=${status}` : ''}`);
  const [quoteFrom, setQuoteFrom] = useState<ServiceRequest | null>(null);
  const [caseFrom, setCaseFrom] = useState<ServiceRequest | null>(null);
  const [notes, setNotes] = useState<ServiceRequest | null>(null);

  async function update(r: ServiceRequest, patch: Partial<ServiceRequest>) {
    try {
      await adminApi.put(`/admin/services/requests/${r.id}`, patch);
      reload();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-black/15 px-3 py-2 text-sm">
          <option value="">Todos los estados</option>
          {Object.entries(REQUEST_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <a href="/servicios" target="_blank" rel="noreferrer" className="text-sm text-accent hover:underline">Ver la página pública /servicios ↗</a>
      </div>
      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full">
          <thead className="border-b border-black/5"><tr><th className={th}>Fecha</th><th className={th}>Cliente</th><th className={th}>Servicios</th><th className={th}>Estado</th><th className={th}>Responsable</th><th className={th} /></tr></thead>
          <tbody>
            {(data ?? []).map((r) => {
              const wa = r.phone.replace(/\D/g, '');
              return (
                <tr key={r.id} className="border-b border-black/5">
                  <td className={td}>{fmtDate(r.createdAt)}</td>
                  <td className={td}>
                    <p className="font-medium text-primary">{r.name}{r.company ? ` · ${r.company}` : ''}</p>
                    <p className="text-xs text-brand-gray">{r.phone}{r.email ? ` · ${r.email}` : ''}{r.location ? ` · ${r.location}` : ''}{r.lang === 'en' ? ' · EN' : ''}</p>
                    {r.message && <p className="mt-1 max-w-md whitespace-pre-line text-xs text-primary">{r.message}</p>}
                    {r.notes && <p className="mt-1 max-w-md whitespace-pre-line text-xs text-amber-800">📝 {r.notes}</p>}
                  </td>
                  <td className={td}>{r.services.map(svcName).join(', ')}</td>
                  <td className={td}>
                    <select value={r.status} onChange={(e) => update(r, { status: e.target.value as ServiceRequest['status'] })} className="rounded border border-black/15 px-2 py-1 text-xs">
                      {Object.entries(REQUEST_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    {r.quotes.map((q) => <p key={q.id} className="mt-1 text-xs text-brand-gray">Propuesta N.º {q.number}: {QUOTE_STATUS[q.status as Quote['status']] ?? q.status}</p>)}
                    {r.cases.map((c) => <Link key={c.id} to={`/admin/servicios/expedientes/${c.id}`} className="mt-1 block text-xs text-accent hover:underline">Expediente N.º {c.number}</Link>)}
                  </td>
                  <td className={td}>
                    <select value={r.ownerId ?? ''} onChange={(e) => update(r, { ownerId: e.target.value || null })} className="rounded border border-black/15 px-2 py-1 text-xs">
                      <option value="">Sin asignar</option>
                      {staff?.map((s) => <option key={s.id} value={s.id}>{s.fullName || s.username}</option>)}
                    </select>
                  </td>
                  <td className={`${td} whitespace-nowrap`}>
                    <div className="flex flex-col items-end gap-1">
                      {wa && <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" onClick={() => r.status === 'NEW' && update(r, { status: 'CONTACTED' })} className="text-xs font-medium text-green-700 hover:underline">WhatsApp</a>}
                      <button className="text-xs font-medium text-accent hover:underline" onClick={() => setQuoteFrom(r)}>Hacer propuesta</button>
                      <button className="text-xs font-medium text-accent hover:underline" onClick={() => setCaseFrom(r)}>Abrir expediente</button>
                      <button className="text-xs text-brand-gray hover:underline" onClick={() => setNotes(r)}>Notas</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!loading && !data?.length && <p className="p-6 text-center text-sm text-brand-gray">Todavía no hay solicitudes. Llegan desde grupo3i.com/servicios.</p>}
      </div>
      <QuoteEditor open={!!quoteFrom} quote={null} from={quoteFrom} catalog={catalog} onClose={() => setQuoteFrom(null)} onSaved={() => { setQuoteFrom(null); reload(); toast('Propuesta creada como borrador. Envíala desde «Propuestas».', 'success'); }} />
      <NewCase open={!!caseFrom} from={caseFrom} catalog={catalog} staff={staff} onClose={() => setCaseFrom(null)} />
      <NotesModal req={notes} onClose={() => setNotes(null)} onSaved={reload} />
    </div>
  );
}

function NotesModal({ req, onClose, onSaved }: { req: ServiceRequest | null; onClose: () => void; onSaved: () => void }) {
  const [text, setText] = useState('');
  const [id, setId] = useState('');
  if (req && req.id !== id) {
    setId(req.id);
    setText(req.notes ?? '');
  }
  return (
    <Modal open={!!req} onClose={onClose} title={`Notas · ${req?.name ?? ''}`}>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm" />
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button onClick={async () => { await adminApi.put(`/admin/services/requests/${req!.id}`, { notes: text }); onSaved(); onClose(); }}>Guardar</Button>
      </div>
    </Modal>
  );
}

// ---------------- Propuestas ----------------
function Quotes({ catalog }: { catalog: Catalog | null }) {
  const { toast } = useToast();
  const { data, loading, reload } = useAdminGet<Quote[]>('/admin/services/quotes');
  const [editing, setEditing] = useState<Quote | null>(null);
  const [creating, setCreating] = useState(false);

  async function setStatus(q: Quote, status: string) {
    try {
      const r = await adminApi.post<Quote>(`/admin/services/quotes/${q.id}/status`, { status });
      reload();
      if (status === 'SENT' && r.whatsapp) window.open(r.whatsapp, '_blank');
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }
  async function copy(link: string) {
    await navigator.clipboard.writeText(link).catch(() => {});
    toast('Enlace copiado', 'success');
  }

  return (
    <div className="space-y-3">
      <Button size="sm" onClick={() => setCreating(true)}>+ Nueva propuesta</Button>
      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full">
          <thead className="border-b border-black/5"><tr><th className={th}>N.º</th><th className={th}>Cliente y título</th><th className={th}>Total</th><th className={th}>Estado</th><th className={th} /></tr></thead>
          <tbody>
            {(data ?? []).map((q) => (
              <tr key={q.id} className="border-b border-black/5">
                <td className={td}>{q.number}</td>
                <td className={td}>
                  <p className="font-medium text-primary">{q.clientName}</p>
                  <p className="text-xs text-brand-gray">{q.title} · {fmtDate(q.createdAt)}{q.lang === 'en' ? ' · EN' : ''}</p>
                </td>
                <td className={`${td} tabular-nums`}>{formatCurrency(q.total)}</td>
                <td className={td}>
                  {pill(q.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' : q.status === 'DRAFT' ? 'bg-light text-brand-gray' : q.status === 'REJECTED' ? 'bg-red-50 text-red-700' : 'bg-amber-100 text-amber-900', QUOTE_STATUS[q.status])}
                  {q.cases.map((c) => <Link key={c.id} to={`/admin/servicios/expedientes/${c.id}`} className="mt-1 block text-xs text-accent hover:underline">Expediente N.º {c.number}</Link>)}
                </td>
                <td className={`${td} whitespace-nowrap`}>
                  <div className="flex flex-col items-end gap-1 text-xs font-medium">
                    {q.status !== 'ACCEPTED' && <button className="text-accent hover:underline" onClick={() => setEditing(q)}>Editar</button>}
                    {q.status === 'DRAFT' && <button className="text-green-700 hover:underline" onClick={() => setStatus(q, 'SENT')}>Enviar por WhatsApp</button>}
                    {q.status !== 'DRAFT' && <a href={q.link} target="_blank" rel="noreferrer" className="text-accent hover:underline">Ver como cliente ↗</a>}
                    {q.status !== 'DRAFT' && <button className="text-accent hover:underline" onClick={() => copy(q.link)}>Copiar enlace</button>}
                    {['SENT', 'VIEWED'].includes(q.status) && q.whatsapp && <a href={q.whatsapp} target="_blank" rel="noreferrer" className="text-green-700 hover:underline">Reenviar por WhatsApp</a>}
                    {['SENT', 'VIEWED'].includes(q.status) && <button className="text-red-600 hover:underline" onClick={() => setStatus(q, 'REJECTED')}>Marcar rechazada</button>}
                    {q.status === 'DRAFT' && <button className="text-red-600 hover:underline" onClick={async () => { if (confirm('¿Borrar este borrador?')) { await adminApi.del(`/admin/services/quotes/${q.id}`); reload(); } }}>Borrar</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && !data?.length && <p className="p-6 text-center text-sm text-brand-gray">Todavía no hay propuestas.</p>}
      </div>
      <QuoteEditor open={creating || !!editing} quote={editing} from={null} catalog={catalog} onClose={() => { setEditing(null); setCreating(false); }} onSaved={() => { setEditing(null); setCreating(false); reload(); }} />
    </div>
  );
}

// ---------------- Expedientes ----------------
function Cases({ catalog, staff }: { catalog: Catalog | null; staff: Staff[] | null }) {
  const [status, setStatus] = useState('ACTIVE');
  const { data, loading } = useAdminGet<CaseRow[]>(`/admin/services/cases${status ? `?status=${status}` : ''}`);
  const [creating, setCreating] = useState(false);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => setCreating(true)}>+ Nuevo expediente</Button>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-black/15 px-3 py-2 text-sm">
          <option value="">Todos</option>
          {Object.entries(CASE_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full">
          <thead className="border-b border-black/5"><tr><th className={th}>N.º</th><th className={th}>Expediente</th><th className={th}>Etapa actual</th><th className={th}>Avance</th><th className={th}>Cobrado</th><th className={th}>Responsable</th></tr></thead>
          <tbody>
            {(data ?? []).map((c) => (
              <tr key={c.id} className="border-b border-black/5 hover:bg-light/50">
                <td className={td}>{c.number}</td>
                <td className={td}>
                  <Link to={`/admin/servicios/expedientes/${c.id}`} className="font-medium text-primary hover:underline">{c.title}</Link>
                  <p className="text-xs text-brand-gray">{c.clientName} · {CASE_STATUS[c.status]}</p>
                </td>
                <td className={td}>
                  {c.currentStep ?? '—'} {c.overdue && pill('bg-red-50 text-red-700', 'atrasada')}
                </td>
                <td className={td}>
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-light"><div className="h-full bg-secondary" style={{ width: `${c.progress.total ? (c.progress.done / c.progress.total) * 100 : 0}%` }} /></div>
                  <p className="text-xs text-brand-gray">{c.progress.done}/{c.progress.total}</p>
                </td>
                <td className={`${td} tabular-nums`}>{c.billed ? `${formatCurrency(c.paid)} / ${formatCurrency(c.billed)}` : '—'}</td>
                <td className={td}>{staffName(staff, c.ownerId)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && !data?.length && <p className="p-6 text-center text-sm text-brand-gray">No hay expedientes con ese filtro.</p>}
      </div>
      <NewCase open={creating} from={null} catalog={catalog} staff={staff} onClose={() => setCreating(false)} />
    </div>
  );
}

function NewCase({ open, from, catalog, staff, onClose }: { open: boolean; from: ServiceRequest | null; catalog: Catalog | null; staff: Staff[] | null; onClose: () => void }) {
  const { toast } = useToast();
  const [f, setF] = useState({ templateId: 'generico', title: '', clientName: '', clientPhone: '', clientEmail: '', lang: 'es', ownerId: '' });
  const [key, setKey] = useState('');
  const k = `${open}-${from?.id ?? ''}`;
  if (k !== key) {
    setKey(k);
    const t = from?.services[0] ? catalog?.services.find((s) => s.id === from.services[0])?.template : undefined;
    setF({ templateId: t ?? 'generico', title: '', clientName: from?.name ?? '', clientPhone: from?.phone ?? '', clientEmail: from?.email ?? '', lang: from?.lang ?? 'es', ownerId: from?.ownerId ?? '' });
  }
  const tpl = catalog?.templates.find((t) => t.id === f.templateId);
  async function save() {
    try {
      const c = await adminApi.post<{ id: string }>('/admin/services/cases', { ...f, requestId: from?.id ?? null, ownerId: f.ownerId || null });
      window.location.href = `/admin/servicios/expedientes/${c.id}`;
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }
  return (
    <Modal open={open} onClose={onClose} title="Nuevo expediente">
      <div className="space-y-3">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-primary">Tipo de trámite</span>
          <select value={f.templateId} onChange={(e) => setF({ ...f, templateId: e.target.value })} className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm">
            {catalog?.templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>
        {tpl && <p className="text-xs text-brand-gray">Etapas: {tpl.steps.join(' → ')}</p>}
        <Input label="Título (opcional)" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder={tpl?.name} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Cliente *" value={f.clientName} onChange={(e) => setF({ ...f, clientName: e.target.value })} />
          <Input label="WhatsApp" value={f.clientPhone} onChange={(e) => setF({ ...f, clientPhone: e.target.value })} />
          <Input label="Correo" value={f.clientEmail} onChange={(e) => setF({ ...f, clientEmail: e.target.value })} />
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-primary">Responsable</span>
            <select value={f.ownerId} onChange={(e) => setF({ ...f, ownerId: e.target.value })} className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm">
              <option value="">Sin asignar</option>
              {staff?.map((s) => <option key={s.id} value={s.id}>{s.fullName || s.username}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-primary">Idioma del cliente</span>
            <select value={f.lang} onChange={(e) => setF({ ...f, lang: e.target.value })} className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm">
              <option value="es">Español</option>
              <option value="en">Inglés</option>
            </select>
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t border-black/5 pt-3">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={!f.clientName.trim()}>Abrir expediente</Button>
        </div>
      </div>
    </Modal>
  );
}

// ---------------- Indicadores (S6) ----------------
interface MetricsData {
  requests: { total: number; open: number; byService: { id: string; name: string; n: number }[] };
  quotes: { sent: number; accepted: number; rate: number; valueSent: number; valueAccepted: number };
  cases: { active: number; onHold: number; done: number };
  stepDays: { who: string; avgDays: number; n: number }[];
  overdue: { caseId: string; number: number; case: string; step: string; waiting: string; daysLate: number }[];
  workload: Record<string, number>;
  receivables: { billed: number; paid: number; overdue: number };
}

function Metrics({ staff }: { staff: Staff[] | null }) {
  const { data } = useAdminGet<MetricsData>('/admin/services/metrics');
  if (!data) return <p className="text-sm text-brand-gray">Cargando…</p>;
  const tile = (label: string, value: string, sub?: string) => (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-xs text-brand-gray">{label}</p>
      <p className="mt-1 font-serif text-2xl font-bold text-primary">{value}</p>
      {sub && <p className="text-xs text-brand-gray">{sub}</p>}
    </div>
  );
  const maxDays = Math.max(1, ...data.stepDays.map((s) => s.avgDays));
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tile('Solicitudes abiertas', String(data.requests.open), `${data.requests.total} en total`)}
        {tile('Propuestas aceptadas', `${data.quotes.accepted} de ${data.quotes.sent}`, `${Math.round(data.quotes.rate * 100)} % · ${formatCurrency(data.quotes.valueAccepted)}`)}
        {tile('Expedientes en curso', String(data.cases.active), `${data.cases.onHold} en pausa · ${data.cases.done} terminados`)}
        {tile('Cobrado', formatCurrency(data.receivables.paid), `de ${formatCurrency(data.receivables.billed)} · vencido ${formatCurrency(data.receivables.overdue)}`)}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-primary">Dónde se demoran los trámites</h2>
          <p className="text-xs text-brand-gray">Días promedio por etapa cumplida, según quién la tenía.</p>
          {data.stepDays.length === 0 ? <p className="mt-3 text-sm text-brand-gray">Aún no hay etapas cerradas.</p> : (
            <ul className="mt-3 space-y-2">
              {data.stepDays.map((s) => (
                <li key={s.who} className="text-sm" title={`${s.avgDays} días promedio en ${s.n} etapas`}>
                  <div className="flex justify-between"><span>{s.who}</span><span className="tabular-nums text-brand-gray">{s.avgDays} d · {s.n}</span></div>
                  <div className="mt-1 h-2 rounded-full bg-light"><div className="h-full rounded-full bg-primary" style={{ width: `${(s.avgDays / maxDays) * 100}%` }} /></div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-primary">Etapas atrasadas</h2>
          {data.overdue.length === 0 ? <p className="mt-3 text-sm text-brand-gray">Nada atrasado. 👌</p> : (
            <ul className="mt-3 divide-y divide-black/5 text-sm">
              {data.overdue.map((o) => (
                <li key={o.caseId + o.step} className="flex justify-between gap-3 py-2">
                  <span><Link to={`/admin/servicios/expedientes/${o.caseId}`} className="font-medium text-accent hover:underline">N.º {o.number}</Link> {o.step} <span className="text-xs text-brand-gray">({o.waiting})</span></span>
                  <span className="shrink-0 font-semibold text-red-700">{o.daysLate} d</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-primary">Servicios más pedidos</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {data.requests.byService.map((s) => <li key={s.id} className="flex justify-between"><span>{s.name}</span><span className="tabular-nums">{s.n}</span></li>)}
            {data.requests.byService.length === 0 && <li className="text-brand-gray">Sin solicitudes todavía.</li>}
          </ul>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-primary">Carga del equipo</h2>
          <p className="text-xs text-brand-gray">Expedientes en curso por responsable.</p>
          <ul className="mt-3 space-y-1 text-sm">
            {Object.entries(data.workload).map(([id, n]) => <li key={id} className="flex justify-between"><span>{id === 'sin asignar' ? 'Sin asignar' : staffName(staff, id)}</span><span className="tabular-nums">{n}</span></li>)}
            {Object.keys(data.workload).length === 0 && <li className="text-brand-gray">Sin expedientes en curso.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
