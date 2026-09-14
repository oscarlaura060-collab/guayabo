import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getConfig } from "@/lib/config";
import { getProducto, WHATSAPP_DEFECTO } from "@/lib/tienda";
import { ProductoDetalle } from "./ProductoDetalle";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const producto = await getProducto(id);
  return { title: producto?.nombre ?? "Producto" };
}

export default async function ProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [producto, config] = await Promise.all([
    getProducto(id),
    getConfig().catch(() => ({}) as Record<string, string>),
  ]);
  if (!producto) notFound();

  const nombreMarca = config.NOMBRE_MARCA || "GUAYABO";
  const whatsapp = (config.WHATSAPP || WHATSAPP_DEFECTO).replace(/\D/g, "");

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Link href="/catalogo" className="mb-4 inline-flex items-center gap-1 text-sm opacity-70 hover:opacity-100">
        <ArrowLeft size={15} /> Volver al catálogo
      </Link>
      <ProductoDetalle producto={producto} whatsapp={whatsapp} nombreMarca={nombreMarca} />
    </div>
  );
}
