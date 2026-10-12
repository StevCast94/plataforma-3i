import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Seo } from '@/components/shared/Seo';
import { PageHeader } from '@/components/layout/PageHeader';
import { Link, useLang } from '@/hooks/useLang';

// Galería de pantallas del sistema para desarrolladoras (/publica-tu-proyecto/galeria).
// Capturas reales tomadas de una desarrolladora de demostración (datos ficticios).
// Cada idioma tiene su propia redacción: el inglés no es traducción literal.

type Shot = [file: string, title: string, caption: string];
type Group = { id: string; title: string; intro: string; shots: Shot[] };

const ES = {
  seoTitle: 'Galería del sistema para desarrolladoras',
  seoDesc: 'Capturas reales del portal de Grupo 3i: proyecto, mapa de solares, 360°, CRM, asesores, métricas, ventas y mapa para tu web.',
  title: 'Galería del sistema',
  subtitle: 'Así se ve cada pantalla del portal para desarrolladoras.',
  note: 'Capturas del sistema real con una desarrolladora de demostración; nombres, cifras y ventas son ficticios.',
  apply: 'Solicitar el alta', guide: 'Manual de herramientas', proposal: 'Propuesta comercial',
  close: 'Cerrar', prev: 'Anterior', next: 'Siguiente',
  groups: [
    { id: 'proyecto', title: 'Tu proyecto', intro: 'Creas la ficha, cargas los solares y las vistas 360°, y ves qué te falta para aparecer entre los primeros.', shots: [
      ['01-portal-proyectos', 'Portal de la desarrolladora', 'Tus proyectos, tu comisión y el estado de publicación.'],
      ['02-editar-proyecto', 'Ficha del proyecto', 'Nombre, descripción, precio, ubicación y fotos.'],
      ['02b-version-ingles', 'Versión en inglés', 'Subtítulo, descripción y precio para el comprador extranjero.'],
      ['03-puntaje-calidad', 'Puntaje de la ficha', 'Te dice qué completar para aparecer entre los primeros.'],
      ['03b-documentos-legales', 'Documentos legales', 'Privados: solo los ve nuestro equipo legal para darte el sello.'],
      ['05-editor-lotes', 'Inventario de solares', 'Precio, área y estado de cada solar, con filtros.'],
      ['06-vistas-360', 'Vistas 360°', 'Sube las panorámicas, ubícalas en el mapa y fija el norte.'],
    ] },
    { id: 'comprador', title: 'Lo que ve tu comprador', intro: 'Una ficha en español e inglés, con el mapa de solares en vivo, desde cualquier celular.', shots: [
      ['20-ficha-proyecto', 'Ficha pública', 'Con el sello «Verificado por Grupo 3i».'],
      ['21-mapa-lotes', 'Mapa interactivo', 'Disponibilidad en vivo y puntos 360° sobre el terreno.'],
      ['22-ficha-solar', 'Ficha de cada solar', 'Área, precio, cuota mensual y cómo llegar.'],
      ['24-captura-contacto', 'Datos antes del chat', 'Antes de abrir WhatsApp, el cliente deja su nombre y número: no se pierde ningún contacto.'],
      ['23-ficha-ingles', 'En inglés', 'Toda la experiencia para el comprador extranjero.'],
      ['26-celular-mapa', 'Desde el celular', 'Pensado primero para el teléfono.'],
    ] },
    { id: 'crm', title: 'CRM de ventas', intro: 'Cada contacto entra solo al embudo y se asigna a un asesor.', shots: [
      ['09-crm-embudo', 'Embudo', 'Mueve cada cliente de etapa, con alertas de clientes sin atender y tareas vencidas.'],
      ['10-crm-ficha-contacto', 'Ficha del cliente', 'Asesor, etapa, WhatsApp con plantilla, tareas e historial.'],
      ['11-crm-agenda', 'Agenda', 'Tareas vencidas, de hoy y próximas.'],
      ['12-crm-lista', 'Lista', 'Todos los contactos, con filtros y búsqueda.'],
      ['15-crm-plantillas', 'Plantillas de WhatsApp', 'Mensajes listos con el nombre del cliente, el proyecto y el solar.'],
      ['14-crm-reportes-equipo', 'Reportes', 'Tiempo de primera respuesta, conversión, motivos de pérdida y ranking.'],
    ] },
    { id: 'equipo', title: 'Equipo, métricas y ventas', intro: 'Sabes qué funciona, quién vende y cuánto debes de comisión.', shots: [
      ['17-equipo-vendedores', 'Equipo de asesores', 'Los contactos se reparten solos entre tus asesores.'],
      ['18-vendedor-crm', 'Vista del asesor', 'Cada asesor ve solo sus clientes y sus tareas.'],
      ['07-metricas', 'Métricas', 'Visitas, embudo, origen de los contactos y ventas.'],
      ['08-metricas-solares', 'Solares más vistos', 'Qué solares miran más, desde qué dispositivo y en qué idioma.'],
      ['16-ventas-comisiones', 'Ventas y comisiones', 'Registras los pagos del cliente y la comisión se calcula sola.'],
    ] },
    { id: 'web', title: 'Mapa para tu web', intro: 'El mismo mapa dentro de tu página, con tu marca.', shots: [
      ['04-mapa-para-tu-web', 'Configuración', 'Logo, color, WhatsApp y el código para pegar.'],
      ['25-mapa-en-tu-web', 'Así se ve en tu web', 'Los contactos que llegan desde ahí entran a tu CRM.'],
    ] },
  ] as Group[],
};

const EN: typeof ES = {
  seoTitle: 'Developer portal screenshot gallery',
  seoDesc: 'Real screenshots of the Grupo 3i developer portal: listings, lot map, 360° tours, CRM, agents, analytics, sales and an embeddable map for your website.',
  title: 'Screenshot gallery',
  subtitle: 'A look at every screen in the developer portal.',
  note: 'Screenshots of the live system using a demo developer — names, figures and sales are made up. The developer portal itself is in Spanish; everything your buyers see is available in English.',
  apply: 'Apply to join', guide: 'Platform guide', proposal: 'Partner proposal',
  close: 'Close', prev: 'Previous', next: 'Next',
  groups: [
    { id: 'proyecto', title: 'Your project', intro: 'Build your listing, upload your lots and 360° views, and see exactly what to add to rank higher.', shots: [
      ['01-portal-proyectos', 'Developer dashboard', 'Your projects, your commission rate and listing status.'],
      ['02-editar-proyecto', 'Project listing', 'Name, description, price, location and photos.'],
      ['02b-version-ingles', 'English version', 'A separate headline, description and price line for international buyers.'],
      ['03-puntaje-calidad', 'Listing score', 'Tells you what to fill in to land near the top.'],
      ['03b-documentos-legales', 'Legal documents', 'Private — only our legal team sees them, to grant your seal.'],
      ['05-editor-lotes', 'Lot inventory', 'Price, size and status of every lot, with filters.'],
      ['06-vistas-360', '360° views', 'Upload panoramas, pin them on the map and set north.'],
    ] },
    { id: 'comprador', title: 'What your buyers see', intro: 'A listing in English and Spanish with a live lot map, on any phone.', shots: [
      ['20-ficha-proyecto', 'Public listing', 'With the “Verified by Grupo 3i” seal.'],
      ['21-mapa-lotes', 'Interactive map', 'Real-time availability and 360° points across the property.'],
      ['22-ficha-solar', 'Lot details', 'Size, price, monthly payment and directions.'],
      ['24-captura-contacto', 'Lead capture', 'Buyers leave their name and number before WhatsApp opens — no lead gets lost.'],
      ['23-ficha-ingles', 'In English', 'The full experience for international buyers.'],
      ['26-celular-mapa', 'On mobile', 'Built for phones first.'],
    ] },
    { id: 'crm', title: 'Sales CRM', intro: 'Every lead lands in your pipeline automatically, assigned to an agent.', shots: [
      ['09-crm-embudo', 'Pipeline', 'Drag leads between stages, with alerts for untouched leads and overdue tasks.'],
      ['10-crm-ficha-contacto', 'Lead profile', 'Agent, stage, WhatsApp templates, tasks and full history.'],
      ['11-crm-agenda', 'Schedule', 'Overdue, today and upcoming tasks.'],
      ['12-crm-lista', 'List view', 'Every lead, with filters and search.'],
      ['15-crm-plantillas', 'WhatsApp templates', 'Ready-to-send messages with the buyer’s name, project and lot filled in.'],
      ['14-crm-reportes-equipo', 'Reports', 'Response time, conversion, lost-deal reasons and agent rankings.'],
    ] },
    { id: 'equipo', title: 'Team, analytics and sales', intro: 'See what’s working, who’s selling and what commission you owe.', shots: [
      ['17-equipo-vendedores', 'Sales team', 'Leads are shared out among your agents automatically.'],
      ['18-vendedor-crm', 'Agent view', 'Each agent sees only their own leads and tasks.'],
      ['07-metricas', 'Analytics', 'Visitors, funnel, lead sources and sales.'],
      ['08-metricas-solares', 'Most-viewed lots', 'Which lots get the most attention, on what device and in which language.'],
      ['16-ventas-comisiones', 'Sales and commissions', 'Log the buyer’s payments and the commission works itself out.'],
    ] },
    { id: 'web', title: 'Map for your website', intro: 'The same map, embedded in your own site with your branding.', shots: [
      ['04-mapa-para-tu-web', 'Setup', 'Logo, color, WhatsApp number and the code to paste.'],
      ['25-mapa-en-tu-web', 'On your website', 'Leads from your site flow straight into your CRM.'],
    ] },
  ],
};

const src = (f: string) => `/images/galeria-dev/${f}.webp`;

export default function DeveloperGalleryPage() {
  const { lang } = useLang();
  const tx = lang === 'en' ? EN : ES;
  const ALL = tx.groups.flatMap((g) => g.shots);
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
      if (e.key === 'ArrowRight') setOpen((i) => (i! + 1) % ALL.length);
      if (e.key === 'ArrowLeft') setOpen((i) => (i! - 1 + ALL.length) % ALL.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, ALL.length]);

  return (
    <>
      <Seo title={tx.seoTitle} description={tx.seoDesc} />
      <PageHeader title={tx.title} subtitle={tx.subtitle} image="/images/secciones/header-nosotros.jpg" />

      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <nav className="mb-10 flex flex-wrap gap-2">
          {tx.groups.map((g) => (
            <a key={g.id} href={`#${g.id}`} className="rounded-full border border-black/10 bg-white px-4 py-1.5 text-sm text-primary hover:border-secondary">
              {g.title}
            </a>
          ))}
        </nav>

        {tx.groups.map((g) => (
          <section key={g.id} id={g.id} className="mb-16 scroll-mt-24">
            <div className="mb-6 flex items-center gap-3">
              <img src="/images/isotipo.svg" alt="" className="h-6 w-6" />
              <h2 className="font-serif text-3xl font-bold text-primary">{g.title}</h2>
            </div>
            <p className="-mt-3 mb-6 text-brand-gray">{g.intro}</p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {g.shots.map(([f, t, c]) => {
                const idx = ALL.findIndex((s) => s[0] === f);
                return (
                  <button key={f} onClick={() => setOpen(idx)} className="group text-left">
                    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5 transition group-hover:shadow-md">
                      <img src={src(f)} alt={t} loading="lazy" className="aspect-[16/10] w-full object-cover object-top transition group-hover:scale-[1.02]" />
                    </div>
                    <p className="mt-3 font-semibold text-primary">{t}</p>
                    <p className="text-sm text-brand-gray">{c}</p>
                  </button>
                );
              })}
            </div>
          </section>
        ))}

        <p className="text-xs text-brand-gray">{tx.note}</p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/publica-tu-proyecto#solicitud" className="rounded-lg bg-secondary px-6 py-3 text-sm font-semibold text-primary">{tx.apply}</Link>
          <Link to="/publica-tu-proyecto/manual" className="rounded-lg border border-black/15 px-6 py-3 text-sm font-semibold text-primary hover:bg-light">{tx.guide}</Link>
          <Link to="/publica-tu-proyecto/propuesta" className="rounded-lg border border-black/15 px-6 py-3 text-sm font-semibold text-primary hover:bg-light">{tx.proposal}</Link>
        </div>
      </div>

      {open !== null && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4" onClick={() => setOpen(null)}>
          <button className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white" aria-label={tx.close} onClick={() => setOpen(null)}>
            <X className="h-6 w-6" />
          </button>
          <img src={src(ALL[open][0])} alt={ALL[open][1]} className="max-h-[80vh] max-w-full rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
          <p className="mt-4 text-center text-white">
            <strong>{ALL[open][1]}</strong> <span className="text-white/70">· {ALL[open][2]}</span>
          </p>
          <div className="mt-3 flex gap-3" onClick={(e) => e.stopPropagation()}>
            <button className="rounded-full bg-white/10 p-2 text-white" aria-label={tx.prev} onClick={() => setOpen((open - 1 + ALL.length) % ALL.length)}>
              <ChevronLeft className="h-6 w-6" />
            </button>
            <span className="self-center text-sm text-white/60">{open + 1} / {ALL.length}</span>
            <button className="rounded-full bg-white/10 p-2 text-white" aria-label={tx.next} onClick={() => setOpen((open + 1) % ALL.length)}>
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
