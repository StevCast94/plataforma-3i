import type { ReactNode } from 'react';

export interface Column<T> {
  header: string;
  /** Render de la celda. */
  cell: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  keyOf: (row: T) => string;
  onRowClick?: (row: T) => void;
  empty?: string;
  loading?: boolean;
}

/** Tabla reutilizable, striped + hover. */
export function DataTable<T>({
  columns,
  rows,
  keyOf,
  onRowClick,
  empty = 'Sin datos.',
  loading,
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-black/5">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-black/5 text-xs uppercase tracking-wider text-brand-gray">
            {columns.map((c) => (
              <th key={c.header} className={`px-4 py-3 ${c.className ?? ''}`}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-brand-gray">
                Cargando…
              </td>
            </tr>
          )}
          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-brand-gray">
                {empty}
              </td>
            </tr>
          )}
          {!loading &&
            rows.map((row, i) => (
              <tr
                key={keyOf(row)}
                onClick={() => onRowClick?.(row)}
                className={`border-b border-black/5 ${i % 2 ? 'bg-light/40' : ''} ${
                  onRowClick ? 'cursor-pointer hover:bg-light' : ''
                }`}
              >
                {columns.map((c) => (
                  <td key={c.header} className={`px-4 py-3 text-sm ${c.className ?? ''}`}>
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
