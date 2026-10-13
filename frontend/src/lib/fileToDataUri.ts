/** Lee un archivo como data URI (para subir documentos en base64). */
export function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('No se pudo leer el archivo'));
    r.readAsDataURL(file);
  });
}

/** Límite de tamaño de un documento (el servidor acepta hasta 12 MB en base64). */
export const MAX_DOC_BYTES = 8 * 1024 * 1024;
