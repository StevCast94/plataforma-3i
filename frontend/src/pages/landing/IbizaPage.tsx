import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Gift, Home, KeyRound, MapPin, Repeat, Sun, Users } from 'lucide-react';
import { Seo } from '@/components/shared/Seo';
import { ImageGallery } from '@/components/shared/ImageGallery';
import { WhatsAppCTA } from '@/components/shared/WhatsAppCTA';
import { useProject } from '@/hooks/useProjects';
import { ProjectLeadContext, useTrackView } from '@/lib/projectTracking';
import { cld } from '@/lib/cloudinary';

// ============================================================
// Ficha de Ibiza Condohotel (/ibiza). Lenguaje: docs/GUIA-DE-LENGUAJE.md —
// Ibiza es una FRACCIÓN DE USO: nunca «inversión», «acciones», «rentabilidad»
// ni «plusvalía».
//
// Hasta el lanzamiento (30-oct-2026) solo la ve quien abre el enlace con
// ?vista=<clave>; el navegador lo recuerda. Sin la clave se ve «muy pronto».
// ============================================================

const LAUNCH = new Date('2026-10-30T05:00:00Z');
const PREVIEW_KEY = 'ibiza30';
const STORE = 'g3i_ibiza_preview';

// Calendario heptadecenal oficial (Reglamento, Anexo A): 17 suites × 52 semanas
// = 884 turnos; 221 fracciones × 4 semanas. Cada año la fracción rota de suite.
const R = 315, YEAR0 = 2025, COMERCIALES = 192;
function asignaciones(f: number, y: number) {
  const out: { semana: number; suite: number }[] = [];
  for (let k = 0; k < 4; k++) {
    const s = (k * 221 + (f - 1) + y * R) % 884;
    out.push({ semana: Math.floor(s / 17) + 1, suite: (s % 17) + 1 });
  }
  return out.sort((a, b) => a.semana - b.semana);
}
function lunesISO(w: number, year: number) {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const d = new Date(jan4);
  d.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() || 7) - 1) + (w - 1) * 7);
  return d;
}
const fmt = (d: Date) => d.toLocaleDateString('es-EC', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const plus = (d: Date, n: number) => { const x = new Date(d); x.setUTCDate(x.getUTCDate() + n); return x; };

function useAcceso() {
  const [ok, setOk] = useState(() => {
    if (Date.now() >= LAUNCH.getTime()) return true;
    try {
      if (new URLSearchParams(window.location.search).get('vista') === PREVIEW_KEY) { localStorage.setItem(STORE, '1'); return true; }
      return localStorage.getItem(STORE) === '1';
    } catch { return false; }
  });
  useEffect(() => { if (!ok && Date.now() >= LAUNCH.getTime()) setOk(true); }, [ok]);
  return ok;
}

export default function IbizaPage() {
  const acceso = useAcceso();
  if (!acceso) return <MuyPronto />;
  return <Ficha />;
}

function MuyPronto() {
  return (
    <section className="relative isolate overflow-hidden bg-primary text-white">
      <Seo title="Ibiza Condohotel — muy pronto" description="Cuatro semanas al año junto al mar. Para siempre." noindex />
      <img src="/images/ibiza/portada.jpg" alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-35" />
      <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-4 py-24 text-center">
        <img src="/images/proyectos/ibiza/logo-light.svg" alt="Ibiza Condohotel" className="h-24 w-auto" />
        <h1 className="mt-8 font-serif text-4xl font-bold sm:text-5xl">Cuatro semanas al año junto al mar. Para siempre.</h1>
        <p className="mt-4 text-lg text-white/80">Lanzamiento el 30 de octubre.</p>
        <div className="mt-8"><WhatsAppCTA message="Hola, quiero que me avisen del lanzamiento de Ibiza Condohotel.">Avísame del lanzamiento</WhatsAppCTA></div>
      </div>
    </section>
  );
}

function Ficha() {
  const { data: project } = useProject('ibiza-condohotel');
  useTrackView('ibiza-condohotel', 'view');
  const images = useMemo(() => (project?.images ?? []).map((u) => cld(u, { width: 1200 })), [project]);
  const prelanzamiento = Date.now() < LAUNCH.getTime();

  return (
    <ProjectLeadContext.Provider value={{ slug: 'ibiza-condohotel', gated: false }}>
      <Seo
        title="Ibiza Condohotel — cuatro semanas al año junto al mar"
        description="Tu fracción en Ibiza Condohotel desde $12,000: 4 semanas al año, una por trimestre, a 300 m del mar en Manglaralto. Para siempre."
        image="/images/og/og-ibiza.jpg"
        noindex={prelanzamiento}
      />
      {prelanzamiento && (
        <div className="bg-secondary px-4 py-2 text-center text-sm font-semibold text-primary">Vista previa privada · lanzamiento el 30 de octubre</div>
      )}

      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-primary text-white">
        <img src="/images/ibiza/portada.jpg" alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-40" />
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <img src="/images/proyectos/ibiza/logo-light.svg" alt="Ibiza Condohotel" className="h-20 w-auto sm:h-24" />
          <h1 className="mt-8 max-w-3xl font-serif text-4xl font-bold leading-tight sm:text-6xl">Cuatro semanas al año junto al mar. Para siempre.</h1>
          <p className="mt-6 max-w-2xl text-lg text-white/85">
            Tu fracción en un condohotel de 17 suites a 300 m del mar, en Manglaralto, Santa Elena. Cada año disfrutas cuatro semanas, una por trimestre, y tu fracción pasa a tu familia.
          </p>
          <div className="mt-8 flex flex-wrap items-end gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Tu fracción desde</p>
              <p className="font-serif text-5xl font-bold">$12,000</p>
            </div>
            <WhatsAppCTA message="Hola, quiero mi fracción en Ibiza Condohotel. ¿Qué fracciones tienen disponibles?" className="!px-6 !py-3 !text-base">Quiero mi fracción</WhatsAppCTA>
            <a href="#calendario" className="rounded-lg border border-white/40 px-6 py-3 font-medium hover:bg-white hover:text-primary">Ver el calendario</a>
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-accent">Propiedad fraccionada</p>
        <h2 className="mt-2 text-center text-3xl font-bold text-primary sm:text-4xl">Así funciona tu fracción</h2>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [Home, '17 suites, 13 fracciones cada una', 'Cada suite se divide en 13 fracciones. La tuya es una de ellas.'],
            [CalendarDays, '4 semanas al año', 'Una semana en cada trimestre: verano, vacaciones, feriados y temporada tranquila.'],
            [Repeat, 'Cada año, otra suite', 'Tus semanas rotan entre las 17 suites; en 17 años las conoces todas y el ciclo vuelve a empezar.'],
            [KeyRound, 'Miércoles a martes', 'Llegas el miércoles a las 15:00 y sales el martes a las 11:00.'],
          ].map(([I, t, d]) => {
            const Icon = I as typeof Home;
            return (
              <div key={t as string} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
                <Icon className="h-8 w-8 text-accent" aria-hidden />
                <p className="mt-4 font-semibold text-primary">{t as string}</p>
                <p className="mt-1 text-sm text-brand-gray">{d as string}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* QUÉ PUEDES HACER CON TUS SEMANAS */}
      <section className="bg-light">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-primary sm:text-4xl">Tus semanas, a tu manera</h2>
          <div className="mt-12 grid gap-5 md:grid-cols-4">
            {[
              [Sun, 'Úsalas', 'Con tu familia o tus amigos, en una suite equipada con piscina, gimnasio, spa y restaurante.'],
              [Gift, 'Regálalas o préstalas', 'Tus semanas son tuyas: puedes dárselas a quien quieras.'],
              [Repeat, 'Que la administración las alquile', 'Si un año no usas una semana, la administración puede alquilarla por ti.'],
              [Users, 'Pásala a tu familia', 'Tu fracción no se acaba: el ciclo se repite y la heredan los tuyos.'],
            ].map(([I, t, d]) => {
              const Icon = I as typeof Sun;
              return (
                <div key={t as string} className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-black/5">
                  <Icon className="mx-auto h-8 w-8 text-accent" aria-hidden />
                  <p className="mt-4 font-semibold text-primary">{t as string}</p>
                  <p className="mt-1 text-sm text-brand-gray">{d as string}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Calendario />

      {/* GALERÍA */}
      {images.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-center text-3xl font-bold text-primary sm:text-4xl">Conoce Ibiza</h2>
          <ImageGallery images={images} alt="Ibiza Condohotel" />
        </section>
      )}

      {/* UBICACIÓN Y COSTOS */}
      <section className="bg-primary text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 md:grid-cols-2 lg:px-8">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-secondary"><MapPin className="h-4 w-4" /> Manglaralto, Santa Elena</p>
            <h2 className="mt-2 text-3xl font-bold">A 300 m del mar</h2>
            <dl className="mt-6 grid grid-cols-2 gap-4">
              {[['al mar', '~300 m'], ['a Montañita', '5 min'], ['desde Salinas', '1 h'], ['desde Guayaquil', '2 h 30']].map(([l, v]) => (
                <div key={l} className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10"><dt className="text-sm text-white/70">{l}</dt><dd className="font-serif text-2xl font-bold">{v}</dd></div>
              ))}
            </dl>
          </div>
          <div>
            <h2 className="text-3xl font-bold">Lo que pagas</h2>
            <ul className="mt-6 space-y-4 text-white/85">
              <li><b className="text-white">Tu fracción: desde $12,000.</b> Pregúntanos por las formas de pago.</li>
              <li><b className="text-white">Cuota anual de mantenimiento</b> por fracción, con cuentas claras: cubre la operación, la limpieza y el cuidado del condohotel.</li>
              <li><b className="text-white">Contrato y reglamento</b> que te entregamos completos antes de firmar.</li>
            </ul>
            <div className="mt-8"><WhatsAppCTA message="Hola, quiero conocer las formas de pago de una fracción en Ibiza Condohotel.">Hablar con un asesor</WhatsAppCTA></div>
          </div>
        </div>
      </section>

      {/* PREGUNTAS */}
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-3xl font-bold text-primary">Preguntas frecuentes</h2>
        <div className="mt-8 space-y-3">
          {[
            ['¿Qué compro exactamente?', 'Una fracción de uso de Ibiza Condohotel: el derecho a disfrutar cuatro semanas al año, según el calendario oficial, durante todo el ciclo y los que siguen.'],
            ['¿Cómo sé cuáles son mis semanas?', 'Cada fracción tiene su número. Con él, el calendario te dice en qué suite y en qué fechas te toca cada año. Puedes probarlo arriba.'],
            ['¿Qué pasa cuando terminan los 17 años?', 'El ciclo vuelve a empezar. Tu fracción no vence.'],
            ['¿Puedo heredarla?', 'Sí. Tu fracción pasa a tu familia.'],
            ['¿Y si un año no puedo ir?', 'Puedes prestar o regalar tus semanas, o pedir a la administración que las alquile por ti.'],
          ].map(([q, a]) => (
            <details key={q} className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <summary className="cursor-pointer list-none font-semibold text-primary">{q}</summary>
              <p className="mt-2 text-brand-gray">{a}</p>
            </details>
          ))}
        </div>
        <div className="mt-10 text-center"><WhatsAppCTA message="Hola, quiero mi fracción en Ibiza Condohotel.">Quiero mi fracción</WhatsAppCTA></div>
      </section>
    </ProjectLeadContext.Provider>
  );
}

function Calendario() {
  const [f, setF] = useState(1);
  const [anio, setAnio] = useState(() => Math.min(Math.max(new Date().getFullYear() + 1, YEAR0), YEAR0 + 16));
  const filas = asignaciones(f, anio - YEAR0);
  return (
    <section id="calendario" className="mx-auto max-w-5xl scroll-mt-20 px-4 py-20 sm:px-6 lg:px-8">
      <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-accent">Calendario oficial</p>
      <h2 className="mt-2 text-center text-3xl font-bold text-primary sm:text-4xl">¿Qué semanas te tocan?</h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-brand-gray">Elige un número de fracción y un año. El calendario es el mismo del reglamento: cada fracción tiene sus cuatro semanas fijas cada año.</p>
      <div className="mt-8 flex flex-wrap items-end justify-center gap-4">
        <label className="text-sm font-medium text-primary">Fracción
          <input type="number" min={1} max={COMERCIALES} value={f} onChange={(e) => setF(Math.min(COMERCIALES, Math.max(1, Number(e.target.value) || 1)))} className="mt-1 block w-28 rounded-lg border border-black/15 px-3 py-2 text-lg" />
        </label>
        <label className="text-sm font-medium text-primary">Año
          <select value={anio} onChange={(e) => setAnio(Number(e.target.value))} className="mt-1 block rounded-lg border border-black/15 px-3 py-2 text-lg">
            {Array.from({ length: 17 }, (_, i) => YEAR0 + i).map((y) => <option key={y}>{y}</option>)}
          </select>
        </label>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {filas.map((x, i) => {
          const llega = plus(lunesISO(x.semana, anio), 2);
          return (
            <div key={i} className="rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-black/5">
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">Tu semana {i + 1}</p>
              <p className="mt-2 font-serif text-2xl font-bold text-primary">{fmt(llega)} – {fmt(plus(llega, 6))}</p>
              <p className="mt-1 text-sm text-brand-gray">Suite {x.suite} · semana {x.semana} del año</p>
            </div>
          );
        })}
      </div>
      <p className="mt-6 text-center text-xs text-brand-gray">Llegada el miércoles a las 15:00 y salida el martes a las 11:00. La disponibilidad de cada fracción te la confirma un asesor.</p>
      <div className="mt-6 text-center"><WhatsAppCTA message={`Hola, me interesa la fracción ${f} de Ibiza Condohotel. ¿Está disponible?`} variant="outline">¿Está disponible la fracción {f}?</WhatsAppCTA></div>
    </section>
  );
}
