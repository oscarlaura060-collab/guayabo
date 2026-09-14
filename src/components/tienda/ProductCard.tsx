import Link from "next/link";
import { Shirt } from "lucide-react";
import { pesos } from "@/lib/format";
import { COLOR_ESTADO, type Producto } from "@/lib/tienda-tipos";

export function ProductCard({ producto }: { producto: Producto }) {
  const img = producto.imagenes[0] ?? null;
  const precio =
    producto.precioMin > 0 && producto.precioMax !== producto.precioMin
      ? `${pesos(producto.precioMin)} – ${pesos(producto.precioMax)}`
      : pesos(producto.precioMin || producto.precioMax);

  return (
    <Link href={`/producto/${producto.id}`} className="group flex flex-col">
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl" style={{ background: "color-mix(in srgb, var(--color-texto) 5%, transparent)" }}>
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={producto.nombre} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="grid h-full place-items-center opacity-40"><Shirt size={40} /></div>
        )}
        <span
          className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white"
          style={{ background: COLOR_ESTADO[producto.estado] }}
        >
          {producto.estado}
        </span>
        {producto.destacado && (
          <span className="absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: "var(--color-primario)", color: "var(--color-texto)" }}>
            Destacado
          </span>
        )}
      </div>
      <div className="mt-3 flex flex-col gap-1">
        {producto.categoria && <span className="text-[11px] uppercase tracking-wide opacity-50">{producto.categoria}</span>}
        <span className="font-semibold leading-tight transition group-hover:opacity-70">{producto.nombre}</span>
        <span className="text-sm font-medium" style={{ fontFamily: "var(--font-fraunces, serif)" }}>{precio}</span>
        {producto.tallas.length > 0 && (
          <span className="text-xs opacity-60">Tallas: {producto.tallas.join(" · ")}</span>
        )}
      </div>
    </Link>
  );
}
