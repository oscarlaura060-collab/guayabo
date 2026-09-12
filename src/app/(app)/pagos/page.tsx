import { PageHeader, Proximamente } from "@/components/PageHeader";

export const metadata = { title: "Pagos" };

export default function PagosPage() {
  return (
    <>
      <PageHeader titulo="Pagos" descripcion="Abonos, saldos y comprobantes." />
      <Proximamente bloque="Pagos y apartados" />
    </>
  );
}
