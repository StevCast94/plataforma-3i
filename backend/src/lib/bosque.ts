import { prisma } from '../prisma';

// Sin 0/O/1/I para que el código se pueda dictar sin confusiones.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomCode(len: number): string {
  let s = '';
  for (let i = 0; i < len; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s;
}

/** Código público de adopción, p. ej. "AD-7K2M9Q". */
export async function newAdoptionCode(): Promise<string> {
  for (;;) {
    const code = `AD-${randomCode(6)}`;
    const exists = await prisma.treeAdoption.findUnique({ where: { code }, select: { id: true } });
    if (!exists) return code;
  }
}

/** Siguiente código correlativo de árbol: "BM-0001", "BM-0002"… */
export async function nextTreeNumber(): Promise<number> {
  const last = await prisma.tree.findFirst({ orderBy: { code: 'desc' }, select: { code: true } });
  const n = last ? parseInt(last.code.replace(/\D/g, ''), 10) : 0;
  return (Number.isFinite(n) ? n : 0) + 1;
}

export function treeCode(n: number): string {
  return `BM-${String(n).padStart(4, '0')}`;
}

/**
 * Asigna árboles disponibles de la especie a una adopción confirmada, hasta
 * completar su cantidad. Si todavía no hay árboles sembrados/registrados de esa
 * especie, la adopción queda confirmada y se completa cuando se registren.
 */
export async function assignTrees(adoptionId: string): Promise<number> {
  const a = await prisma.treeAdoption.findUnique({
    where: { id: adoptionId },
    include: { _count: { select: { trees: true } } },
  });
  if (!a || a.status !== 'confirmed') return 0;
  const missing = a.quantity - a._count.trees;
  if (missing <= 0) return 0;
  const free = await prisma.tree.findMany({
    where: { status: 'AVAILABLE', adoptionId: null, ...(a.speciesId ? { speciesId: a.speciesId } : {}) },
    orderBy: { code: 'asc' },
    take: missing,
    select: { id: true },
  });
  if (free.length === 0) return 0;
  await prisma.tree.updateMany({
    where: { id: { in: free.map((t) => t.id) } },
    data: { status: 'ADOPTED', adoptionId: a.id },
  });
  return free.length;
}

/** Árbol de cortesía por solar vendido de Montañita View (uno por solar, idempotente). */
export async function giftTreeForLot(lot: { id: string; code: string; ownerName: string | null }): Promise<void> {
  const exists = await prisma.treeAdoption.findUnique({ where: { lotId: lot.id }, select: { id: true } });
  if (exists) return;
  await prisma.treeAdoption.create({
    data: {
      code: await newAdoptionCode(),
      quantity: 1,
      amount: 0,
      status: 'confirmed',
      confirmedAt: new Date(),
      source: 'solar',
      lotId: lot.id,
      lotCode: lot.code,
      customerName: lot.ownerName?.trim() || `Propietario del solar ${lot.code}`,
    },
  });
}
