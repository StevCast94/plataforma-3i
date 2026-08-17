import { cn } from '@/lib/utils';

type Animation = 'ascenso' | 'pulso' | 'none';
type Tone = 'color' | 'light' | 'ink';

interface IsotipoProps {
  /** 'ascenso' entra una sola vez; 'pulso' late en bucle (loaders persistentes). */
  animation?: Animation;
  /** 'light' para fondos oscuros; 'ink' monocromo para marcas de agua. */
  tone?: Tone;
  className?: string;
  /** Decorativo por defecto. Pasa un título solo si la marca aporta significado. */
  title?: string;
}

/**
 * Isotipo Grupo 3i como SVG inline (no <img>) para poder animar cada pieza.
 * Geometría espejo exacto de /images/isotipo.svg — si ese archivo cambia,
 * actualizar también estos polígonos.
 */
export function Isotipo({
  animation = 'none',
  tone = 'color',
  className,
  title,
}: IsotipoProps) {
  const bar = tone === 'light' ? '#fff' : '#020608';
  const gold = tone === 'color' ? '#d5c03d' : bar;
  const blue = tone === 'color' ? '#294877' : bar;
  const red = tone === 'color' ? '#a83437' : bar;

  return (
    <svg
      viewBox="0 0 165.31 166.57"
      className={cn(
        'g3i-mark',
        animation === 'ascenso' && 'g3i-mark--ascenso',
        animation === 'pulso' && 'g3i-mark--pulso',
        className,
      )}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}

      {/* Galón inferior — entra primero para que la lectura suba */}
      <polygon
        data-piece="bar"
        data-bar="3"
        fill={bar}
        points="131.13 106.75 83.28 153.55 62.32 133.04 110.16 86.24"
      />
      <polygon
        data-piece="bar"
        data-bar="2"
        fill={bar}
        points="81.02 107.62 128.86 60.82 107.89 40.31 60.05 87.11"
      />
      <polygon
        data-piece="bar"
        data-bar="1"
        fill={bar}
        points="81.91 58.6 34.06 105.4 13.09 84.89 60.94 38.09"
      />

      {/* Los tres acentos = las tres "i" */}
      <polygon
        data-piece="dot"
        data-dot="blue"
        fill={blue}
        points="58.67 129.47 77.15 111.39 56.19 90.88 37.7 108.96"
      />
      <polygon
        data-piece="dot"
        data-dot="red"
        fill={red}
        points="153.47 84.89 134.99 102.97 114.02 82.46 132.5 64.38"
      />
      <polygon
        data-piece="dot"
        data-dot="gold"
        fill={gold}
        points="104.25 36.74 85.77 54.82 64.8 34.31 83.28 16.23"
      />
    </svg>
  );
}

/**
 * Loader de marca para fallbacks de Suspense. Reemplaza el texto "Cargando…".
 */
export function BrandLoader({
  className,
  label = 'Cargando',
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={cn('flex min-h-[60vh] flex-col items-center justify-center gap-4', className)}
      role="status"
      aria-live="polite"
    >
      <Isotipo animation="pulso" className="h-12 w-12" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
