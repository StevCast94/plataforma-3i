import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { useAdminGet } from '@/hooks/useAdminAPI';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { adminApi } from '@/lib/adminApi';
import { useToast } from '@/components/shared/Toast';
import { SCENARIOS, STAGE_BASE, stageModel, type Scenario } from '@/lib/mvStudy';
import {
  DEFAULT_PROPUESTA,
  PROPUESTA_KEY,
  PROPUESTA_SECTION,
  resolvePropuesta,
  type PropuestaContent,
  type Row,
} from '@/lib/propuestaContent';

// ============================================================
// /admin/propuesta — editor del contenido de la propuesta Montañita View (F4).
// Guarda un único JSON en SiteContent (propuesta_mv/content). Los detalles
// técnicos (cadena de dominio, uso de suelo, fotos) siguen en el código porque
// son datos registrales que no deberían cambiar sin revisión.
// ============================================================

type RouteKey = 'solar' | 'lobby' | 'total';
const ROUTES: { key: RouteKey; label: string }[] = [
  { key: 'solar', label: 'Ruta A — Comprar un solar' },
  { key: 'lobby', label: 'Ruta B — Socio del Lobby' },
  { key: 'total', label: 'Ruta C — Compra total' },
];

export default function AdminPropuestaPage() {
  const { isSuperadmin } = useAdminAuth();
  const { toast } = useToast();
  const { data: saved, loading, reload } = useAdminGet<Record<string, string>>(`/content?section=${PROPUESTA_SECTION}`);
  const [c, setC] = useState<PropuestaContent | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (loading) return;
    try {
      setC(resolvePropuesta(saved?.[PROPUESTA_KEY] ? JSON.parse(saved[PROPUESTA_KEY]) : undefined));
    } catch {
      setC(resolvePropuesta());
    }
    setDirty(false);
  }, [saved, loading]);

  // Aviso al salir con cambios sin guardar.
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  const preview = useMemo(() => {
    if (!c) return null;
    return Object.fromEntries(
      SCENARIOS.map((s) => {
        const st = STAGE_BASE.map((b) => stageModel(b, s, c.study.scenarios[s], c.study.discount));
        const rev = st.reduce((a, x) => a + x.revenue, 0);
        const cost = st.reduce((a, x) => a + x.cost, 0);
        return [s, { margin: (rev - cost) / rev, npv: st.reduce((a, x) => a + x.npv, 0) }];
      }),
    ) as Record<Scenario, { margin: number; npv: number }>;
  }, [c]);

  if (!isSuperadmin) return <p className="text-brand-gray">Esta sección requiere permisos de superadmin.</p>;
  if (!c) return <p className="text-brand-gray">Cargando…</p>;

  const update = (fn: (d: PropuestaContent) => void) => {
    const next = structuredClone(c);
    fn(next);
    setC(next);
    setDirty(true);
  };

  async function save(value: PropuestaContent | null) {
    setSaving(true);
    try {
      await adminApi.put('/content', {
        section: PROPUESTA_SECTION,
        key: PROPUESTA_KEY,
        value: value ? JSON.stringify(value) : '{}',
      });
      toast(value ? 'Propuesta guardada y publicada' : 'Propuesta restablecida a los valores por defecto', 'success');
      setDirty(false);
      reload();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">Propuesta Montañita View</h1>
          <p className="text-sm text-brand-gray">Los cambios se publican al guardar.</p>
        </div>
        <a href="/propuesta/montanita-view" target="_blank" rel="noreferrer">
          <Button variant="outline">Ver propuesta ↗</Button>
        </a>
      </div>

      <Section title="Portada">
        <Field label="Antetítulo" value={c.heroEyebrow} onChange={(v) => update((d) => (d.heroEyebrow = v))} />
        <Field label="Título" value={c.heroTitle} onChange={(v) => update((d) => (d.heroTitle = v))} />
        <Field label="Subtítulo" multiline value={c.heroSubtitle} onChange={(v) => update((d) => (d.heroSubtitle = v))} />
      </Section>

      {ROUTES.map(({ key, label }) => (
        <Section key={key} title={label}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Etiqueta de la tarjeta (precio)" value={c[key].tag} onChange={(v) => update((d) => (d[key].tag = v))} />
            <Field label="Texto de la tarjeta" multiline value={c[key].card} onChange={(v) => update((d) => (d[key].card = v))} />
          </div>
          <Field label="Resumen" multiline value={c[key].summary} onChange={(v) => update((d) => (d[key].summary = v))} />
          <RowsEditor label="Datos clave" rows={c[key].rows} onChange={(rows) => update((d) => (d[key].rows = rows))} />
          {key === 'total' && (
            <>
              <RowsEditor label="Forma de pago" rows={c.total.paymentRows} onChange={(rows) => update((d) => (d.total.paymentRows = rows))} />
              <Field label="Nota de pago" value={c.total.paymentNote} onChange={(v) => update((d) => (d.total.paymentNote = v))} />
            </>
          )}
        </Section>
      ))}

      <Section title="Estudio de factibilidad 2026 — supuestos">
        <p className="text-xs text-brand-gray">
          Las gráficas, la tabla de sensibilidad y los indicadores de la propuesta se recalculan con estos valores.
          Si cambias un supuesto, actualiza también su fuente en el código o avísale al equipo.
        </p>
        <div className="max-w-xs">
          <NumField
            label="Tasa de descuento anual (%)"
            value={Math.round(c.study.discount * 1000) / 10}
            onChange={(v) => update((d) => (d.study.discount = v / 100))}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-brand-gray">
              <tr>
                <th className="py-2 pr-3 font-medium">Escenario</th>
                <th className="py-2 pr-3 font-medium">Precio venta $/m²</th>
                <th className="py-2 pr-3 font-medium">Costo construcción $/m²</th>
                <th className="py-2 pr-3 font-medium">Ventas por trimestre</th>
                <th className="py-2 pr-3 font-medium">Margen</th>
                <th className="py-2 font-medium">VAN total</th>
              </tr>
            </thead>
            <tbody>
              {SCENARIOS.map((s) => (
                <tr key={s} className="border-t border-black/5">
                  <td className="py-2 pr-3 font-semibold capitalize text-primary">{s}</td>
                  {(['price', 'cost', 'unitsPerQuarter'] as const).map((f) => (
                    <td key={f} className="py-2 pr-3">
                      <input
                        type="number"
                        min={1}
                        value={c.study.scenarios[s][f]}
                        onChange={(e) => update((d) => (d.study.scenarios[s][f] = Number(e.target.value)))}
                        className="w-28 rounded-lg border border-black/15 px-2 py-1.5"
                      />
                    </td>
                  ))}
                  <td className="py-2 pr-3">{preview ? `${(preview[s].margin * 100).toFixed(1)}%` : '—'}</td>
                  <td className={`py-2 ${preview && preview[s].npv < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                    {preview ? `$${(preview[s].npv / 1e6).toFixed(2)}M` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="El destino — estadísticas con fuente">
        {c.destination.map((item, i) => (
          <div key={i} className="grid gap-2 rounded-lg bg-light p-3 sm:grid-cols-[1fr_160px_1fr_auto]">
            <input value={item.text} placeholder="Dato" onChange={(e) => update((d) => (d.destination[i].text = e.target.value))} className="rounded-lg border border-black/15 px-3 py-2 text-sm" />
            <input value={item.source} placeholder="Medio" onChange={(e) => update((d) => (d.destination[i].source = e.target.value))} className="rounded-lg border border-black/15 px-3 py-2 text-sm" />
            <input value={item.url} placeholder="https://…" onChange={(e) => update((d) => (d.destination[i].url = e.target.value))} className="rounded-lg border border-black/15 px-3 py-2 text-sm" />
            <button onClick={() => update((d) => d.destination.splice(i, 1))} className="px-2 text-sm text-red-600">Quitar</button>
          </div>
        ))}
        <Button size="sm" variant="outline" onClick={() => update((d) => d.destination.push({ text: '', source: '', url: '' }))}>+ Agregar dato</Button>
        <p className="text-xs text-brand-gray">Cada dato debe llevar su fuente verificable.</p>
      </Section>

      <Section title="Cierre">
        <Field label="Aviso legal" multiline value={c.disclaimer} onChange={(v) => update((d) => (d.disclaimer = v))} />
        <Field label="WhatsApp para agendar reunión (con código de país, solo números)" value={c.whatsapp} onChange={(v) => update((d) => (d.whatsapp = v.replace(/\D/g, '')))} />
      </Section>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-black/10 bg-white/95 px-4 py-3 backdrop-blur md:pl-60">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-brand-gray">{dirty ? 'Tienes cambios sin guardar.' : 'Todo guardado.'}</p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setConfirmReset(true)} disabled={saving}>Restablecer valores por defecto</Button>
            <Button onClick={() => save(c)} disabled={!dirty || saving}>{saving ? 'Guardando…' : 'Guardar y publicar'}</Button>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmReset}
        title="Restablecer la propuesta"
        message="Se borrarán todos los cambios guardados y la propuesta volverá a los valores por defecto. ¿Continuar?"
        confirmLabel="Restablecer"
        danger
        onConfirm={() => {
          setConfirmReset(false);
          setC(structuredClone(DEFAULT_PROPUESTA));
          void save(null);
        }}
        onClose={() => setConfirmReset(false)}
      />
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <h2 className="font-semibold text-primary">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, value, onChange, multiline }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  const cls = 'w-full rounded-lg border border-black/15 px-3 py-2 text-sm';
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-brand-gray">{label}</span>
      {multiline ? (
        <textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} className={cls} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} className={cls} />
      )}
    </label>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-brand-gray">{label}</span>
      <input type="number" step="0.1" min={0.1} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm" />
    </label>
  );
}

function RowsEditor({ label, rows, onChange }: { label: string; rows: Row[]; onChange: (rows: Row[]) => void }) {
  const set = (i: number, j: 0 | 1, v: string) => onChange(rows.map((r, k) => (k === i ? ((j === 0 ? [v, r[1]] : [r[0], v]) as Row) : r)));
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-brand-gray">{label}</p>
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[220px_1fr_auto]">
            <input value={r[0]} onChange={(e) => set(i, 0, e.target.value)} className="rounded-lg border border-black/15 px-3 py-2 text-sm" placeholder="Etiqueta" />
            <input value={r[1]} onChange={(e) => set(i, 1, e.target.value)} className="rounded-lg border border-black/15 px-3 py-2 text-sm" placeholder="Valor" />
            <div className="flex gap-1">
              <button disabled={i === 0} onClick={() => onChange(rows.map((x, k) => (k === i - 1 ? rows[i] : k === i ? rows[i - 1] : x)))} className="px-1 text-brand-gray disabled:opacity-30" title="Subir">↑</button>
              <button onClick={() => onChange(rows.filter((_, k) => k !== i))} className="px-1 text-sm text-red-600">Quitar</button>
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => onChange([...rows, ['', '']])} className="mt-2 text-sm font-medium text-accent">+ Agregar fila</button>
    </div>
  );
}
