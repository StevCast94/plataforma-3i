import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface EmptyStateProps {
  title: string;
  message?: string;
  ctaText?: string;
  ctaTo?: string;
  /** Ícono lucide (ReactNode). Por compatibilidad también acepta un emoji string. */
  icon?: ReactNode;
}

export function EmptyState({
  title,
  message,
  ctaText,
  ctaTo,
  icon,
}: EmptyStateProps) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-light text-secondary">
        {icon ?? <SearchX className="h-10 w-10" strokeWidth={1.4} />}
      </span>
      <h2 className="mt-5 text-2xl text-primary">{title}</h2>
      {message && <p className="mt-2 text-brand-gray">{message}</p>}
      {ctaText && ctaTo && (
        <Link to={ctaTo} className="mt-7 inline-block">
          <Button>{ctaText}</Button>
        </Link>
      )}
    </div>
  );
}
