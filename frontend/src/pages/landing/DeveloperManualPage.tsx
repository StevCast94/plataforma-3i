import type { ReactNode } from 'react';
import {
  BadgeCheck, BarChart3, Bell, Box, ClipboardList, Code2, FileSignature, Globe, HandCoins, KanbanSquare, LayoutDashboard, Map,
  MessageCircle, Printer, ShieldCheck, Users,
} from 'lucide-react';
import { Seo } from '@/components/shared/Seo';
import { PageHeader } from '@/components/layout/PageHeader';
import { Link } from '@/hooks/useLang';

// Manual de herramientas para desarrolladoras (/publica-tu-proyecto/manual).
// Describe lo que existe hoy en la plataforma; si cambia una función, se actualiza aquí.

interface Section {
  id: string;
  icon: typeof Map;
  title: string;
  intro: string;
  body: ReactNode;
}

function Steps({ items }: { items: ReactNode[] }) {
  return (
    <ol className="mt-4 space-y-2">
      {items.map((it, i) => (
        <li key={i} className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-primary">{i + 1}</span>
          <span className="text-primary/85">{it}</span>
        </li>
      ))}
    </ol>
  );
}

function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="mt-4 space-y-2">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2 text-primary/85">
          <span className="text-secondary">•</span>
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

function Tip({ children }: { children: ReactNode }) {
  return <p className="mt-4 rounded-xl bg-secondary/15 p-4 text-sm text-primary">💡 {children}</p>;
}

const SECTIONS: Section[] = [
  {
    id: 'acceso',
    icon: LayoutDashboard,
    title: 'Acceso y portal',
    intro: 'Todo se maneja desde grupo3i.com/desarrollador, en el computador o en el celular.',
    body: (
      <>
        <Steps
          items={[
            'Grupo 3i te envía por WhatsApp tu correo y una contraseña temporal.',
            'Entra a grupo3i.com/desarrollador e inicia sesión.',
            'Arriba ves tu empresa y tus condiciones: comisión por venta de la plataforma (8 %), por venta a tus propios contactos (2 %) y el estado del alta.',
            'Las pestañas son Proyectos, CRM, Ventas y Equipo.',
          ]}
        />
      </>
    ),
  },
  {
    id: 'proyectos',
    icon: FileSignature,
    title: 'Crear y publicar un proyecto',
    intro: 'Armas la ficha como borrador y la envías a revisión. Grupo 3i la publica cuando está verificada.',
    body: (
      <>
        <Steps
          items={[
            'En Proyectos, toca «+ Nuevo proyecto».',
            'Completa nombre, descripción (mínimo 80 caracteres), ubicación, precio desde, coordenadas, portada y galería. Las fotos se optimizan solas al subirlas.',
            'En «Versión en inglés» escribe el subtítulo, la descripción y el texto de precio para el comprador extranjero. Si lo dejas vacío, la ficha en inglés muestra el texto en español.',
            'Toca «Guardar y enviar a revisión». Mientras está en revisión no se puede editar.',
            'Si Grupo 3i te devuelve el proyecto, verás las observaciones en amarillo. Corrige y vuelve a enviarlo.',
            'Una vez publicado puedes editarlo cuando quieras, o pausarlo y reactivarlo.',
          ]}
        />
        <Tip>Los estados son Borrador, En revisión, Publicado y Pausado. Solo los publicados se ven en grupo3i.com.</Tip>
      </>
    ),
  },
  {
    id: 'calidad',
    icon: BadgeCheck,
    title: 'Puntaje de calidad y sello «Verificado»',
    intro: 'Cada proyecto tiene un puntaje de 0 a 100 que decide su orden en la portada. El sello legal es obligatorio para publicar.',
    body: (
      <>
        <Bullets
          items={[
            'Puntaje: portada (10), galería de 6 fotos o más (10), descripción de 300 caracteres o más (10), subtítulo y ubicación (5), coordenadas (5), plano de lotes (10), precios en todos los lotes (15), 3 vistas 360° (10), versión en inglés (10) y verificación (15).',
            'Al editar el proyecto ves tu puntaje y un consejo para cada punto que te falta. Con 90 o más apareces entre los primeros.',
            'Documentos legales: sube escritura inscrita, certificado de gravámenes, aprobación municipal y plano (PDF o foto). Son privados: solo los ve el equipo legal de Grupo 3i.',
            'Con la revisión completa, tu proyecto muestra el sello «✓ Verificado por Grupo 3i» en su tarjeta y en su ficha.',
          ]}
        />
      </>
    ),
  },
  {
    id: 'lotes',
    icon: Map,
    title: 'Mapa interactivo de lotes',
    intro: 'Cada lote con su forma real, precio, medidas, linderos y disponibilidad en vivo.',
    body: (
      <>
        <Bullets
          items={[
            'El plano (DWG o KMZ) lo cargamos nosotros durante el alta, con la geometría exacta de cada lote.',
            'Tú administras lo comercial desde «Lotes» en tu proyecto: estado (disponible, reservado, vendido, no comercializable), precio, precio por m², «solo contado», fotos del lote y notas privadas.',
            'El comprador filtra por manzana, tamaño o disponibilidad, toca un lote y ve su ficha, comparte el enlace por WhatsApp o pide «Cómo llegar».',
            'Cada lote tiene su propia página para compartir, con vista previa en redes y versión para imprimir con la ficha técnica.',
          ]}
        />
        <Tip>Marca un lote como vendido apenas se venda: el mapa se actualiza al instante para todos.</Tip>
      </>
    ),
  },
  {
    id: 'vistas360',
    icon: Box,
    title: 'Recorridos 360°',
    intro: 'Panorámicas ubicadas sobre el mapa, para recorrer el terreno antes de visitarlo.',
    body: (
      <>
        <Steps
          items={[
            'Toma la foto con el modo panorámico del celular (o una cámara 360°) parado en el lote.',
            'En tu proyecto, abre «360°» y sube la imagen (JPG). Se corta en mosaicos para que cargue rápido.',
            'Si la foto trae ubicación y brújula, queda ubicada y orientada sola. Si no, arrastra el punto en el mapa y fija el norte mirando la vista.',
            'Puedes renombrar, ocultar o borrar cada vista.',
          ]}
        />
        <Tip>Las fotos del iPhone en formato HEIC hay que convertirlas a JPG antes de subirlas.</Tip>
      </>
    ),
  },
  {
    id: 'contactos',
    icon: MessageCircle,
    title: 'Cómo llegan los contactos',
    intro: 'Todo interesado queda registrado con fecha y origen antes de llegar a tu WhatsApp.',
    body: (
      <>
        <Bullets
          items={[
            'Cuando alguien toca «Contactar un asesor» en tu proyecto, deja su nombre y WhatsApp, y se abre el chat con tu número con el lote ya escrito.',
            'Origen: «Referido» (llegó por el enlace de un socio de Refiere y gana), «Plataforma» (llegó por grupo3i.com) o «Propio» (lo registraste tú).',
            'Atribución de 180 días: el primer registro de un número manda. Si un contacto de la plataforma compra dentro de ese plazo, la venta lleva la comisión del 8 %.',
            'Tus clientes propios regístralos en CRM → Lista → «+ Contacto propio». Si compran, la comisión es del 2 %.',
          ]}
        />
      </>
    ),
  },
  {
    id: 'crm',
    icon: KanbanSquare,
    title: 'CRM: embudo de ventas',
    intro: 'Cada contacto entra solo a tu embudo, con su tarea de contactar en 24 horas.',
    body: (
      <>
        <Bullets
          items={[
            'Etapas: Nuevo → Contactado → Visita → Negociación → Venta → Perdido. Arrastra la tarjeta para cambiarla de etapa.',
            'Cada columna suma el presupuesto de sus clientes. Las tarjetas muestran origen, etiquetas, vendedor y la próxima tarea.',
            'Alerta roja «Sin atender más de 24 h» y tareas vencidas en rojo.',
            'Al marcar un contacto como Perdido se pide el motivo (precio, financiamiento, ubicación, no responde, compró en otro lado…).',
            'Vistas: Embudo, Agenda (tareas vencidas, de hoy y próximas), Lista y Reportes.',
          ]}
        />
        <h4 className="mt-6 font-semibold text-primary">Ficha del cliente</h4>
        <Bullets
          items={[
            'Datos, mensaje original, idioma y origen.',
            'Etapa con un toque, etiquetas y presupuesto.',
            'WhatsApp con plantilla: elige una, toca «Enviar» y se abre el chat con el mensaje listo. Queda en el historial.',
            'Tareas con fecha y hora: llamar, visita, seguimiento, propuesta.',
            'Notas y el historial completo de todo lo que pasó con ese cliente.',
          ]}
        />
        <h4 className="mt-6 font-semibold text-primary">Automatizaciones</h4>
        <Bullets
          items={[
            'Contacto nuevo → tarea «Contactar al cliente» a 24 horas.',
            'El primer avance de etapa marca esa tarea como hecha.',
            'Pasa a Visita → tarea «Confirmar fecha de la visita».',
            'Venta o Perdido → se cierran las tareas pendientes.',
          ]}
        />
      </>
    ),
  },
  {
    id: 'plantillas',
    icon: ClipboardList,
    title: 'Plantillas de WhatsApp',
    intro: 'Mensajes listos para responder rápido y siempre igual de bien.',
    body: (
      <>
        <Bullets
          items={[
            'Vienen cuatro de ejemplo: primer contacto, agendar visita, seguimiento y una en inglés.',
            'En CRM → «Plantillas» la dueña puede crear las suyas o borrar las que no use. Los vendedores las usan, pero no las modifican.',
            <>
              Variables que se reemplazan solas: <code>{'{nombre}'}</code>, <code>{'{proyecto}'}</code> y <code>{'{solar}'}</code>.
            </>,
          ]}
        />
      </>
    ),
  },
  {
    id: 'equipo',
    icon: Users,
    title: 'Equipo de vendedores',
    intro: 'Agrega a tus vendedores: los contactos se reparten solos.',
    body: (
      <>
        <Steps
          items={[
            'En Equipo, toca «+ Vendedor» con su nombre y correo. Copia el mensaje con su acceso y envíaselo.',
            'Cada contacto nuevo va al vendedor activo con menos contactos abiertos.',
            'El vendedor solo ve el CRM con sus contactos y sus tareas. No ve proyectos, ventas ni comisiones.',
            'Como dueño ves todo, filtras el embudo por vendedor y reasignas desde la ficha del cliente.',
            'Si desactivas a un vendedor, sus contactos abiertos vuelven a ti.',
          ]}
        />
      </>
    ),
  },
  {
    id: 'avisos',
    icon: Bell,
    title: 'Avisos al celular',
    intro: 'Enterarte al instante es la mitad de la venta.',
    body: (
      <>
        <Bullets
          items={[
            'Toca «Activar avisos» en el portal desde cada celular que vaya a recibirlos.',
            '«🔔 Nuevo contacto»: al vendedor asignado (o al dueño).',
            '«⏰ Tarea por vencer» o «Tarea vencida»: 15 minutos antes o al vencer, una sola vez.',
            'Avisos del mapa: 7, 3 y 1 día antes de que venza tu plan.',
          ]}
        />
        <Tip>En iPhone, los avisos funcionan con el portal instalado en la pantalla de inicio.</Tip>
      </>
    ),
  },
  {
    id: 'reportes',
    icon: BarChart3,
    title: 'Métricas y reportes',
    intro: 'Sabes qué funciona, cada semana.',
    body: (
      <>
        <h4 className="font-semibold text-primary">Métricas del proyecto</h4>
        <Bullets
          items={[
            'Embudo: vieron el proyecto → vieron un lote → abrieron un 360° → tocaron WhatsApp → dejaron sus datos → compraron.',
            'Visitas y contactos por semana, lotes con más interés, celular o computador, español o inglés.',
            'Períodos de 7, 30 o 90 días, o un año.',
          ]}
        />
        <h4 className="mt-6 font-semibold text-primary">Reportes del CRM</h4>
        <Bullets
          items={[
            'Tiempo de primera respuesta y porcentaje de contactos atendidos en 24 horas.',
            'Conversión por etapa y motivos de pérdida.',
            'Desempeño por vendedor: contactos, rapidez, ventas y monto.',
          ]}
        />
      </>
    ),
  },
  {
    id: 'ventas',
    icon: HandCoins,
    title: 'Ventas y comisión',
    intro: 'Pagas solo cuando vendes, y a medida que tu cliente te paga.',
    body: (
      <>
        <Steps
          items={[
            'En CRM → Lista, toca «Venta» en el cliente: lote, precio, contado o financiado, entrada y comprobante.',
            'Grupo 3i confirma la venta: el lote pasa a Vendido y el cliente a Venta.',
            'Si es financiado, registra cada pago del cliente en Ventas → «+ Registrar pago».',
            'Por cada pago se calcula la comisión (8 % o 2 % según el origen del contacto). En Ventas ves lo generado, lo pagado y lo pendiente.',
          ]}
        />
        <Tip>Si el comprador desiste, las comisiones de pagos aún no cobrados se anulan.</Tip>
      </>
    ),
  },
  {
    id: 'mapa-web',
    icon: Code2,
    title: 'Mapa para tu web',
    intro: 'Tu mapa interactivo de lotes, con tu logo y tu color, dentro de tu propia página.',
    body: (
      <>
        <Steps
          items={[
            'En tu proyecto, sección «Mapa para tu web»: sube tu logo, elige tu color, el nombre y el WhatsApp que recibe los contactos.',
            'Con el plan activo aparece el código. Toca «Copiar código» y pégalo en tu web (WordPress, Wix, Webflow o HTML).',
            'El mapa ajusta su altura solo y funciona en celular.',
            'Los contactos que lleguen desde tu web entran a tu CRM como propios.',
          ]}
        />
        <p className="mt-4 text-sm text-brand-gray">Plan mensual: $49 hasta 150 lotes · $99 con más de 150. Si no se renueva, el mapa se apaga solo al vencer.</p>
      </>
    ),
  },
  {
    id: 'dominio',
    icon: Globe,
    title: 'Dominio propio',
    intro: 'El mapa también puede vivir en tu dominio, por ejemplo mapa.tulotizadora.com.',
    body: (
      <Steps
        items={[
          'Dinos qué dominio quieres usar.',
          'Crea en tu proveedor de dominio un registro CNAME con el destino que te indiquemos.',
          'Nosotros lo activamos con certificado de seguridad (https). En unos minutos tu dominio muestra el mapa.',
        ]}
      />
    ),
  },
  {
    id: 'seguridad',
    icon: ShieldCheck,
    title: 'Datos y privacidad',
    intro: 'Reglas claras para los dos lados.',
    body: (
      <Bullets
        items={[
          'Tus documentos legales se guardan privados; los enlaces de revisión caducan en 10 minutos.',
          'No ves la identidad de los referidores de Grupo 3i; ellos no ven tus clientes.',
          'Cada vendedor ve solo lo suyo. Los datos de propietarios de los lotes nunca son públicos.',
          'Contrato de un año, renovable, con 30 días de aviso para terminarlo.',
        ]}
      />
    ),
  },
];

export default function DeveloperManualPage() {
  return (
    <>
      <Seo title="Manual de herramientas para desarrolladoras" description="Guía completa del portal de Grupo 3i: proyectos, mapa de lotes, 360°, CRM, vendedores, avisos, métricas, ventas y mapa para tu web." />
      <PageHeader title="Manual de herramientas" subtitle="Todo lo que tu desarrolladora puede hacer en Grupo 3i, paso a paso." image="/images/secciones/header-nosotros.jpg" />

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[14rem_1fr]">
        <nav className="print:hidden lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand-gray">Contenido</p>
          <ol className="space-y-1.5 text-sm">
            {SECTIONS.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-primary/80 hover:text-accent">
                  {i + 1}. {s.title}
                </a>
              </li>
            ))}
          </ol>
          <Link to="/publica-tu-proyecto/galeria" className="mt-5 inline-block rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-primary">Ver la galería del sistema →</Link>
          <div className="mt-6 space-y-2 text-sm">
            <Link to="/publica-tu-proyecto/propuesta" className="block text-accent hover:underline">Ver la propuesta comercial →</Link>
            <Link to="/publica-tu-proyecto#solicitud" className="block text-accent hover:underline">Solicitar el alta →</Link>
            <button onClick={() => window.print()} className="flex items-center gap-1.5 text-brand-gray hover:text-primary">
              <Printer className="h-4 w-4" /> Imprimir o guardar PDF
            </button>
          </div>
        </nav>

        <div className="space-y-12">
          {SECTIONS.map((s, i) => {
            const Icon = s.icon;
            return (
              <section key={s.id} id={s.id} className="scroll-mt-24 break-inside-avoid">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-secondary">
                    <Icon className="h-5 w-5" strokeWidth={1.7} />
                  </span>
                  <h2 className="font-serif text-2xl font-bold text-primary">
                    {i + 1}. {s.title}
                  </h2>
                </div>
                <p className="mt-3 text-lg text-brand-gray">{s.intro}</p>
                {s.body}
              </section>
            );
          })}
          <div className="rounded-2xl bg-primary p-8 text-center text-white print:hidden">
            <p className="font-serif text-2xl font-bold">¿Listo para publicar tu proyecto?</p>
            <p className="mt-2 text-white/70">Te escribimos por WhatsApp en menos de 24 horas.</p>
            <Link to="/publica-tu-proyecto#solicitud" className="mt-6 inline-block rounded-lg bg-secondary px-6 py-3 font-semibold text-primary">
              Solicitar el alta
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
