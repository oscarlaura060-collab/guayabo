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
      .select("id, numero, fecha, fecha_entrega, cliente_nombre, total, saldo, est_pago, estado")
      .eq("activo", true)
      .order("fecha", { ascending: false })
      .limit(200),
    getColoresEstado("PEDIDO"),
    getSesion(),
  ]);

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
      <VentasTabla ventas={ventas ?? []} coloresEstado={coloresEstado} />
    </>
  );
}
