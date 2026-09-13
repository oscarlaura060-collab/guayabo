import { PageHeader } from "@/components/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { getSesion, rolDe } from "@/lib/auth";
import { InventarioManager } from "./InventarioManager";

export const metadata = { title: "Inventario" };

export default async function InventarioPage() {
  const supabase = await createClient();
  const [{ data: prendas }, { data: movimientos }, sesion] = await Promise.all([
    supabase
      .from("prendas")
      .select("id, codigo, nombre, talla, color, stock, stock_minimo, vendidas, precio, costo")
      .eq("activo", true)
      .order("nombre", { ascending: true }),
    supabase
      .from("movimientos_inventario")
      .select("id, created_at, prenda_nombre, tipo, cantidad, stock_anterior, stock_nuevo, referencia, nota, usuario_email")
      .order("created_at", { ascending: false })
      .limit(80),
    getSesion(),
  ]);

  const rol = rolDe(sesion);
  const puedeEscribir = rol === "ADMINISTRADOR" || rol === "VENDEDOR";

  return (
    <>
      <PageHeader titulo="Inventario" descripcion="Stock, alertas de stock bajo y movimientos." />
      <InventarioManager
        prendas={prendas ?? []}
        movimientos={movimientos ?? []}
        puedeEscribir={puedeEscribir}
      />
    </>
  );
}
