import type { Tables, Json } from "@/types/database.types";

export type Prenda = Tables<"prendas">;

const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;

/**
 * URL de la imagen de una prenda.
 * Prioridad: imagen en Storage (bucket público `prendas`); si no, el
 * thumbnail de Drive de los datos migrados; si no hay, null.
 */
export function urlImagenPrenda(prenda: Pick<Prenda, "imagen_path" | "extra">): string | null {
  if (prenda.imagen_path) {
    return `${BASE}/storage/v1/object/public/prendas/${prenda.imagen_path}`;
  }
  const extra = (prenda.extra ?? {}) as Record<string, Json>;
  const driveId = typeof extra.imagen_drive_id === "string" ? extra.imagen_drive_id : null;
  if (driveId) return `https://drive.google.com/thumbnail?id=${driveId}&sz=w800`;
  return null;
}

/** Desglose de costos {componente: valor} a partir del jsonb. */
export function desgloseCostos(costos: Json): Array<{ nombre: string; valor: number }> {
  if (!costos || typeof costos !== "object" || Array.isArray(costos)) return [];
  return Object.entries(costos as Record<string, unknown>).map(([nombre, v]) => ({
    nombre,
    valor: Number(v) || 0,
  }));
}

export interface EstadoStock {
  etiqueta: "Agotado" | "Stock bajo" | "Disponible";
  color: string;
}

/** Clasifica el stock de una prenda para el chip. */
export function estadoStock(stock: number, minimo: number): EstadoStock {
  if (stock <= 0) return { etiqueta: "Agotado", color: "#D33A2C" };
  if (stock <= minimo) return { etiqueta: "Stock bajo", color: "#F4B740" };
  return { etiqueta: "Disponible", color: "#3AA76D" };
}
