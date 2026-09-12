import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSesion, rolDe } from "@/lib/auth";
import { getListas } from "@/lib/listas";
import { PedidoDetalle } from "./PedidoDetalle";

export const metadata = { title: "Pedido" };

export default async function PedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: pedido } = await supabase.from("pedidos").select("*").eq("id", id).single();
  if (!pedido) notFound();

  const [{ data: items }, { data: pagos }, estados, sesion, { data: marcaRow }] = await Promise.all([
    supabase.from("pedido_items").select("*").eq("pedido_id", id),
    supabase.from("pagos").select("*").eq("pedido_id", id).eq("activo", true).order("fecha"),
    getListas("ESTADO", "PEDIDO"),
    getSesion(),
    supabase.from("config").select("valor").eq("clave", "NOMBRE_MARCA").maybeSingle(),
  ]);

  let cliente: { nombre: string; whatsapp: string | null; email: string | null } | null = null;
  if (pedido.cliente_id) {
    const { data } = await supabase
      .from("clientes")
      .select("nombre, whatsapp, email")
      .eq("id", pedido.cliente_id)
      .single();
    cliente = data;
  }

  const rol = rolDe(sesion);
  const puedeEscribir = rol === "ADMINISTRADOR" || rol === "VENDEDOR";

  return (
    <>
      <Link href="/pedidos" className="mb-3 inline-flex items-center gap-1 text-sm" style={{ color: "var(--tenue)" }}>
        <ArrowLeft size={15} /> Pedidos
      </Link>
      <PedidoDetalle
        pedido={pedido}
        items={items ?? []}
        pagos={pagos ?? []}
        cliente={cliente}
        estados={estados.map((e) => ({ nombre: e.nombre, hex: e.hex }))}
        marca={marcaRow?.valor || "GUAYABO"}
        puedeEscribir={puedeEscribir}
      />
    </>
  );
}
