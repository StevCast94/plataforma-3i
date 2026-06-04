import { Router } from 'express';

const SUPABASE_URL = 'https://rkwbixidpaqweavghfea.supabase.co';
const SUPABASE_SERVICE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrd2JpeGlkcGFxd2VhdmdoZmVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzc2NjE5OCwiZXhwIjoyMDkzMzQyMTk4fQ.YhuyGwW8qia858aqMfu3nhPkmLNoIRgdWpQ6AxSvI9U';

async function sbCount(table: string): Promise<number> {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=id&limit=0`;
  const res = await fetch(url, {
    method: 'HEAD',
    headers: {
      apikey: SUPABASE_SERVICE,
      Authorization: 'Bearer ' + SUPABASE_SERVICE,
      Accept: 'application/json',
      Prefer: 'count=exact',
    },
  });
  const range = res.headers.get('content-range');
  if (range) {
    const match = range.match(/\/(\d+)$/);
    if (match) return parseInt(match[1], 10);
  }
  return 0;
}

async function sbSelect<T>(table: string, select: string): Promise<T[]> {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_SERVICE,
      Authorization: 'Bearer ' + SUPABASE_SERVICE,
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Supabase ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

export const metricsRoutes = Router();

// GET /api/metrics — Dashboard público
metricsRoutes.get('/', async (_req, res) => {
  try {
    const [projects, profiles, investments] = await Promise.all([
      sbSelect<{ id: string; status: string }>('properties', 'id,status'),
      sbSelect<{ id: string; activated: boolean }>('profiles', 'id,activated'),
      sbSelect<{ amount: number }>('investments', 'amount'),
    ]);

    // Also try HEAD counts as fallback
    const [propsHead, profHead, invHead] = await Promise.all([
      sbCount('properties'),
      sbCount('profiles'),
      sbCount('investments'),
    ]);

    const projectsTotal = Math.max(projects.length, propsHead);
    const projectsActive = projects.filter((p) => p.status === 'active').length;
    const investorsTotal = Math.max(profiles.length, profHead);
    const investorsCommitted = profiles.filter((p) => p.activated === true).length;
    const totalInvestment = investments.reduce((sum, inv) => sum + Number(inv.amount || 0), 0);

    res.json({
      projects_total: projectsTotal,
      projects_active: projectsActive,
      investors_total: investorsTotal,
      investors_committed: investorsCommitted,
      total_investment: totalInvestment.toFixed(2),
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('GET /api/metrics', err);
    res.status(500).json({ error: 'Error al obtener métricas', message: (err as Error).message });
  }
});
