import { Link, useLang } from '@/hooks/useLang';
import { LegalDoc, List, type LegalText } from './LegalDoc';

// Política de privacidad y cookies (/privacidad y /en/privacidad).
// Describe lo que el sitio hace hoy: si cambia lo que se recoge o con quién se
// comparte, se actualiza aquí en los dos idiomas.
// Marco legal: Ley Orgánica de Protección de Datos Personales del Ecuador (LOPDP, 2021).

const EMAIL = 'grupoinmobiliario3i.ec@gmail.com';
const mail = <a href={`mailto:${EMAIL}`} className="text-accent underline">{EMAIL}</a>;

const ES: LegalText = {
  seoTitle: 'Política de privacidad',
  seoDesc: 'Qué datos recoge Grupo 3i, para qué los usa, con quién los comparte y cómo ejercer tus derechos.',
  title: 'Política de privacidad y cookies',
  updated: 'Última actualización: octubre de 2026',
  intro: 'En Grupo 3i cuidamos los datos que nos confías. Aquí te explicamos, sin letra pequeña, qué datos recogemos, para qué los usamos, con quién los compartimos y cómo puedes pedirnos que los corrijamos o los borremos.',
  sections: [
    { title: '1. Quién es responsable de tus datos', body: [
      <>Grupo 3i, grupo inmobiliario con operaciones en Manglaralto, provincia de Santa Elena, Ecuador. Para cualquier tema de privacidad escríbenos a {mail} o por WhatsApp al +593 98 487 5050.</>,
    ] },
    { title: '2. Qué datos recogemos', body: [
      'Solo los que necesitamos para atenderte:',
      <List items={[
        <><b>Cuando nos escribes o pides información</b> (formularios de contacto, de un proyecto o de un solar): tu nombre, tu número de WhatsApp, tu email si lo das, tu mensaje y el proyecto o solar que te interesa.</>,
        <><b>Si te registras en Refiere y gana</b>: además, tu documento de identidad (cédula o pasaporte) y tus datos para recibir pagos (cuenta bancaria, PayPal, Payoneer o Wise). Los pedimos para poder pagarte tus comisiones.</>,
        <><b>Si eres una desarrolladora</b>: los datos de tu empresa y de tu equipo, y los documentos legales de tu proyecto, que se guardan en privado.</>,
        <><b>Si reservas un viaje o compras un producto</b>: los datos de la reserva o la compra y de quien viaja.</>,
        <><b>Cómo usas el sitio</b>: qué páginas, proyectos y solares miras, desde qué tipo de dispositivo y en qué idioma, y de qué anuncio o enlace llegaste. Lo medimos con un identificador anónimo, sin tu nombre.</>,
      ]} />,
      'Tu ubicación en el mapa de solares se calcula solo en tu teléfono, únicamente si la activas, y no la guardamos.',
    ] },
    { title: '3. Para qué los usamos', body: [
      <List items={[
        'Responderte y darte la información que pediste, normalmente por WhatsApp.',
        'Gestionar compras, reservas, membresías y pagos.',
        'Pagar las comisiones de Refiere y gana y verificar la identidad de quien las cobra.',
        'Saber qué anuncios y páginas funcionan, para mejorar el sitio y nuestras campañas.',
        'Cumplir obligaciones legales y prevenir fraudes.',
      ]} />,
      'No vendemos tus datos ni los usamos para nada distinto de lo que dice esta política.',
    ] },
    { title: '4. Con quién los compartimos', body: [
      <List items={[
        <><b>La desarrolladora del proyecto que te interesa.</b> Si preguntas por un proyecto de una desarrolladora aliada, tu nombre, tu WhatsApp y tu mensaje llegan a ella y a su asesor, para que te atiendan.</>,
        <><b>El socio que te recomendó</b>, si llegaste por un enlace de Refiere y gana: puede ver que te registraste o compraste, para saber que su comisión está en camino.</>,
        <><b>Proveedores que hacen funcionar el sitio</b>: alojamiento y base de datos (Railway), imágenes (Cloudinary), envío de correos (Resend) y mensajería (WhatsApp). Solo usan los datos para prestarnos ese servicio.</>,
        <><b>Google, Meta y TikTok</b>, solo si aceptas las cookies de medición (ver la sección 6).</>,
        'Autoridades, cuando la ley nos obliga.',
      ]} />,
      'Algunos de estos proveedores guardan datos fuera del Ecuador. Trabajamos con empresas que ofrecen garantías adecuadas de protección.',
    ] },
    { title: '5. Cuánto tiempo los guardamos', body: [
      'Mientras exista una relación contigo (una consulta abierta, una compra, una membresía o una cuenta activa) y, después, el tiempo que exija la ley, por ejemplo para fines tributarios. Los contactos que no avanzan se archivan y puedes pedir que se borren en cualquier momento.',
    ] },
    { title: '6. Cookies y medición', body: [
      'Usamos dos tipos:',
      <List items={[
        <><b>Necesarias</b>: recuerdan tu idioma, si iniciaste sesión, tu elección sobre las cookies y, durante 30 días, el anuncio o enlace por el que llegaste. También guardamos un identificador anónimo para contar visitas. Sin ellas el sitio no funciona bien.</>,
        <><b>De medición y publicidad</b> (Google Analytics, Google Ads, Meta y TikTok): nos dicen qué anuncios traen clientes. <b>Solo se activan si eliges «Aceptar todas»</b> en el aviso de cookies.</>,
      ]} />,
      'Puedes cambiar de opinión borrando los datos del sitio en tu navegador: el aviso volverá a aparecer.',
    ] },
    { title: '7. Tus derechos', body: [
      'Según la Ley Orgánica de Protección de Datos Personales del Ecuador, puedes pedirnos en cualquier momento:',
      <List items={[
        'Saber qué datos tuyos tenemos (acceso).',
        'Corregirlos si están mal (rectificación).',
        'Borrarlos (eliminación).',
        'Que dejemos de usarlos para algo en particular, como enviarte novedades (oposición).',
        'Recibirlos en un formato que puedas llevar a otro lugar (portabilidad).',
      ]} />,
      <>Escríbenos a {mail} desde el correo o el WhatsApp con el que te registraste. Te respondemos en un máximo de 15 días. Si no quedas conforme, puedes acudir a la Superintendencia de Protección de Datos Personales.</>,
    ] },
    { title: '8. Seguridad', body: [
      'Los datos viajan cifrados (https), las contraseñas se guardan cifradas y cada persona del equipo ve solo lo que necesita para su trabajo. Los documentos legales de las desarrolladoras se guardan en privado y sus enlaces de consulta caducan en minutos.',
    ] },
    { title: '9. Menores de edad', body: [
      'El sitio está dirigido a mayores de edad. Para registrarse en Refiere y gana o comprar hay que ser mayor de 18 años.',
    ] },
    { title: '10. Cambios a esta política', body: [
      <>Si cambiamos algo importante, lo publicaremos aquí con la nueva fecha. Las reglas del programa de referidos están en el <Link to="/reglamento" className="text-accent underline">reglamento de Refiere y gana</Link>, y las de la adopción de árboles en los términos del Bosque Montañita.</>,
    ] },
  ],
};

const EN: LegalText = {
  seoTitle: 'Privacy policy',
  seoDesc: 'What data Grupo 3i collects, how we use it, who we share it with and how to exercise your rights.',
  title: 'Privacy and cookie policy',
  updated: 'Last updated: October 2026',
  intro: 'At Grupo 3i, we take care of the information you trust us with. This page explains — in plain language — what we collect, why, who we share it with, and how you can ask us to correct or delete it.',
  sections: [
    { title: '1. Who we are', body: [
      <>Grupo 3i is a real estate group operating in Manglaralto, Santa Elena province, Ecuador. For anything privacy-related, email {mail} or message us on WhatsApp at +593 98 487 5050.</>,
    ] },
    { title: '2. What we collect', body: [
      'Only what we need to help you:',
      <List items={[
        <><b>When you contact us or request information</b> (contact, project or lot forms): your name, WhatsApp number, email if you give it, your message and the project or lot you’re interested in.</>,
        <><b>If you join Refer & Earn</b>: also your ID (Ecuadorian cédula or passport) and your payout details (bank account, PayPal, Payoneer or Wise), so we can pay your commissions.</>,
        <><b>If you’re a developer</b>: your company and team details, and your project’s legal documents, which are stored privately.</>,
        <><b>If you book a trip or buy a product</b>: the booking or purchase details and traveler information.</>,
        <><b>How you use the site</b>: which pages, projects and lots you view, what kind of device and language you use, and which ad or link brought you here. We track this with an anonymous ID, not your name.</>,
      ]} />,
      'If you turn on your location on the lot map, it’s calculated on your phone only, and we never store it.',
    ] },
    { title: '3. How we use it', body: [
      <List items={[
        'To reply and send you the information you asked for — usually on WhatsApp.',
        'To handle purchases, bookings, memberships and payments.',
        'To pay Refer & Earn commissions and verify who’s receiving them.',
        'To see which ads and pages work, so we can improve the site and our campaigns.',
        'To meet legal requirements and prevent fraud.',
      ]} />,
      'We never sell your data or use it for anything not described here.',
    ] },
    { title: '4. Who we share it with', body: [
      <List items={[
        <><b>The developer of the project you’re interested in.</b> If you ask about a partner developer’s project, your name, WhatsApp number and message go to them and their agent so they can help you.</>,
        <><b>The member who referred you</b>, if you came through a Refer & Earn link: they can see that you signed up or made a purchase, so they know their commission is on the way.</>,
        <><b>Service providers that keep the site running</b>: hosting and database (Railway), images (Cloudinary), email delivery (Resend) and messaging (WhatsApp). They only use your data to provide those services to us.</>,
        <><b>Google, Meta and TikTok</b>, only if you accept tracking cookies (see section 6).</>,
        'Government authorities, when the law requires it.',
      ]} />,
      'Some of these providers store data outside Ecuador. We only work with companies that offer appropriate safeguards.',
    ] },
    { title: '5. How long we keep it', body: [
      'For as long as we have a relationship with you — an open inquiry, a purchase, a membership or an active account — and afterward for as long as the law requires, for example for tax purposes. Inquiries that don’t move forward are archived, and you can ask us to delete them at any time.',
    ] },
    { title: '6. Cookies and tracking', body: [
      'We use two kinds:',
      <List items={[
        <><b>Essential</b>: they remember your language, whether you’re signed in, your cookie choice and, for 30 days, the ad or link that brought you here. We also store an anonymous ID to count visits. The site doesn’t work properly without them.</>,
        <><b>Analytics and advertising</b> (Google Analytics, Google Ads, Meta and TikTok): they tell us which ads bring in customers. <b>They’re only turned on if you choose “Accept all”</b> in the cookie banner.</>,
      ]} />,
      'Changed your mind? Clear this site’s data in your browser and the banner will show up again.',
    ] },
    { title: '7. Your rights', body: [
      'Under Ecuador’s Personal Data Protection Law, you can ask us at any time to:',
      <List items={[
        'Tell you what data we have about you (access).',
        'Fix anything that’s wrong (correction).',
        'Delete it (erasure).',
        'Stop using it for a specific purpose, such as sending you updates (objection).',
        'Send it to you in a format you can take elsewhere (portability).',
      ]} />,
      <>Email {mail} from the email or WhatsApp number you registered with. We’ll reply within 15 days. If you’re not satisfied, you can file a complaint with Ecuador’s Superintendency of Personal Data Protection.</>,
    ] },
    { title: '8. Security', body: [
      'Data is encrypted in transit (https), passwords are stored encrypted, and each team member only sees what they need to do their job. Developers’ legal documents are stored privately, and links to view them expire within minutes.',
    ] },
    { title: '9. Minors', body: [
      'This site is intended for adults. You must be 18 or older to join Refer & Earn or make a purchase.',
    ] },
    { title: '10. Changes to this policy', body: [
      <>If we make an important change, we’ll post it here with a new date. The referral program rules are in the <Link to="/reglamento" className="text-accent underline">Refer & Earn terms</Link>, and the tree adoption rules are in the Bosque Montañita terms.</>,
    ] },
  ],
};

export default function PrivacyPage() {
  const { lang } = useLang();
  return <LegalDoc doc={lang === 'en' ? EN : ES} />;
}
