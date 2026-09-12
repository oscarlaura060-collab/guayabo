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
      .select("id, fecha, categoria, descripcion, valor, metodo, observaciones, comprobante_path")
      .eq("activo", true)
      .order("fecha", { ascending: false })
      .limit(300),
    getListas("CATEGORIA_GASTO"),
    getListas("METODO_PAGO"),
  ]);

  const rows: GastoRow[] = [];
  for (const g of gastos ?? []) {
    let comprobanteUrl: string | null = null;
    if (g.comprobante_path) {
      const { data } = await supabase.storage.from("comprobantes").createSignedUrl(g.comprobante_path, 3600);
      comprobanteUrl = data?.signedUrl ?? null;
    }
    rows.push({
      id: g.id,
      fecha: g.fecha,
      categoria: g.categoria,
      descripcion: g.descripcion,
      valor: Number(g.valor),
      metodo: g.metodo,
      observaciones: g.observaciones,
      comprobanteUrl,
    });
  }

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
