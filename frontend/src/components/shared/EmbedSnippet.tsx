import { useToast } from '@/components/shared/Toast';

// Código para insertar el mapa de lotes en la web del desarrollador. El script
// ajusta la altura del iframe con el mensaje que envía la página /embed.

export function embedCode(slug: string) {
  const id = `g3i-mapa-${slug}`;
  return `<iframe id="${id}" src="https://grupo3i.com/embed/${slug}" style="width:100%;height:900px;border:0" loading="lazy" allow="geolocation; fullscreen; gyroscope; accelerometer" title="Mapa de lotes"></iframe>
<script>addEventListener('message',function(e){if(e.origin==='https://grupo3i.com'&&e.data&&e.data.type==='g3i-embed-height'&&e.data.slug==='${slug}'){document.getElementById('${id}').style.height=e.data.height+'px'}})</script>`;
}

export function EmbedSnippet({ slug }: { slug: string }) {
  const { toast } = useToast();
  const code = embedCode(slug);
  return (
    <div className="space-y-2 text-sm">
      <p className="text-brand-gray">Pega este código en tu web donde quieras mostrar el mapa:</p>
      <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-primary p-3 text-[11px] leading-relaxed text-white">{code}</pre>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(code);
            toast('Código copiado', 'success');
          }}
          className="rounded-lg bg-secondary px-3 py-1.5 font-semibold text-primary"
        >
          Copiar código
        </button>
        <a href={`/embed/${slug}`} target="_blank" rel="noreferrer" className="px-1 py-1.5 text-secondary hover:underline">
          Ver el mapa ↗
        </a>
      </div>
    </div>
  );
}
