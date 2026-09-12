"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSesion, rolDe } from "@/lib/auth";
import { mensajeEnvio, mensajeEnvioHtml } from "@/lib/envio";
import type { VentaInput, ResultadoVenta } from "../ventas/actions";

async function exigirEscritura() {
  const rol = rolDe(await getSesion());
  return rol === "ADMINISTRADOR" || rol === "VENDEDOR";
}

/** Crea un PEDIDO (entrega futura) reusando la función crear_venta. */
export async function crearPedido(
  input: VentaInput & { fecha_entrega?: string | null },
): Promise<ResultadoVenta> {
  if (!(await exigirEscritura())) return { ok: false, error: "Sin permiso para crear pedidos." };

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
  const schema = z.object({
    cliente_id: z.string().uuid().nullable().optional(),
    cliente_nombre: z.string().trim().nullable().optional(),
    fecha_entrega: z.string().nullable().optional(),
    descuento: z.coerce.number().min(0).default(0),
    envio: z.coerce.number().min(0).default(0),
    observaciones: z.string().trim().nullable().optional(),
    items: z.array(itemSchema).min(1, "Agrega al menos una prenda"),
    pago: z.object({ valor: z.coerce.number().min(0), metodo: z.string().min(1) }).nullable().optional(),
  });

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  const v = parsed.data;

  const subtotal = v.items.reduce((s, it) => s + it.precio * it.cantidad - (it.descuento ?? 0), 0);
  const total = subtotal - v.descuento + v.envio;

  const p_pedido = {
    tipo: "PEDIDO",
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
  revalidatePath("/pedidos");
  revalidatePath("/prendas");
  return { ok: true, numero: pedido?.numero ?? undefined };
}

export interface Resultado {
  ok: boolean;
  error?: string;
}

/** Cambia el estado del pedido. Cancelar devuelve el stock. */
export async function cambiarEstado(pedidoId: string, estado: string): Promise<Resultado> {
  if (!(await exigirEscritura())) return { ok: false, error: "Sin permiso." };
  const supabase = await createClient();

  if (estado === "Cancelado") {
    const { data: pedido } = await supabase
      .from("pedidos")
      .select("numero, estado")
      .eq("id", pedidoId)
      .single();
    if (pedido && pedido.estado !== "Cancelado") {
      const { data: items } = await supabase
        .from("pedido_items")
        .select("prenda_id, nombre, cantidad")
        .eq("pedido_id", pedidoId);
      for (const it of items ?? []) {
        if (!it.prenda_id) continue;
        const { data: pr } = await supabase
          .from("prendas")
          .select("stock, vendidas")
          .eq("id", it.prenda_id)
          .single();
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
            referencia: `Cancelación ${pedido.numero ?? ""}`,
          });
        }
      }
    }
  }

  const { error } = await supabase.from("pedidos").update({ estado }).eq("id", pedidoId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/pedidos");
  revalidatePath(`/pedidos/${pedidoId}`);
  return { ok: true };
}

const envioSchema = z.object({
  transportadora: z.string().trim().min(1, "Indica la transportadora"),
  guia: z.string().trim().min(1, "Indica el número de guía"),
  url_rastreo: z.union([z.string().trim().url(), z.literal("")]).optional(),
});

/** Marca el pedido como Enviado y guarda transportadora/guía. */
export async function marcarEnviado(
  pedidoId: string,
  datos: { transportadora: string; guia: string; url_rastreo?: string },
): Promise<Resultado> {
  if (!(await exigirEscritura())) return { ok: false, error: "Sin permiso." };
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
    .eq("id", pedidoId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/pedidos");
  revalidatePath(`/pedidos/${pedidoId}`);
  return { ok: true };
}

/** Marca que ya se avisó al cliente (p. ej. tras enviar el WhatsApp de un toque). */
export async function marcarNotificado(pedidoId: string): Promise<Resultado> {
  if (!(await exigirEscritura())) return { ok: false, error: "Sin permiso." };
  const supabase = await createClient();
  const { error } = await supabase.from("pedidos").update({ notificado_envio: true }).eq("id", pedidoId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/pedidos/${pedidoId}`);
  return { ok: true };
}

/**
 * Envía el aviso de envío por correo usando Resend.
 * Requiere la variable de entorno RESEND_API_KEY (y opcionalmente RESEND_FROM).
 */
export async function notificarEnvioEmail(pedidoId: string): Promise<Resultado> {
  if (!(await exigirEscritura())) return { ok: false, error: "Sin permiso." };
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "Falta configurar RESEND_API_KEY para enviar correos." };
  }

  const supabase = await createClient();
  const { data: pedido } = await supabase
    .from("pedidos")
    .select("numero, cliente_id, cliente_nombre, transportadora, guia, url_rastreo")
    .eq("id", pedidoId)
    .single();
  if (!pedido) return { ok: false, error: "Pedido no encontrado." };

  const { data: items } = await supabase
    .from("pedido_items")
    .select("nombre")
    .eq("pedido_id", pedidoId);

  let email: string | null = null;
  if (pedido.cliente_id) {
    const { data: cliente } = await supabase
      .from("clientes")
      .select("email")
      .eq("id", pedido.cliente_id)
      .single();
    email = cliente?.email ?? null;
  }
  if (!email) return { ok: false, error: "El cliente no tiene correo registrado." };

  const { data: marcaRow } = await supabase.from("config").select("valor").eq("clave", "NOMBRE_MARCA").maybeSingle();
  const marca = marcaRow?.valor || "GUAYABO";

  const datos = {
    clienteNombre: pedido.cliente_nombre,
    numero: pedido.numero,
    prendas: (items ?? []).map((i) => i.nombre).filter(Boolean) as string[],
    transportadora: pedido.transportadora,
    guia: pedido.guia,
    urlRastreo: pedido.url_rastreo,
    marca,
  };

  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || `${marca} <onboarding@resend.dev>`,
        to: [email],
        subject: `Tu pedido ${pedido.numero ?? ""} ya va en camino 🌴`,
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

  await supabase.from("pedidos").update({ notificado_envio: true }).eq("id", pedidoId);
  revalidatePath(`/pedidos/${pedidoId}`);
  return { ok: true };
}
