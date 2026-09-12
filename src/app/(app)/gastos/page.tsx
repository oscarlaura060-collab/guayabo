import { PageHeader, Proximamente } from "@/components/PageHeader";
import { exigirAcceso } from "@/lib/guard";

export const metadata = { title: "Gastos" };

export default async function GastosPage() {
  await exigirAcceso("/gastos");
  return (
    <>
      <PageHeader titulo="Gastos" descripcion="Gastos del negocio por categoría." />
      <Proximamente bloque="Gastos y utilidades" />
    </>
  );
}
