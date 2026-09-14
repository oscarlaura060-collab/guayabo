"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { pesos } from "@/lib/format";
import type { Producto } from "@/lib/tienda-tipos";
import { ProductCard } from "@/components/tienda/ProductCard";

type Dispo = "todas" | "disponible" | "agotado";

export function CatalogoCliente({
  productos,
  categoriaInicial,
}: {
  productos: Producto[];
  categoriaInicial: string | null;
}) {
  const [categoria, setCategoria] = useState<string | null>(categoriaInicial);
  const [talla, setTalla] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [dispo, setDispo] = useState<Dispo>("todas");
  const [precioMax, setPrecioMax] = useState<number | null>(null);
  const [panel, setPanel] = useState(false);

  const categorias = useMemo(() => [...new Set(productos.map((p) => p.categoria).filter(Boolean) as string[])].sort(), [productos]);
  const tallas = useMemo(() => [...new Set(productos.flatMap((p) => p.tallas))].sort(), [productos]);
  const colores = useMemo(() => [...new Set(productos.flatMap((p) => p.colores))].sort(), [productos]);
  const topePrecio = useMemo(() => Math.max(0, ...productos.map((p) => p.precioMax)), [productos]);

  const lista = useMemo(() => {
    return productos.filter((p) => {
      if (categoria && p.categoria !== categoria) return false;
      if (talla && !p.tallas.includes(talla)) return false;
      if (color && !p.colores.includes(color)) return false;
      if (dispo === "disponible" && p.estado === "AGOTADO") return false;
      if (dispo === "agotado" && p.estado !== "AGOTADO") return false;
      if (precioMax != null && p.precioMin > precioMax) return false;
      return true;
    });
  }, [productos, categoria, talla, color, dispo, precioMax]);

  const hayFiltros = categoria || talla || color || dispo !== "todas" || precioMax != null;
  function limpiar() {
    setCategoria(null); setTalla(null); setColor(null); setDispo("todas"); setPrecioMax(null);
  }

  const chip = "rounded-full border px-3 py-1.5 text-sm font-medium transition";
  const chipStyle = (activo: boolean) => ({
    borderColor: activo ? "var(--color-secundario)" : "rgba(0,0,0,.14)",
    background: activo ? "color-mix(in srgb, var(--color-secundario) 12%, transparent)" : "transparent",
    color: activo ? "var(--color-secundario)" : "inherit",
  });

  const filtros = (
    <div className="flex flex-col gap-5">
      <Grupo titulo="Categoría">
        {categorias.map((c) => (
          <button key={c} className={chip} style={chipStyle(categoria === c)} onClick={() => setCategoria(categoria === c ? null : c)}>{c}</button>
        ))}
      </Grupo>
      <Grupo titulo="Talla">
        {tallas.map((t) => (
          <button key={t} className={chip} style={chipStyle(talla === t)} onClick={() => setTalla(talla === t ? null : t)}>{t}</button>
        ))}
      </Grupo>
      <Grupo titulo="Color">
        {colores.map((c) => (
          <button key={c} className={chip} style={chipStyle(color === c)} onClick={() => setColor(color === c ? null : c)}>{c}</button>
        ))}
      </Grupo>
      <Grupo titulo="Disponibilidad">
        {(["todas", "disponible", "agotado"] as Dispo[]).map((d) => (
          <button key={d} className={chip} style={chipStyle(dispo === d)} onClick={() => setDispo(d)}>
            {d === "todas" ? "Todas" : d === "disponible" ? "Disponibles" : "Agotadas"}
          </button>
        ))}
      </Grupo>
      {topePrecio > 0 && (
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide opacity-60">Precio máximo</div>
          <input type="range" min={0} max={topePrecio} step={1000} value={precioMax ?? topePrecio} onChange={(e) => setPrecioMax(Number(e.target.value))} className="w-full" style={{ accentColor: "var(--color-secundario)" }} />
          <div className="mt-1 text-sm opacity-70">Hasta {pesos(precioMax ?? topePrecio)}</div>
        </div>
      )}
      {hayFiltros && (
        <button onClick={limpiar} className="inline-flex w-fit items-center gap-1 text-sm font-semibold" style={{ color: "var(--color-secundario)" }}>
          <X size={15} /> Limpiar filtros
        </button>
      )}
    </div>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
      {/* Filtros escritorio */}
      <aside className="hidden lg:block">{filtros}</aside>

      <div>
        {/* Barra móvil */}
        <div className="mb-4 flex items-center justify-between lg:hidden">
          <span className="text-sm opacity-70">{lista.length} prenda(s)</span>
          <button onClick={() => setPanel(true)} className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium" style={{ borderColor: "rgba(0,0,0,.14)" }}>
            <SlidersHorizontal size={16} /> Filtros {hayFiltros ? "•" : ""}
          </button>
        </div>

        {lista.length === 0 ? (
          <div className="py-16 text-center opacity-60">No hay prendas que coincidan con los filtros.</div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3">
            {lista.map((p) => <ProductCard key={p.id} producto={p} />)}
          </div>
        )}
      </div>

      {/* Panel de filtros móvil */}
      {panel && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPanel(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85dvh] overflow-y-auto rounded-t-3xl p-5" style={{ background: "var(--color-fondo)" }}>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-lg font-bold">Filtros</span>
              <button onClick={() => setPanel(false)} aria-label="Cerrar"><X size={22} /></button>
            </div>
            {filtros}
            <button onClick={() => setPanel(false)} className="mt-6 w-full rounded-full px-6 py-3 text-sm font-semibold text-white" style={{ background: "var(--color-secundario)" }}>
              Ver {lista.length} prenda(s)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide opacity-60">{titulo}</div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
