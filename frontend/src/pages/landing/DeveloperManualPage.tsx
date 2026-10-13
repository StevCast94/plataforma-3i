import type { ReactNode } from 'react';
import {
  BadgeCheck, BarChart3, Bell, Box, ClipboardList, Code2, FileSignature, Globe, HandCoins, KanbanSquare, LayoutDashboard, Map,
  MessageCircle, Printer, ShieldCheck, Users,
} from 'lucide-react';
import { Seo } from '@/components/shared/Seo';
import { PageHeader } from '@/components/layout/PageHeader';
import { Link, useLang } from '@/hooks/useLang';

// Manual de herramientas para desarrolladoras (/publica-tu-proyecto/manual).
// Describe lo que existe hoy en la plataforma; si cambia una función, se actualiza aquí,
// en los dos idiomas. El inglés tiene redacción propia (no es traducción literal) y, como
// el portal está en español, cita los botones tal como se ven: «Lotes» (Lots).

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

function Sub({ children, first }: { children: ReactNode; first?: boolean }) {
  return <h4 className={`${first ? '' : 'mt-6 '}font-semibold text-primary`}>{children}</h4>;
}

const VARS = (
  <>
    <code>{'{nombre}'}</code>, <code>{'{proyecto}'}</code> <span>y</span> <code>{'{lote}'}</code>
  </>
);

const ES_SECTIONS: Section[] = [
  {
    id: 'acceso', icon: LayoutDashboard, title: 'Acceso y portal',
    intro: 'Todo se maneja desde grupo3i.com/desarrollador, en el computador o en el celular.',
    body: <Steps items={[
      'Grupo 3i te envía por WhatsApp tu correo y una contraseña temporal.',
      'Entra a grupo3i.com/desarrollador e inicia sesión.',
      'Arriba ves tu empresa y tus condiciones: la comisión acordada para las ventas que llegan por la plataforma y para las ventas a tus propios contactos, y el estado del alta.',
      'Las pestañas son Proyectos, CRM, Ventas y Equipo.',
    ]} />,
  },
  {
    id: 'proyectos', icon: FileSignature, title: 'Crear y publicar un proyecto',
    intro: 'Preparas la ficha como borrador y la envías a revisión. Grupo 3i la publica cuando está verificada.',
    body: <>
      <Steps items={[
        'En Proyectos, toca «+ Nuevo proyecto».',
        'Completa nombre, descripción (mínimo 80 caracteres), ubicación, precio desde, coordenadas, portada y galería. Las fotos se optimizan solas al subirlas.',
        'En «Versión en inglés» escribe el subtítulo, la descripción y el texto del precio para el comprador extranjero. Si lo dejas vacío, la ficha en inglés muestra el texto en español.',
        'Toca «Guardar y enviar a revisión». Mientras está en revisión no se puede editar.',
        'Si Grupo 3i te devuelve el proyecto, verás las observaciones en amarillo. Corrige y vuelve a enviarlo.',
        'Una vez publicado puedes editarlo cuando quieras, o pausarlo y reactivarlo.',
      ]} />
      <Tip>Los estados son Borrador, En revisión, Publicado y Pausado. Solo los publicados se ven en grupo3i.com.</Tip>
    </>,
  },
  {
    id: 'calidad', icon: BadgeCheck, title: 'Puntaje de calidad y sello «Verificado»',
    intro: 'Cada proyecto tiene un puntaje de 0 a 100 que define su orden en la portada. El sello legal es obligatorio para publicar.',
    body: <Bullets items={[
      'Puntaje: portada (10), galería de 6 fotos o más (10), descripción de 300 caracteres o más (10), subtítulo y ubicación (5), coordenadas (5), plano de lotes (10), precios en todos los lotes (15), 3 vistas 360° (10), versión en inglés (10) y verificación (15).',
      'Al editar el proyecto ves tu puntaje y un consejo para cada punto que te falta. Con 90 o más apareces entre los primeros.',
      'Documentos legales: sube la escritura inscrita, el certificado de gravámenes, la aprobación municipal y el plano (PDF o foto). Son privados: solo los ve el equipo legal de Grupo 3i.',
      'Con la revisión completa, tu proyecto muestra el sello «✓ Verificado por Grupo 3i» en su tarjeta y en su ficha.',
    ]} />,
  },
  {
    id: 'lotes', icon: Map, title: 'Mapa interactivo de lotes',
    intro: 'Cada lote con su forma real, precio, medidas, linderos y disponibilidad en vivo.',
    body: <>
      <Bullets items={[
        'El plano (DWG o KMZ) lo cargamos nosotros durante el alta, con la geometría exacta de cada lote.',
        'Tú manejas la parte comercial desde «Lotes» en tu proyecto: estado (disponible, reservado, vendido, no comercializable), precio, precio por m², «solo contado», fotos y notas privadas.',
        'El comprador filtra por manzana, tamaño o disponibilidad, toca un lote y ve su ficha, comparte el enlace por WhatsApp o pide «Cómo llegar».',
        'Cada lote tiene su propia página para compartir, con vista previa en redes y una versión para imprimir con la ficha técnica.',
      ]} />
      <Tip>Marca un lote como vendido apenas se venda: el mapa se actualiza al instante para todos.</Tip>
    </>,
  },
  {
    id: 'vistas360', icon: Box, title: 'Recorridos 360°',
    intro: 'Panorámicas ubicadas sobre el mapa, para recorrer el terreno antes de visitarlo.',
    body: <>
      <Steps items={[
        'Toma la foto con el modo panorámico del celular (o con una cámara 360°), parado en el lote.',
        'En tu proyecto, abre «360°» y sube la imagen (JPG). Se divide en mosaicos para que cargue rápido.',
        'Si la foto trae ubicación y brújula, queda ubicada y orientada sola. Si no, arrastra el punto en el mapa y fija el norte mirando la vista.',
        'Puedes renombrar, ocultar o borrar cada vista.',
      ]} />
      <Tip>Las fotos del iPhone en formato HEIC hay que convertirlas a JPG antes de subirlas.</Tip>
    </>,
  },
  {
    id: 'contactos', icon: MessageCircle, title: 'Cómo llegan los contactos',
    intro: 'Cada interesado queda registrado, con fecha y origen, antes de llegar a tu WhatsApp.',
    body: <Bullets items={[
      'Cuando alguien toca «Contactar un asesor» en tu proyecto, deja su nombre y su WhatsApp, y se abre el chat con tu número con el lote ya escrito.',
      'Origen: «Referido» (llegó por el enlace de un socio de Refiere y gana), «Plataforma» (llegó por grupo3i.com) o «Propio» (lo registraste tú).',
      'Plazo de 180 días: manda el primer registro de cada número. Si un contacto de la plataforma compra dentro de ese plazo, la venta paga la comisión acordada para la plataforma.',
      'Registra a tus propios clientes en CRM → Lista → «+ Contacto propio». Si compran, aplica la comisión acordada para tus propios contactos.',
    ]} />,
  },
  {
    id: 'crm', icon: KanbanSquare, title: 'CRM: embudo de ventas',
    intro: 'Cada contacto entra solo a tu embudo, con la tarea de contactarlo en 24 horas.',
    body: <>
      <Bullets items={[
        'Etapas: Nuevo → Contactado → Visita → Negociación → Venta → Perdido. Arrastra la tarjeta para cambiarla de etapa.',
        'Cada columna suma el presupuesto de sus clientes. Las tarjetas muestran el origen, las etiquetas, el asesor y la próxima tarea.',
        'Alerta roja «Sin atender más de 24 h» y tareas vencidas en rojo.',
        'Al marcar un contacto como Perdido se pide el motivo (precio, financiamiento, ubicación, no responde, compró en otro lado…).',
        'Vistas: Embudo, Agenda (tareas vencidas, de hoy y próximas), Lista y Reportes.',
      ]} />
      <Sub>Ficha del cliente</Sub>
      <Bullets items={[
        'Datos, mensaje original, idioma y origen.',
        'Etapa con un toque, etiquetas y presupuesto.',
        'WhatsApp con plantilla: eliges una, tocas «Enviar» y se abre el chat con el mensaje listo. Queda en el historial.',
        'Tareas con fecha y hora: llamar, visita, seguimiento, propuesta.',
        'Notas y el historial completo de todo lo que pasó con ese cliente.',
      ]} />
      <Sub>Automatizaciones</Sub>
      <Bullets items={[
        'Contacto nuevo → tarea «Contactar al cliente» en 24 horas.',
        'El primer avance de etapa marca esa tarea como hecha.',
        'Pasa a Visita → tarea «Confirmar fecha de la visita».',
        'Venta o Perdido → se cierran las tareas pendientes.',
      ]} />
    </>,
  },
  {
    id: 'plantillas', icon: ClipboardList, title: 'Plantillas de WhatsApp',
    intro: 'Mensajes listos para responder rápido y siempre bien.',
    body: <Bullets items={[
      'Vienen cuatro de ejemplo: primer contacto, agendar visita, seguimiento y una en inglés.',
      'En CRM → «Plantillas», el dueño de la cuenta puede crear las suyas o borrar las que no use. Los asesores las usan, pero no las modifican.',
      <>Variables que se reemplazan solas: {VARS}.</>,
    ]} />,
  },
  {
    id: 'equipo', icon: Users, title: 'Equipo de asesores',
    intro: 'Agrega a tus asesores y los contactos se reparten solos.',
    body: <Steps items={[
      'En Equipo, toca «+ Vendedor» con su nombre y correo. Copia el mensaje con su acceso y envíaselo.',
      'Cada contacto nuevo va al asesor activo con menos contactos abiertos.',
      'Agrega el WhatsApp de cada asesor (columna WhatsApp en Equipo): cuando un cliente deja sus datos, el chat se abre directo con su asesor. Si el asesor no tiene WhatsApp, se abre el de tu empresa.',
      'El asesor solo ve el CRM con sus contactos y sus tareas. No ve proyectos, ventas ni comisiones.',
      'Como dueño de la cuenta ves todo, filtras el embudo por asesor y reasignas clientes desde su ficha.',
      'Si desactivas a un asesor, sus contactos abiertos vuelven a ti.',
    ]} />,
  },
  {
    id: 'avisos', icon: Bell, title: 'Avisos al celular',
    intro: 'Enterarte al instante es la mitad de la venta.',
    body: <>
      <Bullets items={[
        'Toca «Activar avisos» en el portal desde cada celular que vaya a recibirlos.',
        '«🔔 Nuevo contacto»: le llega al asesor asignado (o al dueño de la cuenta).',
        '«⏰ Tarea por vencer» o «Tarea vencida»: 15 minutos antes o al vencer, una sola vez.',
        'Avisos del mapa para tu web: 7, 3 y 1 día antes de que venza tu plan.',
      ]} />
      <Tip>En iPhone, los avisos funcionan con el portal instalado en la pantalla de inicio.</Tip>
    </>,
  },
  {
    id: 'reportes', icon: BarChart3, title: 'Métricas y reportes',
    intro: 'Sabrás qué funciona, semana a semana.',
    body: <>
      <Sub first>Métricas del proyecto</Sub>
      <Bullets items={[
        'Embudo: vieron el proyecto → vieron un lote → abrieron un 360° → tocaron WhatsApp → dejaron sus datos → compraron.',
        'Visitas y contactos por semana, lotes más vistos, celular o computador, español o inglés.',
        'Períodos de 7, 30 o 90 días, o un año.',
      ]} />
      <Sub>Reportes del CRM</Sub>
      <Bullets items={[
        'Tiempo de primera respuesta y porcentaje de contactos atendidos en 24 horas.',
        'Conversión por etapa y motivos de pérdida.',
        'Desempeño por asesor: contactos, rapidez, ventas y monto.',
      ]} />
    </>,
  },
  {
    id: 'ventas', icon: HandCoins, title: 'Ventas y comisión',
    intro: 'Ganamos cuando tú vendes, y cobramos la comisión a medida que tu cliente te paga.',
    body: <>
      <Steps items={[
        'En CRM → Lista, toca «Venta» en el cliente: lote, precio, contado o financiado, entrada y comprobante.',
        'Grupo 3i confirma la venta: el lote pasa a Vendido y el cliente a Venta.',
        'Si es financiado, registra cada pago del cliente en Ventas → «+ Registrar pago».',
        'Con cada pago se calcula la comisión acordada (según el origen del contacto). En Ventas ves lo generado, lo pagado y lo pendiente.',
      ]} />
      <Tip>Si el comprador desiste, se anulan las comisiones de los pagos que aún no cobraste.</Tip>
    </>,
  },
  {
    id: 'mapa-web', icon: Code2, title: 'Mapa para tu web',
    intro: 'Tu mapa interactivo de lotes, con tu logo y tu color, dentro de tu propia página.',
    body: <>
      <Steps items={[
        'En tu proyecto, sección «Mapa para tu web»: sube tu logo y elige tu color, el nombre y el WhatsApp que recibe los contactos.',
        'Con el plan activo aparece el código. Toca «Copiar código» y pégalo en tu web (WordPress, Wix, Webflow o HTML).',
        'El mapa ajusta su altura solo y funciona en el celular.',
        'Los contactos que lleguen desde tu web entran a tu CRM como propios.',
      ]} />
      <p className="mt-4 text-sm text-brand-gray">El plan del mapa se acuerda en privado. Si no se renueva, el mapa se apaga solo al vencer.</p>
    </>,
  },
  {
    id: 'dominio', icon: Globe, title: 'Dominio propio',
    intro: 'El mapa también puede estar en tu dominio, por ejemplo mapa.tulotizacion.com.',
    body: <Steps items={[
      'Dinos qué dominio quieres usar.',
      'Crea en tu proveedor de dominio un registro CNAME con el destino que te indiquemos.',
      'Nosotros lo activamos con certificado de seguridad (https). En unos minutos tu dominio muestra el mapa.',
    ]} />,
  },
  {
    id: 'seguridad', icon: ShieldCheck, title: 'Datos y privacidad',
    intro: 'Reglas claras para ambas partes.',
    body: <Bullets items={[
      'Tus documentos legales se guardan en privado; los enlaces de revisión caducan en 10 minutos.',
      'No ves la identidad de los referidores de Grupo 3i, y ellos no ven a tus clientes.',
      'Cada asesor ve solo lo suyo. Los datos de los propietarios de los lotes nunca son públicos.',
      'Contrato de un año, renovable, con 30 días de aviso para terminarlo.',
    ]} />,
  },
];

const EN_SECTIONS: Section[] = [
  {
    id: 'acceso', icon: LayoutDashboard, title: 'Getting started',
    intro: 'Everything runs from grupo3i.com/desarrollador, on your computer or your phone. The portal itself is in Spanish, so we quote each button as you’ll see it.',
    body: <Steps items={[
      'We’ll send your login email and a temporary password over WhatsApp.',
      'Go to grupo3i.com/desarrollador and sign in.',
      'At the top you’ll see your company and your terms: the agreed commission on sales we bring in and on sales to your own leads, and your onboarding status.',
      'The tabs are Proyectos (Projects), CRM, Ventas (Sales) and Equipo (Team).',
    ]} />,
  },
  {
    id: 'proyectos', icon: FileSignature, title: 'Creating and publishing a project',
    intro: 'You build the listing as a draft and submit it for review. We publish it once it’s been vetted.',
    body: <>
      <Steps items={[
        'Under Proyectos, tap «+ Nuevo proyecto» (New project).',
        'Fill in the name, description (80 characters minimum), location, starting price, coordinates, cover photo and gallery. Photos are optimized automatically on upload.',
        'In «Versión en inglés» (English version), write the headline, description and price line for international buyers. Leave it blank and the English listing will show your Spanish text.',
        'Tap «Guardar y enviar a revisión» (Save and submit). While it’s under review, you can’t edit it.',
        'If we send it back, you’ll see our notes highlighted in yellow. Make the changes and resubmit.',
        'Once it’s live you can edit it anytime, or pause it and bring it back.',
      ]} />
      <Tip>A project is either a draft, under review, live or paused. Only live projects appear on grupo3i.com.</Tip>
    </>,
  },
  {
    id: 'calidad', icon: BadgeCheck, title: 'Listing score and the “Verified” seal',
    intro: 'Every project gets a score from 0 to 100 that sets its position on the homepage. The legal seal is required to go live.',
    body: <Bullets items={[
      'How it’s scored: cover photo (10), a gallery of 6+ photos (10), a description of 300+ characters (10), headline and location (5), coordinates (5), lot plan (10), prices on every lot (15), three 360° views (10), English version (10) and verification (15).',
      'When you edit a project, you’ll see your score and a tip for each missing item. Score 90 or higher and you’ll be near the top.',
      'Legal documents: upload the recorded deed, the lien certificate, municipal approval and the site plan (PDF or photo). They stay private — only our legal team sees them.',
      'Once the review is complete, your project carries the “✓ Verified by Grupo 3i” seal on its card and listing.',
    ]} />,
  },
  {
    id: 'lotes', icon: Map, title: 'Interactive lot map',
    intro: 'Every lot in its true shape, with price, dimensions, boundaries and real-time availability.',
    body: <>
      <Bullets items={[
        'We load your site plan (DWG or KMZ) during onboarding, with the exact boundaries of every lot.',
        'You handle the sales side from «Lotes» (Lots) in your project: status (available, on hold, sold, not for sale), price, price per m², cash-only, photos and private notes.',
        'Buyers filter by block, size or availability, tap a lot to see its details, share the link on WhatsApp or get directions.',
        'Every lot has its own shareable page, with a social media preview and a printable spec sheet.',
      ]} />
      <Tip>Mark a lot as sold the moment it sells — the map updates instantly for everyone.</Tip>
    </>,
  },
  {
    id: 'vistas360', icon: Box, title: '360° tours',
    intro: 'Panoramas pinned on the map, so buyers can walk the property before they visit.',
    body: <>
      <Steps items={[
        'Stand on the lot and shoot with your phone’s panorama mode (or a 360° camera).',
        'In your project, open «360°» and upload the image (JPG). It’s split into tiles so it loads fast.',
        'If the photo has location and compass data, it places and orients itself. If not, drag the pin on the map and set north by looking at the view.',
        'You can rename, hide or delete each view.',
      ]} />
      <Tip>iPhone photos saved as HEIC need to be converted to JPG before uploading.</Tip>
    </>,
  },
  {
    id: 'contactos', icon: MessageCircle, title: 'How leads come in',
    intro: 'Every lead is logged, with date and source, before it ever reaches your WhatsApp.',
    body: <Bullets items={[
      'When someone taps “Talk to an agent” on your project, they leave their name and WhatsApp number, and a chat opens with your number and the lot already filled in.',
      'Lead source: «Referido» (came through a Refer & Earn member’s link), «Plataforma» (came through grupo3i.com) or «Propio» (you added it yourself).',
      '180-day window: the first time a number is logged is the one that counts. If a lead we brought in buys within that window, the sale carries the agreed platform commission.',
      'Add your own leads under CRM → Lista → «+ Contacto propio» (Own lead). If they buy, the agreed commission for your own leads applies.',
    ]} />,
  },
  {
    id: 'crm', icon: KanbanSquare, title: 'CRM: your sales pipeline',
    intro: 'Every lead lands in your pipeline automatically, with a task to reach out within 24 hours.',
    body: <>
      <Bullets items={[
        'Stages: New → Contacted → Site visit → Negotiation → Sold → Lost. Drag a card to move it.',
        'Each column totals its buyers’ budgets. Cards show the source, tags, agent and next task.',
        'A red alert flags leads untouched for more than 24 hours, and overdue tasks turn red.',
        'When you mark a lead as Lost, you’re asked why (price, financing, location, unresponsive, bought elsewhere…).',
        'Views: Pipeline, Schedule (overdue, today and upcoming tasks), List and Reports.',
      ]} />
      <Sub>Lead profile</Sub>
      <Bullets items={[
        'Contact details, original message, language and source.',
        'One-tap stage changes, tags and budget.',
        'WhatsApp templates: pick one, tap «Enviar» (Send) and the chat opens with the message ready to go. It’s saved to the history.',
        'Tasks with a date and time: call, site visit, follow-up, proposal.',
        'Notes and a full history of everything that’s happened with that buyer.',
      ]} />
      <Sub>Automations</Sub>
      <Bullets items={[
        'New lead → a “Contact the buyer” task due in 24 hours.',
        'The first stage change checks that task off.',
        'Moved to Site visit → a “Confirm the visit date” task.',
        'Sold or Lost → any open tasks are closed.',
      ]} />
    </>,
  },
  {
    id: 'plantillas', icon: ClipboardList, title: 'WhatsApp templates',
    intro: 'Ready-made messages so every reply is fast and on point.',
    body: <Bullets items={[
      'You start with four samples: first contact, booking a visit, follow-up and one in English.',
      'Under CRM → «Plantillas» (Templates), the account owner can add new ones or delete the ones you don’t use. Agents can use them but not edit them.',
      <>Placeholders fill themselves in: <code>{'{nombre}'}</code> (name), <code>{'{proyecto}'}</code> (project) and <code>{'{lote}'}</code> (lot).</>,
    ]} />,
  },
  {
    id: 'equipo', icon: Users, title: 'Your sales team',
    intro: 'Add your agents and leads are shared out automatically.',
    body: <Steps items={[
      'Under Equipo, tap «+ Vendedor» (Agent) and enter their name and email. Copy the message with their login and send it to them.',
      'Each new lead goes to the active agent with the fewest open leads.',
      'Add each agent’s WhatsApp number (WhatsApp column under Equipo): when a buyer leaves their details, the chat opens straight to their agent. If the agent has no number, it opens your company’s.',
      'Agents only see the CRM, with their own leads and tasks. No projects, sales or commissions.',
      'As the account owner, you see everything, filter the pipeline by agent and reassign buyers from their profile.',
      'Deactivate an agent and their open leads come back to you.',
    ]} />,
  },
  {
    id: 'avisos', icon: Bell, title: 'Phone notifications',
    intro: 'Hearing about a lead right away is half the sale.',
    body: <>
      <Bullets items={[
        'Tap «Activar avisos» (Turn on notifications) in the portal on every phone that should get them.',
        '“🔔 New lead”: goes to the assigned agent (or the account owner).',
        '“⏰ Task due soon” or “Task overdue”: 15 minutes before or when it’s due, just once.',
        'Website map reminders: 7, 3 and 1 day before your plan expires.',
      ]} />
      <Tip>On iPhone, notifications work once the portal is added to your home screen.</Tip>
    </>,
  },
  {
    id: 'reportes', icon: BarChart3, title: 'Analytics and reports',
    intro: 'See what’s working, week by week.',
    body: <>
      <Sub first>Project analytics</Sub>
      <Bullets items={[
        'Funnel: viewed the project → viewed a lot → opened a 360° view → tapped WhatsApp → left their details → bought.',
        'Weekly visits and leads, most-viewed lots, mobile vs. desktop, English vs. Spanish.',
        'Last 7, 30 or 90 days, or the past year.',
      ]} />
      <Sub>CRM reports</Sub>
      <Bullets items={[
        'Average first-response time and the share of leads contacted within 24 hours.',
        'Conversion by stage and reasons deals were lost.',
        'Performance by agent: leads, response speed, sales and volume.',
      ]} />
    </>,
  },
  {
    id: 'ventas', icon: HandCoins, title: 'Sales and commission',
    intro: 'We get paid when you sell — and only as your buyer pays you.',
    body: <>
      <Steps items={[
        'Under CRM → Lista, tap «Venta» (Sale) on the buyer: lot, price, cash or installments, down payment and receipt.',
        'We confirm the sale: the lot switches to Sold and the buyer to Sold.',
        'For installment sales, log each payment under Ventas → «+ Registrar pago» (Add payment).',
        'Commission is calculated on each payment, at the agreed rate for the lead source. Ventas shows what’s been earned, paid and outstanding.',
      ]} />
      <Tip>If the buyer backs out, commission on payments you haven’t received yet is canceled.</Tip>
    </>,
  },
  {
    id: 'mapa-web', icon: Code2, title: 'Map for your website',
    intro: 'Your interactive lot map, with your logo and colors, right on your own site.',
    body: <>
      <Steps items={[
        'In your project, go to «Mapa para tu web» (Website map): upload your logo and choose your color, display name and the WhatsApp number that receives leads.',
        'Once your plan is active, the embed code appears. Tap «Copiar código» (Copy code) and paste it into your site (WordPress, Wix, Webflow or plain HTML).',
        'The map resizes itself and works on phones.',
        'Leads from your website go into your CRM as your own.',
      ]} />
      <p className="mt-4 text-sm text-brand-gray">Map plan pricing is agreed in private. If it isn’t renewed, the map switches off when the plan expires.</p>
    </>,
  },
  {
    id: 'dominio', icon: Globe, title: 'Your own domain',
    intro: 'The map can also live on your own domain, like map.yourdevelopment.com.',
    body: <Steps items={[
      'Tell us which domain you’d like to use.',
      'At your domain provider, create a CNAME record pointing to the address we give you.',
      'We switch it on with an SSL certificate (https). Within minutes, your domain shows the map.',
    ]} />,
  },
  {
    id: 'seguridad', icon: ShieldCheck, title: 'Data and privacy',
    intro: 'Clear rules for both sides.',
    body: <Bullets items={[
      'Your legal documents are stored privately; review links expire after 10 minutes.',
      'You don’t see who our referrers are, and they don’t see your buyers.',
      'Each agent sees only their own leads. Lot owners’ details are never made public.',
      'One-year agreement, renewable, with 30 days’ notice to end it.',
    ]} />,
  },
];

const UI = {
  es: {
    seoTitle: 'Manual de herramientas para desarrolladoras',
    seoDesc: 'Guía completa del portal de Grupo 3i: proyectos, mapa de lotes, 360°, CRM, asesores, avisos, métricas, ventas y mapa para tu web.',
    title: 'Manual de herramientas', subtitle: 'Todo lo que tu desarrolladora puede hacer en Grupo 3i, paso a paso.',
    contents: 'Contenido', gallery: 'Ver la galería del sistema →', proposal: 'Ver la propuesta comercial →', apply: 'Solicitar el alta',
    print: 'Imprimir o guardar en PDF', ready: '¿Listo para publicar tu proyecto?', reply: 'Te escribimos por WhatsApp en menos de 24 horas.',
  },
  en: {
    seoTitle: 'Developer platform guide',
    seoDesc: 'A complete guide to the Grupo 3i developer portal: listings, lot map, 360° tours, CRM, agents, notifications, analytics, sales and a map for your website.',
    title: 'Platform guide', subtitle: 'Everything your company can do on Grupo 3i, step by step.',
    contents: 'Contents', gallery: 'See the screenshot gallery →', proposal: 'Read the partner proposal →', apply: 'Apply to join',
    print: 'Print or save as PDF', ready: 'Ready to list your project?', reply: 'We’ll reach out on WhatsApp within 24 hours.',
  },
};

export default function DeveloperManualPage() {
  const { lang } = useLang();
  const en = lang === 'en';
  const ui = UI[en ? 'en' : 'es'];
  const SECTIONS = en ? EN_SECTIONS : ES_SECTIONS;
  return (
    <>
      <Seo title={ui.seoTitle} description={ui.seoDesc} />
      <PageHeader title={ui.title} subtitle={ui.subtitle} image="/images/secciones/header-nosotros.jpg" />

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[14rem_1fr]">
        <nav className="print:hidden lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand-gray">{ui.contents}</p>
          <ol className="space-y-1.5 text-sm">
            {SECTIONS.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-primary/80 hover:text-accent">
                  {i + 1}. {s.title}
                </a>
              </li>
            ))}
          </ol>
          <Link to="/publica-tu-proyecto/galeria" className="mt-5 inline-block rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-primary">{ui.gallery}</Link>
          <div className="mt-6 space-y-2 text-sm">
            <Link to="/publica-tu-proyecto/propuesta" className="block text-accent hover:underline">{ui.proposal}</Link>
            <Link to="/publica-tu-proyecto#solicitud" className="block text-accent hover:underline">{ui.apply} →</Link>
            <button onClick={() => window.print()} className="flex items-center gap-1.5 text-brand-gray hover:text-primary">
              <Printer className="h-4 w-4" /> {ui.print}
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
            <p className="font-serif text-2xl font-bold">{ui.ready}</p>
            <p className="mt-2 text-white/70">{ui.reply}</p>
            <Link to="/publica-tu-proyecto#solicitud" className="mt-6 inline-block rounded-lg bg-secondary px-6 py-3 font-semibold text-primary">
              {ui.apply}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
