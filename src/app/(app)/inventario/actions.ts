"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getConfig } from "@/lib/config";
import { getSesion, rolDe } from "@/lib/auth";

async function puedeEscribir() {
  const rol = rolDe(await getSesion());
  return rol === "ADMINISTRADOR" || rol === "VENDEDOR";
}

export interface Resultado {
  ok: boolean;
  error?: string;
}

const ajusteSchema = z.object({
  prenda_id: z.string().uuid(),
  tipo: z.enum(["ENTRADA", "SALIDA", "AJUSTE"]),
  cantidad: z.coerce.number().int().min(0),
  nota: z.string().trim().optional().nullable(),
});

/**
 * Ajusta el stock de una prenda y registra el movimiento.
 * - ENTRADA: suma; SALIDA: resta; AJUSTE: fija el stock al valor indicado.
 */
export async function ajustarStock(formData: FormData): Promise<Resultado> {
  if (!(await puedeEscribir())) return { ok: false, error: "Sin permiso." };

  const parsed = ajusteSchema.safeParse({
    prenda_id: formData.get("prenda_id"),
    tipo: formData.get("tipo"),
    cantidad: formData.get("cantidad"),
    nota: formData.get("nota"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  const v = parsed.data;

  const supabase = await createClient();
  const config = await getConfig().catch(() => ({}) as Record<string, string>);
  const permitirNegativo = config.PERMITIR_STOCK_NEGATIVO === "TRUE";

  const { data: prenda } = await supabase
    .from("prendas")
    .select("nombre, stock")
    .eq("id", v.prenda_id)
    .single();
  if (!prenda) return { ok: false, error: "Prenda no encontrada." };

  const anterior = prenda.stock;
  let nuevo: number;
  if (v.tipo === "ENTRADA") nuevo = anterior + v.cantidad;
  else if (v.tipo === "SALIDA") nuevo = anterior - v.cantidad;
  else nuevo = v.cantidad; // AJUSTE: valor absoluto

  if (nuevo < 0 && !permitirNegativo) {
    return { ok: false, error: "El stock no puede quedar negativo." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error: errUpd } = await supabase.from("prendas").update({ stock: nuevo }).eq("id", v.prenda_id);
  if (errUpd) return { ok: false, error: errUpd.message };

  const { error: errMov } = await supabase.from("movimientos_inventario").insert({
    prenda_id: v.prenda_id,
    prenda_nombre: prenda.nombre,
    tipo: v.tipo,
    cantidad: Math.abs(nuevo - anterior),
    stock_anterior: anterior,
    stock_nuevo: nuevo,
    referencia: v.tipo === "AJUSTE" ? "Ajuste manual" : v.tipo === "ENTRADA" ? "Entrada manual" : "Salida manual",
    nota: v.nota || null,
    usuario_email: user?.email ?? null,
  });
  if (errMov) return { ok: false, error: errMov.message };

  revalidatePath("/inventario");
  revalidatePath("/prendas");
  return { ok: true };
}
