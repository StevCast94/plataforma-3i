import { useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import { useAdminGet } from '@/hooks/useAdminAPI';
import { useToast } from '@/components/shared/Toast';
import { CloudinaryUpload } from '@/components/admin/CloudinaryUpload';
import { bosquePath, CATEGORY_LABEL, money, type SpeciesCategory } from '@/lib/bosque';

interface Summary {
  pending: number;
  confirmedTrees: number;
  revenue: number;
  trees: number;
  adopted: number;
  planted: number;
  toAssign: number;
}
interface Species {
  id: string;
  name: string;
  scientificName: string | null;
  category: SpeciesCategory;
  description: string;
  price: number;
  image: string | null;
  active: boolean;
  sortOrder: number;
  _count: { trees: number };
}
interface Adoption {
  id: string;
  code: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  quantity: number;
  amount: number;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  dedication: string | null;
  referralCode: string | null;
  source: string;
  lotCode: string | null;
  subscription: boolean;
  createdAt: string;
  species: { name: string } | null;
  trees: { code: string }[];
}
interface Tree {
  id: string;
  code: string;
  status: string;
  lat: number | null;
  lng: number | null;
  zone: string | null;
  plantedAt: string | null;
  photos: string[];
  species: { name: string };
  adoption: { code: string; customerName: string; dedication: string | null } | null;
}
interface Update {
  id: string;
  title: string;
  body: string;
  photos: string[];
  createdAt: string;
  tree: { code: string } | null;
}

const TABS = ['Adopciones', 'Árboles', 'Especies', 'Novedades', 'Gastos'] as const;
type Tab = (typeof TABS)[number];

const input = 'w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm';
const btn = 'rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50';
const btnGhost = 'rounded-lg border border-black/15 px-3 py-1.5 text-xs font-semibold hover:bg-light';

const STATUS_LABEL = { pending: 'Pendiente de pago', confirmed: 'Confirmada', cancelled: 'Cancelada' };
const STATUS_CLASS = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-gray-100 text-gray-500',
};
const SOURCE_LABEL: Record<string, string> = { web: 'Web', solar: 'Solar MV', cortesia: 'Manual' };

export default function AdminBosquePage() {
  const [tab, setTab] = useState<Tab>('Adopciones');
  const summary = useAdminGet<Summary>('/admin/bosque/summary');
  const s = summary.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">Bosque · Adopta un árbol</h1>
          <p className="text-sm text-brand-gray">Adopciones, plano de siembra, especies y novedades para los padrinos.</p>
        </div>
        <a href={bosquePath()} target="_blank" rel="noreferrer" className={btnGhost}>
          Ver la página pública ↗
        </a>
      </div>

      {s && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            ['Por confirmar pago', s.pending],
            ['Árboles adoptados', s.confirmedTrees],
            ['Recaudado', money(s.revenue)],
            ['Árboles registrados', s.trees],
            ['Sembrados', s.planted],
            ['Adoptados sin árbol asignado', s.toAssign],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-xs text-brand-gray">{label}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-primary">{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-b border-black/10">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold ${tab === t ? 'border-primary text-primary' : 'border-transparent text-brand-gray hover:text-primary'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Adopciones' && <AdoptionsTab onChange={summary.reload} />}
      {tab === 'Árboles' && <TreesTab onChange={summary.reload} />}
      {tab === 'Especies' && <SpeciesTab />}
      {tab === 'Novedades' && <UpdatesTab />}
      {tab === 'Gastos' && <ExpensesTab />}
    </div>
  );
}

// ------------------------------------------------------------------ Adopciones
function AdoptionsTab({ onChange }: { onChange: () => void }) {
  const { toast } = useToast();
  const [filter, setFilter] = useState('');
  const list = useAdminGet<Adoption[]>(`/admin/bosque/adoptions${filter ? `?status=${filter}` : ''}`);
  const species = useAdminGet<Species[]>('/admin/bosque/species');
  const [showNew, setShowNew] = useState(false);

  async function setStatus(a: Adoption, status: Adoption['status']) {
    try {
      await adminApi.put(`/admin/bosque/adoptions/${a.id}`, { status });
      toast(status === 'confirmed' ? `Pago confirmado: ${a.code}` : `Adopción ${a.code} cancelada`, 'success');
      list.reload();
      onChange();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select id="adopt-filter" value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm">
          <option value="">Todas</option>
          <option value="pending">Pendientes de pago</option>
          <option value="confirmed">Confirmadas</option>
          <option value="cancelled">Canceladas</option>
        </select>
        <button className={btn} onClick={() => setShowNew((v) => !v)}>
          {showNew ? 'Cerrar' : 'Registrar adopción manual'}
        </button>
      </div>

      {showNew && species.data && (
        <NewAdoptionForm
          species={species.data}
          onDone={() => {
            setShowNew(false);
            list.reload();
            onChange();
          }}
        />
      )}

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-light text-left text-xs uppercase tracking-wide text-brand-gray">
            <tr>
              <th className="px-3 py-2">Código</th>
              <th className="px-3 py-2">Padrino</th>
              <th className="px-3 py-2">Especie</th>
              <th className="px-3 py-2 text-right">Cant.</th>
              <th className="px-3 py-2 text-right">Monto</th>
              <th className="px-3 py-2">Origen</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2">Árboles</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {(list.data ?? []).map((a) => (
              <tr key={a.id} className="border-t border-black/5 align-top">
                <td className="px-3 py-2 font-mono text-xs">
                  <a href={bosquePath(`/certificado/${a.code}`)} target="_blank" rel="noreferrer" className="underline">
                    {a.code}
                  </a>
                  <p className="mt-0.5 font-sans text-[11px] text-brand-gray">{new Date(a.createdAt).toLocaleDateString('es-EC')}</p>
                </td>
                <td className="px-3 py-2">
                  <p className="font-medium">{a.customerName}</p>
                  {a.dedication && <p className="text-xs text-brand-gray">Dedicado a: {a.dedication}</p>}
                  {a.customerPhone && <p className="text-xs text-brand-gray">{a.customerPhone}</p>}
                  {a.customerEmail && <p className="text-xs text-brand-gray">{a.customerEmail}</p>}
                  {a.subscription && <p className="text-xs font-semibold text-emerald-700">Quiere ser padrino activo</p>}
                  {a.referralCode && <p className="text-xs text-brand-gray">Referido por {a.referralCode}</p>}
                </td>
                <td className="px-3 py-2">{a.species?.name ?? 'Por definir'}</td>
                <td className="px-3 py-2 text-right tabular-nums">{a.quantity}</td>
                <td className="px-3 py-2 text-right tabular-nums">{money(a.amount)}</td>
                <td className="px-3 py-2 text-xs">
                  {SOURCE_LABEL[a.source] ?? a.source}
                  {a.lotCode ? ` · ${a.lotCode}` : ''}
                </td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_CLASS[a.status]}`}>{STATUS_LABEL[a.status]}</span>
                </td>
                <td className="px-3 py-2 font-mono text-xs">
                  {a.trees.length ? a.trees.map((t) => t.code).join(', ') : a.status === 'confirmed' ? 'Por asignar' : ''}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right">
                  {a.status === 'pending' && (
                    <button className={btnGhost} onClick={() => setStatus(a, 'confirmed')}>
                      Confirmar pago
                    </button>
                  )}
                  {a.status !== 'cancelled' && (
                    <button className={`${btnGhost} ml-2 text-red-700`} onClick={() => setStatus(a, 'cancelled')}>
                      Cancelar
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {list.data?.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-10 text-center text-brand-gray">
                  Todavía no hay adopciones con este filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NewAdoptionForm({ species, onDone }: { species: Species[]; onDone: () => void }) {
  const { toast } = useToast();
  const [f, setF] = useState({ customerName: '', customerPhone: '', dedication: '', speciesId: species[0]?.id ?? '', quantity: 1, amount: '', status: 'confirmed' });
  const set = (k: string, v: string | number) => setF((p) => ({ ...p, [k]: v }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      await adminApi.post('/admin/bosque/adoptions', { ...f, amount: f.amount === '' ? undefined : Number(f.amount) });
      toast('Adopción registrada', 'success');
      onDone();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }

  return (
    <form onSubmit={save} className="grid gap-3 rounded-xl bg-white p-4 shadow-sm sm:grid-cols-3">
      <input id="na-name" required placeholder="Nombre del padrino" value={f.customerName} onChange={(e) => set('customerName', e.target.value)} className={input} />
      <input id="na-phone" placeholder="WhatsApp" value={f.customerPhone} onChange={(e) => set('customerPhone', e.target.value)} className={input} />
      <input id="na-ded" placeholder="Dedicatoria (opcional)" value={f.dedication} onChange={(e) => set('dedication', e.target.value)} className={input} />
      <select id="na-sp" value={f.speciesId} onChange={(e) => set('speciesId', e.target.value)} className={input}>
        {species.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} · {money(s.price)}
          </option>
        ))}
      </select>
      <input id="na-qty" type="number" min={1} value={f.quantity} onChange={(e) => set('quantity', Number(e.target.value))} className={input} />
      <input id="na-amount" type="number" min={0} step="0.01" placeholder="Monto (vacío = precio de lista)" value={f.amount} onChange={(e) => set('amount', e.target.value)} className={input} />
      <select id="na-status" value={f.status} onChange={(e) => set('status', e.target.value)} className={input}>
        <option value="confirmed">Pagada / cortesía</option>
        <option value="pending">Pendiente de pago</option>
      </select>
      <div className="sm:col-span-2">
        <button className={btn}>Guardar</button>
      </div>
    </form>
  );
}

// ------------------------------------------------------------------ Árboles
function TreesTab({ onChange }: { onChange: () => void }) {
  const { toast } = useToast();
  const list = useAdminGet<Tree[]>('/admin/bosque/trees');
  const [csv, setCsv] = useState('');
  const [importing, setImporting] = useState(false);
  const [edit, setEdit] = useState<Tree | null>(null);

  async function doImport() {
    const rows = csv
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => l.split(/[;,\t]/).map((c) => c.trim()))
      .filter((c) => !/^especie$/i.test(c[0]))
      .map(([species, lat, lng, zone]) => ({ species, lat, lng, zone }));
    if (rows.length === 0) return;
    setImporting(true);
    try {
      const r = await adminApi.post<{ created: number; assigned: number }>('/admin/bosque/trees/import', { rows });
      toast(`${r.created} árboles creados · ${r.assigned} asignados a padrinos`, 'success');
      setCsv('');
      list.reload();
      onChange();
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-primary">Cargar árboles del plano de siembra</h2>
        <p className="mt-1 text-sm text-brand-gray">
          Una línea por árbol: <code>especie, latitud, longitud, zona</code>. La zona es opcional. Puedes pegar desde Excel o
          desde el plano de GEO 3i. Se crean con códigos correlativos (BM-0001…) y se asignan solos a las adopciones que
          esperan árbol.
        </p>
        <textarea
          id="tree-csv"
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          rows={5}
          placeholder={'Guayacán, -1.85120, -80.73950, Ladera norte\nMango, -1.85131, -80.73942, Zona media'}
          className={`${input} mt-3 font-mono`}
        />
        <button className={`${btn} mt-3`} disabled={importing || !csv.trim()} onClick={doImport}>
          {importing ? 'Cargando…' : 'Cargar árboles'}
        </button>
      </div>

      {edit && (
        <TreeEditor
          tree={edit}
          onClose={() => setEdit(null)}
          onSaved={() => {
            setEdit(null);
            list.reload();
            onChange();
          }}
        />
      )}

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-light text-left text-xs uppercase tracking-wide text-brand-gray">
            <tr>
              <th className="px-3 py-2">Código</th>
              <th className="px-3 py-2">Especie</th>
              <th className="px-3 py-2">Padrino</th>
              <th className="px-3 py-2">Sembrado</th>
              <th className="px-3 py-2">Zona</th>
              <th className="px-3 py-2">Fotos</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {(list.data ?? []).map((t) => (
              <tr key={t.id} className="border-t border-black/5">
                <td className="px-3 py-2 font-mono text-xs">
                  <a href={bosquePath(`/arbol/${t.code}`)} target="_blank" rel="noreferrer" className="underline">
                    {t.code}
                  </a>
                </td>
                <td className="px-3 py-2">{t.species.name}</td>
                <td className="px-3 py-2">{t.adoption ? t.adoption.dedication || t.adoption.customerName : <span className="text-brand-gray">Disponible</span>}</td>
                <td className="px-3 py-2">{t.plantedAt ? new Date(t.plantedAt).toLocaleDateString('es-EC') : '—'}</td>
                <td className="px-3 py-2">{t.zone ?? '—'}</td>
                <td className="px-3 py-2 tabular-nums">{t.photos.length}</td>
                <td className="px-3 py-2 text-right">
                  <button className={btnGhost} onClick={() => setEdit(t)}>
                    Editar
                  </button>
                </td>
              </tr>
            ))}
            {list.data?.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-brand-gray">
                  Aún no hay árboles registrados. Cárgalos desde el plano de siembra cuando empiece la siembra.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TreeEditor({ tree, onClose, onSaved }: { tree: Tree; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [plantedAt, setPlantedAt] = useState(tree.plantedAt ? tree.plantedAt.slice(0, 10) : '');
  const [zone, setZone] = useState(tree.zone ?? '');
  const [photos, setPhotos] = useState<string[]>(tree.photos);
  const [lost, setLost] = useState(tree.status === 'LOST');

  async function save() {
    try {
      await adminApi.put(`/admin/bosque/trees/${tree.id}`, { plantedAt: plantedAt || null, zone, photos, lost });
      toast(`${tree.code} actualizado`, 'success');
      onSaved();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-2 ring-primary/20">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-primary">
          {tree.code} · {tree.species.name}
        </h2>
        <button className={btnGhost} onClick={onClose}>
          Cerrar
        </button>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          Fecha de siembra
          <input id="te-date" type="date" value={plantedAt} onChange={(e) => setPlantedAt(e.target.value)} className={`${input} mt-1`} />
        </label>
        <label className="text-sm">
          Zona
          <input id="te-zone" value={zone} onChange={(e) => setZone(e.target.value)} className={`${input} mt-1`} />
        </label>
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm">
        <input id="te-lost" type="checkbox" checked={lost} onChange={(e) => setLost(e.target.checked)} />
        El árbol no prosperó (cuenta en la supervivencia pública; hay que reponerlo)
      </label>
      <p className="mt-4 text-sm font-medium">Fotos del árbol (la primera es la portada)</p>
      <div className="mt-2">
        <CloudinaryUpload value={photos} onChange={setPhotos} />
      </div>
      <button className={`${btn} mt-4`} onClick={save}>
        Guardar
      </button>
    </div>
  );
}

// ------------------------------------------------------------------ Especies
function SpeciesTab() {
  const { toast } = useToast();
  const list = useAdminGet<Species[]>('/admin/bosque/species');
  const [edit, setEdit] = useState<Partial<Species> | null>(null);

  async function save() {
    if (!edit) return;
    try {
      if (edit.id) await adminApi.put(`/admin/bosque/species/${edit.id}`, edit);
      else await adminApi.post('/admin/bosque/species', edit);
      toast('Especie guardada', 'success');
      setEdit(null);
      list.reload();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  return (
    <div className="space-y-4">
      <button className={btn} onClick={() => setEdit({ category: 'NATIVE', price: 30, active: true, description: '', sortOrder: 99 })}>
        Nueva especie
      </button>

      {edit && (
        <div className="grid gap-3 rounded-xl bg-white p-4 shadow-sm ring-2 ring-primary/20 sm:grid-cols-2">
          <input id="sp-name" placeholder="Nombre común" value={edit.name ?? ''} onChange={(e) => setEdit({ ...edit, name: e.target.value })} className={input} />
          <input id="sp-sci" placeholder="Nombre científico" value={edit.scientificName ?? ''} onChange={(e) => setEdit({ ...edit, scientificName: e.target.value })} className={input} />
          <select id="sp-cat" value={edit.category} onChange={(e) => setEdit({ ...edit, category: e.target.value as SpeciesCategory })} className={input}>
            {(Object.keys(CATEGORY_LABEL) as SpeciesCategory[]).map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
          <div className="flex gap-3">
            <label className="flex-1 text-sm">
              Precio (USD)
              <input id="sp-price" type="number" min={0} step="0.01" value={edit.price ?? 0} onChange={(e) => setEdit({ ...edit, price: Number(e.target.value) })} className={`${input} mt-1`} />
            </label>
            <label className="w-24 text-sm">
              Orden
              <input id="sp-order" type="number" value={edit.sortOrder ?? 0} onChange={(e) => setEdit({ ...edit, sortOrder: Number(e.target.value) })} className={`${input} mt-1`} />
            </label>
          </div>
          <textarea id="sp-desc" rows={3} placeholder="Descripción para la página pública" value={edit.description ?? ''} onChange={(e) => setEdit({ ...edit, description: e.target.value })} className={`${input} sm:col-span-2`} />
          <div className="sm:col-span-2">
            <p className="mb-1 text-sm font-medium">Foto de la especie</p>
            <CloudinaryUpload single value={edit.image ? [edit.image] : []} onChange={(v) => setEdit({ ...edit, image: v[0] ?? null })} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input id="sp-active" type="checkbox" checked={edit.active ?? true} onChange={(e) => setEdit({ ...edit, active: e.target.checked })} />
            Visible en la página pública
          </label>
          <div className="flex gap-2 sm:justify-end">
            <button className={btnGhost} onClick={() => setEdit(null)}>
              Cancelar
            </button>
            <button className={btn} onClick={save}>
              Guardar
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-light text-left text-xs uppercase tracking-wide text-brand-gray">
            <tr>
              <th className="px-3 py-2">Especie</th>
              <th className="px-3 py-2">Tipo</th>
              <th className="px-3 py-2 text-right">Precio</th>
              <th className="px-3 py-2 text-right">Árboles</th>
              <th className="px-3 py-2">Visible</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {(list.data ?? []).map((s) => (
              <tr key={s.id} className="border-t border-black/5">
                <td className="px-3 py-2">
                  <p className="font-medium">{s.name}</p>
                  {s.scientificName && <p className="text-xs italic text-brand-gray">{s.scientificName}</p>}
                </td>
                <td className="px-3 py-2">{CATEGORY_LABEL[s.category]}</td>
                <td className="px-3 py-2 text-right tabular-nums">{money(s.price)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{s._count.trees}</td>
                <td className="px-3 py-2">{s.active ? 'Sí' : 'No'}</td>
                <td className="px-3 py-2 text-right">
                  <button className={btnGhost} onClick={() => setEdit(s)}>
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Novedades
function UpdatesTab() {
  const { toast } = useToast();
  const list = useAdminGet<Update[]>('/admin/bosque/updates');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [treeCode, setTreeCode] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  async function publish(e: React.FormEvent) {
    e.preventDefault();
    try {
      await adminApi.post('/admin/bosque/updates', { title, body, treeCode: treeCode || null, photos });
      toast('Novedad publicada', 'success');
      setTitle('');
      setBody('');
      setTreeCode('');
      setPhotos([]);
      list.reload();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }

  async function remove(u: Update) {
    try {
      await adminApi.del(`/admin/bosque/updates/${u.id}`);
      list.reload();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={publish} className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-primary">Publicar novedad</h2>
        <p className="text-sm text-brand-gray">
          Sin código de árbol, la novedad aparece en la portada y en la página de todos los árboles. Con código, solo en la
          página de ese árbol.
        </p>
        <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
          <input id="up-title" required placeholder="Título (ej. Floración de los guayacanes)" value={title} onChange={(e) => setTitle(e.target.value)} className={input} />
          <input id="up-tree" placeholder="Código de árbol (opcional)" value={treeCode} onChange={(e) => setTreeCode(e.target.value)} className={input} />
        </div>
        <textarea id="up-body" required rows={4} placeholder="Qué pasó en el bosque" value={body} onChange={(e) => setBody(e.target.value)} className={input} />
        <CloudinaryUpload value={photos} onChange={setPhotos} />
        <button className={btn}>Publicar</button>
      </form>

      <div className="space-y-3">
        {(list.data ?? []).map((u) => (
          <div key={u.id} className="flex items-start justify-between gap-4 rounded-xl bg-white p-4 shadow-sm">
            <div className="min-w-0">
              <p className="text-xs text-brand-gray">
                {new Date(u.createdAt).toLocaleDateString('es-EC')} · {u.tree ? u.tree.code : 'Todo el bosque'}
              </p>
              <p className="font-semibold">{u.title}</p>
              <p className="mt-1 whitespace-pre-line text-sm text-brand-gray">{u.body}</p>
            </div>
            <button className={`${btnGhost} text-red-700`} onClick={() => remove(u)}>
              Borrar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Gastos
interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  receiptUrl: string | null;
}

const EXPENSE_CATS: [string, string][] = [
  ['VIVERO', 'Vivero y plántulas'],
  ['SIEMBRA', 'Siembra'],
  ['RIEGO', 'Riego y agua'],
  ['MANO_OBRA', 'Mano de obra'],
  ['HERRAMIENTAS', 'Herramientas e insumos'],
  ['OTROS', 'Otros'],
];

function ExpensesTab() {
  const { toast } = useToast();
  const list = useAdminGet<Expense[]>('/admin/bosque/expenses');
  const today = new Date().toISOString().slice(0, 10);
  const [f, setF] = useState({ date: today, category: 'VIVERO', description: '', amount: '' });
  const [receipt, setReceipt] = useState<string[]>([]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      await adminApi.post('/admin/bosque/expenses', { ...f, amount: Number(f.amount), receiptUrl: receipt[0] ?? null });
      toast('Gasto registrado: ya aparece en Cuentas claras', 'success');
      setF({ ...f, description: '', amount: '' });
      setReceipt([]);
      list.reload();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }

  async function remove(x: Expense) {
    try {
      await adminApi.del(`/admin/bosque/expenses/${x.id}`);
      list.reload();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }

  const total = (list.data ?? []).reduce((n, x) => n + x.amount, 0);

  return (
    <div className="space-y-5">
      <form onSubmit={save} className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-primary">Registrar gasto</h2>
        <p className="text-sm text-brand-gray">
          Todo lo que registres aquí se publica en la página Cuentas claras. Adjunta la foto de la factura o el recibo cuando
          puedas.
        </p>
        <div className="grid gap-3 sm:grid-cols-4">
          <input id="ex-date" type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} className={input} />
          <select id="ex-cat" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} className={input}>
            {EXPENSE_CATS.map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
          <input id="ex-desc" required placeholder="Detalle (ej. 200 fundas para vivero)" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className={input} />
          <input id="ex-amount" required type="number" min={0.01} step="0.01" placeholder="Monto USD" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} className={input} />
        </div>
        <CloudinaryUpload single value={receipt} onChange={setReceipt} />
        <button className={btn}>Registrar</button>
      </form>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-light text-left text-xs uppercase tracking-wide text-brand-gray">
            <tr>
              <th className="px-3 py-2">Fecha</th>
              <th className="px-3 py-2">Rubro</th>
              <th className="px-3 py-2">Detalle</th>
              <th className="px-3 py-2 text-right">Monto</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {(list.data ?? []).map((x) => (
              <tr key={x.id} className="border-t border-black/5">
                <td className="px-3 py-2">{new Date(x.date).toLocaleDateString('es-EC', { timeZone: 'UTC' })}</td>
                <td className="px-3 py-2">{EXPENSE_CATS.find(([k]) => k === x.category)?.[1] ?? x.category}</td>
                <td className="px-3 py-2">
                  {x.description}
                  {x.receiptUrl && (
                    <a href={x.receiptUrl} target="_blank" rel="noreferrer" className="ml-2 text-xs underline">
                      comprobante
                    </a>
                  )}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{money(x.amount)}</td>
                <td className="px-3 py-2 text-right">
                  <button className={`${btnGhost} text-red-700`} onClick={() => remove(x)}>
                    Borrar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-black/10 font-semibold">
              <td className="px-3 py-2" colSpan={3}>
                Total invertido
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{money(total)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
