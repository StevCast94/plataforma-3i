import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/shared/Toast';
import { VerifyProjectModal } from './VerifyProjectModal';
import { PUBLISH_LABEL, LEAD_SOURCE_LABEL, LEAD_STATUS_LABEL, type PublishStatus, type DevLead } from '@/lib/developerApi';

type AdminLead = DevLead & { referralCode: string | null; project: { name: string; developer: { name: string } | null } };

// Desarrolladores externos que publican en la vitrina de Grupo 3i: condiciones
// comerciales, accesos al portal (/desarrollador) y revisión de sus proyectos.

interface DevUser { id: string; email: string; name: string | null; active: boolean; lastLoginAt: string | null }
interface DevProjectRow { id: string; name: string; slug: string; publishStatus: PublishStatus; reviewNote: string | null; verifiedAt: string | null }
interface Developer {
  id: string;
  name: string;
  legalName: string | null;
  ruc: string | null;
  contactName: string | null;
  email: string | null;
  whatsapp: string | null;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
  commissionRate: number;
  ownLeadRate: number;
  onboardingFee: number;
  onboardingPaid: boolean;
  notes: string | null;
  users: DevUser[];
  projects: DevProjectRow[];
}

const STATUS: Record<Developer['status'], string> = { PENDING: 'En alta', ACTIVE: 'Activo', SUSPENDED: 'Suspendido' };
const EMPTY = {
  name: '', legalName: '', ruc: '', contactName: '', email: '', whatsapp: '', status: 'PENDING',
  commissionRate: '8', ownLeadRate: '2', onboardingFee: '300', onboardingPaid: false, notes: '',
};
type Form = typeof EMPTY;

const toForm = (d: Developer): Form => ({
  name: d.name, legalName: d.legalName ?? '', ruc: d.ruc ?? '', contactName: d.contactName ?? '',
  email: d.email ?? '', whatsapp: d.whatsapp ?? '', status: d.status,
  commissionRate: String(Math.round(d.commissionRate * 1000) / 10),
  ownLeadRate: String(Math.round(d.ownLeadRate * 1000) / 10),
  onboardingFee: String(d.onboardingFee), onboardingPaid: d.onboardingPaid, notes: d.notes ?? '',
});

export default function AdminDevelopersPage() {
  const { toast } = useToast();
  const [devs, setDevs] = useState<Developer[] | null>(null);
  const [editing, setEditing] = useState<{ id?: string; form: Form } | null>(null);
  const [secret, setSecret] = useState<{ email: string; password: string } | null>(null);
  const [review, setReview] = useState<{ project: DevProjectRow; note: string } | null>(null);
  const [leads, setLeads] = useState<AdminLead[] | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);

  const load = useCallback(() => {
    adminApi.get<Developer[]>('/admin/developers').then(setDevs).catch((e) => toast(e.message, 'error'));
    adminApi.get<AdminLead[]>('/admin/developers/leads').then(setLeads).catch(() => setLeads([]));
  }, [toast]);
  useEffect(load, [load]);

  async function saveDev() {
    if (!editing) return;
    const f = editing.form;
    const body = {
      ...f,
      commissionRate: Number(f.commissionRate) / 100,
      ownLeadRate: Number(f.ownLeadRate) / 100,
      onboardingFee: Number(f.onboardingFee),
    };
    try {
      if (editing.id) await adminApi.put(`/admin/developers/${editing.id}`, body);
      else await adminApi.post('/admin/developers', body);
      setEditing(null);
      load();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  async function addUser(dev: Developer) {
    const email = window.prompt(`Correo de acceso para ${dev.name}:`, dev.email ?? '');
    if (!email) return;
    try {
      const r = await adminApi.post<{ email: string; password: string }>(`/admin/developers/${dev.id}/users`, { email });
      setSecret(r);
      load();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  async function resetUser(u: DevUser) {
    if (!window.confirm(`¿Generar una contraseña nueva para ${u.email}? La actual dejará de funcionar.`)) return;
    const r = await adminApi.post<{ password: string }>(`/admin/developers/users/${u.id}/reset`);
    setSecret({ email: u.email, password: r.password });
  }

  async function toggleUser(u: DevUser) {
    await adminApi.patch(`/admin/developers/users/${u.id}`, { active: !u.active });
    load();
  }

  async function decide(decision: 'approve' | 'reject') {
    if (!review) return;
    try {
      await adminApi.post(`/admin/developers/projects/${review.project.id}/review`, { decision, note: review.note });
      toast(decision === 'approve' ? 'Proyecto publicado' : 'Devuelto al desarrollador', 'success');
      setReview(null);
      load();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  const pendingReviews = devs?.flatMap((d) => d.projects.filter((p) => p.publishStatus === 'REVIEW')).length ?? 0;
  const setF = <K extends keyof Form>(k: K, v: Form[K]) =>
    setEditing((e) => (e ? { ...e, form: { ...e.form, [k]: v } } : e));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-primary">Desarrolladoras</h1>
          <p className="text-sm text-brand-gray">
            Proyectos de terceros en la vitrina. Portal de acceso: <code>/desarrollador</code>
            {pendingReviews > 0 && <strong className="ml-2 text-amber-700">· {pendingReviews} en revisión</strong>}
          </p>
        </div>
        <Button onClick={() => setEditing({ form: EMPTY })}>+ Nuevo desarrollador</Button>
      </div>

      {devs === null ? (
        <p className="text-sm text-brand-gray">Cargando…</p>
      ) : devs.length === 0 ? (
        <p className="rounded-xl border-2 border-dashed border-black/10 p-8 text-center text-sm text-brand-gray">
          Aún no hay desarrolladores.
        </p>
      ) : (
        <div className="space-y-4">
          {devs.map((d) => (
            <div key={d.id} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-primary">{d.name}</h2>
                  <p className="text-xs text-brand-gray">
                    {STATUS[d.status]} · comisión {Math.round(d.commissionRate * 1000) / 10} % · propios{' '}
                    {Math.round(d.ownLeadRate * 1000) / 10} % · alta ${d.onboardingFee}{' '}
                    {d.onboardingPaid ? '(pagada)' : '(pendiente)'}
                    {d.whatsapp && ` · ${d.whatsapp}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditing({ id: d.id, form: toForm(d) })}>Editar</Button>
                  <Button size="sm" variant="ghost" onClick={() => addUser(d)}>+ Acceso</Button>
                </div>
              </div>

              {d.users.length > 0 && (
                <div className="mt-3 space-y-1 text-sm">
                  {d.users.map((u) => (
                    <div key={u.id} className="flex flex-wrap items-center gap-3">
                      <span className={u.active ? 'text-primary' : 'text-brand-gray line-through'}>👤 {u.email}</span>
                      <span className="text-xs text-brand-gray">
                        {u.lastLoginAt ? `último ingreso ${new Date(u.lastLoginAt).toLocaleDateString('es-EC')}` : 'nunca ingresó'}
                      </span>
                      <button onClick={() => resetUser(u)} className="text-xs text-secondary hover:underline">Nueva contraseña</button>
                      <button onClick={() => toggleUser(u)} className="text-xs text-brand-gray hover:underline">
                        {u.active ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {d.projects.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {d.projects.map((p) => {
                    const st = PUBLISH_LABEL[p.publishStatus];
                    return (
                      <div key={p.id} className="flex items-center gap-2 rounded-lg bg-light px-3 py-2 text-sm">
                        <span className="font-medium text-primary">{p.name}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs ${st.cls}`}>{st.text}</span>
                        <button onClick={() => setVerifying(p.id)} className={`text-xs hover:underline ${p.verifiedAt ? 'text-green-700' : 'text-brand-gray'}`}>
                          {p.verifiedAt ? '✓ Verificado' : 'Verificar'}
                        </button>
                        {p.publishStatus === 'REVIEW' && (
                          <button onClick={() => setReview({ project: p, note: '' })} className="text-xs font-semibold text-secondary hover:underline">
                            Revisar
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <VerifyProjectModal projectId={verifying} onClose={() => setVerifying(null)} onSaved={load} />

      <p className="mt-8 text-sm text-brand-gray">Las ventas declaradas por las desarrolladoras y el cobro de comisiones están en <a href="/admin/ventas-terceros" className="text-secondary hover:underline">Ventas de terceros</a>.</p>

      {leads && leads.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 font-serif text-xl font-bold text-primary">Contactos de proyectos de terceros</h2>
          <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-black/5 text-xs uppercase tracking-wide text-brand-gray">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Contacto</th>
                  <th className="px-4 py-3">Proyecto</th>
                  <th className="px-4 py-3">Origen</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id} className="border-b border-black/5 last:border-0">
                    <td className="whitespace-nowrap px-4 py-2 text-brand-gray">{new Date(l.createdAt).toLocaleDateString('es-EC')}</td>
                    <td className="px-4 py-2">{l.name} <span className="text-xs text-brand-gray">{l.phone}</span></td>
                    <td className="px-4 py-2">
                      {l.project.name}
                      {l.lotCode && <span className="text-xs text-brand-gray"> · {l.lotCode}</span>}
                      <div className="text-xs text-brand-gray">{l.project.developer?.name}</div>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${LEAD_SOURCE_LABEL[l.source].cls}`}>{LEAD_SOURCE_LABEL[l.source].text}</span>
                      {l.referralCode && <div className="text-xs text-brand-gray">{l.referralCode}</div>}
                    </td>
                    <td className="px-4 py-2">{LEAD_STATUS_LABEL[l.status]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Editar desarrollador' : 'Nuevo desarrollador'}>
        {editing && (
          <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
            <Input label="Nombre comercial *" value={editing.form.name} onChange={(e) => setF('name', e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <Input label="Razón social" value={editing.form.legalName} onChange={(e) => setF('legalName', e.target.value)} />
              <Input label="RUC" value={editing.form.ruc} onChange={(e) => setF('ruc', e.target.value)} />
              <Input label="Contacto" value={editing.form.contactName} onChange={(e) => setF('contactName', e.target.value)} />
              <Input label="WhatsApp para contactos" placeholder="+593 …" value={editing.form.whatsapp} onChange={(e) => setF('whatsapp', e.target.value)} />
            </div>
            <Input label="Correo" type="email" value={editing.form.email} onChange={(e) => setF('email', e.target.value)} />
            <div className="grid grid-cols-3 gap-2">
              <Input label="Comisión %" type="number" step="0.1" value={editing.form.commissionRate} onChange={(e) => setF('commissionRate', e.target.value)} />
              <Input label="Propios %" type="number" step="0.1" value={editing.form.ownLeadRate} onChange={(e) => setF('ownLeadRate', e.target.value)} />
              <Input label="Alta $" type="number" value={editing.form.onboardingFee} onChange={(e) => setF('onboardingFee', e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editing.form.onboardingPaid} onChange={(e) => setF('onboardingPaid', e.target.checked)} />
              Alta pagada
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-primary">Estado</span>
              <select
                value={editing.form.status}
                onChange={(e) => setF('status', e.target.value)}
                className="w-full rounded-lg border border-black/15 px-3 py-2.5"
              >
                {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <Textarea label="Notas internas" rows={3} value={editing.form.notes} onChange={(e) => setF('notes', e.target.value)} />
            <Button onClick={saveDev} className="w-full">Guardar</Button>
          </div>
        )}
      </Modal>

      <Modal open={!!secret} onClose={() => setSecret(null)} title="Acceso creado">
        {secret && (
          <div className="space-y-3 text-sm">
            <p>Envía estos datos al desarrollador. <strong>La contraseña no se volverá a mostrar.</strong></p>
            <div className="rounded-lg bg-light p-3 font-mono">
              <div>grupo3i.com/desarrollador</div>
              <div>{secret.email}</div>
              <div>{secret.password}</div>
            </div>
            <Button
              className="w-full"
              onClick={() => {
                navigator.clipboard?.writeText(
                  `Portal de desarrolladores Grupo 3i\nhttps://grupo3i.com/desarrollador\nCorreo: ${secret.email}\nContraseña temporal: ${secret.password}`,
                );
                toast('Copiado', 'success');
              }}
            >
              Copiar mensaje
            </Button>
          </div>
        )}
      </Modal>

      <Modal open={!!review} onClose={() => setReview(null)} title={`Revisar: ${review?.project.name ?? ''}`}>
        {review && (
          <div className="space-y-3 text-sm">
            <p>
              Revisa la ficha antes de publicar.{' '}
              <a href={`/admin/proyectos`} className="text-secondary hover:underline">Abrir en Proyectos</a> para
              completar mapa de lotes, 360° o brochure.
            </p>
            <Textarea
              label="Observaciones (obligatorias si lo devuelves)"
              rows={4}
              value={review.note}
              onChange={(e) => setReview({ ...review, note: e.target.value })}
            />
            <div className="flex gap-2">
              <Button onClick={() => decide('approve')} className="flex-1">Publicar</Button>
              <Button variant="outline" onClick={() => decide('reject')} className="flex-1">Devolver</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
