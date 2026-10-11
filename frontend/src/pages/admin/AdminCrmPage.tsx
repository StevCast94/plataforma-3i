import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import { CrmClientContext, adminCrmClient } from '@/lib/crmClient';
import type { DevProject } from '@/lib/developerApi';
import { DeveloperCRM } from '@/pages/desarrollador/crm/DeveloperCRM';
import { PushBanner } from '@/pages/desarrollador/DeveloperPortalPage';

// CRM de Grupo 3i para sus proyectos propios (Montañita View, Ibiza): el mismo
// CRM del portal de desarrolladores, con el cliente del admin.
export default function AdminCrmPage() {
  const [projects, setProjects] = useState<DevProject[]>([]);
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
        Contactos de los proyectos propios. Para que el botón de WhatsApp registre cada contacto aquí, activa «Registrar contactos en el CRM» en el
        proyecto.
      </p>
      <PushBanner scope="admin" />
      <CrmClientContext.Provider value={adminCrmClient}>
        <DeveloperCRM projects={projects} ownLeadRate={0} isOwner />
      </CrmClientContext.Provider>
    </div>
  );
}
