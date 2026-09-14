"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { puedeEscribirServer, esStaffActivo } from "@/lib/auth";
import type { Tables } from "@/types/database.types";

const NO_AUTORIZADO = { ok: false as const, error: "No autorizado." };

const clienteSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  documento: z.string().trim().optional().nullable(),
  telefono: z.string().trim().optional().nullable(),
  whatsapp: z.string().trim().optional().nullable(),
  email: z.union([z.string().trim().email("Correo inválido"), z.literal("")]).optional(),
  direccion: z.string().trim().optional().nullable(),
  ciudad: z.string().trim().optional().nullable(),
  observaciones: z.string().trim().optional().nullable(),
});

export interface ResultadoAccion {
  ok: boolean;
  error?: string;
}

function leer(formData: FormData) {
  return clienteSchema.safeParse({
    nombre: formData.get("nombre"),
    documento: formData.get("documento"),
    telefono: formData.get("telefono"),
    whatsapp: formData.get("whatsapp"),
    email: formData.get("email"),
    direccion: formData.get("direccion"),
    ciudad: formData.get("ciudad"),
    observaciones: formData.get("observaciones"),
  });
}

function valores(v: z.infer<typeof clienteSchema>) {
  return {
    nombre: v.nombre,
    documento: v.documento || null,
    telefono: v.telefono || null,
    whatsapp: v.whatsapp || null,
    email: v.email || null,
    direccion: v.direccion || null,
    ciudad: v.ciudad || null,
    observaciones: v.observaciones || null,
  };
}

export async function crearCliente(formData: FormData): Promise<ResultadoAccion> {
  if (!(await puedeEscribirServer())) return NO_AUTORIZADO;
  const parsed = leer(formData);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  const supabase = await createClient();
  try {
    const { data: codigo, error: errCodigo } = await supabase.rpc("siguiente_consecutivo", {
      p_entidad: "CLIENTE",
    });
    if (errCodigo) throw new Error(errCodigo.message);

    const { error } = await supabase.from("clientes").insert({ codigo, ...valores(parsed.data) });
    if (error) throw new Error(error.message);

    revalidatePath("/clientes");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al crear el cliente" };
  }
}

export async function actualizarCliente(id: string, formData: FormData): Promise<ResultadoAccion> {
  if (!(await puedeEscribirServer())) return NO_AUTORIZADO;
  const parsed = leer(formData);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  const supabase = await createClient();
  const { error } = await supabase.from("clientes").update(valores(parsed.data)).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/clientes");
  return { ok: true };
}

/** Nada se borra si tiene historial: se marca activo = false. */
export async function desactivarCliente(id: string): Promise<ResultadoAccion> {
  if (!(await puedeEscribirServer())) return NO_AUTORIZADO;
  const supabase = await createClient();
  const { error } = await supabase.from("clientes").update({ activo: false }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/clientes");
  return { ok: true };
}

export interface ResumenCliente {
  pedidos: Pick<
    Tables<"pedidos">,
    "id" | "numero" | "fecha" | "tipo" | "estado" | "total" | "saldo" | "est_pago"
  >[];
  totalComprado: number;
  saldoPendiente: number;
}

/** Ficha: pedidos del cliente y totales. */
export async function resumenCliente(id: string): Promise<ResumenCliente> {
  // Datos de ventas: solo staff activo (nunca la vitrina pública).
  if (!(await esStaffActivo())) return { pedidos: [], totalComprado: 0, saldoPendiente: 0 };
  const supabase = await createClient();
  const { data } = await supabase
    .from("pedidos")
    .select("id, numero, fecha, tipo, estado, total, saldo, est_pago")
    .eq("cliente_id", id)
    .eq("activo", true)
    .order("fecha", { ascending: false });

  const pedidos = data ?? [];
  const totalComprado = pedidos
    .filter((p) => p.estado !== "Cancelado")
    .reduce((s, p) => s + Number(p.total ?? 0), 0);
  const saldoPendiente = pedidos.reduce((s, p) => s + Number(p.saldo ?? 0), 0);
  return { pedidos, totalComprado, saldoPendiente };
}
