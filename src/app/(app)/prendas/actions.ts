"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TablesUpdate, Json } from "@/types/database.types";

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
  composicion: z.string().trim().optional().nullable(),
  precio: z.coerce.number().min(0),
  stock: z.coerce.number().int().min(0),
  stock_minimo: z.coerce.number().int().min(0),
  destacado: z.coerce.boolean().default(false),
  costos: z.array(costoSchema).default([]),
});

/** Limpia el jsonb de medidas que llega del formulario. */
function parseMedidas(raw: FormDataEntryValue | null): Record<string, unknown> {
  if (typeof raw !== "string" || !raw) return {};
  try {
    const o = JSON.parse(raw);
    if (!o || typeof o !== "object") return {};
    const columnas = Array.isArray(o.columnas) ? o.columnas.filter((x: unknown) => typeof x === "string" && x.trim()).map((x: string) => x.trim()) : [];
    const filas = Array.isArray(o.filas)
      ? o.filas
          .map((f: { label?: unknown; valores?: unknown }) => ({
            label: typeof f?.label === "string" ? f.label.trim() : "",
            valores: Array.isArray(f?.valores) ? f.valores.map((v: unknown) => String(v ?? "").trim()) : [],
          }))
          .filter((f: { label: string }) => f.label)
      : [];
    if (!columnas.length || !filas.length) return {};
    return { nota: typeof o.nota === "string" && o.nota.trim() ? o.nota.trim() : "Medidas en cm", columnas, filas };
  } catch {
    return {};
  }
}

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
    composicion: formData.get("composicion"),
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

/** Sube varias fotos adicionales al bucket `prendas` y devuelve sus paths. */
async function subirGaleria(
  supabase: Awaited<ReturnType<typeof createClient>>,
  archivos: FormDataEntryValue[],
): Promise<string[]> {
  const paths: string[] = [];
  for (const archivo of archivos) {
    if (!(archivo instanceof File) || archivo.size === 0) continue;
    const ext = (archivo.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("prendas")
      .upload(path, archivo, { contentType: archivo.type || "image/jpeg", upsert: false });
    if (error) throw new Error(`No se pudo subir una foto: ${error.message}`);
    paths.push(path);
  }
  return paths;
}

/** Lee la lista JSON de fotos existentes que se deben conservar. */
function leerConservar(raw: FormDataEntryValue | null): string[] {
  if (typeof raw !== "string" || !raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
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
    const galeria = await subirGaleria(supabase, formData.getAll("imagenes"));
    const extra = galeria.length ? { imagenes: galeria } : {};

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
        composicion: v.composicion || null,
        medidas: parseMedidas(formData.get("medidas")) as Json,
        precio: v.precio,
        costo,
        costos: costosObj,
        stock: v.stock,
        stock_minimo: v.stock_minimo,
        destacado: v.destacado,
        imagen_path,
        extra,
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
      .select("stock, nombre, extra")
      .eq("id", id)
      .single();

    const imagen_path = await subirImagen(supabase, formData.get("imagen"));

    // Galería: conservar las fotos elegidas + subir las nuevas, preservando
    // el resto de `extra` (por ejemplo imagen_drive_id de la migración).
    const extraActual = (actual?.extra ?? {}) as Record<string, unknown>;
    const conservar = leerConservar(formData.get("imagenes_conservar"));
    const nuevas = await subirGaleria(supabase, formData.getAll("imagenes"));
    const imagenes = [...conservar, ...nuevas];
    const extra: Record<string, unknown> = { ...extraActual };
    if (imagenes.length) extra.imagenes = imagenes;
    else delete extra.imagenes;

    const update: TablesUpdate<"prendas"> = {
      nombre: v.nombre,
      categoria: v.categoria || null,
      talla: v.talla || null,
      color: v.color || null,
      descripcion: v.descripcion || null,
      observaciones: v.observaciones || null,
      composicion: v.composicion || null,
      medidas: parseMedidas(formData.get("medidas")) as TablesUpdate<"prendas">["medidas"],
      precio: v.precio,
      costo,
      costos: costosObj,
      stock: v.stock,
      stock_minimo: v.stock_minimo,
      destacado: v.destacado,
      extra: extra as TablesUpdate<"prendas">["extra"],
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
