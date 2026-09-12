import { PageHeader, Proximamente } from "@/components/PageHeader";

export const metadata = { title: "Ventas" };

export default function VentasPage() {
  return (
    <>
      <PageHeader titulo="Ventas" descripcion="El flujo rápido de venta: cliente, prendas y cobro." />
      <Proximamente bloque="Ventas (flujo rápido)" />
    </>
  );
}
