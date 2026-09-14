import { getProductos } from "@/lib/tienda";
import { CatalogoCliente } from "./CatalogoCliente";

export const metadata = { title: "Catálogo" };

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const [productos, sp] = await Promise.all([getProductos(), searchParams]);
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold" style={{ fontFamily: "var(--font-fraunces, serif)" }}>Catálogo</h1>
      <CatalogoCliente productos={productos} categoriaInicial={sp.categoria ?? null} />
    </div>
  );
}
