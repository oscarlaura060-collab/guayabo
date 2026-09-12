"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSesion, rolDe } from "@/lib/auth";

async function exigirAdmin() {
  return rolDe(await getSesion()) === "ADMINISTRADOR";
}

export interface Resultado {
  ok: boolean;
  error?: string;
}

const gastoSchema = z.object({
  fecha: z.string().min(1, "La fecha es obligatoria"),
  categoria: z.string().trim().min(1, "Elige una categoría"),
  descripcion: z.string().trim().min(1, "Describe el gasto"),
  valor: z.coerce.number().positive("El valor debe ser mayor a cero"),
  metodo: z.string().trim().optional().nullable(),
  observaciones: z.string().trim().optional().nullable(),
});

function leer(formData: FormData) {
  return gastoSchema.safeParse({
    fecha: formData.get("fecha"),
    categoria: formData.get("categoria"),
    descripcion: formData.get("descripcion"),
    valor: formData.get("valor"),
    metodo: formData.get("metodo"),
    observaciones: formData.get("observaciones"),
  });
}

function valores(v: z.infer<typeof gastoSchema>) {
  return {
    fecha: v.fecha,
    categoria: v.categoria,
    descripcion: v.descripcion,
    valor: v.valor,
    metodo: v.metodo || null,
    observaciones: v.observaciones || null,
  };
}

async function subirComprobanteArchivo(
  supabase: Awaited<ReturnType<typeof createClient>>,
  archivo: FormDataEntryValue | null,
): Promise<string | null> {
  if (!(archivo instanceof File) || archivo.size === 0) return null;
  const ext = (archivo.name.split(".").pop() || "jpg").toLowerCase();
  const path = `gastos/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("comprobantes")
    .upload(path, archivo, { contentType: archivo.type || "image/jpeg", upsert: false });
  if (error) throw new Error(`No se pudo subir el comprobante: ${error.message}`);
  return path;
}

export async function crearGasto(formData: FormData): Promise<Resultado> {
  if (!(await exigirAdmin())) return { ok: false, error: "Solo un administrador." };
  const parsed = leer(formData);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  const supabase = await createClient();
  try {
    const { data: codigo, error: errCodigo } = await supabase.rpc("siguiente_consecutivo", { p_entidad: "GASTO" });
    if (errCodigo) throw new Error(errCodigo.message);
    const comprobante_path = await subirComprobanteArchivo(supabase, formData.get("comprobante"));
    const { error } = await supabase.from("gastos").insert({ codigo, comprobante_path, ...valores(parsed.data) });
    if (error) throw new Error(error.message);
    revalidatePath("/gastos");
    revalidatePath("/utilidades");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al crear el gasto" };
  }
}

/** Sube o reemplaza el comprobante de un gasto existente. */
export async function subirComprobanteGasto(id: string, formData: FormData): Promise<Resultado> {
  if (!(await exigirAdmin())) return { ok: false, error: "Solo un administrador." };
  const supabase = await createClient();
  try {
    const path = await subirComprobanteArchivo(supabase, formData.get("comprobante"));
    if (!path) return { ok: false, error: "Elige un archivo." };
    const { error } = await supabase.from("gastos").update({ comprobante_path: path }).eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/gastos");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al subir el comprobante" };
  }
}

export async function actualizarGasto(id: string, formData: FormData): Promise<Resultado> {
  if (!(await exigirAdmin())) return { ok: false, error: "Solo un administrador." };
  const parsed = leer(formData);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  const supabase = await createClient();
  try {
    const comprobante_path = await subirComprobanteArchivo(supabase, formData.get("comprobante"));
    const update = comprobante_path ? { ...valores(parsed.data), comprobante_path } : valores(parsed.data);
    const { error } = await supabase.from("gastos").update(update).eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/gastos");
    revalidatePath("/utilidades");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al actualizar el gasto" };
  }
}

export async function desactivarGasto(id: string): Promise<Resultado> {
  if (!(await exigirAdmin())) return { ok: false, error: "Solo un administrador." };
  const supabase = await createClient();
  const { error } = await supabase.from("gastos").update({ activo: false }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/gastos");
  revalidatePath("/utilidades");
  return { ok: true };
}
