import { PageHeader } from "@/components/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/server";
import { getSesion } from "@/lib/auth";
import { pesos } from "@/lib/format";

export const metadata = { title: "Dashboard" };

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
function mesCorto(ym: string): string {
  const m = Number(ym.split("-")[1]);
  return MESES[(m - 1) % 12] ?? ym;
}

function Tarjeta({ etiqueta, valor, acento, destacada }: { etiqueta: string; valor: string; acento?: string; destacada?: boolean }) {
  return (
    <Card style={destacada ? { borderColor: "color-mix(in srgb, var(--color-secundario) 35%, transparent)" } : undefined}>
      <CardBody>
        <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--tenue)" }}>{etiqueta}</div>
        <div className="gy-cifra mt-2 text-2xl" style={{ color: destacada ? "var(--color-secundario)" : acento }}>{valor}</div>
      </CardBody>
    </Card>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10);
  const hoyStr = hoy.toISOString().slice(0, 10);

  const [sesion, mesRes, pendRes, prendasRes, gastosRes, porMesRes, topRes] = await Promise.all([
    getSesion(),
    supabase.from("pedidos").select("total, utilidad, pagado, saldo").eq("activo", true).neq("estado", "Cancelado").gte("fecha", inicioMes),
    supabase.from("pedidos").select("id, saldo, estado").eq("activo", true).neq("estado", "Cancelado"),
    supabase.from("prendas").select("stock, stock_minimo").eq("activo", true),
    supabase.from("gastos").select("valor").eq("activo", true).gte("fecha", inicioMes),
    supabase.from("ventas_por_mes").select("mes, ventas, utilidad").order("mes", { ascending: false }).limit(6),
    supabase.from("top_prendas").select("nombre, unidades, ventas").order("unidades", { ascending: false }).limit(6),
  ]);

  const mesRows = mesRes.data ?? [];
  const ventasMes = mesRows.reduce((s, p) => s + Number(p.total ?? 0), 0);
  const recibidoMes = mesRows.reduce((s, p) => s + Number(p.pagado ?? 0), 0);
  const brutaMes = mesRows.reduce((s, p) => s + Number(p.utilidad ?? 0), 0);
  const gastosMes = (gastosRes.data ?? []).reduce((s, g) => s + Number(g.valor ?? 0), 0);
  const netaMes = brutaMes - gastosMes;

  const pend = pendRes.data ?? [];
  const porCobrar = pend.reduce((s, p) => s + Number(p.saldo ?? 0), 0);
  const porEntregar = pend.filter((p) => !["Entregado", "Cancelado"].includes(p.estado)).length;

  const prendas = prendasRes.data ?? [];
  const totalPrendas = prendas.length;
  const stockBajo = prendas.filter((p) => p.stock <= p.stock_minimo).length;

  const porMes = [...(porMesRes.data ?? [])].reverse(); // cronológico
  const maxMes = Math.max(1, ...porMes.map((m) => Number(m.ventas ?? 0)));
  const top = topRes.data ?? [];
  const maxTop = Math.max(1, ...top.map((t) => Number(t.unidades ?? 0)));

  const nombre = sesion?.perfil?.nombre || "equipo";

  // Geometría del gráfico de barras (SVG)
  const W = 640, H = 220, padB = 28, padT = 24, padX = 16;
  const n = Math.max(porMes.length, 1);
  const bw = (W - padX * 2) / n;

  return (
    <>
      <PageHeader titulo={`Hola, ${nombre}`} descripcion="Resumen de tu marca." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tarjeta etiqueta="Ventas del mes" valor={pesos(ventasMes)} destacada />
        <Tarjeta etiqueta="Recibido del mes" valor={pesos(recibidoMes)} acento="#3AA76D" />
        <Tarjeta etiqueta="Por cobrar" valor={pesos(porCobrar)} acento={porCobrar > 0 ? "#D33A2C" : undefined} />
        <Tarjeta etiqueta="Utilidad neta (mes)" valor={pesos(netaMes)} acento="#3AA76D" />
        <Tarjeta etiqueta="Por entregar" valor={String(porEntregar)} />
        <Tarjeta etiqueta="Prendas" valor={String(totalPrendas)} />
        <Tarjeta etiqueta="Stock bajo" valor={String(stockBajo)} acento={stockBajo > 0 ? "#F4B740" : undefined} />
        <Tarjeta etiqueta="Gastos del mes" valor={pesos(gastosMes)} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* Ventas por mes */}
        <div className="gy-card p-4">
          <div className="mb-3 text-sm font-semibold">Ventas por mes</div>
          {porMes.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--tenue)" }}>Aún no hay datos.</p>
          ) : (
            <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Ventas por mes">
              {porMes.map((m, i) => {
                const v = Number(m.ventas ?? 0);
                const h = Math.round(((H - padT - padB) * v) / maxMes);
                const x = padX + i * bw;
                const y = H - padB - h;
                return (
                  <g key={m.mes}>
                    <rect x={x + bw * 0.18} y={y} width={bw * 0.64} height={Math.max(h, 1)} rx="6" fill="var(--color-secundario)" />
                    <text x={x + bw / 2} y={y - 6} textAnchor="middle" fontSize="12" fill="var(--color-texto)" fontFamily="var(--font-fraunces), serif">
                      {v >= 1000 ? `${Math.round(v / 1000)}k` : v}
                    </text>
                    <text x={x + bw / 2} y={H - 8} textAnchor="middle" fontSize="12" fill="var(--tenue)">{mesCorto(m.mes ?? "")}</text>
                  </g>
                );
              })}
            </svg>
          )}
        </div>

        {/* Top prendas */}
        <div className="gy-card p-4">
          <div className="mb-3 text-sm font-semibold">Prendas más vendidas</div>
          {top.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--tenue)" }}>Aún no hay datos.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {top.map((t, i) => (
                <div key={i}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="truncate pr-2">{t.nombre}</span>
                    <span className="tabular-nums font-medium">{Number(t.unidades ?? 0)}</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 6, background: "color-mix(in srgb, var(--color-texto) 6%, transparent)" }}>
                    <div style={{ height: "100%", borderRadius: 6, width: `${Math.round((Number(t.unidades ?? 0) / maxTop) * 100)}%`, background: i === 0 ? "var(--color-secundario)" : "var(--color-primario)" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="mt-3 text-xs" style={{ color: "var(--tenue)" }}>
        Datos en vivo desde Supabase · mes actual a hoy ({hoyStr}).
      </p>
    </>
  );
}
