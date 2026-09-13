import { PageHeader } from "@/components/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { getSesion, rolDe } from "@/lib/auth";
import { getListas, getColoresEstado } from "@/lib/listas";
import { ApartadosManager } from "./ApartadosManager";

export const metadata = { title: "Apartados" };

export default async function ApartadosPage() {
  const supabase = await createClient();
  const [{ data: apartados }, { data: clientes }, { data: prendas }, { data: abonos }, metodos, colores, sesion] = await Promise.all([
    supabase
      .from("apartados")
      .select("id, codigo, cliente_nombre, prenda_nombre, talla, color, cantidad, precio, total, abonado, saldo, estado, disponible, fecha, fecha_limite, observaciones")
      .eq("activo", true)
      .order("fecha", { ascending: false }),
    supabase.from("clientes").select("id, nombre").eq("activo", true).order("nombre"),
    supabase.from("prendas").select("id, nombre, precio, stock, talla, color").eq("activo", true).order("nombre"),
    supabase
      .from("pagos")
      .select("id, apartado_id, fecha, valor, metodo, comprobantes")
      .eq("activo", true)
      .not("apartado_id", "is", null)
      .order("fecha", { ascending: true }),
    getListas("METODO_PAGO"),
    getColoresEstado("APARTADO"),
    getSesion(),
  ]);

  const rol = rolDe(sesion);
  const puedeEscribir = rol === "ADMINISTRADOR" || rol === "VENDEDOR";

  return (
    <>
      <PageHeader
        titulo="Apartados"
        descripcion="Reservas de prendas (por ejemplo sin stock). Cuando reingresa el stock, se marcan disponibles para entregar."
      />
      <ApartadosManager
        apartados={apartados ?? []}
        clientes={clientes ?? []}
        prendas={prendas ?? []}
        abonos={(abonos ?? []).map((a) => ({
          id: a.id,
          apartado_id: a.apartado_id as string,
          fecha: a.fecha,
          valor: Number(a.valor),
          metodo: a.metodo,
          comprobantes: a.comprobantes ?? [],
        }))}
        metodos={metodos.map((m) => m.nombre)}
        coloresEstado={colores}
        puedeEscribir={puedeEscribir}
      />
    </>
  );
}
