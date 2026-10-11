import type { ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  BadgeCheck, BarChart3, Box, CalendarCheck, FileSignature, HandCoins, Languages, Map, MessageCircle, Printer, Search, Users,
} from 'lucide-react';
import { Seo } from '@/components/shared/Seo';
import { useSectionContent } from '@/hooks/useSiteContent';

// Propuesta comercial para desarrolladores (/publica-tu-proyecto/propuesta), al
// estilo de las de los portales inmobiliarios pero con nuestro modelo: pago por
// éxito. Se lee como láminas en pantalla y se imprime una por página (PDF).
// `?para=Nombre` la personaliza para un desarrollador concreto.

function Slide({ children, dark, bg }: { children: ReactNode; dark?: boolean; bg?: ReactNode }) {
  return (
    <section
      className={`proposal-slide relative overflow-hidden ${dark ? 'bg-primary text-white' : 'bg-white text-primary'} print:h-[210mm]`}
    >
      {bg}
      <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-center px-6 py-16 sm:px-12 print:min-h-0 print:h-full print:py-10">
        {children}
      </div>
    </section>
  );
}

function Kicker({ children, light }: { children: ReactNode; light?: boolean }) {
  return (
    <p className={`mb-3 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] ${light ? 'text-secondary' : 'text-accent'}`}>
      <span className="h-px w-8 bg-secondary" />
      {children}
    </p>
  );
}

const STEPS = [
  { icon: FileSignature, t: 'Alta', d: 'Firmamos, cargamos tu plano de lotes, fotos y recorridos 360°. Pago único de $300.' },
  { icon: BadgeCheck, t: 'Verificación', d: 'Revisamos escritura, gravámenes y aprobación municipal. Tu proyecto recibe el sello.' },
  { icon: Search, t: 'Publicación', d: 'Ficha en español e inglés, mapa interactivo y difusión por la red de referidores.' },
  { icon: MessageCircle, t: 'Contactos', d: 'Cada interesado queda registrado y llega a tu WhatsApp con nombre, solar y origen.' },
  { icon: HandCoins, t: 'Venta', d: 'Declaras la venta y pagas la comisión a medida que tu cliente te paga.' },
];

const TOOLS = [
  { icon: Map, t: 'Mapa interactivo de lotes', d: 'Precio, medidas, linderos y disponibilidad en vivo. El cliente elige su solar desde el celular y lo comparte por WhatsApp.' },
  { icon: Box, t: 'Recorridos 360°', d: 'Panorámicas ubicadas y orientadas sobre el mapa. Se recorren con el dedo o moviendo el teléfono.' },
  { icon: Users, t: 'Red Refiere y gana', d: 'Socios que comparten tu proyecto con enlaces propios y cobran solo si se vende.' },
  { icon: Languages, t: 'Bilingüe de verdad', d: 'Ficha, mapa, vistas previas en redes y formularios en español e inglés para el comprador extranjero.' },
  { icon: BarChart3, t: 'Portal y métricas', d: 'Contactos, ventas, pagos y el embudo de tu proyecto: visitas, solares vistos, 360°, WhatsApp.' },
  { icon: CalendarCheck, t: 'CRM (próximamente)', d: 'Seguimiento de clientes, recordatorios, plantillas de WhatsApp y agenda de visitas.' },
];

const COMPARE: [string, string, string][] = [
  ['Cómo pagas', 'Plan por avisos, vendas o no', 'Comisión solo por venta concretada'],
  ['Costo si no vendes', 'El plan completo', '$0 (solo el alta)'],
  ['Quién empuja tu proyecto', 'El buscador del portal', 'Plataforma + red de referidores'],
  ['Lotización', 'Un aviso por inmueble', 'Mapa interactivo con todos los lotes'],
  ['Confianza del comprador', 'Sin revisión legal', 'Sello «Verificado por Grupo 3i»'],
  ['Comprador extranjero', 'Limitado', 'Todo en español e inglés'],
  ['Visita virtual', 'Fotos', 'Recorridos 360° sobre el mapa'],
];

const money = (n: number) => `$${n.toLocaleString('en-US')}`;

export default function ProposalPage() {
  const [params] = useSearchParams();
  const para = params.get('para')?.trim().slice(0, 80);
  const { data: contact } = useSectionContent('contact');
  const wa = (contact?.whatsapp || '').replace(/\D/g, '');
  const year = new Date().getFullYear();

  // Ejemplo con un lote de $40.000.
  const price = 40000;
  const entry = 10000;
  const cuota = 1000;

  return (
    <div className="bg-light print:bg-white">
      <Seo title="Propuesta comercial para desarrolladores" noindex />
      <style>{`@media print { @page { size: A4 landscape; margin: 0 } .proposal-slide { break-after: page; } }`}</style>

      <div className="fixed right-4 top-4 z-20 flex gap-2 print:hidden">
        <Link to="/publica-tu-proyecto" className="rounded-full bg-white/90 px-4 py-2 text-sm text-primary shadow">
          ← Volver
        </Link>
        <button onClick={() => window.print()} className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-primary shadow">
          <Printer className="h-4 w-4" /> Descargar PDF
        </button>
      </div>

      {/* 1. Portada */}
      <Slide
        dark
        bg={
          <>
            <img src="/images/og/montanita-view-mapa.jpg" alt="" className="absolute inset-0 h-full w-full object-cover object-left opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/85 to-primary/40" />
          </>
        }
      >
        <div>
          <img src="/images/logotipo-light.svg" alt="Grupo 3i" className="h-10 w-auto" />
          <p className="mt-16 text-sm uppercase tracking-[0.3em] text-secondary">Propuesta comercial {year}</p>
          <h1 className="mt-4 max-w-3xl font-serif text-5xl font-bold leading-tight sm:text-6xl">Vende tus lotes con la red de Grupo 3i</h1>
          <p className="mt-6 max-w-2xl text-lg text-white/80">Vitrina curada de proyectos inmobiliarios en la costa ecuatoriana. Pagas solo cuando vendes.</p>
          {para && <p className="mt-10 text-white/70">Preparada para <strong className="text-white">{para}</strong></p>}
        </div>
      </Slide>

      {/* 2. Quiénes somos */}
      <Slide>
        <Kicker>Quiénes somos</Kicker>
        <h2 className="max-w-3xl font-serif text-4xl font-bold">Desarrollamos, verificamos y vendemos tierra en la costa</h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          <p className="text-lg leading-relaxed text-primary/80">
            Grupo 3i es una empresa inmobiliaria con proyectos propios en la provincia de Santa Elena. Construimos nuestra plataforma para vender
            lotizaciones: mapa de cada solar, recorridos 360°, contacto directo por WhatsApp y una red de referidores que cobra por resultado.
          </p>
          <p className="text-lg leading-relaxed text-primary/80">
            Ahora abrimos esa misma plataforma a desarrolladores aliados. No somos un portal de clasificados: elegimos los proyectos, los
            verificamos legalmente y ganamos solo cuando tú vendes.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-3 gap-4 border-t border-black/10 pt-8 text-center">
          {[
            ['112', 'solares mapeados en la plataforma'],
            ['360°', 'recorridos ubicados sobre el mapa'],
            ['ES · EN', 'toda la experiencia, bilingüe'],
          ].map(([n, l]) => (
            <div key={l}>
              <p className="font-serif text-4xl font-bold text-primary">{n}</p>
              <p className="mt-1 text-sm text-brand-gray">{l}</p>
            </div>
          ))}
        </div>
      </Slide>

      {/* 3. El problema */}
      <Slide dark>
        <Kicker light>El modelo de siempre</Kicker>
        <h2 className="max-w-3xl font-serif text-4xl font-bold">En un portal pagas por estar visible. Con nosotros, por vender.</h2>
        <div className="mt-10 overflow-hidden rounded-2xl bg-white text-primary">
          <table className="w-full text-left text-sm sm:text-base">
            <thead className="bg-light text-xs uppercase tracking-wide text-brand-gray">
              <tr>
                <th className="px-5 py-3" />
                <th className="px-5 py-3">Portal de clasificados</th>
                <th className="px-5 py-3 text-primary">Grupo 3i</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map(([k, a, b]) => (
                <tr key={k} className="border-t border-black/5">
                  <td className="px-5 py-3 font-medium">{k}</td>
                  <td className="px-5 py-3 text-brand-gray">{a}</td>
                  <td className="px-5 py-3 font-semibold">✓ {b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Slide>

      {/* 4. Cómo funciona */}
      <Slide>
        <Kicker>Cómo funciona</Kicker>
        <h2 className="font-serif text-4xl font-bold">De la firma a la venta, en cinco pasos</h2>
        <ol className="mt-12 grid gap-4 sm:grid-cols-5">
          {STEPS.map(({ icon: Icon, t, d }, i) => (
            <li key={t} className="relative rounded-2xl bg-light p-5">
              <span className="absolute right-4 top-3 font-serif text-3xl font-bold text-secondary/40">{i + 1}</span>
              <Icon className="h-7 w-7 text-accent" strokeWidth={1.6} />
              <p className="mt-4 font-semibold">{t}</p>
              <p className="mt-2 text-sm leading-relaxed text-brand-gray">{d}</p>
            </li>
          ))}
        </ol>
      </Slide>

      {/* 5. Herramientas */}
      <Slide>
        <Kicker>Herramientas incluidas</Kicker>
        <h2 className="font-serif text-4xl font-bold">Todo lo que tu proyecto necesita para venderse solo</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {TOOLS.map(({ icon: Icon, t, d }) => (
            <div key={t} className="rounded-2xl border border-black/10 p-5">
              <Icon className="h-6 w-6 text-accent" strokeWidth={1.6} />
              <p className="mt-3 font-semibold">{t}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-brand-gray">{d}</p>
            </div>
          ))}
        </div>
      </Slide>

      {/* 6. Tarifas */}
      <Slide dark>
        <Kicker light>Tarifas</Kicker>
        <h2 className="font-serif text-4xl font-bold">Un solo plan. Sin mensualidades.</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            ['$300', 'Alta por proyecto', 'Pago único: carga del plano, fotos, 360°, traducción y verificación legal.'],
            ['8 %', 'Venta por la plataforma', 'Contactos que llegan por la ficha, el mapa, los referidores o nuestras campañas. Incluye la comisión del referidor.'],
            ['2 %', 'Venta a tus contactos', 'Clientes que tú consigues y registras en tu portal para usar nuestras herramientas.'],
          ].map(([n, t, d]) => (
            <div key={t} className="rounded-2xl bg-white/10 p-6 ring-1 ring-white/15">
              <p className="font-serif text-5xl font-bold text-secondary">{n}</p>
              <p className="mt-3 font-semibold">{t}</p>
              <p className="mt-2 text-sm leading-relaxed text-white/70">{d}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-white/60">Valores más impuestos de ley. Destaque en portada disponible como servicio adicional.</p>
      </Slide>

      {/* 7. Ejemplo */}
      <Slide>
        <Kicker>Ejemplo</Kicker>
        <h2 className="font-serif text-4xl font-bold">Un lote de {money(price)}, financiado</h2>
        <p className="mt-3 max-w-3xl text-brand-gray">
          La comisión se paga a medida que tu cliente te paga: nunca adelantas dinero que aún no cobraste.
        </p>
        <div className="mt-10 overflow-hidden rounded-2xl border border-black/10">
          <table className="w-full text-left">
            <thead className="bg-light text-xs uppercase tracking-wide text-brand-gray">
              <tr>
                <th className="px-5 py-3">Pago del cliente</th>
                <th className="px-5 py-3 text-right">Monto</th>
                <th className="px-5 py-3 text-right">Comisión 8 %</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-black/5">
                <td className="px-5 py-3">Entrada</td>
                <td className="px-5 py-3 text-right tabular-nums">{money(entry)}</td>
                <td className="px-5 py-3 text-right tabular-nums">{money(entry * 0.08)}</td>
              </tr>
              <tr className="border-t border-black/5">
                <td className="px-5 py-3">Cada cuota mensual (×30)</td>
                <td className="px-5 py-3 text-right tabular-nums">{money(cuota)}</td>
                <td className="px-5 py-3 text-right tabular-nums">{money(cuota * 0.08)}</td>
              </tr>
              <tr className="border-t-2 border-primary/20 font-semibold">
                <td className="px-5 py-3">Total</td>
                <td className="px-5 py-3 text-right tabular-nums">{money(price)}</td>
                <td className="px-5 py-3 text-right tabular-nums">{money(price * 0.08)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-brand-gray">
          Si el cliente desiste, las comisiones de pagos no cobrados se anulan. Si no vendes, no pagas comisión.
        </p>
      </Slide>

      {/* 8. Reglas claras */}
      <Slide>
        <Kicker>Reglas claras</Kicker>
        <h2 className="font-serif text-4xl font-bold">Transparencia para los dos lados</h2>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2">
          {[
            ['Registro con fecha', 'Cada contacto queda registrado antes de llegar a ti, con fecha, número y origen. Lo ves en tu portal.'],
            ['Atribución de 180 días', 'Si un contacto de la plataforma compra dentro de 180 días, la venta lleva comisión. Después queda libre.'],
            ['Documentos privados', 'Tus escrituras y aprobaciones solo las ve nuestro equipo legal. El público ve el sello.'],
            ['Sin letra pequeña', 'Contrato de un año, renovable, con 30 días de aviso para terminarlo.'],
          ].map(([t, d]) => (
            <li key={t} className="rounded-2xl bg-light p-6">
              <p className="font-semibold">{t}</p>
              <p className="mt-2 text-sm leading-relaxed text-brand-gray">{d}</p>
            </li>
          ))}
        </ul>
      </Slide>

      {/* 9. Contacto */}
      <Slide dark>
        <Kicker light>Siguiente paso</Kicker>
        <h2 className="max-w-3xl font-serif text-4xl font-bold">Agendemos una llamada de 20 minutos y revisamos tu proyecto</h2>
        <div className="mt-10 flex flex-wrap gap-3 print:hidden">
          {wa && (
            <a
              href={`https://wa.me/${wa}?text=${encodeURIComponent(`Hola, vi la propuesta comercial de Grupo 3i${para ? ` (${para})` : ''} y quiero publicar mi proyecto.`)}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-[#25D366] px-6 py-3 font-semibold text-white"
            >
              Escríbenos por WhatsApp
            </a>
          )}
          <Link to="/publica-tu-proyecto#solicitud" className="rounded-lg bg-secondary px-6 py-3 font-semibold text-primary">
            Solicitar el alta
          </Link>
        </div>
        <div className="mt-12 text-white/70">
          <p className="font-semibold text-white">Grupo 3i</p>
          <p>grupo3i.com/publica-tu-proyecto</p>
          {contact?.whatsapp && <p>WhatsApp {contact.whatsapp}</p>}
          {contact?.email && <p>{contact.email}</p>}
        </div>
      </Slide>
    </div>
  );
}
