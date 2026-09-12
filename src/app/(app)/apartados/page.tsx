import { PageHeader } from "@/components/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { getSesion, rolDe } from "@/lib/auth";
import { getListas, getColoresEstado } from "@/lib/listas";
import { ApartadosManager } from "./ApartadosManager";

export const metadata = { title: "Apartados" };

export default async function ApartadosPage() {
  const supabase = await createClient();
  const [{ data: apartados }, { data: clientes }, { data: prendas }, metodos, colores, sesion] = await Promise.all([
    supabase
      .from("apartados")
      .select("id, codigo, cliente_nombre, prenda_nombre, talla, color, cantidad, total, abonado, saldo, estado, disponible, fecha_limite")
      .eq("activo", true)
      .order("fecha", { ascending: false }),
    supabase.from("clientes").select("id, nombre").eq("activo", true).order("nombre"),
    supabase.from("prendas").select("id, nombre, precio, stock, talla, color").eq("activo", true).order("nombre"),
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
        metodos={metodos.map((m) => m.nombre)}
        coloresEstado={colores}
        puedeEscribir={puedeEscribir}
      />
    </>
  );
}
