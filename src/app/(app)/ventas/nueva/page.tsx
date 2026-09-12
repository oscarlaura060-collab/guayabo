import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { getSesion, rolDe } from "@/lib/auth";
import { getListas } from "@/lib/listas";
import { getConfig } from "@/lib/config";
import { NuevaVentaFlujo } from "./NuevaVentaFlujo";

export const metadata = { title: "Nueva venta" };

export default async function NuevaVentaPage() {
  const sesion = await getSesion();
  const rol = rolDe(sesion);
  if (rol !== "ADMINISTRADOR" && rol !== "VENDEDOR") redirect("/ventas");

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

  return (
    <>
      <Link href="/ventas" className="mb-3 inline-flex items-center gap-1 text-sm" style={{ color: "var(--tenue)" }}>
        <ArrowLeft size={15} /> Ventas
      </Link>
      <PageHeader titulo="Nueva venta" descripcion="Elige el cliente, agrega prendas y cobra." />
      <NuevaVentaFlujo
        clientes={clientes ?? []}
        prendas={prendas ?? []}
        metodos={(metodosLista ?? []).map((m) => m.nombre)}
        ventaBajoPedido={config.VENTA_BAJO_PEDIDO === "TRUE"}
        permitirStockNegativo={config.PERMITIR_STOCK_NEGATIVO === "TRUE"}
      />
    </>
  );
}
