import { redirect } from "next/navigation";
import { getSesion, rolDe } from "@/lib/auth";
import { puedeVer } from "@/lib/nav";

/**
 * Guard de servidor para páginas con acceso restringido por rol.
 * Si el rol actual no puede ver la sección, lo devuelve al dashboard.
 */
export async function exigirAcceso(href: string) {
  const sesion = await getSesion();
  const rol = rolDe(sesion);
  if (!puedeVer(href, rol)) redirect("/dashboard");
  return { sesion, rol } as const;
}
