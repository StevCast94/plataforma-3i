import { Router } from 'express';

const SUPABASE_URL = 'https://rkwbixidpaqweavghfea.supabase.co';
const SUPABASE_SERVICE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrd2JpeGlkcGFxd2VhdmdoZmVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzc2NjE5OCwiZXhwIjoyMDkzMzQyMTk4fQ.YhuyGwW8qia858aqMfu3nhPkmLNoIRgdWpQ6AxSvI9U';

async function sbQuery<T>(table: string, select: string): Promise<T[]> {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_SERVICE,
      Authorization: 'Bearer ' + SUPABASE_SERVICE,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    throw new Error(`Supabase ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

export const metricsRoutes = Router();

// GET /api/metrics — Dashboard público
metricsRoutes.get('/', async (_req, res) => {
  try {
    const [projects, profiles, investments] = await Promise.all([
      sbQuery<{ id: string; status: string }>('properties', 'id,status'),
      sbQuery<{ id: string; activated: boolean }>('profiles', 'id,activated'),
      sbQuery<{ amount: number }>('investments', 'amount'),
    ]);

    const projectsTotal = projects.length;
    const projectsActive = projects.filter((p) => p.status === 'active').length;
    const investorsTotal = profiles.length;
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
