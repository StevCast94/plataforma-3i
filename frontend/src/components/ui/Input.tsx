import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const baseField =
  'w-full rounded-lg border border-black/15 bg-white px-4 py-3 text-sm text-primary placeholder:text-brand-gray/70 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/30 transition';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, id, className, ...props }: InputProps) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-primary">
          {label}
        </span>
      )}
      <input id={id} className={cn(baseField, className)} {...props} />
    </label>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({ label, id, className, ...props }: TextareaProps) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-primary">
          {label}
        </span>
      )}
      <textarea id={id} className={cn(baseField, 'min-h-28', className)} {...props} />
    </label>
  );
}
