"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const itemSchema = z.object({
  prendaId: z.string(),
  nombre: z.string(),
  talla: z.string().nullable(),
  color: z.string().nullable(),
  precio: z.number(),
  cantidad: z.number().int().min(1),
});

const solicitudSchema = z.object({
  cliente_nombre: z.string().trim().min(1, "Escribe tu nombre"),
  cedula: z.string().trim().optional().default(""),
  telefono: z.string().trim().min(5, "Escribe tu teléfono"),
  email: z.string().trim().optional().default(""),
  ciudad: z.string().trim().optional().default(""),
  direccion: z.string().trim().optional().default(""),
  items: z.array(itemSchema).min(1, "Tu carrito está vacío"),
  envio: z.number().default(0),
  total: z.number(),
});

export interface ResultadoSolicitud {
  ok: boolean;
  error?: string;
  codigo?: string;
}

/**
 * Registra un pedido hecho desde la vitrina (carrito) para que el equipo lo
 * vea en el panel. NO descuenta inventario: es una solicitud a confirmar.
 */
export async function crearSolicitud(input: unknown): Promise<ResultadoSolicitud> {
  const parsed = solicitudSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  const v = parsed.data;

  const supabase = await createClient();

  const codigo = "WEB-" + Date.now().toString().slice(-6);
  const { error } = await supabase.from("solicitudes_web").insert({
    codigo,
    cliente_nombre: v.cliente_nombre,
    cedula: v.cedula || null,
    telefono: v.telefono,
    email: v.email || null,
    ciudad: v.ciudad || null,
    direccion: v.direccion || null,
    items: v.items,
    envio: v.envio,
    total: v.total,
    estado: "Nueva",
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/pedidos-web");
  return { ok: true, codigo };
}
