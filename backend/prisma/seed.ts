import { PrismaClient, ProductType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PUBLIC_BASE =
  process.env.PUBLIC_BASE_URL ?? 'https://plataforma-3i-production.up.railway.app';

// Ibiza: imágenes reales en Cloudinary (cloud dos8bzljc).
// Montañita / Viajes: placeholders Unsplash hasta tener las reales.
const CLD = 'https://res.cloudinary.com/dos8bzljc/image/upload/q_auto:best,f_auto';
const IMG = {
  ibiza: `${CLD}/Ibiza_condohotel_portada`,
  ibizaGallery: [
    `${CLD}/Ibiza_condohotel_1`,
    `${CLD}/Ibiza_condohotel_2`,
    `${CLD}/Ibiza_condohotel_3`,
  ],
  montanita:
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1600&auto=format&fit=crop',
  montanitaGallery: [
    'https://images.unsplash.com/photo-1540541338287-41700207dee6?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1559827260-dc66d52bef19?q=80&w=1600&auto=format&fit=crop',
  ],
  viajes:
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1600&auto=format&fit=crop',
};

// ============ SITE CONTENT ============
const siteContent: { section: string; key: string; value: string }[] = [
  { section: 'hero', key: 'title', value: 'Invierte en el futuro. Vive el presente.' },
  {
    section: 'hero',
    key: 'subtitle',
    value:
      'Propiedades fraccionadas, membresías de viaje y experiencias premium en la costa ecuatoriana.',
  },
  { section: 'hero', key: 'cta_text', value: 'Explorar proyectos' },
  { section: 'hero', key: 'cta_url', value: '#/proyectos' },
  {
    section: 'hero',
    key: 'image_url',
    value:
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1920&auto=format&fit=crop',
  },
  {
    section: 'about',
    key: 'title',
    value: 'Grupo 3i — Inversión Inmobiliaria Inteligente',
  },
  {
    section: 'about',
    key: 'body',
    value:
      'Somos un grupo inmobiliario enfocado en democratizar la inversión a través de propiedades fraccionadas, membresías de viaje y proyectos de alto nivel en Ecuador. Hacemos accesible lo que antes era exclusivo.',
  },
  { section: 'projects', key: 'title', value: 'Nuestros Proyectos' },
  {
    section: 'projects',
    key: 'subtitle',
    value: 'Oportunidades de inversión cuidadosamente seleccionadas.',
  },
  { section: 'club', key: 'title', value: 'Únete al Club 3i' },
  {
    section: 'club',
    key: 'subtitle',
    value:
      'Viaja por el mundo con descuentos de hasta 70% y accede a beneficios exclusivos.',
  },
  { section: 'contact', key: 'title', value: 'Hablemos de tu próxima inversión' },
  {
    section: 'contact',
    key: 'subtitle',
    value: 'Déjanos tus datos y un asesor te contactará en menos de 24 horas.',
  },
  { section: 'contact', key: 'email', value: 'info@grupo3i.com' },
  { section: 'contact', key: 'phone', value: '+593 99 999 9999' },
  {
    section: 'footer',
    key: 'tagline',
    value: 'Inversión inmobiliaria inteligente en la costa ecuatoriana.',
  },
  { section: 'footer', key: 'copyright', value: '© 2026 Grupo 3i. Todos los derechos reservados.' },
];

// ============ PROYECTOS ============
const projects = [
  {
    slug: 'ibiza-condohotel',
    name: 'Ibiza Condohotel',
    subtitle: 'Inversión premium en la costa ecuatoriana',
    description:
      'Condohotel de lujo frente al mar que combina la rentabilidad de un hotel con la propiedad fraccionada. Disfruta de amenidades de cinco estrellas mientras tu inversión genera retornos por ocupación hotelera.',
    location: 'Costa Ecuatoriana',
    coverImage: IMG.ibiza,
    images: IMG.ibizaGallery,
    features: {
      tipo: 'Condohotel',
      unidades: 24,
      amenities: ['Piscina', 'Gimnasio', 'Spa', 'Restaurante'],
    },
    priceFrom: 12000,
    priceLabel: 'Fracciones desde $12,000',
    featured: true,
  },
  {
    slug: 'montanita-view',
    name: 'Montañita View',
    subtitle: 'Amenidades exclusivas con vista al mar',
    description:
      'Complejo con piscina, restaurante, bar y áreas sociales en uno de los destinos más vibrantes del Ecuador. Acceso VIP incluido para miembros del Club 3i.',
    location: 'Montañita, Santa Elena',
    coverImage: IMG.montanita,
    images: IMG.montanitaGallery,
    features: {
      amenities: ['Piscina', 'Restaurante', 'Bar', 'Lobby VIP', 'Áreas sociales'],
    },
    priceFrom: 25000,
    priceLabel: 'Desde $25,000',
    featured: true,
  },
];

// ============ PRODUCTOS ============
const products = [
  {
    slug: 'membresia-viajes-club-3i',
    name: 'Membresía de Viajes Club 3i',
    type: ProductType.TRAVEL_MEMBERSHIP,
    price: 500,
    promoPrice: 300,
    description:
      'Acceso a descuentos de hasta 70% en hoteles mundiales, certificados vacacionales y beneficios exclusivos durante todo el año.',
    features: [
      'Hasta 70% de descuento en hoteles mundiales',
      'Certificado vacacional anual GRATIS en 120+ destinos',
      'Acceso a remates exclusivos de tiempo compartido',
      'Descuentos en 220,000+ restaurantes en EE.UU.',
      'Hasta 50% desc. en asesoría de visa americana',
      'Garantía del mejor precio',
      'Acceso VIP a amenidades Montañita View',
    ],
    images: [IMG.viajes],
    featured: true,
  },
];

async function main() {
  console.log('🌱 Sembrando datos...');

  // Site content
  for (const c of siteContent) {
    await prisma.siteContent.upsert({
      where: { section_key: { section: c.section, key: c.key } },
      create: c,
      update: { value: c.value },
    });
  }
  console.log(`   ✔ ${siteContent.length} entradas de SiteContent`);

  // Proyectos
  const projectBySlug: Record<string, string> = {};
  for (const p of projects) {
    const row = await prisma.project.upsert({
      where: { slug: p.slug },
      create: p,
      update: p,
    });
    projectBySlug[p.slug] = row.id;
  }
  console.log(`   ✔ ${projects.length} proyectos`);

  // Productos
  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      create: p,
      update: p,
    });
  }
  console.log(`   ✔ ${products.length} productos`);

  await seedMembers();
  await seedStaff();

  console.log('✅ Seed completado.');
}

// ============ STAFF ADMIN ============
async function seedStaff() {
  const password = await bcrypt.hash('3iAdmin2026!', 10);
  await prisma.staffUser.upsert({
    where: { username: 'stevens' },
    update: {},
    create: { username: 'stevens', password, role: 'superadmin' },
  });
  console.log('   ✔ staff admin (stevens / 3iAdmin2026!)');
}

// ============ MIEMBROS DE EJEMPLO (programa de referidos) ============
async function seedMembers() {
  const passwordHash = await bcrypt.hash('password123', 10);
  const link = (code: string) => `${PUBLIC_BASE}/#/oficina/registro?ref=${code}`;

  // 1) Miembro Elite (referidor)
  const eliteCode = '3IE-ELITE1';
  const elite = await prisma.referralMember.upsert({
    where: { email: 'elite@club3i.com' },
    update: {},
    create: {
      fullName: 'Ana Elite Demo',
      email: 'elite@club3i.com',
      phone: '+593 99 111 1111',
      passwordHash,
      docId: '0900000001',
      status: 'ELITE',
      referralCode: eliteCode,
      eliteSince: new Date(),
      eliteBy: 'PURCHASE',
      walletBalance: 420,
      totalEarned: 920,
      totalReferrals: 1,
      lastReferralAt: new Date(),
      kycVerified: true,
      kycVerifiedAt: new Date(),
      payoutMethod: 'paypal',
      payoutEmail: 'elite@club3i.com',
    },
  });
  await prisma.referralLink.upsert({
    where: { code: eliteCode },
    update: {},
    create: { memberId: elite.id, code: eliteCode, fullUrl: link(eliteCode), clicks: 34, conversions: 1 },
  });

  // 2) Miembro Premiere (referido por la Elite)
  const premiereCode = '3IP-PREM01';
  const premiere = await prisma.referralMember.upsert({
    where: { email: 'premiere@club3i.com' },
    update: {},
    create: {
      fullName: 'Carlos Premiere Demo',
      email: 'premiere@club3i.com',
      phone: '+593 99 222 2222',
      passwordHash,
      docId: '0900000002',
      status: 'PREMIERE',
      referralCode: premiereCode,
      referrerId: elite.id,
      totalReferrals: 0,
      referralsCountToElite: 2,
      lastReferralAt: new Date(),
      kycVerified: true,
      kycVerifiedAt: new Date(),
      payoutMethod: 'transfer',
    },
  });
  await prisma.referralLink.upsert({
    where: { code: premiereCode },
    update: {},
    create: { memberId: premiere.id, code: premiereCode, fullUrl: link(premiereCode), clicks: 8, conversions: 1 },
  });

  // Relación de referido (nivel 1): Elite → Premiere, con primera compra hecha.
  const existingRef = await prisma.referral.findFirst({
    where: { referrerId: elite.id, referredId: premiere.id, level: 1 },
  });
  const referral =
    existingRef ??
    (await prisma.referral.create({
      data: {
        referrerId: elite.id,
        referredId: premiere.id,
        level: 1,
        attributionMethod: 'link',
        status: 'active',
        firstPurchaseAt: new Date(),
      },
    }));

  // Comisiones de ejemplo para la Elite (distintos estados del ciclo de vida).
  const membership = await prisma.product.findUnique({
    where: { slug: 'membresia-viajes-club-3i' },
    select: { id: true },
  });
  const sampleCommissions = [
    { amount: 100, rate: 0, type: 'fixed', status: 'PAID' as const, paidAt: new Date() },
    { amount: 100, rate: 0, type: 'fixed', status: 'LIQUIDATED' as const },
    { amount: 480, rate: 0.04, type: 'percentage', status: 'CONFIRMED' as const },
    { amount: 240, rate: 0.04, type: 'percentage', status: 'PENDING' as const },
  ];
  const existingComm = await prisma.commission.count({ where: { memberId: elite.id } });
  if (existingComm === 0) {
    for (const c of sampleCommissions) {
      await prisma.commission.create({
        data: {
          memberId: elite.id,
          referralId: referral.id,
          productId: membership?.id ?? null,
          amount: c.amount,
          rate: c.rate,
          type: c.type,
          status: c.status,
          paidAt: 'paidAt' in c ? c.paidAt : null,
          holdUntil: c.status === 'PENDING' ? new Date(Date.now() + 30 * 86400000) : null,
        },
      });
    }
  }

  // Notificación de bienvenida para ambos.
  for (const m of [elite, premiere]) {
    const has = await prisma.notification.count({ where: { memberId: m.id } });
    if (has === 0) {
      await prisma.notification.create({
        data: {
          memberId: m.id,
          type: 'new_referral',
          title: '¡Bienvenido al Club 3i!',
          body: 'Tu oficina virtual está lista. Comparte tu enlace y empieza a ganar.',
        },
      });
    }
  }

  console.log('   ✔ 2 miembros demo (elite@club3i.com / premiere@club3i.com — pass: password123)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
