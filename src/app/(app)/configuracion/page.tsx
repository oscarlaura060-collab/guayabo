import { PageHeader } from "@/components/PageHeader";
import { Card, CardBody, CardTitle } from "@/components/ui/Card";
import { exigirAcceso } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Configuración" };

export default async function ConfiguracionPage() {
  await exigirAcceso("/configuracion");
  const supabase = await createClient();
  const { data } = await supabase
    .from("config")
    .select("clave, valor, grupo, descripcion")
    .eq("activo", true)
    .order("grupo", { ascending: true })
    .order("clave", { ascending: true });

  const grupos = new Map<string, typeof data>();
  for (const row of data ?? []) {
    const g = row.grupo || "OTROS";
    if (!grupos.has(g)) grupos.set(g, []);
    grupos.get(g)!.push(row);
  }

  return (
    <>
      <PageHeader
        titulo="Configuración"
        descripcion="Todo configurable desde aquí. La edición llega en su propio bloque; por ahora, vista de lo guardado."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {[...grupos.entries()].map(([grupo, filas]) => (
          <Card key={grupo}>
            <CardBody>
              <CardTitle>{grupo}</CardTitle>
              <dl className="mt-3 flex flex-col gap-2">
                {(filas ?? []).map((f) => (
                  <div key={f.clave} className="flex items-baseline justify-between gap-3">
                    <dt className="text-sm" style={{ color: "var(--tenue)" }}>
                      {f.descripcion || f.clave}
                    </dt>
                    <dd className="text-sm font-medium">{f.valor || "—"}</dd>
                  </div>
                ))}
              </dl>
            </CardBody>
          </Card>
        ))}
      </div>
    </>
  );
}
