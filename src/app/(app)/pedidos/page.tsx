import { PageHeader, Proximamente } from "@/components/PageHeader";

export const metadata = { title: "Pedidos" };

export default function PedidosPage() {
  return (
    <>
      <PageHeader titulo="Pedidos" descripcion="Pedidos con estados y fechas de entrega." />
      <Proximamente bloque="Pedidos" />
    </>
  );
}
