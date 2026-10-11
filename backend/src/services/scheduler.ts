import { liquidateDueCommissions } from './liquidationService';
import { processInactivity } from './inactivityService';
import { backfillLaunchElite, closeLaunchPromo } from './launchPromo';
import { remindDueTasks } from './crm';
import { checkMapPlans } from './mapPlan';

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
    const promoGranted = await backfillLaunchElite();
    const promoClosed = await closeLaunchPromo();
    const maps = await checkMapPlans();
    console.log(`[scheduler] mapas: avisos=${maps.reminded} desactivados=${maps.disabled}`);
    console.log(`[scheduler] lanzamiento: regalados=${promoGranted} conservan=${promoClosed.kept} revertidos=${promoClosed.reverted}`);
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
  // CRM: avisos de tareas por vencer, cada 5 minutos.
  setInterval(() => {
    remindDueTasks().catch((err) => console.error('[scheduler] remindDueTasks', err));
  }, 5 * 60_000);
  console.log('[scheduler] jobs diarios programados');
}
