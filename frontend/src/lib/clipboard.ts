/**
 * Copia texto al portapapeles con fallback para navegadores in-app (WhatsApp,
 * Instagram, Facebook) donde `navigator.clipboard` no existe o está bloqueada
 * por falta de contexto seguro/foco. Bug real: los socios abren su oficina
 * virtual desde el navegador embebido de WhatsApp, donde `navigator.clipboard`
 * es `undefined` — el botón "Copiar" no hacía nada y no había ningún error
 * visible, por eso "no se podía copiar el enlace" sin más pista.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Sigue al fallback — algunos WebViews exponen la API pero la rechazan.
    }
  }

  // Fallback universal: textarea oculto + execCommand('copy'). Funciona en
  // navegadores in-app antiguos que no implementan la Clipboard API moderna.
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
