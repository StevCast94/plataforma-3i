import { useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import { cld } from '@/lib/cloudinary';
import { useToast } from '@/components/shared/Toast';

interface CloudinaryUploadProps {
  /** URLs ya cargadas. */
  value: string[];
  onChange: (urls: string[]) => void;
  /** Una sola imagen (portada) en vez de galería. */
  single?: boolean;
}

function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function CloudinaryUpload({ value, onChange, single }: CloudinaryUploadProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const dataUri = await fileToDataUri(file);
        const res = await adminApi.post<{ url: string }>('/admin/seed-images', { dataUri });
        uploaded.push(res.url);
      }
      onChange(single ? uploaded.slice(-1) : [...value, ...uploaded]);
      toast('Imagen subida ✅', 'success');
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
        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-black/15 bg-white p-6 text-center hover:border-secondary"
      >
        <span className="text-2xl">📷</span>
        <span className="mt-2 text-sm text-brand-gray">
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
        <div className="mt-3 flex flex-wrap gap-3">
          {value.map((url) => (
            <div key={url} className="relative">
              <img
                src={cld(url, { width: 160 })}
                alt=""
                className="h-20 w-20 rounded-lg object-cover ring-1 ring-black/10"
              />
              <button
                type="button"
                onClick={() => remove(url)}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs text-white"
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
