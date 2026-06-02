import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: ReactNode;
  variant?: 'gold' | 'dark' | 'light';
  className?: string;
}

const variants = {
  gold: 'bg-secondary/20 text-accent',
  dark: 'bg-primary text-white',
  light: 'bg-light text-primary',
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
