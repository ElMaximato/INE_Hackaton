/**
 * Configuración general del proyecto.
 * La dirección pública que aparece en los mensajes para compartir se define al publicar:
 *   VITE_SITE_URL=https://mi-sitio.example pnpm run build
 * Si no se define, se usa el origen actual (útil en local y en vista previa).
 */
const configured = (import.meta.env.VITE_SITE_URL as string | undefined)?.trim()

export const SITE_URL =
  configured ||
  (typeof window !== "undefined" && window.location.origin && window.location.origin !== "null"
    ? window.location.origin
    : "")
