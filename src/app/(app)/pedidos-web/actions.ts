"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSesion, rolDe } from "@/lib/auth";
import { getConfig } from "@/lib/config";
import { crearVenta } from "../ventas/actions";
import { ESTADOS_SOLICITUD, type EstadoSolicitud } from "./estados";

export interface Resultado {
  ok: boolean;
  error?: string;
  ventaId?: string;
}

interface ItemGuardado {
  prendaId?: string;
  nombre?: string;
  talla?: string | null;
  color?: string | null;
  cantidad?: number;
  precio?: number;
}

/**
 * Confirma un pedido web y lo convierte en VENTA (descuenta inventario y,
 * si el pedido está marcado "Pagada", registra el pago). Estilo OlaClick:
 * el pedido entra por la web y aquí se confirma para volverse venta real.
 */
export async function confirmarSolicitud(
  id: string,
  opts?: { metodo?: string; pagado?: boolean },
): Promise<Resultado> {
  if (!(await puedeEscribir())) return { ok: false, error: "Sin permiso." };
  const supabase = await createClient();

  const { data: sol } = await supabase
    .from("solicitudes_web")
    .select("id, cliente_nombre, items, envio, total, estado, venta_id")
    .eq("id", id)
    .single();
  if (!sol) return { ok: false, error: "Pedido no encontrado." };
  if (sol.venta_id) return { ok: false, error: "Este pedido ya se convirtió en venta." };

  const items = (Array.isArray(sol.items) ? sol.items : []) as ItemGuardado[];
  if (items.length === 0) return { ok: false, error: "El pedido no tiene productos." };

  // Costo por prenda para calcular utilidad en la venta.
  const ids = [...new Set(items.map((it) => it.prendaId).filter(Boolean) as string[])];
  const { data: prendas } = ids.length
    ? await supabase.from("prendas").select("id, costo").in("id", ids)
    : { data: [] };
  const costoDe = new Map((prendas ?? []).map((p) => [p.id, Number(p.costo)]));

  const config = await getConfig().catch(() => ({}) as Record<string, string>);
  const metodo = opts?.metodo || config.PAGO_METODO_VENTA || "Nequi";
  const pagado = opts?.pagado ?? sol.estado === "Pagada";

  const res = await crearVenta({
    cliente_nombre: sol.cliente_nombre,
    descuento: 0,
    envio: Number(sol.envio ?? 0),
    observaciones: "Pedido web",
    items: items.map((it) => ({
      prenda_id: it.prendaId ?? null,
      nombre: it.nombre ?? "Producto",
      talla: it.talla ?? null,
      color: it.color ?? null,
      cantidad: Number(it.cantidad ?? 1),
      precio: Number(it.precio ?? 0),
      descuento: 0,
      costo_unit: (it.prendaId ? costoDe.get(it.prendaId) : 0) ?? 0,
    })),
    pago: pagado ? { valor: Number(sol.total ?? 0), metodo } : null,
  });
  if (!res.ok) return { ok: false, error: res.error ?? "No se pudo crear la venta." };

  await supabase.from("solicitudes_web").update({ estado: "Confirmada", venta_id: res.id }).eq("id", id);
  revalidatePath("/pedidos-web");
  revalidatePath("/ventas");
  return { ok: true, ventaId: res.id };
}

async function puedeEscribir() {
  const rol = rolDe(await getSesion());
  return rol === "ADMINISTRADOR" || rol === "VENDEDOR";
}

export async function actualizarEstadoSolicitud(id: string, estado: string): Promise<Resultado> {
  if (!(await puedeEscribir())) return { ok: false, error: "Sin permiso." };
  if (!ESTADOS_SOLICITUD.includes(estado as EstadoSolicitud)) {
    return { ok: false, error: "Estado inválido." };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("solicitudes_web").update({ estado }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/pedidos-web");
  return { ok: true };
}

export async function eliminarSolicitud(id: string): Promise<Resultado> {
  const rol = rolDe(await getSesion());
  if (rol !== "ADMINISTRADOR") return { ok: false, error: "Solo un administrador puede eliminar." };
  const supabase = await createClient();
  const { error } = await supabase.from("solicitudes_web").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/pedidos-web");
  return { ok: true };
}
