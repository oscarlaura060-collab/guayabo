"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/types/database.types";

const costoSchema = z.object({
  nombre: z.string().min(1),
  valor: z.coerce.number().min(0),
});

const prendaSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  categoria: z.string().trim().optional().nullable(),
  talla: z.string().trim().optional().nullable(),
  color: z.string().trim().optional().nullable(),
  descripcion: z.string().trim().optional().nullable(),
  observaciones: z.string().trim().optional().nullable(),
  precio: z.coerce.number().min(0),
  stock: z.coerce.number().int().min(0),
  stock_minimo: z.coerce.number().int().min(0),
  destacado: z.coerce.boolean().default(false),
  costos: z.array(costoSchema).default([]),
});

export interface ResultadoAccion {
  ok: boolean;
  error?: string;
}

function parseCostos(raw: FormDataEntryValue | null): Array<{ nombre: string; valor: number }> {
  if (typeof raw !== "string" || !raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function leer(formData: FormData) {
  return prendaSchema.safeParse({
    nombre: formData.get("nombre"),
    categoria: formData.get("categoria"),
    talla: formData.get("talla"),
    color: formData.get("color"),
    descripcion: formData.get("descripcion"),
    observaciones: formData.get("observaciones"),
    precio: formData.get("precio"),
    stock: formData.get("stock"),
    stock_minimo: formData.get("stock_minimo"),
    destacado: formData.get("destacado") === "on" || formData.get("destacado") === "true",
    costos: parseCostos(formData.get("costos")),
  });
}

/** Sube la imagen al bucket `prendas` y devuelve su path, o null si no hay. */
async function subirImagen(
  supabase: Awaited<ReturnType<typeof createClient>>,
  imagen: FormDataEntryValue | null,
): Promise<string | null> {
  if (!(imagen instanceof File) || imagen.size === 0) return null;
  const ext = (imagen.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("prendas")
    .upload(path, imagen, { contentType: imagen.type || "image/jpeg", upsert: false });
  if (error) throw new Error(`No se pudo subir la imagen: ${error.message}`);
  return path;
}

export async function crearPrenda(formData: FormData): Promise<ResultadoAccion> {
  const parsed = leer(formData);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const v = parsed.data;
  const supabase = await createClient();

  try {
    const costosObj: Record<string, number> = {};
    for (const c of v.costos) costosObj[c.nombre] = c.valor;
    const costo = v.costos.reduce((s, c) => s + c.valor, 0);

    const { data: codigo, error: errCodigo } = await supabase.rpc("siguiente_consecutivo", {
      p_entidad: "PRENDA",
    });
    if (errCodigo) throw new Error(errCodigo.message);

    const imagen_path = await subirImagen(supabase, formData.get("imagen"));

    const { data: prenda, error } = await supabase
      .from("prendas")
      .insert({
        codigo,
        nombre: v.nombre,
        categoria: v.categoria || null,
        talla: v.talla || null,
        color: v.color || null,
        descripcion: v.descripcion || null,
        observaciones: v.observaciones || null,
        precio: v.precio,
        costo,
        costos: costosObj,
        stock: v.stock,
        stock_minimo: v.stock_minimo,
        destacado: v.destacado,
        imagen_path,
      })
      .select("id, nombre")
      .single();
    if (error) throw new Error(error.message);

    if (v.stock > 0) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      await supabase.from("movimientos_inventario").insert({
        prenda_id: prenda.id,
        prenda_nombre: prenda.nombre,
        tipo: "ENTRADA",
        cantidad: v.stock,
        stock_anterior: 0,
        stock_nuevo: v.stock,
        referencia: "Registro inicial",
        usuario_email: user?.email ?? null,
      });
    }

    revalidatePath("/prendas");
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al crear la prenda" };
  }
}

export async function actualizarPrenda(id: string, formData: FormData): Promise<ResultadoAccion> {
  const parsed = leer(formData);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const v = parsed.data;
  const supabase = await createClient();

  try {
    const costosObj: Record<string, number> = {};
    for (const c of v.costos) costosObj[c.nombre] = c.valor;
    const costo = v.costos.reduce((s, c) => s + c.valor, 0);

    const { data: actual } = await supabase
      .from("prendas")
      .select("stock, nombre")
      .eq("id", id)
      .single();

    const imagen_path = await subirImagen(supabase, formData.get("imagen"));

    const update: TablesUpdate<"prendas"> = {
      nombre: v.nombre,
      categoria: v.categoria || null,
      talla: v.talla || null,
      color: v.color || null,
      descripcion: v.descripcion || null,
      observaciones: v.observaciones || null,
      precio: v.precio,
      costo,
      costos: costosObj,
      stock: v.stock,
      stock_minimo: v.stock_minimo,
      destacado: v.destacado,
    };
    if (imagen_path) update.imagen_path = imagen_path;

    const { error } = await supabase.from("prendas").update(update).eq("id", id);
    if (error) throw new Error(error.message);

    // Ajuste de inventario si cambió el stock.
    const anterior = actual?.stock ?? 0;
    if (anterior !== v.stock) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      await supabase.from("movimientos_inventario").insert({
        prenda_id: id,
        prenda_nombre: v.nombre,
        tipo: "AJUSTE",
        cantidad: Math.abs(v.stock - anterior),
        stock_anterior: anterior,
        stock_nuevo: v.stock,
        referencia: "Ajuste manual",
        usuario_email: user?.email ?? null,
      });
    }

    revalidatePath("/prendas");
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al actualizar la prenda" };
  }
}

/** Nada se borra si tiene historial: se marca activo = false. */
export async function desactivarPrenda(id: string): Promise<ResultadoAccion> {
  const supabase = await createClient();
  const { error } = await supabase.from("prendas").update({ activo: false }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/prendas");
  revalidatePath("/", "layout");
  return { ok: true };
}
