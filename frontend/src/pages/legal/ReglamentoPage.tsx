import { Seo } from '@/components/shared/Seo';
import { useLang } from '@/hooks/useLang';
import { Button } from '@/components/ui/Button';

// ============================================================
// REGLAMENTO DEL PROGRAMA DE REFERIDOS — versión pública e imprimible.
// Los valores reflejan backend/src/lib/referralRules.ts (fuente de verdad).
// Imprimir/PDF: window.print() + estilos print: (navbar/footer ocultos).
// ============================================================

const SECTIONS = [
  { id: 'intro', n: '1', t: 'Objeto y definiciones' },
  { id: 'membresia', n: '2', t: 'Rangos: Premiere y Elite' },
  { id: 'comisiones', n: '3', t: 'Comisiones' },
  { id: 'ascensos', n: '4', t: 'Ascensos a Elite' },
  { id: 'incentivo', n: '5', t: 'Doble incentivo (membresía de regalo)' },
  { id: 'atribucion', n: '6', t: 'Atribución de referidos' },
  { id: 'liquidacion', n: '7', t: 'Liquidación y retiros' },
  { id: 'limites', n: '8', t: 'Inactividad' },
  { id: 'condiciones', n: '9', t: 'Condiciones generales' },
];

export default function ReglamentoPage() {
  const { t } = useLang();
  return (
    <div className="bg-light">
      <Seo
        title={t('Reglamento del Programa de Referidos — Grupo 3i')}
        description={t('Reglas oficiales del programa de referidos de Grupo 3i: comisiones, rangos, ascensos, incentivos, liquidación y retiros.')}
      />

      {/* Encabezado */}
      <header className="bg-primary text-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-12 sm:flex-row sm:items-end sm:justify-between sm:px-6 lg:px-8">
          <div>
            <img src="/images/logotipo-light.svg" alt={t('Grupo 3i')} className="h-8 w-auto" />
            <h1 className="mt-4 font-serif text-3xl font-bold sm:text-4xl">
              {t('Reglamento del Programa de Referidos')}
            </h1>
            <p className="mt-2 text-white/70">
              {t('Versión vigente · Última actualización: agosto 2026')}
            </p>
          </div>
          <Button variant="secondary" className="print:hidden" onClick={() => window.print()}>
            {t('Descargar / Imprimir PDF')}
          </Button>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[220px_1fr] lg:px-8">
        {/* Índice */}
        <aside className="print:hidden lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-gray">
            {t('Contenido')}
          </p>
          <nav className="space-y-1 text-sm">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="block rounded-lg px-3 py-1.5 text-primary/80 hover:bg-secondary/15 hover:text-primary"
              >
                {s.n}. {t(s.t)}
              </a>
            ))}
          </nav>
        </aside>

        {/* Cuerpo */}
        <article className="space-y-10 text-primary/90">
          <Section id="intro" n="1" title="Objeto y definiciones">
            <p>
              {t('El presente reglamento regula el Programa de Referidos de Grupo 3i, mediante el cual un socio (referidor) recibe comisiones e incentivos por recomendar la compra de productos inmobiliarios y la membresía del Club de Viajes 3i.')}
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li><b>{t('Socio / referidor:')}</b>{' '}{t('persona registrada con un código de referido propio (formato 3IP-XXXXXX), único y de por vida — no cambia al ascender de rango.')}</li>
              <li><b>{t('Referido:')}</b>{' '}{t('persona que llega a través del enlace o código de un socio.')}</li>
              <li><b>{t('Nivel 1:')}</b>{' '}{t('referido directo del socio.')}{' '}<b>{t('Nivel 2:')}</b>{' '}{t('referido de su referido.')}</li>
              <li><b>{t('Producto inmobiliario:')}</b>{' '}{t('propiedad fraccionada, propiedad tradicional o terreno.')}</li>
            </ul>
          </Section>

          <Section id="membresia" n="2" title="Rangos: Premiere y Elite">
            <p>{t('Todo socio inicia como')}{' '}<b>{t('Premiere')}</b>{' '}{t('y puede ascender a')}{' '}<b>{t('Elite')}</b>{t('. El rango define las tasas de comisión, la liquidación y los mínimos de retiro.')}</p>
            <Table
              head={['', 'Premiere', 'Elite']}
              rows={[
                ['Comisión inmobiliaria N1 / N2', '2% / 1%', '4% / 2%'],
                ['Liquidación (días de espera)', '30 días', '3 días'],
              ]}
            />
            <p className="text-sm text-brand-gray">
              {t('El código y el enlace de referido son los mismos desde el registro: no cambian al ascender, para no romper enlaces ya compartidos.')}
            </p>
          </Section>

          <Section id="comisiones" n="3" title="Comisiones">
            <p><b>{t('Productos inmobiliarios')}</b>{' '}{t('— porcentaje sobre el precio neto, según rango y nivel:')}</p>
            <Table
              head={['Rango', 'Nivel 1', 'Nivel 2']}
              rows={[
                ['Premiere', '2%', '1%'],
                ['Elite', '4%', '2%'],
              ]}
            />
            <p><b>{t('Membresías y productos de valor fijo')}</b>{' '}{t('— monto fijo por venta, configurable por producto, pagado solo al')}{' '}<b>{t('Nivel 1')}</b>{' '}{t('(el Nivel 2 no recibe comisión en productos de valor fijo). Para la Membresía del Club de Viajes:')}</p>
            <Table
              head={['Rango', 'Nivel 1', 'Nivel 2']}
              rows={[
                ['Premiere', 'US$ 50', '—'],
                ['Elite', 'US$ 100', '—'],
              ]}
            />
            <p className="text-sm text-brand-gray">{t('Las comisiones ya generadas conservan la tasa del rango que tenías al momento de generarse; al ascender, solo cambian las comisiones futuras.')}</p>
          </Section>

          <Section id="ascensos" n="4" title="Ascensos a Elite">
            <p>{t('Un socio asciende de Premiere a')}{' '}<b>{t('Elite')}</b>{' '}{t('de cualquiera de estas formas:')}</p>
            <ul className="list-disc space-y-1 pl-5">
              <li><b>{t('Por compra propia:')}</b>{' '}{t('al comprar cualquier producto (inmobiliario o la membresía).')}</li>
              <li><b>{t('Por referidos:')}</b>{' '}{t('al acumular')}{' '}<b>{t('5 referidos directos que compren un producto inmobiliario')}</b>{' '}{t('dentro de una ventana de 180 días. Además, recibe su')}{' '}<b>{t('membresía del Club de Viajes gratis')}</b>.</li>
            </ul>
            <p>{t('El ascenso es permanente y no reduce las comisiones ya ganadas.')}</p>
          </Section>

          <Section id="incentivo" n="5" title="Doble incentivo (membresía de regalo)">
            <p>{t('El programa premia a ambas partes:')}</p>
            <ul className="list-disc space-y-1 pl-5">
              <li><b>{t('Al referido:')}</b>{' '}{t('recibe')}{' '}<b>{t('gratis la membresía del Club de Viajes')}</b>{' '}{t('cuando compra un')}{' '}<b>{t('producto inmobiliario')}</b>{' '}{t('a través del enlace de un socio (no aplica a la compra de la propia membresía).')}</li>
              <li><b>{t('Al referidor:')}</b>{' '}{t('su comisión correspondiente y, al llegar a 5 referidos inmobiliarios, el ascenso a Elite con membresía gratis (ver sección 4).')}</li>
            </ul>
            <p>{t('La membresía de regalo se otorga al')}{' '}<b>{t('confirmarse')}</b>{' '}{t('la compra y se revoca si la compra se cancela.')}</p>
          </Section>

          <Section id="atribucion" n="6" title="Atribución de referidos">
            <ul className="list-disc space-y-1 pl-5">
              <li>{t('La atribución es')}{' '}<b>{t('por primer contacto')}</b>{' '}{t('(first-click): el primer código con el que llega el referido es el que cuenta.')}</li>
              <li>{t('La ventana de atribución es de')}{' '}<b>{t('90 días')}</b>{' '}{t('desde el primer clic.')}</li>
              <li>{t('Un referido pertenece a un solo referidor. No se permite el auto-referido.')}</li>
            </ul>
          </Section>

          <Section id="liquidacion" n="7" title="Liquidación y retiros">
            <ul className="list-disc space-y-1 pl-5">
              <li><b>{t('Período de retracto:')}</b>{' '}{t('14 días desde la confirmación de la venta.')}</li>
              <li><b>{t('Liquidación automática:')}</b>{' '}{t('30 días (Premiere) / 3 días (Elite) desde que termina el retracto. Cumplido el plazo, la comisión pasa sola al saldo retirable, sin que el socio tenga que hacer nada.')}</li>
              <li><b>{t('Liquidación anticipada:')}</b>{' '}{t('el administrador puede validar una comisión antes de que se cumpla el plazo, acreditándola de inmediato.')}</li>
            </ul>
            <p><b>{t('Mínimos de retiro')}</b>{' '}{t('según rango y método:')}</p>
            <Table
              head={['Rango', 'Transferencia', 'PayPal']}
              rows={[
                ['Premiere', 'US$ 100', 'US$ 50'],
                ['Elite', 'US$ 50', 'US$ 25'],
              ]}
            />
            <p className="text-sm text-brand-gray">{t('Si un retiro es marcado como fallido, el monto se devuelve automáticamente al saldo del socio.')}</p>
          </Section>

          <Section id="limites" n="8" title="Inactividad">
            <ul className="list-disc space-y-1 pl-5">
              <li>{t('No hay límite mensual de comisiones para ningún rango.')}</li>
              <li><b>{t('Inactividad (solo Premiere):')}</b>{' '}{t('avisos a los 150 y 170 días sin referidos nuevos; a los')}{' '}<b>{t('180 días')}</b>{' '}{t('sin referidos la cuenta se suspende. La reactivación se gestiona con el administrador.')}</li>
            </ul>
          </Section>

          <Section id="condiciones" n="9" title="Condiciones generales">
            <ul className="list-disc space-y-1 pl-5">
              <li>{t('Para participar se requiere ser mayor de edad y registrar datos verídicos.')}</li>
              <li>{t('Grupo 3i podrá reversar comisiones derivadas de compras canceladas o fraudulentas.')}</li>
              <li>{t('Grupo 3i podrá actualizar este reglamento; la versión vigente es la publicada en esta página.')}</li>
            </ul>
            <p className="mt-6 border-t border-black/10 pt-4 text-sm text-brand-gray">
              {t('Documento informativo del Programa de Referidos de Grupo 3i. Ante cualquier duda, escribe a grupoinmobiliario3i.ec@gmail.com.')}
            </p>
          </Section>
        </article>
      </div>
    </div>
  );
}

function Section({ id, n, title, children }: { id: string; n: string; title: string; children: React.ReactNode }) {
  const { t } = useLang();
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mb-3 font-serif text-2xl font-bold text-primary">
        {n}. {t(title)}
      </h2>
      <div className="space-y-3 leading-relaxed">{children}</div>
    </section>
  );
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  const { t } = useLang();
  return (
    <div className="overflow-x-auto rounded-xl ring-1 ring-black/10">
      <table className="w-full text-left text-sm">
        <thead className="bg-primary/5 text-primary">
          <tr>{head.map((h, i) => <th key={i} className="px-4 py-2.5 font-semibold">{t(h)}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-black/5">
              {r.map((c, j) => <td key={j} className={`px-4 py-2.5 ${j === 0 ? 'font-medium text-primary' : ''}`}>{t(c)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
