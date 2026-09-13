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
}

async function subirComprobanteArchivos(
  supabase: Awaited<ReturnType<typeof createClient>>,
  archivos: FormDataEntryValue[],
): Promise<string[]> {
  const paths: string[] = [];
  for (const archivo of archivos) {
    if (!(archivo instanceof File) || archivo.size === 0) continue;
    const ext = (archivo.name.split(".").pop() || "jpg").toLowerCase();
    const path = `pagos/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("comprobantes")
      .upload(path, archivo, { contentType: archivo.type || "image/jpeg", upsert: false });
    if (error) throw new Error(`No se pudo subir el comprobante: ${error.message}`);
    paths.push(path);
  }
  return paths;
}

const pagoSchema = z.object({
  // "PEDIDO:uuid" o "APARTADO:uuid": a qué compra se le abona.
  destino: z.string().regex(/^(PEDIDO|APARTADO):[0-9a-fA-F-]{36}$/, "Elige a qué compra se le abona"),
  valor: z.coerce.number().positive("El valor debe ser mayor a cero"),
  metodo: z.string().min(1, "Elige un método de pago"),
  fecha: z.string().optional().nullable(),
  observaciones: z.string().trim().optional().nullable(),
});

/**
 * Registra un pago contra un pedido o un apartado. Para pedidos el trigger
 * recalcula pagado/saldo; para apartados se actualiza abonado/saldo aquí mismo.
 */
export async function registrarPago(formData: FormData): Promise<Resultado> {
  if (!(await puedeEscribir())) return { ok: false, error: "Sin permiso." };

  const parsed = pagoSchema.safeParse({
    destino: formData.get("destino"),
    valor: formData.get("valor"),
    metodo: formData.get("metodo"),
    fecha: formData.get("fecha"),
    observaciones: formData.get("observaciones"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  const v = parsed.data;
  const [tipoDestino, destinoId] = v.destino.split(":") as ["PEDIDO" | "APARTADO", string];

  const supabase = await createClient();
  try {
    const { data: codigo, error: errCodigo } = await supabase.rpc("siguiente_consecutivo", {
      p_entidad: "PAGO",
    });
    if (errCodigo) throw new Error(errCodigo.message);

    const comprobantes = await subirComprobanteArchivos(supabase, formData.getAll("comprobante"));
    const fecha = v.fecha || new Date().toISOString().slice(0, 10);

    if (tipoDestino === "APARTADO") {
      const { data: apartado } = await supabase
        .from("apartados")
        .select("cliente_id, cliente_nombre, total, abonado")
        .eq("id", destinoId)
        .single();

      const { error } = await supabase.from("pagos").insert({
        codigo,
        apartado_id: destinoId,
        cliente_id: apartado?.cliente_id ?? null,
        cliente_nombre: apartado?.cliente_nombre ?? null,
        fecha,
        valor: v.valor,
        metodo: v.metodo,
        tipo_pago: "ABONO",
        comprobantes,
        observaciones: v.observaciones || null,
      });
      if (error) throw new Error(error.message);

      // Los apartados no tienen trigger: recalculamos abonado/saldo aquí.
      if (apartado) {
        const abonado = Number(apartado.abonado ?? 0) + v.valor;
        const saldo = Math.max(Number(apartado.total ?? 0) - abonado, 0);
        await supabase.from("apartados").update({ abonado, saldo }).eq("id", destinoId);
      }

      revalidatePath("/pagos");
      revalidatePath("/apartados");
      return { ok: true };
    }

    // Datos del pedido para denormalizar cliente y avisar de sobrepago.
    const { data: pedido } = await supabase
      .from("pedidos")
      .select("cliente_id, cliente_nombre")
      .eq("id", destinoId)
      .single();

    const { error } = await supabase.from("pagos").insert({
      codigo,
      pedido_id: destinoId,
      cliente_id: pedido?.cliente_id ?? null,
      cliente_nombre: pedido?.cliente_nombre ?? null,
      fecha,
      valor: v.valor,
      metodo: v.metodo,
      tipo_pago: "ABONO",
      comprobantes,
      observaciones: v.observaciones || null,
    });
    if (error) throw new Error(error.message);

    revalidatePath("/pagos");
    revalidatePath("/ventas");
    revalidatePath("/pedidos");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al registrar el pago" };
  }
}

/** Agrega uno o varios comprobantes a un pago existente. */
export async function subirComprobante(pagoId: string, formData: FormData): Promise<Resultado> {
  if (!(await puedeEscribir())) return { ok: false, error: "Sin permiso." };
  const supabase = await createClient();
  try {
    const nuevos = await subirComprobanteArchivos(supabase, formData.getAll("comprobante"));
    if (nuevos.length === 0) return { ok: false, error: "Elige al menos un archivo." };
    const { data: pago } = await supabase.from("pagos").select("comprobantes").eq("id", pagoId).single();
    const comprobantes = [...(pago?.comprobantes ?? []), ...nuevos];
    const { error } = await supabase.from("pagos").update({ comprobantes }).eq("id", pagoId);
    if (error) throw new Error(error.message);
    revalidatePath("/pagos");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al subir el comprobante" };
  }
}

/** Elimina un comprobante de un pago (lo quita de la lista y del almacenamiento). */
export async function eliminarComprobante(pagoId: string, path: string): Promise<Resultado> {
  if (!(await puedeEscribir())) return { ok: false, error: "Sin permiso." };
  const supabase = await createClient();
  const { data: pago } = await supabase.from("pagos").select("comprobantes").eq("id", pagoId).single();
  const comprobantes = (pago?.comprobantes ?? []).filter((p) => p !== path);
  const { error } = await supabase.from("pagos").update({ comprobantes }).eq("id", pagoId);
  if (error) return { ok: false, error: error.message };
  await supabase.storage.from("comprobantes").remove([path]);
  revalidatePath("/pagos");
  return { ok: true };
}

/** Anula un pago (activo = false). El trigger recalcula el pedido. */
export async function anularPago(pagoId: string): Promise<Resultado> {
  if (!(await puedeEscribir())) return { ok: false, error: "Sin permiso." };
  const supabase = await createClient();
  const { error } = await supabase.from("pagos").update({ activo: false }).eq("id", pagoId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/pagos");
  revalidatePath("/ventas");
  revalidatePath("/pedidos");
  return { ok: true };
}
