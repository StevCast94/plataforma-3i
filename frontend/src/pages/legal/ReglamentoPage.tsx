import { Seo } from '@/components/shared/Seo';
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
  { id: 'limites', n: '8', t: 'Límites e inactividad' },
  { id: 'condiciones', n: '9', t: 'Condiciones generales' },
];

export default function ReglamentoPage() {
  return (
    <div className="bg-light">
      <Seo
        title="Reglamento del Programa de Referidos — Grupo 3i"
        description="Reglas oficiales del programa de referidos de Grupo 3i: comisiones, rangos, ascensos, incentivos, liquidación y retiros."
      />

      {/* Encabezado */}
      <header className="bg-primary text-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-12 sm:flex-row sm:items-end sm:justify-between sm:px-6 lg:px-8">
          <div>
            <img src="/images/logotipo-light.svg" alt="Grupo 3i" className="h-8 w-auto" />
            <h1 className="mt-4 font-serif text-3xl font-bold sm:text-4xl">
              Reglamento del Programa de Referidos
            </h1>
            <p className="mt-2 text-white/70">
              Versión vigente · Última actualización: junio 2026
            </p>
          </div>
          <Button variant="secondary" className="print:hidden" onClick={() => window.print()}>
            Descargar / Imprimir PDF
          </Button>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[220px_1fr] lg:px-8">
        {/* Índice */}
        <aside className="print:hidden lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-gray">
            Contenido
          </p>
          <nav className="space-y-1 text-sm">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="block rounded-lg px-3 py-1.5 text-primary/80 hover:bg-secondary/15 hover:text-primary"
              >
                {s.n}. {s.t}
              </a>
            ))}
          </nav>
        </aside>

        {/* Cuerpo */}
        <article className="space-y-10 text-primary/90">
          <Section id="intro" n="1" t="Objeto y definiciones">
            <p>
              El presente reglamento regula el Programa de Referidos de Grupo 3i, mediante el cual
              un <b>socio</b> (referidor) recibe comisiones e incentivos por recomendar la compra de
              productos inmobiliarios y la membresía del Club de Viajes 3i.
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li><b>Socio / referidor:</b> persona registrada con un código de referido propio.</li>
              <li><b>Referido:</b> persona que llega a través del enlace o código de un socio.</li>
              <li><b>Nivel 1:</b> referido directo del socio. <b>Nivel 2:</b> referido de su referido.</li>
              <li><b>Producto inmobiliario:</b> propiedad fraccionada, propiedad tradicional o terreno.</li>
            </ul>
          </Section>

          <Section id="membresia" n="2" t="Rangos: Premiere y Elite">
            <p>Todo socio inicia como <b>Premiere</b> y puede ascender a <b>Elite</b>. El rango define las tasas de comisión, los límites y los mínimos de retiro.</p>
            <Table
              head={['', 'Premiere', 'Elite']}
              rows={[
                ['Prefijo de código', '3IP-XXXXXX', '3IE-XXXXXX'],
                ['Comisión inmobiliaria N1 / N2', '2% / 1%', '4% / 2%'],
                ['Límite mensual de comisiones', 'US$ 5.000', 'Ilimitado'],
                ['Liquidación (días de espera)', '45 días', '30 días'],
              ]}
            />
            <p className="text-sm text-brand-gray">El código de referido no cambia al ascender, para no romper enlaces ya compartidos.</p>
          </Section>

          <Section id="comisiones" n="3" t="Comisiones">
            <p><b>Productos inmobiliarios</b> — porcentaje sobre el precio neto, según rango y nivel:</p>
            <Table
              head={['Rango', 'Nivel 1', 'Nivel 2']}
              rows={[
                ['Premiere', '2%', '1%'],
                ['Elite', '4%', '2%'],
              ]}
            />
            <p><b>Membresías y productos de valor fijo</b> — monto fijo por venta, configurable por producto, pagado solo al <b>Nivel 1</b> (el Nivel 2 no recibe comisión en productos de valor fijo). Para la Membresía del Club de Viajes:</p>
            <Table
              head={['Rango', 'Nivel 1', 'Nivel 2']}
              rows={[
                ['Premiere', 'US$ 50', '—'],
                ['Elite', 'US$ 100', '—'],
              ]}
            />
            <p className="text-sm text-brand-gray">Las comisiones ya generadas conservan la tasa del rango que tenías al momento de generarse; al ascender, solo cambian las comisiones futuras.</p>
          </Section>

          <Section id="ascensos" n="4" t="Ascensos a Elite">
            <p>Un socio asciende de Premiere a <b>Elite</b> de cualquiera de estas formas:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li><b>Por compra propia:</b> al comprar cualquier producto (inmobiliario o la membresía).</li>
              <li><b>Por referidos:</b> al acumular <b>5 referidos directos que compren un producto inmobiliario</b> dentro de una ventana de 180 días. Además, recibe su <b>membresía del Club de Viajes gratis</b>.</li>
            </ul>
            <p>El ascenso es permanente y no reduce las comisiones ya ganadas.</p>
          </Section>

          <Section id="incentivo" n="5" t="Doble incentivo (membresía de regalo)">
            <p>El programa premia a ambas partes:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li><b>Al referido:</b> recibe <b>gratis la membresía del Club de Viajes</b> cuando compra un <b>producto inmobiliario</b> a través del enlace de un socio (no aplica a la compra de la propia membresía).</li>
              <li><b>Al referidor:</b> su comisión correspondiente y, al llegar a 5 referidos inmobiliarios, el ascenso a Elite con membresía gratis (ver sección 4).</li>
            </ul>
            <p>La membresía de regalo se otorga al <b>confirmarse</b> la compra y se revoca si la compra se cancela.</p>
          </Section>

          <Section id="atribucion" n="6" t="Atribución de referidos">
            <ul className="list-disc space-y-1 pl-5">
              <li>La atribución es <b>por primer contacto</b> (first-click): el primer código con el que llega el referido es el que cuenta.</li>
              <li>La ventana de atribución es de <b>90 días</b> desde el primer clic.</li>
              <li>Un referido pertenece a un solo referidor. No se permite el auto-referido.</li>
            </ul>
          </Section>

          <Section id="liquidacion" n="7" t="Liquidación y retiros">
            <ul className="list-disc space-y-1 pl-5">
              <li><b>Período de retracto:</b> 14 días desde la confirmación de la venta.</li>
              <li><b>Liquidación:</b> 45 días (Premiere) / 30 días (Elite). Tras este plazo la comisión queda disponible en el saldo retirable.</li>
              <li>El administrador valida las comisiones; una comisión validada queda disponible para retiro.</li>
            </ul>
            <p><b>Mínimos de retiro</b> según rango y método:</p>
            <Table
              head={['Rango', 'Transferencia', 'PayPal']}
              rows={[
                ['Premiere', 'US$ 100', 'US$ 50'],
                ['Elite', 'US$ 50', 'US$ 25'],
              ]}
            />
            <p className="text-sm text-brand-gray">Si un retiro es marcado como fallido, el monto se devuelve automáticamente al saldo del socio.</p>
          </Section>

          <Section id="limites" n="8" t="Límites e inactividad">
            <ul className="list-disc space-y-1 pl-5">
              <li><b>Límite mensual de comisiones:</b> US$ 5.000 para Premiere; ilimitado para Elite.</li>
              <li><b>Inactividad (solo Premiere):</b> avisos a los 60 y 80 días sin referidos nuevos; a los <b>90 días</b> sin referidos la cuenta se suspende. La reactivación se gestiona con el administrador.</li>
            </ul>
          </Section>

          <Section id="condiciones" n="9" t="Condiciones generales">
            <ul className="list-disc space-y-1 pl-5">
              <li>Para participar se requiere ser mayor de edad y registrar datos verídicos.</li>
              <li>Grupo 3i podrá reversar comisiones derivadas de compras canceladas o fraudulentas.</li>
              <li>Grupo 3i podrá actualizar este reglamento; la versión vigente es la publicada en esta página.</li>
            </ul>
            <p className="mt-6 border-t border-black/10 pt-4 text-sm text-brand-gray">
              Documento informativo del Programa de Referidos de Grupo 3i. Ante cualquier duda, escribe a info@grupo3i.com.
            </p>
          </Section>
        </article>
      </div>
    </div>
  );
}

function Section({ id, n, t, children }: { id: string; n: string; t: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mb-3 font-serif text-2xl font-bold text-primary">
        {n}. {t}
      </h2>
      <div className="space-y-3 leading-relaxed">{children}</div>
    </section>
  );
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl ring-1 ring-black/10">
      <table className="w-full text-left text-sm">
        <thead className="bg-primary/5 text-primary">
          <tr>{head.map((h, i) => <th key={i} className="px-4 py-2.5 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-black/5">
              {r.map((c, j) => <td key={j} className={`px-4 py-2.5 ${j === 0 ? 'font-medium text-primary' : ''}`}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
