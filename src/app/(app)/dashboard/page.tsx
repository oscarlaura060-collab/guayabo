import { PageHeader } from "@/components/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/server";
import { getSesion } from "@/lib/auth";
import { pesos } from "@/lib/format";

export const metadata = { title: "Dashboard" };

async function conteo(tabla: "clientes" | "prendas" | "pedidos"): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from(tabla)
    .select("*", { count: "exact", head: true })
    .eq("activo", true);
  return count ?? 0;
}

async function ventasMes(): Promise<number> {
  const supabase = await createClient();
  const desde = new Date();
  desde.setDate(1);
  const { data } = await supabase
    .from("pedidos")
    .select("total")
    .eq("activo", true)
    .neq("estado", "Cancelado")
    .gte("fecha", desde.toISOString().slice(0, 10));
  return (data ?? []).reduce((s, r) => s + Number(r.total ?? 0), 0);
}

function Tarjeta({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <Card>
      <CardBody>
        <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--tenue)" }}>
          {etiqueta}
        </div>
        <div className="gy-cifra mt-2 text-3xl">{valor}</div>
      </CardBody>
    </Card>
  );
}

export default async function DashboardPage() {
  const sesion = await getSesion();
  const nombre = sesion?.perfil?.nombre || "equipo";

  const [clientes, prendas, pedidos, mes] = await Promise.all([
    conteo("clientes"),
    conteo("prendas"),
    conteo("pedidos"),
    ventasMes(),
  ]);

  return (
    <>
      <PageHeader titulo={`Hola, ${nombre}`} descripcion="Resumen rápido de tu marca." />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Tarjeta etiqueta="Ventas del mes" valor={pesos(mes)} />
        <Tarjeta etiqueta="Pedidos" valor={String(pedidos)} />
        <Tarjeta etiqueta="Prendas" valor={String(prendas)} />
        <Tarjeta etiqueta="Clientes" valor={String(clientes)} />
      </div>
      <p className="mt-6 text-sm" style={{ color: "var(--tenue)" }}>
        El dashboard completo (gráficos y tarjetas configurables) llega en su propio bloque.
      </p>
    </>
  );
}
