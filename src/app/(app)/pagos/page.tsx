import { PageHeader } from "@/components/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { getSesion, rolDe } from "@/lib/auth";
import { getListas } from "@/lib/listas";
import { PagosManager, type PagoRow, type PedidoPendiente } from "./PagosManager";

export const metadata = { title: "Pagos" };

export default async function PagosPage() {
  const supabase = await createClient();
  const [{ data: pagos }, { data: pendientes }, metodosLista, sesion] = await Promise.all([
    supabase
      .from("pagos")
      .select("id, fecha, cliente_nombre, metodo, tipo_pago, valor, observaciones, comprobantes, pedido_id, pedidos(numero)")
      .eq("activo", true)
      .order("fecha", { ascending: false })
      .limit(300),
    supabase
      .from("pedidos")
      .select("id, numero, cliente_nombre, saldo")
      .eq("activo", true)
      .gt("saldo", 0)
      .order("fecha", { ascending: false }),
    getListas("METODO_PAGO"),
    getSesion(),
  ]);

  // El comprobante se firma bajo demanda (al tocar "Ver"), no al cargar la página.
  const rows: PagoRow[] = (pagos ?? []).map((p) => {
    const pedido = p.pedidos as { numero: string | null } | null;
    return {
      id: p.id,
      fecha: p.fecha,
      cliente_nombre: p.cliente_nombre,
      pedido_numero: pedido?.numero ?? null,
      metodo: p.metodo,
      tipo_pago: p.tipo_pago,
      valor: Number(p.valor),
      observaciones: p.observaciones,
      comprobantes: p.comprobantes ?? [],
    };
  });

  const rol = rolDe(sesion);
  const puedeEscribir = rol === "ADMINISTRADOR" || rol === "VENDEDOR";

  return (
    <>
      <PageHeader
        titulo="Pagos"
        descripcion="Comprobantes y pagos: quién pagó, por cuál compra, método y monto."
      />
      <PagosManager
        pagos={rows}
        pendientes={(pendientes ?? []) as PedidoPendiente[]}
        metodos={(metodosLista ?? []).map((m) => m.nombre)}
        puedeEscribir={puedeEscribir}
      />
    </>
  );
}
