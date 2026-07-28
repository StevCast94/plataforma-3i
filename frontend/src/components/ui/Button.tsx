import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';
/** `pill` = redondeado (default histórico). `sharp` = esquinas rectas, más editorial/arquitectónico. */
type Shape = 'pill' | 'sharp';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  shape?: Shape;
  /** Muestra spinner y deshabilita el botón. */
  loading?: boolean;
  children: ReactNode;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-secondary text-primary shadow-sm hover:bg-accent hover:text-white hover:shadow-md',
  secondary: 'bg-primary text-white hover:bg-black hover:shadow-md',
  outline:
    'border border-secondary text-primary hover:bg-secondary hover:text-primary hover:shadow-sm',
  ghost: 'text-primary hover:bg-light',
};

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
};

const shapes: Record<Shape, string> = {
  pill: 'rounded-full',
  sharp: 'rounded-none',
};

export function Button({
  variant = 'primary',
  size = 'md',
  shape = 'pill',
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium tracking-wide',
        'transition-all duration-200 active:scale-[0.98]',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer',
        shapes[shape],
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}
