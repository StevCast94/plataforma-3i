import { v2 as cloudinary } from 'cloudinary';

// Documentos legales de proyectos (escrituras, gravámenes, aprobaciones). Igual que
// los de KYC: recurso `authenticated` de Cloudinary, nunca una URL pública; para
// verlos se firma una URL de corta vida en el servidor (solo el admin la recibe).

if (process.env.CLOUDINARY_URL) cloudinary.config({ secure: true });

const TTL_SECONDS = 600;

export const DOC_KINDS = ['deed', 'liens', 'municipal', 'boundaries', 'other'] as const;
export type DocKind = (typeof DOC_KINDS)[number];

export async function uploadProjectDocument(dataUri: string, projectId: string) {
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: `grupo3i/legal/${projectId}`,
    resource_type: 'image', // imágenes y PDF
    type: 'authenticated',
  });
  return { publicId: result.public_id, format: result.format };
}

export function signedDocUrl(publicId: string, format: string): string {
  return cloudinary.utils.private_download_url(publicId, format, {
    resource_type: 'image',
    type: 'authenticated',
    expires_at: Math.floor(Date.now() / 1000) + TTL_SECONDS,
  });
}
