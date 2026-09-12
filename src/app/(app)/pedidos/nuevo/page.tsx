import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { getSesion, rolDe } from "@/lib/auth";
import { getListas } from "@/lib/listas";
import { getConfig } from "@/lib/config";
import { NuevaVentaFlujo } from "../../ventas/nueva/NuevaVentaFlujo";
import { crearPedido } from "../actions";

export const metadata = { title: "Nuevo pedido" };

export default async function NuevoPedidoPage() {
  const sesion = await getSesion();
  const rol = rolDe(sesion);
  if (rol !== "ADMINISTRADOR" && rol !== "VENDEDOR") redirect("/pedidos");

  const supabase = await createClient();
  const [{ data: clientes }, { data: prendas }, metodosLista, config] = await Promise.all([
    supabase.from("clientes").select("id, nombre, codigo").eq("activo", true).order("nombre"),
    supabase
      .from("prendas")
      .select("id, nombre, codigo, talla, color, precio, costo, stock")
      .eq("activo", true)
      .order("nombre"),
    getListas("METODO_PAGO"),
    getConfig().catch(() => ({}) as Record<string, string>),
  ]);

  const dias = Number(config.TIEMPO_ENTREGA) || 15;

  return (
    <>
      <Link href="/pedidos" className="mb-3 inline-flex items-center gap-1 text-sm" style={{ color: "var(--tenue)" }}>
        <ArrowLeft size={15} /> Pedidos
      </Link>
      <PageHeader titulo="Nuevo pedido" descripcion="Pedido con fecha de entrega estimada." />
      <NuevaVentaFlujo
        clientes={clientes ?? []}
        prendas={prendas ?? []}
        metodos={(metodosLista ?? []).map((m) => m.nombre)}
        ventaBajoPedido={config.VENTA_BAJO_PEDIDO === "TRUE"}
        permitirStockNegativo={config.PERMITIR_STOCK_NEGATIVO === "TRUE"}
        modo="PEDIDO"
        diasEntrega={dias}
        registrar={crearPedido}
        volverA="/pedidos"
      />
    </>
  );
}
