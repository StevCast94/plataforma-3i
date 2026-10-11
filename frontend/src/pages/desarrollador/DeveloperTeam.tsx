import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/shared/Toast';
import { devApi, type TeamUser } from '@/lib/developerApi';

// Equipo de ventas del desarrollador. Los contactos nuevos se reparten solos entre
// los vendedores activos (el que tenga menos contactos abiertos). El vendedor solo
// ve el CRM y sus propios contactos.

export function DeveloperTeam({ meId }: { meId: string }) {
  const { toast } = useToast();
  const [users, setUsers] = useState<TeamUser[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [secret, setSecret] = useState<{ email: string; password: string } | null>(null);

  const load = useCallback(() => {
    devApi.get<TeamUser[]>('/team').then(setUsers).catch((e) => toast(e.message, 'error'));
  }, [toast]);
  useEffect(load, [load]);

  async function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      const r = await devApi.post<{ email: string; password: string }>('/team', { name: fd.get('name'), email: fd.get('email'), whatsapp: fd.get('whatsapp') });
      setAdding(false);
      setSecret(r);
      load();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }

  async function editWhatsapp(u: TeamUser) {
    const v = window.prompt(`WhatsApp de ${u.name ?? u.email} (con código de país, ej. +593 99 123 4567). Déjalo vacío para usar el de la empresa.`, u.whatsapp ?? '+593 ');
    if (v === null) return;
    try {
      await devApi.patch(`/team/${u.id}`, { whatsapp: v });
      load();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }

  async function toggle(u: TeamUser) {
    if (u.active && !window.confirm(`¿Desactivar a ${u.name ?? u.email}? Sus contactos abiertos pasarán a ti.`)) return;
    try {
      await devApi.patch(`/team/${u.id}`, { active: !u.active });
      load();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-serif text-xl font-bold text-primary">Equipo de ventas</h2>
          <p className="text-xs text-brand-gray">Los contactos nuevos se reparten solos entre los vendedores activos. Cada vendedor ve solo el CRM y sus contactos. Al dejar sus datos, el cliente abre el chat con el WhatsApp de su asesor (o el de la empresa si el asesor no tiene).</p>
        </div>
        <Button size="sm" onClick={() => setAdding(true)}>+ Vendedor</Button>
      </div>

      {users === null ? (
        <p className="text-sm text-brand-gray">Cargando…</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/5 text-xs uppercase tracking-wide text-brand-gray">
              <tr>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">WhatsApp</th>
                <th className="px-4 py-3 text-right">Contactos abiertos</th>
                <th className="px-4 py-3">Avisos</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={`border-b border-black/5 last:border-0 ${u.active ? '' : 'text-brand-gray'}`}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{u.name ?? u.email}</p>
                    <p className="text-xs text-brand-gray">
                      {u.email} · {u.lastLoginAt ? `último ingreso ${new Date(u.lastLoginAt).toLocaleDateString('es-EC')}` : 'nunca ingresó'}
                    </p>
                  </td>
                  <td className="px-4 py-3">{u.role === 'OWNER' ? 'Dueño' : 'Vendedor'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => editWhatsapp(u)} className={u.whatsapp ? 'text-primary hover:underline' : 'text-xs text-secondary hover:underline'}>
                      {u.whatsapp ?? '+ Agregar'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{u._count.leads}</td>
                  <td className="px-4 py-3">{u._count.pushSubs ? '🔔 Activos' : <span className="text-xs text-brand-gray">Sin activar</span>}</td>
                  <td className="px-4 py-3 text-right">
                    {u.id !== meId && (
                      <button onClick={() => toggle(u)} className="text-xs text-brand-gray hover:underline">
                        {u.active ? 'Desactivar' : 'Activar'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="Nuevo vendedor">
        <form onSubmit={add} className="space-y-3">
          <Input name="name" label="Nombre" required />
          <Input name="email" type="email" label="Correo" required />
          <Input name="whatsapp" type="tel" label="WhatsApp (opcional)" placeholder="+593 99 123 4567" />
          <Button type="submit" className="w-full">Crear acceso</Button>
        </form>
      </Modal>

      <Modal open={!!secret} onClose={() => setSecret(null)} title="Acceso creado">
        {secret && (
          <div className="space-y-3 text-sm">
            <p>Envía estos datos al vendedor. <strong>La contraseña no se volverá a mostrar.</strong></p>
            <div className="rounded-lg bg-light p-3 font-mono">
              <div>grupo3i.com/desarrollador</div>
              <div>{secret.email}</div>
              <div>{secret.password}</div>
            </div>
            <Button
              className="w-full"
              onClick={() => {
                navigator.clipboard?.writeText(
                  `Acceso al CRM de ventas\nhttps://grupo3i.com/desarrollador\nCorreo: ${secret.email}\nContraseña temporal: ${secret.password}\nAl entrar, activa los avisos para recibir tus contactos al celular.`,
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
