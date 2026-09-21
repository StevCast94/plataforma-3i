import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Building2, Landmark, ChevronRight, Printer, Lock } from 'lucide-react';
import { Seo } from '@/components/shared/Seo';
import { MvStudy } from '@/components/shared/MvStudy';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/shared/Toast';
import { useSectionContent } from '@/hooks/useSiteContent';
import { PROPUESTA_KEY, PROPUESTA_SECTION, resolvePropuesta, type PropuestaContent } from '@/lib/propuestaContent';
import { WhatsAppCTA, useWhatsAppHref } from '@/components/shared/WhatsAppCTA';
import { PhoneField } from '@/components/shared/PhoneField';
import { useLang } from '@/hooks/useLang';

// ============================================================
// PROPUESTA EXCLUSIVA — Montañita View (privada: noindex, sin enlace en el
// menú y con registro previo que entra como lead).
//
// Tres rutas, cada una con un resumen persuasivo y enlaces "Ver detalle
// técnico" al dossier completo de la misma página:
//   A. Comprar un solar (Lotización, DIWILDI S.A.)
//   B. Montañita View Lobby (predio de 36,348 m², propiedad de Didier Triana)
//   C. Ambos proyectos en una sola operación
//
// Todas las cifras están conciliadas (ver conversación del 19-sep-2026):
// áreas de GEO 3i, $100/m², estadísticas con fuente citada. NUNCA se
// publica aquí: la contraoferta de negociación del Lobby, datos personales
// de compradores/accionistas, deudas prediales, ni el caso de sobreposición.
// ============================================================

const UNLOCK_KEY = 'g3i_propuesta_mv';

const LOT_BLOCKS = [
  { mz: 'A', n: 15, m2: 16320.55 },
  { mz: 'B', n: 8, m2: 10714.3 },
  { mz: 'C', n: 11, m2: 19298.49 },
  { mz: 'D', n: 4, m2: 4063.7 },
  { mz: 'E', n: 10, m2: 11157.33 },
  { mz: 'F', n: 7, m2: 9808.97 },
  { mz: 'G', n: 9, m2: 13461.21 },
  { mz: 'H', n: 16, m2: 25154.24 },
  { mz: 'I', n: 9, m2: 12325.19 },
];
const LOTS_M2 = 122303.98;
const LOBBY_M2 = 36348;
const TOTAL_M2 = LOTS_M2 + LOBBY_M2;

const LAND_USE = [
  { uso: 'Residencial (solares)', m2: 141583, pct: 54.81 },
  { uso: 'Vías', m2: 51883, pct: 20.1 },
  { uso: 'Áreas verdes', m2: 44569.57, pct: 17.25 },
  { uso: 'Equipamiento urbano', m2: 13398.06, pct: 5.18 },
  { uso: 'Área de afectación', m2: 6865.55, pct: 2.66 },
];

// Etapas de apartamentos (unidades del plan maestro) y sus renders. Las cifras
// financieras salen del estudio 2026 (lib/mvStudy.ts), no del informe original.
const STAGE_MEDIA = [
  { name: 'Arrecife', units: 18, render: 'render-arrecife' },
  { name: 'Coral', units: 39, render: 'render-coral' },
  { name: 'Manglar', units: 24, render: 'render-manglar' },
];

const IMG = '/images/propuesta-mv';

const m2 = (n: number) => `${n.toLocaleString('en-US', { maximumFractionDigits: 2 })} m²`;

export default function PropuestaMontanitaPage() {
  const { t } = useLang();
  const [unlocked, setUnlocked] = useState(() => {
    try {
      return !!localStorage.getItem(UNLOCK_KEY);
    } catch {
      return false;
    }
  });

  // Contenido editable desde /admin/propuesta (F4); sin datos guardados usa los valores por defecto.
  const { data: saved } = useSectionContent(PROPUESTA_SECTION);
  const { data: contact } = useSectionContent('contact');
  const c = useMemo(() => {
    try {
      return resolvePropuesta(saved?.[PROPUESTA_KEY] ? JSON.parse(saved[PROPUESTA_KEY]) : undefined);
    } catch {
      return resolvePropuesta();
    }
  }, [saved]);

  // Reunión por WhatsApp, con el contexto de la propuesta ya escrito.
  const meetHref = useWhatsAppHref(
    t('Hola, vi la propuesta de Montañita View y quiero *agendar una reunión* con un asesor.'),
  );

  // Al imprimir (botón o Ctrl+P) se despliegan todos los detalles técnicos y
  // al terminar se restaura lo que el usuario tenía abierto.
  useEffect(() => {
    let prev: boolean[] = [];
    const before = () => {
      const all = [...document.querySelectorAll('.print-doc details')] as HTMLDetailsElement[];
      prev = all.map((d) => d.open);
      all.forEach((d) => (d.open = true));
      document.querySelectorAll<HTMLImageElement>('.print-doc img').forEach((i) => (i.loading = 'eager'));
    };
    const after = () => {
      const all = [...document.querySelectorAll('.print-doc details')] as HTMLDetailsElement[];
      all.forEach((d, i) => (d.open = prev[i] ?? false));
    };
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => {
      window.removeEventListener('beforeprint', before);
      window.removeEventListener('afterprint', after);
    };
  }, []);

  // "Guardar como PDF": despliega todo y espera a que carguen TODAS las fotos
  // (las de los bloques cerrados son diferidas) antes de abrir la impresión.
  async function printPdf() {
    document.querySelectorAll<HTMLDetailsElement>('.print-doc details').forEach((d) => (d.open = true));
    const imgs = [...document.querySelectorAll<HTMLImageElement>('.print-doc img')];
    imgs.forEach((i) => (i.loading = 'eager'));
    await Promise.all(
      imgs.map((i) =>
        i.complete && i.naturalWidth > 0
          ? Promise.resolve()
          : new Promise<void>((r) => {
              i.addEventListener('load', () => r(), { once: true });
              i.addEventListener('error', () => r(), { once: true });
              setTimeout(r, 8000);
            }),
      ),
    );
    await Promise.all(imgs.map((i) => i.decode?.().catch(() => {})));
    window.print();
  }

  return (
    <div className="print-doc bg-light">
      <Seo
        title={t('Propuesta exclusiva — Montañita View')}
        description={t('Montañita View en venta: la lotización completa, el Lobby completo o ambos proyectos juntos.')}
        noindex
      />

      {/* Portada, confidencialidad, índice y resumen ejecutivo: solo en el PDF. */}
      <PrintCover />
      <PrintFrontMatter c={c} />

      {/* HERO */}
      <header className="relative isolate overflow-hidden bg-primary text-white print:hidden">
        <img src={`${IMG}/portada.jpg`} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover object-center opacity-70" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/80 via-black/45 to-black/5" />
        <div className="mx-auto max-w-5xl px-4 py-24 sm:px-6 sm:py-32">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-secondary">{t(c.heroEyebrow)}</p>
          <h1 className="mt-3 font-serif text-4xl font-bold sm:text-5xl">{t(c.heroTitle)}</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/80">{t(c.heroSubtitle)}</p>
          <div className="mt-6 flex flex-wrap gap-6 text-sm">
            <Stat v="89" l={t('solares disponibles')} />
            <Stat v={m2(TOTAL_M2)} l={t('en oferta')} />
            <Stat v="2018" l={t('lotización inscrita')} />
          </div>
        </div>
      </header>

      {!unlocked ? (
        <Gate onUnlock={() => setUnlocked(true)} />
      ) : (
        <main className="mx-auto max-w-5xl space-y-16 px-4 py-14 sm:px-6">
          {/* LAS TRES RUTAS */}
          <section>
            <h2 className="mb-6 text-center font-serif text-3xl font-bold text-primary">
              {t('Elige cómo participar')}
            </h2>
            <div className="grid gap-5 md:grid-cols-3">
              <RouteCard
                icon={MapPin}
                tag={c.lotes.tag}
                title="Montañita View Lotes"
                body={c.lotes.card}
                href="#lotes"
              />
              <RouteCard
                icon={Building2}
                tag={c.lobby.tag}
                title="Montañita View Lobby"
                body={c.lobby.card}
                href="#lobby"
              />
              <RouteCard
                icon={Landmark}
                tag={c.total.tag}
                title="Ambos proyectos"
                body={c.total.card}
                href="#total"
              />
            </div>
          </section>

          {/* ===== A. LOTIZACIÓN COMPLETA ===== */}
          <Route id="lotes" eyebrow="Ruta A" title="Montañita View Lotes — la lotización completa">
            <Summary>{t(c.lotes.summary)}</Summary>
            <KV rows={c.lotes.rows} />
            <div className="mt-4 flex flex-wrap items-center gap-3 print:hidden">
              <Link to="/proyectos/montanita-view">
                <Button variant="outline">{t('Ver el mapa de solares')}</Button>
              </Link>
              <WhatsAppCTA
                message={t('Hola, vi la propuesta de Montañita View y me interesa *Montañita View Lotes completo* (Ruta A). Quiero más información.')}
              />
            </div>

            <Detail title={t('Cadena de dominio')}>
              <ol className="list-decimal space-y-2 pl-5">
                <li>
                  <b>2013 —</b>{' '}
                  {t('DIWILDI S.A. compra al GAD Municipal de Santa Elena el macrolote de 26.37 ha en el recinto Río Chico (escritura del 10-oct-2013, inscrita el 01-nov-2013).')}
                </li>
                <li>
                  <b>2014 —</b> {t('Fraccionamiento aprobado por el Concejo Municipal (Lotización "Altos de Manglar"), protocolizado e inscrito en febrero de 2014.')}
                </li>
                <li>
                  <b>2018 —</b> {t('Reestructuración como Lotización Montañita VIEW (Resolución Administrativa 0118052017-GADMSE-A), protocolizada el 18-oct-2018 e inscrita el 14-nov-2018.')}
                </li>
              </ol>
              <p className="mt-3">
                {t('Los solares están fuera de tierras comunales. Cualquier contribución especial de mejoras por obras viales se asigna al vendedor en la escritura, no al comprador.')}
              </p>
              <Source>{t('Registro de la Propiedad del cantón Santa Elena (inscripciones 01-nov-2013 y 14-nov-2018); Resolución Administrativa 0118052017-GADMSE-A.')}</Source>
            </Detail>

            <Detail title={t('Uso de suelo aprobado (258,299 m²)')}>
              <Table
                head={['Uso', 'm²', '%']}
                rows={LAND_USE.map((u) => [u.uso, m2(u.m2), `${u.pct}%`])}
              />
              <p className="mt-3">
                {t('El 17.25% de áreas verdes cumple el Art. 424 del COOTAD, por lo que no hay compensación pendiente por ese concepto.')}
              </p>
              <Source>Cuadro de áreas del plano aprobado de la Lotización Montañita VIEW (GAD Municipal de Santa Elena, 2018); <a className="underline" target="_blank" rel="noreferrer" href="https://www.cpccs.gob.ec/wp-content/uploads/2020/01/cootad.pdf">COOTAD, Art. 424</a>.</Source>
            </Detail>

            <Detail title={t('Inventario disponible por manzana')}>
              <Table
                head={['Manzana', 'Solares', 'Área', 'Valor a $100/m²']}
                rows={[
                  ...LOT_BLOCKS.map((b) => [b.mz, String(b.n), m2(b.m2), formatCurrency(b.m2 * 100)]),
                  ['Total', '89', m2(LOTS_M2), formatCurrency(LOTS_M2 * 100)],
                ]}
              />
              <p className="mt-3">
                {t('Tres manzanas tienen solares asignados a proyectos de negocio dentro del macroproyecto y siguen disponibles para la venta: zona de camping (E3–E5), aqua park (H14–H16) y río lento (G9). Fuera de esta oferta quedan los solares ya destinados: Santorini Condohotel (A-17 y A-18), Ibiza Condohotel (A-19 y A-20) y la planta de tratamiento de aguas residuales (B-9, B-10 y B-11).')}
              </p>
              <Source>{t('Levantamiento topográfico georreferenciado GEO 3i (2026), área individual de cada solar.')}</Source>
            </Detail>
          </Route>

          {/* ===== B. LOBBY ===== */}
          <Route id="lobby" printBreak eyebrow="Ruta B" title="Montañita View Lobby — el proyecto completo">
            <Summary>{t(c.lobby.summary)}</Summary>
            <KV rows={c.lobby.rows} />
            <WhatsAppCTA
              className="mt-4"
              message={t('Hola, vi la propuesta de Montañita View y me interesa *Montañita View Lobby* (Ruta B). Quiero más información.')}
            />
            <Gallery
              items={[
                ['lobby-fachada', 'Lobby, fachada y piscina'],
                ['vista-desde-lobby', 'Vista desde el Lobby hacia Manglaralto y Montañita'],
                ['lobby-sala', 'Sala del Lobby'],
                ['restaurante', 'Restaurante con vista al bosque'],
                ['terraza-vista-mar', 'Terraza con vista al mar'],
                ['lobby-pergola', 'Acceso con pérgola'],
              ]}
            />

            <Detail title={t('Ubicación')}>
              <p>
                {t('Sector alto de la parroquia Manglaralto, sobre la Ruta del Spondylus, a 3 km del centro de Montañita. El entorno combina el filo costero con un interior rural; el bosque protector cubre cerca del 40% del territorio.')}
              </p>
              <Figure src="ubicacion-lobby" caption="Polígono del predio del Lobby (Google Earth, 27-sep-2023)" />
              <p className="mt-3">
                {t('Servicios en el sector: energía y alumbrado público, agua potable, Ruta del Spondylus asfaltada y vía Manglaralto–Dos Mangas. A pocos minutos: Hospital de Manglaralto, gasolinera, reservorios de la Junta de Agua y hosterías de Montañita.')}
              </p>
              <Source>{t('Informe Montañita View, Grupo 3i (págs. 4–5); imagen satelital Google Earth.')}</Source>
            </Detail>

            <Detail title={t('Lo que ya está construido')}>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  <b>{t('Lobby en dos plantas.')}</b> {t('Planta baja: jardín, vestíbulo, área de comidas con dos baños, cocina abierta con bodega, dos piscinas y un jacuzzi. Planta alta: terraza cubierta con dos baños, bar, oficina administrativa y solárium.')}
                </li>
                <li>
                  <b>{t('Eco-hotel:')}</b> {t('seis buses reciclados adaptados como habitaciones, cada uno con terraza y baño completo, cubiertos con caña y policarbonato.')}
                </li>
                <li>
                  <b>{t('Infraestructura:')}</b> {t('garita de acceso, alumbrado privado, red de agua potable, red eléctrica, transformador trifásico de 75 kVA y monofásico de 50 kVA.')}
                </li>
                <li>
                  <b>{t('Construcción:')}</b> {t('estructura mixta de hormigón y caña, cisterna de hormigón armado impermeabilizada, muros de contención en mampostería estructural, piscinas de hormigón armado con lámina de PVC y pisos exteriores de hormigón y adoquín.')}
                </li>
              </ul>
              <Gallery
                items={[
                  ['eco-hotel-buses', 'Eco-hotel: habitaciones en buses reciclados'],
                  ['eco-hotel-habitacion', 'Habitación del eco-hotel'],
                  ['eco-hotel-hamaca', 'Terraza de habitación'],
                  ['eco-hotel-bano', 'Baño de habitación'],
                  ['vista-eco-hotel', 'Vista desde el eco-hotel'],
                  ['bar', 'Bar del Lobby'],
                ]}
              />
              <Source>{t('Informe Montañita View, Grupo 3i (págs. 5–13).')}</Source>
            </Detail>

            <div className="rounded-2xl bg-light p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">{t('Estudio de factibilidad 2026')}</p>
              <h3 className="mt-1 font-serif text-2xl font-bold text-primary">81 apartamentos en tres etapas</h3>
              <p className="mt-2 text-sm text-primary/80">
                {t('Estudio propio con precios de venta, costos de construcción y tasas de 2026. Cambia de escenario para ver cómo se mueven los resultados.')}
              </p>
              <div className="mt-5">
                <MvStudy assumptions={c.study.scenarios} discount={c.study.discount} />
              </div>
            </div>

            <Detail title={t('Plan maestro del complejo')}>
              <Figure src="masterplan" caption="Plan maestro: lobby, módulos Arrecife, Coral y Manglar, hotel (fase futura), malecón y garita" />
              <Table
                head={['Componente', 'Unidades', 'Área vendible', 'Estado']}
                rows={[
                  ['Lobby y eco-hotel', 'Área social + 6 habitaciones', '—', 'Construido y operando'],
                  ...STAGE_MEDIA.map((s) => [`Etapa ${s.name}`, `${s.units} apartamentos`, m2(s.units * 151), 'Diseñada, lista para desarrollar']),
                  ['Hotel', '104 habitaciones', '—', 'Fase futura opcional'],
                ]}
              />
              <Source>{t('Plan maestro del proyecto, Grupo 3i.')}</Source>
            </Detail>

            {STAGE_MEDIA.map((s) => (
              <Detail key={s.name} title={`Etapa ${s.name} — ${s.units} apartamentos`}>
                <Figure src={s.render} caption={`Etapa ${s.name}`} />
                <p className="mt-3">
                  {s.units} apartamentos de 151 m² en serie de terrazas ({m2(s.units * 151)} vendibles).
                  Cada unidad: terraza con jacuzzi privado y BBQ, habitación principal con walk-in
                  closet, habitación estándar, sala, cocina semi-integral, comedor y baño social, con
                  domótica y amoblado.
                </p>
                {s.name === 'Arrecife' && <Figure src="render-apto-arrecife" caption="Terraza de un apartamento tipo" />}
              </Detail>
            ))}

            <Detail title={t('Fase futura: hotel de 104 habitaciones')}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Figure src="render-hotel-torre" caption="Torre del hotel (diseño conceptual)" />
                <Figure src="render-hotel-acceso" caption="Acceso vehicular (diseño conceptual)" />
              </div>
              <p className="mt-3">
                {t('El plan maestro reserva espacio para un hotel de 92 habitaciones estándar y 12 lofts. Se plantea como fase posterior, una vez consolidadas las etapas de apartamentos; su dimensión y viabilidad se evaluarán con la demanda generada por el complejo.')}
              </p>
            </Detail>
          </Route>

          {/* ===== C. COMPRA TOTAL ===== */}
          <Route id="total" printBreak eyebrow="Ruta C" title="Ambos proyectos en una sola operación">
            <Summary>{t(c.total.summary)}</Summary>
            <KV rows={c.total.rows} />

            <Detail title={t('Superficie incluida')}>
              <KV
                rows={[
                  ['Montañita View Lotes — 89 solares en venta', m2(LOTS_M2)],
                  ['Montañita View Lobby — predio', m2(LOBBY_M2)],
                  ['Total', m2(TOTAL_M2)],
                ]}
              />
              <p className="mt-3">
                {t('No incluye los solares ya vendidos o comprometidos. Tampoco las vías ni las áreas verdes, que son de uso público según la Resolución 0118052017-GADMSE-A.')}
              </p>
            </Detail>

            <Detail title={t('Forma de pago')}>
              <KV rows={c.total.paymentRows} />
              <p className="mt-3">{c.total.paymentNote}</p>
            </Detail>

            <WhatsAppCTA
              className="mt-4"
              message={t('Hola, vi la propuesta de Montañita View y me interesa *ambos proyectos* (Ruta C, {precio}). Quiero más información.', {
                precio: c.total.tag,
              })}
            />

            <Detail title={t('Infraestructura y estudios ya ejecutados')}>
              <ul className="list-disc space-y-1 pl-5">
                <li>{t('Estudio topográfico y de suelos.')}</li>
                <li>{t('Vías internas demarcadas y compactadas.')}</li>
                <li>{t('Desbroce y limpieza del terreno.')}</li>
                <li>{t('Linderación y georreferenciación de cada solar con hitos y coordenadas UTM.')}</li>
                <li>{t('Obra civil del Lobby: garita, lobby, cimentación y departamentos modelo.')}</li>
              </ul>
              <p className="mt-3">
                {t('En la zona avanza además una planta de tratamiento de aguas residuales y su línea de impulsión, obras públicas del GAD Municipal de Santa Elena para las comunas Río Chico y Manglaralto.')}
              </p>
            </Detail>
          </Route>

          {/* CONTEXTO Y FUENTES */}
          <section className="rounded-2xl bg-white p-6 ring-1 ring-black/5">
            <h2 className="font-serif text-2xl font-bold text-primary">{t('El destino')}</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-primary/80">
              {c.destination.map((d) => (
                <li key={d.text}>
                  {t(d.text)}
                  {d.url && (
                    <>
                      {' ('}
                      <a className="text-accent underline" target="_blank" rel="noreferrer" href={d.url}>{t(d.source || 'fuente')}</a>
                      {')'}
                    </>
                  )}
                  .
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-brand-gray">{t(c.disclaimer)}</p>
          </section>

          <PrintClosing contact={contact} />

          <div className="flex flex-wrap justify-center gap-3 print:hidden">
            {meetHref && (
              <a href={meetHref} target="_blank" rel="noreferrer">
                <Button size="lg">{t('Agendar una reunión')}</Button>
              </a>
            )}
            <Button size="lg" variant="outline" onClick={printPdf}>
              <Printer className="h-4 w-4" /> {t('Guardar como PDF')}
            </Button>
          </div>
        </main>
      )}
    </div>
  );
}

function Gate({ onUnlock }: { onUnlock: () => void }) {
  const { t } = useLang();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [sending, setSending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      await api.post('/contact', {
        name: form.name,
        email: form.email,
        phone: form.phone,
        source: 'propuesta:montanita-view',
        message: `Solicitó la propuesta exclusiva de Montañita View.`,
      });
      try {
        localStorage.setItem(UNLOCK_KEY, '1');
      } catch {
        /* sin almacenamiento: igual se desbloquea en esta visita */
      }
      onUnlock();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="mx-auto max-w-md px-4 py-14">
      <form onSubmit={submit} className="space-y-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="flex items-center gap-2 text-primary">
          <Lock className="h-4 w-4 text-accent" />
          <h2 className="font-serif text-xl font-bold">{t('Accede a la propuesta completa')}</h2>
        </div>
        <p className="text-sm text-brand-gray">
          {t('Déjanos tus datos para ver el dossier con cifras, planos de uso de suelo y condiciones. Un asesor te contactará.')}
        </p>
        <input required placeholder={t('Nombre completo')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm" />
        <input required type="email" placeholder={t('Email')} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm" />
        <PhoneField required onChange={(phone) => setForm({ ...form, phone })} />
        <p className="text-xs text-brand-gray">{t('El WhatsApp es obligatorio: es por donde te responde el asesor.')}</p>
        <Button type="submit" className="w-full" disabled={sending}>
          {sending ? t('Enviando…') : t('Ver la propuesta')}
        </Button>
      </form>
    </section>
  );
}

function Stat({ v, l }: { v: string; l: string }) {
  return (
    <div>
      <p className="font-serif text-2xl font-bold text-secondary">{v}</p>
      <p className="text-white/60">{l}</p>
    </div>
  );
}

function RouteCard({ icon: Icon, tag, title, body, href }: { icon: typeof MapPin; tag: string; title: string; body: string; href: string }) {
  const { t } = useLang();
  return (
    <a href={href} onClick={(e) => { e.preventDefault(); document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' }); }} className="group flex flex-col rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 transition hover:shadow-md">
      <Icon className="h-7 w-7 text-accent" strokeWidth={1.6} />
      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-secondary">{t(tag)}</p>
      <h3 className="mt-1 font-serif text-xl font-bold text-primary">{t(title)}</h3>
      <p className="mt-2 flex-1 text-sm text-brand-gray">{t(body)}</p>
      <span className="mt-4 flex items-center gap-1 text-sm font-medium text-accent print:hidden">
        {t('Ver detalle')} <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" />
      </span>
    </a>
  );
}

function Route({ id, eyebrow, title, children, printBreak }: { id: string; eyebrow: string; title: string; children: ReactNode; printBreak?: boolean }) {
  const { t } = useLang();
  return (
    <section id={id} className={`${printBreak ? 'print-break ' : ''}scroll-mt-24 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-10`}>
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-secondary">{t(eyebrow)}</p>
      <h2 className="mt-2 font-serif text-3xl font-bold text-primary">{t(title)}</h2>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function Summary({ children }: { children: ReactNode }) {
  return <p className="text-lg leading-relaxed text-primary/80">{children}</p>;
}

/** Detalle técnico plegable ("Ver detalle técnico →"). Se despliega al imprimir. */
function Detail({ title, children }: { title: string; children: ReactNode }) {
  const { t } = useLang();
  return (
    <details className="group rounded-xl bg-light p-4 open:pb-5 print:[&:not([open])]:block">
      <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-primary">
        {t(title)}
        <span className="flex items-center gap-1 text-sm font-medium text-accent print:hidden">
          {t('Ver detalle técnico')} <ChevronRight className="h-4 w-4 transition group-open:rotate-90" />
        </span>
      </summary>
      <div className="mt-3 text-sm leading-relaxed text-primary/80">{children}</div>
    </details>
  );
}

function KV({ rows }: { rows: [string, string][] }) {
  const { t } = useLang();
  return (
    <dl className="divide-y divide-black/5 rounded-xl ring-1 ring-black/5">
      {rows.map(([k, v]) => (
        <div key={k} className="flex flex-col gap-0.5 px-4 py-2.5 sm:flex-row sm:justify-between sm:gap-4">
          <dt className="text-sm text-brand-gray">{t(k)}</dt>
          <dd className="text-sm font-semibold text-primary sm:text-right">{t(v)}</dd>
        </div>
      ))}
    </dl>
  );
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  const { t } = useLang();
  return (
    <div className="overflow-x-auto rounded-xl ring-1 ring-black/5">
      <table className="w-full text-left text-sm">
        <thead className="bg-primary/5 text-primary">
          <tr>{head.map((h, i) => <th key={i} className="px-3 py-2 font-semibold">{t(h)}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={`border-t border-black/5 ${i === rows.length - 1 && r[0] === 'Total' ? 'font-semibold' : ''}`}>
              {r.map((c, j) => <td key={j} className="px-3 py-2">{t(c)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Source({ children }: { children: ReactNode }) {
  const { t } = useLang();
  return (
    <p className="mt-2 text-xs text-brand-gray">
      {t('Fuente')}: {typeof children === 'string' ? t(children) : children}
    </p>
  );
}

function Figure({ src, caption }: { src: string; caption: string }) {
  const { t } = useLang();
  const url = `${IMG}/${src}.jpg`;
  return (
    <figure className="mt-3">
      <a href={url} target="_blank" rel="noreferrer">
        <img src={url} alt={t(caption)} loading="lazy" className="w-full rounded-xl bg-white object-cover ring-1 ring-black/5" />
      </a>
      <figcaption className="mt-1 text-xs text-brand-gray">{t(caption)}</figcaption>
    </figure>
  );
}

function Gallery({ items }: { items: [string, string][] }) {
  const { t } = useLang();
  return (
    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
      {items.map(([src, caption]) => (
        <a key={src} href={`${IMG}/${src}.jpg`} target="_blank" rel="noreferrer" className="group relative block aspect-[4/3] overflow-hidden rounded-xl">
          <img src={`${IMG}/${src}.jpg`} alt={t(caption)} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-[11px] text-white">{t(caption)}</span>
        </a>
      ))}
    </div>
  );
}

// ============================================================
// DOCUMENTO IMPRESO — piezas que solo existen en el PDF.
//
// Sigue la estructura habitual de un offering memorandum inmobiliario:
// portada a toda página, aviso de confidencialidad, índice, resumen ejecutivo
// que abre con el argumento más fuerte, y una página de cierre con los
// próximos pasos. En pantalla no se ve nada de esto (`hidden print:block`).
// ============================================================

/** Mes y año en que se genera el documento, para fecharlo. */
const periodo = () =>
  new Date()
    .toLocaleDateString('es-EC', { month: 'long', year: 'numeric' })
    .replace(/^./, (m) => m.toUpperCase());

function PrintCover() {
  const { t } = useLang();
  return (
    <div className="pd-cover hidden print:flex">
      <img src={`${IMG}/portada.jpg`} alt="" className="pd-cover-bg" />
      <div className="pd-cover-veil" />
      <div className="pd-cover-top">
        <img src="/images/logotipo-light.svg" alt="Grupo 3i" className="pd-logo" />
      </div>
      <div className="pd-cover-main">
        <p className="pd-eyebrow">{t('Propuesta de inversión · Documento confidencial')}</p>
        <h1 className="pd-cover-title">{t('Montañita View')}</h1>
        <div className="pd-rule" />
        <p className="pd-cover-sub">
          Lotización de 25.8 hectáreas con título saneado y complejo turístico en operación.
          <br />
          {t('Manglaralto · Ruta del Spondylus · Santa Elena, Ecuador')}
        </p>
        <div className="pd-cover-stats">
          <div>
            <b>89</b>
            <span>solares disponibles</span>
          </div>
          <div>
            <b>{m2(TOTAL_M2)}</b>
            <span>en oferta</span>
          </div>
          <div>
            <b>2018</b>
            <span>lotización inscrita</span>
          </div>
        </div>
      </div>
      <div className="pd-cover-foot">
        <span>{t('Preparado por Grupo 3i · Inversión Inmobiliaria Inteligente')}</span>
        <span>{periodo()}</span>
      </div>
    </div>
  );
}

function PrintFrontMatter({ c }: { c: PropuestaContent }) {
  const { t } = useLang();
  return (
    <div className="hidden print:block">
      <div className="pd-nda">
        <h2>{t('Aviso de confidencialidad')}</h2>
        <p>
          {t('Este documento se entrega en forma reservada a un destinatario identificado, con el único fin de evaluar la operación que describe. Su contenido —cifras, planos, estudios y condiciones comerciales— es información privada de Grupo 3i y de los propietarios del proyecto, y no puede reproducirse, distribuirse ni compartirse con terceros sin autorización escrita. Si usted no es el destinatario, le pedimos devolverlo y eliminar cualquier copia.')}
        </p>
      </div>

      <h2 className="pd-h2">{t('Contenido')}</h2>
      <ol className="pd-toc">
        <li><span>{t('Resumen ejecutivo')}</span></li>
        <li><span>{t('Las tres maneras de participar')}</span></li>
        <li><span>{t('Ruta A — Montañita View Lotes, la lotización completa')}</span></li>
        <li><span>{t('Ruta B — Montañita View Lobby, el proyecto completo')}</span></li>
        <li><span>{t('Ruta C — Ambos proyectos en una sola operación')}</span></li>
        <li><span>{t('El destino: Montañita y la Ruta del Spondylus')}</span></li>
        <li><span>{t('Próximos pasos y contacto')}</span></li>
      </ol>

      <h2 className="pd-h2">{t('Resumen ejecutivo')}</h2>
      <p className="pd-lead">
        {t('Dos proyectos hermanos en la misma loma sobre Manglaralto, a 300 metros de la playa: una lotización de 25.8 hectáreas con la cadena de dominio completa e inscrita, y un complejo con el área social ya construida y operando. Se ofrecen juntos o por separado.')}
      </p>
      <ul className="pd-bullets">
        <li>
          <b>{t('Título saneado e inscrito.')}</b> {t('Compra al GAD Municipal de Santa Elena en 2013, urbanización aprobada por Resolución 0118052017-GADMSE-A e inscrita en 2018. Cada solar se escritura individualmente.')}
        </li>
        <li>
          <b>{t('111 solares levantados uno por uno.')}</b>{' '}
          {t('89 disponibles, {area} de superficie vendible, con linderos, hitos y coordenadas UTM verificados en campo.', { area: m2(LOTS_M2) })}
        </li>
        <li>
          <b>{t('Obra civil ejecutada.')}</b> {t('Vías internas demarcadas y compactadas, desbroce, estudio topográfico y de suelos, linderación y georreferenciación completas.')}
        </li>
        <li>
          <b>{t('El Lobby ya opera.')}</b> {t('Área social construida —lobby, dos piscinas, jacuzzi, restaurante, bar y eco-hotel— con un proyecto listo de 81 apartamentos en tres etapas.')}
        </li>
        <li>
          <b>{t('La operación completa')}: {c.total.tag}.</b>{' '}
          {t('{area} en una sola transacción, con 10% al firmar la promesa y el saldo a convenir entre las partes.', { area: m2(TOTAL_M2) })}
        </li>
      </ul>
    </div>
  );
}

function PrintClosing({ contact }: { contact?: Record<string, string> | null }) {
  const { t } = useLang();
  const wa = (contact?.whatsapp ?? '').replace(/\D/g, '');
  return (
    <div className="pd-closing hidden print:block">
      <h2 className="pd-h2">{t('Próximos pasos')}</h2>
      <ol className="pd-steps">
        <li>
          <b>{t('Reunión con un asesor.')}</b> {t('Revisamos la ruta que le interesa, resolvemos dudas y ponemos a disposición los documentos fuente: escrituras, resolución de urbanización, levantamiento topográfico y estudio de factibilidad.')}
        </li>
        <li>
          <b>{t('Visita al sitio.')}</b> {t('Recorrido por la lotización y el complejo, con los hitos de cada solar en terreno.')}
        </li>
        <li>
          <b>{t('Promesa de compraventa.')}</b> {t('Se firma ante notario con el 10% de reserva; ahí quedan escritos el precio, los plazos y las obligaciones de cada parte.')}
        </li>
        <li>
          <b>{t('Escrituración.')}</b> {t('Inscripción en el Registro de la Propiedad de Santa Elena a nombre del comprador.')}
        </li>
      </ol>

      <div className="pd-contact">
        <p className="pd-eyebrow-dark">{t('Hablemos')}</p>
        <p className="pd-contact-name">{t('Grupo 3i · Inversión Inmobiliaria Inteligente')}</p>
        <p className="pd-contact-rows">
          {wa && <>WhatsApp +{wa}<br /></>}
          {contact?.email && <>{contact.email}<br /></>}
          grupo3i.com
        </p>
      </div>
    </div>
  );
}
