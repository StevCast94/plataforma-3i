import { useState } from 'react';
import { api } from '@/lib/api';
import { cld } from '@/lib/cloudinary';
import { useToast } from '@/components/shared/Toast';

interface ImageUploadProps {
  /** URLs ya cargadas. */
  value: string[];
  onChange: (urls: string[]) => void;
  /** Una sola imagen (avatar/portada) en vez de galería. */
  single?: boolean;
  /** Máximo de imágenes (galería). */
  max?: number;
}

function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Subida de imágenes para SOCIOS (comunidad, perfil). Versión de
 * CloudinaryUpload que usa /api/members/upload-image (auth de miembro) en vez
 * de /api/admin/seed-images (auth de staff) — antes de esto, el único lugar
 * donde un socio podía "agregar una imagen" era pegando una URL a mano.
 */
export function ImageUpload({ value, onChange, single, max }: ImageUploadProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (max && value.length >= max) {
      toast(`Máximo ${max} imágenes`, 'error');
      return;
    }
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        if (max && value.length + uploaded.length >= max) break;
        const dataUri = await fileToDataUri(file);
        const res = await api.post<{ url: string }>('/members/upload-image', { dataUri });
        uploaded.push(res.url);
      }
      onChange(single ? uploaded.slice(-1) : [...value, ...uploaded]);
    } catch (err) {
      toast((err as Error).message || 'Error al subir', 'error');
    } finally {
      setUploading(false);
    }
  }

  function remove(url: string) {
    onChange(value.filter((u) => u !== url));
  }

  return (
    <div>
      <label
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-black/15 bg-light p-4 text-center hover:border-secondary"
      >
        <span className="text-xl">📷</span>
        <span className="mt-1 text-xs text-brand-gray">
          {uploading ? 'Subiendo…' : 'Arrastra o haz clic para subir'}
        </span>
        <input
          type="file"
          accept="image/*"
          multiple={!single}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </label>

      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {value.map((url) => (
            <div key={url} className="relative">
              <img
                src={cld(url, { width: 120 })}
                alt=""
                className="h-16 w-16 rounded-lg object-cover ring-1 ring-black/10"
              />
              <button
                type="button"
                onClick={() => remove(url)}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white"
                aria-label="Quitar"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
