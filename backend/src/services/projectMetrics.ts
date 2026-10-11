import { prisma } from '../prisma';

// Métricas de un proyecto (paso 5): embudo, serie semanal, solares con más
// interés, dispositivo e idioma. Sale de ProjectEvent + ProjectLead + DeveloperSale.

const FUNNEL = ['view', 'lot_view', 'pano_open', 'wa_click'] as const;

export async function projectMetrics(projectId: string, days: number) {
  const since = new Date(Date.now() - days * 86400_000);
  const [events, leads, sales] = await Promise.all([
    prisma.projectEvent.findMany({
      where: { projectId, createdAt: { gte: since } },
      select: { type: true, lotCode: true, visitorId: true, device: true, lang: true, createdAt: true },
    }),
    prisma.projectLead.findMany({ where: { projectId, createdAt: { gte: since } }, select: { source: true, createdAt: true } }),
    prisma.developerSale.findMany({
      where: { projectId, createdAt: { gte: since }, status: { in: ['DECLARED', 'CONFIRMED'] } },
      select: { price: true, createdAt: true },
    }),
  ]);

  // Embudo: eventos y visitantes únicos por paso.
  const funnel = FUNNEL.map((type) => {
    const ev = events.filter((e) => e.type === type);
    return { step: type, events: ev.length, visitors: new Set(ev.map((e) => e.visitorId).filter(Boolean)).size };
  });

  // Serie semanal (lunes como inicio de semana).
  const weekKey = (d: Date) => {
    const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7));
    return x.toISOString().slice(0, 10);
  };
  const weeks = new Map<string, { week: string; views: number; leads: number; sales: number }>();
  for (let t = since.getTime(); t <= Date.now(); t += 7 * 86400_000) {
    const k = weekKey(new Date(t));
    weeks.set(k, { week: k, views: 0, leads: 0, sales: 0 });
  }
  const bump = (d: Date, f: 'views' | 'leads' | 'sales') => {
    const w = weeks.get(weekKey(d));
    if (w) w[f]++;
  };
  events.filter((e) => e.type === 'view').forEach((e) => bump(e.createdAt, 'views'));
  leads.forEach((l) => bump(l.createdAt, 'leads'));
  sales.forEach((s) => bump(s.createdAt, 'sales'));

  // Solares con más interés: vistas de ficha + clics a WhatsApp desde el solar.
  const lots = new Map<string, { code: string; views: number; whatsapp: number }>();
  for (const e of events) {
    if (!e.lotCode || (e.type !== 'lot_view' && e.type !== 'wa_click')) continue;
    const r = lots.get(e.lotCode) ?? { code: e.lotCode, views: 0, whatsapp: 0 };
    if (e.type === 'lot_view') r.views++;
    else r.whatsapp++;
    lots.set(e.lotCode, r);
  }

  // Por visitante único (su primer valor visto), para que sumen lo mismo que «Visitantes únicos».
  const count = (key: 'device' | 'lang') => {
    const seen = new Map<string, string>();
    for (const e of events) if (e.visitorId && !seen.has(e.visitorId)) seen.set(e.visitorId, e[key] || 'otro');
    const m = new Map<string, number>();
    for (const v of seen.values()) m.set(v, (m.get(v) ?? 0) + 1);
    return [...m.entries()].map(([k, n]) => ({ key: k, n })).sort((a, b) => b.n - a.n);
  };

  const first = await prisma.projectEvent.findFirst({ where: { projectId }, orderBy: { createdAt: 'asc' }, select: { createdAt: true } });

  return {
    days,
    trackingSince: first?.createdAt ?? null,
    visitors: new Set(events.map((e) => e.visitorId).filter(Boolean)).size,
    funnel,
    leads: {
      total: leads.length,
      bySource: ['REFERRAL', 'PLATFORM', 'DEVELOPER'].map((s) => ({ source: s, n: leads.filter((l) => l.source === s).length })),
    },
    sales: { total: sales.length, amount: sales.reduce((a, s) => a + s.price, 0) },
    weekly: [...weeks.values()],
    topLots: [...lots.values()].sort((a, b) => b.views + b.whatsapp * 3 - (a.views + a.whatsapp * 3)).slice(0, 10),
    devices: count('device'),
    langs: count('lang'),
  };
}
