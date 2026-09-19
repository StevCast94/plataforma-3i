import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Building2, Landmark, ChevronRight, Printer, Lock } from 'lucide-react';
import { Seo } from '@/components/shared/Seo';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/shared/Toast';

// ============================================================
// PROPUESTA EXCLUSIVA — Montañita View (privada: noindex, sin enlace en el
// menú y con registro previo que entra como lead).
//
// Tres rutas, cada una con un resumen persuasivo y enlaces "Ver detalle
// técnico" al dossier completo de la misma página:
//   A. Comprar un solar (Lotización, DIWILDI S.A.)
//   B. Socio del Lobby (predio de 36,348 m², propiedad de Didier Triana)
//   C. Compra total de ambos proyectos
//
// Todas las cifras están conciliadas (ver conversación del 19-sep-2026):
// áreas de GEO 3i, $100/m², estadísticas con fuente citada. NUNCA se
// publica aquí: la contraoferta de negociación del Lobby, datos personales
// de compradores/accionistas, deudas prediales, ni el caso de sobreposición.
// ============================================================

const UNLOCK_KEY = 'g3i_propuesta_mv';

const LOT_BLOCKS = [
  { mz: 'A', n: 15, m2: 16711.89 },
  { mz: 'B', n: 8, m2: 10714.3 },
  { mz: 'C', n: 10, m2: 18327.63 },
  { mz: 'D', n: 4, m2: 4063.7 },
  { mz: 'E', n: 10, m2: 11157.33 },
  { mz: 'F', n: 7, m2: 9808.97 },
  { mz: 'G', n: 9, m2: 13461.21 },
  { mz: 'H', n: 16, m2: 25154.24 },
  { mz: 'I', n: 9, m2: 12325.19 },
];
const LOTS_M2 = 121724.46;
const LOBBY_M2 = 36348;
const TOTAL_M2 = LOTS_M2 + LOBBY_M2;

const LAND_USE = [
  { uso: 'Residencial (solares)', m2: 141583, pct: 54.81 },
  { uso: 'Vías', m2: 51883, pct: 20.1 },
  { uso: 'Áreas verdes', m2: 44569.57, pct: 17.25 },
  { uso: 'Equipamiento urbano', m2: 13398.06, pct: 5.18 },
  { uso: 'Área de afectación', m2: 6865.55, pct: 2.66 },
];

// Datos de los estudios de factibilidad (Informe Montañita View). TIR = tasa a la que el
// perfil del VAN de cada estudio cruza cero (el texto del informe traía 24% y 42% para Coral
// y Manglar, inconsistentes con sus propios perfiles de 17% y 35%).
const STAGES = [
  { name: 'Arrecife', units: 18, pre: 279_350, build: 1_326_450, extra: 244_200, total: 1_850_000, van: 150_894.12, tir: 31, bc: '1.46', pri: 11, prid: 15.02, render: 'render-arrecife', chart: 'g-arrecife', pages: '17–19' },
  { name: 'Coral', units: 39, pre: 825_600, build: 2_906_800, extra: 567_600, total: 4_300_000, van: 206_663.97, tir: 17, bc: '1.38', pri: 16.7, prid: 19.14, render: 'render-coral', chart: 'g-coral', pages: '20–21' },
  { name: 'Manglar', units: 24, pre: 411_200, build: 1_801_570, extra: 357_230, total: 2_570_000, van: 286_894.92, tir: 35, bc: '2.15', pri: 9.1, prid: 17.06, render: 'render-manglar', chart: 'g-manglar', pages: '22–23' },
];

const IMG = '/images/propuesta-mv';

const m2 = (n: number) => `${n.toLocaleString('en-US', { maximumFractionDigits: 2 })} m²`;

export default function PropuestaMontanitaPage() {
  const [unlocked, setUnlocked] = useState(() => {
    try {
      return !!localStorage.getItem(UNLOCK_KEY);
    } catch {
      return false;
    }
  });

  return (
    <div className="bg-light">
      <Seo
        title="Propuesta exclusiva — Montañita View"
        description="Tres formas de invertir en Montañita View: un solar, sociedad en el Lobby o la compra total."
        noindex
      />

      {/* HERO */}
      <header className="relative isolate overflow-hidden bg-primary text-white">
        <img src={`${IMG}/terraza-vista-mar.jpg`} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-50" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/85 to-black/30" />
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-secondary">
            Propuesta exclusiva · Documento privado
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold sm:text-5xl">Montañita View</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/80">
            Dos proyectos hermanos en Manglaralto, Santa Elena: una lotización de 25.8 hectáreas con
            título saneado y un complejo hotelero con lobby ya construido. Tres maneras de ser parte.
          </p>
          <div className="mt-6 flex flex-wrap gap-6 text-sm">
            <Stat v="88" l="solares disponibles" />
            <Stat v={m2(TOTAL_M2)} l="en oferta" />
            <Stat v="2018" l="lotización inscrita" />
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
              Elige cómo participar
            </h2>
            <div className="grid gap-5 md:grid-cols-3">
              <RouteCard
                icon={MapPin}
                tag="Desde $49,084"
                title="Comprar un solar"
                body="Tu terreno propio, con título individual y financiamiento directo: 30% de entrada y 36 cuotas sin intereses."
                href="#solar"
              />
              <RouteCard
                icon={Building2}
                tag="$3,634,800"
                title="Socio del Lobby"
                body="36,348 m² con lobby, piscinas y eco-hotel ya operando, y proyecto con estudios de factibilidad para hotel y 81 apartamentos."
                href="#lobby"
              />
              <RouteCard
                icon={Landmark}
                tag="$15,807,246"
                title="Compra total"
                body="Ambos proyectos completos: 158,072 m² en una sola operación, con condiciones preferentes de pago."
                href="#total"
              />
            </div>
          </section>

          {/* ===== A. SOLAR ===== */}
          <Route id="solar" eyebrow="Ruta A" title="Comprar un solar en la Lotización">
            <Summary>
              Un solar propio en Manglaralto, a minutos de la playa y de Montañita, con la cadena de
              dominio completa e inscrita. Eliges el tuyo en el mapa y lo pagas en 36 cuotas sin
              intereses.
            </Summary>
            <KV
              rows={[
                ['Solares disponibles', '88 de 109'],
                ['Precio', '$100 / m²'],
                ['Desde', `${formatCurrency(49084)} — solar A9, 490.84 m²`],
                ['Plan de pago', '30% de entrada + saldo en hasta 36 cuotas al 0%'],
                ['Título', 'Individual, inscrito en el Registro de la Propiedad de Santa Elena'],
              ]}
            />
            <Link to="/proyectos/montanita-view" className="mt-4 inline-block">
              <Button>Ver el mapa de solares</Button>
            </Link>

            <Detail title="Cadena de dominio">
              <ol className="list-decimal space-y-2 pl-5">
                <li>
                  <b>2013 —</b> DIWILDI S.A. compra al GAD Municipal de Santa Elena el macrolote de 26.37
                  ha en el recinto Río Chico (escritura del 10-oct-2013, inscrita el 01-nov-2013).
                </li>
                <li>
                  <b>2014 —</b> Fraccionamiento aprobado por el Concejo Municipal (Lotización "Altos de
                  Manglar"), protocolizado e inscrito en febrero de 2014.
                </li>
                <li>
                  <b>2018 —</b> Reestructuración como Lotización Montañita VIEW (Resolución
                  Administrativa 0118052017-GADMSE-A), protocolizada el 18-oct-2018 e inscrita el
                  14-nov-2018.
                </li>
              </ol>
              <p className="mt-3">
                Los solares están fuera de tierras comunales. Cualquier contribución especial de mejoras
                por obras viales se asigna al vendedor en la escritura, no al comprador.
              </p>
              <Source>Registro de la Propiedad del cantón Santa Elena (inscripciones 01-nov-2013 y 14-nov-2018); Resolución Administrativa 0118052017-GADMSE-A.</Source>
            </Detail>

            <Detail title="Uso de suelo aprobado (258,299 m²)">
              <Table
                head={['Uso', 'm²', '%']}
                rows={LAND_USE.map((u) => [u.uso, m2(u.m2), `${u.pct}%`])}
              />
              <p className="mt-3">
                El 17.25% de áreas verdes cumple el Art. 424 del COOTAD, por lo que no hay compensación
                pendiente por ese concepto.
              </p>
              <Source>Cuadro de áreas del plano aprobado de la Lotización Montañita VIEW (GAD Municipal de Santa Elena, 2018); <a className="underline" target="_blank" rel="noreferrer" href="https://www.cpccs.gob.ec/wp-content/uploads/2020/01/cootad.pdf">COOTAD, Art. 424</a>.</Source>
            </Detail>

            <Detail title="Inventario disponible por manzana">
              <Table
                head={['Manzana', 'Solares', 'Área', 'Valor a $100/m²']}
                rows={[
                  ...LOT_BLOCKS.map((b) => [b.mz, String(b.n), m2(b.m2), formatCurrency(b.m2 * 100)]),
                  ['Total', '88', m2(LOTS_M2), formatCurrency(LOTS_M2 * 100)],
                ]}
              />
              <p className="mt-3">
                Tres manzanas tienen solares asignados a proyectos de negocio dentro del macroproyecto:
                zona de camping (E3–E5), aqua park (H14–H16) y río lento (G9). Siguen disponibles para
                la venta.
              </p>
              <Source>Levantamiento topográfico georreferenciado GEO 3i (2026), área individual de cada solar.</Source>
            </Detail>
          </Route>

          {/* ===== B. LOBBY ===== */}
          <Route id="lobby" eyebrow="Ruta B" title="Socio o desarrollador del Lobby">
            <Summary>
              El Lobby ya opera: área social con dos piscinas, jacuzzi, restaurante, bar y un eco-hotel
              de seis habitaciones, con vista de 270° al océano y al bosque. Sobre el predio está
              proyectado un hotel de 104 habitaciones y 81 apartamentos en tres etapas, con estudios de
              factibilidad completos. Buscamos socios o un desarrollador para ejecutarlo.
            </Summary>
            <KV
              rows={[
                ['Superficie', `${m2(LOBBY_M2)} (29,090 m² útiles + 7,258 m² de vías y áreas verdes)`],
                ['Valor del predio', `${formatCurrency(LOBBY_M2 * 100)} ($100 / m²)`],
                ['Propiedad', 'Didier Triana — proyecto hermano de la Lotización, con convenio entre ambos'],
                ['Modalidad', 'Sociedad para el desarrollo del proyecto o compra del predio'],
              ]}
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

            <Detail title="Ubicación">
              <p>
                Sector alto de la parroquia Manglaralto, sobre la Ruta del Spondylus, a 3 km del centro
                de Montañita. El entorno combina el filo costero con un interior rural; el bosque
                protector cubre cerca del 40% del territorio.
              </p>
              <Figure src="ubicacion-lobby" caption="Polígono del predio del Lobby (Google Earth, 27-sep-2023)" />
              <p className="mt-3">
                Servicios en el sector: energía y alumbrado público, agua potable, Ruta del Spondylus
                asfaltada y vía Manglaralto–Dos Mangas. A pocos minutos: Hospital de Manglaralto,
                gasolinera, reservorios de la Junta de Agua y hosterías de Montañita.
              </p>
              <Source>Informe Montañita View, Grupo 3i (págs. 4–5); imagen satelital Google Earth.</Source>
            </Detail>

            <Detail title="Lo que ya está construido">
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  <b>Lobby en dos plantas.</b> Planta baja: jardín, vestíbulo, área de comidas con dos
                  baños, cocina abierta con bodega, dos piscinas y un jacuzzi. Planta alta: terraza
                  cubierta con dos baños, bar, oficina administrativa y solárium.
                </li>
                <li>
                  <b>Eco-hotel:</b> seis buses reciclados adaptados como habitaciones, cada uno con
                  terraza y baño completo, cubiertos con caña y policarbonato.
                </li>
                <li>
                  <b>Infraestructura:</b> garita de acceso, alumbrado privado, red de agua potable, red
                  eléctrica, transformador trifásico de 75 kVA y monofásico de 50 kVA.
                </li>
                <li>
                  <b>Construcción:</b> estructura mixta de hormigón y caña, cisterna de hormigón armado
                  impermeabilizada, muros de contención en mampostería estructural, piscinas de hormigón
                  armado con lámina de PVC y pisos exteriores de hormigón y adoquín.
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
              <Source>Informe Montañita View, Grupo 3i (págs. 5–13).</Source>
            </Detail>

            <Detail title="Plan maestro del complejo">
              <Figure src="masterplan" caption="Plan maestro: hotel, lobby, módulos Arrecife, Coral y Manglar, malecón y garita" />
              <Table
                head={['Componente', 'Unidades', 'Área', 'Inversión']}
                rows={[
                  ['Hotel', '104 habitaciones', '—', formatCurrency(7_500_000)],
                  ...STAGES.map((s) => [`Etapa ${s.name}`, `${s.units} apartamentos de 151 m²`, m2(s.units * 151), formatCurrency(s.total)]),
                  ['Total', '104 hab. + 81 aptos', m2(81 * 151), formatCurrency(7_500_000 + STAGES.reduce((a, s) => a + s.total, 0))],
                ]}
              />
              <p className="mt-3">Montos de construcción del proyecto; no incluyen el valor del predio.</p>
              <Source>Informe Montañita View, Grupo 3i (págs. 8, 15, 19, 21 y 23).</Source>
            </Detail>

            <Detail title="Hotel — 104 habitaciones">
              <div className="grid gap-3 sm:grid-cols-2">
                <Figure src="render-hotel-torre" caption="Torre del hotel" />
                <Figure src="render-hotel-acceso" caption="Acceso vehicular al hotel" />
              </div>
              <p className="mt-3">
                92 habitaciones estándar (algunas con hidromasaje; dos camas personales o una
                matrimonial) y 12 lofts sin divisiones interiores, con zonas comunes y recreativas.
              </p>
              <h4 className="mt-4 font-semibold text-primary">Inversión</h4>
              <KV
                rows={[
                  ['Construcción', formatCurrency(6_840_000)],
                  ['Equipamiento de habitaciones', formatCurrency(460_000)],
                  ['Otros equipamientos', formatCurrency(200_000)],
                  ['Total', formatCurrency(7_500_000)],
                ]}
              />
              <h4 className="mt-4 font-semibold text-primary">Indicadores financieros (tasa de descuento 12%)</h4>
              <KV
                rows={[
                  ['VAN', formatCurrency(3_270_307.67)],
                  ['TIR', '25%'],
                  ['Razón beneficio / costo', '1.44'],
                  ['Recuperación de la inversión (descontada)', '4.23 años'],
                  ['Flujo de caja anual (años 1–4)', formatCurrency(2_144_072)],
                  ['Flujo del año 5 (incluye valor residual de los activos)', formatCurrency(7_504_072)],
                ]}
              />
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Figure src="g-hotel-recuperacion" caption="Recuperación de la inversión: flujos descontados acumulados" />
                <Figure src="g-hotel-van" caption="Perfil del VAN: cruza cero en 25% (TIR)" />
              </div>
              <Source>Estudio de factibilidad del Hotel, Informe Montañita View (págs. 14–16).</Source>
            </Detail>

            {STAGES.map((s) => (
              <Detail key={s.name} title={`Etapa ${s.name} — ${s.units} apartamentos`}>
                <Figure src={s.render} caption={`Etapa ${s.name}`} />
                <p className="mt-3">
                  {s.units} apartamentos de 151 m² en serie de terrazas ({m2(s.units * 151)} en total).
                  Cada unidad: terraza con jacuzzi privado y BBQ, habitación principal con walk-in
                  closet, habitación estándar, sala, cocina semi-integral, comedor y baño social, con
                  domótica y amoblado.
                </p>
                <h4 className="mt-4 font-semibold text-primary">Inversión</h4>
                <KV
                  rows={[
                    ['Inversión preliminar', formatCurrency(s.pre)],
                    ['Construcción y urbanización', formatCurrency(s.build)],
                    ['Complementarios', formatCurrency(s.extra)],
                    ['Total', formatCurrency(s.total)],
                  ]}
                />
                <h4 className="mt-4 font-semibold text-primary">Indicadores financieros (tasa de descuento 12%)</h4>
                <KV
                  rows={[
                    ['VAN', formatCurrency(s.van)],
                    ['TIR', `${s.tir}%`],
                    ['Razón beneficio / costo', s.bc],
                    ['Recuperación de la inversión', `${s.pri} meses (${s.prid} meses descontada)`],
                  ]}
                />
                <Figure src={s.chart} caption="Flujos de caja mensuales, recuperación descontada, razón beneficio/costo y perfil del VAN" />
                <Source>Estudio de factibilidad de la Etapa {s.name}, Informe Montañita View (págs. {s.pages}).</Source>
              </Detail>
            ))}
          </Route>

          {/* ===== C. COMPRA TOTAL ===== */}
          <Route id="total" eyebrow="Ruta C" title="Compra total de ambos proyectos">
            <Summary>
              La Lotización completa con sus 88 solares disponibles y el predio del Lobby, en una sola
              operación: 158,072 m² en la Ruta del Spondylus, con estudios, linderación y obra civil ya
              ejecutados.
            </Summary>
            <KV
              rows={[
                ['Precio', `${formatCurrency(TOTAL_M2 * 100)} ($100 / m²)`],
                ['Superficie', m2(TOTAL_M2)],
              ]}
            />

            <Detail title="Superficie incluida">
              <KV
                rows={[
                  ['Solares disponibles de la Lotización', m2(LOTS_M2)],
                  ['Predio del Lobby', m2(LOBBY_M2)],
                  ['Total', m2(TOTAL_M2)],
                ]}
              />
              <p className="mt-3">
                No incluye los solares ya vendidos o comprometidos, ni el lote "La Estación", que se
                negocia por separado.
              </p>
            </Detail>

            <Detail title="Forma de pago — financiamiento directo sin intereses">
              <KV
                rows={[
                  ['Reserva (10%) al firmar la promesa', formatCurrency(TOTAL_M2 * 100 * 0.1)],
                  ['Saldo en 6 pagos semestrales de', formatCurrency((TOTAL_M2 * 100 * 0.9) / 6)],
                ]}
              />
              <p className="mt-3">Cada semestre se garantiza con cheque de gerencia o carta de crédito.</p>
            </Detail>

            <Detail title="Infraestructura y estudios ya ejecutados">
              <ul className="list-disc space-y-1 pl-5">
                <li>Estudio topográfico y de suelos.</li>
                <li>Vías internas demarcadas y compactadas.</li>
                <li>Desbroce y limpieza del terreno.</li>
                <li>Linderación y georreferenciación de cada solar con hitos y coordenadas UTM.</li>
                <li>Obra civil del Lobby: garita, lobby, cimentación y departamentos modelo.</li>
              </ul>
              <p className="mt-3">
                En la zona avanza además una planta de tratamiento de aguas residuales y su línea de
                impulsión, obras públicas del GAD Municipal de Santa Elena para las comunas Río Chico y Manglaralto.
              </p>
            </Detail>
          </Route>

          {/* CONTEXTO Y FUENTES */}
          <section className="rounded-2xl bg-white p-6 ring-1 ring-black/5">
            <h2 className="font-serif text-2xl font-bold text-primary">El destino</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-primary/80">
              <li>
                80% de ocupación hotelera en Montañita en el feriado de mayo de 2026, según la Cámara de
                Turismo de Santa Elena (
                <a className="text-accent underline" target="_blank" rel="noreferrer" href="https://www.eluniverso.com/noticias/ecuador/intenso-sol-acompana-a-banistas-en-segundo-dia-de-feriado-en-santa-elena-50-de-ocupacion-en-salinas-y-80-en-montanita-nota/">El Universo</a>).
              </li>
              <li>
                80% de ocupación hotelera provincial en el feriado de octubre de 2025 (
                <a className="text-accent underline" target="_blank" rel="noreferrer" href="https://www.primicias.ec/sociedad/provincia-santa-elena-feriado-octubre-ocupacion-hotelera-paro-conaie-107098/">Primicias</a>).
              </li>
              <li>
                Llegadas internacionales a Ecuador +17% en el primer semestre de 2025 frente a 2024, tras
                una caída de 11.5% en 2024 (
                <a className="text-accent underline" target="_blank" rel="noreferrer" href="https://www.eldiario.ec/ecuador/por-que-ecuador-no-atrae-mas-turistas-las-cifras-de-2025-que-explican-el-rezago-regional-04112025/">El Diario</a>).
              </li>
            </ul>
            <p className="mt-4 text-xs text-brand-gray">
              Documento informativo. Los indicadores financieros provienen de los estudios de factibilidad
              citados y no constituyen garantía de rentabilidad. Los documentos fuente están disponibles
              para revisión en la reunión con un asesor.
            </p>
          </section>

          <div className="flex flex-wrap justify-center gap-3 print:hidden">
            <a href="https://wa.me/593997331251" target="_blank" rel="noreferrer">
              <Button size="lg">Agendar una reunión</Button>
            </a>
            <Button size="lg" variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Guardar como PDF
            </Button>
          </div>
        </main>
      )}
    </div>
  );
}

function Gate({ onUnlock }: { onUnlock: () => void }) {
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
          <h2 className="font-serif text-xl font-bold">Accede a la propuesta completa</h2>
        </div>
        <p className="text-sm text-brand-gray">
          Déjanos tus datos para ver el dossier con cifras, planos de uso de suelo y condiciones. Un
          asesor te contactará.
        </p>
        <input required placeholder="Nombre completo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm" />
        <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm" />
        <input required placeholder="WhatsApp" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm" />
        <Button type="submit" className="w-full" disabled={sending}>
          {sending ? 'Enviando…' : 'Ver la propuesta'}
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
  return (
    <a href={href} onClick={(e) => { e.preventDefault(); document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' }); }} className="group flex flex-col rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 transition hover:shadow-md">
      <Icon className="h-7 w-7 text-accent" strokeWidth={1.6} />
      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-secondary">{tag}</p>
      <h3 className="mt-1 font-serif text-xl font-bold text-primary">{title}</h3>
      <p className="mt-2 flex-1 text-sm text-brand-gray">{body}</p>
      <span className="mt-4 flex items-center gap-1 text-sm font-medium text-accent">
        Ver detalle <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" />
      </span>
    </a>
  );
}

function Route({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-10">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-secondary">{eyebrow}</p>
      <h2 className="mt-2 font-serif text-3xl font-bold text-primary">{title}</h2>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function Summary({ children }: { children: ReactNode }) {
  return <p className="text-lg leading-relaxed text-primary/80">{children}</p>;
}

/** Detalle técnico plegable ("Ver detalle técnico →"). Se despliega al imprimir. */
function Detail({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="group rounded-xl bg-light p-4 open:pb-5 print:[&:not([open])]:block">
      <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-primary">
        {title}
        <span className="flex items-center gap-1 text-sm font-medium text-accent print:hidden">
          Ver detalle técnico <ChevronRight className="h-4 w-4 transition group-open:rotate-90" />
        </span>
      </summary>
      <div className="mt-3 text-sm leading-relaxed text-primary/80">{children}</div>
    </details>
  );
}

function KV({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="divide-y divide-black/5 rounded-xl ring-1 ring-black/5">
      {rows.map(([k, v]) => (
        <div key={k} className="flex flex-col gap-0.5 px-4 py-2.5 sm:flex-row sm:justify-between sm:gap-4">
          <dt className="text-sm text-brand-gray">{k}</dt>
          <dd className="text-sm font-semibold text-primary sm:text-right">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl ring-1 ring-black/5">
      <table className="w-full text-left text-sm">
        <thead className="bg-primary/5 text-primary">
          <tr>{head.map((h, i) => <th key={i} className="px-3 py-2 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={`border-t border-black/5 ${i === rows.length - 1 && r[0] === 'Total' ? 'font-semibold' : ''}`}>
              {r.map((c, j) => <td key={j} className="px-3 py-2">{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Source({ children }: { children: ReactNode }) {
  return <p className="mt-2 text-xs text-brand-gray">Fuente: {children}</p>;
}

function Figure({ src, caption }: { src: string; caption: string }) {
  const url = `${IMG}/${src}.jpg`;
  return (
    <figure className="mt-3">
      <a href={url} target="_blank" rel="noreferrer">
        <img src={url} alt={caption} loading="lazy" className="w-full rounded-xl bg-white object-cover ring-1 ring-black/5" />
      </a>
      <figcaption className="mt-1 text-xs text-brand-gray">{caption}</figcaption>
    </figure>
  );
}

function Gallery({ items }: { items: [string, string][] }) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
      {items.map(([src, caption]) => (
        <a key={src} href={`${IMG}/${src}.jpg`} target="_blank" rel="noreferrer" className="group relative block aspect-[4/3] overflow-hidden rounded-xl">
          <img src={`${IMG}/${src}.jpg`} alt={caption} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-[11px] text-white">{caption}</span>
        </a>
      ))}
    </div>
  );
}
