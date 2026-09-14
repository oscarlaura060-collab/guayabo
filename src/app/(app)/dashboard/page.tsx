import type { LucideIcon } from "lucide-react";
import { TrendingUp, Wallet, Clock, Package, AlertTriangle, Receipt, Truck, Coins } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { getSesion } from "@/lib/auth";
import { pesos } from "@/lib/format";

export const metadata = { title: "Dashboard" };

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
function mesCorto(ym: string): string {
  const m = Number(ym.split("-")[1]);
  return MESES[(m - 1) % 12] ?? ym;
}

function Kpi({
  etiqueta,
  valor,
  sub,
  icono: Icono,
  color = "var(--color-secundario)",
  destacada,
}: {
  etiqueta: string;
  valor: string;
  sub?: string;
  icono: LucideIcon;
  color?: string;
  destacada?: boolean;
}) {
  return (
    <div
      className="gy-card flex flex-col gap-3 p-4"
      style={destacada ? { background: "var(--color-secundario)", color: "#fff" } : undefined}
    >
      <div className="flex items-center justify-between">
        <span
          className="grid h-9 w-9 place-items-center rounded-full"
          style={{
            background: destacada ? "rgba(255,255,255,.2)" : `color-mix(in srgb, ${color} 14%, transparent)`,
            color: destacada ? "#fff" : color,
          }}
        >
          <Icono size={18} />
        </span>
      </div>
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ opacity: destacada ? 0.85 : 0.55 }}>
          {etiqueta}
        </div>
        <div className="gy-cifra mt-1 text-2xl leading-tight" style={{ color: destacada ? "#fff" : color }}>
          {valor}
        </div>
        {sub && <div className="mt-0.5 text-xs" style={{ opacity: destacada ? 0.85 : 0.55 }}>{sub}</div>}
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10);

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
  const pedidosMes = mesRows.length;

  const pend = pendRes.data ?? [];
  const porCobrar = pend.reduce((s, p) => s + Number(p.saldo ?? 0), 0);
  const porEntregar = pend.filter((p) => !["Entregado", "Cancelado"].includes(p.estado)).length;

  const prendas = prendasRes.data ?? [];
  const totalPrendas = prendas.length;
  const stockBajo = prendas.filter((p) => p.stock <= p.stock_minimo).length;

  const porMes = [...(porMesRes.data ?? [])].reverse();
  const maxMes = Math.max(1, ...porMes.map((m) => Number(m.ventas ?? 0)));
  const top = topRes.data ?? [];
  const maxTop = Math.max(1, ...top.map((t) => Number(t.unidades ?? 0)));

  const nombre = sesion?.perfil?.nombre || "equipo";

  const W = 640, H = 220, padB = 28, padT = 24, padX = 16;
  const n = Math.max(porMes.length, 1);
  const bw = (W - padX * 2) / n;

  return (
    <>
      <PageHeader titulo={`Hola, ${nombre}`} descripcion="Resumen de tu marca en vivo." />

      {/* KPIs del mes */}
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--tenue)" }}>Este mes</div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi etiqueta="Ventas del mes" valor={pesos(ventasMes)} sub={`${pedidosMes} pedido(s)`} icono={TrendingUp} destacada />
        <Kpi etiqueta="Recibido" valor={pesos(recibidoMes)} icono={Wallet} color="#3AA76D" />
        <Kpi etiqueta="Utilidad neta" valor={pesos(netaMes)} sub={`Bruta ${pesos(brutaMes)}`} icono={Coins} color="#3AA76D" />
        <Kpi etiqueta="Gastos del mes" valor={pesos(gastosMes)} icono={Receipt} color="#D33A2C" />
      </div>

      {/* Estado del negocio */}
      <div className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--tenue)" }}>Estado</div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi etiqueta="Por cobrar" valor={pesos(porCobrar)} icono={Clock} color={porCobrar > 0 ? "#D33A2C" : "#3AA76D"} />
        <Kpi etiqueta="Por entregar" valor={String(porEntregar)} icono={Truck} color="#7FB2F0" />
        <Kpi etiqueta="Prendas activas" valor={String(totalPrendas)} icono={Package} />
        <Kpi etiqueta="Stock bajo" valor={String(stockBajo)} icono={AlertTriangle} color={stockBajo > 0 ? "#F4B740" : "#3AA76D"} />
      </div>

      {/* Gráficos */}
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="gy-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-semibold">Ventas por mes</span>
            <span className="text-xs" style={{ color: "var(--tenue)" }}>últimos {porMes.length || 6}</span>
          </div>
          {porMes.length === 0 ? (
            <p className="py-8 text-center text-sm" style={{ color: "var(--tenue)" }}>Aún no hay datos.</p>
          ) : (
            <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Ventas por mes">
              {porMes.map((m, i) => {
                const v = Number(m.ventas ?? 0);
                const h = Math.round(((H - padT - padB) * v) / maxMes);
                const x = padX + i * bw;
                const y = H - padB - h;
                return (
                  <g key={m.mes}>
                    <rect x={x + bw * 0.2} y={padT} width={bw * 0.6} height={H - padB - padT} rx="7" fill="color-mix(in srgb, var(--color-texto) 5%, transparent)" />
                    <rect x={x + bw * 0.2} y={y} width={bw * 0.6} height={Math.max(h, 2)} rx="7" fill="var(--color-secundario)" />
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

        <div className="gy-card p-5">
          <div className="mb-4 text-sm font-semibold">Prendas más vendidas</div>
          {top.length === 0 ? (
            <p className="py-8 text-center text-sm" style={{ color: "var(--tenue)" }}>Aún no hay datos.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {top.map((t, i) => (
                <div key={i}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="truncate pr-2">{t.nombre}</span>
                    <span className="tabular-nums font-semibold">{Number(t.unidades ?? 0)}</span>
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
    </>
  );
}
