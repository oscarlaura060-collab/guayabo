import { PageHeader, Proximamente } from "@/components/PageHeader";

export const metadata = { title: "Prendas" };

export default function PrendasPage() {
  return (
    <>
      <PageHeader titulo="Prendas" descripcion="Catálogo con fotos y desglose de costos." />
      <Proximamente bloque="Prendas con fotos" />
    </>
  );
}
