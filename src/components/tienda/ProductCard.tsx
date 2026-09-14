import Link from "next/link";
import { Shirt } from "lucide-react";
import { pesos } from "@/lib/format";
import { type Producto } from "@/lib/tienda-tipos";

export function ProductCard({ producto }: { producto: Producto }) {
  const img = producto.imagenes[0] ?? null;
  const agotada = producto.estado === "AGOTADO";
  const precio =
    producto.precioMin > 0 && producto.precioMax !== producto.precioMin
      ? `${pesos(producto.precioMin)} – ${pesos(producto.precioMax)}`
      : pesos(producto.precioMin || producto.precioMax);

  return (
    <Link href={`/producto/${producto.id}`} className="group flex flex-col text-center">
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl" style={{ background: "color-mix(in srgb, var(--color-texto) 5%, transparent)" }}>
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={producto.nombre} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="grid h-full place-items-center opacity-40"><Shirt size={40} /></div>
        )}
        {agotada && (
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full px-6 py-1.5 text-sm font-bold tracking-wide text-white" style={{ background: "#F4453A" }}>
            AGOTADA
          </span>
        )}
        {producto.destacado && !agotada && (
          <span className="absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: "var(--color-primario)", color: "var(--color-texto)" }}>Destacado</span>
        )}
      </div>
      <div className="mt-3 flex flex-col items-center gap-1.5">
        <span className="text-lg italic leading-tight" style={{ fontFamily: "var(--font-fraunces, serif)" }}>{producto.nombre}</span>
        <span className="text-base italic" style={{ color: "var(--color-secundario)", fontFamily: "var(--font-fraunces, serif)" }}>{precio}</span>
        <span className="mt-1 rounded-full px-5 py-1.5 text-sm italic transition group-hover:opacity-90" style={{ background: "var(--color-primario)", color: "var(--color-texto)" }}>
          Ver más detalles
        </span>
      </div>
    </Link>
  );
}
