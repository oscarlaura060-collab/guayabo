"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSesion, rolDe } from "@/lib/auth";

export interface Resultado {
  ok: boolean;
  error?: string;
}

async function puedeEscribir() {
  const rol = rolDe(await getSesion());
  return rol === "ADMINISTRADOR" || rol === "VENDEDOR";
}

export const ESTADOS_SOLICITUD = [
  "Nueva",
  "Contactada",
  "Pagada",
  "Confirmada",
  "Entregada",
  "Cancelada",
] as const;

export async function actualizarEstadoSolicitud(id: string, estado: string): Promise<Resultado> {
  if (!(await puedeEscribir())) return { ok: false, error: "Sin permiso." };
  if (!ESTADOS_SOLICITUD.includes(estado as (typeof ESTADOS_SOLICITUD)[number])) {
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
