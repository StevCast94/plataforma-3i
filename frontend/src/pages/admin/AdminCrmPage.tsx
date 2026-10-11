import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import { CrmClientContext, adminCrmClient } from '@/lib/crmClient';
import type { DevProject } from '@/lib/developerApi';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useToast } from '@/components/shared/Toast';
import { DeveloperCRM } from '@/pages/desarrollador/crm/DeveloperCRM';
import { PushBanner } from '@/pages/desarrollador/DeveloperPortalPage';

// CRM único de Grupo 3i para sus proyectos propios (Montañita View, Ibiza): el mismo
// CRM del portal de desarrolladores. Los asesores (rol advisor) ven solo sus
// contactos; administradores ven todo, reasignan y gestionan las consultas web.

interface InboxItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  source: string | null;
  createdAt: string;
}

function WebInbox({ projects, onMoved }: { projects: DevProject[]; onMoved: () => void }) {
  const { toast } = useToast();
  const [items, setItems] = useState<InboxItem[] | null>(null);
  const [target, setTarget] = useState<Record<string, string>>({});

  const load = useCallback(() => {
    adminCrmClient.get<InboxItem[]>('/inbox').then(setItems).catch(() => setItems([]));
  }, []);
  useEffect(load, [load]);

  async function act(it: InboxItem, action: 'lead' | 'archive') {
    try {
      await adminCrmClient.post(`/inbox/${it.id}`, action === 'lead' ? { action, projectId: target[it.id] ?? projects[0]?.id } : { action });
      toast(action === 'lead' ? 'Pasado al CRM' : 'Archivado', 'success');
      load();
      if (action === 'lead') onMoved();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }

  if (!items?.length) return null;
  return (
    <section className="mt-8 rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-primary">Consultas web por revisar ({items.length})</h2>
      <p className="mb-4 text-xs text-brand-gray">
        Formularios de la web que no son de un proyecto o no dejaron WhatsApp. Pásalos al CRM eligiendo el proyecto, o respóndelos por correo y
        archívalos.
      </p>
      <ul className="divide-y divide-black/5">
        {items.map((it) => (
          <li key={it.id} className="flex flex-wrap items-start justify-between gap-3 py-3 text-sm">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-primary">
                {it.name} <span className="font-normal text-brand-gray">· {new Date(it.createdAt).toLocaleDateString('es-EC')}</span>
              </p>
              <p className="text-xs text-brand-gray">
                <a href={`mailto:${it.email}`} className="hover:underline">{it.email}</a>
                {it.phone && <> · {it.phone}</>}
                {it.source && <> · {it.source}</>}
              </p>
              <p className="mt-1 line-clamp-2 text-primary/80">{it.message}</p>
            </div>
            <div className="flex items-center gap-2">
              {it.phone && (
                <>
                  <select
                    value={target[it.id] ?? projects[0]?.id ?? ''}
                    onChange={(e) => setTarget({ ...target, [it.id]: e.target.value })}
                    className="rounded-lg border border-black/15 px-2 py-1.5 text-xs"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <button onClick={() => act(it, 'lead')} className="rounded-lg bg-primary px-3 py-1.5 text-xs text-white">Pasar al CRM</button>
                </>
              )}
              <button onClick={() => act(it, 'archive')} className="rounded-lg border border-black/15 px-3 py-1.5 text-xs text-brand-gray">Archivar</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function AdminCrmPage() {
  const { staff } = useAdminAuth();
  const isOwner = staff?.role === 'superadmin' || staff?.role === 'admin';
  const [projects, setProjects] = useState<DevProject[]>([]);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    adminApi
      .get<(DevProject & { developerId: string | null })[]>('/admin/projects')
      .then((ps) => setProjects(ps.filter((p) => !p.developerId)))
      .catch(() => {});
  }, []);
  return (
    <div>
      <h1 className="mb-1 font-serif text-2xl font-bold text-primary">CRM de ventas</h1>
      <p className="mb-5 text-sm text-brand-gray">
        {isOwner
          ? 'Todos los contactos de los proyectos propios: WhatsApp de la ficha, formularios, consultas de producto y los que registres a mano. Se reparten solos entre los asesores (Equipo).'
          : 'Tus contactos asignados y tus tareas. Activa los avisos para enterarte al instante de cada contacto nuevo.'}
      </p>
      <PushBanner scope="admin" />
      <CrmClientContext.Provider value={adminCrmClient}>
        <DeveloperCRM key={tick} projects={projects} ownLeadRate={0} isOwner={isOwner} canSell={false} />
      </CrmClientContext.Provider>
      {isOwner && <WebInbox projects={projects} onMoved={() => setTick((t) => t + 1)} />}
    </div>
  );
}
