import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { getSesion, rolDe } from "@/lib/auth";
import { getColoresEstado } from "@/lib/listas";
import { PedidosTabla } from "./PedidosTabla";

export const metadata = { title: "Pedidos" };

export default async function PedidosPage() {
  const supabase = await createClient();
  const [{ data: pedidos }, coloresEstado, sesion] = await Promise.all([
    supabase
      .from("pedidos")
      .select("id, numero, fecha, fecha_entrega, cliente_nombre, total, saldo, estado, est_pago")
      .eq("tipo", "PEDIDO")
      .eq("activo", true)
      .order("fecha", { ascending: false })
      .limit(100),
    getColoresEstado("PEDIDO"),
    getSesion(),
  ]);

  const rol = rolDe(sesion);
  const puedeEscribir = rol === "ADMINISTRADOR" || rol === "VENDEDOR";

  return (
    <>
      <PageHeader
        titulo="Pedidos"
        descripcion="Pedidos con fecha de entrega, estados y envío."
        accion={
          puedeEscribir ? (
            <Link href="/pedidos/nuevo" className="gy-btn gy-btn-solido">
              <Plus size={17} /> Nuevo pedido
            </Link>
          ) : undefined
        }
      />
      <PedidosTabla pedidos={pedidos ?? []} coloresEstado={coloresEstado} />
    </>
  );
}
