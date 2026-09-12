import { PageHeader, Proximamente } from "@/components/PageHeader";
import { exigirAcceso } from "@/lib/guard";

export const metadata = { title: "Utilidades" };

export default async function UtilidadesPage() {
  await exigirAcceso("/utilidades");
  return (
    <>
      <PageHeader titulo="Utilidades" descripcion="Utilidad bruta y neta por período." />
      <Proximamente bloque="Gastos y utilidades" />
    </>
  );
}
