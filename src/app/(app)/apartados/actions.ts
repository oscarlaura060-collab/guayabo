"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSesion, rolDe } from "@/lib/auth";

async function puedeEscribir() {
  const rol = rolDe(await getSesion());
  return rol === "ADMINISTRADOR" || rol === "VENDEDOR";
}

export interface Resultado {
  ok: boolean;
  error?: string;
  ventaId?: string;
}

const apartadoSchema = z.object({
  cliente_id: z.string().uuid().nullable().optional(),
  cliente_nombre: z.string().trim().nullable().optional(),
  prenda_id: z.string().uuid(),
  cantidad: z.coerce.number().int().min(1),
  precio: z.coerce.number().min(0),
  abono: z.coerce.number().min(0).default(0),
  metodo: z.string().trim().optional().nullable(),
  fecha_limite: z.string().optional().nullable(),
  observaciones: z.string().trim().optional().nullable(),
});

/** Crea un apartado (reserva), típicamente de una prenda sin stock. */
export async function crearApartado(formData: FormData): Promise<Resultado> {
  if (!(await puedeEscribir())) return { ok: false, error: "Sin permiso." };
  const parsed = apartadoSchema.safeParse({
    cliente_id: formData.get("cliente_id") || null,
    cliente_nombre: formData.get("cliente_nombre"),
    prenda_id: formData.get("prenda_id"),
    cantidad: formData.get("cantidad"),
    precio: formData.get("precio"),
    abono: formData.get("abono"),
    metodo: formData.get("metodo"),
    fecha_limite: formData.get("fecha_limite"),
    observaciones: formData.get("observaciones"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  const v = parsed.data;

  const supabase = await createClient();
  try {
    const { data: prenda } = await supabase
      .from("prendas")
      .select("nombre, talla, color, stock")
      .eq("id", v.prenda_id)
      .single();
    if (!prenda) return { ok: false, error: "Prenda no encontrada." };

    const { data: codigo, error: errCod } = await supabase.rpc("siguiente_consecutivo", { p_entidad: "APARTADO" });
    if (errCod) throw new Error(errCod.message);

    // Si se eligió un cliente de la lista pero no se escribió nombre, lo tomamos
    // de su ficha para que el listado siempre muestre a quién pertenece.
    let clienteNombre = v.cliente_nombre?.trim() || null;
    if (!clienteNombre && v.cliente_id) {
      const { data: cli } = await supabase.from("clientes").select("nombre").eq("id", v.cliente_id).single();
      clienteNombre = cli?.nombre ?? null;
    }

    const total = v.precio * v.cantidad;
    const abonado = Math.min(v.abono, total);
    const saldo = Math.max(total - abonado, 0);

    const { data: apartado, error } = await supabase
      .from("apartados")
      .insert({
        codigo,
        cliente_id: v.cliente_id ?? null,
        cliente_nombre: clienteNombre,
        prenda_id: v.prenda_id,
        prenda_nombre: prenda.nombre,
        talla: prenda.talla,
        color: prenda.color,
        cantidad: v.cantidad,
        precio: v.precio,
        total,
        abonado,
        saldo,
        estado: "Activo",
        fecha: new Date().toISOString().slice(0, 10),
        fecha_limite: v.fecha_limite || null,
        observaciones: v.observaciones || null,
        disponible: prenda.stock >= v.cantidad,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    if (abonado > 0) {
      const { data: codPago } = await supabase.rpc("siguiente_consecutivo", { p_entidad: "PAGO" });
      await supabase.from("pagos").insert({
        codigo: codPago,
        apartado_id: apartado.id,
        cliente_id: v.cliente_id ?? null,
        cliente_nombre: clienteNombre,
        fecha: new Date().toISOString().slice(0, 10),
        valor: abonado,
        metodo: v.metodo || "Efectivo",
        tipo_pago: "ABONO",
      });
    }

    revalidatePath("/apartados");
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al crear el apartado" };
  }
}

/** Convierte un apartado en venta (cuando ya hay stock). Traslada el abono. */
export async function convertirAVenta(apartadoId: string): Promise<Resultado> {
  if (!(await puedeEscribir())) return { ok: false, error: "Sin permiso." };
  const supabase = await createClient();
  try {
    const { data: ap } = await supabase.from("apartados").select("*").eq("id", apartadoId).single();
    if (!ap) return { ok: false, error: "Apartado no encontrado." };
    if (ap.estado === "Entregado") return { ok: false, error: "Este apartado ya fue entregado." };
    if (!ap.prenda_id) return { ok: false, error: "El apartado no tiene prenda asociada." };

    const { data: prenda } = await supabase.from("prendas").select("stock, costo").eq("id", ap.prenda_id).single();
    if (!prenda) return { ok: false, error: "Prenda no encontrada." };
    if (prenda.stock < ap.cantidad) {
      return { ok: false, error: `Aún no hay stock suficiente (disponible ${prenda.stock}, apartado ${ap.cantidad}).` };
    }

    // Método del abono previo (si hubo)
    const { data: pagoPrev } = await supabase
      .from("pagos")
      .select("id, metodo")
      .eq("apartado_id", apartadoId)
      .eq("activo", true)
      .limit(1)
      .maybeSingle();

    const p_pedido = {
      tipo: "VENTA",
      cliente_id: ap.cliente_id,
      cliente_nombre: ap.cliente_nombre,
      observaciones: `Desde apartado ${ap.codigo ?? ""}`,
    };
    const p_items = [
      {
        prenda_id: ap.prenda_id,
        nombre: ap.prenda_nombre,
        talla: ap.talla,
        color: ap.color,
        cantidad: ap.cantidad,
        precio: ap.precio,
        descuento: 0,
        costo_unit: prenda.costo,
      },
    ];
    const p_pago =
      ap.abonado > 0
        ? { valor: ap.abonado, metodo: pagoPrev?.metodo || "Efectivo", tipo_pago: "ABONO" }
        : null;

    const { data: ventaId, error } = await supabase.rpc("crear_venta", { p_pedido, p_items, p_pago });
    if (error) throw new Error(error.message);

    // El abono ahora pertenece a la venta: anulamos el pago del apartado para no duplicar.
    if (pagoPrev?.id) await supabase.from("pagos").update({ activo: false }).eq("id", pagoPrev.id);

    await supabase
      .from("apartados")
      .update({ estado: "Entregado", disponible: false })
      .eq("id", apartadoId);

    revalidatePath("/apartados");
    revalidatePath("/ventas");
    revalidatePath("/inventario");
    revalidatePath("/", "layout");
    return { ok: true, ventaId: ventaId as string };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al convertir el apartado" };
  }
}

export async function cancelarApartado(id: string): Promise<Resultado> {
  if (!(await puedeEscribir())) return { ok: false, error: "Sin permiso." };
  const supabase = await createClient();
  const { error } = await supabase.from("apartados").update({ estado: "Cancelado", activo: false }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/apartados");
  revalidatePath("/", "layout");
  return { ok: true };
}
