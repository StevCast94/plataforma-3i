import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Seo } from '@/components/shared/Seo';
import { PageHeader } from '@/components/layout/PageHeader';
import { Link } from '@/hooks/useLang';

// Galería de pantallas del sistema para desarrolladoras (/publica-tu-proyecto/galeria).
// Capturas reales tomadas de una desarrolladora de demostración (datos ficticios).

type Shot = [file: string, title: string, caption: string];

const GROUPS: { id: string; title: string; intro: string; shots: Shot[] }[] = [
  {
    id: 'proyecto',
    title: 'Tu proyecto',
    intro: 'Creas la ficha, cargas lotes y 360°, y ves qué te falta para salir primero.',
    shots: [
      ['01-portal-proyectos', 'Portal de la desarrolladora', 'Tus proyectos, tu comisión y el estado de publicación.'],
      ['02-editar-proyecto', 'Ficha del proyecto', 'Nombre, descripción, precio, ubicación y fotos.'],
      ['03-puntaje-calidad', 'Puntaje de la ficha', 'Te dice qué completar para aparecer entre los primeros.'],
      ['03b-documentos-legales', 'Documentos legales', 'Privados: solo los ve el equipo legal para darte el sello.'],
      ['05-editor-lotes', 'Inventario de lotes', 'Precio, área y estado de cada solar, con filtros.'],
      ['06-vistas-360', 'Vistas 360°', 'Sube panorámicas, ubícalas en el mapa y fija el norte.'],
    ],
  },
  {
    id: 'comprador',
    title: 'Lo que ve tu comprador',
    intro: 'Una ficha bilingüe con mapa de lotes en vivo, desde cualquier celular.',
    shots: [
      ['20-ficha-proyecto', 'Ficha pública', 'Con el sello «Verificado por Grupo 3i».'],
      ['21-mapa-lotes', 'Mapa interactivo', 'Disponibilidad en vivo y puntos 360° sobre el terreno.'],
      ['22-ficha-solar', 'Ficha de cada solar', 'Área, precio, cuota mensual y cómo llegar.'],
      ['24-captura-contacto', 'Captura del contacto', 'Antes de abrir WhatsApp deja nombre y número: nada se pierde.'],
      ['23-ficha-ingles', 'En inglés', 'Toda la experiencia para el comprador extranjero.'],
      ['26-celular-mapa', 'Desde el celular', 'Pensado primero para el teléfono.'],
    ],
  },
  {
    id: 'crm',
    title: 'CRM de ventas',
    intro: 'Cada contacto entra solo al embudo, asignado a un vendedor.',
    shots: [
      ['09-crm-embudo', 'Embudo', 'Arrastra cada cliente de etapa; alertas de «sin atender» y tareas vencidas.'],
      ['10-crm-ficha-contacto', 'Ficha del cliente', 'Vendedor, etapa, WhatsApp con plantilla, tareas e historial.'],
      ['11-crm-agenda', 'Agenda', 'Tareas vencidas, de hoy y próximas.'],
      ['12-crm-lista', 'Lista', 'Todos los contactos con filtros y búsqueda.'],
      ['15-crm-plantillas', 'Plantillas de WhatsApp', 'Mensajes listos con el nombre, el proyecto y el solar.'],
      ['14-crm-reportes-equipo', 'Reportes', 'Primera respuesta, conversión, motivos de pérdida y ranking.'],
    ],
  },
  {
    id: 'equipo',
    title: 'Equipo, métricas y ventas',
    intro: 'Sabes qué funciona, quién vende y cuánto debes de comisión.',
    shots: [
      ['17-equipo-vendedores', 'Equipo de ventas', 'Reparto automático de contactos entre vendedores.'],
      ['18-vendedor-crm', 'Vista del vendedor', 'Cada vendedor ve solo sus clientes y tareas.'],
      ['07-metricas', 'Métricas', 'Visitantes, embudo, origen de los contactos y ventas.'],
      ['08-metricas-solares', 'Solares con más interés', 'Qué lotes miran más, desde qué dispositivo y en qué idioma.'],
      ['16-ventas-comisiones', 'Ventas y comisiones', 'Registras los pagos del cliente; la comisión se calcula sola.'],
    ],
  },
  {
    id: 'web',
    title: 'Mapa para tu web',
    intro: 'El mismo mapa dentro de tu página, con tu marca.',
    shots: [
      ['04-mapa-para-tu-web', 'Configuración', 'Logo, color, WhatsApp y el código para pegar.'],
      ['25-mapa-en-tu-web', 'Así se ve en tu web', 'Los contactos que llegan desde ahí entran a tu CRM.'],
    ],
  },
];

const ALL = GROUPS.flatMap((g) => g.shots);
const src = (f: string) => `/images/galeria-dev/${f}.jpg`;

export default function DeveloperGalleryPage() {
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
  }, [open]);

  return (
    <>
      <Seo title="Galería del sistema para desarrolladoras" description="Capturas reales del portal de Grupo 3i: proyecto, mapa de lotes, 360°, CRM, vendedores, métricas, ventas y mapa para tu web." />
      <PageHeader title="Galería del sistema" subtitle="Así se ve cada pantalla del portal para desarrolladoras." image="/images/secciones/header-nosotros.jpg" />

      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <nav className="mb-10 flex flex-wrap gap-2">
          {GROUPS.map((g) => (
            <a key={g.id} href={`#${g.id}`} className="rounded-full border border-black/10 bg-white px-4 py-1.5 text-sm text-primary hover:border-secondary">
              {g.title}
            </a>
          ))}
        </nav>

        {GROUPS.map((g) => (
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

        <p className="text-xs text-brand-gray">Capturas del sistema real con una desarrolladora de demostración; nombres, cifras y ventas son ficticios.</p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/publica-tu-proyecto#solicitud" className="rounded-lg bg-secondary px-6 py-3 text-sm font-semibold text-primary">Solicitar el alta</Link>
          <Link to="/publica-tu-proyecto/manual" className="rounded-lg border border-black/15 px-6 py-3 text-sm font-semibold text-primary hover:bg-light">Manual de herramientas</Link>
          <Link to="/publica-tu-proyecto/propuesta" className="rounded-lg border border-black/15 px-6 py-3 text-sm font-semibold text-primary hover:bg-light">Propuesta comercial</Link>
        </div>
      </div>

      {open !== null && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4" onClick={() => setOpen(null)}>
          <button className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white" aria-label="Cerrar" onClick={() => setOpen(null)}>
            <X className="h-6 w-6" />
          </button>
          <img src={src(ALL[open][0])} alt={ALL[open][1]} className="max-h-[80vh] max-w-full rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
          <p className="mt-4 text-center text-white">
            <strong>{ALL[open][1]}</strong> <span className="text-white/70">· {ALL[open][2]}</span>
          </p>
          <div className="mt-3 flex gap-3" onClick={(e) => e.stopPropagation()}>
            <button className="rounded-full bg-white/10 p-2 text-white" aria-label="Anterior" onClick={() => setOpen((open - 1 + ALL.length) % ALL.length)}>
              <ChevronLeft className="h-6 w-6" />
            </button>
            <span className="self-center text-sm text-white/60">{open + 1} / {ALL.length}</span>
            <button className="rounded-full bg-white/10 p-2 text-white" aria-label="Siguiente" onClick={() => setOpen((open + 1) % ALL.length)}>
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
