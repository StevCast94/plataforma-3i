import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, Circle, CircleDot, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/shared/Toast';
import { useAdminGet } from '@/hooks/useAdminAPI';
import { adminApi } from '@/lib/adminApi';
import { formatCurrency } from '@/lib/utils';
import { fileToDataUri, MAX_DOC_BYTES } from '@/lib/fileToDataUri';
import { CASE_STATUS, PARTY, fmtDate, type CaseDetail, type CaseStep, type Staff } from './types';

// Expediente de un servicio: etapas, documentos, bitácora y cobros por hito.
export default function AdminCasePage() {
  const { caseId = '' } = useParams();
  const { toast } = useToast();
  const { data: c, reload } = useAdminGet<CaseDetail>(`/admin/services/cases/${caseId}`);
  const { data: staff } = useAdminGet<Staff[]>('/admin/services/staff');
  const [editingStep, setEditingStep] = useState<CaseStep | null>(null);
  const [note, setNote] = useState('');
  const [notePublic, setNotePublic] = useState(false);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    setBusy(true);
    try {
      await fn();
      if (ok) toast(ok, 'success');
      reload();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  };
  const put = (patch: Record<string, unknown>) => run(() => adminApi.put(`/admin/services/cases/${caseId}`, patch));
  const stepStatus = (s: CaseStep, status: string) => run(() => adminApi.put(`/admin/services/steps/${s.id}`, { status }));

  if (!c) return <p className="text-sm text-brand-gray">Cargando…</p>;
  const done = c.steps.filter((s) => s.status === 'DONE' || s.status === 'SKIPPED').length;
  const billed = c.payments.reduce((s, p) => s + p.amount, 0);
  const paid = c.payments.filter((p) => p.paidAt).reduce((s, p) => s + p.amount, 0);

  async function upload(file: File, visible: boolean) {
    if (file.size > MAX_DOC_BYTES) return toast('El archivo pesa más de 8 MB', 'error');
    const name = prompt('Nombre del documento', file.name.replace(/\.[^.]+$/, '')) ?? file.name;
    await run(async () => adminApi.post(`/admin/services/cases/${caseId}/documents`, { dataUri: await fileToDataUri(file), name, visible }), 'Documento subido');
  }
  async function openDoc(id: string) {
    const { url } = await adminApi.get<{ url: string }>(`/admin/services/documents/${id}`);
    window.open(url, '_blank');
  }

  return (
    <div className="space-y-5">
      <div>
        <Link to="/admin/servicios" className="text-sm text-accent hover:underline">← Servicios integrales</Link>
        <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-primary">N.º {c.number} · {c.title}</h1>
            <p className="text-sm text-brand-gray">
              {c.clientName}{c.clientPhone ? ` · ${c.clientPhone}` : ''}{c.clientEmail ? ` · ${c.clientEmail}` : ''} · abierto {fmtDate(c.createdAt)}
              {c.quote && ` · propuesta N.º ${c.quote.number} (${formatCurrency(c.quote.total)})`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {c.whatsapp && <a href={c.whatsapp} target="_blank" rel="noreferrer" className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:brightness-110">Avisar al cliente por WhatsApp</a>}
            <a href={c.link} target="_blank" rel="noreferrer" className="rounded-lg border border-black/15 bg-white px-3 py-1.5 text-sm font-medium text-primary hover:bg-light">Ver como cliente ↗</a>
            <button className="rounded-lg border border-black/15 bg-white px-3 py-1.5 text-sm font-medium text-primary hover:bg-light" onClick={async () => { await navigator.clipboard.writeText(c.link).catch(() => {}); toast('Enlace de seguimiento copiado', 'success'); }}>Copiar enlace</button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm sm:grid-cols-4">
        <label className="text-sm">
          <span className="block text-xs text-brand-gray">Estado</span>
          <select value={c.status} disabled={busy} onChange={(e) => put({ status: e.target.value })} className="mt-1 w-full rounded-lg border border-black/15 px-2 py-1.5">
            {Object.entries(CASE_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label className="text-sm">
          <span className="block text-xs text-brand-gray">Responsable</span>
          <select value={c.ownerId ?? ''} disabled={busy} onChange={(e) => put({ ownerId: e.target.value || null })} className="mt-1 w-full rounded-lg border border-black/15 px-2 py-1.5">
            <option value="">Sin asignar</option>
            {staff?.map((s) => <option key={s.id} value={s.id}>{s.fullName || s.username}</option>)}
          </select>
        </label>
        <label className="text-sm">
          <span className="block text-xs text-brand-gray">Entrega estimada</span>
          <input type="date" value={c.dueDate?.slice(0, 10) ?? ''} disabled={busy} onChange={(e) => put({ dueDate: e.target.value || null })} className="mt-1 w-full rounded-lg border border-black/15 px-2 py-1.5" />
        </label>
        <div className="text-sm">
          <span className="block text-xs text-brand-gray">Avance</span>
          <p className="mt-1 font-semibold text-primary">{done} de {c.steps.length} etapas</p>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-light"><div className="h-full bg-secondary" style={{ width: `${c.steps.length ? (done / c.steps.length) * 100 : 0}%` }} /></div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="rounded-2xl bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-primary">Etapas</h2>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => { const t = prompt('Nombre de la nueva etapa'); if (t) run(() => adminApi.post(`/admin/services/cases/${caseId}/steps`, { title: t })); }}>+ Etapa</Button>
          </div>
          <ol className="mt-3 space-y-3">
            {c.steps.map((s) => {
              const isDone = s.status === 'DONE' || s.status === 'SKIPPED';
              const Icon = isDone ? CheckCircle2 : s.status === 'ACTIVE' ? CircleDot : Circle;
              const late = s.status === 'ACTIVE' && s.dueDate && new Date(s.dueDate).getTime() < Date.now();
              return (
                <li key={s.id} className={`flex gap-3 rounded-xl p-3 ${s.status === 'ACTIVE' ? 'bg-secondary/10' : ''}`}>
                  <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${isDone ? 'text-green-600' : s.status === 'ACTIVE' ? 'text-secondary' : 'text-brand-gray'}`} />
                  <div className="min-w-0 flex-1">
                    <p className={`font-medium text-primary ${s.status === 'SKIPPED' ? 'line-through' : ''}`}>{s.order}. {s.title}</p>
                    <p className="text-xs text-brand-gray">
                      {s.party === 'institution' ? s.institution || PARTY.institution : PARTY[s.party]}
                      {s.dueDate && !isDone ? ` · plazo ${fmtDate(s.dueDate)}` : ''}
                      {s.doneAt ? ` · cerrada ${fmtDate(s.doneAt)}` : ''}
                      {late && <span className="ml-1 font-semibold text-red-700">· atrasada</span>}
                    </p>
                    {s.requirements.length > 0 && <p className="mt-1 text-xs text-primary">Requisitos: {s.requirements.join(' · ')}</p>}
                    {s.notes && <p className="mt-1 whitespace-pre-line text-xs text-amber-800">📝 {s.notes}</p>}
                    <div className="mt-2 flex flex-wrap gap-3 text-xs font-medium">
                      {s.status === 'PENDING' && <button className="text-accent hover:underline" disabled={busy} onClick={() => stepStatus(s, 'ACTIVE')}>Iniciar</button>}
                      {s.status === 'ACTIVE' && <button className="text-green-700 hover:underline" disabled={busy} onClick={() => stepStatus(s, 'DONE')}>✓ Marcar cumplida</button>}
                      {!isDone && <button className="text-brand-gray hover:underline" disabled={busy} onClick={() => stepStatus(s, 'SKIPPED')}>Omitir</button>}
                      {isDone && <button className="text-brand-gray hover:underline" disabled={busy} onClick={() => stepStatus(s, 'ACTIVE')}>Reabrir</button>}
                      <button className="text-accent hover:underline" onClick={() => setEditingStep(s)}>Editar</button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <div className="space-y-5">
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-primary">Documentos</h2>
            <ul className="mt-2 divide-y divide-black/5 text-sm">
              {c.documents.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-2 py-2">
                  <button className="flex min-w-0 items-center gap-1.5 text-left text-accent hover:underline" onClick={() => openDoc(d.id)}>
                    <FileText className="h-4 w-4 shrink-0" />
                    <span className="truncate">{d.name}</span>
                  </button>
                  <span className="flex shrink-0 items-center gap-2 text-xs">
                    {d.uploadedBy === 'client' && <span className="rounded bg-amber-100 px-1.5 text-amber-900">cliente</span>}
                    <label className="flex items-center gap-1 text-brand-gray" title="El cliente lo ve en su seguimiento">
                      <input type="checkbox" checked={d.visible} onChange={(e) => run(() => adminApi.put(`/admin/services/documents/${d.id}`, { visible: e.target.checked }))} />
                      visible
                    </label>
                    <button className="text-red-600" onClick={() => confirm(`¿Borrar «${d.name}»?`) && run(() => adminApi.del(`/admin/services/documents/${d.id}`))} aria-label="Borrar">×</button>
                  </span>
                </li>
              ))}
              {c.documents.length === 0 && <li className="py-2 text-brand-gray">Sin documentos.</li>}
            </ul>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <label className="cursor-pointer rounded-lg bg-primary px-3 py-1.5 font-semibold text-white">
                Subir (visible al cliente)
                <input type="file" className="sr-only" accept="application/pdf,image/png,image/jpeg,image/webp" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], true)} />
              </label>
              <label className="cursor-pointer rounded-lg border border-black/15 px-3 py-1.5 font-medium text-primary">
                Subir interno
                <input type="file" className="sr-only" accept="application/pdf,image/png,image/jpeg,image/webp" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], false)} />
              </label>
            </div>
          </section>

          <Payments c={c} billed={billed} paid={paid} run={run} busy={busy} />
        </div>
      </div>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-primary">Bitácora</h2>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Agregar una nota…" className="flex-1 rounded-lg border border-black/15 px-3 py-2 text-sm" />
          <label className="flex items-center gap-1 text-sm text-brand-gray"><input type="checkbox" checked={notePublic} onChange={(e) => setNotePublic(e.target.checked)} /> visible al cliente</label>
          <Button size="sm" disabled={!note.trim() || busy} onClick={() => run(async () => { await adminApi.post(`/admin/services/cases/${caseId}/events`, { text: note, public: notePublic }); setNote(''); })}>Agregar</Button>
        </div>
        <ul className="mt-3 space-y-2 text-sm">
          {c.events.map((e) => (
            <li key={e.id} className="flex gap-3">
              <span className="w-28 shrink-0 text-xs text-brand-gray">{new Date(e.createdAt).toLocaleString('es-EC', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
              <span className="text-primary">{e.text}{e.by ? <span className="text-brand-gray"> — {e.by}</span> : null}{e.public ? <span className="ml-1 text-xs text-green-700">(cliente)</span> : null}</span>
            </li>
          ))}
        </ul>
      </section>

      <StepEditor step={editingStep} onClose={() => setEditingStep(null)} onSaved={() => { setEditingStep(null); reload(); }} />
    </div>
  );
}

function Payments({ c, billed, paid, run, busy }: { c: CaseDetail; billed: number; paid: number; run: (fn: () => Promise<unknown>, ok?: string) => Promise<void>; busy: boolean }) {
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [due, setDue] = useState('');
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-primary">Cobros por hito</h2>
      <p className="text-xs text-brand-gray">Cobrado {formatCurrency(paid)} de {formatCurrency(billed)}</p>
      <ul className="mt-2 divide-y divide-black/5 text-sm">
        {c.payments.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-2 py-2">
            <span className="min-w-0">
              <span className="block break-words">{p.label}</span>
              <span className="text-xs text-brand-gray">{p.paidAt ? `pagado ${fmtDate(p.paidAt)}` : p.dueDate ? `vence ${fmtDate(p.dueDate)}` : 'pendiente'}</span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <span className="tabular-nums">{formatCurrency(p.amount)}</span>
              <button disabled={busy} className={`rounded px-2 py-0.5 text-xs font-semibold ${p.paidAt ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-900'}`} onClick={() => run(() => adminApi.put(`/admin/services/payments/${p.id}`, { paid: !p.paidAt }))}>
                {p.paidAt ? 'Pagado' : 'Marcar pagado'}
              </button>
              <button className="text-red-600" onClick={() => confirm('¿Quitar este cobro?') && run(() => adminApi.del(`/admin/services/payments/${p.id}`))} aria-label="Quitar">×</button>
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Concepto" className="col-span-2 rounded-lg border border-black/15 px-3 py-1.5 text-sm" />
        <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="Monto" className="rounded-lg border border-black/15 px-3 py-1.5 text-sm" />
        <input value={due} onChange={(e) => setDue(e.target.value)} type="date" className="rounded-lg border border-black/15 px-3 py-1.5 text-sm" aria-label="Vence" />
        <Button size="sm" className="col-span-2" disabled={!label || !amount || busy} onClick={() => run(async () => { await adminApi.post(`/admin/services/cases/${c.id}/payments`, { label, amount, dueDate: due || null }); setLabel(''); setAmount(''); setDue(''); })}>+ Agregar cobro</Button>
      </div>
    </section>
  );
}

function StepEditor({ step, onClose, onSaved }: { step: CaseStep | null; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [f, setF] = useState({ title: '', party: 'team', institution: '', dueDate: '', requirements: '', description: '', notes: '' });
  const [id, setId] = useState('');
  if (step && step.id !== id) {
    setId(step.id);
    setF({ title: step.title, party: step.party, institution: step.institution ?? '', dueDate: step.dueDate?.slice(0, 10) ?? '', requirements: step.requirements.join('\n'), description: step.description ?? '', notes: step.notes ?? '' });
  }
  async function save() {
    try {
      await adminApi.put(`/admin/services/steps/${step!.id}`, { ...f, dueDate: f.dueDate || null, requirements: f.requirements.split('\n') });
      onSaved();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }
  async function remove() {
    if (!confirm('¿Eliminar esta etapa?')) return;
    await adminApi.del(`/admin/services/steps/${step!.id}`);
    onSaved();
  }
  return (
    <Modal open={!!step} onClose={onClose} title="Editar etapa">
      <div className="space-y-3">
        <Input label="Nombre" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-primary">¿Quién la tiene?</span>
            <select value={f.party} onChange={(e) => setF({ ...f, party: e.target.value })} className="w-full rounded-lg border border-black/15 px-3 py-2">
              {Object.entries(PARTY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          {f.party === 'institution' && <Input label="Institución" value={f.institution} onChange={(e) => setF({ ...f, institution: e.target.value })} placeholder="Municipio de Santa Elena" />}
          <Input label="Plazo" type="date" value={f.dueDate} onChange={(e) => setF({ ...f, dueDate: e.target.value })} />
        </div>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-primary">Requisitos (uno por línea, el cliente los ve)</span>
          <textarea rows={3} value={f.requirements} onChange={(e) => setF({ ...f, requirements: e.target.value })} className="w-full rounded-lg border border-black/15 px-3 py-2" />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-primary">Descripción para el cliente</span>
          <textarea rows={2} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className="w-full rounded-lg border border-black/15 px-3 py-2" />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-primary">Notas internas</span>
          <textarea rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} className="w-full rounded-lg border border-black/15 px-3 py-2" />
        </label>
        <div className="flex justify-between gap-2 border-t border-black/5 pt-3">
          <Button variant="ghost" className="text-red-600" onClick={remove}>Eliminar</Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button onClick={save}>Guardar</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
