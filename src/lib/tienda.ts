import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database.types";
import type { EstadoTienda, Producto, Variante } from "@/lib/tienda-tipos";

// Reexporta los tipos/helpers de la vitrina para quien importe desde aquí.
export { WHATSAPP_DEFECTO, COLOR_ESTADO, linkWhatsApp } from "@/lib/tienda-tipos";
export type { EstadoTienda, Producto, Variante } from "@/lib/tienda-tipos";

const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;

/** URL pública de una imagen del bucket `prendas`. */
export function urlPrenda(path: string | null): string | null {
  if (!path) return null;
  return `${BASE}/storage/v1/object/public/prendas/${path}`;
}

/** Reúne todas las imágenes de una prenda: principal + `extra.imagenes` + Drive. */
function imagenesDe(imagen_path: string | null, extra: Json): string[] {
  const urls: string[] = [];
  const principal = urlPrenda(imagen_path);
  if (principal) urls.push(principal);

  const e = (extra ?? {}) as Record<string, Json>;
  const extras = Array.isArray(e.imagenes) ? e.imagenes : [];
  for (const p of extras) {
    if (typeof p === "string") {
      const u = urlPrenda(p);
      if (u) urls.push(u);
    }
  }
  const driveId = typeof e.imagen_drive_id === "string" ? e.imagen_drive_id : null;
  if (!principal && driveId) urls.push(`https://drive.google.com/thumbnail?id=${driveId}&sz=w1000`);

  // Sin duplicados, conservando el orden.
  return [...new Set(urls)];
}

function estadoDe(stockTotal: number, umbral: number): EstadoTienda {
  if (stockTotal <= 0) return "AGOTADO";
  if (stockTotal <= Math.max(umbral, 1)) return "POCAS UNIDADES";
  return "DISPONIBLE";
}

interface FilaCatalogo {
  id: string | null;
  nombre: string | null;
  categoria: string | null;
  talla: string | null;
  color: string | null;
  precio: number | null;
  stock: number | null;
  stock_minimo: number | null;
  descripcion: string | null;
  imagen_path: string | null;
  extra: Json | null;
  destacado: boolean | null;
  created_at: string | null;
}

/** Agrupa las filas del catálogo (una por talla/color) en productos. */
function agrupar(filas: FilaCatalogo[]): Producto[] {
  const mapa = new Map<string, FilaCatalogo[]>();
  for (const f of filas) {
    if (!f.id || !f.nombre) continue;
    const clave = f.nombre.trim().toLowerCase();
    const arr = mapa.get(clave) ?? [];
    arr.push(f);
    mapa.set(clave, arr);
  }

  const productos: Producto[] = [];
  for (const filasProd of mapa.values()) {
    const variantes: Variante[] = filasProd.map((f) => ({
      id: f.id!,
      talla: f.talla,
      color: f.color,
      precio: Number(f.precio ?? 0),
      stock: Number(f.stock ?? 0),
      stockMinimo: Number(f.stock_minimo ?? 0),
      imagenes: imagenesDe(f.imagen_path, f.extra ?? {}),
    }));

    const precios = variantes.map((v) => v.precio).filter((p) => p > 0);
    const stockTotal = variantes.reduce((s, v) => s + v.stock, 0);
    const umbral = Math.max(...filasProd.map((f) => Number(f.stock_minimo ?? 0)), 0);
    const conStock = variantes.filter((v) => v.stock > 0);
    // Tallas y colores disponibles (con stock); si no hay stock, se muestran todos.
    const base = conStock.length ? conStock : variantes;
    const tallas = [...new Set(base.map((v) => v.talla).filter(Boolean) as string[])];
    const colores = [...new Set(base.map((v) => v.color).filter(Boolean) as string[])];
    const imagenes = [...new Set(variantes.flatMap((v) => v.imagenes))];
    // La representativa: primera con foto y stock, si existe.
    const repr = variantes.find((v) => v.stock > 0 && v.imagenes.length) ?? variantes.find((v) => v.imagenes.length) ?? variantes[0];
    const primera = filasProd[0];

    productos.push({
      id: repr.id,
      nombre: primera.nombre!.trim(),
      categoria: primera.categoria,
      descripcion: filasProd.find((f) => f.descripcion)?.descripcion ?? null,
      destacado: filasProd.some((f) => f.destacado),
      precioMin: precios.length ? Math.min(...precios) : 0,
      precioMax: precios.length ? Math.max(...precios) : 0,
      stockTotal,
      estado: estadoDe(stockTotal, umbral),
      tallas,
      colores,
      imagenes,
      createdAt: filasProd.map((f) => f.created_at ?? "").sort().reverse()[0] ?? "",
      variantes,
    });
  }

  // Novedades primero (más recientes).
  productos.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return productos;
}

/** Todos los productos de la vitrina (agrupados). */
export async function getProductos(): Promise<Producto[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("catalogo_publico")
    .select("id, nombre, categoria, talla, color, precio, stock, stock_minimo, descripcion, imagen_path, extra, destacado, created_at")
    .order("created_at", { ascending: false });
  return agrupar((data ?? []) as FilaCatalogo[]);
}

/** Un producto por el id de cualquiera de sus variantes. */
export async function getProducto(varianteId: string): Promise<Producto | null> {
  const supabase = await createClient();
  const { data: fila } = await supabase
    .from("catalogo_publico")
    .select("nombre")
    .eq("id", varianteId)
    .maybeSingle();
  if (!fila?.nombre) return null;

  const { data } = await supabase
    .from("catalogo_publico")
    .select("id, nombre, categoria, talla, color, precio, stock, stock_minimo, descripcion, imagen_path, extra, destacado, created_at")
    .eq("nombre", fila.nombre);
  const productos = agrupar((data ?? []) as FilaCatalogo[]);
  return productos[0] ?? null;
}
