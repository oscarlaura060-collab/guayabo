import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { exigirAcceso } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { getConfig } from "@/lib/config";
import { pesos, fecha as fmtFecha } from "@/lib/format";
import { RangoPersonalizado } from "./RangoPersonalizado";

export const metadata = { title: "Utilidades" };

type Periodo = "mes" | "mes_pasado" | "ano" | "todo";
const PERIODOS: { clave: Periodo; label: string }[] = [
  { clave: "mes", label: "Este mes" },
  { clave: "mes_pasado", label: "Mes pasado" },
  { clave: "ano", label: "Este año" },
  { clave: "todo", label: "Todo" },
];

const reFecha = /^\d{4}-\d{2}-\d{2}$/;

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function rango(p: Periodo): { desde: string | null; hasta: string | null } {
  const hoy = new Date();
  const y = hoy.getFullYear();
  const m = hoy.getMonth();
  if (p === "mes") return { desde: ymd(new Date(y, m, 1)), hasta: ymd(new Date(y, m + 1, 0)) };
  if (p === "mes_pasado") return { desde: ymd(new Date(y, m - 1, 1)), hasta: ymd(new Date(y, m, 0)) };
  if (p === "ano") return { desde: ymd(new Date(y, 0, 1)), hasta: ymd(new Date(y, 11, 31)) };
  return { desde: null, hasta: null };
}

export default async function UtilidadesPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; desde?: string; hasta?: string }>;
}) {
  await exigirAcceso("/utilidades");
  const sp = await searchParams;

  // Rango personalizado si llegan desde/hasta válidos; si no, un período fijo.
  const personalizado =
    sp.periodo === "personalizado" && reFecha.test(sp.desde ?? "") && reFecha.test(sp.hasta ?? "");
  const periodo = personalizado
    ? ("personalizado" as const)
    : ((PERIODOS.find((x) => x.clave === sp.periodo)?.clave ?? "mes") as Periodo);
  const { desde, hasta } = personalizado
    ? { desde: sp.desde!, hasta: sp.hasta! }
    : rango(periodo as Periodo);

  const supabase = await createClient();
  const config = await getConfig().catch(() => ({}) as Record<string, string>);
  const netaIncluyeGastos = (config.UTILIDAD_NETA_INCLUYE_GASTOS ?? "TRUE") === "TRUE";

  let pq = supabase
    .from("pedidos")
    .select("total, costo, utilidad, pagado, saldo")
    .eq("activo", true)
    .neq("estado", "Cancelado");
  if (desde) pq = pq.gte("fecha", desde);
  if (hasta) pq = pq.lte("fecha", hasta);

  let gq = supabase.from("gastos").select("categoria, valor").eq("activo", true);
  if (desde) gq = gq.gte("fecha", desde);
  if (hasta) gq = gq.lte("fecha", hasta);

  const [{ data: pedidos }, { data: gastos }] = await Promise.all([pq, gq]);

  const ventas = (pedidos ?? []).reduce((s, p) => s + Number(p.total ?? 0), 0);
  const costo = (pedidos ?? []).reduce((s, p) => s + Number(p.costo ?? 0), 0);
  const bruta = (pedidos ?? []).reduce((s, p) => s + Number(p.utilidad ?? 0), 0);
  const recibido = (pedidos ?? []).reduce((s, p) => s + Number(p.pagado ?? 0), 0);
  const porCobrar = (pedidos ?? []).reduce((s, p) => s + Number(p.saldo ?? 0), 0);
  const gastosTotal = (gastos ?? []).reduce((s, g) => s + Number(g.valor ?? 0), 0);
  const neta = netaIncluyeGastos ? bruta - gastosTotal : bruta;

  const gastosPorCat = Object.entries(
    (gastos ?? []).reduce((m, g) => {
      const c = g.categoria ?? "Otros";
      m[c] = (m[c] ?? 0) + Number(g.valor ?? 0);
      return m;
    }, {} as Record<string, number>),
  ).sort((a, b) => b[1] - a[1]);
  const maxCat = gastosPorCat.length ? gastosPorCat[0][1] : 1;

  return (
    <>
      <PageHeader titulo="Utilidades" descripcion="Utilidad bruta y neta del período." />

      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {PERIODOS.map((p) => (
            <Link key={p.clave} href={`/utilidades?periodo=${p.clave}`} className="gy-pill" data-activo={p.clave === periodo}>
              {p.label}
            </Link>
          ))}
        </div>
        <RangoPersonalizado desde={personalizado ? desde! : ""} hasta={personalizado ? hasta! : ""} activo={personalizado} />
        {desde && hasta && (
          <p className="text-xs" style={{ color: "var(--tenue)" }}>
            Mostrando del <b>{fmtFecha(desde)}</b> al <b>{fmtFecha(hasta)}</b>.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Tarjeta etiqueta="Ventas" valor={pesos(ventas)} />
        <Tarjeta etiqueta="Costo de mercancía" valor={pesos(costo)} />
        <Tarjeta etiqueta="Utilidad bruta" valor={pesos(bruta)} acento="#3AA76D" />
        <Tarjeta etiqueta="Gastos" valor={pesos(gastosTotal)} acento="#D33A2C" />
        <Tarjeta etiqueta="Utilidad neta" valor={pesos(neta)} destacada />
        <Tarjeta etiqueta="Por cobrar" valor={pesos(porCobrar)} sub={`Recibido: ${pesos(recibido)}`} />
      </div>

      <div className="mt-4 gy-card p-4">
        <div className="mb-3 text-sm font-semibold">Gastos por categoría</div>
        {gastosPorCat.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--tenue)" }}>Sin gastos en este período.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {gastosPorCat.map(([c, v]) => (
              <div key={c}>
                <div className="mb-1 flex justify-between text-sm">
                  <span style={{ color: "var(--tenue)" }}>{c}</span>
                  <span className="tabular-nums font-medium">{pesos(v)}</span>
                </div>
                <div style={{ height: 8, borderRadius: 6, background: "color-mix(in srgb, var(--color-texto) 6%, transparent)" }}>
                  <div style={{ height: "100%", borderRadius: 6, width: `${Math.round((v / maxCat) * 100)}%`, background: "var(--color-secundario)" }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="mt-4 text-xs" style={{ color: "var(--tenue)" }}>
        Utilidad bruta = ventas − costo de la mercancía. Utilidad neta = bruta
        {netaIncluyeGastos ? " − gastos del período" : " (los gastos no se restan, según la configuración)"}.
      </p>
    </>
  );
}

function Tarjeta({
  etiqueta,
  valor,
  sub,
  acento,
  destacada,
}: {
  etiqueta: string;
  valor: string;
  sub?: string;
  acento?: string;
  destacada?: boolean;
}) {
  return (
    <Card style={destacada ? { borderColor: "color-mix(in srgb, var(--color-secundario) 35%, transparent)" } : undefined}>
      <CardBody>
        <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--tenue)" }}>{etiqueta}</div>
        <div className="gy-cifra mt-2 text-2xl" style={{ color: destacada ? "var(--color-secundario)" : acento }}>{valor}</div>
        {sub && <div className="mt-1 text-xs" style={{ color: "var(--tenue)" }}>{sub}</div>}
      </CardBody>
    </Card>
  );
}
