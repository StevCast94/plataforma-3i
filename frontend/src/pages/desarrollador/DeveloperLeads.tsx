import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { PhoneField } from '@/components/shared/PhoneField';
import { useToast } from '@/components/shared/Toast';
import { DeclareSaleModal } from './DeveloperSales';
import {
  devApi, LEAD_SOURCE_LABEL, LEAD_STATUS_LABEL, type DevLead, type DevProject, type LeadStatus,
} from '@/lib/developerApi';

// Contactos de los proyectos del desarrollador. Los de la plataforma llegan solos;
// los propios se registran aquí (comisión reducida). El primero que registra un
// teléfono conserva la atribución 180 días.

const waLink = (phone: string) => `https://wa.me/${phone.replace(/\D/g, '')}`;

export function DeveloperLeads({ projects, ownLeadRate }: { projects: DevProject[]; ownLeadRate: number }) {
  const { toast } = useToast();
  const [leads, setLeads] = useState<DevLead[] | null>(null);
  const [filter, setFilter] = useState('');
  const [adding, setAdding] = useState(false);
  const [phone, setPhone] = useState('');
  const [selling, setSelling] = useState<DevLead | null>(null);

  const load = useCallback(() => {
    devApi.get<DevLead[]>(`/leads${filter ? `?projectId=${filter}` : ''}`).then(setLeads).catch((e) => toast(e.message, 'error'));
  }, [filter, toast]);
  useEffect(load, [load]);

  async function setStatus(l: DevLead, status: LeadStatus) {
    try {
      await devApi.patch(`/leads/${l.id}`, { status });
      setLeads((xs) => xs?.map((x) => (x.id === l.id ? { ...x, status } : x)) ?? xs);
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  async function addOwn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await devApi.post(`/projects/${fd.get('projectId')}/leads`, {
        name: fd.get('name'),
        phone,
        email: fd.get('email') || undefined,
        notes: fd.get('notes') || undefined,
      });
      toast('Contacto registrado', 'success');
      setAdding(false);
      load();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }

  const published = projects.filter((p) => p.publishStatus === 'PUBLISHED' || p.publishStatus === 'PAUSED');

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-serif text-xl font-bold text-primary">Contactos</h2>
        <div className="flex gap-2">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-lg border border-black/15 bg-white px-3 py-1.5 text-sm">
            <option value="">Todos los proyectos</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {published.length > 0 && (
            <Button size="sm" variant="outline" onClick={() => setAdding(true)}>+ Contacto propio</Button>
          )}
        </div>
      </div>

      {leads === null ? (
        <p className="text-sm text-brand-gray">Cargando…</p>
      ) : leads.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-black/10 p-8 text-center text-sm text-brand-gray">
          Aún no hay contactos. Aparecerán aquí cuando alguien escriba desde la ficha de tu proyecto.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/5 text-xs uppercase tracking-wide text-brand-gray">
              <tr>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Proyecto</th>
                <th className="px-4 py-3">Origen</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => {
                const src = LEAD_SOURCE_LABEL[l.source];
                return (
                  <tr key={l.id} className="border-b border-black/5 last:border-0 align-top">
                    <td className="px-4 py-3">
                      <div className="font-medium text-primary">{l.name}</div>
                      <a href={waLink(l.phone)} target="_blank" rel="noreferrer" className="text-xs text-[#1eb855] hover:underline">{l.phone}</a>
                      {l.message && <p className="mt-1 max-w-xs text-xs text-brand-gray line-clamp-2">{l.message}</p>}
                    </td>
                    <td className="px-4 py-3">
                      {l.project.name}
                      {l.lotCode && <div className="text-xs text-brand-gray">Solar {l.lotCode}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${src.cls}`}>{src.text}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-brand-gray">{new Date(l.createdAt).toLocaleDateString('es-EC')}</td>
                    <td className="px-4 py-3">
                      <select
                        value={l.status}
                        onChange={(e) => setStatus(l, e.target.value as LeadStatus)}
                        className="rounded-md border border-black/15 bg-white px-2 py-1 text-xs"
                      >
                        {Object.entries(LEAD_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                      {l.status !== 'WON' && (
                        <button onClick={() => setSelling(l)} className="ml-2 text-xs font-semibold text-secondary hover:underline">
                          Venta
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <DeclareSaleModal
        lead={selling}
        onClose={() => setSelling(null)}
        onDone={() => {
          setSelling(null);
          load();
        }}
      />

      <Modal open={adding} onClose={() => setAdding(false)} title="Registrar contacto propio">
        <form onSubmit={addOwn} className="space-y-3">
          <p className="text-sm text-brand-gray">
            Para clientes que tú consigues por tu cuenta. Si compran, la comisión es del {Math.round(ownLeadRate * 1000) / 10} %.
            Si el número ya llegó por la plataforma, se mantiene el registro original.
          </p>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-primary">Proyecto</span>
            <select name="projectId" required className="w-full rounded-lg border border-black/15 px-3 py-2.5">
              {published.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <Input name="name" label="Nombre" required />
          <PhoneField label="WhatsApp" required defaultValue="+593 " onChange={setPhone} />
          <Input name="email" type="email" label="Correo (opcional)" />
          <Input name="notes" label="Nota (opcional)" />
          <Button type="submit" className="w-full">Registrar</Button>
        </form>
      </Modal>
    </div>
  );
}
