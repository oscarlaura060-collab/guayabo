import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database.types";

export type Rol = "ADMINISTRADOR" | "VENDEDOR" | "CONSULTA";
export type Perfil = Tables<"perfiles">;

export interface Sesion {
  userId: string;
  email: string;
  perfil: Perfil | null;
}

/**
 * Devuelve la sesión actual junto con el perfil de la tabla `perfiles`.
 * `perfil` es null si el usuario autenticado no tiene perfil (o no está activo).
 */
export async function getSesion(): Promise<Sesion | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return {
    userId: user.id,
    email: user.email ?? "",
    perfil: perfil ?? null,
  };
}

export function rolDe(sesion: Sesion | null): Rol | null {
  const rol = sesion?.perfil?.activo ? sesion.perfil.rol : null;
  return (rol as Rol) ?? null;
}

/** Rol del usuario autenticado actual (o null si no hay sesión/perfil activo). */
export async function rolActual(): Promise<Rol | null> {
  return rolDe(await getSesion());
}

/** ¿El usuario actual es staff con permiso de escritura (ADMIN o VENDEDOR)? */
export async function puedeEscribirServer(): Promise<boolean> {
  const rol = await rolActual();
  return rol === "ADMINISTRADOR" || rol === "VENDEDOR";
}

/** ¿El usuario actual es ADMINISTRADOR activo? */
export async function esAdminServer(): Promise<boolean> {
  return (await rolActual()) === "ADMINISTRADOR";
}

/** ¿Hay un perfil de staff activo (cualquier rol)? */
export async function esStaffActivo(): Promise<boolean> {
  return (await rolActual()) !== null;
}
