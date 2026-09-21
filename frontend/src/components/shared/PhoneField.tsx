import { useState, type FocusEventHandler } from 'react';
import { useLang } from '@/hooks/useLang';

// ============================================================
// Campo de WhatsApp con prefijo de país.
//
// Se elige el país en un desplegable y solo se escribe el número local, así
// nadie tiene que acordarse del código ni teclear el "+". El valor que sale
// (y el que se envía) es "+593 991234567"; si no se escribió número, sale
// vacío, para que las validaciones de campo obligatorio sigan funcionando.
// ============================================================

/** Países desde donde llegan las consultas, Ecuador primero. */
const CODES: [string, string][] = [
  ['+593', 'Ecuador'],
  ['+1', 'EE.UU. / Canadá'],
  ['+34', 'España'],
  ['+57', 'Colombia'],
  ['+51', 'Perú'],
  ['+56', 'Chile'],
  ['+54', 'Argentina'],
  ['+52', 'México'],
  ['+55', 'Brasil'],
  ['+58', 'Venezuela'],
  ['+591', 'Bolivia'],
  ['+598', 'Uruguay'],
  ['+595', 'Paraguay'],
  ['+507', 'Panamá'],
  ['+506', 'Costa Rica'],
  ['+39', 'Italia'],
  ['+49', 'Alemania'],
  ['+33', 'Francia'],
  ['+44', 'Reino Unido'],
  ['+41', 'Suiza'],
  ['+31', 'Países Bajos'],
];

interface Props {
  /** Si se define, publica el valor en un input oculto para FormData. */
  name?: string;
  label?: string;
  hint?: string;
  required?: boolean;
  onChange?: (value: string) => void;
  onFocus?: FocusEventHandler<HTMLInputElement>;
  className?: string;
}

export function PhoneField({ name, label, hint, required, onChange, onFocus, className = '' }: Props) {
  const { t } = useLang();
  const [code, setCode] = useState('+593');
  const [num, setNum] = useState('');

  const emit = (c: string, n: string) => {
    const clean = n.replace(/[^\d\s-]/g, '').trim();
    onChange?.(clean ? `${c} ${clean}` : '');
  };

  return (
    <div className={className}>
      {label && <span className="mb-1.5 block text-sm font-medium text-primary">{label}</span>}
      <div className="flex gap-2">
        <select
          value={code}
          aria-label={t('Código de país')}
          onChange={(e) => {
            setCode(e.target.value);
            emit(e.target.value, num);
          }}
          className="w-28 shrink-0 rounded-lg border border-black/15 bg-white px-2 py-2 text-sm text-primary"
        >
          {CODES.map(([dial, país]) => (
            <option key={dial + país} value={dial}>
              {dial} {t(país)}
            </option>
          ))}
        </select>
        <input
          type="tel"
          inputMode="tel"
          required={required}
          placeholder="99 123 4567"
          value={num}
          onFocus={onFocus}
          onChange={(e) => {
            setNum(e.target.value);
            emit(code, e.target.value);
          }}
          className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
        />
      </div>
      {name && <input type="hidden" name={name} value={num.trim() ? `${code} ${num.trim()}` : ''} />}
      {hint && <p className="mt-1 text-xs text-brand-gray">{hint}</p>}
    </div>
  );
}
