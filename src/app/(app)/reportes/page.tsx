import { PageHeader, Proximamente } from "@/components/PageHeader";

export const metadata = { title: "Reportes" };

export default function ReportesPage() {
  return (
    <>
      <PageHeader titulo="Reportes" descripcion="Exportes y reportes del negocio." />
      <Proximamente bloque="Reportes" />
    </>
  );
}
