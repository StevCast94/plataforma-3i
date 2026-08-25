import { v2 as cloudinary } from 'cloudinary';

// ============================================================
// Almacenamiento de documentos de identidad (KYC).
//
// A diferencia de cualquier otra imagen de la plataforma (avatares, posts,
// banners de proyectos — todas públicas por diseño), una cédula/pasaporte y
// una selfie son datos sensibles: NUNCA deben quedar en una URL pública y
// adivinable como el resto de `grupo3i/*`. Por eso se suben como recurso
// `type: 'authenticated'` de Cloudinary — el `secure_url` que devuelve la
// subida NO sirve para verlo; cada vista requiere una firma nueva generada
// server-side con la API key/secret (`signedKycUrl`), de vida corta.
// ============================================================

const FOLDER = 'grupo3i/kyc';
const SIGNED_URL_TTL_SECONDS = 600; // 10 min: de sobra para que el admin revise, sin quedar utilizable indefinidamente.

export type KycDocKind = 'front' | 'back' | 'selfie';

/**
 * Sube un documento de identidad. `overwrite: true` con `public_id` fijo por
 * tipo (front/back/selfie): un reintento tras rechazo reemplaza la imagen
 * anterior en vez de acumular archivos viejos del mismo socio.
 * Se fuerza `format: 'jpg'` al subir para que `signedKycUrl` siempre pida el
 * mismo formato con el que se firmó — si no coincidieran, Cloudinary rechaza
 * la descarga por firma inválida.
 */
export async function uploadKycDocument(
  dataUri: string,
  memberId: string,
  kind: KycDocKind,
): Promise<string> {
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: `${FOLDER}/${memberId}`,
    public_id: kind,
    overwrite: true,
    resource_type: 'image',
    type: 'authenticated',
    format: 'jpg',
    transformation: [{ width: 1600, height: 1600, crop: 'limit', quality: 'auto:good' }],
  });
  return result.public_id;
}

/**
 * URL firmada de corta duración para ver un documento ya subido. Se genera al
 * vuelo cada vez que el admin abre el panel de verificación — nunca se
 * guarda ni se envía al socio.
 */
export function signedKycUrl(publicId: string): string {
  return cloudinary.utils.private_download_url(publicId, 'jpg', {
    resource_type: 'image',
    type: 'authenticated',
    expires_at: Math.floor(Date.now() / 1000) + SIGNED_URL_TTL_SECONDS,
  });
}

/** Borra los 3 documentos de un socio (usado al eliminar la cuenta). */
export async function deleteKycDocuments(memberId: string): Promise<void> {
  try {
    await cloudinary.api.delete_resources_by_prefix(`${FOLDER}/${memberId}/`, {
      type: 'authenticated',
      resource_type: 'image',
    });
  } catch (err) {
    console.error('deleteKycDocuments', err);
  }
}
