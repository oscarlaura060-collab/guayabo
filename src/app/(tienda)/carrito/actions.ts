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
  // El cliente puede enviar envio/total, pero el servidor los recalcula.
  envio: z.number().optional(),
  total: z.number().optional(),
});

export interface ResultadoSolicitud {
  ok: boolean;
  error?: string;
  codigo?: string;
  envio?: number;
  total?: number;
}

/** Compara ciudades ignorando tildes y mayúsculas. */
function norm(s: string): string {
  return s.trim().toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

type Supa = Awaited<ReturnType<typeof createClient>>;

/**
 * Tarifa de envío REAL, calculada en el servidor a partir de la tabla `envios`
 * (solo ciudades activas) o del ENVIO_DEFECTO. Nunca se confía en el precio que
 * llega del navegador. Devuelve 0 cuando la ciudad no tiene tarifa (por confirmar).
 */
async function calcularEnvio(supabase: Supa, ciudad: string): Promise<number> {
  const nombre = (ciudad ?? "").trim();
  if (!nombre) return 0;
  const { data } = await supabase.from("envios").select("ciudad, precio").eq("activo", true);
  const match = (data ?? []).find((e) => norm(e.ciudad) === norm(nombre));
  if (match) return Math.max(0, Math.round(Number(match.precio) || 0));
  const { data: cfg } = await supabase.from("config").select("valor").eq("clave", "ENVIO_DEFECTO").maybeSingle();
  return Math.max(0, Math.round(Number(cfg?.valor ?? 0) || 0));
}

/**
 * Registra un pedido hecho desde la vitrina (carrito) para que el equipo lo
 * vea en el panel. NO descuenta inventario: es una solicitud a confirmar.
 *
 * SEGURIDAD: el envío y el total se calculan en el servidor (tarifa real por
 * ciudad + precios reales del catálogo), ignorando cualquier valor manipulado
 * desde el navegador. Guarda una "fotografía" del envío aplicado en el momento.
 */
export async function crearSolicitud(input: unknown): Promise<ResultadoSolicitud> {
  const parsed = solicitudSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  const v = parsed.data;

  const supabase = await createClient();

  try {
    // Precios reales del catálogo público (no confiar en el navegador).
    const ids = [...new Set(v.items.map((i) => i.prendaId).filter(Boolean))];
    const precioReal = new Map<string, number>();
    if (ids.length) {
      const { data: filas } = await supabase.from("catalogo_publico").select("id, precio").in("id", ids);
      for (const f of filas ?? []) if (f.id) precioReal.set(f.id, Math.max(0, Number(f.precio) || 0));
    }

    let subtotal = 0;
    const itemsSeguros = v.items.map((it) => {
      const precio = precioReal.get(it.prendaId) ?? Math.max(0, it.precio);
      subtotal += precio * it.cantidad;
      return { ...it, precio };
    });

    const envio = await calcularEnvio(supabase, v.ciudad);
    const total = subtotal + envio;

    const codigo = "WEB-" + Date.now().toString().slice(-6);
    const { error } = await supabase.from("solicitudes_web").insert({
      codigo,
      cliente_nombre: v.cliente_nombre,
      cedula: v.cedula || null,
      telefono: v.telefono,
      email: v.email || null,
      ciudad: v.ciudad || null,
      direccion: v.direccion || null,
      items: itemsSeguros,
      envio,
      total,
      estado: "Nueva",
    });
    if (error) {
      console.error("crearSolicitud insert:", error.message);
      return { ok: false, error: "No pudimos registrar tu pedido. Inténtalo de nuevo." };
    }

    revalidatePath("/pedidos-web");
    return { ok: true, codigo, envio, total };
  } catch (e) {
    console.error("crearSolicitud:", e);
    return { ok: false, error: "No pudimos registrar tu pedido. Inténtalo de nuevo." };
  }
}
