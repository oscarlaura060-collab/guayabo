import { PageHeader } from "@/components/PageHeader";
import { exigirAcceso } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { getListas } from "@/lib/listas";
import { GastosManager, type GastoRow } from "./GastosManager";

export const metadata = { title: "Gastos" };

export default async function GastosPage() {
  const { rol } = await exigirAcceso("/gastos");
  const supabase = await createClient();
  const [{ data: gastos }, categorias, metodos] = await Promise.all([
    supabase
      .from("gastos")
      .select("id, fecha, categoria, descripcion, valor, metodo, observaciones, comprobantes")
      .eq("activo", true)
      .order("fecha", { ascending: false })
      .limit(300),
    getListas("CATEGORIA_GASTO"),
    getListas("METODO_PAGO"),
  ]);

  const rows: GastoRow[] = (gastos ?? []).map((g) => ({
    id: g.id,
    fecha: g.fecha,
    categoria: g.categoria,
    descripcion: g.descripcion,
    valor: Number(g.valor),
    metodo: g.metodo,
    observaciones: g.observaciones,
    comprobantes: g.comprobantes ?? [],
  }));

  return (
    <>
      <PageHeader titulo="Gastos" descripcion="Gastos del negocio por categoría, con comprobante." />
      <GastosManager
        gastos={rows}
        categorias={categorias.map((c) => c.nombre)}
        metodos={metodos.map((m) => m.nombre)}
        puedeEscribir={rol === "ADMINISTRADOR"}
      />
    </>
  );
}
