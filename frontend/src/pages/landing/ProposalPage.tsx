import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BadgeCheck, BarChart3, Box, CalendarCheck, FileSignature, HandCoins, Languages, Map, MessageCircle, Printer, Search, Users,
} from 'lucide-react';
import { Seo } from '@/components/shared/Seo';
import { useSectionContent } from '@/hooks/useSiteContent';
import { Link, useLang } from '@/hooks/useLang';

// Propuesta comercial para desarrolladores (/publica-tu-proyecto/propuesta y
// /en/publica-tu-proyecto/propuesta), al estilo de las de los portales
// inmobiliarios pero con nuestro modelo: pago por éxito. Láminas en pantalla,
// una por página al imprimir (PDF). `?para=Nombre` la personaliza.
// Los textos viven aquí en los dos idiomas: es un documento comercial cerrado.

const TX = {
  es: {
    seo: 'Propuesta comercial para desarrolladores',
    back: '← Volver',
    pdf: 'Descargar PDF',
    coverKicker: 'Propuesta comercial',
    coverTitle: 'Vende tus lotes con la red de Grupo 3i',
    coverSub: 'Vitrina curada de proyectos inmobiliarios en la costa ecuatoriana. Pagas solo cuando vendes.',
    preparedFor: 'Preparada para',
    aboutKicker: 'Quiénes somos',
    aboutTitle: 'Desarrollamos, verificamos y vendemos tierra en la costa',
    about1:
      'Grupo 3i es una empresa inmobiliaria con proyectos propios en la provincia de Santa Elena. Construimos nuestra plataforma para vender lotizaciones: mapa de cada solar, recorridos 360°, contacto directo por WhatsApp y una red de referidores que cobra por resultado.',
    about2:
      'Ahora abrimos esa misma plataforma a desarrolladores aliados. No somos un portal de clasificados: elegimos los proyectos, los verificamos legalmente y ganamos solo cuando tú vendes.',
    stats: [
      ['112', 'solares mapeados en la plataforma'],
      ['360°', 'recorridos ubicados sobre el mapa'],
      ['ES · EN', 'toda la experiencia, bilingüe'],
    ],
    compareKicker: 'El modelo de siempre',
    compareTitle: 'En un portal pagas por estar visible. Con nosotros, por vender.',
    compareCols: ['Portal de clasificados', 'Grupo 3i'],
    compare: [
      ['Cómo pagas', 'Plan por avisos, vendas o no', 'Comisión solo por venta concretada'],
      ['Costo si no vendes', 'El plan completo', '$0 (solo el alta)'],
      ['Quién empuja tu proyecto', 'El buscador del portal', 'Plataforma + red de referidores'],
      ['Lotización', 'Un aviso por inmueble', 'Mapa interactivo con todos los lotes'],
      ['Confianza del comprador', 'Sin revisión legal', 'Sello «Verificado por Grupo 3i»'],
      ['Comprador extranjero', 'Limitado', 'Todo en español e inglés'],
      ['Seguimiento de clientes', 'Por tu cuenta', 'CRM incluido con vendedores y avisos'],
      ['Tu propia web', 'Enlace al aviso del portal', 'El mapa interactivo dentro de tu web, con tu marca'],
    ],
    stepsKicker: 'Cómo funciona',
    stepsTitle: 'De la firma a la venta, en cinco pasos',
    steps: [
      ['Alta', 'Firmamos, cargamos tu plano de lotes, fotos y recorridos 360°. Pago único de $300.'],
      ['Verificación', 'Revisamos escritura, gravámenes y aprobación municipal. Tu proyecto recibe el sello.'],
      ['Publicación', 'Ficha en español e inglés, mapa interactivo y difusión por la red de referidores.'],
      ['Contactos', 'Cada interesado queda registrado y llega a tu WhatsApp con nombre, solar y origen.'],
      ['Venta', 'Declaras la venta y pagas la comisión a medida que tu cliente te paga.'],
    ],
    toolsKicker: 'Herramientas incluidas',
    toolsTitle: 'Todo lo que tu proyecto necesita para venderse',
    tools: [
      ['Mapa interactivo de lotes', 'Precio, medidas, linderos y disponibilidad en vivo. El cliente elige su solar desde el celular y lo comparte por WhatsApp.'],
      ['Recorridos 360°', 'Panorámicas ubicadas y orientadas sobre el mapa. Se recorren con el dedo o moviendo el teléfono.'],
      ['Red Refiere y gana', 'Socios que comparten tu proyecto con enlaces propios y cobran solo si se vende.'],
      ['Bilingüe de verdad', 'Ficha, mapa, vistas previas en redes y formularios en español e inglés para el comprador extranjero.'],
      ['Métricas en vivo', 'Visitas, solares vistos, aperturas del 360°, clics a WhatsApp, contactos y ventas, semana a semana.'],
      ['CRM con tu equipo', 'Embudo por etapas, vendedores con reparto automático, tareas, plantillas de WhatsApp, avisos al celular y reportes.'],
    ],
    portalKicker: 'Tu portal',
    portalTitle: 'Sabes qué funciona, cada semana',
    portalSub: 'Vista ilustrativa del panel de métricas de tu proyecto, con datos de ejemplo.',
    funnelTitle: 'Embudo del proyecto',
    funnel: [
      ['Vieron el proyecto', 812],
      ['Vieron un solar', 402],
      ['Abrieron un 360°', 155],
      ['Tocaron WhatsApp', 61],
      ['Dejaron sus datos', 33],
      ['Compraron', 4],
    ] as [string, number][],
    weeklyTitle: 'Visitas por semana',
    lotsTitle: 'Solares con más interés',
    lotsCols: ['Solar', 'Vistas', 'WhatsApp'],
    originTitle: 'Origen de los contactos',
    origin: [
      ['Por referidos', 19],
      ['Por la plataforma', 11],
      ['Propios', 3],
    ] as [string, number][],
    crmKicker: 'CRM de ventas',
    crmTitle: 'Ningún cliente se enfría',
    crmSub: 'Cada contacto entra solo a tu embudo. Lo mueves de etapa, agendas la visita y le escribes con un clic.',
    crmStages: ['Nuevo', 'Contactado', 'Visita', 'Negociación', 'Venta'],
    crmCards: [
      ['María G.', 'Solar A16', 'Referido', 0],
      ['John P.', 'Solar B1', 'Plataforma', 0],
      ['Carlos R.', 'Solar A15-2', 'Referido', 1],
      ['Ana T.', 'Solar C8', 'Propio', 2],
      ['Luis M.', 'Solar A25-1', 'Plataforma', 3],
      ['Sofía V.', 'Solar B11', 'Referido', 4],
    ] as [string, string, string, number][],
    crmFeatures: [
      'Vendedores con reparto automático: cada uno ve solo sus clientes',
      'Avisos al celular: contacto nuevo y tareas por vencer',
      'Tareas, agenda de visitas e historial completo de cada cliente',
      'Plantillas de WhatsApp con el nombre, el proyecto y el solar',
      'Reportes: primera respuesta, conversión, motivos de pérdida y ranking',
    ],
    crmSoon: 'Disponible hoy · incluido sin costo adicional',
    priceKicker: 'Tarifas',
    priceTitle: 'Un solo plan. Sin mensualidades.',
    prices: [
      ['$300', 'Alta por proyecto', 'Pago único: carga del plano, fotos, 360°, traducción y verificación legal.'],
      ['8 %', 'Venta por la plataforma', 'Contactos que llegan por la ficha, el mapa, los referidores o nuestras campañas. Incluye la comisión del referidor.'],
      ['2 %', 'Venta a tus contactos', 'Clientes que tú consigues y registras en tu portal para usar nuestras herramientas.'],
    ],
    mapPlanTitle: 'Plan Mapa para tu web',
    mapPlan: 'Tu mapa interactivo de lotes con tu logo y tu color, dentro de tu web o en tu propio dominio, con CRM incluido. 9/mes hasta 150 lotes · 9/mes con más. También disponible sin publicar en la vitrina.',
    priceNote: 'Valores más impuestos de ley. Destaque en portada disponible como servicio adicional.',
    exKicker: 'Ejemplo',
    exTitle: (p: string) => `Un lote de ${p}, financiado`,
    exSub: 'La comisión se paga a medida que tu cliente te paga: nunca adelantas dinero que aún no cobraste.',
    exCols: ['Pago del cliente', 'Monto', 'Comisión 8 %'],
    exRows: ['Entrada', 'Cada cuota mensual (×30)', 'Total'],
    exNote: 'Si el cliente desiste, las comisiones de pagos no cobrados se anulan. Si no vendes, no pagas comisión.',
    rulesKicker: 'Reglas claras',
    rulesTitle: 'Transparencia para los dos lados',
    rules: [
      ['Registro con fecha', 'Cada contacto queda registrado antes de llegar a ti, con fecha, número y origen. Lo ves en tu portal.'],
      ['Atribución de 180 días', 'Si un contacto de la plataforma compra dentro de 180 días, la venta lleva comisión. Después queda libre.'],
      ['Documentos privados', 'Tus escrituras y aprobaciones solo las ve nuestro equipo legal. El público ve el sello.'],
      ['Sin letra pequeña', 'Contrato de un año, renovable, con 30 días de aviso para terminarlo.'],
    ],
    nextKicker: 'Siguiente paso',
    nextTitle: 'Agendemos una llamada de 20 minutos y revisamos tu proyecto',
    wa: 'Escríbenos por WhatsApp',
    waMsg: (para?: string) => `Hola, vi la propuesta comercial de Grupo 3i${para ? ` (${para})` : ''} y quiero publicar mi proyecto.`,
    apply: 'Solicitar el alta',
    manual: 'Manual de herramientas',
  },
  en: {
    seo: 'Commercial proposal for developers',
    back: '← Back',
    pdf: 'Download PDF',
    coverKicker: 'Commercial proposal',
    coverTitle: 'Sell your lots with the Grupo 3i network',
    coverSub: 'A curated showcase of real estate projects on the Ecuadorian coast. You only pay when you sell.',
    preparedFor: 'Prepared for',
    aboutKicker: 'Who we are',
    aboutTitle: 'We develop, verify and sell land on the coast',
    about1:
      'Grupo 3i is a real estate company with its own projects in the province of Santa Elena. We built our platform to sell land developments: a map of every lot, 360° tours, direct WhatsApp contact and a referral network paid on results.',
    about2:
      'Now we are opening the same platform to partner developers. We are not a listings portal: we select the projects, verify them legally and only earn when you sell.',
    stats: [
      ['112', 'lots mapped on the platform'],
      ['360°', 'tours placed on the map'],
      ['ES · EN', 'the whole experience, bilingual'],
    ],
    compareKicker: 'The usual model',
    compareTitle: 'On a portal you pay to be seen. With us, you pay when you sell.',
    compareCols: ['Listings portal', 'Grupo 3i'],
    compare: [
      ['How you pay', 'Listing plans, sale or no sale', 'Commission only on closed sales'],
      ['Cost if you don’t sell', 'The full plan', '$0 (onboarding only)'],
      ['Who promotes your project', 'The portal search', 'Platform + referral network'],
      ['Land developments', 'One listing per property', 'Interactive map with every lot'],
      ['Buyer trust', 'No legal review', '“Verified by Grupo 3i” seal'],
      ['Foreign buyers', 'Limited', 'Everything in Spanish and English'],
      ['Client follow-up', 'On your own', 'Built-in CRM with sales reps and alerts'],
      ['Your own website', 'A link to the portal listing', 'The interactive map inside your site, with your brand'],
    ],
    stepsKicker: 'How it works',
    stepsTitle: 'From signing to selling, in five steps',
    steps: [
      ['Onboarding', 'We sign, load your lot plan, photos and 360° tours. One-time fee of $300.'],
      ['Verification', 'We review the deed, liens and municipal approval. Your project gets the seal.'],
      ['Publishing', 'Listing in Spanish and English, interactive map and promotion through the referral network.'],
      ['Leads', 'Every prospect is registered and reaches your WhatsApp with name, lot and source.'],
      ['Sale', 'You report the sale and pay the commission as your buyer pays you.'],
    ],
    toolsKicker: 'Included tools',
    toolsTitle: 'Everything your project needs to sell',
    tools: [
      ['Interactive lot map', 'Price, size, boundaries and live availability. Buyers pick their lot on their phone and share it on WhatsApp.'],
      ['360° tours', 'Panoramas placed and oriented on the map. Explore by swiping or moving the phone.'],
      ['Refer & Earn network', 'Members share your project with their own links and are paid only when it sells.'],
      ['Truly bilingual', 'Listing, map, social previews and forms in Spanish and English for foreign buyers.'],
      ['Live metrics', 'Visits, lots viewed, 360° opens, WhatsApp clicks, leads and sales, week by week.'],
      ['CRM for your team', 'Stage pipeline, sales reps with automatic lead routing, tasks, WhatsApp templates, phone alerts and reports.'],
    ],
    portalKicker: 'Your portal',
    portalTitle: 'Know what works, every week',
    portalSub: 'Illustrative view of your project’s metrics dashboard, with sample data.',
    funnelTitle: 'Project funnel',
    funnel: [
      ['Viewed the project', 812],
      ['Viewed a lot', 402],
      ['Opened a 360°', 155],
      ['Tapped WhatsApp', 61],
      ['Left their details', 33],
      ['Bought', 4],
    ] as [string, number][],
    weeklyTitle: 'Visits per week',
    lotsTitle: 'Most popular lots',
    lotsCols: ['Lot', 'Views', 'WhatsApp'],
    originTitle: 'Lead sources',
    origin: [
      ['Referrals', 19],
      ['Platform', 11],
      ['Your own', 3],
    ] as [string, number][],
    crmKicker: 'Sales CRM',
    crmTitle: 'No lead goes cold',
    crmSub: 'Every lead lands in your pipeline automatically. Move it through stages, schedule the visit and message them in one click.',
    crmStages: ['New', 'Contacted', 'Visit', 'Negotiation', 'Sold'],
    crmCards: [
      ['María G.', 'Lot A16', 'Referral', 0],
      ['John P.', 'Lot B1', 'Platform', 0],
      ['Carlos R.', 'Lot A15-2', 'Referral', 1],
      ['Ana T.', 'Lot C8', 'Own', 2],
      ['Luis M.', 'Lot A25-1', 'Platform', 3],
      ['Sofía V.', 'Lot B11', 'Referral', 4],
    ] as [string, string, string, number][],
    crmFeatures: [
      'Sales reps with automatic routing: each sees only their own leads',
      'Phone alerts: new lead and tasks about to be due',
      'Tasks, visit calendar and full client history',
      'WhatsApp templates with name, project and lot',
      'Reports: first response, conversion, loss reasons and leaderboard',
    ],
    crmSoon: 'Available today · included at no extra cost',
    priceKicker: 'Pricing',
    priceTitle: 'One plan. No monthly fees.',
    prices: [
      ['$300', 'Onboarding per project', 'One-time: lot plan, photos, 360°, translation and legal verification.'],
      ['8%', 'Platform sale', 'Leads that come through the listing, the map, referrers or our campaigns. Referral commission included.'],
      ['2%', 'Sale to your own leads', 'Buyers you find yourself and register in your portal to use our tools.'],
    ],
    mapPlanTitle: 'Map plan for your website',
    mapPlan: 'Your interactive lot map with your logo and color, inside your website or on your own domain, CRM included. 9/month up to 150 lots · 9/month above. Also available without listing on our showcase.',
    priceNote: 'Plus applicable taxes. Homepage featuring available as an add-on.',
    exKicker: 'Example',
    exTitle: (p: string) => `A ${p} lot, financed`,
    exSub: 'The commission is paid as your buyer pays you: you never advance money you haven’t collected.',
    exCols: ['Buyer payment', 'Amount', '8% commission'],
    exRows: ['Down payment', 'Each monthly installment (×30)', 'Total'],
    exNote: 'If the buyer withdraws, commissions on uncollected payments are cancelled. No sale, no commission.',
    rulesKicker: 'Clear rules',
    rulesTitle: 'Transparency on both sides',
    rules: [
      ['Time-stamped leads', 'Every lead is registered before it reaches you, with date, number and source. You see it in your portal.'],
      ['180-day attribution', 'If a platform lead buys within 180 days, the sale carries commission. After that it is free.'],
      ['Private documents', 'Only our legal team sees your deeds and approvals. The public sees the seal.'],
      ['No fine print', 'One-year agreement, renewable, with 30 days’ notice to terminate.'],
    ],
    nextKicker: 'Next step',
    nextTitle: 'Let’s book a 20-minute call and review your project',
    wa: 'Message us on WhatsApp',
    waMsg: (para?: string) => `Hi, I saw the Grupo 3i commercial proposal${para ? ` (${para})` : ''} and want to list my project.`,
    apply: 'Apply now',
    manual: 'Tools guide',
  },
};

const STEP_ICONS = [FileSignature, BadgeCheck, Search, MessageCircle, HandCoins];
const TOOL_ICONS = [Map, Box, Users, Languages, BarChart3, CalendarCheck];
const WEEKLY = [120, 180, 150, 260, 310, 290, 380, 420];
const LOTS: [string, number, number][] = [
  ['A16', 92, 14],
  ['A15-2', 80, 11],
  ['B1', 61, 6],
  ['C12', 44, 4],
];

function Slide({ children, dark, bg }: { children: ReactNode; dark?: boolean; bg?: ReactNode }) {
  return (
    <section className={`proposal-slide relative overflow-hidden ${dark ? 'bg-primary text-white' : 'bg-white text-primary'} print:h-[210mm]`}>
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

/** Tarjeta de gráfico de ejemplo (una sola serie, dorado de marca). */
function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-primary">{title}</p>
      {children}
    </div>
  );
}

function Bars({ rows }: { rows: [string, number][] }) {
  const max = Math.max(...rows.map((r) => r[1]));
  return (
    <ul className="space-y-1.5">
      {rows.map(([l, v]) => (
        <li key={l} className="grid grid-cols-[7.5rem_1fr_2.5rem] items-center gap-2 text-xs">
          <span className="truncate text-brand-gray">{l}</span>
          <span className="h-2.5 rounded-r bg-light">
            <span className="block h-2.5 rounded-r-[4px] bg-secondary" style={{ width: `${(v / max) * 100}%` }} />
          </span>
          <span className="text-right font-medium tabular-nums text-primary">{v}</span>
        </li>
      ))}
    </ul>
  );
}

const money = (n: number) => `$${n.toLocaleString('en-US')}`;

export default function ProposalPage() {
  const { lang } = useLang();
  const tx = TX[lang === 'en' ? 'en' : 'es'];
  const [params] = useSearchParams();
  const para = params.get('para')?.trim().slice(0, 80);
  const { data: contact } = useSectionContent('contact');
  const wa = (contact?.whatsapp || '').replace(/\D/g, '');
  const year = new Date().getFullYear();

  const price = 40000;
  const entry = 10000;
  const cuota = 1000;
  const weeklyMax = Math.max(...WEEKLY);

  return (
    <div className="bg-light print:bg-white">
      <Seo title={tx.seo} noindex />
      <style>{`@media print { @page { size: A4 landscape; margin: 0 } .proposal-slide { break-after: page; } }`}</style>

      <div className="fixed right-4 top-4 z-20 flex gap-2 print:hidden">
        <Link to="/publica-tu-proyecto" className="rounded-full bg-white/90 px-4 py-2 text-sm text-primary shadow">
          {tx.back}
        </Link>
        <button onClick={() => window.print()} className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-primary shadow">
          <Printer className="h-4 w-4" /> {tx.pdf}
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
        <img src="/images/logotipo-light.svg" alt="Grupo 3i" className="h-10 w-auto self-start" />
        <p className="mt-16 text-sm uppercase tracking-[0.3em] text-secondary">
          {tx.coverKicker} {year}
        </p>
        <h1 className="mt-4 max-w-3xl font-serif text-5xl font-bold leading-tight sm:text-6xl">{tx.coverTitle}</h1>
        <p className="mt-6 max-w-2xl text-lg text-white/80">{tx.coverSub}</p>
        {para && (
          <p className="mt-10 text-white/70">
            {tx.preparedFor} <strong className="text-white">{para}</strong>
          </p>
        )}
      </Slide>

      {/* 2. Quiénes somos */}
      <Slide>
        <Kicker>{tx.aboutKicker}</Kicker>
        <h2 className="max-w-3xl font-serif text-4xl font-bold">{tx.aboutTitle}</h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          <p className="text-lg leading-relaxed text-primary/80">{tx.about1}</p>
          <p className="text-lg leading-relaxed text-primary/80">{tx.about2}</p>
        </div>
        <div className="mt-12 grid grid-cols-3 gap-4 border-t border-black/10 pt-8 text-center">
          {tx.stats.map(([n, l]) => (
            <div key={l}>
              <p className="font-serif text-4xl font-bold text-primary">{n}</p>
              <p className="mt-1 text-sm text-brand-gray">{l}</p>
            </div>
          ))}
        </div>
      </Slide>

      {/* 3. Comparación */}
      <Slide dark>
        <Kicker light>{tx.compareKicker}</Kicker>
        <h2 className="max-w-3xl font-serif text-4xl font-bold">{tx.compareTitle}</h2>
        <div className="mt-10 overflow-x-auto rounded-2xl bg-white text-primary">
          <table className="w-full text-left text-sm sm:text-base">
            <thead className="bg-light text-xs uppercase tracking-wide text-brand-gray">
              <tr>
                <th className="px-5 py-3" />
                <th className="px-5 py-3">{tx.compareCols[0]}</th>
                <th className="px-5 py-3 text-primary">{tx.compareCols[1]}</th>
              </tr>
            </thead>
            <tbody>
              {tx.compare.map(([k, a, b]) => (
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
        <Kicker>{tx.stepsKicker}</Kicker>
        <h2 className="font-serif text-4xl font-bold">{tx.stepsTitle}</h2>
        <ol className="mt-12 grid gap-4 sm:grid-cols-5">
          {tx.steps.map(([t, d], i) => {
            const Icon = STEP_ICONS[i];
            return (
              <li key={t} className="relative rounded-2xl bg-light p-5">
                <span className="absolute right-4 top-3 font-serif text-3xl font-bold text-secondary/40">{i + 1}</span>
                <Icon className="h-7 w-7 text-accent" strokeWidth={1.6} />
                <p className="mt-4 font-semibold">{t}</p>
                <p className="mt-2 text-sm leading-relaxed text-brand-gray">{d}</p>
              </li>
            );
          })}
        </ol>
      </Slide>

      {/* 5. Herramientas */}
      <Slide>
        <Kicker>{tx.toolsKicker}</Kicker>
        <h2 className="font-serif text-4xl font-bold">{tx.toolsTitle}</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {tx.tools.map(([t, d], i) => {
            const Icon = TOOL_ICONS[i];
            return (
              <div key={t} className="rounded-2xl border border-black/10 p-5">
                <Icon className="h-6 w-6 text-accent" strokeWidth={1.6} />
                <p className="mt-3 font-semibold">{t}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-brand-gray">{d}</p>
              </div>
            );
          })}
        </div>
      </Slide>

      {/* 6. Portal y métricas (ilustrativo) */}
      <Slide>
        <Kicker>{tx.portalKicker}</Kicker>
        <h2 className="font-serif text-4xl font-bold">{tx.portalTitle}</h2>
        <p className="mt-2 text-sm text-brand-gray">{tx.portalSub}</p>
        <div className="mt-8 grid gap-4 rounded-2xl bg-light p-4 sm:grid-cols-2 sm:p-6">
          <Panel title={tx.funnelTitle}>
            <Bars rows={tx.funnel} />
          </Panel>
          <Panel title={tx.weeklyTitle}>
            <div className="flex h-[104px] items-end gap-[2px] border-b border-black/10">
              {WEEKLY.map((v, i) => (
                <div key={i} className="flex-1 rounded-t-[4px] bg-secondary" style={{ height: `${(v / weeklyMax) * 100}%` }} title={String(v)} />
              ))}
            </div>
            <p className="mt-1 text-right text-[10px] text-brand-gray">max. {weeklyMax}</p>
          </Panel>
          <Panel title={tx.lotsTitle}>
            <table className="w-full text-xs">
              <thead className="text-brand-gray">
                <tr>
                  <th className="pb-1 text-left font-normal">{tx.lotsCols[0]}</th>
                  <th className="pb-1 text-right font-normal">{tx.lotsCols[1]}</th>
                  <th className="pb-1 text-right font-normal">{tx.lotsCols[2]}</th>
                </tr>
              </thead>
              <tbody>
                {LOTS.map(([c, v, w]) => (
                  <tr key={c} className="border-t border-black/5">
                    <td className="py-1 font-medium text-primary">{c}</td>
                    <td className="py-1 text-right tabular-nums">{v}</td>
                    <td className="py-1 text-right tabular-nums">{w}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
          <Panel title={tx.originTitle}>
            <Bars rows={tx.origin} />
          </Panel>
        </div>
      </Slide>

      {/* 7. CRM */}
      <Slide dark>
        <Kicker light>{tx.crmKicker}</Kicker>
        <h2 className="font-serif text-4xl font-bold">{tx.crmTitle}</h2>
        <p className="mt-2 max-w-3xl text-white/70">{tx.crmSub}</p>
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_18rem]">
          <div className="grid grid-cols-5 gap-2 overflow-x-auto rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
            {tx.crmStages.map((stage, si) => (
              <div key={stage} className="min-w-[7rem]">
                <p className="mb-2 border-b-2 border-secondary pb-1 text-[11px] font-semibold uppercase tracking-wide text-white/80">{stage}</p>
                <div className="space-y-2">
                  {tx.crmCards
                    .filter((c) => c[3] === si)
                    .map(([n, lot, src]) => (
                      <div key={n} className="rounded-lg bg-white p-2 text-primary shadow">
                        <p className="text-xs font-semibold">{n}</p>
                        <p className="text-[11px] text-brand-gray">{lot}</p>
                        <span className="mt-1 inline-block rounded-full bg-secondary/25 px-1.5 text-[10px]">{src}</span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
          <div>
            <ul className="space-y-3 text-sm">
              {tx.crmFeatures.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="text-secondary">✓</span>
                  <span className="text-white/85">{f}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 inline-block rounded-full bg-secondary/20 px-3 py-1 text-xs text-secondary">{tx.crmSoon}</p>
          </div>
        </div>
      </Slide>

      {/* 8. Tarifas */}
      <Slide dark>
        <Kicker light>{tx.priceKicker}</Kicker>
        <h2 className="font-serif text-4xl font-bold">{tx.priceTitle}</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {tx.prices.map(([n, t, d]) => (
            <div key={t} className="rounded-2xl bg-white/10 p-6 ring-1 ring-white/15">
              <p className="font-serif text-5xl font-bold text-secondary">{n}</p>
              <p className="mt-3 font-semibold">{t}</p>
              <p className="mt-2 text-sm leading-relaxed text-white/70">{d}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-2xl bg-secondary/15 p-5 ring-1 ring-secondary/30">
          <p className="font-semibold text-secondary">{tx.mapPlanTitle}</p>
          <p className="mt-1 text-sm text-white/80">{tx.mapPlan}</p>
        </div>
        <p className="mt-6 text-sm text-white/60">{tx.priceNote}</p>
      </Slide>

      {/* 9. Ejemplo */}
      <Slide>
        <Kicker>{tx.exKicker}</Kicker>
        <h2 className="font-serif text-4xl font-bold">{tx.exTitle(money(price))}</h2>
        <p className="mt-3 max-w-3xl text-brand-gray">{tx.exSub}</p>
        <div className="mt-10 overflow-hidden rounded-2xl border border-black/10">
          <table className="w-full text-left">
            <thead className="bg-light text-xs uppercase tracking-wide text-brand-gray">
              <tr>
                <th className="px-5 py-3">{tx.exCols[0]}</th>
                <th className="px-5 py-3 text-right">{tx.exCols[1]}</th>
                <th className="px-5 py-3 text-right">{tx.exCols[2]}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-black/5">
                <td className="px-5 py-3">{tx.exRows[0]}</td>
                <td className="px-5 py-3 text-right tabular-nums">{money(entry)}</td>
                <td className="px-5 py-3 text-right tabular-nums">{money(entry * 0.08)}</td>
              </tr>
              <tr className="border-t border-black/5">
                <td className="px-5 py-3">{tx.exRows[1]}</td>
                <td className="px-5 py-3 text-right tabular-nums">{money(cuota)}</td>
                <td className="px-5 py-3 text-right tabular-nums">{money(cuota * 0.08)}</td>
              </tr>
              <tr className="border-t-2 border-primary/20 font-semibold">
                <td className="px-5 py-3">{tx.exRows[2]}</td>
                <td className="px-5 py-3 text-right tabular-nums">{money(price)}</td>
                <td className="px-5 py-3 text-right tabular-nums">{money(price * 0.08)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-brand-gray">{tx.exNote}</p>
      </Slide>

      {/* 10. Reglas */}
      <Slide>
        <Kicker>{tx.rulesKicker}</Kicker>
        <h2 className="font-serif text-4xl font-bold">{tx.rulesTitle}</h2>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2">
          {tx.rules.map(([t, d]) => (
            <li key={t} className="rounded-2xl bg-light p-6">
              <p className="font-semibold">{t}</p>
              <p className="mt-2 text-sm leading-relaxed text-brand-gray">{d}</p>
            </li>
          ))}
        </ul>
      </Slide>

      {/* 11. Contacto */}
      <Slide dark>
        <Kicker light>{tx.nextKicker}</Kicker>
        <h2 className="max-w-3xl font-serif text-4xl font-bold">{tx.nextTitle}</h2>
        <div className="mt-10 flex flex-wrap gap-3 print:hidden">
          {wa && (
            <a
              href={`https://wa.me/${wa}?text=${encodeURIComponent(tx.waMsg(para))}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-[#25D366] px-6 py-3 font-semibold text-white"
            >
              {tx.wa}
            </a>
          )}
          <Link to="/publica-tu-proyecto#solicitud" className="rounded-lg bg-secondary px-6 py-3 font-semibold text-primary">
            {tx.apply}
          </Link>
          <Link to="/publica-tu-proyecto/manual" className="rounded-lg border border-white/30 px-6 py-3 font-semibold text-white">
            {tx.manual}
          </Link>
        </div>
        <div className="mt-12 text-white/70">
          <p className="font-semibold text-white">Grupo 3i</p>
          <p>grupo3i.com{lang === 'en' ? '/en' : ''}/publica-tu-proyecto</p>
          {contact?.whatsapp && <p>WhatsApp {contact.whatsapp}</p>}
          {contact?.email && <p>{contact.email}</p>}
        </div>
      </Slide>
    </div>
  );
}
