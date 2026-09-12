import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database.types";

export type Lista = Tables<"listas">;

/** Catálogos activos de un tipo, ordenados. */
export async function getListas(tipo: string, ambito?: string): Promise<Lista[]> {
  const supabase = await createClient();
  let q = supabase.from("listas").select("*").eq("tipo", tipo).eq("activo", true);
  if (ambito) q = q.eq("ambito", ambito);
  const { data } = await q.order("orden", { ascending: true });
  return data ?? [];
}

export interface CatalogosPrenda {
  categorias: string[];
  tallas: string[];
  colores: { nombre: string; hex: string | null }[];
  componentes: string[];
}

/** Catálogos que necesita el formulario de prendas. */
export async function getCatalogosPrenda(): Promise<CatalogosPrenda> {
  const [categorias, tallas, colores, componentes] = await Promise.all([
    getListas("CATEGORIA"),
    getListas("TALLA"),
    getListas("COLOR"),
    getListas("COMPONENTE_COSTO"),
  ]);
  return {
    categorias: categorias.map((c) => c.nombre),
    tallas: tallas.map((t) => t.nombre),
    colores: colores.map((c) => ({ nombre: c.nombre, hex: c.hex })),
    componentes: componentes.map((c) => c.nombre),
  };
}

/** Mapa estado→color para chips (por ámbito). */
export async function getColoresEstado(ambito: string): Promise<Record<string, string>> {
  const estados = await getListas("ESTADO", ambito);
  const mapa: Record<string, string> = {};
  for (const e of estados) if (e.hex) mapa[e.nombre] = e.hex;
  return mapa;
}
