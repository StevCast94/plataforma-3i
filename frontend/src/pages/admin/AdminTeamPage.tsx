import { useState, type FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/shared/Toast';
import { useAdminGet } from '@/hooks/useAdminAPI';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { adminApi } from '@/lib/adminApi';
import { ROLE_LABEL, type StaffRole } from '@/lib/adminNav';

// Equipo de Grupo 3i: usuarios del admin, su rol (qué ven), su WhatsApp y su
// carga en el CRM. Los asesores reciben los contactos de los proyectos propios
// en reparto automático y el cliente abre el chat con su WhatsApp.

interface Staff {
  id: string;
  username: string;
  fullName: string | null;
  whatsapp: string | null;
  role: StaffRole;
  active: boolean;
  lastLoginAt: string | null;
  openLeads: number;
  pushEnabled: boolean;
}

const ROLE_HELP: Record<StaffRole, string> = {
  superadmin: 'Todo, incluido el equipo.',
  admin: 'Todo menos el equipo. Ve todo el CRM y reasigna.',
  advisor: 'Solo el CRM con sus contactos y los proyectos para consultar. Recibe contactos en el reparto automático.',
  content: 'Proyectos, productos y textos del sitio.',
  bosque: 'Solo el módulo del Bosque.',
};
const ROLES: StaffRole[] = ['advisor', 'admin', 'content', 'bosque', 'superadmin'];

export default function AdminTeamPage() {
  const { toast } = useToast();
  const { staff: me } = useAdminAuth();
  const myId = me?.id ?? me?.staffId;
  const { data, loading, reload } = useAdminGet<Staff[]>('/admin/staff');
  const [editing, setEditing] = useState<Staff | 'new' | null>(null);
  const [secret, setSecret] = useState<{ username: string; password: string } | null>(null);

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    try {
      if (editing === 'new') {
        const r = await adminApi.post<{ username: string; password: string }>('/admin/staff', fd);
        setSecret(r);
      } else if (editing) {
        await adminApi.put(`/admin/staff/${editing.id}`, { fullName: fd.fullName, whatsapp: fd.whatsapp, role: fd.role });
        toast('Usuario actualizado', 'success');
      }
      setEditing(null);
      reload();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }

  async function toggle(s: Staff) {
    if (s.active && !window.confirm(`¿Desactivar a ${s.fullName ?? s.username}? No podrá entrar y sus contactos abiertos quedarán sin asignar.`)) return;
    try {
      await adminApi.put(`/admin/staff/${s.id}`, { active: !s.active });
      reload();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }

  async function resetPassword(s: Staff) {
    if (!window.confirm(`¿Generar una contraseña nueva para ${s.fullName ?? s.username}? La actual dejará de funcionar.`)) return;
    try {
      const r = await adminApi.post<{ password: string }>(`/admin/staff/${s.id}/password`);
      setSecret({ username: s.username, password: r.password });
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }

  const current = editing && editing !== 'new' ? editing : null;
  const advisors = (data ?? []).filter((s) => s.active && s.role === 'advisor');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">Equipo</h1>
          <p className="max-w-3xl text-sm text-brand-gray">
            Las personas que usan el admin y qué puede ver cada una. Los <strong>asesores de ventas</strong> reciben los contactos de los proyectos
            propios en reparto automático (al que tenga menos abiertos) y el cliente abre el chat con su WhatsApp.
          </p>
        </div>
        <Button onClick={() => setEditing('new')}>+ Agregar persona</Button>
      </div>

      {data && !advisors.length && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          Aún no hay asesores de ventas activos: los contactos nuevos quedan sin asignar y los ven los administradores en el CRM.
        </p>
      )}

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-black/5">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/5 text-xs uppercase tracking-wide text-brand-gray">
            <tr>
              <th className="px-4 py-3">Persona</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">WhatsApp</th>
              <th className="px-4 py-3 text-right">Contactos abiertos</th>
              <th className="px-4 py-3">Avisos</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-brand-gray">Cargando…</td>
              </tr>
            )}
            {(data ?? []).map((s) => (
              <tr key={s.id} className={`border-b border-black/5 last:border-0 ${s.active ? '' : 'text-brand-gray'}`}>
                <td className="px-4 py-3">
                  <p className="font-medium text-primary">{s.fullName ?? s.username}</p>
                  <p className="text-xs text-brand-gray">
                    {s.username} · {s.lastLoginAt ? `último ingreso ${new Date(s.lastLoginAt).toLocaleDateString('es-EC')}` : 'nunca ingresó'}
                    {!s.active && ' · desactivado'}
                  </p>
                </td>
                <td className="px-4 py-3">{ROLE_LABEL[s.role] ?? s.role}</td>
                <td className="px-4 py-3">{s.whatsapp ?? <span className="text-xs text-brand-gray">—</span>}</td>
                <td className="px-4 py-3 text-right tabular-nums">{s.role === 'advisor' || s.openLeads ? s.openLeads : '—'}</td>
                <td className="px-4 py-3">{s.pushEnabled ? '🔔 Activos' : <span className="text-xs text-brand-gray">Sin activar</span>}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-xs">
                  <button onClick={() => setEditing(s)} className="text-secondary hover:underline">Editar</button>
                  <button onClick={() => resetPassword(s)} className="ml-3 text-brand-gray hover:underline">Contraseña</button>
                  {s.id !== myId && (
                    <button onClick={() => toggle(s)} className="ml-3 text-brand-gray hover:underline">{s.active ? 'Desactivar' : 'Activar'}</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {ROLES.map((r) => (
          <div key={r} className="rounded-xl bg-white p-4 text-sm shadow-sm ring-1 ring-black/5">
            <p className="font-semibold text-primary">{ROLE_LABEL[r]}</p>
            <p className="mt-1 text-xs text-brand-gray">{ROLE_HELP[r]}</p>
          </div>
        ))}
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={current ? `Editar · ${current.fullName ?? current.username}` : 'Agregar persona'}>
        <form key={current?.id ?? 'new'} onSubmit={save} className="space-y-3">
          <Input name="fullName" label="Nombre completo" defaultValue={current?.fullName ?? ''} required />
          {!current && <Input name="username" label="Usuario para entrar" placeholder="carlos.mendoza" required />}
          <Input name="whatsapp" type="tel" label="WhatsApp (con código de país)" placeholder="+593 99 123 4567" defaultValue={current?.whatsapp ?? ''} />
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-primary">Rol</span>
            <select
              name="role"
              defaultValue={current?.role ?? 'advisor'}
              disabled={current?.id === myId}
              className="w-full rounded-lg border border-black/15 bg-white px-4 py-3 text-sm"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]} — {ROLE_HELP[r]}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" className="w-full">{current ? 'Guardar' : 'Crear acceso'}</Button>
        </form>
      </Modal>

      <Modal open={!!secret} onClose={() => setSecret(null)} title="Acceso listo">
        {secret && (
          <div className="space-y-3 text-sm">
            <p>Envíale estos datos. <strong>La contraseña no se volverá a mostrar.</strong></p>
            <div className="rounded-lg bg-light p-3 font-mono">
              <div>grupo3i.com/admin</div>
              <div>{secret.username}</div>
              <div>{secret.password}</div>
            </div>
            <Button
              className="w-full"
              onClick={() => {
                navigator.clipboard?.writeText(
                  `Acceso al admin de Grupo 3i\nhttps://grupo3i.com/admin\nUsuario: ${secret.username}\nContraseña: ${secret.password}\nAl entrar, abre «CRM de ventas» y activa los avisos para recibir tus contactos al celular.`,
                );
                toast('Copiado', 'success');
              }}
            >
              Copiar mensaje
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
