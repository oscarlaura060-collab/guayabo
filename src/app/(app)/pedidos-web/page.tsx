import { PageHeader } from "@/components/PageHeader";
import { exigirAcceso } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { PedidosWebManager, type SolicitudRow } from "./PedidosWebManager";

export const metadata = { title: "Pedidos web" };

export default async function PedidosWebPage() {
  const { rol } = await exigirAcceso("/pedidos-web");
  const supabase = await createClient();
  const { data } = await supabase
    .from("solicitudes_web")
    .select("id, codigo, created_at, cliente_nombre, cedula, telefono, email, ciudad, direccion, items, envio, total, estado, notas")
    .order("created_at", { ascending: false })
    .limit(300);

  const rows = (data ?? []) as unknown as SolicitudRow[];

  return (
    <>
      <PageHeader titulo="Pedidos web" descripcion="Solicitudes que entran desde la tienda. No descuentan inventario: confírmalas aquí." />
      <PedidosWebManager solicitudes={rows} esAdmin={rol === "ADMINISTRADOR"} puedeEscribir={rol === "ADMINISTRADOR" || rol === "VENDEDOR"} />
    </>
  );
}
