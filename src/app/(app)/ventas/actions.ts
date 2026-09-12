"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSesion, rolDe } from "@/lib/auth";
import { mensajeEnvio, mensajeEnvioHtml } from "@/lib/envio";

async function puedeEscribir() {
  const rol = rolDe(await getSesion());
  return rol === "ADMINISTRADOR" || rol === "VENDEDOR";
}

const itemSchema = z.object({
  prenda_id: z.string().uuid().nullable().optional(),
  nombre: z.string().min(1),
  talla: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  cantidad: z.coerce.number().int().min(1),
  precio: z.coerce.number().min(0),
  descuento: z.coerce.number().min(0).default(0),
  costo_unit: z.coerce.number().min(0).default(0),
});

const ventaSchema = z.object({
  cliente_id: z.string().uuid().nullable().optional(),
  cliente_nombre: z.string().trim().nullable().optional(),
  fecha_entrega: z.string().nullable().optional(),
  descuento: z.coerce.number().min(0).default(0),
  envio: z.coerce.number().min(0).default(0),
  observaciones: z.string().trim().nullable().optional(),
  items: z.array(itemSchema).min(1, "Agrega al menos una prenda"),
  pago: z.object({ valor: z.coerce.number().min(0), metodo: z.string().min(1) }).nullable().optional(),
});

export type VentaInput = z.input<typeof ventaSchema>;

export interface ResultadoVenta {
  ok: boolean;
  numero?: string;
  id?: string;
  error?: string;
}
export interface Resultado {
  ok: boolean;
  error?: string;
}

/** Crea una venta (con fecha de entrega opcional) llamando a crear_venta. */
export async function crearVenta(input: VentaInput & { fecha_entrega?: string | null }): Promise<ResultadoVenta> {
  if (!(await puedeEscribir())) return { ok: false, error: "No tienes permiso para registrar ventas." };

  const parsed = ventaSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  const v = parsed.data;

  const subtotal = v.items.reduce((s, it) => s + it.precio * it.cantidad - (it.descuento ?? 0), 0);
  const total = subtotal - v.descuento + v.envio;

  const p_pedido = {
    tipo: "VENTA",
    cliente_id: v.cliente_id ?? null,
    cliente_nombre: v.cliente_nombre ?? null,
    fecha_entrega: v.fecha_entrega ?? null,
    descuento: v.descuento,
    envio: v.envio,
    observaciones: v.observaciones ?? null,
  };
  const p_items = v.items.map((it) => ({
    prenda_id: it.prenda_id ?? null,
    nombre: it.nombre,
    talla: it.talla ?? null,
    color: it.color ?? null,
    cantidad: it.cantidad,
    precio: it.precio,
    descuento: it.descuento ?? 0,
    costo_unit: it.costo_unit ?? 0,
  }));
  const p_pago =
    v.pago && v.pago.valor > 0
      ? { valor: v.pago.valor, metodo: v.pago.metodo, tipo_pago: v.pago.valor >= total ? "PAGO TOTAL" : "ABONO" }
      : null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("crear_venta", { p_pedido, p_items, p_pago });
  if (error) return { ok: false, error: error.message };

  const { data: pedido } = await supabase.from("pedidos").select("numero").eq("id", data as string).single();
  revalidatePath("/ventas");
  revalidatePath("/prendas");
  revalidatePath("/inventario");
  return { ok: true, numero: pedido?.numero ?? undefined, id: data as string };
}

/** Cambia el estado de la venta. Cancelar devuelve el stock. */
export async function cambiarEstado(ventaId: string, estado: string): Promise<Resultado> {
  if (!(await puedeEscribir())) return { ok: false, error: "Sin permiso." };
  const supabase = await createClient();

  if (estado === "Cancelado") {
    const { data: venta } = await supabase.from("pedidos").select("numero, estado").eq("id", ventaId).single();
    if (venta && venta.estado !== "Cancelado") {
      const { data: items } = await supabase
        .from("pedido_items")
        .select("prenda_id, nombre, cantidad")
        .eq("pedido_id", ventaId);
      for (const it of items ?? []) {
        if (!it.prenda_id) continue;
        const { data: pr } = await supabase.from("prendas").select("stock, vendidas").eq("id", it.prenda_id).single();
        if (pr) {
          const nuevo = pr.stock + it.cantidad;
          await supabase
            .from("prendas")
            .update({ stock: nuevo, vendidas: Math.max(0, pr.vendidas - it.cantidad) })
            .eq("id", it.prenda_id);
          await supabase.from("movimientos_inventario").insert({
            prenda_id: it.prenda_id,
            prenda_nombre: it.nombre,
            tipo: "ENTRADA",
            cantidad: it.cantidad,
            stock_anterior: pr.stock,
            stock_nuevo: nuevo,
            referencia: `Cancelación ${venta.numero ?? ""}`,
          });
        }
      }
    }
  }

  const { error } = await supabase.from("pedidos").update({ estado }).eq("id", ventaId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/ventas");
  revalidatePath(`/ventas/${ventaId}`);
  return { ok: true };
}

/** Actualiza la fecha de entrega estimada. */
export async function actualizarEntrega(ventaId: string, fecha_entrega: string | null): Promise<Resultado> {
  if (!(await puedeEscribir())) return { ok: false, error: "Sin permiso." };
  const supabase = await createClient();
  const { error } = await supabase.from("pedidos").update({ fecha_entrega: fecha_entrega || null }).eq("id", ventaId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/ventas/${ventaId}`);
  return { ok: true };
}

const envioSchema = z.object({
  transportadora: z.string().trim().min(1, "Indica la transportadora"),
  guia: z.string().trim().min(1, "Indica el número de guía"),
  url_rastreo: z.union([z.string().trim().url(), z.literal("")]).optional(),
});

/** Marca la venta como Enviada y guarda transportadora/guía. */
export async function marcarEnviado(
  ventaId: string,
  datos: { transportadora: string; guia: string; url_rastreo?: string },
): Promise<Resultado> {
  if (!(await puedeEscribir())) return { ok: false, error: "Sin permiso." };
  const parsed = envioSchema.safeParse(datos);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("pedidos")
    .update({
      estado: "Enviado",
      transportadora: parsed.data.transportadora,
      guia: parsed.data.guia,
      url_rastreo: parsed.data.url_rastreo || null,
      fecha_envio: new Date().toISOString(),
    })
    .eq("id", ventaId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/ventas");
  revalidatePath(`/ventas/${ventaId}`);
  return { ok: true };
}

export async function marcarNotificado(ventaId: string): Promise<Resultado> {
  if (!(await puedeEscribir())) return { ok: false, error: "Sin permiso." };
  const supabase = await createClient();
  const { error } = await supabase.from("pedidos").update({ notificado_envio: true }).eq("id", ventaId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/ventas/${ventaId}`);
  return { ok: true };
}

/** Aviso de envío por correo (Resend). Requiere RESEND_API_KEY. */
export async function notificarEnvioEmail(ventaId: string): Promise<Resultado> {
  if (!(await puedeEscribir())) return { ok: false, error: "Sin permiso." };
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: "Falta configurar RESEND_API_KEY para enviar correos." };

  const supabase = await createClient();
  const { data: venta } = await supabase
    .from("pedidos")
    .select("numero, cliente_id, cliente_nombre, transportadora, guia, url_rastreo")
    .eq("id", ventaId)
    .single();
  if (!venta) return { ok: false, error: "Venta no encontrada." };

  const { data: items } = await supabase.from("pedido_items").select("nombre").eq("pedido_id", ventaId);

  let email: string | null = null;
  if (venta.cliente_id) {
    const { data: cliente } = await supabase.from("clientes").select("email").eq("id", venta.cliente_id).single();
    email = cliente?.email ?? null;
  }
  if (!email) return { ok: false, error: "El cliente no tiene correo registrado." };

  const { data: marcaRow } = await supabase.from("config").select("valor").eq("clave", "NOMBRE_MARCA").maybeSingle();
  const marca = marcaRow?.valor || "GUAYABO";
  const datos = {
    clienteNombre: venta.cliente_nombre,
    numero: venta.numero,
    prendas: (items ?? []).map((i) => i.nombre).filter(Boolean) as string[],
    transportadora: venta.transportadora,
    guia: venta.guia,
    urlRastreo: venta.url_rastreo,
    marca,
  };

  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || `${marca} <onboarding@resend.dev>`,
        to: [email],
        subject: `Tu pedido ${venta.numero ?? ""} ya va en camino 🌴`,
        html: mensajeEnvioHtml(datos),
        text: mensajeEnvio(datos),
      }),
    });
    if (!resp.ok) {
      const detalle = await resp.text();
      return { ok: false, error: `Resend respondió ${resp.status}: ${detalle.slice(0, 140)}` };
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "No se pudo enviar el correo." };
  }

  await supabase.from("pedidos").update({ notificado_envio: true }).eq("id", ventaId);
  revalidatePath(`/ventas/${ventaId}`);
  return { ok: true };
}

/** Elimina una venta: devuelve el stock y borra la venta con sus líneas y pagos. Solo ADMINISTRADOR. */
export async function eliminarVenta(ventaId: string): Promise<Resultado> {
  if (rolDe(await getSesion()) !== "ADMINISTRADOR") {
    return { ok: false, error: "Solo un administrador puede eliminar ventas." };
  }
  const supabase = await createClient();

  const { data: venta } = await supabase.from("pedidos").select("numero, estado").eq("id", ventaId).single();
  if (!venta) return { ok: false, error: "Venta no encontrada." };

  // Devolver stock de las prendas (si no estaba cancelada, que ya lo devolvió).
  if (venta.estado !== "Cancelado") {
    const { data: items } = await supabase
      .from("pedido_items")
      .select("prenda_id, nombre, cantidad")
      .eq("pedido_id", ventaId);
    for (const it of items ?? []) {
      if (!it.prenda_id) continue;
      const { data: pr } = await supabase.from("prendas").select("stock, vendidas").eq("id", it.prenda_id).single();
      if (pr) {
        const nuevo = pr.stock + it.cantidad;
        await supabase
          .from("prendas")
          .update({ stock: nuevo, vendidas: Math.max(0, pr.vendidas - it.cantidad) })
          .eq("id", it.prenda_id);
        await supabase.from("movimientos_inventario").insert({
          prenda_id: it.prenda_id,
          prenda_nombre: it.nombre,
          tipo: "ENTRADA",
          cantidad: it.cantidad,
          stock_anterior: pr.stock,
          stock_nuevo: nuevo,
          referencia: `Eliminación ${venta.numero ?? ""}`,
        });
      }
    }
  }

  // Borra la venta; las líneas y pagos se eliminan en cascada (FK on delete cascade).
  const { error } = await supabase.from("pedidos").delete().eq("id", ventaId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/ventas");
  revalidatePath("/prendas");
  revalidatePath("/inventario");
  revalidatePath("/pagos");
  return { ok: true };
}

/** Registra un pago contra la venta. El trigger recalcula pagado/saldo. */
export async function registrarPago(
  ventaId: string,
  datos: { valor: number; metodo: string; observaciones?: string },
): Promise<Resultado> {
  if (!(await puedeEscribir())) return { ok: false, error: "Sin permiso." };
  const valor = Number(datos.valor);
  if (!(valor > 0)) return { ok: false, error: "El valor debe ser mayor a cero." };
  if (!datos.metodo) return { ok: false, error: "Elige un método de pago." };

  const supabase = await createClient();
  const { data: venta } = await supabase
    .from("pedidos")
    .select("cliente_id, cliente_nombre, saldo")
    .eq("id", ventaId)
    .single();

  const { data: codigo, error: errCodigo } = await supabase.rpc("siguiente_consecutivo", { p_entidad: "PAGO" });
  if (errCodigo) return { ok: false, error: errCodigo.message };

  const { error } = await supabase.from("pagos").insert({
    codigo,
    pedido_id: ventaId,
    cliente_id: venta?.cliente_id ?? null,
    cliente_nombre: venta?.cliente_nombre ?? null,
    fecha: new Date().toISOString().slice(0, 10),
    valor,
    metodo: datos.metodo,
    tipo_pago: venta && valor >= Number(venta.saldo) ? "PAGO TOTAL" : "ABONO",
    observaciones: datos.observaciones || null,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/ventas");
  revalidatePath(`/ventas/${ventaId}`);
  revalidatePath("/pagos");
  return { ok: true };
}
