import { PageHeader, Proximamente } from "@/components/PageHeader";

export const metadata = { title: "Apartados" };

export default function ApartadosPage() {
  return (
    <>
      <PageHeader titulo="Apartados" descripcion="Apartados con abonos, saldos y vencimientos." />
      <Proximamente bloque="Pagos y apartados" />
    </>
  );
}
