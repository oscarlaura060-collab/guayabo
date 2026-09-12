import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { getSesion, rolDe } from "@/lib/auth";
import { VentasTabla } from "./VentasTabla";

export const metadata = { title: "Ventas" };

export default async function VentasPage() {
  const supabase = await createClient();
  const [{ data: ventas }, sesion] = await Promise.all([
    supabase
      .from("pedidos")
      .select("id, numero, fecha, cliente_nombre, total, saldo, est_pago, estado")
      .eq("tipo", "VENTA")
      .eq("activo", true)
      .order("fecha", { ascending: false })
      .limit(100),
    getSesion(),
  ]);

  const rol = rolDe(sesion);
  const puedeEscribir = rol === "ADMINISTRADOR" || rol === "VENDEDOR";

  return (
    <>
      <PageHeader
        titulo="Ventas"
        descripcion="Ventas entregadas de inmediato."
        accion={
          puedeEscribir ? (
            <Link href="/ventas/nueva" className="gy-btn gy-btn-solido">
              <Plus size={17} /> Nueva venta
            </Link>
          ) : undefined
        }
      />
      <VentasTabla ventas={ventas ?? []} />
    </>
  );
}
