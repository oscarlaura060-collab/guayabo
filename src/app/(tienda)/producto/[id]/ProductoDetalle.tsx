"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Shirt, Minus, Plus, Check } from "lucide-react";
import { pesos } from "@/lib/format";
import { type Producto } from "@/lib/tienda-tipos";
import { useCarrito } from "@/lib/carrito";

export function ProductoDetalle({ producto }: { producto: Producto }) {
  const { agregar } = useCarrito();
  const [agregado, setAgregado] = useState(false);
  const [imgActiva, setImgActiva] = useState(0);
  const [cantidad, setCantidad] = useState(1);

  // Stock por talla (sumando colores).
  const stockTalla = useMemo(() => {
    const m = new Map<string, number>();
    for (const v of producto.variantes) {
      if (!v.talla) continue;
      m.set(v.talla, (m.get(v.talla) ?? 0) + v.stock);
    }
    return m;
  }, [producto.variantes]);

  const tallasOrden = useMemo(() => {
    const orden = ["XS", "S", "M", "L", "XL", "XXL"];
    const todas = [...new Set(producto.variantes.map((v) => v.talla).filter(Boolean) as string[])];
    return todas.sort((a, b) => {
      const ia = orden.indexOf(a.toUpperCase());
      const ib = orden.indexOf(b.toUpperCase());
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
  }, [producto.variantes]);

  const primeraDisponible = tallasOrden.find((t) => (stockTalla.get(t) ?? 0) > 0) ?? tallasOrden[0] ?? null;
  const [talla, setTalla] = useState<string | null>(primeraDisponible);

  const coloresDeTalla = useMemo(() => {
    const conStock = producto.variantes.filter((v) => v.stock > 0 && (talla ? v.talla === talla : true));
    return [...new Set((conStock.length ? conStock : producto.variantes).map((v) => v.color).filter(Boolean) as string[])];
  }, [producto.variantes, talla]);
  const [color, setColor] = useState<string | null>(producto.colores[0] ?? null);

  const variante = useMemo(
    () => producto.variantes.find((v) => (talla ? v.talla === talla : true) && (color ? v.color === color : true)) ?? null,
    [producto.variantes, talla, color],
  );
  const precio = variante?.precio || producto.precioMin || producto.precioMax;
  const stockSel = talla ? stockTalla.get(talla) ?? 0 : producto.stockTotal;
  const agotadoTotal = producto.stockTotal <= 0;
  const faltaElegir = (tallasOrden.length > 0 && !talla) || (producto.colores.length > 1 && !color);
  const noSePuede = agotadoTotal || stockSel <= 0 || faltaElegir;

  const imagenes = producto.imagenes;

  function onAgregar() {
    if (noSePuede) return;
    agregar({
      prendaId: variante?.id ?? producto.id,
      nombre: producto.nombre,
      talla,
      color,
      precio,
      cantidad,
      imagen: imagenes[0] ?? null,
    });
    setAgregado(true);
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-5 pb-10 lg:max-w-lg">
      {/* Imagen */}
      <div className="w-full">
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl" style={{ background: "color-mix(in srgb, var(--color-texto) 5%, transparent)" }}>
          {imagenes[imgActiva] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imagenes[imgActiva]} alt={producto.nombre} className="h-full w-full object-cover" decoding="async" fetchPriority="high" />
          ) : (
            <div className="grid h-full place-items-center opacity-30"><Shirt size={56} /></div>
          )}
        </div>
        {imagenes.length > 1 && (
          <div className="mt-2 flex justify-center gap-2 overflow-x-auto">
            {imagenes.map((src, i) => (
              <button key={src} onClick={() => setImgActiva(i)} className="h-16 w-14 shrink-0 overflow-hidden rounded-lg border-2" style={{ borderColor: i === imgActiva ? "var(--color-secundario)" : "transparent" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Título y precio */}
      <div className="text-center">
        <h1 className="text-3xl italic" style={{ fontFamily: "var(--font-fraunces, serif)" }}>{producto.nombre}</h1>
        <div className="mt-1 text-2xl italic" style={{ color: "var(--color-secundario)", fontFamily: "var(--font-fraunces, serif)" }}>{pesos(precio)}</div>
      </div>

      {/* Tallas */}
      {tallasOrden.length > 0 && (
        <div className="w-full">
          <div className="mb-3 text-center text-xl font-bold italic" style={{ color: "var(--color-secundario)", fontFamily: "var(--font-fraunces, serif)" }}>Tallas disponibles:</div>
          <div className="flex flex-wrap justify-center gap-4">
            {tallasOrden.map((t) => {
              const st = stockTalla.get(t) ?? 0;
              const agot = st <= 0;
              const sel = talla === t;
              const quedan = st > 0 && st <= 3;
              return (
                <div key={t} className="relative">
                  {quedan && (
                    <span className="absolute -right-3 -top-3 z-10 rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: "var(--color-secundario)" }}>Queda {st}</span>
                  )}
                  <button
                    onClick={() => !agot && setTalla(t)}
                    disabled={agot}
                    aria-label={`Talla ${t}${agot ? " agotada" : ""}`}
                    className="relative grid h-14 w-14 place-items-center rounded-full text-xl font-extrabold transition"
                    style={{
                      background: sel && !agot ? "var(--color-secundario)" : "var(--color-primario)",
                      color: sel && !agot ? "#fff" : "var(--color-secundario)",
                      opacity: agot ? 0.7 : 1,
                    }}
                  >
                    {t}
                    {agot && <span className="pointer-events-none absolute inset-0 grid place-items-center text-3xl" style={{ color: "var(--color-texto)" }}>✕</span>}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Colores (si hay más de uno) */}
      {producto.colores.length > 1 && (
        <div className="w-full text-center">
          <div className="mb-2 text-sm font-semibold">Color</div>
          <div className="flex flex-wrap justify-center gap-2">
            {producto.colores.map((c) => (
              <button key={c} onClick={() => setColor(c)} className="rounded-xl border px-3 py-2 text-sm font-medium transition"
                style={{ borderColor: color === c ? "var(--color-secundario)" : "rgba(0,0,0,.16)", background: color === c ? "color-mix(in srgb, var(--color-secundario) 12%, transparent)" : "transparent", color: color === c ? "var(--color-secundario)" : "inherit", opacity: coloresDeTalla.includes(c) ? 1 : 0.5 }}>
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabla de medidas */}
      {producto.medidas && (
        <div className="w-full">
          <div className="overflow-x-auto">
            <table className="w-full text-center" style={{ color: "var(--color-secundario)" }}>
              <thead>
                <tr className="border-b-2" style={{ borderColor: "var(--color-primario)" }}>
                  <th className="py-2 text-left text-lg font-bold">Talla</th>
                  {producto.medidas.columnas.map((c) => <th key={c} className="py-2 text-lg font-bold">{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {producto.medidas.filas.map((f) => (
                  <tr key={f.label} className="border-b" style={{ borderColor: "color-mix(in srgb, var(--color-primario) 70%, transparent)" }}>
                    <td className="py-2 text-left text-lg font-bold">{f.label}</td>
                    {producto.medidas!.columnas.map((_, i) => <td key={i} className="py-2 text-lg font-semibold">{f.valores[i] ?? "-"}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-center text-sm font-bold" style={{ color: "var(--color-secundario)" }}>*{producto.medidas.nota}*</p>
        </div>
      )}

      {/* Descripción y composición */}
      {producto.descripcion && <p className="w-full text-[15px] leading-relaxed">{producto.descripcion}</p>}
      {producto.composicion && (
        <p className="w-full text-[15px]"><b>Composición</b>: {producto.composicion}</p>
      )}

      {/* Cantidad */}
      <div className="flex items-center gap-1 rounded-full border" style={{ borderColor: "rgba(0,0,0,.16)" }}>
        <button className="px-3 py-2" onClick={() => setCantidad((c) => Math.max(1, c - 1))} aria-label="Menos"><Minus size={16} /></button>
        <span className="w-8 text-center tabular-nums">{cantidad}</span>
        <button className="px-3 py-2" onClick={() => setCantidad((c) => c + 1)} aria-label="Más"><Plus size={16} /></button>
      </div>

      {/* CTA */}
      <button
        onClick={onAgregar}
        disabled={noSePuede}
        className="w-full max-w-xs rounded-full px-8 py-4 text-2xl italic transition hover:opacity-90 disabled:opacity-60"
        style={{ background: "var(--color-primario)", color: "var(--color-secundario)", fontFamily: "var(--font-fraunces, serif)" }}
      >
        {agotadoTotal ? "Agotada" : faltaElegir ? "Elige tu talla" : stockSel <= 0 ? "Talla agotada" : "¡Quiero la mía!"}
      </button>

      {agregado && !noSePuede && (
        <div className="flex w-full max-w-xs items-center justify-between gap-2 rounded-2xl px-4 py-3 text-sm" style={{ background: "color-mix(in srgb, #3AA76D 12%, transparent)" }}>
          <span className="inline-flex items-center gap-1.5" style={{ color: "#2e8b57" }}><Check size={16} /> Agregado al carrito</span>
          <Link href="/carrito" className="font-semibold" style={{ color: "var(--color-secundario)" }}>Ver carrito →</Link>
        </div>
      )}
    </div>
  );
}
