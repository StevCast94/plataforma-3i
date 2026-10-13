import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Download,
  BadgeCheck, BarChart3, Box, CalendarCheck, FileSignature, HandCoins, Languages, Map, MessageCircle, Search, Users,
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
    seo: 'Propuesta comercial para desarrolladoras',
    back: '← Volver',
    pdf: 'Descargar PDF',
    coverKicker: 'Propuesta comercial',
    coverTitle: 'Vende tus proyectos inmobiliarios con la red de Grupo 3i',
    typesLabel: 'Publicamos proyectos de',
    types: ['Lotes', 'Terrenos', 'Casas', 'Departamentos', 'Suites', 'Locales comerciales', 'Oficinas', 'Bodegas y galpones'],
    coverSub: 'Seleccionamos y verificamos cada proyecto que publicamos en la costa ecuatoriana. Tú pagas solo cuando vendes.',
    preparedFor: 'Preparada para',
    aboutKicker: 'Quiénes somos',
    aboutTitle: 'Desarrollamos, verificamos y comercializamos proyectos inmobiliarios en la costa',
    about1: 'Somos una inmobiliaria con proyectos propios en Santa Elena. Creamos esta plataforma para vender nuestros proyectos y hoy la abrimos a otras desarrolladoras: lotes, terrenos, casas, departamentos, suites, locales y oficinas.',
    about2: 'No somos un portal de anuncios: elegimos con quién trabajamos, verificamos cada proyecto y solo ganamos cuando tú vendes.',
    stats: [
      ['112', 'lotes en el mapa interactivo'],
      ['360°', 'recorridos de cada proyecto'],
      ['ES · EN', 'toda la experiencia en español e inglés'],
    ],
    compareKicker: 'Portal de anuncios vs. Grupo 3i',
    compareTitle: 'En un portal pagas por aparecer. Con nosotros, pagas cuando vendes.',
    compareCols: ['Portal de anuncios', 'Grupo 3i'],
    compare: [
      ['Cómo pagas', 'Un plan mensual, vendas o no', 'Una comisión, solo cuando vendes'],
      ['Si no vendes', 'Pagas el plan igual', 'No pagas comisión'],
      ['Quién promociona tu proyecto', 'Solo el buscador del portal', 'Nuestra plataforma, nuestras campañas y la red de referidores'],
      ['Tu inventario', 'Un anuncio por cada unidad', 'Todo el proyecto con disponibilidad en vivo y, en lotizaciones y casas, en un mapa interactivo'],
      ['Confianza del comprador', 'Nadie revisa los papeles', 'Sello «Verificado por Grupo 3i»'],
      ['Comprador extranjero', 'Poco o nada en inglés', 'Todo en español e inglés'],
      ['Seguimiento de clientes', 'Por tu cuenta', 'CRM incluido: cada cliente llega al WhatsApp de su asesor'],
      ['Tu propia web', 'Un enlace al anuncio', 'El mapa interactivo dentro de tu web, con tu marca'],
    ],
    stepsKicker: 'Cómo funciona',
    stepsTitle: 'De la firma a la venta, en cinco pasos',
    steps: [
      ['Alta', 'Cargamos tu inventario, los planos, las fotos y los recorridos 360°.'],
      ['Verificación', 'Revisamos escritura y permisos, y tu proyecto recibe el sello.'],
      ['Publicación', 'Tu ficha sale en español e inglés, con su mapa, y la difundimos.'],
      ['Contactos', 'Cada interesado llega al WhatsApp de tu asesor, con su nombre y la unidad que le interesa.'],
      ['Venta', 'Pagas la comisión a medida que tu cliente te paga.'],
    ],
    toolsKicker: 'Herramientas incluidas',
    toolsTitle: 'Todo lo que tu proyecto necesita para venderse',
    tools: [
      ['Inventario en vivo', 'Precio y disponibilidad de cada unidad en tiempo real; en lotizaciones y casas, en un mapa interactivo.'],
      ['Recorridos 360°', 'Lotizaciones, terrenos independientes, suites y departamentos: tu cliente los recorre sin viajar.'],
      ['Red Refiere y gana', 'Socios que recomiendan tu proyecto y cobran solo si se vende.'],
      ['Español e inglés', 'Listo para el comprador extranjero.'],
      ['Métricas en tiempo real', 'Visitas, unidades más vistas, contactos y ventas.'],
      ['CRM para tu equipo', 'Embudo, asesores, tareas y avisos al celular.'],
    ],
    portalKicker: 'Tu portal',
    portalTitle: 'Sabrás qué funciona, semana a semana',
    portalSub: 'Capturas reales del portal, con datos de una desarrolladora de demostración.',
    crmKicker: 'CRM de ventas',
    crmTitle: 'Ningún cliente se queda sin respuesta',
    crmSub: 'Cada contacto entra solo a tu embudo y se asigna a un asesor. Desde ahí cambias su etapa, agendas la visita y le escribes con un clic.',
    crmFeatures: [
      'Reparto automático entre tus asesores: cada uno ve solo sus clientes',
      'El cliente deja sus datos antes de abrir el chat y le escribe directamente a su asesor',
      'Avisos al celular de cada contacto nuevo y de las tareas por vencer',
      'Tareas, agenda de visitas e historial completo de cada cliente',
      'Plantillas de WhatsApp que ya incluyen el nombre, el proyecto y la unidad',
      'Reportes de tiempo de respuesta, conversión, motivos de pérdida, ranking de asesores y campaña de origen',
    ],
    crmSoon: 'Disponible hoy, sin costo adicional',
    leadsKicker: 'Captación y campañas',
    leadsTitle: 'Sabrás qué anuncio trajo cada venta',
    leadsItems: [
      'Una página de aterrizaje por proyecto, en español e inglés, lista para tus anuncios',
      'El cliente deja nombre y WhatsApp antes de abrir el chat: no se pierde ningún contacto',
      'Conexión con Google Ads, Meta (Facebook e Instagram) y TikTok',
      'Cada contacto guarda la campaña de la que vino, hasta el cierre',
      'Tus enlaces se ven con foto, precio y llamado a la acción al compartirlos por WhatsApp y redes',
    ],
    priceKicker: 'Condiciones',
    priceTitle: 'Una propuesta a la medida de tu proyecto',
    prices: [
      ['Según tu proyecto', 'Lotización, terreno, casas, departamentos o locales: cada tipo de proyecto tiene sus propias condiciones.'],
      ['Según los servicios', 'Eliges solo lo que necesitas: publicación, CRM, mapa, recorridos 360°, campañas, trámites o topografía.'],
      ['En privado', 'Te presentamos la propuesta económica en una reunión y por escrito, sin letra pequeña.'],
    ],
    mapPlanTitle: 'Opcional · Plan Mapa para tu web',
    mapPlan: 'Para lotizaciones y proyectos de casas: tu mapa interactivo con tu logo, dentro de tu web o en tu propio dominio, con CRM incluido.',
    priceNote: 'Los valores se acuerdan en privado. También puedes destacar tu proyecto en la portada como servicio adicional.',
    rulesKicker: 'Reglas claras',
    rulesTitle: 'Transparencia para ambas partes',
    rules: [
      ['Registro con fecha', 'Cada contacto queda registrado con su fecha y su origen, y lo ves en tu portal.'],
      ['Plazo de 180 días', 'Si un cliente que llegó por nosotros compra dentro de ese plazo, la venta paga comisión. Después, es libre.'],
      ['Documentos privados', 'Solo nuestro equipo legal ve tus escrituras. El público solo ve el sello.'],
      ['Sin letra pequeña', 'Contrato de un año, renovable, que puedes terminar con 30 días de aviso.'],
    ],
    nextKicker: 'Siguiente paso',
    nextTitle: 'Conversemos 20 minutos sobre tu proyecto',
    wa: 'Escríbenos por WhatsApp',
    waMsg: (para?: string) => `Hola, vi la propuesta comercial de Grupo 3i${para ? ` (${para})` : ''} y quiero publicar mi proyecto.`,
    apply: 'Solicitar el alta',
    manual: 'Manual de herramientas',
    gallery: 'Galería del sistema',
  },
  en: {
    seo: 'Partner proposal for developers',
    back: '← Back',
    pdf: 'Download PDF',
    coverKicker: 'Partner proposal',
    coverTitle: 'Sell your real estate projects through the Grupo 3i network',
    typesLabel: 'We list',
    types: ['Lots', 'Land', 'Homes', 'Condos', 'Suites', 'Retail space', 'Office space', 'Warehouses'],
    coverSub: 'Every project we list on Ecuador’s coast is hand-picked and vetted. You only pay when you sell.',
    preparedFor: 'Prepared for',
    aboutKicker: 'About us',
    aboutTitle: 'We develop, vet and sell real estate on Ecuador’s coast',
    about1: 'We’re a real estate company with our own projects in Santa Elena. We built this platform to sell our own projects — and now we’re opening it to partner developers of lots, land, homes, condos, suites, retail and office space.',
    about2: 'We’re not a listings site: we choose who we work with, vet every project and only get paid when you sell.',
    stats: [
      ['112', 'lots on the interactive map'],
      ['360°', 'tours of every project'],
      ['EN · ES', 'the full experience in English and Spanish'],
    ],
    compareKicker: 'Listings sites vs. Grupo 3i',
    compareTitle: 'Listings sites charge you to be seen. We get paid when you sell.',
    compareCols: ['Listings site', 'Grupo 3i'],
    compare: [
      ['How you pay', 'A monthly plan, sale or no sale', 'A commission, only when you sell'],
      ['If nothing sells', 'You still pay the plan', 'No commission'],
      ['Who markets your project', 'The site’s search bar', 'Our platform, our ad campaigns and our referral network'],
      ['Your inventory', 'One listing per unit', 'Your whole project with live availability — on an interactive map for lot and home developments'],
      ['Buyer confidence', 'Nobody checks the paperwork', '“Verified by Grupo 3i” seal'],
      ['International buyers', 'Little or no English', 'Everything in English and Spanish'],
      ['Lead follow-up', 'You’re on your own', 'Built-in CRM: every buyer goes straight to their agent’s WhatsApp'],
      ['Your own website', 'A link to the listing', 'The interactive map on your site, under your brand'],
    ],
    stepsKicker: 'How it works',
    stepsTitle: 'From signing to sale in five steps',
    steps: [
      ['Setup', 'We upload your inventory, plans, photos and 360° tours.'],
      ['Verification', 'We review the title and permits, and your project earns the seal.'],
      ['Launch', 'Your listing goes live in English and Spanish, with its map, and we promote it.'],
      ['Leads', 'Every prospect lands in your agent’s WhatsApp with their name and the unit they want.'],
      ['Sale', 'You pay the commission as your buyer pays you.'],
    ],
    toolsKicker: 'What’s included',
    toolsTitle: 'Everything your project needs to sell',
    tools: [
      ['Live inventory', 'Real-time pricing and availability for every unit, with an interactive map for lot and home developments.'],
      ['360° tours', 'Subdivisions, standalone land, suites and condos: buyers tour them without making the trip.'],
      ['Refer & Earn network', 'Members who recommend your project and only get paid when it sells.'],
      ['English and Spanish', 'Built for international buyers.'],
      ['Real-time analytics', 'Visits, most-viewed units, leads and sales.'],
      ['CRM for your team', 'Pipeline, agents, tasks and mobile alerts.'],
    ],
    portalKicker: 'Your dashboard',
    portalTitle: 'See what’s working, week by week',
    portalSub: 'Real screenshots from the portal, using a demo developer’s data.',
    crmKicker: 'Sales CRM',
    crmTitle: 'No lead slips through the cracks',
    crmSub: 'Every lead drops into your pipeline and is assigned to an agent. From there you move it along, book the site visit and message them in one click.',
    crmFeatures: [
      'Automatic lead routing: each agent only sees their own clients',
      'Buyers share their details before the chat opens, then message their agent directly',
      'Mobile alerts for every new lead and upcoming task',
      'Tasks, a site-visit calendar and a full history for every client',
      'WhatsApp templates pre-filled with name, project and unit',
      'Reports on response time, conversion, lost-deal reasons, agent rankings and lead source',
    ],
    crmSoon: 'Available now, at no extra cost',
    leadsKicker: 'Lead generation & ads',
    leadsTitle: 'Know which ad brought in every sale',
    leadsItems: [
      'A landing page for each project, in English and Spanish, ready for your ads',
      'Buyers leave their name and WhatsApp before chatting, so no lead gets lost',
      'Connects with Google Ads, Meta (Facebook and Instagram) and TikTok',
      'Every lead keeps its source campaign, all the way to closing',
      'Your links show a photo, price and call to action when shared on WhatsApp and social media',
    ],
    priceKicker: 'Terms',
    priceTitle: 'A proposal built around your project',
    prices: [
      ['Fit to your project', 'Subdivision, land, homes, condos or retail: every type of project gets its own terms.'],
      ['Fit to the services', 'Pick only what you need: listing, CRM, map, 360° tours, ad campaigns, permits or surveying.'],
      ['In private', 'We present our pricing in a meeting and in writing, with no fine print.'],
    ],
    mapPlanTitle: 'Optional · Map for your website',
    mapPlan: 'For lot and home developments: your interactive map under your logo, on your website or your own domain, CRM included.',
    priceNote: 'Pricing is agreed in private. Homepage placement is available as an add-on.',
    rulesKicker: 'Clear rules',
    rulesTitle: 'Transparent for both sides',
    rules: [
      ['Time-stamped leads', 'Every lead is logged with its date and source, and you can see it in your portal.'],
      ['180-day window', 'If a buyer we brought in purchases within 180 days, the sale earns commission. After that, they’re all yours.'],
      ['Private documents', 'Only our legal team sees your title documents. The public only sees the seal.'],
      ['No fine print', 'A one-year renewable agreement you can end with 30 days’ notice.'],
    ],
    nextKicker: 'Next step',
    nextTitle: 'Let’s talk about your project — it only takes 20 minutes',
    wa: 'Message us on WhatsApp',
    waMsg: (para?: string) => `Hi, I saw the Grupo 3i partner proposal${para ? ` (${para})` : ''} and I’d like to list my project.`,
    apply: 'Apply to join',
    manual: 'Platform guide',
    gallery: 'Screenshot gallery',
  },
};

const STEP_ICONS = [FileSignature, BadgeCheck, Search, MessageCircle, HandCoins];
const TOOL_ICONS = [Map, Box, Users, Languages, BarChart3, CalendarCheck];

const TOOL_IMAGES = [
  '/images/og/montanita-view-mapa.jpg?v=20261012',
  '/images/propuesta-mv/vista-desde-lobby.jpg',
  '/images/secciones/paso-comparte.jpg',
  '/images/propuesta-dev/ingles.jpg',
  '/images/propuesta-dev/metricas.jpg',
  '/images/propuesta-dev/crm.jpg',
];

/** Lámina: isotipo de marca de agua en la esquina y pie con isotipo + número. */
function Slide({ children, dark, bg, n }: { children: ReactNode; dark?: boolean; bg?: ReactNode; n?: number }) {
  return (
    <section className={`proposal-slide relative overflow-hidden ${dark ? 'bg-primary text-white' : 'bg-white text-primary'} print:h-[210mm]`}>
      {bg}
      {!bg && (
        <img
          src={dark ? '/images/isotipo-light.svg' : '/images/isotipo.svg'}
          alt=""
          aria-hidden
          className={`pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 ${dark ? 'opacity-[0.06]' : 'opacity-[0.04]'}`}
        />
      )}
      <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-center px-6 py-16 sm:px-12 print:min-h-0 print:h-full print:py-10">
        {children}
      </div>
      {n && (
        <div className={`absolute bottom-4 left-6 flex items-center gap-2 text-[11px] sm:left-12 ${dark ? 'text-white/50' : 'text-brand-gray'}`}>
          <img src={dark ? '/images/isotipo-light.svg' : '/images/isotipo.svg'} alt="" className="h-4 w-4" />
          Grupo 3i · {String(n).padStart(2, '0')}
        </div>
      )}
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




export default function ProposalPage() {
  const { lang } = useLang();
  const tx = TX[lang === 'en' ? 'en' : 'es'];
  const [params] = useSearchParams();
  const para = params.get('para')?.trim().slice(0, 80);
  const { data: contact } = useSectionContent('contact');
  const wa = (contact?.whatsapp || '').replace(/\D/g, '');
  const year = new Date().getFullYear();

  return (
    <div className="bg-light print:bg-white">
      <Seo title={tx.seo} noindex />
      <style>{`@media print { @page { size: A4 landscape; margin: 0 } .proposal-slide { break-after: page; } }`}</style>

      <div className="fixed right-4 top-4 z-20 flex gap-2 print:hidden">
        <Link to="/publica-tu-proyecto" className="rounded-full bg-white/90 px-4 py-2 text-sm text-primary shadow">
          {tx.back}
        </Link>
        {/* PDF generado (A4 horizontal, una lámina por página): tools/propuesta-pdf.mjs */}
        <a
          href={`/propuesta/propuesta-grupo3i-${lang === 'en' ? 'en' : 'es'}.pdf`}
          download={lang === 'en' ? 'Grupo-3i-commercial-proposal.pdf' : 'Grupo-3i-propuesta-comercial.pdf'}
          className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-primary shadow"
        >
          <Download className="h-4 w-4" /> {tx.pdf}
        </a>
      </div>

      {/* 1. Portada */}
      <Slide
        dark
        bg={
          <>
            <img src="/images/og/montanita-view-mapa.jpg?v=20261012" alt="" className="absolute inset-0 h-full w-full object-cover object-left opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/85 to-primary/40" />
          </>
        }
      >
        <img
          src="/images/isotipo-light.svg"
          alt=""
          aria-hidden
          className="pointer-events-none absolute right-12 top-1/2 hidden h-56 w-56 -translate-y-1/2 opacity-90 drop-shadow-2xl 2xl:block"
        />
        <img src="/images/logotipo-light.svg" alt="Grupo 3i" className="h-10 w-auto self-start" />
        <p className="mt-16 text-sm uppercase tracking-[0.3em] text-secondary">
          {tx.coverKicker} {year}
        </p>
        <h1 className="mt-4 max-w-3xl font-serif text-4xl font-bold leading-tight sm:text-5xl">{tx.coverTitle}</h1>
        <p className="mt-6 max-w-2xl text-lg text-white/80">{tx.coverSub}</p>
        <div className="mt-8 max-w-3xl">
          <p className="text-xs uppercase tracking-[0.25em] text-white/50">{tx.typesLabel}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {tx.types.map((tp) => (
              <span key={tp} className="rounded-full bg-white/10 px-3 py-1 text-sm text-white ring-1 ring-white/20">
                {tp}
              </span>
            ))}
          </div>
        </div>
        {para && (
          <p className="mt-10 text-white/70">
            {tx.preparedFor} <strong className="text-white">{para}</strong>
          </p>
        )}
      </Slide>

      {/* 2. Quiénes somos */}
      <Slide n={2}>
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <Kicker>{tx.aboutKicker}</Kicker>
            <h2 className="font-serif text-4xl font-bold">{tx.aboutTitle}</h2>
            <p className="mt-6 text-lg leading-relaxed text-primary/80">{tx.about1}</p>
            <p className="mt-4 border-l-2 border-secondary pl-4 text-lg font-medium">{tx.about2}</p>
          </div>
          <div className="grid h-72 grid-cols-2 grid-rows-2 gap-2 sm:h-96">
            <img src="/images/propuesta-mv/masterplan.jpg" alt="" className="row-span-2 h-full w-full rounded-2xl object-cover" />
            <img src="/images/propuesta-mv/render-coral.jpg" alt="" className="h-full w-full rounded-2xl object-cover" />
            <img src="/images/ibiza/portada.jpg" alt="" className="h-full w-full rounded-2xl object-cover" />
          </div>
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
      <Slide dark n={3}>
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
      <Slide n={4}>
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
      <Slide n={5}>
        <Kicker>{tx.toolsKicker}</Kicker>
        <h2 className="font-serif text-4xl font-bold">{tx.toolsTitle}</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {tx.tools.map(([t, d], i) => {
            const Icon = TOOL_ICONS[i];
            return (
              <div key={t} className="relative h-48 overflow-hidden rounded-2xl print:h-40">
                <img src={TOOL_IMAGES[i]} alt="" className={`absolute inset-0 h-full w-full object-cover ${i === 5 ? "object-left" : "object-top"}`} />
                <div className="absolute inset-0 bg-gradient-to-t from-primary from-25% via-primary/50 via-50% to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <span className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-primary">
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <p className="font-semibold">{t}</p>
                  <p className="text-sm text-white/80">{d}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Slide>

      {/* 6. Portal y métricas (capturas reales, desarrolladora de demostración) */}
      <Slide n={6}>
        <Kicker>{tx.portalKicker}</Kicker>
        <h2 className="font-serif text-4xl font-bold">{tx.portalTitle}</h2>
        <p className="mt-2 text-sm text-brand-gray">{tx.portalSub}</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {['/images/galeria-dev/07-metricas.webp', '/images/galeria-dev/08-metricas-lotes.webp'].map((src) => (
            <img key={src} src={src} alt="" className="w-full rounded-2xl object-cover object-top shadow-lg ring-1 ring-black/10 print:h-[95mm]" />
          ))}
        </div>
      </Slide>

      {/* 7. CRM */}
      <Slide dark n={7}>
        <Kicker light>{tx.crmKicker}</Kicker>
        <h2 className="font-serif text-4xl font-bold">{tx.crmTitle}</h2>
        <p className="mt-2 max-w-3xl text-white/70">{tx.crmSub}</p>
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_18rem]">
          <img src="/images/galeria-dev/09-crm-embudo.webp" alt="" className="w-full rounded-2xl object-cover object-top shadow-2xl ring-1 ring-white/10 print:h-[110mm]" />
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

      {/* 7b. Captación y campañas */}
      <Slide n={8}>
        <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
          <img src="/images/propuesta-dev/aterrizaje.jpg?v=20261012" alt="" className="w-full rounded-2xl shadow-xl ring-1 ring-black/10" />
          <div>
            <Kicker>{tx.leadsKicker}</Kicker>
            <h2 className="font-serif text-4xl font-bold">{tx.leadsTitle}</h2>
            <ul className="mt-6 space-y-3">
              {tx.leadsItems.map((it) => (
                <li key={it} className="flex gap-2 text-primary/85">
                  <span className="text-accent">✓</span>
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Slide>

      {/* 8. Tarifas */}
      <Slide dark n={9}>
        <Kicker light>{tx.priceKicker}</Kicker>
        <h2 className="font-serif text-4xl font-bold">{tx.priceTitle}</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {tx.prices.map(([t, d]) => (
            <div key={t} className="rounded-2xl bg-white/10 p-6 ring-1 ring-white/15">
              <p className="font-serif text-2xl font-bold text-secondary">{t}</p>
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

      {/* 10. Reglas */}
      <Slide n={10}>
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
      <Slide
        dark
        n={11}
        bg={
          <>
            <img src="/images/secciones/hero-home.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-primary/50" />
          </>
        }
      >
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
          <Link to="/publica-tu-proyecto/galeria" className="rounded-lg border border-white/30 px-6 py-3 font-semibold text-white">
            {tx.gallery}
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
