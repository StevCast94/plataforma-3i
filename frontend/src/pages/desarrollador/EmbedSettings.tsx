import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ImageUpload } from '@/components/shared/ImageUpload';
import { PhoneField } from '@/components/shared/PhoneField';
import { EmbedSnippet } from '@/components/shared/EmbedSnippet';
import { useToast } from '@/components/shared/Toast';
import { devApi, type DevProject } from '@/lib/developerApi';

// «Mapa para tu web»: marca del mapa insertable (logo, color, nombre, WhatsApp)
// y el código para pegarlo. Lo activa Grupo 3i según el plan contratado.

const uploadImage = (dataUri: string) => devApi.post<{ url: string }>('/upload-image', { dataUri });

export function EmbedSettings({ project }: { project: DevProject }) {
  const { toast } = useToast();
  const b = project.embedBrand ?? {};
  const [logo, setLogo] = useState<string[]>(b.logo ? [b.logo] : []);
  const [color, setColor] = useState(b.color ?? '#c9a96e');
  const [name, setName] = useState(b.name ?? '');
  const [whatsapp, setWhatsapp] = useState(b.whatsapp ?? '');
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await devApi.put(`/projects/${project.id}/embed-brand`, { logo: logo[0] ?? null, color, name, whatsapp });
      toast('Marca del mapa guardada', 'success');
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-8 border-t border-black/5 pt-6">
      <h3 className="font-semibold text-primary">Mapa para tu web</h3>
      <p className="mb-4 text-xs text-brand-gray">
        Muestra el mapa interactivo de lotes en tu propia página, con tu logo y tu color. Los contactos que lleguen desde ahí entran a tu CRM como
        propios.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <span className="mb-1.5 block text-sm font-medium text-primary">Logo</span>
          <ImageUpload single value={logo} onChange={setLogo} upload={uploadImage} />
        </div>
        <div className="space-y-3">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-primary">Color de tu marca</span>
            <span className="flex items-center gap-2">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-14 cursor-pointer rounded border border-black/15" />
              <code className="text-xs text-brand-gray">{color}</code>
            </span>
          </label>
          <Input label="Nombre que se muestra" placeholder={project.name} value={name} onChange={(e) => setName(e.target.value)} />
          <PhoneField label="WhatsApp que recibe los contactos" defaultValue={whatsapp || '+593 '} onChange={setWhatsapp} />
        </div>
      </div>
      <Button onClick={save} disabled={busy} variant="outline" className="mt-4">
        Guardar marca
      </Button>
      <div className="mt-5 rounded-xl bg-light p-4">
        {project.embedEnabled ? (
          <>
            {(project.mapPaidUntil || project.customDomain) && (
              <p className="mb-3 text-sm text-primary">
                {project.mapPaidUntil && <>Plan activo hasta el <strong>{new Date(project.mapPaidUntil).toLocaleDateString('es-EC')}</strong>. </>}
                {project.customDomain && (
                  <>
                    También en{' '}
                    <a href={`https://${project.customDomain}`} target="_blank" rel="noreferrer" className="text-secondary hover:underline">
                      {project.customDomain}
                    </a>
                  </>
                )}
              </p>
            )}
            <EmbedSnippet slug={project.slug} />
          </>
        ) : (
          <p className="text-sm text-brand-gray">
            El mapa para tu web se activa con el plan mensual ($49/mes hasta 150 lotes · $99/mes más de 150). Escríbenos para activarlo.
          </p>
        )}
      </div>
    </section>
  );
}
