import { PROPERTY_TYPES } from '@/lib/propertyTypes';

/** Casillas de tipos de proyecto (lotes, casas, departamentos…). Panel en español. */
export function TypePicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  return (
    <fieldset>
      <legend className="mb-1.5 block text-sm font-medium text-primary">Tipo de proyecto</legend>
      <div className="flex flex-wrap gap-2">
        {PROPERTY_TYPES.map((p) => {
          const on = value.includes(p.id);
          return (
            <label key={p.id} className={`cursor-pointer rounded-full border px-3 py-1 text-sm ${on ? 'border-primary bg-primary text-white' : 'border-black/15 text-primary'}`}>
              <input
                type="checkbox"
                className="sr-only"
                checked={on}
                onChange={() => onChange(on ? value.filter((x) => x !== p.id) : [...value, p.id])}
              />
              {p.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
