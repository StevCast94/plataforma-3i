import { liquidateDueCommissions } from './liquidationService';
import { processInactivity } from './inactivityService';

// ============================================================
// SCHEDULER EN PROCESO (cron diario)
// Railway corre una sola instancia, así que un setInterval basta para:
//  - liquidar comisiones cuyo hold venció (acreditar al wallet)
//  - procesar avisos y bajas por inactividad
// Se ejecuta poco después del arranque y luego cada 24 h.
// Idempotente: si ya no hay nada que liquidar/avisar, no hace nada.
// ============================================================

const DAY_MS = 24 * 60 * 60 * 1000;
const BOOT_DELAY_MS = 30 * 1000;

async function runDailyJobs(): Promise<void> {
  try {
    const credited = await liquidateDueCommissions();
    const inact = await processInactivity();
    console.log(
      `[scheduler] liquidadas=${credited} avisos=${inact.warned} suspendidos=${inact.suspended}`,
    );
  } catch (err) {
    console.error('[scheduler] error en jobs diarios', err);
  }
}

export function startScheduler(): void {
  setTimeout(runDailyJobs, BOOT_DELAY_MS);
  setInterval(runDailyJobs, DAY_MS);
  console.log('[scheduler] jobs diarios programados');
}
