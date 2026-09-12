import { PageHeader } from "@/components/PageHeader";
import { exigirAcceso } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { getListas } from "@/lib/listas";
import { GastosManager } from "./GastosManager";

export const metadata = { title: "Gastos" };

export default async function GastosPage() {
  const { rol } = await exigirAcceso("/gastos");
  const supabase = await createClient();
  const [{ data: gastos }, categorias, metodos] = await Promise.all([
    supabase
      .from("gastos")
      .select("id, fecha, categoria, descripcion, valor, metodo, observaciones")
      .eq("activo", true)
      .order("fecha", { ascending: false })
      .limit(300),
    getListas("CATEGORIA_GASTO"),
    getListas("METODO_PAGO"),
  ]);

  return (
    <>
      <PageHeader titulo="Gastos" descripcion="Gastos del negocio por categoría." />
      <GastosManager
        gastos={gastos ?? []}
        categorias={categorias.map((c) => c.nombre)}
        metodos={metodos.map((m) => m.nombre)}
        puedeEscribir={rol === "ADMINISTRADOR"}
      />
    </>
  );
}
