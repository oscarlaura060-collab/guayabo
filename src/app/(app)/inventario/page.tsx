import { PageHeader, Proximamente } from "@/components/PageHeader";

export const metadata = { title: "Inventario" };

export default function InventarioPage() {
  return (
    <>
      <PageHeader titulo="Inventario" descripcion="Stock, movimientos y alertas de stock bajo." />
      <Proximamente bloque="Inventario" />
    </>
  );
}
