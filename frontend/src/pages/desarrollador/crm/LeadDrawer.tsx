import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { useToast } from '@/components/shared/Toast';
import { useCrmClient } from '@/lib/crmClient';
import { formatCurrency } from '@/lib/utils';
import {
  askLostReason, LEAD_SOURCE_LABEL, LEAD_STATUS_LABEL, PIPELINE, TASK_TYPE_LABEL,
  type LeadDetail, type LeadStatus, type TaskType, type TeamUser, type WaTemplate,
} from '@/lib/developerApi';

// Ficha del cliente (panel lateral): etapa, etiquetas, presupuesto, WhatsApp con
// plantilla, tareas y el historial completo. Cada acción queda en el historial.

const ACT_ICON: Record<string, string> = {
  created: '✨', note: '📝', stage: '➡️', whatsapp: '💬', task: '📌', task_done: '✅', sale: '💰', assign: '👤',
};

const when = (d: string) =>
  new Date(d).toLocaleString('es-EC', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

function localInput(d: Date) {
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}

export function LeadDrawer({
  leadId, onClose, onChanged, team,
}: { leadId: string | null; onClose: () => void; onChanged: () => void; team: TeamUser[] | null }) {
  const crm = useCrmClient();
  const { toast } = useToast();
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [templates, setTemplates] = useState<WaTemplate[]>([]);
  const [tpl, setTpl] = useState('');
  const [note, setNote] = useState('');
  const [tagInput, setTagInput] = useState('');

  const load = useCallback(() => {
    if (!leadId) return;
    crm.get<LeadDetail>(`/crm/leads/${leadId}`).then(setLead).catch((e) => toast(e.message, 'error'));
  }, [leadId, toast]);

  useEffect(() => {
    setLead(null);
    load();
  }, [load]);
  useEffect(() => {
    if (leadId && !templates.length) crm.get<WaTemplate[]>('/crm/templates').then(setTemplates).catch(() => {});
  }, [leadId, templates.length]);

  async function patch(body: Record<string, unknown>) {
    if (!lead) return;
    try {
      await crm.patch(`/leads/${lead.id}`, body);
      load();
      onChanged();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  async function assign(userId: string) {
    if (!lead) return;
    try {
      await crm.post(`/crm/leads/${lead.id}/assign`, { userId: userId || null });
      load();
      onChanged();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  async function sendWa() {
    if (!lead) return;
    const t = templates.find((x) => x.id === tpl);
    // La ventana se abre en el clic (sin esperar al servidor) para que el navegador no la bloquee.
    const win = window.open('', '_blank');
    try {
      const r = await crm.post<{ url: string }>(`/crm/leads/${lead.id}/whatsapp`, t ? { templateId: t.id } : { body: `Hola ${lead.name.split(' ')[0]}` });
      if (win) win.location.href = r.url;
      else window.location.href = r.url;
      load();
      onChanged();
    } catch (e) {
      win?.close();
      toast((e as Error).message, 'error');
    }
  }

  async function addNote(e: FormEvent) {
    e.preventDefault();
    if (!lead || !note.trim()) return;
    await crm.post(`/crm/leads/${lead.id}/notes`, { body: note });
    setNote('');
    load();
  }

  async function addTask(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!lead) return;
    const fd = new FormData(e.currentTarget);
    const type = fd.get('type') as TaskType;
    try {
      await crm.post(`/crm/leads/${lead.id}/tasks`, {
        type,
        title: fd.get('title') || TASK_TYPE_LABEL[type].replace(/^\S+\s/, ''),
        dueAt: new Date(String(fd.get('dueAt'))).toISOString(),
      });
      (e.target as HTMLFormElement).reset();
      load();
      onChanged();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }

  async function toggleTask(id: string, done: boolean) {
    await crm.patch(`/crm/tasks/${id}`, { done });
    load();
    onChanged();
  }

  if (!leadId) return null;
  const defaultDue = new Date(Date.now() + 24 * 3600_000);
  defaultDue.setMinutes(0, 0, 0);

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/40" onClick={onClose}>
      <aside className="h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {!lead ? (
          <p className="p-6 text-sm text-brand-gray">Cargando…</p>
        ) : (
          <div className="space-y-5 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-serif text-2xl font-bold text-primary">{lead.name}</h2>
                <p className="text-sm text-brand-gray">
                  {lead.project.name}
                  {lead.lotCode && ` · Lote ${lead.lotCode}`}
                </p>
                <p className="mt-1 text-sm">
                  <a href={`tel:${lead.phone}`} className="text-primary hover:underline">{lead.phone}</a>
                  {lead.email && <span className="text-brand-gray"> · {lead.email}</span>}
                </p>
                <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs ${LEAD_SOURCE_LABEL[lead.source].cls}`}>
                  {LEAD_SOURCE_LABEL[lead.source].text}
                </span>
                {lead.lang === 'en' && <span className="ml-1 rounded-full bg-light px-2 py-0.5 text-xs">EN</span>}
                {lead.utm && (
                  <p className="mt-2 text-xs text-brand-gray">
                    Campaña:{' '}
                    <strong className="text-primary">
                      {[lead.utm.source || (lead.utm.gclid ? 'google' : lead.utm.fbclid ? 'facebook' : lead.utm.ttclid ? 'tiktok' : ''), lead.utm.medium, lead.utm.campaign].filter(Boolean).join(' · ')}
                    </strong>
                    {lead.utm.content && <> · {lead.utm.content}</>}
                  </p>
                )}
              </div>
              <button onClick={onClose} aria-label="Cerrar" className="rounded-full p-1 hover:bg-light">
                <X className="h-5 w-5" />
              </button>
            </div>

            {lead.message && <p className="rounded-lg bg-light p-3 text-sm text-primary/80">«{lead.message}»</p>}

            {/* Vendedor */}
            {team && team.length > 1 ? (
              <label className="flex items-center gap-2 text-sm">
                <span className="text-brand-gray">Asignado a</span>
                <select value={lead.assignedToId ?? ''} onChange={(e) => assign(e.target.value)} className="flex-1 rounded-md border border-black/15 px-2 py-1.5">
                  <option value="">Sin asignar</option>
                  {team.filter((u) => u.active).map((u) => <option key={u.id} value={u.id}>{u.name ?? u.email}</option>)}
                </select>
              </label>
            ) : lead.assignedTo ? (
              <p className="text-sm text-brand-gray">Asignado a {lead.assignedTo.name ?? lead.assignedTo.email}</p>
            ) : null}

            {/* Etapa */}
            <div className="flex flex-wrap gap-1">
              {PIPELINE.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    if (s === lead.status) return;
                    if (s === 'LOST') {
                      const r = askLostReason();
                      if (r !== null) patch({ status: s, lostReason: r });
                    } else patch({ status: s });
                  }}
                  className={`rounded-full px-3 py-1 text-xs ${lead.status === s ? 'bg-primary text-white' : 'bg-light text-brand-gray hover:text-primary'}`}
                >
                  {LEAD_STATUS_LABEL[s as LeadStatus]}
                </button>
              ))}
            </div>

            {lead.status === 'LOST' && lead.lostReason && (
              <p className="text-sm text-brand-gray">Motivo de pérdida: <strong className="text-primary">{lead.lostReason}</strong></p>
            )}

            {/* WhatsApp */}
            <div className="rounded-xl border border-black/10 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">WhatsApp</p>
              <div className="flex gap-2">
                <select value={tpl} onChange={(e) => setTpl(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-black/15 px-2 py-2 text-sm">
                  <option value="">Mensaje libre</option>
                  {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <button onClick={sendWa} className="rounded-lg bg-[#25D366] px-3 py-2 text-sm font-semibold text-white hover:bg-[#1eb855]">Enviar</button>
              </div>
              {tpl && <p className="mt-2 text-xs text-brand-gray">{templates.find((t) => t.id === tpl)?.body}</p>}
            </div>

            {/* Etiquetas y presupuesto */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="mb-1 text-xs text-brand-gray">Etiquetas</p>
                <div className="flex flex-wrap gap-1">
                  {lead.tags.map((t) => (
                    <button key={t} onClick={() => patch({ tags: lead.tags.filter((x) => x !== t) })} className="rounded-full bg-secondary/25 px-2 py-0.5 text-xs" title="Quitar">
                      {t} ×
                    </button>
                  ))}
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (tagInput.trim()) patch({ tags: [...lead.tags, tagInput.trim()] });
                    setTagInput('');
                  }}
                >
                  <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="+ etiqueta" className="mt-1 w-full rounded-md border border-black/10 px-2 py-1 text-xs" />
                </form>
              </div>
              <div>
                <p className="mb-1 text-xs text-brand-gray">Presupuesto (USD)</p>
                <input
                  type="number"
                  defaultValue={lead.budget ?? ''}
                  onBlur={(e) => e.target.value !== String(lead.budget ?? '') && patch({ budget: e.target.value })}
                  className="w-full rounded-md border border-black/10 px-2 py-1"
                />
                {lead.sales.map((s) => (
                  <p key={s.id} className="mt-1 text-xs text-green-700">
                    💰 {formatCurrency(s.price)} {s.lotCode && `· ${s.lotCode}`}
                  </p>
                ))}
              </div>
            </div>

            {/* Tareas */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">Tareas</p>
              <ul className="space-y-1.5 text-sm">
                {lead.tasks.map((t) => {
                  const overdue = !t.doneAt && new Date(t.dueAt).getTime() < Date.now();
                  return (
                    <li key={t.id} className={`flex items-start gap-2 ${t.doneAt ? 'text-brand-gray line-through' : ''}`}>
                      <input type="checkbox" checked={!!t.doneAt} onChange={(e) => toggleTask(t.id, e.target.checked)} className="mt-1" />
                      <span className="flex-1">
                        {TASK_TYPE_LABEL[t.type].split(' ')[0]} {t.title}
                        <span className={`block text-xs ${overdue ? 'font-semibold text-red-600' : 'text-brand-gray'}`}>
                          {overdue ? 'Vencida · ' : ''}
                          {when(t.dueAt)}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
              <form onSubmit={addTask} className="mt-3 grid grid-cols-[auto_1fr] gap-2 text-sm">
                <select name="type" defaultValue="FOLLOW_UP" className="rounded-md border border-black/15 px-2 py-1.5">
                  {Object.entries(TASK_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <input name="title" placeholder="Detalle (opcional)" className="rounded-md border border-black/15 px-2 py-1.5" />
                <input name="dueAt" type="datetime-local" required defaultValue={localInput(defaultDue)} className="rounded-md border border-black/15 px-2 py-1.5" />
                <button className="rounded-md bg-primary px-3 py-1.5 text-white">+ Tarea</button>
              </form>
            </div>

            {/* Historial */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">Historial</p>
              <form onSubmit={addNote} className="mb-3 flex gap-2">
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Escribe una nota…" className="min-w-0 flex-1 rounded-md border border-black/15 px-2 py-1.5 text-sm" />
                <button className="rounded-md border border-secondary px-3 text-sm">Guardar</button>
              </form>
              <ol className="space-y-2 border-l border-black/10 pl-3 text-sm">
                {lead.activities.map((a) => (
                  <li key={a.id}>
                    <span className="text-xs text-brand-gray">{when(a.createdAt)}</span>
                    <p className="whitespace-pre-line text-primary/90">
                      {ACT_ICON[a.kind] ?? '•'} {a.kind === 'created' ? 'Contacto registrado' : a.body}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
