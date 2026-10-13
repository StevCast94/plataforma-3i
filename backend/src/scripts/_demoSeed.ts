// SOLO LOCAL: crea una desarrolladora de demostración para capturas. Se borra después.
import { PrismaClient, type LeadStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma';
import { registerLead } from '../services/projectLeads';
import { onStageChange, logActivity } from '../services/crm';
import { confirmSale, collectInstallment } from '../services/developerSales';

if (!process.env.DATABASE_URL?.includes('localhost')) throw new Error('Solo local');
const prod = new PrismaClient({ datasourceUrl: process.env.PROD_URL });
const DAY = 86400_000;
const now = Date.now();
const ago = (d: number, h = 10) => new Date(now - d * DAY + (h - 12) * 3600_000);
const pick = <T,>(a: T[], i: number) => a[i % a.length];

async function main() {
  const src = await prod.project.findUniqueOrThrow({ where: { slug: 'montanita-view' }, include: { lots: true, panoramas: true } });
  const { id: _i, lots, panoramas, createdAt: _c, updatedAt: _u, developerId: _d, customDomain: _cd, ...rest } = src as any;

  const dev = await prisma.developer.create({
    data: {
      name: 'Costa Viva Desarrollos', legalName: 'Costa Viva Desarrollos S.A.', ruc: '0992000000001', contactName: 'Andrea Salazar',
      email: 'andrea@costaviva.test', whatsapp: '+593 99 000 0000', status: 'ACTIVE', onboardingPaid: true,
    },
  });
  const pw = await bcrypt.hash('demo-local-1234', 10);
  const owner = await prisma.developerUser.create({ data: { developerId: dev.id, email: 'andrea@costaviva.test', name: 'Andrea Salazar', password: pw, role: 'OWNER' } });
  const s1 = await prisma.developerUser.create({ data: { developerId: dev.id, email: 'carlos@costaviva.test', name: 'Carlos Mendoza', password: pw, role: 'SELLER' } });
  const s2 = await prisma.developerUser.create({ data: { developerId: dev.id, email: 'valeria@costaviva.test', name: 'Valeria Ortiz', password: pw, role: 'SELLER' } });
  const sellers = [s1, s2, owner];

  const project = await prisma.project.create({
    data: {
      ...rest, slug: 'brisas-de-olon', name: 'Brisas de Olón', subtitle: 'Lotes con vista al mar en la Ruta del Spondylus',
      developerId: dev.id, publishStatus: 'PUBLISHED', featured: false, verifiedAt: ago(40), captureLeads: true,
      embedEnabled: true, mapPaidUntil: ago(-25), showcase: true,
    },
  });
  for (const l of lots) {
    const { id: _a, projectId: _b, createdAt: _x, updatedAt: _y, ...lr } = l as any;
    await prisma.lot.create({ data: { ...lr, projectId: project.id } });
  }
  for (const p of panoramas) {
    const { id: _a, projectId: _b, createdAt: _x, updatedAt: _y, ...pr } = p as any;
    await prisma.panorama.create({ data: { ...pr, projectId: project.id } });
  }
  const codes = lots.filter((l: any) => l.kind === 'LOT').map((l: any) => l.code);

  // Eventos de 8 semanas (crecientes)
  const types = ['view', 'view', 'view', 'lot_view', 'lot_view', 'pano_open', 'wa_click', 'share'];
  const ev: any[] = [];
  for (let d = 56; d >= 0; d--) {
    const n = Math.round(12 + (56 - d) * 0.9 + (d % 7 === 1 ? 10 : 0));
    for (let k = 0; k < n; k++) {
      const type = pick(types, k * 7 + d);
      ev.push({
        projectId: project.id, type, lotCode: type === 'lot_view' || type === 'wa_click' ? pick(codes, (k * 13 + d) % 9) : null,
        visitorId: `v${d}-${k % Math.max(3, Math.floor(n * 0.7))}`, lang: k % 4 === 0 ? 'en' : 'es', device: k % 3 ? 'mobile' : 'desktop',
        createdAt: ago(d, 8 + (k % 12)),
      });
    }
  }
  await prisma.projectEvent.createMany({ data: ev });

  const names = [
    'María Gómez', 'John Peterson', 'Carlos Ruiz', 'Ana Torres', 'Luis Molina', 'Sofía Vera', 'Diego Paredes', 'Laura Chen',
    'Pedro Alvarado', 'Emily Brooks', 'Jorge Cedeño', 'Daniela Ponce', 'Andrés Rivas', 'Gabriela León', 'Mark Wilson', 'Paola Suárez',
    'Ricardo Bravo', 'Valentina Ríos', 'Tom Becker', 'Fernanda Zambrano', 'Esteban Loor', 'Camila Franco', 'Hugo Villacís', 'Isabel Mora',
  ];
  const plan: [LeadStatus, string, number][] = [
    ['NEW', 'PLATFORM', 0], ['NEW', 'REFERRAL', 1], ['NEW', 'PLATFORM', 0], ['NEW', 'DEVELOPER', 2], ['CONTACTED', 'REFERRAL', 3],
    ['CONTACTED', 'PLATFORM', 4], ['CONTACTED', 'PLATFORM', 6], ['CONTACTED', 'REFERRAL', 8], ['VISIT', 'PLATFORM', 9], ['VISIT', 'REFERRAL', 12],
    ['VISIT', 'DEVELOPER', 14], ['NEGOTIATION', 'PLATFORM', 16], ['NEGOTIATION', 'REFERRAL', 20], ['WON', 'PLATFORM', 30], ['WON', 'DEVELOPER', 38],
    ['WON', 'PLATFORM', 45], ['LOST', 'PLATFORM', 22], ['LOST', 'REFERRAL', 26], ['CONTACTED', 'DEVELOPER', 5], ['NEW', 'REFERRAL', 0],
    ['VISIT', 'PLATFORM', 11], ['LOST', 'PLATFORM', 33], ['NEGOTIATION', 'DEVELOPER', 18], ['CONTACTED', 'PLATFORM', 7],
  ];
  const order: LeadStatus[] = ['NEW', 'CONTACTED', 'VISIT', 'NEGOTIATION', 'WON'];
  const won: any[] = [];
  for (let i = 0; i < plan.length; i++) {
    const [status, source, d] = plan[i];
    const seller = pick(sellers, i);
    const lotCode = pick(codes, i * 5);
    const { lead } = await registerLead({
      projectId: project.id, name: names[i], phone: `+593 98 ${String(100000 + i * 7919).slice(0, 3)} ${String(1000 + i * 37).slice(0, 4)}`,
      lotCode, channel: source === 'DEVELOPER' ? 'manual' : pick(['whatsapp', 'form', 'whatsapp'], i) as any,
      source: source === 'DEVELOPER' ? 'DEVELOPER' : undefined, lang: /John|Emily|Mark|Tom|Laura/.test(names[i]) ? 'en' : 'es',
    });
    await prisma.projectLead.update({
      where: { id: lead.id },
      data: {
        source: source as any, createdAt: ago(d + 2, 9 + (i % 8)), assignedToId: seller.id,
        budget: [35000, 45000, 60000, 28000][i % 4], tags: i % 3 === 0 ? ['Extranjero'] : i % 4 === 0 ? ['Financiado'] : [],
        lastContactAt: status === 'NEW' ? null : ago(d, 11),
      },
    });
    await logActivity(lead.id, 'assign', 'Sistema', `Asignado a ${seller.name}`);
    if (status === 'LOST') {
      await onStageChange(lead.id, 'NEW', 'CONTACTED', seller.name!);
      await prisma.projectLead.update({ where: { id: lead.id }, data: { status: 'LOST', lostReason: pick(['Precio', 'Compró en otro proyecto', 'No responde'], i) } });
      await logActivity(lead.id, 'stage', seller.name!, 'Perdido');
    } else {
      const target = order.indexOf(status);
      for (let s = 1; s <= target; s++) {
        await onStageChange(lead.id, order[s - 1], order[s], seller.name!);
        await prisma.projectLead.update({ where: { id: lead.id }, data: { status: order[s] } });
      }
    }
    if (status !== 'NEW') await logActivity(lead.id, 'note', seller.name!, pick(['Le interesa la vista al mar, pide plano del solar.', 'Viene con su familia el sábado.', 'Pregunta por financiamiento a 30 meses.'], i));
    if (['CONTACTED', 'VISIT', 'NEGOTIATION'].includes(status)) {
      await prisma.leadTask.create({
        data: { leadId: lead.id, type: status === 'VISIT' ? 'VISIT' : status === 'NEGOTIATION' ? 'OFFER' : 'CALL',
          title: status === 'VISIT' ? 'Visita al proyecto' : status === 'NEGOTIATION' ? 'Enviar propuesta de pago' : 'Llamar para agendar visita',
          dueAt: ago(-(i % 4), 10 + (i % 6)) },
      });
    }
    if (status === 'WON') won.push({ lead, lotCode, d });
  }

  // Ventas: una financiada con cuotas cobradas, una al contado, una declarada
  for (const [k, w] of won.entries()) {
    const price = [42000, 38500, 51000][k];
    const feeRate = w.lead.source === 'DEVELOPER' ? 0.02 : 0.08;
    const sale = await prisma.developerSale.create({
      data: { projectId: project.id, leadId: w.lead.id, lotCode: w.lotCode, price, feeRate, paymentType: k === 1 ? 'CASH' : 'FINANCED', createdAt: ago(w.d) },
    });
    const pays = k === 1 ? [[price, w.d]] : [[10000, w.d], [1100, w.d - 30 > 0 ? w.d - 30 : 1], [1100, 1]];
    for (const [amount, dd] of pays.slice(0, k === 2 ? 1 : 3)) {
      const inst = await prisma.saleInstallment.create({ data: { saleId: sale.id, amount, feeAmount: Math.round(amount * feeRate * 100) / 100, paidAt: ago(dd) } });
      if (k < 2) {
        if (sale.status !== 'CONFIRMED') await confirmSale(sale.id).catch(() => {});
        await collectInstallment(inst.id).catch((e) => console.log('collect', e.message));
      }
    }
    await prisma.projectLead.update({ where: { id: w.lead.id }, data: { lotCode: w.lotCode } });
    await prisma.lot.updateMany({ where: { projectId: project.id, code: w.lotCode }, data: { status: 'SOLD' } });
  }
  console.log('OK', project.id, { lots: lots.length, panoramas: panoramas.length, events: ev.length, leads: plan.length });
}
main().finally(() => Promise.all([prisma.$disconnect(), prod.$disconnect()]));
