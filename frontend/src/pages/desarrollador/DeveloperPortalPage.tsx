import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Seo } from '@/components/shared/Seo';
import { ImageUpload } from '@/components/shared/ImageUpload';
import { useToast } from '@/components/shared/Toast';
import { cld } from '@/lib/cloudinary';
import { DeveloperLeads } from './DeveloperLeads';
import {
  devApi, getDevToken, setDevToken, PUBLISH_LABEL, type DevMe, type DevProject,
} from '@/lib/developerApi';

// Portal del desarrollador (/desarrollador): terceros que publican sus proyectos en
// la vitrina de Grupo 3i. Arman un borrador, lo envían a revisión y Grupo 3i lo publica.

const pct = (n: number) => `${Math.round(n * 1000) / 10} %`;
const uploadImage = (dataUri: string) => devApi.post<{ url: string }>('/upload-image', { dataUri });

function Shell({ children, onLogout }: { children: React.ReactNode; onLogout?: () => void }) {
  return (
    <div className="min-h-screen bg-light">
      <Seo title="Portal de desarrolladores — Grupo 3i" noindex />
      <header className="bg-primary text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/" className="font-serif text-xl font-bold">
            Grupo<span className="text-secondary"> 3i</span>
            <span className="ml-2 align-middle text-xs font-normal uppercase tracking-widest text-white/60">Desarrolladores</span>
          </Link>
          {onLogout && (
            <button onClick={onLogout} className="text-sm text-white/70 hover:text-white">
              Salir
            </button>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}

function Login({ onDone }: { onDone: () => void }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const { token } = await devApi.post<{ token: string }>('/login', {
        email: fd.get('email'),
        password: fd.get('password'),
      });
      setDevToken(token);
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell>
      <div className="mx-auto max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="font-serif text-2xl font-bold text-primary">Portal de desarrolladores</h1>
        <p className="mt-1 text-sm text-brand-gray">Publica y administra tus proyectos en Grupo 3i.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <Input name="email" type="email" label="Correo" required autoFocus />
          <Input name="password" type="password" label="Contraseña" required />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" size="lg" disabled={loading} className="w-full">
            {loading ? 'Ingresando…' : 'Ingresar'}
          </Button>
        </form>
        <p className="mt-4 text-xs text-brand-gray">
          ¿Aún no tienes acceso? Escríbenos y te creamos la cuenta.
        </p>
      </div>
    </Shell>
  );
}

type Draft = Pick<DevProject, 'name' | 'subtitle' | 'description' | 'location' | 'coverImage' | 'images' | 'priceLabel'> & {
  priceFrom: string;
  mapLat: string;
  mapLng: string;
};

const toDraft = (p?: DevProject): Draft => ({
  name: p?.name ?? '',
  subtitle: p?.subtitle ?? '',
  description: p?.description ?? '',
  location: p?.location ?? '',
  coverImage: p?.coverImage ?? null,
  images: p?.images ?? [],
  priceLabel: p?.priceLabel ?? '',
  priceFrom: p?.priceFrom != null ? String(p.priceFrom) : '',
  mapLat: p?.mapLat != null ? String(p.mapLat) : '',
  mapLng: p?.mapLng != null ? String(p.mapLng) : '',
});

function Editor({ project, onBack, onSaved }: { project?: DevProject; onBack: () => void; onSaved: (p: DevProject) => void }) {
  const { toast } = useToast();
  const [d, setD] = useState<Draft>(() => toDraft(project));
  const [busy, setBusy] = useState(false);
  const locked = project?.publishStatus === 'REVIEW';
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));

  async function save(submit = false) {
    setBusy(true);
    try {
      let saved = project
        ? await devApi.put<DevProject>(`/projects/${project.id}`, d)
        : await devApi.post<DevProject>('/projects', d);
      if (submit) saved = await devApi.post<DevProject>(`/projects/${saved.id}/submit`);
      toast(submit ? 'Enviado a revisión. Te avisaremos al publicarlo.' : 'Cambios guardados', 'success');
      onSaved(saved);
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <button onClick={onBack} className="text-sm text-brand-gray hover:text-primary">← Mis proyectos</button>
      <h2 className="mt-2 font-serif text-2xl font-bold text-primary">{project ? project.name : 'Nuevo proyecto'}</h2>
      {project?.reviewNote && (
        <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <strong>Observaciones de Grupo 3i:</strong> {project.reviewNote}
        </div>
      )}
      {locked && (
        <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          Está en revisión. Podrás editarlo cuando Grupo 3i responda.
        </p>
      )}
      <fieldset disabled={locked || busy} className="mt-6 grid gap-4 sm:grid-cols-2">
        <Input label="Nombre del proyecto *" value={d.name} onChange={(e) => set('name', e.target.value)} />
        <Input label="Subtítulo" value={d.subtitle ?? ''} onChange={(e) => set('subtitle', e.target.value)} />
        <div className="sm:col-span-2">
          <Textarea
            label="Descripción * (mínimo 80 caracteres)"
            rows={6}
            value={d.description}
            onChange={(e) => set('description', e.target.value)}
          />
          <p className="mt-1 text-xs text-brand-gray">{d.description.trim().length} caracteres</p>
        </div>
        <Input label="Ubicación *" placeholder="Olón, Santa Elena" value={d.location ?? ''} onChange={(e) => set('location', e.target.value)} />
        <Input label="Precio desde (USD)" type="number" value={d.priceFrom} onChange={(e) => set('priceFrom', e.target.value)} />
        <Input label="Texto de precio" placeholder="Lotes desde $25,000" value={d.priceLabel ?? ''} onChange={(e) => set('priceLabel', e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <Input label="Latitud" value={d.mapLat} onChange={(e) => set('mapLat', e.target.value)} />
          <Input label="Longitud" value={d.mapLng} onChange={(e) => set('mapLng', e.target.value)} />
        </div>
        <div>
          <span className="mb-1.5 block text-sm font-medium text-primary">Portada *</span>
          <ImageUpload single value={d.coverImage ? [d.coverImage] : []} onChange={(u) => set('coverImage', u[0] ?? null)} upload={uploadImage} />
        </div>
        <div>
          <span className="mb-1.5 block text-sm font-medium text-primary">Galería</span>
          <ImageUpload value={d.images} onChange={(u) => set('images', u)} max={30} upload={uploadImage} />
        </div>
      </fieldset>
      {!locked && (
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => save(false)} disabled={busy} variant="outline">Guardar</Button>
          {(!project || project.publishStatus === 'DRAFT') && (
            <Button onClick={() => save(true)} disabled={busy}>Guardar y enviar a revisión</Button>
          )}
        </div>
      )}
      <p className="mt-4 text-xs text-brand-gray">
        El mapa de lotes y los recorridos 360° los cargamos junto contigo durante el alta del proyecto.
      </p>
    </div>
  );
}

function Portal({ onLogout }: { onLogout: () => void }) {
  const { toast } = useToast();
  const [me, setMe] = useState<DevMe | null>(null);
  const [projects, setProjects] = useState<DevProject[] | null>(null);
  const [editing, setEditing] = useState<DevProject | 'new' | null>(null);
  const [tab, setTab] = useState<'projects' | 'leads'>('projects');

  const load = useCallback(async () => {
    try {
      const [m, p] = await Promise.all([devApi.get<DevMe>('/me'), devApi.get<DevProject[]>('/projects')]);
      setMe(m);
      setProjects(p);
    } catch (err) {
      if ((err as { status?: number }).status === 401) onLogout();
      else toast((err as Error).message, 'error');
    }
  }, [onLogout, toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function togglePause(p: DevProject) {
    try {
      await devApi.post(`/projects/${p.id}/pause`, { paused: p.publishStatus === 'PUBLISHED' });
      load();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }

  if (editing) {
    return (
      <Shell onLogout={onLogout}>
        <Editor
          project={editing === 'new' ? undefined : editing}
          onBack={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      </Shell>
    );
  }

  const dev = me?.developer;
  return (
    <Shell onLogout={onLogout}>
      {dev && (
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-widest text-brand-gray">Tu empresa</p>
          <h1 className="font-serif text-2xl font-bold text-primary">{dev.name}</h1>
          {dev.status === 'PENDING' && (
            <p className="mt-2 text-sm text-amber-800">Tu cuenta está en proceso de alta. Ya puedes ir armando tus proyectos.</p>
          )}
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-lg bg-light p-3">
              <p className="text-brand-gray">Comisión por venta de la plataforma</p>
              <p className="text-lg font-bold text-primary">{pct(dev.commissionRate)}</p>
            </div>
            <div className="rounded-lg bg-light p-3">
              <p className="text-brand-gray">Venta a contactos propios</p>
              <p className="text-lg font-bold text-primary">{pct(dev.ownLeadRate)}</p>
            </div>
            <div className="rounded-lg bg-light p-3">
              <p className="text-brand-gray">Alta del proyecto</p>
              <p className="text-lg font-bold text-primary">
                ${dev.onboardingFee.toLocaleString('en-US')} {dev.onboardingPaid ? '· pagada ✓' : '· pendiente'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-5 flex gap-1 rounded-xl bg-white p-1 shadow-sm">
        {([['projects', 'Proyectos'], ['leads', 'Contactos']] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium ${
              tab === k ? 'bg-primary text-white' : 'text-brand-gray hover:text-primary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'leads' && dev ? (
        <DeveloperLeads projects={projects ?? []} ownLeadRate={dev.ownLeadRate} />
      ) : (
      <>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-serif text-xl font-bold text-primary">Mis proyectos</h2>
        <Button size="sm" onClick={() => setEditing('new')}>+ Nuevo proyecto</Button>
      </div>
      {projects === null ? (
        <p className="text-sm text-brand-gray">Cargando…</p>
      ) : projects.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-black/10 p-10 text-center text-sm text-brand-gray">
          Aún no tienes proyectos. Crea el primero y envíalo a revisión.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((p) => {
            const st = PUBLISH_LABEL[p.publishStatus];
            return (
              <div key={p.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                {p.coverImage ? (
                  <img src={cld(p.coverImage, { width: 640 })} alt="" className="h-36 w-full object-cover" />
                ) : (
                  <div className="flex h-36 items-center justify-center bg-light text-3xl">🏞️</div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-primary">{p.name}</h3>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${st.cls}`}>{st.text}</span>
                  </div>
                  <p className="text-sm text-brand-gray">{p.location || 'Sin ubicación'}</p>
                  {p.reviewNote && <p className="mt-2 text-xs text-amber-800">⚠️ Tiene observaciones por corregir</p>}
                  <div className="mt-3 flex flex-wrap gap-2 text-sm">
                    <Button size="sm" variant="outline" onClick={() => setEditing(p)}>
                      {p.publishStatus === 'REVIEW' ? 'Ver' : 'Editar'}
                    </Button>
                    {p.publishStatus === 'PUBLISHED' && (
                      <a href={`/proyectos/${p.slug}`} target="_blank" rel="noreferrer" className="px-2 py-1.5 text-secondary hover:underline">
                        Ver publicado ↗
                      </a>
                    )}
                    {(p.publishStatus === 'PUBLISHED' || p.publishStatus === 'PAUSED') && (
                      <button onClick={() => togglePause(p)} className="px-2 py-1.5 text-brand-gray hover:text-primary">
                        {p.publishStatus === 'PUBLISHED' ? 'Pausar' : 'Reactivar'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </>
      )}
    </Shell>
  );
}

export default function DeveloperPortalPage() {
  const [authed, setAuthed] = useState(() => Boolean(getDevToken()));
  const logout = useCallback(() => {
    setDevToken(null);
    setAuthed(false);
  }, []);
  return authed ? <Portal onLogout={logout} /> : <Login onDone={() => setAuthed(true)} />;
}
