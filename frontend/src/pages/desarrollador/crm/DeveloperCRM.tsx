import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { useToast } from '@/components/shared/Toast';
import { formatCurrency } from '@/lib/utils';
import {
  devApi, isStale, LEAD_SOURCE_LABEL, LEAD_STATUS_LABEL, PIPELINE, TASK_TYPE_LABEL,
  type AgendaTask, type BoardLead, type DevProject, type LeadStatus, type WaTemplate,
} from '@/lib/developerApi';
import { DeveloperLeads } from '../DeveloperLeads';
import { LeadDrawer } from './LeadDrawer';

// CRM del desarrollador (inspirado en Kommo): embudo por etapas con arrastrar y
// soltar, agenda de tareas, lista clásica y plantillas de WhatsApp.

type View = 'board' | 'agenda' | 'list';

const COL_TONE: Record<LeadStatus, string> = {
  NEW: 'border-sky-400',
  CONTACTED: 'border-indigo-400',
  VISIT: 'border-amber-400',
  NEGOTIATION: 'border-orange-500',
  WON: 'border-green-600',
  LOST: 'border-slate-400',
};

const short = (d: string) => new Date(d).toLocaleString('es-EC', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

function Board({ leads, onOpen, onMove }: { leads: BoardLead[]; onOpen: (id: string) => void; onMove: (id: string, to: LeadStatus) => void }) {
  const [over, setOver] = useState<LeadStatus | null>(null);
  return (
    <div className="flex gap-3 overflow-x-auto pb-3">
      {PIPELINE.map((stage) => {
        const items = leads.filter((l) => l.status === stage);
        const total = items.reduce((a, l) => a + (l.budget ?? 0), 0);
        return (
          <div
            key={stage}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(stage);
            }}
            onDragLeave={() => setOver(null)}
            onDrop={(e) => {
              e.preventDefault();
              setOver(null);
              const id = e.dataTransfer.getData('text/plain');
              if (id) onMove(id, stage);
            }}
            className={`w-64 shrink-0 rounded-xl p-2 transition-colors ${over === stage ? 'bg-secondary/20' : 'bg-white/60'}`}
          >
            <div className={`mb-2 border-b-2 ${COL_TONE[stage]} px-1 pb-1.5`}>
              <p className="flex items-baseline justify-between text-xs font-semibold uppercase tracking-wide text-primary">
                {LEAD_STATUS_LABEL[stage]} <span className="text-brand-gray">{items.length}</span>
              </p>
              {total > 0 && <p className="text-[11px] text-brand-gray">{formatCurrency(total)}</p>}
            </div>
            <div className="min-h-[3rem] space-y-2">
              {items.map((l) => {
                const stale = isStale(l);
                const overdue = l.nextTask && new Date(l.nextTask.dueAt).getTime() < Date.now();
                return (
                  <button
                    key={l.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', l.id)}
                    onClick={() => onOpen(l.id)}
                    className={`block w-full cursor-grab rounded-lg bg-white p-2.5 text-left shadow-sm ring-1 hover:ring-secondary ${stale ? 'ring-red-300' : 'ring-black/5'}`}
                  >
                    <p className="text-sm font-semibold text-primary">{l.name}</p>
                    <p className="text-xs text-brand-gray">
                      {l.project.name}
                      {l.lotCode && ` · ${l.lotCode}`}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${LEAD_SOURCE_LABEL[l.source].cls}`}>{LEAD_SOURCE_LABEL[l.source].text}</span>
                      {l.tags.slice(0, 2).map((t) => <span key={t} className="rounded-full bg-secondary/25 px-1.5 py-0.5 text-[10px]">{t}</span>)}
                    </div>
                    {stale ? (
                      <p className="mt-1.5 text-[11px] font-semibold text-red-600">⚠ Sin atender más de 24 h</p>
                    ) : l.nextTask ? (
                      <p className={`mt-1.5 text-[11px] ${overdue ? 'font-semibold text-red-600' : 'text-brand-gray'}`}>
                        {TASK_TYPE_LABEL[l.nextTask.type].split(' ')[0]} {short(l.nextTask.dueAt)}
                      </p>
                    ) : l.status !== 'WON' && l.status !== 'LOST' ? (
                      <p className="mt-1.5 text-[11px] text-amber-700">Sin tarea pendiente</p>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Agenda({ onOpen }: { onOpen: (id: string) => void }) {
  const [tasks, setTasks] = useState<AgendaTask[] | null>(null);
  const load = useCallback(() => {
    devApi.get<AgendaTask[]>('/crm/tasks').then(setTasks).catch(() => setTasks([]));
  }, []);
  useEffect(load, [load]);

  async function done(id: string) {
    await devApi.patch(`/crm/tasks/${id}`, { done: true });
    load();
  }

  if (!tasks) return <p className="text-sm text-brand-gray">Cargando…</p>;
  const now = new Date();
  const endToday = new Date(now);
  endToday.setHours(23, 59, 59, 999);
  const groups: [string, AgendaTask[], string][] = [
    ['Vencidas', tasks.filter((t) => new Date(t.dueAt) < now), 'text-red-600'],
    ['Hoy', tasks.filter((t) => new Date(t.dueAt) >= now && new Date(t.dueAt) <= endToday), 'text-primary'],
    ['Próximas', tasks.filter((t) => new Date(t.dueAt) > endToday), 'text-brand-gray'],
  ];
  if (!tasks.length) return <p className="rounded-2xl border-2 border-dashed border-black/10 p-8 text-center text-sm text-brand-gray">No tienes tareas pendientes. 🎉</p>;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {groups.map(([title, list, tone]) => (
        <section key={title} className="rounded-2xl bg-white p-4 shadow-sm">
          <h3 className={`mb-3 text-sm font-semibold uppercase tracking-wide ${tone}`}>
            {title} <span className="text-brand-gray">({list.length})</span>
          </h3>
          <ul className="space-y-2">
            {list.map((t) => (
              <li key={t.id} className="flex items-start gap-2 rounded-lg bg-light p-2.5 text-sm">
                <input type="checkbox" onChange={() => done(t.id)} className="mt-1" aria-label="Marcar como hecha" />
                <button onClick={() => onOpen(t.lead.id)} className="flex-1 text-left">
                  <p className="font-medium text-primary">
                    {TASK_TYPE_LABEL[t.type].split(' ')[0]} {t.title}
                  </p>
                  <p className="text-xs text-brand-gray">
                    {t.lead.name} · {t.lead.project.name}
                    {t.lead.lotCode && ` · ${t.lead.lotCode}`}
                  </p>
                  <p className={`text-xs ${tone}`}>{short(t.dueAt)}</p>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function Templates({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const [list, setList] = useState<WaTemplate[]>([]);
  const load = () => devApi.get<WaTemplate[]>('/crm/templates').then(setList).catch(() => {});
  useEffect(() => {
    if (open) load();
  }, [open]);

  async function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await devApi.post('/crm/templates', { name: fd.get('name'), body: fd.get('body') });
      (e.target as HTMLFormElement).reset();
      load();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Plantillas de WhatsApp">
      <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1 text-sm">
        <p className="text-xs text-brand-gray">
          Variables: <code>{'{nombre}'}</code> <code>{'{proyecto}'}</code> <code>{'{solar}'}</code> — se reemplazan al enviar.
        </p>
        <ul className="space-y-2">
          {list.map((t) => (
            <li key={t.id} className="rounded-lg bg-light p-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-primary">{t.name}</p>
                <button
                  onClick={async () => {
                    await devApi.del(`/crm/templates/${t.id}`);
                    load();
                  }}
                  className="text-xs text-brand-gray hover:text-red-600"
                >
                  Borrar
                </button>
              </div>
              <p className="mt-1 text-brand-gray">{t.body}</p>
            </li>
          ))}
        </ul>
        <form onSubmit={add} className="space-y-2 border-t border-black/5 pt-3">
          <Input name="name" label="Nombre" required />
          <Textarea name="body" label="Mensaje" rows={3} required />
          <Button type="submit" className="w-full">Agregar plantilla</Button>
        </form>
      </div>
    </Modal>
  );
}

export function DeveloperCRM({ projects, ownLeadRate }: { projects: DevProject[]; ownLeadRate: number }) {
  const { toast } = useToast();
  const [view, setView] = useState<View>('board');
  const [projectId, setProjectId] = useState('');
  const [leads, setLeads] = useState<BoardLead[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [tplOpen, setTplOpen] = useState(false);
  const [tick, setTick] = useState(0);

  const load = useCallback(() => {
    devApi
      .get<BoardLead[]>(`/crm/board${projectId ? `?projectId=${projectId}` : ''}`)
      .then(setLeads)
      .catch((e) => toast(e.message, 'error'));
    setTick((t) => t + 1);
  }, [projectId, toast]);
  useEffect(load, [load]);

  async function move(id: string, to: LeadStatus) {
    const lead = leads?.find((l) => l.id === id);
    if (!lead || lead.status === to) return;
    setLeads((xs) => xs?.map((l) => (l.id === id ? { ...l, status: to } : l)) ?? xs);
    try {
      await devApi.patch(`/leads/${id}`, { status: to });
      if (to === 'WON') toast('Recuerda declarar la venta desde la vista Lista → «Venta».', 'info');
      load();
    } catch (e) {
      toast((e as Error).message, 'error');
      load();
    }
  }

  const stats = useMemo(() => {
    const list = leads ?? [];
    return {
      stale: list.filter(isStale).length,
      overdue: list.filter((l) => l.nextTask && new Date(l.nextTask.dueAt).getTime() < Date.now()).length,
      open: list.filter((l) => l.status !== 'WON' && l.status !== 'LOST').length,
    };
  }, [leads]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 rounded-xl bg-white p-1 shadow-sm">
          {([['board', 'Embudo'], ['agenda', 'Agenda'], ['list', 'Lista']] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setView(k)}
              className={`rounded-lg px-3 py-1.5 text-sm ${view === k ? 'bg-primary text-white' : 'text-brand-gray hover:text-primary'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {view === 'board' && (
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="rounded-lg border border-black/15 bg-white px-3 py-1.5 text-sm">
              <option value="">Todos los proyectos</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
          <Button size="sm" variant="outline" onClick={() => setTplOpen(true)}>Plantillas</Button>
        </div>
      </div>

      {view === 'board' && leads && (stats.stale > 0 || stats.overdue > 0) && (
        <div className="mb-3 flex flex-wrap gap-2 text-sm">
          {stats.stale > 0 && <span className="rounded-full bg-red-50 px-3 py-1 text-red-700">⚠ {stats.stale} sin atender en 24 h</span>}
          {stats.overdue > 0 && <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-800">⏰ {stats.overdue} con tarea vencida</span>}
        </div>
      )}

      {view === 'board' &&
        (leads === null ? (
          <p className="text-sm text-brand-gray">Cargando…</p>
        ) : leads.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-black/10 p-8 text-center text-sm text-brand-gray">
            Aún no hay contactos. Llegarán solos desde la ficha de tu proyecto, o regístralos en la vista Lista.
          </div>
        ) : (
          <>
            <p className="mb-2 text-xs text-brand-gray">{stats.open} en curso · arrastra una tarjeta para cambiarla de etapa, tócala para abrir su ficha.</p>
            <Board leads={leads} onOpen={setOpenId} onMove={move} />
          </>
        ))}
      {view === 'agenda' && <Agenda key={tick} onOpen={setOpenId} />}
      {view === 'list' && <DeveloperLeads key={tick} projects={projects} ownLeadRate={ownLeadRate} />}

      <LeadDrawer leadId={openId} onClose={() => setOpenId(null)} onChanged={load} />
      <Templates open={tplOpen} onClose={() => setTplOpen(false)} />
    </div>
  );
}
