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
