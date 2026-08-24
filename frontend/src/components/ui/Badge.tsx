import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: ReactNode;
  /** `solid` = dorado macizo, legible sobre fotografía. */
  variant?: 'gold' | 'dark' | 'light' | 'solid';
  className?: string;
}

// Ojo: `cn` es un join simple (sin tailwind-merge), así que no se puede pisar
// `bg-secondary/20` pasando `bg-secondary` por className — gana el orden del
// CSS, no el del atributo. Por eso los fondos sobre foto van como variante.
const variants = {
  gold: 'bg-secondary/20 text-accent',
  dark: 'bg-primary text-white',
  light: 'bg-light text-primary',
  solid: 'bg-secondary text-primary',
};

export function Badge({ children, variant = 'gold', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
