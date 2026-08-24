import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAdminGet } from '@/hooks/useAdminAPI';
import { adminApi } from '@/lib/adminApi';
import { useToast } from '@/components/shared/Toast';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import type { StaffUser, AuditLogRow } from '@/lib/adminTypes';
import type { SiteContentMap } from '@shared/types';

type Tab = 'staff' | 'content' | 'audit';

export default function AdminSettingsPage() {
  const { isSuperadmin } = useAdminAuth();
  const [tab, setTab] = useState<Tab>('staff');

  if (!isSuperadmin) {
    return <p className="text-brand-gray">Esta sección requiere permisos de superadmin.</p>;
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-primary">Configuración</h1>
      <div className="flex gap-2">
        {(['staff', 'content', 'audit'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${tab === t ? 'bg-primary text-white' : 'bg-light text-brand-gray'}`}
          >
            {t === 'staff' ? 'Staff' : t === 'content' ? 'Contenido' : 'Auditoría'}
          </button>
        ))}
      </div>

      {tab === 'staff' && <StaffTab />}
      {tab === 'content' && <ContentTab />}
      {tab === 'audit' && <AuditTab />}
    </div>
  );
}

function StaffTab() {
  const { toast } = useToast();
  const { data, loading, reload } = useAdminGet<StaffUser[]>('/admin/staff');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');

  async function create() {
    if (!username || !password) {
      toast('Usuario y contraseña requeridos', 'error');
      return;
    }
    try {
      await adminApi.post('/admin/staff', { username, password, role });
      toast('Staff creado', 'success');
      setUsername(''); setPassword('');
      reload();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }

  async function toggle(s: StaffUser) {
    try {
      await adminApi.put(`/admin/staff/${s.id}`, { active: !s.active });
      reload();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h3 className="text-lg text-primary">Crear usuario staff</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Input label="Usuario" value={username} onChange={(e) => setUsername(e.target.value)} />
          <Input label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-primary">Rol</span>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-lg border border-black/15 bg-white px-4 py-3 text-sm">
              <option value="admin">Admin</option>
              <option value="advisor">Asesor (recibe leads)</option>
              <option value="content">Contenido</option>
              <option value="superadmin">Superadmin</option>
            </select>
          </label>
        </div>
        <Button className="mt-4" onClick={create}>Crear</Button>
      </div>

      <div className="rounded-xl bg-white shadow-sm ring-1 ring-black/5">
        {loading && <p className="p-6 text-brand-gray">Cargando…</p>}
        {(data ?? []).map((s) => (
          <div key={s.id} className="flex items-center justify-between border-b border-black/5 px-6 py-3 last:border-0">
            <div>
              <span className="font-medium text-primary">{s.username}</span>
              <span className="ml-2 text-xs text-brand-gray">{s.role}</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={s.active ? 'gold' : 'light'}>{s.active ? 'Activo' : 'Inactivo'}</Badge>
              <Button size="sm" variant="outline" onClick={() => toggle(s)}>{s.active ? 'Desactivar' : 'Activar'}</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContentTab() {
  const { toast } = useToast();
  const { data, loading } = useAdminGet<SiteContentMap>('/content');

  async function saveField(section: string, key: string, value: string) {
    try {
      await adminApi.put('/content', { section, key, value });
      toast('Contenido guardado', 'success');
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }

  if (loading) return <p className="text-brand-gray">Cargando contenido…</p>;
  const sections = Object.entries(data ?? {});

  return (
    <div className="space-y-5">
      {sections.map(([section, fields]) => (
        <div key={section} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h3 className="text-lg capitalize text-primary">{section}</h3>
          <div className="mt-4 space-y-3">
            {Object.entries(fields).map(([key, value]) => (
              <ContentField
                key={key}
                section={section}
                fieldKey={key}
                initial={value}
                onSave={saveField}
                hint={
                  section === 'hero' && key === 'image_url'
                    ? 'Una URL por línea (o separadas por coma) para que el hero rote entre varias imágenes. La imagen del proyecto ya incluida por defecto se muestra siempre primero.'
                    : undefined
                }
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ContentField({
  section,
  fieldKey,
  initial,
  onSave,
  hint,
}: {
  section: string;
  fieldKey: string;
  initial: string;
  onSave: (section: string, key: string, value: string) => void;
  hint?: string;
}) {
  const [value, setValue] = useState(initial);
  const dirty = value !== initial;
  return (
    <div className="flex items-end gap-2">
      <label className="flex-1">
        <span className="mb-1 block text-xs uppercase tracking-wider text-brand-gray">{fieldKey}</span>
        <textarea value={value} onChange={(e) => setValue(e.target.value)} rows={value.length > 60 ? 2 : 1} className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm" />
        {hint && <span className="mt-1 block text-xs text-brand-gray">{hint}</span>}
      </label>
      <Button size="sm" disabled={!dirty} onClick={() => onSave(section, fieldKey, value)}>Guardar</Button>
    </div>
  );
}

function AuditTab() {
  const { data, loading } = useAdminGet<AuditLogRow[]>('/admin/audit-logs');
  return (
    <div className="rounded-xl bg-white shadow-sm ring-1 ring-black/5">
      {loading && <p className="p-6 text-brand-gray">Cargando…</p>}
      {(data ?? []).map((l) => (
        <div key={l.id} className="flex items-center justify-between border-b border-black/5 px-6 py-3 text-sm last:border-0">
          <div>
            <span className="font-medium text-primary">{l.staff?.username ?? 'sistema'}</span>{' '}
            <span className="text-brand-gray">{l.action} · {l.entity}</span>
          </div>
          <span className="text-xs text-brand-gray">{new Date(l.createdAt).toLocaleString('es-EC')}</span>
        </div>
      ))}
      {!loading && (data?.length ?? 0) === 0 && <p className="p-6 text-brand-gray">Sin registros.</p>}
    </div>
  );
}
