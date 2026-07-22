import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { ICON_KEYS, DEFAULT_BROCHURE_CONTENT, type BrochureContent } from '@/lib/brochureContent';

// ============================================================
// Editor estructurado del Brochure Digital — reemplaza el JSON a mano
// por campos de texto normales, con secciones plegables y listas con
// botones + / ×. Las fotos NO se editan aquí: usan "Imagen de portada"
// y "Galería" del formulario del proyecto (el orden de la galería
// decide qué foto aparece grande en el mosaico, cuál acompaña "Vista
// General" y cuál se usa en el banner emotivo).
// ============================================================

function field<T extends object, K extends keyof T>(
  value: T,
  onChange: (v: T) => void,
  key: K,
) {
  return {
    value: (value[key] as string) ?? '',
    onChange: (v: string) => onChange({ ...value, [key]: v }),
  };
}

function Label({ children }: { children: ReactNode }) {
  return <label className="mb-1 block text-xs font-medium text-brand-gray">{children}</label>;
}

function TextInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
      />
    </div>
  );
}

function TextAreaInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
      />
    </div>
  );
}

function IconSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label>Ícono</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm capitalize"
      >
        {ICON_KEYS.map((k) => (
          <option key={k} value={k}>{k}</option>
        ))}
      </select>
    </div>
  );
}

function Section({ title, hint, children, defaultOpen }: { title: string; hint?: string; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details className="rounded-xl border border-black/10 p-4" open={defaultOpen}>
      <summary className="cursor-pointer text-sm font-semibold text-primary">{title}</summary>
      {hint && <p className="mb-3 mt-1 text-xs text-brand-gray">{hint}</p>}
      <div className="mt-3 space-y-4">{children}</div>
    </details>
  );
}

function RepeatList<T>({
  items,
  onChange,
  makeEmpty,
  render,
  addLabel,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  makeEmpty: () => T;
  render: (item: T, update: (v: T) => void) => ReactNode;
  addLabel: string;
}) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="relative rounded-lg border border-black/10 bg-light/40 p-3 pr-9">
          {render(item, (v) => onChange(items.map((x, j) => (j === i ? v : x))))}
          <button
            type="button"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-xs text-red-600"
            aria-label="Eliminar"
          >
            ×
          </button>
        </div>
      ))}
      <Button size="sm" variant="outline" type="button" onClick={() => onChange([...items, makeEmpty()])}>
        {addLabel}
      </Button>
    </div>
  );
}

interface Props {
  value: BrochureContent;
  onChange: (v: BrochureContent) => void;
}

export function BrochureContentEditor({ value, onChange }: Props) {
  const c = value;
  const set = <K extends keyof BrochureContent>(key: K, v: BrochureContent[K]) => onChange({ ...c, [key]: v });

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" type="button" onClick={() => onChange(DEFAULT_BROCHURE_CONTENT)}>
          Cargar plantilla de ejemplo
        </Button>
      </div>

      <Section title="Portada (hero)" defaultOpen>
        <TextInput label="Texto pequeño sobre el título" {...field(c, onChange, 'eyebrow')} />
        <TextInput label="Frase debajo del nombre del proyecto" {...field(c, onChange, 'heroTagline')} />
        <TextInput label="Línea de ubicación / tipo de propiedad" {...field(c, onChange, 'heroLocation')} />
      </Section>

      <Section title="Pilares de valor (3 tarjetas bajo el hero)" hint="Ej: Tu playa todo el año, Plusvalía real, Patrimonio heredable.">
        <RepeatList
          items={c.pillars ?? []}
          onChange={(v) => set('pillars', v)}
          makeEmpty={() => ({ icon: 'sparkle', title: '', body: '' })}
          addLabel="+ Agregar pilar"
          render={(p, update) => (
            <div className="space-y-2">
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <IconSelect value={p.icon} onChange={(icon) => update({ ...p, icon })} />
                <TextInput label="Título" value={p.title} onChange={(title) => update({ ...p, title })} />
              </div>
              <TextAreaInput label="Descripción" value={p.body} onChange={(body) => update({ ...p, body })} />
            </div>
          )}
        />
      </Section>

      <Section title="Datos clave (tarjetas: ubicación, tipo, inversión...)">
        <RepeatList
          items={c.keyFacts ?? []}
          onChange={(v) => set('keyFacts', v)}
          makeEmpty={() => ({ icon: 'sparkle', label: '', value: '' })}
          addLabel="+ Agregar dato"
          render={(f, update) => (
            <div className="grid grid-cols-[120px_1fr_1fr] gap-2">
              <IconSelect value={f.icon} onChange={(icon) => update({ ...f, icon })} />
              <TextInput label="Etiqueta" value={f.label} onChange={(label) => update({ ...f, label })} />
              <TextInput label="Valor" value={f.value} onChange={(val) => update({ ...f, value: val })} />
            </div>
          )}
        />
      </Section>

      <Section title="Vista General">
        <TextAreaInput label="Texto de introducción" {...field(c, onChange, 'overviewText')} />
        <div>
          <Label>Cifras destacadas (ej. visitantes, ocupación, crecimiento)</Label>
          <RepeatList
            items={c.overviewStats ?? []}
            onChange={(v) => set('overviewStats', v)}
            makeEmpty={() => ({ big: '', small: '' })}
            addLabel="+ Agregar cifra"
            render={(s, update) => (
              <div className="grid grid-cols-2 gap-2">
                <TextInput label="Número" value={s.big} onChange={(big) => update({ ...s, big })} />
                <TextInput label="Descripción" value={s.small} onChange={(small) => update({ ...s, small })} />
              </div>
            )}
          />
        </div>
      </Section>

      <Section title="Ubicación (distancias bajo el mapa)">
        <RepeatList
          items={c.routeStats ?? []}
          onChange={(v) => set('routeStats', v)}
          makeEmpty={() => ({ v: '', l: '' })}
          addLabel="+ Agregar distancia"
          render={(s, update) => (
            <div className="grid grid-cols-2 gap-2">
              <TextInput label="Valor (ej. 2h 30m)" value={s.v} onChange={(v) => update({ ...s, v })} />
              <TextInput label="Descripción (ej. desde Guayaquil)" value={s.l} onChange={(l) => update({ ...s, l })} />
            </div>
          )}
        />
      </Section>

      <Section title="Plan de inversión">
        <div>
          <Label>Modelo de pago</Label>
          <RepeatList
            items={c.paymentPlan ?? []}
            onChange={(v) => set('paymentPlan', v)}
            makeEmpty={() => ({ label: '', value: '' })}
            addLabel="+ Agregar línea"
            render={(p, update) => (
              <div className="grid grid-cols-2 gap-2">
                <TextInput label="Concepto" value={p.label} onChange={(label) => update({ ...p, label })} />
                <TextInput label="Valor" value={p.value} onChange={(val) => update({ ...p, value: val })} />
              </div>
            )}
          />
        </div>

        <div>
          <Label>Proyección de valor (para las tarjetas y el gráfico)</Label>
          <RepeatList
            items={c.valueProjection ?? []}
            onChange={(v) => set('valueProjection', v)}
            makeEmpty={() => ({ year: '', label: '', value: 0, note: '' })}
            addLabel="+ Agregar punto"
            render={(p, update) => (
              <div className="grid grid-cols-2 gap-2">
                <TextInput label="Año (ej. Año 0)" value={p.year} onChange={(year) => update({ ...p, year })} />
                <TextInput label="Etiqueta" value={p.label} onChange={(label) => update({ ...p, label })} />
                <TextInput
                  label="Valor en USD"
                  value={String(p.value)}
                  onChange={(v) => update({ ...p, value: Number(v) || 0 })}
                />
                <TextInput label="Nota" value={p.note} onChange={(note) => update({ ...p, note })} />
              </div>
            )}
          />
        </div>

        <TextInput
          label="Puntos del gráfico de crecimiento (montos separados por coma, ej: 12000, 13200, 14400)"
          value={(c.chart ?? []).join(', ')}
          onChange={(v) => set('chart', v.split(',').map((n) => Number(n.trim())).filter((n) => !isNaN(n)))}
        />

        <div>
          <Label>Renta / ingresos pasivos (3 tarjetas)</Label>
          <RepeatList
            items={c.rentingStats ?? []}
            onChange={(v) => set('rentingStats', v)}
            makeEmpty={() => ({ v: '', l: '' })}
            addLabel="+ Agregar dato"
            render={(s, update) => (
              <div className="grid grid-cols-2 gap-2">
                <TextInput label="Valor" value={s.v} onChange={(v) => update({ ...s, v })} />
                <TextInput label="Descripción" value={s.l} onChange={(l) => update({ ...s, l })} />
              </div>
            )}
          />
        </div>
      </Section>

      <Section title="Amenidades (chips con ícono)">
        <RepeatList
          items={c.amenities ?? []}
          onChange={(v) => set('amenities', v)}
          makeEmpty={() => ''}
          addLabel="+ Agregar amenidad"
          render={(a, update) => (
            <input
              value={a}
              onChange={(e) => update(e.target.value)}
              placeholder="Ej: Piscina"
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
            />
          )}
        />
      </Section>

      <Section title="¿Por qué invertir?">
        <RepeatList
          items={c.whyInvest ?? []}
          onChange={(v) => set('whyInvest', v)}
          makeEmpty={() => ({ icon: 'sparkle', title: '', body: '' })}
          addLabel="+ Agregar razón"
          render={(w, update) => (
            <div className="space-y-2">
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <IconSelect value={w.icon} onChange={(icon) => update({ ...w, icon })} />
                <TextInput label="Título" value={w.title} onChange={(title) => update({ ...w, title })} />
              </div>
              <TextAreaInput label="Descripción" value={w.body} onChange={(body) => update({ ...w, body })} />
            </div>
          )}
        />

        <div>
          <Label>Seguros / garantías</Label>
          <RepeatList
            items={c.insurances ?? []}
            onChange={(v) => set('insurances', v)}
            makeEmpty={() => ({ label: '', value: '' })}
            addLabel="+ Agregar seguro"
            render={(s, update) => (
              <div className="grid grid-cols-2 gap-2">
                <TextInput label="Nombre" value={s.label} onChange={(label) => update({ ...s, label })} />
                <TextInput label="Monto" value={s.value} onChange={(val) => update({ ...s, value: val })} />
              </div>
            )}
          />
        </div>
      </Section>

      <Section title="Banner emotivo (foto grande antes de testimonios)">
        <TextInput label="Texto pequeño" {...field(c, onChange, 'bannerEyebrow')} />
        <TextInput label="Título" {...field(c, onChange, 'bannerTitle')} />
        <TextAreaInput label="Texto" {...field(c, onChange, 'bannerBody')} />
      </Section>

      <Section title="Testimonios">
        <RepeatList
          items={c.testimonials ?? []}
          onChange={(v) => set('testimonials', v)}
          makeEmpty={() => ({ name: '', role: '', text: '' })}
          addLabel="+ Agregar testimonio"
          render={(t, update) => (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <TextInput label="Nombre" value={t.name} onChange={(name) => update({ ...t, name })} />
                <TextInput label="Rol" value={t.role} onChange={(role) => update({ ...t, role })} />
              </div>
              <TextAreaInput label="Testimonio" value={t.text} onChange={(text) => update({ ...t, text })} />
            </div>
          )}
        />
      </Section>

      <Section title="Cierre (CTA final)">
        <TextInput label="Subtítulo bajo '¿Listo para invertir?'" {...field(c, onChange, 'ctaSubtitle')} />
        <div>
          <Label>Cifras finales (3 columnas)</Label>
          <RepeatList
            items={c.ctaStats ?? []}
            onChange={(v) => set('ctaStats', v)}
            makeEmpty={() => ({ v: '', l: '' })}
            addLabel="+ Agregar cifra"
            render={(s, update) => (
              <div className="grid grid-cols-2 gap-2">
                <TextInput label="Valor" value={s.v} onChange={(v) => update({ ...s, v })} />
                <TextInput label="Descripción" value={s.l} onChange={(l) => update({ ...s, l })} />
              </div>
            )}
          />
        </div>
        <TextInput label="URL del PDF descargable (vacío = ocultar botón)" {...field(c, onChange, 'pdfUrl')} />
        <TextInput label="Línea de contacto (correo / teléfono / web)" {...field(c, onChange, 'contactLine')} />
      </Section>
    </div>
  );
}
