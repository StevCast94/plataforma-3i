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

/** Países desde donde llegan las consultas, Ecuador primero: [prefijo, ISO, nombre]. */
const CODES: [string, string, string][] = [
  ['+593', 'EC', 'Ecuador'],
  ['+1', 'US', 'EE.UU. / Canadá'],
  ['+34', 'ES', 'España'],
  ['+57', 'CO', 'Colombia'],
  ['+51', 'PE', 'Perú'],
  ['+56', 'CL', 'Chile'],
  ['+54', 'AR', 'Argentina'],
  ['+52', 'MX', 'México'],
  ['+55', 'BR', 'Brasil'],
  ['+58', 'VE', 'Venezuela'],
  ['+591', 'BO', 'Bolivia'],
  ['+598', 'UY', 'Uruguay'],
  ['+595', 'PY', 'Paraguay'],
  ['+507', 'PA', 'Panamá'],
  ['+506', 'CR', 'Costa Rica'],
  ['+39', 'IT', 'Italia'],
  ['+49', 'DE', 'Alemania'],
  ['+33', 'FR', 'Francia'],
  ['+44', 'GB', 'Reino Unido'],
  ['+41', 'CH', 'Suiza'],
  ['+31', 'NL', 'Países Bajos'],
];

/**
 * Bandera del país a partir de su código ISO, con los caracteres indicadores
 * regionales. Windows de escritorio no dibuja banderas y muestra las dos
 * letras del país ("EC"), que en un desplegable de prefijos se lee igual de
 * bien; en el teléfono, que es de donde llega casi todo, sí sale la bandera.
 */
const flag = (iso: string) =>
  String.fromCodePoint(...[...iso].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));

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
          className="w-24 shrink-0 rounded-lg border border-black/15 bg-white px-2 py-2 text-sm text-primary"
        >
          {CODES.map(([dial, iso, país]) => (
            <option key={iso} value={dial} title={t(país)}>
              {flag(iso)} {dial}
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
