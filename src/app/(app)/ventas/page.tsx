import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { getSesion, rolDe } from "@/lib/auth";
import { getColoresEstado } from "@/lib/listas";
import { VentasTabla } from "./VentasTabla";

export const metadata = { title: "Ventas" };

export default async function VentasPage() {
  const supabase = await createClient();
  const [{ data: ventas }, coloresEstado, sesion] = await Promise.all([
    supabase
      .from("pedidos")
      .select("id, numero, fecha, fecha_entrega, cliente_nombre, total, saldo, est_pago, estado, canal, canal_usuario")
      .eq("activo", true)
      .order("fecha", { ascending: false })
      .limit(200),
    getColoresEstado("PEDIDO"),
    getSesion(),
  ]);

  // Prendas de cada venta, para mostrarlas en la lista sin entrar al detalle.
  const ventasList = ventas ?? [];
  const ids = ventasList.map((v) => v.id);
  type Linea = { nombre: string | null; talla: string | null; color: string | null; cantidad: number; precio: number; total: number };
  const itemsPorVenta = new Map<string, Linea[]>();
  if (ids.length) {
    const { data: its } = await supabase
      .from("pedido_items")
      .select("pedido_id, nombre, talla, color, cantidad, precio, total")
      .in("pedido_id", ids);
    for (const it of its ?? []) {
      const arr = itemsPorVenta.get(it.pedido_id) ?? [];
      arr.push({ nombre: it.nombre, talla: it.talla, color: it.color, cantidad: it.cantidad, precio: Number(it.precio), total: Number(it.total) });
      itemsPorVenta.set(it.pedido_id, arr);
    }
  }
  function resumenPrendas(arr: Linea[]): string {
    const partes = arr.map((i) => (i.cantidad > 1 ? `${i.cantidad}× ` : "") + (i.nombre ?? "—"));
    if (partes.length <= 3) return partes.join(", ");
    return `${partes.slice(0, 3).join(", ")} +${partes.length - 3}`;
  }
  const filas = ventasList.map((v) => {
    const items = itemsPorVenta.get(v.id) ?? [];
    return { ...v, items, prendas: resumenPrendas(items) };
  });

  const rol = rolDe(sesion);
  const puedeEscribir = rol === "ADMINISTRADOR" || rol === "VENDEDOR";

  return (
    <>
      <PageHeader
        titulo="Ventas"
        descripcion="Ventas y pedidos: estado, entrega, envío y pagos en un solo lugar."
        accion={
          puedeEscribir ? (
            <Link href="/ventas/nueva" className="gy-btn gy-btn-solido">
              <Plus size={17} /> Nueva venta
            </Link>
          ) : undefined
        }
      />
      <VentasTabla ventas={filas} coloresEstado={coloresEstado} esAdmin={rol === "ADMINISTRADOR"} />
    </>
  );
}
