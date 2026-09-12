import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSesion, rolDe } from "@/lib/auth";
import { getListas } from "@/lib/listas";
import { VentaDetalle } from "./VentaDetalle";

export const metadata = { title: "Venta" };

export default async function VentaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: venta } = await supabase.from("pedidos").select("*").eq("id", id).single();
  if (!venta) notFound();

  const [{ data: items }, { data: pagos }, estados, metodos, sesion, { data: marcaRow }] = await Promise.all([
    supabase.from("pedido_items").select("*").eq("pedido_id", id),
    supabase.from("pagos").select("*").eq("pedido_id", id).eq("activo", true).order("fecha"),
    getListas("ESTADO", "PEDIDO"),
    getListas("METODO_PAGO"),
    getSesion(),
    supabase.from("config").select("valor").eq("clave", "NOMBRE_MARCA").maybeSingle(),
  ]);

  let cliente: { nombre: string; whatsapp: string | null; email: string | null } | null = null;
  if (venta.cliente_id) {
    const { data } = await supabase.from("clientes").select("nombre, whatsapp, email").eq("id", venta.cliente_id).single();
    cliente = data;
  }

  const rol = rolDe(sesion);
  const puedeEscribir = rol === "ADMINISTRADOR" || rol === "VENDEDOR";

  return (
    <>
      <Link href="/ventas" className="mb-3 inline-flex items-center gap-1 text-sm" style={{ color: "var(--tenue)" }}>
        <ArrowLeft size={15} /> Ventas
      </Link>
      <VentaDetalle
        venta={venta}
        items={items ?? []}
        pagos={pagos ?? []}
        cliente={cliente}
        estados={estados.map((e) => ({ nombre: e.nombre, hex: e.hex }))}
        metodos={metodos.map((m) => m.nombre)}
        marca={marcaRow?.valor || "GUAYABO"}
        puedeEscribir={puedeEscribir}
        esAdmin={rol === "ADMINISTRADOR"}
      />
    </>
  );
}
