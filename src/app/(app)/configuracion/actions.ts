"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSesion, rolDe } from "@/lib/auth";
import type { TablesUpdate } from "@/types/database.types";

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

/** Sube el logo de la marca (bucket público) y guarda su URL en config.LOGO_URL. */
export async function subirLogo(formData: FormData): Promise<Resultado> {
  if (!(await exigirAdmin())) return { ok: false, error: "Solo un administrador." };
  const archivo = formData.get("logo");
  if (!(archivo instanceof File) || archivo.size === 0) return { ok: false, error: "Elige una imagen." };
  const supabase = await createClient();
  const ext = (archivo.name.split(".").pop() || "png").toLowerCase();
  const path = `marca/logo-${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("prendas")
    .upload(path, archivo, { contentType: archivo.type || "image/png", upsert: false });
  if (error) return { ok: false, error: error.message };
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/prendas/${path}`;
  const { error: e2 } = await supabase.from("config").update({ valor: url }).eq("clave", "LOGO_URL");
  if (e2) return { ok: false, error: e2.message };
  revalidatePath("/", "layout");
  revalidatePath("/configuracion");
  return { ok: true };
}

// ---------------- Catálogos (listas) ----------------

export async function crearLista(datos: {
  tipo: string;
  nombre: string;
  hex?: string | null;
  ambito?: string | null;
}): Promise<Resultado> {
  if (!(await exigirAdmin())) return { ok: false, error: "Solo un administrador." };
  const nombre = datos.nombre.trim();
  if (!nombre) return { ok: false, error: "Escribe un nombre." };
  const supabase = await createClient();
  const { data: max } = await supabase
    .from("listas")
    .select("orden")
    .eq("tipo", datos.tipo)
    .order("orden", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await supabase.from("listas").insert({
    tipo: datos.tipo,
    nombre,
    hex: datos.hex || null,
    ambito: datos.ambito || null,
    orden: (max?.orden ?? 0) + 1,
    activo: true,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/configuracion");
  return { ok: true };
}

export async function actualizarLista(
  id: string,
  datos: { nombre?: string; hex?: string | null; ambito?: string | null; activo?: boolean },
): Promise<Resultado> {
  if (!(await exigirAdmin())) return { ok: false, error: "Solo un administrador." };
  const supabase = await createClient();
  const patch: TablesUpdate<"listas"> = {};
  if (datos.nombre !== undefined) patch.nombre = datos.nombre.trim();
  if (datos.hex !== undefined) patch.hex = datos.hex || null;
  if (datos.ambito !== undefined) patch.ambito = datos.ambito || null;
  if (datos.activo !== undefined) patch.activo = datos.activo;
  const { error } = await supabase.from("listas").update(patch).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/configuracion");
  return { ok: true };
}

export async function eliminarLista(id: string): Promise<Resultado> {
  if (!(await exigirAdmin())) return { ok: false, error: "Solo un administrador." };
  const supabase = await createClient();
  const { error } = await supabase.from("listas").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/configuracion");
  return { ok: true };
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
