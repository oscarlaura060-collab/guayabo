import { PageHeader } from "@/components/PageHeader";
import { BotonCSV } from "@/components/BotonCSV";
import { createClient } from "@/lib/supabase/server";
import { pesos } from "@/lib/format";

export const metadata = { title: "Reportes" };

export default async function ReportesPage() {
  const supabase = await createClient();

  const [porMesRes, topRes, pedidosRes] = await Promise.all([
    supabase.from("ventas_por_mes").select("*").order("mes", { ascending: false }),
    supabase.from("top_prendas").select("*").order("unidades", { ascending: false }).limit(20),
    supabase
      .from("pedidos")
      .select("cliente_nombre, saldo")
      .eq("activo", true)
      .gt("saldo", 0),
  ]);

  const porMes = porMesRes.data ?? [];
  const top = topRes.data ?? [];

  // Saldos por cliente
  const saldoMap = new Map<string, number>();
  for (const p of pedidosRes.data ?? []) {
    const k = p.cliente_nombre ?? "Sin cliente";
    saldoMap.set(k, (saldoMap.get(k) ?? 0) + Number(p.saldo ?? 0));
  }
  const saldos = [...saldoMap.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <>
      <PageHeader titulo="Reportes" descripcion="Resúmenes del negocio. Descárgalos en CSV para Excel." />

      {/* Ventas por mes */}
      <div className="gy-card mb-4 overflow-hidden">
        <div className="flex items-center justify-between p-4">
          <h3 className="text-sm font-semibold">Ventas por mes</h3>
          <BotonCSV
            archivo="ventas-por-mes.csv"
            columnas={["Mes", "Pedidos", "Ventas", "Costo", "Utilidad", "Recibido", "Por cobrar"]}
            filas={porMes.map((m) => [m.mes ?? "", m.pedidos ?? 0, m.ventas ?? 0, m.costo ?? 0, m.utilidad ?? 0, m.recibido ?? 0, m.por_cobrar ?? 0])}
          />
        </div>
        <div className="gy-table-wrap">
          <table className="gy-table">
            <thead><tr><th>Mes</th><th>Pedidos</th><th>Ventas</th><th>Costo</th><th>Utilidad</th><th>Recibido</th><th>Por cobrar</th></tr></thead>
            <tbody>
              {porMes.length === 0 ? (
                <tr><td colSpan={7} style={{ color: "var(--tenue)" }}>Sin datos.</td></tr>
              ) : porMes.map((m) => (
                <tr key={m.mes}>
                  <td className="font-semibold">{m.mes}</td>
                  <td className="num">{m.pedidos}</td>
                  <td className="num">{pesos(m.ventas)}</td>
                  <td className="num">{pesos(m.costo)}</td>
                  <td className="num">{pesos(m.utilidad)}</td>
                  <td className="num">{pesos(m.recibido)}</td>
                  <td className="num" style={{ color: Number(m.por_cobrar) > 0 ? "#D33A2C" : undefined }}>{pesos(m.por_cobrar)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top prendas */}
        <div className="gy-card overflow-hidden">
          <div className="flex items-center justify-between p-4">
            <h3 className="text-sm font-semibold">Prendas más vendidas</h3>
            <BotonCSV
              archivo="top-prendas.csv"
              columnas={["Prenda", "Talla", "Color", "Unidades", "Ventas", "Utilidad"]}
              filas={top.map((t) => [t.nombre ?? "", t.talla ?? "", t.color ?? "", t.unidades ?? 0, t.ventas ?? 0, t.utilidad ?? 0])}
            />
          </div>
          <div className="gy-table-wrap">
            <table className="gy-table">
              <thead><tr><th>Prenda</th><th>Unid.</th><th>Ventas</th><th>Utilidad</th></tr></thead>
              <tbody>
                {top.length === 0 ? (
                  <tr><td colSpan={4} style={{ color: "var(--tenue)" }}>Sin datos.</td></tr>
                ) : top.map((t, i) => (
                  <tr key={i}>
                    <td>{t.nombre}<span className="ml-1 text-xs" style={{ color: "var(--tenue)" }}>{[t.talla, t.color].filter(Boolean).join(" · ")}</span></td>
                    <td className="num">{t.unidades}</td>
                    <td className="num">{pesos(t.ventas)}</td>
                    <td className="num">{pesos(t.utilidad)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Saldos por cliente */}
        <div className="gy-card overflow-hidden">
          <div className="flex items-center justify-between p-4">
            <h3 className="text-sm font-semibold">Saldos por cobrar</h3>
            <BotonCSV
              archivo="saldos-por-cliente.csv"
              columnas={["Cliente", "Saldo"]}
              filas={saldos.map(([c, v]) => [c, v])}
            />
          </div>
          <div className="gy-table-wrap">
            <table className="gy-table">
              <thead><tr><th>Cliente</th><th>Saldo</th></tr></thead>
              <tbody>
                {saldos.length === 0 ? (
                  <tr><td colSpan={2} style={{ color: "var(--tenue)" }}>Nadie debe. 🎉</td></tr>
                ) : saldos.map(([c, v]) => (
                  <tr key={c}><td>{c}</td><td className="num" style={{ color: "#D33A2C" }}>{pesos(v)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
