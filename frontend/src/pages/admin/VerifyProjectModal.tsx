import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/shared/Toast';
import { adminApi } from '@/lib/adminApi';

// Verificación legal de un proyecto de terceros: documentos (URL firmada, 10 min),
// checklist y puntaje. Con el checklist completo el proyecto recibe el sello y
// puede publicarse.

interface Verification {
  id: string;
  name: string;
  checklist: Record<string, boolean>;
  verifiedAt: string | null;
  labels: Record<string, string>;
  quality: { score: number; items: { key: string; label: string; points: number; max: number }[] };
  documents: { id: string; kind: string; name: string; uploadedBy: string; url: string }[];
}

export function VerifyProjectModal({ projectId, onClose, onSaved }: { projectId: string | null; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [v, setV] = useState<Verification | null>(null);
  const [check, setCheck] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setV(null);
    if (!projectId) return;
    adminApi
      .get<Verification>(`/admin/developers/projects/${projectId}/verification`)
      .then((r) => {
        setV(r);
        setCheck(r.checklist);
      })
      .catch((e) => toast(e.message, 'error'));
  }, [projectId, toast]);

  async function save() {
    if (!v) return;
    try {
      const r = await adminApi.put<{ verifiedAt: string | null }>(`/admin/developers/projects/${v.id}/verification`, { checklist: check });
      toast(r.verifiedAt ? 'Proyecto verificado ✓' : 'Checklist guardado', 'success');
      onSaved();
      onClose();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  return (
    <Modal open={!!projectId} onClose={onClose} title={`Verificación · ${v?.name ?? ''}`}>
      {!v ? (
        <p className="text-sm text-brand-gray">Cargando…</p>
      ) : (
        <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1 text-sm">
          <div>
            <p className="mb-1 font-semibold text-primary">Documentos ({v.documents.length})</p>
            {v.documents.length === 0 ? (
              <p className="text-brand-gray">El desarrollador aún no subió documentos.</p>
            ) : (
              <ul className="space-y-1">
                {v.documents.map((d) => (
                  <li key={d.id}>
                    <a href={d.url} target="_blank" rel="noreferrer" className="text-secondary hover:underline">📄 {d.name}</a>{' '}
                    <span className="text-xs text-brand-gray">({v.labels[d.kind] ?? d.kind})</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-1 text-xs text-brand-gray">Los enlaces caducan en 10 minutos.</p>
          </div>
          <div>
            <p className="mb-1 font-semibold text-primary">Checklist legal</p>
            {Object.entries(v.labels).map(([k, label]) => (
              <label key={k} className="flex items-center gap-2 py-0.5">
                <input type="checkbox" checked={!!check[k]} onChange={(e) => setCheck({ ...check, [k]: e.target.checked })} />
                {label}
              </label>
            ))}
          </div>
          <p className="text-brand-gray">
            Puntaje de calidad: <strong className="text-primary">{v.quality.score}/100</strong>
            {v.verifiedAt && ` · verificado el ${new Date(v.verifiedAt).toLocaleDateString('es-EC')}`}
          </p>
          <Button onClick={save} className="w-full">Guardar</Button>
        </div>
      )}
    </Modal>
  );
}
