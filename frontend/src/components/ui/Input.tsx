import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

const baseField =
  'w-full rounded-lg border border-black/15 bg-white px-4 py-3 text-sm text-primary placeholder:text-brand-gray/70 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/30 transition';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, id, className, type, ...props }: InputProps) {
  const [reveal, setReveal] = useState(false);
  const isPassword = type === 'password';

  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-primary">
          {label}
        </span>
      )}
      {isPassword ? (
        <div className="relative">
          <input
            id={id}
            type={reveal ? 'text' : 'password'}
            className={cn(baseField, 'pr-11', className)}
            {...props}
          />
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            aria-label={reveal ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            tabIndex={-1}
            className="absolute right-0 top-0 flex h-full w-11 cursor-pointer items-center justify-center text-brand-gray hover:text-primary"
          >
            {reveal ? <EyeOff className="h-[18px] w-[18px]" strokeWidth={1.8} /> : <Eye className="h-[18px] w-[18px]" strokeWidth={1.8} />}
          </button>
        </div>
      ) : (
        <input id={id} type={type} className={cn(baseField, className)} {...props} />
      )}
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
