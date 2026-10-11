import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/components/shared/Toast';
import { devApi } from '@/lib/developerApi';

// Puntaje de calidad del proyecto (qué le falta) y subida de documentos legales
// privados para obtener el sello «Verificado por Grupo 3i».

interface Quality {
  score: number;
  items: { key: string; label: string; points: number; max: number; tip?: string }[];
  verifiedAt: string | null;
  documents: { id: string; kind: string; name: string; createdAt: string }[];
}

const KINDS: Record<string, string> = {
  deed: 'Escritura inscrita',
  liens: 'Certificado de gravámenes',
  municipal: 'Aprobación municipal',
  boundaries: 'Plano / linderos',
  other: 'Otro',
};

function readFile(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(f);
  });
}

export function DeveloperQuality({ projectId }: { projectId: string }) {
  const { toast } = useToast();
  const [q, setQ] = useState<Quality | null>(null);
  const [kind, setKind] = useState('deed');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    devApi.get<Quality>(`/projects/${projectId}/quality`).then(setQ).catch(() => {});
  }, [projectId]);
  useEffect(load, [load]);

  async function upload(f: File | undefined) {
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) {
      toast('El archivo supera 8 MB. Comprímelo o súbelo por partes.', 'error');
      return;
    }
    setBusy(true);
    try {
      await devApi.post(`/projects/${projectId}/documents`, { dataUri: await readFile(f), kind, name: f.name });
      toast('Documento subido. Grupo 3i lo revisará.', 'success');
      load();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  if (!q) return null;
  const tone = q.score >= 90 ? 'text-green-700' : q.score >= 60 ? 'text-amber-700' : 'text-red-700';

  return (
    <div className="mt-8 grid gap-4 border-t border-black/5 pt-6 lg:grid-cols-2">
      <section>
        <div className="flex items-baseline justify-between">
          <h3 className="font-semibold text-primary">Calidad de la ficha</h3>
          <p className={`font-serif text-3xl font-bold ${tone}`}>
            {q.score}
            <span className="text-base text-brand-gray">/100</span>
          </p>
        </div>
        <p className="mb-3 text-xs text-brand-gray">Con 90 o más tu proyecto aparece entre los primeros de la portada.</p>
        <ul className="space-y-1.5 text-sm">
          {q.items.map((i) => (
            <li key={i.key} className="flex items-start justify-between gap-3">
              <span>
                <span aria-hidden>{i.points >= i.max ? '✅' : '⬜'}</span> {i.label}
                {i.points < i.max && i.tip && <span className="block pl-6 text-xs text-brand-gray">{i.tip}</span>}
              </span>
              <span className="shrink-0 tabular-nums text-brand-gray">
                {i.points}/{i.max}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-primary">Documentos legales</h3>
        <p className="mb-3 text-xs text-brand-gray">
          Son privados: solo los ve el equipo legal de Grupo 3i. Con la verificación completa tu proyecto lleva el sello{' '}
          <strong>«Verificado por Grupo 3i»</strong>.
        </p>
        {q.verifiedAt ? (
          <p className="mb-3 rounded-lg bg-green-50 p-3 text-sm text-green-800">✓ Verificado el {new Date(q.verifiedAt).toLocaleDateString('es-EC')}</p>
        ) : null}
        {q.documents.length > 0 && (
          <ul className="mb-3 space-y-1 text-sm">
            {q.documents.map((d) => (
              <li key={d.id}>
                📄 {KINDS[d.kind] ?? d.kind} · <span className="text-brand-gray">{d.name}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <select value={kind} onChange={(e) => setKind(e.target.value)} className="rounded-lg border border-black/15 px-3 py-2 text-sm">
            {Object.entries(KINDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <label className={`cursor-pointer rounded-lg border border-secondary px-3 py-2 text-sm text-primary hover:bg-secondary ${busy ? 'opacity-50' : ''}`}>
            {busy ? 'Subiendo…' : 'Subir PDF o foto'}
            <input type="file" accept="application/pdf,image/*" className="hidden" disabled={busy} onChange={(e) => upload(e.target.files?.[0])} />
          </label>
        </div>
      </section>
    </div>
  );
}
