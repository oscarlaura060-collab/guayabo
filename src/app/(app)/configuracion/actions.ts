"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSesion, rolDe } from "@/lib/auth";

async function exigirAdmin() {
  return rolDe(await getSesion()) === "ADMINISTRADOR";
}

export interface Resultado {
  ok: boolean;
  error?: string;
}

/** Guarda los valores de configuración que hayan cambiado. */
export async function guardarConfig(valores: Record<string, string>): Promise<Resultado> {
  if (!(await exigirAdmin())) return { ok: false, error: "Solo un administrador puede cambiar la configuración." };
  const supabase = await createClient();
  try {
    for (const [clave, valor] of Object.entries(valores)) {
      const { error } = await supabase.from("config").update({ valor }).eq("clave", clave);
      if (error) throw new Error(`${clave}: ${error.message}`);
    }
    revalidatePath("/configuracion");
    revalidatePath("/", "layout"); // recarga el tema si cambiaron colores
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al guardar" };
  }
}

const ROLES = ["ADMINISTRADOR", "VENDEDOR", "CONSULTA"] as const;

/** Actualiza rol/estado/nombre de un perfil. */
export async function actualizarPerfil(
  id: string,
  datos: { rol?: string; activo?: boolean; nombre?: string },
): Promise<Resultado> {
  if (!(await exigirAdmin())) return { ok: false, error: "Solo un administrador." };
  if (datos.rol && !ROLES.includes(datos.rol as (typeof ROLES)[number])) {
    return { ok: false, error: "Rol inválido." };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("perfiles").update(datos).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/configuracion");
  return { ok: true };
}

const usuarioSchema = z.object({
  email: z.string().trim().email("Correo inválido"),
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  rol: z.enum(ROLES),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  activo: z.coerce.boolean().default(true),
});

/**
 * Crea una cuenta nueva (usuario en Auth + perfil). Requiere SUPABASE_SERVICE_ROLE_KEY.
 */
export async function crearUsuario(formData: FormData): Promise<Resultado> {
  if (!(await exigirAdmin())) return { ok: false, error: "Solo un administrador." };

  const parsed = usuarioSchema.safeParse({
    email: formData.get("email"),
    nombre: formData.get("nombre"),
    rol: formData.get("rol"),
    password: formData.get("password"),
    activo: formData.get("activo") === "on" || formData.get("activo") === "true",
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  const v = parsed.data;

  const admin = createAdminClient();
  if (!admin) {
    return {
      ok: false,
      error:
        "Falta configurar SUPABASE_SERVICE_ROLE_KEY para crear cuentas. Agrégala en Vercel (Settings → Environment Variables) y vuelve a intentar.",
    };
  }

  try {
    const { data, error } = await admin.auth.admin.createUser({
      email: v.email,
      password: v.password,
      email_confirm: true,
      user_metadata: { nombre: v.nombre },
    });
    if (error) throw new Error(error.message);
    const userId = data.user?.id;
    if (!userId) throw new Error("No se pudo crear el usuario.");

    // El trigger crea un perfil inactivo; lo ajustamos al rol/estado elegidos.
    const { error: errPerfil } = await admin
      .from("perfiles")
      .upsert(
        { id: userId, email: v.email, nombre: v.nombre, rol: v.rol, activo: v.activo },
        { onConflict: "id" },
      );
    if (errPerfil) throw new Error(errPerfil.message);

    revalidatePath("/configuracion");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al crear la cuenta" };
  }
}
