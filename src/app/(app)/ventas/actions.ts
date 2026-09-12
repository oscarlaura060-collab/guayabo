"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSesion, rolDe } from "@/lib/auth";

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
  descuento: z.coerce.number().min(0).default(0),
  envio: z.coerce.number().min(0).default(0),
  observaciones: z.string().trim().nullable().optional(),
  items: z.array(itemSchema).min(1, "Agrega al menos una prenda"),
  pago: z
    .object({
      valor: z.coerce.number().min(0),
      metodo: z.string().min(1),
    })
    .nullable()
    .optional(),
});

export type VentaInput = z.input<typeof ventaSchema>;

export interface ResultadoVenta {
  ok: boolean;
  numero?: string;
  error?: string;
}

export async function crearVenta(input: VentaInput): Promise<ResultadoVenta> {
  const sesion = await getSesion();
  const rol = rolDe(sesion);
  if (rol !== "ADMINISTRADOR" && rol !== "VENDEDOR") {
    return { ok: false, error: "No tienes permiso para registrar ventas." };
  }

  const parsed = ventaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const v = parsed.data;

  const subtotal = v.items.reduce((s, it) => s + it.precio * it.cantidad - (it.descuento ?? 0), 0);
  const total = subtotal - v.descuento + v.envio;

  const p_pedido = {
    tipo: "VENTA",
    cliente_id: v.cliente_id ?? null,
    cliente_nombre: v.cliente_nombre ?? null,
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
      ? {
          valor: v.pago.valor,
          metodo: v.pago.metodo,
          tipo_pago: v.pago.valor >= total ? "PAGO TOTAL" : "ABONO",
        }
      : null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("crear_venta", { p_pedido, p_items, p_pago });
  if (error) return { ok: false, error: error.message };

  // data es el uuid del pedido; recuperamos el número para el mensaje.
  const { data: pedido } = await supabase
    .from("pedidos")
    .select("numero")
    .eq("id", data as string)
    .single();

  revalidatePath("/ventas");
  revalidatePath("/prendas");
  return { ok: true, numero: pedido?.numero ?? undefined };
}
