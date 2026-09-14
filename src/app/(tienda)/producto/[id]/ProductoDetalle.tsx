"use client";

import { useMemo, useState } from "react";
import { Shirt, Minus, Plus, MessageCircle } from "lucide-react";
import { pesos } from "@/lib/format";
import { COLOR_ESTADO, linkWhatsApp, type Producto, type Variante } from "@/lib/tienda-tipos";

export function ProductoDetalle({
  producto,
  whatsapp,
  nombreMarca,
}: {
  producto: Producto;
  whatsapp: string;
  nombreMarca: string;
}) {
  const [talla, setTalla] = useState<string | null>(producto.tallas[0] ?? null);
  const [color, setColor] = useState<string | null>(producto.colores[0] ?? null);
  const [cantidad, setCantidad] = useState(1);
  const [imgActiva, setImgActiva] = useState(0);

  // Variante que corresponde a la talla/color elegidos (para precio y stock).
  const variante: Variante | null = useMemo(() => {
    return (
      producto.variantes.find((v) => (talla ? v.talla === talla : true) && (color ? v.color === color : true)) ?? null
    );
  }, [producto.variantes, talla, color]);

  const precio = variante?.precio || producto.precioMin || producto.precioMax;
  const stock = variante?.stock ?? producto.stockTotal;
  const agotado = stock <= 0;

  // Colores disponibles para la talla elegida (y viceversa) — evita combinaciones sin stock.
  const coloresDeTalla = useMemo(() => {
    const conStock = producto.variantes.filter((v) => v.stock > 0 && (talla ? v.talla === talla : true));
    return [...new Set((conStock.length ? conStock : producto.variantes).map((v) => v.color).filter(Boolean) as string[])];
  }, [producto.variantes, talla]);

  const imagenes = producto.imagenes.length ? producto.imagenes : [];

  const mensaje =
    `Hola 👋, quiero comprar/apartar una prenda de ${nombreMarca}.\n` +
    `Prenda: ${producto.nombre}\n` +
    `Talla: ${talla ?? "—"}\n` +
    `Color: ${color ?? "—"}\n` +
    `Cantidad: ${cantidad}\n` +
    `Precio: ${pesos(precio)}\n` +
    `Quedo atento/a para confirmar disponibilidad 😊`;
  const waLink = linkWhatsApp(whatsapp, mensaje);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Galería */}
      <div className="flex flex-col gap-3">
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl" style={{ background: "color-mix(in srgb, var(--color-texto) 5%, transparent)" }}>
          {imagenes[imgActiva] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imagenes[imgActiva]} alt={producto.nombre} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center opacity-30"><Shirt size={56} /></div>
          )}
        </div>
        {imagenes.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {imagenes.map((src, i) => (
              <button key={src} onClick={() => setImgActiva(i)} className="h-20 w-16 shrink-0 overflow-hidden rounded-xl border-2" style={{ borderColor: i === imgActiva ? "var(--color-secundario)" : "transparent" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info + selección */}
      <div className="flex flex-col gap-5">
        <div>
          {producto.categoria && <span className="text-xs uppercase tracking-wide opacity-50">{producto.categoria}</span>}
          <h1 className="mt-1 text-3xl font-bold" style={{ fontFamily: "var(--font-fraunces, serif)" }}>{producto.nombre}</h1>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-2xl font-semibold">{pesos(precio)}</span>
            <span className="rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white" style={{ background: COLOR_ESTADO[producto.estado] }}>
              {producto.estado}
            </span>
          </div>
        </div>

        {producto.descripcion && <p className="opacity-75">{producto.descripcion}</p>}

        {/* Talla */}
        {producto.tallas.length > 0 && (
          <div>
            <div className="mb-2 text-sm font-semibold">Talla</div>
            <div className="flex flex-wrap gap-2">
              {producto.tallas.map((t) => (
                <button key={t} onClick={() => setTalla(t)} className="min-w-11 rounded-xl border px-3 py-2 text-sm font-medium transition"
                  style={{ borderColor: talla === t ? "var(--color-secundario)" : "rgba(0,0,0,.16)", background: talla === t ? "color-mix(in srgb, var(--color-secundario) 12%, transparent)" : "transparent", color: talla === t ? "var(--color-secundario)" : "inherit" }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Color */}
        {producto.colores.length > 0 && (
          <div>
            <div className="mb-2 text-sm font-semibold">Color</div>
            <div className="flex flex-wrap gap-2">
              {producto.colores.map((c) => {
                const dispo = coloresDeTalla.includes(c);
                return (
                  <button key={c} onClick={() => setColor(c)} className="rounded-xl border px-3 py-2 text-sm font-medium transition disabled:opacity-40"
                    style={{ borderColor: color === c ? "var(--color-secundario)" : "rgba(0,0,0,.16)", background: color === c ? "color-mix(in srgb, var(--color-secundario) 12%, transparent)" : "transparent", color: color === c ? "var(--color-secundario)" : "inherit" }}
                    title={dispo ? undefined : "Sin stock en esta talla"}>
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Cantidad */}
        <div>
          <div className="mb-2 text-sm font-semibold">Cantidad</div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-xl border" style={{ borderColor: "rgba(0,0,0,.16)" }}>
              <button className="px-3 py-2" onClick={() => setCantidad((c) => Math.max(1, c - 1))} aria-label="Menos"><Minus size={16} /></button>
              <span className="w-8 text-center tabular-nums">{cantidad}</span>
              <button className="px-3 py-2" onClick={() => setCantidad((c) => c + 1)} aria-label="Más"><Plus size={16} /></button>
            </div>
            {!agotado && stock <= 5 && <span className="text-sm" style={{ color: "#b8860b" }}>Quedan pocas unidades</span>}
          </div>
        </div>

        {/* WhatsApp */}
        <a
          href={agotado ? undefined : waLink}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={agotado}
          onClick={(e) => { if (agotado) e.preventDefault(); }}
          className="mt-2 inline-flex items-center justify-center gap-2 rounded-full px-6 py-4 text-base font-semibold text-white transition hover:opacity-90"
          style={{ background: agotado ? "#9aa0a6" : "var(--color-secundario)", pointerEvents: agotado ? "none" : undefined }}
        >
          <MessageCircle size={19} /> {producto.estado === "APARTADO" ? "Reservado (apartado)" : agotado ? "Agotado por ahora" : "Comprar / Apartar por WhatsApp"}
        </a>
        <p className="text-xs opacity-60">
          Al enviar el mensaje, confirmamos la disponibilidad real antes de apartar o vender. El inventario solo cambia cuando nosotros lo confirmamos.
        </p>
      </div>
    </div>
  );
}
