/**
 * Prefijo opcional para el panel administrativo ("ruta no predecible").
 *
 * Es una CAPA EXTRA, no el mecanismo de seguridad: aunque alguien descubra la
 * ruta, el acceso lo bloquean la autenticación + RLS. Si NEXT_PUBLIC_ADMIN_PATH
 * está vacío, el panel vive en las rutas normales (comportamiento por defecto).
 *
 * Con un valor (p.ej. "/panel-a3f9c1"):
 *   - El panel y el login se sirven bajo ese prefijo.
 *   - Las rutas "desnudas" (/dashboard, /login, …) se ocultan (404) a quien no
 *     tiene sesión, para que un escáner no confirme que existe el admin.
 *
 * Se usa tanto en el proxy (servidor) como en la navegación (cliente); por eso
 * la variable es NEXT_PUBLIC_. El prefijo NO es un secreto criptográfico.
 */
export const ADMIN_BASE = (process.env.NEXT_PUBLIC_ADMIN_PATH || "")
  .trim()
  .replace(/\/+$/, "");

/** Antepone el prefijo del panel a una ruta interna ("/dashboard" → "/panel-x/dashboard"). */
export function adminHref(path: string): string {
  if (!ADMIN_BASE) return path;
  if (!path.startsWith("/")) path = "/" + path;
  return path === "/" ? ADMIN_BASE : ADMIN_BASE + path;
}
