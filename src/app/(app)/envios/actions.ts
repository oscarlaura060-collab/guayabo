"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSesion, rolDe } from "@/lib/auth";

export interface Resultado {
  ok: boolean;
  error?: string;
}

async function esAdmin() {
  return rolDe(await getSesion()) === "ADMINISTRADOR";
}

const ciudadSchema = z.object({
  ciudad: z.string().trim().min(1, "Escribe la ciudad"),
  precio: z.coerce.number().min(0),
});

export async function crearCiudadEnvio(formData: FormData): Promise<Resultado> {
  if (!(await esAdmin())) return { ok: false, error: "Solo un administrador." };
  const parsed = ciudadSchema.safeParse({ ciudad: formData.get("ciudad"), precio: formData.get("precio") });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  const supabase = await createClient();
  const { error } = await supabase.from("envios").insert({ ciudad: parsed.data.ciudad, precio: parsed.data.precio });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/envios");
  revalidatePath("/carrito");
  return { ok: true };
}

export async function actualizarCiudadEnvio(id: string, precio: number): Promise<Resultado> {
  if (!(await esAdmin())) return { ok: false, error: "Solo un administrador." };
  const supabase = await createClient();
  const { error } = await supabase.from("envios").update({ precio }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/envios");
  revalidatePath("/carrito");
  return { ok: true };
}

export async function eliminarCiudadEnvio(id: string): Promise<Resultado> {
  if (!(await esAdmin())) return { ok: false, error: "Solo un administrador." };
  const supabase = await createClient();
  const { error } = await supabase.from("envios").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/envios");
  revalidatePath("/carrito");
  return { ok: true };
}

/** Guarda el envío por defecto (para ciudades no listadas) en config. */
export async function guardarEnvioDefecto(precio: number): Promise<Resultado> {
  if (!(await esAdmin())) return { ok: false, error: "Solo un administrador." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("config")
    .upsert({ clave: "ENVIO_DEFECTO", valor: String(Math.max(0, Math.round(precio))), activo: true }, { onConflict: "clave" });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/envios");
  revalidatePath("/carrito");
  return { ok: true };
}
