import { PageHeader, Proximamente } from "@/components/PageHeader";

export const metadata = { title: "Clientes" };

export default function ClientesPage() {
  return (
    <>
      <PageHeader titulo="Clientes" descripcion="Listado, búsqueda y ficha de cada cliente." />
      <Proximamente bloque="Clientes" />
    </>
  );
}
